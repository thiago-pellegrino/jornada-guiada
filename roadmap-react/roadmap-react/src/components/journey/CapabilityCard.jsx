import { checkEligibility, latestRevision } from '../../domain/journey/journeyEngine.js';
import { useJourney } from '../../journey/JourneyContext.jsx';
import Icon from '../ui/Icon.jsx';
import AgentIcon from './AgentIcon.jsx';
import { DeliverableCounts, fmtDateTime } from './JourneyBits.jsx';

/** Cartão de uma capacidade: situação, revisão atual, Gerar/Regenerar e Abrir. */
export default function CapabilityCard({ capabilityId, scopeKey = 'projeto', compact = false, extra = null, label = null }) {
  const { catalog, project, pending, can, runCapability, openArtifact } = useJourney();
  const cap = catalog.byId.get(capabilityId);
  if (!cap) {
    return (
      <article className="jg-cap is-missing">
        <p className="jg-cap__title">{capabilityId}</p>
        <p className="jg-cap__reason">Capacidade não encontrada em especificações/.</p>
      </article>
    );
  }
  const rev = latestRevision(project, capabilityId, scopeKey);
  const elig = checkEligibility(project, catalog, capabilityId, scopeKey);
  const rodando = pending[`${capabilityId}::${scopeKey}`];
  const podeRodar = can('run') && elig.ok && !rodando;
  const motivo = !can('run') ? 'Seu papel não executa capacidades.' : elig.ok ? null : elig.reason;
  const data = rev?.envelope?.data;

  return (
    <article className={`jg-cap ${rev ? 'is-done' : ''} ${rodando ? 'is-running' : ''} ${compact ? 'jg-cap--compact' : ''}`}>
      <header className="jg-cap__head">
        <span className="jg-cap__step tabular">{cap.step}</span>
        <h3 className="jg-cap__title">{label ?? cap.title}</h3>
      </header>
      {!compact && cap.objective ? <p className="jg-cap__objective">{cap.objective}</p> : null}
      <div className="jg-cap__status">
        {rodando ? (
          <span className="jg-dot jg-dot--running">Gerando…</span>
        ) : rev ? (
          <span className="jg-dot jg-dot--ok">
            r{rev.revision} · {fmtDateTime(rev.generatedAt)} · {rev.reviewState}
          </span>
        ) : (
          <span className="jg-dot">Não gerado</span>
        )}
        {data?.deliverables ? <DeliverableCounts deliverables={data.deliverables} /> : null}
      </div>
      {extra}
      {motivo && !rev ? <p className="jg-cap__reason">{motivo}</p> : null}
      <div className="jg-cap__actions">
        <button type="button" className={`btn btn--sm ${rev ? '' : 'btn--primary'}`} disabled={!podeRodar} title={motivo ?? undefined} onClick={() => runCapability(capabilityId, scopeKey)}>
          <AgentIcon size={15} /> {rev ? 'Regenerar' : 'Gerar'}
        </button>
        {rev ? (
          <button type="button" className="btn btn--sm btn--quiet" onClick={() => openArtifact(capabilityId, scopeKey)}>
            <Icon name="fileText" size={14} /> Abrir
          </button>
        ) : null}
      </div>
    </article>
  );
}
