import { stageLabel } from '../../domain/journey/journeyEngine.js';
import { useJourney } from '../../journey/JourneyContext.jsx';
import NotebookIcon from './NotebookIcons.jsx';

/**
 * Box "Projetos" do Contexto, acima dos Notebooks: cria projetos (o diálogo começa pela empresa)
 * e troca o projeto em que a jornada está trabalhando.
 */
export default function ProjectsPanel({ onNewProject }) {
  const { state, project, can, selectProject } = useJourney();
  const total = state.projects.length;
  const podeCriar = can('createProject');

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
            <li key={p.projectId}>
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
            </li>
          );
        })}
      </ul>
    </section>
  );
}
