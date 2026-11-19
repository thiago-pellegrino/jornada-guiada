import { useState } from 'react';
import { CAP, ROLES, backlogCounts, fichaReadiness, latestRevision, stageLabel } from '../../domain/journey/journeyEngine.js';
import { useJourney } from '../../journey/JourneyContext.jsx';
import Icon from '../ui/Icon.jsx';
import ProjectBar from '../journey/ProjectBar.jsx';
import { NewProjectDialog } from '../notebooks/NotebookDialogs.jsx';
import RunList from '../journey/RunList.jsx';
import { EmptyState, ReadinessBadge, SimulatedNote, fmtBytes, fmtDateTime, goToTab } from '../journey/JourneyBits.jsx';

function Natureza({ item }) {
  if (!item?.natureza) return null;
  return <span className={`jg-nat jg-nat--${item.natureza}`}>{item.natureza}</span>;
}

/** Ficha do projeto (02-darklab-008) apresentada como página de leitura. */
function FichaDoProjeto({ project }) {
  const { openArtifact } = useJourney();
  const rev = latestRevision(project, CAP.ficha);
  if (!rev) {
    return (
      <EmptyState title="Ficha ainda não gerada" action={<button type="button" className="btn btn--sm btn--primary" onClick={() => goToTab('darklab')}>Ir para o DarkLabs</button>}>
        A ficha do projeto é consolidada pelo DarkLabs (02-darklab-008) a partir dos motores executados.
      </EmptyState>
    );
  }
  const f = rev.envelope.data;
  return (
    <div className="jg-ficha">
      <div className="jg-ficha__head">
        <div>
          <p className="jg-eyebrow">Nome proposto pelo DarkLabs</p>
          <h3>{f.project?.proposedName ?? project.name}</h3>
          <p>{f.project?.summary}</p>
        </div>
        <div className="jg-ficha__status">
          <ReadinessBadge status={f.readiness?.status} />
          <span className="jg-muted">
            R{rev.revision} · {rev.reviewState}
          </span>
          <button type="button" className="btn btn--sm btn--quiet" onClick={() => openArtifact(CAP.ficha)}>
            <Icon name="fileText" size={14} /> Abrir artefato
          </button>
        </div>
      </div>
      {f.readiness?.note ? <p className="side-note">{f.readiness.note}</p> : null}

      <div className="jg-grid jg-grid--2">
        <section className="jg-ficha__block">
          <h4>Enquadramento</h4>
          <p>
            {f.framing?.text ?? <span className="jg-muted">Sem enquadramento.</span>} <Natureza item={f.framing} />
          </p>
        </section>
        <section className="jg-ficha__block">
          <h4>Objetivos</h4>
          {f.objectives?.length ? (
            <ul className="jg-list">
              {f.objectives.map((o) => (
                <li key={o.objectiveId}>
                  <span className="jg-mono">{o.objectiveId}</span> {o.text} <Natureza item={o} />
                  {o.kpiIds?.length ? <span className="jg-muted"> · KPI {o.kpiIds.join(', ')}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="jg-muted">Nenhum objetivo.</p>
          )}
        </section>
        <section className="jg-ficha__block">
          <h4>Escopo</h4>
          <ul className="jg-list">
            {(f.scope?.inScope ?? []).map((s, i) => (
              <li key={`in-${i}`}>
                <Badge2 ok>dentro</Badge2> {s.text} <Natureza item={s} />
              </li>
            ))}
            {(f.scope?.outOfScope ?? []).map((s, i) => (
              <li key={`out-${i}`}>
                <Badge2>fora</Badge2> {s.text}
              </li>
            ))}
          </ul>
        </section>
        <section className="jg-ficha__block">
          <h4>Ondas do roadmap</h4>
          {f.roadmapWaves?.length ? (
            <ol className="jg-list">
              {f.roadmapWaves.map((w) => (
                <li key={w.wave}>
                  Onda {w.wave} · {w.horizon} · {w.title}
                </li>
              ))}
            </ol>
          ) : (
            <p className="jg-muted">Sem ondas (o M7 não foi executado).</p>
          )}
        </section>
      </div>

      <section className="jg-ficha__block">
        <h4>Sementes do Backlog do Futuro</h4>
        {f.backlogSeeds?.length ? (
          <div className="table-scroll">
            <table className="jg-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Item</th>
                  <th scope="col">Horizonte</th>
                  <th scope="col">Valor · esforço · risco</th>
                  <th scope="col">Escopo</th>
                </tr>
              </thead>
              <tbody>
                {f.backlogSeeds.map((s) => (
                  <tr key={s.futureBacklogId}>
                    <td className="tabular">{s.rank}</td>
                    <td>
                      <span className="jg-mono">{s.futureBacklogId}</span> {s.title}
                    </td>
                    <td>{s.horizon}</td>
                    <td>
                      {s.priority?.valor} · {s.priority?.esforco} · {s.priority?.risco}
                    </td>
                    <td>{s.inScope ? 'dentro' : 'fora'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="jg-muted">Nenhuma semente: o Backlog do Futuro fica bloqueado até a ficha ter ao menos uma.</p>
        )}
      </section>
    </div>
  );
}

function Badge2({ ok = false, children }) {
  return <span className={`jg-chip ${ok ? 'jg-chip--ok' : ''}`}>{children}</span>;
}

function Membros({ project }) {
  const { can, addMember } = useJourney();
  const [nome, setNome] = useState('');
  const [papel, setPapel] = useState('Editor');
  const pode = can('manageMembers');
  return (
    <>
      <ul className="jg-list">
        {project.members.map((m) => (
          <li key={m.id ?? m.name}>
            <Icon name="users" size={13} /> {m.name} · <strong>{m.role}</strong>
          </li>
        ))}
      </ul>
      <form
        className="jg-inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!nome.trim()) return;
          addMember(nome.trim(), papel);
          setNome('');
        }}
      >
        <input className="input input--sm" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do membro" disabled={!pode} aria-label="Nome do membro" />
        <select className="input input--sm" value={papel} onChange={(e) => setPapel(e.target.value)} disabled={!pode} aria-label="Papel">
          {ROLES.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <button type="submit" className="btn btn--sm" disabled={!pode || !nome.trim()}>
          <Icon name="plus" size={14} /> Adicionar
        </button>
      </form>
      {!pode ? <p className="jg-cap__reason">Só o Administrador gerencia membros.</p> : null}
    </>
  );
}

/** Aba "Projetos": portfólio, ficha do projeto selecionado, etapas, fontes, membros e execuções. */
export default function ProjectsTab() {
  const { state, project, selectProject, can, renameProject, resetJourney, createProject } = useJourney();
  const [criando, setCriando] = useState(false);
  const [editandoNome, setEditandoNome] = useState(false);
  const [nome, setNome] = useState('');
  const [confirmarReset, setConfirmarReset] = useState(false);

  return (
    <div className="jg-page">
      <ProjectBar current="projetos" />

      <section className="surface" aria-labelledby="prj-portfolio">
        <header className="surface-head">
          <h2 id="prj-portfolio" className="surface-title">
            <Icon name="folder" size={15} /> Portfólio de projetos
          </h2>
          <div className="surface-head__actions">
            <button type="button" className="btn btn--sm" disabled={!can('createProject')} onClick={() => setCriando(true)}>
              <Icon name="folderPlus" size={14} /> Novo projeto
            </button>
          </div>
        </header>
        {criando ? (
          <NewProjectDialog
            nextCode={`PRJ-${String(state.projects.length + 1).padStart(3, '0')}`}
            onClose={() => setCriando(false)}
            onCreate={(nome, descricao) => createProject(nome, descricao) && setCriando(false)}
          />
        ) : null}
        {state.projects.length ? (
          <div className="table-scroll">
            <table className="jg-table jg-table--select">
              <thead>
                <tr>
                  <th scope="col">Código</th>
                  <th scope="col">Projeto</th>
                  <th scope="col">Etapa</th>
                  <th scope="col">Ficha</th>
                  <th scope="col">Fontes</th>
                  <th scope="col">Backlog (É · F · H · T)</th>
                  <th scope="col">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {state.projects.map((p) => {
                  const c = backlogCounts(p);
                  const sel = p.projectId === project?.projectId;
                  return (
                    <tr key={p.projectId} className={sel ? 'is-selected' : ''} aria-selected={sel}>
                      <td>
                        <button type="button" className="btn btn--sm btn--link jg-mono" onClick={() => selectProject(p.projectId)}>
                          {p.code}
                        </button>
                      </td>
                      <td>{p.name}</td>
                      <td>{stageLabel(p.stage)}</td>
                      <td>
                        <ReadinessBadge status={fichaReadiness(p)} />
                      </td>
                      <td className="tabular">{p.sources.length}</td>
                      <td className="tabular">
                        {c.epics} · {c.features} · {c.stories} · {c.tasks}
                      </td>
                      <td className="tabular">{fmtDateTime(p.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Nenhum projeto ainda" action={<button type="button" className="btn btn--sm btn--primary" onClick={() => goToTab('contexto')}>Criar no Contexto</button>}>
            Projetos nascem no Contexto, antes do primeiro upload.
          </EmptyState>
        )}
      </section>

      {project ? (
        <>
          <section className="surface" aria-labelledby="prj-ficha">
            <header className="surface-head">
              <h2 id="prj-ficha" className="surface-title">
                <Icon name="report" size={15} /> Ficha do projeto {project.code}
              </h2>
              <div className="surface-head__actions">
                {editandoNome ? (
                  <form
                    className="jg-inline-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (nome.trim()) renameProject(nome.trim());
                      setEditandoNome(false);
                    }}
                  >
                    <input className="input input--sm" value={nome} onChange={(e) => setNome(e.target.value)} aria-label="Novo nome do projeto" autoFocus />
                    <button type="submit" className="btn btn--sm">
                      Salvar
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    className="btn btn--sm btn--quiet"
                    disabled={!can('rename')}
                    onClick={() => {
                      setNome(project.name);
                      setEditandoNome(true);
                    }}
                  >
                    <Icon name="edit" size={14} /> Renomear
                  </button>
                )}
              </div>
            </header>
            <FichaDoProjeto project={project} />
          </section>

          <div className="jg-grid jg-grid--3">
            <section className="surface" aria-labelledby="prj-etapas">
              <header className="surface-head">
                <h2 id="prj-etapas" className="surface-title">
                  Histórico de etapas
                </h2>
              </header>
              <ol className="jg-timeline">
                {project.stageHistory.map((h, i) => (
                  <li key={`${h.stage}-${i}`}>
                    <strong>{stageLabel(h.stage)}</strong>
                    <span className="jg-muted">
                      {fmtDateTime(h.at)} · {h.cause}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
            <section className="surface" aria-labelledby="prj-fontes">
              <header className="surface-head">
                <h2 id="prj-fontes" className="surface-title">
                  Fontes do lote
                </h2>
                <span className="surface-meta jg-mono">{project.batchId}</span>
              </header>
              {project.sources.length ? (
                <ul className="jg-list">
                  {project.sources.map((s) => (
                    <li key={s.id}>
                      <span className="jg-mono">{s.id}</span> {s.name} <span className="jg-muted">· {fmtBytes(s.size)} · {s.status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="jg-muted">Nenhuma fonte enviada.</p>
              )}
            </section>
            <section className="surface" aria-labelledby="prj-membros">
              <header className="surface-head">
                <h2 id="prj-membros" className="surface-title">
                  Membros e papéis
                </h2>
              </header>
              <Membros project={project} />
            </section>
          </div>

          <section className="surface" aria-labelledby="prj-runs">
            <header className="surface-head">
              <h2 id="prj-runs" className="surface-title">
                Execuções
              </h2>
              <span className="surface-meta">{project.runs.length} no total</span>
            </header>
            <RunList limit={20} />
          </section>
        </>
      ) : null}

      <div className="jg-footer-actions">
        <SimulatedNote>os dados ficam só neste navegador (localStorage). Use “Reiniciar protótipo” para começar do zero.</SimulatedNote>
        {confirmarReset ? (
          <span className="jg-inline-form">
            <span>Apagar todos os projetos simulados deste navegador?</span>
            <button
              type="button"
              className="btn btn--sm btn--danger"
              onClick={() => {
                resetJourney();
                setConfirmarReset(false);
              }}
            >
              Sim, apagar
            </button>
            <button type="button" className="btn btn--sm btn--quiet" onClick={() => setConfirmarReset(false)}>
              Cancelar
            </button>
          </span>
        ) : (
          <button type="button" className="btn btn--sm btn--danger" onClick={() => setConfirmarReset(true)}>
            <Icon name="trash" size={14} /> Reiniciar protótipo
          </button>
        )}
      </div>
    </div>
  );
}
