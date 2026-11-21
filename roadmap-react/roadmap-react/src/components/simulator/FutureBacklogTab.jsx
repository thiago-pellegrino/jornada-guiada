import {
  CAP,
  backlogCounts,
  backlogEpics,
  backlogFeatures,
  backlogStories,
  backlogTasks,
  checkEligibility,
  fichaReadiness,
  latestRevision,
  stageIndex,
} from '../../domain/journey/journeyEngine.js';
import { useJourney } from '../../journey/JourneyContext.jsx';
import Icon from '../ui/Icon.jsx';
import AgentIcon from '../journey/AgentIcon.jsx';
import ProjectBar from '../journey/ProjectBar.jsx';
import CapabilityCard from '../journey/CapabilityCard.jsx';
import TurboPanel from '../journey/TurboPanel.jsx';
import { EmptyState, ReadinessBadge, SimulatedNote, goToTab } from '../journey/JourneyBits.jsx';
import BacklogFuturoPainel from '../backlog/BacklogFuturoPainel.jsx';

/** Texto exibível: só strings e números; qualquer outro valor vira vazio (evita renderizar objetos). */
const txt = (v) => (typeof v === 'string' || typeof v === 'number' ? v : '');

/** Frase da história: aceita texto pronto ou o objeto { actor, need, benefit } da especificação. */
function textoDaHistoria(statement) {
  if (typeof statement === 'string') return statement;
  if (!statement || typeof statement !== 'object') return '';
  const { actor, need, benefit } = statement;
  const persona = typeof actor === 'string' && actor ? actor[0].toLowerCase() + actor.slice(1) : actor;
  return [persona && `Como ${persona}`, need && `quero ${need}`, benefit && `para ${benefit}`].filter(Boolean).join(', ') + '.';
}

/** Botões de um nó da árvore: gerar/regenerar os filhos e abrir o artefato deles. */
function NodeActions({ capabilityId, scopeKey, label }) {
  const { catalog, project, can, pending, runCapability, openArtifact } = useJourney();
  const rev = latestRevision(project, capabilityId, scopeKey);
  const elig = checkEligibility(project, catalog, capabilityId, scopeKey);
  const rodando = pending[`${capabilityId}::${scopeKey}`];
  const motivo = !can('run') ? 'Seu papel não executa capacidades.' : elig.ok ? undefined : elig.reason;
  return (
    <span className="jg-tree__actions" onClick={(e) => e.preventDefault()}>
      <button type="button" className="btn btn--sm" disabled={Boolean(motivo) || rodando} title={motivo} onClick={() => runCapability(capabilityId, scopeKey)}>
        <AgentIcon size={15} /> {rodando ? 'Gerando…' : rev ? `Regenerar ${label}` : `Gerar ${label}`}
      </button>
      {rev ? (
        <button type="button" className="btn btn--sm btn--link" onClick={() => openArtifact(capabilityId, scopeKey)}>
          R{rev.revision}
        </button>
      ) : null}
    </span>
  );
}

