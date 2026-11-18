import { useEffect, useMemo, useRef, useState } from 'react';
import { REVIEW_STATES, listRevisions } from '../../domain/journey/journeyEngine.js';
import { useJourney } from '../../journey/JourneyContext.jsx';
import Icon from '../ui/Icon.jsx';
import { fmtDateTime } from './JourneyBits.jsx';

function contarNaturezas(valor, acc = { documentado: 0, inferido: 0, hipótese: 0, proposta: 0 }) {
  if (Array.isArray(valor)) valor.forEach((v) => contarNaturezas(v, acc));
  else if (valor && typeof valor === 'object') {
    if (typeof valor.natureza === 'string' && valor.natureza in acc) acc[valor.natureza] += 1;
    Object.values(valor).forEach((v) => contarNaturezas(v, acc));
  }
  return acc;
}

const rotulo = (k) => k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());

/** Exibe um valor de `data` como lista legível, com seções recolhíveis para coleções. */
function DataView({ value, depth = 0 }) {
  if (value === null || value === undefined) return <span className="jg-muted">—</span>;
  if (typeof value !== 'object') {
    if (typeof value === 'string' && value.includes('\n')) return <pre className="jg-pre">{value}</pre>;
    return <span>{String(value)}</span>;
  }
  if (Array.isArray(value)) {
    if (!value.length) return <span className="jg-muted">vazio</span>;
    if (value.every((v) => typeof v !== 'object')) return <span>{value.join(', ')}</span>;
    return (
      <ol className="jg-dv-list">
        {value.map((item, i) => (
          <li key={item?.id ?? i}>
            {depth < 4 ? (
              <details open={depth === 0 && i < 3}>
                <summary>
                  <span className="jg-mono">{typeof item?.id === 'string' ? item.id : `#${i + 1}`}</span> {[item?.title, item?.name, item?.text, item?.statement].find((v) => typeof v === 'string') ?? ''}
                </summary>
                <DataView value={item} depth={depth + 1} />
              </details>
            ) : (
              <code className="jg-mono">{JSON.stringify(item)}</code>
            )}
          </li>
        ))}
      </ol>
    );
  }
  return (
    <dl className="jg-dv">
      {Object.entries(value).map(([k, v]) => (
        <div key={k} className="jg-dv__row">
          <dt>{rotulo(k)}</dt>
          <dd>
            <DataView value={v} depth={depth + 1} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Painel do artefato: revisões, resumo, lacunas, conflitos, dados, JSON e revisão humana. */
export default function ArtifactViewer() {
  const { catalog, project, viewer, closeArtifact, can, setReview } = useJourney();
  const [aba, setAba] = useState('resumo');
  const [revSel, setRevSel] = useState(null);
  const closeRef = useRef(null);

  useEffect(() => {
    setRevSel(viewer?.revision ?? null);
    setAba('resumo');
    if (viewer) closeRef.current?.focus();
  }, [viewer]);

  useEffect(() => {
    if (!viewer) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeArtifact();
      }
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [viewer, closeArtifact]);

  const revisoes = viewer ? listRevisions(project, viewer.capabilityId, viewer.scopeKey) : [];
  const rev = revisoes.find((r) => r.revision === revSel) ?? revisoes[revisoes.length - 1];
  const env = rev?.envelope;
  const naturezas = useMemo(() => contarNaturezas(env?.data), [env]);
  if (!viewer || !rev) return null;
  const cap = catalog.byId.get(viewer.capabilityId);

  return (
    <div className="jg-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && closeArtifact()}>
      <section className="jg-viewer" role="dialog" aria-modal="true" aria-labelledby="jg-viewer-title">
        <header className="jg-viewer__head">
          <div>
            <p className="jg-eyebrow">
              {cap?.phase === 'contexto' ? 'Contexto' : cap?.phase === 'darklab' ? 'DarkLab' : 'Backlog do Futuro'} · {cap?.step} ·{' '}
              <span className="jg-mono">{viewer.scopeKey}</span>
            </p>
            <h2 id="jg-viewer-title">{cap?.title ?? viewer.capabilityId}</h2>
          </div>
          <button ref={closeRef} type="button" className="icon-btn" onClick={closeArtifact} aria-label="Fechar artefato">
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="jg-viewer__meta">
          <label className="jg-inline-field">
            <span>Revisão</span>
            <select className="input input--sm" value={rev.revision} onChange={(e) => setRevSel(Number(e.target.value))}>
              {revisoes.map((r) => (
                <option key={r.revision} value={r.revision}>
                  r{r.revision} · {fmtDateTime(r.generatedAt)}
                </option>
              ))}
            </select>
          </label>
          <div className="segmented segmented--sm" role="group" aria-label="Estado de revisão humana">
            {REVIEW_STATES.map((s) => {
              const permitido = s === 'aceito' ? can('accept') : can('review');
              return (
                <button
                  key={s}
                  type="button"
                  className={`segmented__btn ${rev.reviewState === s ? 'is-selected' : ''}`}
                  aria-pressed={rev.reviewState === s}
                  disabled={!permitido}
                  title={!permitido ? (s === 'aceito' ? 'Só Aprovador ou Administrador' : 'Leitor não revisa') : undefined}
                  onClick={() => setReview(viewer.capabilityId, viewer.scopeKey, rev.revision, s)}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <span className="jg-muted">A revisão humana nunca bloqueia execução nem consumo.</span>
        </div>

        <p className="jg-viewer__summary">{env.summary}</p>
        <dl className="kpi-split kpi-split--4 jg-viewer__kpis">
          <div>
            <dt>Evidências</dt>
            <dd className="tabular">{env.evidenceRefs?.length ?? 0}</dd>
          </div>
          <div>
            <dt>Lacunas</dt>
            <dd className="tabular">{env.gaps?.length ?? 0}</dd>
          </div>
          <div>
            <dt>Conflitos</dt>
            <dd className="tabular">{env.conflicts?.length ?? 0}</dd>
          </div>
          <div>
            <dt>Natureza (doc · inf · hip · prop)</dt>
            <dd className="tabular">
              {naturezas.documentado} · {naturezas.inferido} · {naturezas['hipótese']} · {naturezas.proposta}
            </dd>
          </div>
        </dl>

        <div className="segmented" role="tablist" aria-label="Seções do artefato">
          {[
            ['resumo', 'Lacunas e conflitos'],
            ['dados', 'Dados'],
            ['evidencias', 'Evidências e insumos'],
            ['json', 'JSON'],
          ].map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={aba === id} className={`segmented__btn ${aba === id ? 'is-selected' : ''}`} onClick={() => setAba(id)}>
              {label}
            </button>
          ))}
        </div>

        <div className="jg-viewer__body">
          {aba === 'resumo' ? (
            <>
              <h3>Lacunas</h3>
              {env.gaps?.length ? (
                <ul className="jg-list">
                  {env.gaps.map((g) => (
                    <li key={g.id}>
                      <span className="jg-mono">{g.id}</span> · impacto {g.impact} · {g.question}
                      {g.suggestedSource ? <span className="jg-muted"> (fonte sugerida: {g.suggestedSource})</span> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="jg-muted">Nenhuma lacuna.</p>
              )}
              <h3>Conflitos entre fontes</h3>
              {env.conflicts?.length ? (
                <ul className="jg-list">
                  {env.conflicts.map((c) => (
                    <li key={c.id}>
                      <span className="jg-mono">{c.id}</span> · {c.description} <span className="jg-muted">({c.evidenceIds?.join(', ')})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="jg-muted">Nenhum conflito.</p>
              )}
              {env.coverage ? (
                <>
                  <h3>Cobertura</h3>
                  <p>
                    Examinados: {env.coverage.examinedInputs?.join(', ') || '—'}
                    {env.coverage.limits?.length ? ` · Limites: ${env.coverage.limits.join('; ')}` : ''}
                  </p>
                </>
              ) : null}
            </>
          ) : null}
          {aba === 'dados' ? (
            <>
              {typeof env.data?.mermaid === 'string' ? (
                <p className="jg-simulated">O diagrama Mermaid abaixo será renderizado como imagem na versão com backend; aqui aparece como texto.</p>
              ) : null}
              <DataView value={env.data} />
            </>
          ) : null}
          {aba === 'evidencias' ? (
            <>
              <h3>Evidências citadas</h3>
              {env.evidenceRefs?.length ? (
                <ul className="jg-list">
                  {env.evidenceRefs.map((e) => (
                    <li key={e.id}>
                      <span className="jg-mono">{e.id}</span> · {e.sourceId} r{e.sourceRevision} · {e.locator}
                      {e.excerpt ? <q> {e.excerpt}</q> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="jg-muted">Nenhuma evidência.</p>
              )}
              <h3>Insumos do snapshot</h3>
              <ul className="jg-list">
                {(env.inputsSnapshot?.inputs ?? []).map((i) => (
                  <li key={i.uri} className="jg-mono">
                    {i.uri}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {aba === 'json' ? <pre className="jg-pre">{JSON.stringify(env, null, 2)}</pre> : null}
        </div>
      </section>
    </div>
  );
}
