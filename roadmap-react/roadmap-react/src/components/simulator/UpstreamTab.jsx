import { useEffect, useState } from 'react';
import { CAP, latestRevision, stageIndex } from '../../domain/journey/journeyEngine.js';
import { getNotebook } from '../../domain/journey/notebooks.js';
import { useJourney } from '../../journey/JourneyContext.jsx';
import Icon from '../ui/Icon.jsx';
import Tabs from '../ui/Tabs.jsx';
import ProjectBar from '../journey/ProjectBar.jsx';
import CapabilityCard from '../journey/CapabilityCard.jsx';
import TurboPanel from '../journey/TurboPanel.jsx';
import { EmptyState, SimulatedNote, goToTab } from '../journey/JourneyBits.jsx';
import NotebooksPanel from '../notebooks/NotebooksPanel.jsx';
import ProjectsPanel from '../notebooks/ProjectsPanel.jsx';
import NotebookDetail from '../notebooks/NotebookDetail.jsx';
import { NewProjectDialog } from '../notebooks/NotebookDialogs.jsx';

const OPEN_KEY = 'jornada.contexto.notebook';
const ABA_KEY = 'jornada.contexto.aba';

/** Abas da área de execução, à direita dos notebooks. */
const ABAS_DO_CONTEXTO = [
  { id: 'ctx-consolidar', label: 'Consolidar Contexto', icon: 'layers' },
  { id: 'ctx-agentes', label: 'Grid de Agentes', icon: 'grid' },
  { id: 'ctx-modelos', label: 'Modelos de Gestão', icon: 'report' },
];

function lerAba() {
  try {
    const v = window.sessionStorage.getItem(ABA_KEY);
    return ABAS_DO_CONTEXTO.some((a) => a.id === v) ? v : ABAS_DO_CONTEXTO[0].id;
  } catch {
    return ABAS_DO_CONTEXTO[0].id;
  }
}

function lerAberto() {
  try {
    return JSON.parse(window.sessionStorage.getItem(OPEN_KEY) ?? 'null');
  } catch {
    return null;
  }
}

/**
 * Aba "Contexto": notebooks do projeto (cada um com suas fontes e a análise 001), consolidação,
 * os oito resultados e o Modo Turbo. O projeto é criado aqui, por um diálogo.
 */
