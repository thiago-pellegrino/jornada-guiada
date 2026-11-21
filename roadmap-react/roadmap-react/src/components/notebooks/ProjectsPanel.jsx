import { useEffect, useRef, useState } from 'react';
import { stageLabel } from '../../domain/journey/journeyEngine.js';
import { useJourney } from '../../journey/JourneyContext.jsx';
import { NewProjectDialog } from './NotebookDialogs.jsx';
import NotebookIcon from './NotebookIcons.jsx';

/** Menu "⋯" do cartão de projeto: Editar projeto. */
function MenuDoProjeto({ projeto, onEditar }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!aberto) return undefined;
    const fora = (e) => !ref.current?.contains(e.target) && setAberto(false);
    const esc = (e) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', esc);
    };
  }, [aberto]);
  return (
    <div className={`nb-card__menu prj-card__menu ${aberto ? 'is-open' : ''}`} ref={ref}>
      <button
        type="button"
        className="nb-iconbtn nb-iconbtn--sm"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label={`Opções do projeto ${projeto.code} · ${projeto.name}`}
        title="Opções"
        onClick={() => setAberto((v) => !v)}
      >
        <NotebookIcon name="more" size={18} />
      </button>
      {aberto ? (
        <div className="nb-card__menupanel prj-card__menupanel" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setAberto(false);
              onEditar();
            }}
          >
            <NotebookIcon name="edit" size={18} /> Editar projeto
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Box "Projetos" do Contexto, acima dos Notebooks: cria projetos (o diálogo começa pela empresa),
 * edita nome, descrição e empresa pelo menu "⋯" e troca o projeto em que a jornada está trabalhando.
 */
export default function ProjectsPanel({ onNewProject }) {
  const { state, project, can, selectProject, editProject } = useJourney();
  const [editando, setEditando] = useState(null);
  const total = state.projects.length;
  const podeCriar = can('createProject');
  const podeEditar = can('rename');
  const emEdicao = editando ? state.projects.find((p) => p.projectId === editando) : null;

  return (
    <section className="nb prj" aria-labelledby="prj-title">
      <header className="nb-head">
        <div>
          <h2 id="prj-title" className="nb-title">
            Projetos
          </h2>
          <p className="nb-sub">
            {total} projeto{total === 1 ? '' : 's'}. Cada projeto pertence a uma empresa e organiza toda a jornada, do Contexto ao Backlog.
          </p>
        </div>
      </header>

      <ul className="nb-grid prj-grid">
        <li>
          <button type="button" className="nb-create prj-create" onClick={onNewProject} disabled={!podeCriar} title={podeCriar ? undefined : 'Seu papel não permite criar projetos'}>
            <NotebookIcon name="folderPlus" size={24} />
            Criar projeto
          </button>
        </li>
        {state.projects.map((p) => {
          const atual = p.projectId === project?.projectId;
          return (
            <li key={p.projectId} className="prj-item">
              <button
                type="button"
                className={`prj-card ${atual ? 'is-current' : ''}`}
                onClick={() => selectProject(p.projectId)}
                aria-pressed={atual}
                aria-label={`${atual ? 'Projeto atual' : 'Trabalhar no projeto'} ${p.code} · ${p.name}`}
              >
                <span className="prj-card__top">
                  <span className="prj-card__code tabular">{p.code}</span>
                  {atual ? <span className="prj-card__now">Atual</span> : null}
                </span>
                <strong className="prj-card__name">{p.name}</strong>
                <span className="prj-card__company">
                  <NotebookIcon name="people" size={13} />
                  {p.company?.name ?? 'Empresa não informada'}
                </span>
                <span className="prj-card__stage">Etapa: {stageLabel(p.stage)}</span>
              </button>
              {podeEditar ? <MenuDoProjeto projeto={p} onEditar={() => setEditando(p.projectId)} /> : null}
            </li>
          );
        })}
      </ul>

      {emEdicao ? (
        <NewProjectDialog
          inicial={emEdicao}
          nextCode={emEdicao.code}
          onClose={() => setEditando(null)}
          onCreate={(nome, descricao, empresa) => {
            if (editProject(emEdicao.projectId, { name: nome, description: descricao, company: empresa })) setEditando(null);
          }}
        />
      ) : null}
    </section>
  );
}
