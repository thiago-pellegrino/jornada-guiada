import { useMemo, useState } from 'react';
import { useJourney } from '../../journey/JourneyContext.jsx';
import Icon from '../ui/Icon.jsx';
import { RunStatus, fmtDateTime } from './JourneyBits.jsx';

/** Modo Turbo da fase: iniciar (com falha simulada opcional), acompanhar nós e cancelar. */
export default function TurboPanel({ phase, description, disabledReason = null }) {
  const { catalog, project, can, runTurbo, cancelTurbo, openArtifact } = useJourney();
  const [failAt, setFailAt] = useState('');
  const turbo = catalog.byPhase[phase]?.find((c) => c.isTurbo);
  const run = project?.runs.find((r) => r.kind === 'turbo' && r.phase === phase) ?? null;
  const rodando = run?.status === 'running';
  const opcoesFalha = useMemo(() => catalog.byPhase[phase]?.filter((c) => !c.isTurbo) ?? [], [catalog, phase]);
  const bloqueio = !project ? 'Crie um projeto no Contexto.' : !can('run') ? 'Seu papel não executa o Modo Turbo.' : disabledReason;

  const nos = run?.nodes ?? [];
  const feitos = nos.filter((n) => ['succeeded', 'failed', 'skipped', 'cancelled'].includes(n.status)).length;

  return (
    <section className="surface jg-turbo" aria-labelledby={`turbo-${phase}`}>
      <header className="surface-head">
        <h2 id={`turbo-${phase}`} className="surface-title">
          <Icon name="wand" size={15} /> Modo Turbo · {turbo?.step ?? ''}
        </h2>
        {run ? <RunStatus status={run.status} /> : <span className="surface-meta">Nenhuma execução</span>}
      </header>
      <p className="jg-muted">{description}</p>
      <div className="jg-turbo__controls">
        <button type="button" className="btn btn--primary btn--sm" disabled={Boolean(bloqueio) || rodando} title={bloqueio ?? undefined} onClick={() => runTurbo(phase, { failAt: failAt || null })}>
          <Icon name="wand" size={14} /> {run ? 'Executar de novo' : 'Executar de ponta a ponta'}
        </button>
        {rodando ? (
          <button type="button" className="btn btn--sm" onClick={() => cancelTurbo(run.runId)}>
            <Icon name="stop" size={14} /> Cancelar
          </button>
        ) : null}
        <label className="jg-inline-field" title="Valida a tela de falha: o nó escolhido falha e só os dependentes ficam pulados">
          <span>Simular falha em</span>
          <select className="input input--sm" value={failAt} onChange={(e) => setFailAt(e.target.value)} disabled={rodando}>
            <option value="">nenhum nó</option>
            {opcoesFalha.map((c) => (
              <option key={c.id} value={c.id}>
                {c.step} · {c.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      {bloqueio && !run ? <p className="jg-cap__reason">{bloqueio}</p> : null}
      {run ? (
        <>
          <p className="jg-muted tabular">
            {feitos} de {nos.length} nós · iniciado {fmtDateTime(run.startedAt)}
            {run.finishedAt ? ` · terminado ${fmtDateTime(run.finishedAt)}` : ''}
          </p>
          <ol className="jg-nodes">
            {nos.map((n) => {
              const cap = catalog.byId.get(n.capabilityId);
              return (
                <li key={n.nodeKey} className={`jg-node jg-node--${n.status}`}>
                  <span className="jg-node__key tabular">{n.nodeKey}</span>
                  <span className="jg-node__title">{cap?.title ?? n.capabilityId}</span>
                  <RunStatus status={n.status} />
                  {n.error ? <span className="jg-node__note">{n.error.code}: {n.error.message}</span> : null}
                  {n.skipReason ? <span className="jg-node__note">{n.skipReason}</span> : null}
                  {n.status === 'succeeded' ? (
                    <button type="button" className="btn btn--sm btn--link" onClick={() => openArtifact(n.capabilityId, n.scopeKey, n.outputRevision)}>
                      r{n.outputRevision}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </>
      ) : null}
    </section>
  );
}