export default function UpstreamTab() {
  const { catalog, project, state, can, createProject } = useJourney();
  const [novoProjeto, setNovoProjeto] = useState(false);
  // Notebook aberto, lembrado por projeto: { projectId, notebookId }.
  const [aberto, setAberto] = useState(lerAberto);
  const [aba, setAba] = useState(lerAba);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(ABA_KEY, aba);
    } catch {
      /* ignora */
    }
  }, [aba]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(OPEN_KEY, JSON.stringify(aberto));
    } catch {
      /* ignora */
    }
  }, [aberto]);

  const dialogoProjeto = novoProjeto ? (
    <NewProjectDialog
      nextCode={`PRJ-${String(state.projects.length + 1).padStart(3, '0')}`}
      onClose={() => setNovoProjeto(false)}
      onCreate={(nome, descricao, empresa) => {
        if (createProject(nome, descricao, empresa)) {
          setNovoProjeto(false);
          setAberto(null);
        }
      }}
    />
  ) : null;

  if (!project) {
    return (
      <div className="jg-page">
        <ProjectBar current="contexto" />
        <EmptyState
          title="Crie o primeiro projeto"
          action={
            <button type="button" className="btn btn--primary" onClick={() => setNovoProjeto(true)} disabled={!can('createProject')}>
              <Icon name="folderPlus" size={16} /> Novo projeto
            </button>
          }
        >
          Toda a jornada acontece dentro de um projeto, criado aqui no Contexto. Depois, crie os notebooks do projeto com as suas
          referências.
        </EmptyState>
        <SimulatedNote />
        {dialogoProjeto}
      </div>
    );
  }

  const notebook = aberto?.projectId === project.projectId ? getNotebook(project, aberto.notebookId) : null;
  if (notebook) {
    return (
      <div className="jg-page">
        <ProjectBar current="contexto" />
        <NotebookDetail notebook={notebook} onBack={() => setAberto(null)} onNewProject={() => setNovoProjeto(true)} />
        {dialogoProjeto}
      </div>
    );
  }

  const complementares = catalog.byPhase.contexto.filter((c) => c.number >= 3 && !c.isTurbo);
  const consolidado = Boolean(latestRevision(project, CAP.consolidar));

  return (
    <div className="jg-page">
      <ProjectBar current="contexto" />

      {/* Projetos e Notebooks à esquerda (50%); à direita, os boxes de execução dos agentes do Contexto. */}
      <div className="ctx-split">
        <div className="ctx-split__left">
          <ProjectsPanel onNewProject={() => setNovoProjeto(true)} />
          <NotebooksPanel onOpenNotebook={(notebookId) => setAberto({ projectId: project.projectId, notebookId })} />
        </div>

        <div className="ctx-split__right">
          <Tabs tabs={ABAS_DO_CONTEXTO} active={aba} onChange={setAba} label="Áreas do Contexto" />

          <div role="tabpanel" id="panel-ctx-consolidar" aria-labelledby="tab-ctx-consolidar" className="ctx-tabpanel" hidden={aba !== 'ctx-consolidar'}>
            <TurboPanel
              collapsible
              defaultOpen={false}
              phase="contexto"
              description="Executa de ponta a ponta: 001 para cada fonte, 002 e os oito resultados na ordem das dependências. Uma falha marca como pulados só os dependentes."
              disabledReason={project.sources.length ? null : 'Envie ao menos uma fonte.'}
            />
            <div className="jg-grid jg-grid--2">
              <CapabilityCard capabilityId={CAP.consolidar} />
              <section className="surface jg-gate" aria-labelledby="ctx-next">
                <header className="surface-head">
                  <h2 id="ctx-next" className="surface-title">
                    Próxima etapa
                  </h2>
                </header>
                {consolidado ? (
                  <>
                    <p>Contexto consolidado. O DarkLabs já pode enquadrar o problema deste projeto.</p>
                    <button type="button" className="btn btn--sm btn--primary" onClick={() => goToTab('darklab')}>
                      Ir para o DarkLabs <Icon name="chevronRight" size={14} />
                    </button>
                  </>
                ) : (
                  <p className="jg-muted">
                    Quando todas as fontes estiverem analisadas, consolide o contexto (002). A consolidação libera os oito resultados
                    abaixo e o DarkLabs{stageIndex(project.stage) >= 1 ? '' : ''}.
                  </p>
                )}
              </section>
            </div>

            <section aria-labelledby="ctx-complementares">
              <h2 id="ctx-complementares" className="jg-section-title">
                Resultados complementares · 003 a 010
              </h2>
              <div className="jg-grid jg-grid--4">
                {complementares.map((c) => (
                  <CapabilityCard key={c.id} capabilityId={c.id} compact />
                ))}
              </div>
            </section>
          </div>

          <div role="tabpanel" id="panel-ctx-agentes" aria-labelledby="tab-ctx-agentes" className="ctx-tabpanel" hidden={aba !== 'ctx-agentes'}>
            <EmptyState title="Grid de Agentes">Esta aba ainda não tem conteúdo definido.</EmptyState>
          </div>

          <div role="tabpanel" id="panel-ctx-modelos" aria-labelledby="tab-ctx-modelos" className="ctx-tabpanel" hidden={aba !== 'ctx-modelos'}>
            <EmptyState title="Modelos de Gestão">Esta aba ainda não tem conteúdo definido.</EmptyState>
          </div>

        </div>
      </div>
      <SimulatedNote />
      {dialogoProjeto}
    </div>
  );
}