function Tarefas({ project, story }) {
  const tasks = backlogTasks(project, story.id);
  if (!tasks.length) return null;
  return (
    <ol className="jg-tree__tasks">
      {tasks.map((t) => (
        <li key={t.id}>
          <span className="jg-mono">{t.id}</span> {txt(t.title)}
          <span className="jg-muted">
            {' '}
            · {txt(t.taskKind) || txt(t.category)} {txt(t.layer) ? `· ${t.layer}` : ''}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Historias({ project, feature }) {
  const stories = backlogStories(project, feature.id);
  if (!stories.length) return null;
  return (
    <ul className="jg-tree__level">
      {stories.map((s) => (
        <li key={s.id}>
          <details>
            <summary>
              <span className="jg-tree__kind">História</span> <span className="jg-mono">{s.id}</span> {txt(s.title)}
              <NodeActions capabilityId={CAP.oQueFazer} scopeKey={s.id} label="o que fazer" />
            </summary>
            {s.statement ? <p className="jg-tree__text">{textoDaHistoria(s.statement)}</p> : null}
            <Tarefas project={project} story={s} />
          </details>
        </li>
      ))}
    </ul>
  );
}

function Features({ project, epic }) {
  const features = backlogFeatures(project, epic.id);
  if (!features.length) return null;
  return (
    <ul className="jg-tree__level">
      {features.map((f) => (
        <li key={f.id}>
          <details open>
            <summary>
              <span className="jg-tree__kind">Feature</span> <span className="jg-mono">{f.id}</span> {txt(f.title)}
              <NodeActions capabilityId={CAP.historias} scopeKey={f.id} label="histórias" />
            </summary>
            {txt(f.summary) ? <p className="jg-tree__text">{f.summary}</p> : null}
            <Historias project={project} feature={f} />
          </details>
        </li>
      ))}
    </ul>
  );
}

/**
 * Aba "Backlog do Futuro": telas no formato da planilha Roadmap do Futuro (Resumo, Roadmap, Épicos,
 * Features, Histórias e Dicionário) sobre o que a jornada gerou, e a Geração (Épicos → Features →
 * Histórias → O que fazer, a partir da ficha do projeto).
 */
export default function FutureBacklogTab() {
  const { project } = useJourney();

  if (!project) {
    return (
      <div className="jg-page">
        <ProjectBar current="backlog-futuro" />
        <EmptyState title="Crie o projeto no Contexto" action={<button type="button" className="btn btn--sm btn--primary" onClick={() => goToTab('contexto')}>Ir para o Contexto</button>}>
          O Backlog do Futuro é gerado a partir da ficha de um projeto definido pelo DarkLabs.
        </EmptyState>
      </div>
    );
  }

  const prontidao = fichaReadiness(project);
  const liberado = stageIndex(project.stage) >= stageIndex('projeto_definido') && prontidao && prontidao !== 'insuficiente';
  const epics = backlogEpics(project);
  const c = backlogCounts(project);

  return (
    <div className="jg-page">
      <ProjectBar current="backlog-futuro" />

      {!liberado ? (
        <section className="surface jg-gate jg-gate--blocked" role="status">
          <header className="surface-head">
            <h2 className="surface-title">
              <Icon name="lock" size={15} /> Projeto ainda não definido
            </h2>
            <ReadinessBadge status={prontidao} />
          </header>
          <p>
            O Backlog do Futuro só começa quando a ficha do projeto {project.code} está pronta (para o backlog ou com lacunas). No
            backend, gerar épicos sem ela responde <span className="jg-mono">422 projeto_nao_definido</span>.
          </p>
          <button type="button" className="btn btn--sm btn--primary" onClick={() => goToTab('darklab')}>
            Concluir no DarkLabs <Icon name="chevronRight" size={14} />
          </button>
        </section>
      ) : null}

      <BacklogFuturoPainel
        project={project}
        geracao={
          <>
            <div className="jg-grid jg-grid--2">
              <CapabilityCard capabilityId={CAP.epicos} />
              <section className="surface" aria-labelledby="bk-kpis">
                <header className="surface-head">
                  <h2 id="bk-kpis" className="surface-title">
                    Tamanho do backlog
                  </h2>
                </header>
                <dl className="kpi-split kpi-split--4">
                  <div>
                    <dt>Épicos</dt>
                    <dd className="tabular">{c.epics}</dd>
                  </div>
                  <div>
                    <dt>Features</dt>
                    <dd className="tabular">{c.features}</dd>
                  </div>
                  <div>
                    <dt>Histórias</dt>
                    <dd className="tabular">{c.stories}</dd>
                  </div>
                  <div>
                    <dt>O que fazer</dt>
                    <dd className="tabular">{c.tasks}</dd>
                  </div>
                </dl>
                <p className="jg-muted">Cada épico nasce de uma semente dentro do escopo da ficha. Regenerar um nível cria nova revisão sem apagar as anteriores.</p>
              </section>
            </div>

            <section className="surface" aria-labelledby="bk-tree">
              <header className="surface-head">
                <h2 id="bk-tree" className="surface-title">
                  <Icon name="layers" size={15} /> Árvore do backlog
                </h2>
              </header>
              {epics.length ? (
                <ul className="jg-tree">
                  {epics.map((e) => (
                    <li key={e.id}>
                      <details open>
                        <summary>
                          <span className="jg-tree__kind jg-tree__kind--epic">Épico</span> <span className="jg-mono">{e.id}</span> {txt(e.title)}
                          <NodeActions capabilityId={CAP.features} scopeKey={e.id} label="features" />
                        </summary>
                        {txt(e.summary) ? <p className="jg-tree__text">{e.summary}</p> : null}
                        <Features project={project} epic={e} />
                      </details>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="jg-muted">Nenhum épico ainda. Gere os épicos ou use o Modo Turbo para expandir a árvore inteira.</p>
              )}
            </section>

            <TurboPanel
              phase="backlog-do-futuro"
              description="Gera os épicos e expande a árvore conforme os resultados: features de cada épico, histórias de cada feature e o que fazer de cada história."
              disabledReason={liberado ? null : 'O projeto precisa estar definido.'}
            />
          </>
        }
      />
      <SimulatedNote />
    </div>
  );
}
