import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSimulationState } from './hooks/useSimulationState.js';
import { useTheme } from './hooks/useTheme.js';
import { useFontScale } from './hooks/useFontScale.js';
import { SCHEDULING_MODES, FREEZE_DATE_LABEL, WEEKS, YEAR_WEEKS, currentYearWeekNumber } from './data/initialRoadmapData.js';
import { serializeScenario, buildCsv, fileTimestamp } from './domain/scenarioSerializer.js';
import { fmtNumber, fmtPct } from './domain/format.js';
import { getVisibleWeeks, planningWeekNumbers, formatPlanningWeek } from './domain/timeline.js';
import ScenarioActions from './components/shell/ScenarioActions.jsx';
import Topbar from './components/shell/Topbar.jsx';
import HeroCarouselMosaic from './components/shell/HeroCarouselMosaic.jsx';
import CopilotDrawer from './components/shell/CopilotDrawer.jsx';
import DeltaBuilder from './components/builder/DeltaBuilder.jsx';
import ContextTab from './components/simulator/ContextTab.jsx';
import UpstreamTab from './components/simulator/UpstreamTab.jsx';
import DarklabTab from './components/simulator/DarklabTab.jsx';
import FutureBacklogTab from './components/simulator/FutureBacklogTab.jsx';
import ProjectsTab from './components/simulator/ProjectsTab.jsx';
import EpicsTab from './components/simulator/EpicsTab.jsx';
import ProjectBar from './components/journey/ProjectBar.jsx';
import SquadScopeTab from './components/simulator/SquadScopeTab.jsx';
import ProjectionChartCard from './components/simulator/ProjectionChartCard.jsx';
import KpiSummaryColumn from './components/simulator/KpiSummaryColumn.jsx';
import SquadDiagnosticsCard from './components/simulator/SquadDiagnosticsCard.jsx';
import ScenarioOverviewCards from './components/simulator/ScenarioOverviewCards.jsx';
import MatrixToolbar, { EMPTY_FILTERS } from './components/matrix/MatrixToolbar.jsx';
import RoadmapMatrix, { featureMatches } from './components/matrix/RoadmapMatrix.jsx';
import DeltaMascot from './components/shell/DeltaMascot.jsx';
import { CopilotMark } from './components/ui/Icon.jsx';
import Toast from './components/ui/Toast.jsx';
import SistemaEmBreve from './components/shell/SistemaEmBreve.jsx';
import PortalDarkLabs from './sistemas/portal-darklabs/PortalDarkLabs.jsx';
import { SISTEMA_PADRAO, lerSistema, salvarSistema, sistemaPorId } from './components/shell/sistemas.js';

const TABS = [
  { id: 'contexto', label: 'Contexto', icon: 'info' },
  { id: 'darklab', label: 'DarkLabs', icon: 'sparkle' },
  { id: 'projetos', label: 'Projetos', icon: 'folder' },
  { id: 'backlog-futuro', label: 'Backlog do Futuro', icon: 'roadmap' },
  { id: 'epicos', label: 'Épicos, Features e Histórias', icon: 'layers' },
  { id: 'escopo-squads', label: 'Escopo das Squads', icon: 'users' },
  { id: 'planejamento', label: 'Planejamento', icon: 'sliders' },
  { id: 'resultados', label: 'Resultados e diagnóstico', icon: 'gauge' },
  { id: 'curva', label: 'Curva de entrega', icon: 'chart' },
  { id: 'builder', label: 'Delta Builder', icon: 'delta' },
];

const THEME_LABELS = { light: 'Tema claro ativado', dark: 'Tema escuro ativado', system: 'Tema do sistema ativado' };

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const sim = useSimulationState();
  const theme = useTheme();
  const fontScale = useFontScale();
  const { scenario, result } = sim;

  const [copilotOpen, setCopilotOpen] = useState(false);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [matrixView, setMatrixView] = useState('gantt');
  const [focusMode, setFocusMode] = useState(false);
  const [mosaicCollapsed, setMosaicCollapsed] = useState(false);
  const [autoHideMosaic, setAutoHideMosaic] = useState(false);
  // A semana atual é sempre carregada com a semana vigente de hoje (não é salva com o cenário).
  const [currentYearWeek, setCurrentYearWeek] = useState(() => currentYearWeekNumber());
  const [toast, setToast] = useState(null);
  // Sistema escolhido no menu do topbar: carrega toda a estrutura abaixo do topbar.
  const [sistema, setSistema] = useState(lerSistema);
  const naJornada = sistema === SISTEMA_PADRAO;
  const [tab, setTab] = useState(() => {
    const fromHash = window.location.hash.replace('#', '');
    return TABS.some((item) => item.id === fromHash) ? fromHash : 'contexto';
  });

  const mainRef = useRef(null);
  const copilotButtonRef = useRef(null);
  const lastScrollTopRef = useRef(new WeakMap());
  const ignoreScrollUntilRef = useRef(0);

  // Links internos da Jornada Guiada (ex.: "Ir para o DarkLabs") navegam pelo hash.
  useEffect(() => {
    function onHashChange() {
      const fromHash = window.location.hash.replace('#', '');
      if (TABS.some((item) => item.id === fromHash)) setTab(fromHash);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Etapas "Cronograma Gantt" e "Cronograma" da barra do projeto escolhem a visão da matriz.
  useEffect(() => {
    const onView = (event) => {
      if (event.detail === 'gantt' || event.detail === 'grid') setMatrixView(event.detail);
    };
    window.addEventListener('jornada:matrix-view', onView);
    return () => window.removeEventListener('jornada:matrix-view', onView);
  }, []);

  useEffect(() => {
    if (window.location.hash !== `#${tab}`) window.history.replaceState(null, '', `#${tab}`);
    ignoreScrollUntilRef.current = performance.now() + 250;
    mainRef.current?.scrollTo({ top: 0 });
  }, [tab]);

  const handleMainScroll = useCallback(
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || target.matches('input, select, textarea')) return;

      const currentTop = target.scrollTop;
      const prevTop = lastScrollTopRef.current.get(target) ?? 0;
      lastScrollTopRef.current.set(target, currentTop);

      if (!autoHideMosaic) return;
      if (performance.now() < ignoreScrollUntilRef.current) return;
      if (currentTop > prevTop + 2 && currentTop > 4) {
        setMosaicCollapsed((prev) => {
          if (prev) return prev;
          ignoreScrollUntilRef.current = performance.now() + 450;
          return true;
        });
      }
    },
    [autoHideMosaic],
  );

  const handleToggleMosaic = useCallback(() => {
    ignoreScrollUntilRef.current = performance.now() + 450;
    setMosaicCollapsed((prev) => !prev);
  }, []);
  const matrixRef = useRef(null);
  const resetRef = useRef(sim.requestReset);
  resetRef.current = sim.requestReset;

  const notify = useCallback((message) => setToast({ id: Date.now(), message }), []);

  const trocarSistema = useCallback((id) => {
    setSistema(id);
    salvarSistema(id);
    document.title = id === SISTEMA_PADRAO ? 'Jornada Guiada' : sistemaPorId(id).label;
  }, []);

  // Links internos da Jornada Guiada (hash de uma aba) sempre voltam para ela.
  useEffect(() => {
    function onHash() {
      const fromHash = window.location.hash.replace('#', '');
      if (TABS.some((item) => item.id === fromHash)) trocarSistema(SISTEMA_PADRAO);
    }
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [trocarSistema]);
  const clearToast = useCallback(() => setToast(null), []);

  const closeCopilot = useCallback(() => {
    setCopilotOpen(false);
    window.requestAnimationFrame(() => copilotButtonRef.current?.focus());
  }, []);

  useEffect(() => {
    if (sim.source === 'legacy') notify('Dados do protótipo anterior migrados para o novo simulador.');
    // Executa apenas na montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Atalho global: Esc fecha sobreposições (DS §9 / contrato de UI §3). */
  useEffect(() => {
    function onKey(event) {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (focusMode) setFocusMode(false);
      else if (copilotOpen) closeCopilot();
      else if (sim.resetArmed) sim.disarmReset();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusMode, copilotOpen, sim, closeCopilot]);

  useEffect(() => {
    document.body.classList.toggle('has-overlay', focusMode);
  }, [focusMode]);

  const totalFeatures = result.featureOrder.length;
  const visibleFeatures = useMemo(
    () =>
      scenario.squads.reduce(
        (sum, squad) => sum + squad.features.filter((feature) => featureMatches(squad, feature, result.features[feature.id], filters)).length,
        0,
      ),
    [scenario.squads, result, filters],
  );

  function handleReset() {
    const outcome = resetRef.current();
    if (outcome === 'reset') notify('Cenário restaurado aos valores iniciais. Use Desfazer para voltar.');
  }

  function handleExportJson() {
    download(`simulador-roadmap-cenario-${fileTimestamp()}.json`, serializeScenario(scenario), 'application/json');
    notify('Cenário exportado em JSON.');
  }

  function handleExportCsv() {
    download(`simulador-roadmap-matriz-${fileTimestamp()}.csv`, buildCsv(scenario, result), 'text/csv;charset=utf-8');
    notify('Matriz exportada em CSV.');
  }

  function handleThemeChange(value) {
    theme.setPreference(value);
    notify(THEME_LABELS[value]);
  }

  const modeLabel = SCHEDULING_MODES.find((mode) => mode.id === scenario.premises.schedulingMode)?.label;
  const generatedAt = new Date().toLocaleString('pt-BR');

  const startYearWeek = YEAR_WEEKS.find((item) => item.number === scenario.premises.startYearWeek);
  const planningNote = startYearWeek
    ? `A contagem S01, S02… começa na semana ${startYearWeek.number} (${startYearWeek.startLabel} a ${startYearWeek.endLabel}).`
    : '';
  const sprintOneOptions = useMemo(() => {
    const visible = getVisibleWeeks(WEEKS, result.context.calendarStartIndex ?? result.context.startIndex);
    const counts = planningWeekNumbers(visible);
    return visible
      .filter((week) => !week.frozen)
      .map((week) => ({
        id: week.id,
        code: formatPlanningWeek(counts[week.id]),
        dateLabel: week.dateLabel,
        label: `${formatPlanningWeek(counts[week.id])} · ${week.dateLabel} · semana ${week.yearWeek}`,
      }));
  }, [result.context.calendarStartIndex, result.context.startIndex]);
  const sprintOneId = scenario.premises.sprintOneWeekId ?? '';
  const sprintOneAvailable = sprintOneOptions.some((option) => option.id === sprintOneId);

  const handleSprintOneChange = useCallback(
    (weekId) => {
      sim.setSprintOneWeek(weekId);
      if (!weekId) {
        notify('Sprints restauradas para o padrão do roadmap.');
        return;
      }
      const chosen = sprintOneOptions.find((option) => option.id === weekId);
      if (chosen) {
        notify(`SP 01 iniciada em ${chosen.code} (${chosen.dateLabel}) — sprints seguintes recalculadas.`);
      }
    },
    [sim, sprintOneOptions, notify],
  );

  return (
    <div className={`app ${copilotOpen ? 'copilot-open' : ''}`}>
      <a className="skip-link" href="#main-content">
        Ir para o conteúdo principal
      </a>

      <div className={`workspace ${mosaicCollapsed ? 'is-mosaic-collapsed' : ''}`}>
        <Topbar
          theme={theme}
          onThemeChange={handleThemeChange}
          fontScale={fontScale}
          onFontDecrease={() => {
            const pct = fontScale.decrease();
            if (pct !== null) notify(`Tamanho da fonte: ${pct}%`);
          }}
          onFontIncrease={() => {
            const pct = fontScale.increase();
            if (pct !== null) notify(`Tamanho da fonte: ${pct}%`);
          }}
          copilotOpen={copilotOpen}
          onToggleCopilot={() => (copilotOpen ? closeCopilot() : setCopilotOpen(true))}
          copilotButtonRef={copilotButtonRef}
          onExportPdf={() => window.print()}
          onNotify={notify}
          sistema={sistema}
          onSistemaChange={trocarSistema}
        />

        {naJornada ? (
        <HeroCarouselMosaic
          activeTab={tab}
          matrixView={matrixView}
          onSelectTab={setTab}
          onSelectMatrixView={setMatrixView}
          collapsed={mosaicCollapsed}
          onToggleCollapsed={handleToggleMosaic}
          autoHide={autoHideMosaic}
          onToggleAutoHide={() => setAutoHideMosaic((prev) => !prev)}
          scenario={scenario}
          result={result}
        />
        ) : null}

        <div className="workspace-body">
          {naJornada ? (
          <main ref={mainRef} id="main-content" className="main" tabIndex={-1} onScrollCapture={handleMainScroll}>
          <div className="content">
            <div className="print-only print-header">
              <p className="print-header__seal">Estudo simulado — dados de planejamento</p>
              <h1>Jornada Guiada — estudo de cenário</h1>
              <p>
                Gerado em {generatedAt} · Modalidade: {modeLabel} · {scenario.premises.avgHoursPerStory} h por história ·{' '}
                {scenario.premises.hoursPerPersonPerWeek} h semanais por profissional · início em {result.context.startWeekCode} · Freezing em {FREEZE_DATE_LABEL}
              </p>
              <p>
                Conclusão prevista: {result.kpis.globalEndLabel} · Entregas até o Freezing: {fmtPct(result.kpis.completionPctBeforeFreeze)} (
                {fmtNumber(result.kpis.storiesCompletedBeforeFreeze)} de {fmtNumber(result.kpis.totalStories)} US)
              </p>
            </div>

            <div role="tabpanel" id="panel-contexto" aria-label="Upstream: Criação de Contexto" className="tabpanel" hidden={tab !== 'contexto'}>
              <UpstreamTab />
            </div>

            <div role="tabpanel" id="panel-darklab" aria-label="DarkLabs" className="tabpanel" hidden={tab !== 'darklab'}>
              <DarklabTab />
            </div>

            <div role="tabpanel" id="panel-projetos" aria-label="Gestão dos Projetos" className="tabpanel" hidden={tab !== 'projetos'}>
              <ProjectsTab />
            </div>

            <div role="tabpanel" id="panel-backlog-futuro" aria-label="Backlog do Futuro" className="tabpanel" hidden={tab !== 'backlog-futuro'}>
              <FutureBacklogTab />
            </div>

            <div role="tabpanel" id="panel-epicos" aria-label="Épicos, Features e Histórias" className="tabpanel" hidden={tab !== 'epicos'}>
              <ProjectBar current="epicos" className="jg-projectbar--spaced" />
              <EpicsTab
                scenario={scenario}
                result={result}
                onStoriesChange={sim.setFeatureStories}
                onFeatureTotalStoriesChange={sim.setEpicFeatureTotalStories}
              />
            </div>

            <div role="tabpanel" id="panel-escopo-squads" aria-label="Escopo das Squads" className="tabpanel" hidden={tab !== 'escopo-squads'}>
              <ProjectBar current="escopo-squads" className="jg-projectbar--spaced" />
              <SquadScopeTab
                scenario={scenario}
                result={result}
                onCreateSquad={sim.addCustomSquad}
                onSquadNameChange={sim.setSquadName}
                onPeopleChange={sim.setSquadPeople}
                onRemoveSquad={sim.removeSquad}
                onAssociateFeature={sim.associateFeature}
                onMoveFeature={sim.moveFeature}
                onStoriesChange={sim.setFeatureStories}
                onRemoveFeature={sim.removeFeature}
                onNotify={notify}
              />
            </div>

            <div role="tabpanel" id="panel-planejamento" aria-label="Planejamento" className="tabpanel" hidden={tab !== 'planejamento'}>
              <ProjectBar current="planejamento" view={matrixView} className="jg-projectbar--spaced" />
              {/* Cronograma (com os parâmetros da simulação dentro da grade); no modo expandido vira janela sobreposta. */}
              <div
                className={`plan-focus ${focusMode ? 'is-focus' : ''}`}
                role={focusMode ? 'dialog' : undefined}
                aria-modal={focusMode ? 'true' : undefined}
                aria-labelledby={focusMode ? 'matrix-title' : undefined}
              >
                <section
                  ref={matrixRef}
                  className={`surface matrix-section ${focusMode ? 'is-focus' : ''}`}
                  aria-labelledby="matrix-title"
                >
                  <MatrixToolbar
                    squads={scenario.squads}
                    premises={scenario.premises}
                    context={result.context}
                    onStartYearWeekChange={sim.setStartYearWeek}
                    onHoursPerPersonChange={sim.setHoursPerPerson}
                    currentYearWeek={currentYearWeek}
                    onCurrentYearWeekChange={setCurrentYearWeek}
                    actions={
                      <ScenarioActions
                        canUndo={sim.canUndo}
                        onUndo={sim.undo}
                        resetArmed={sim.resetArmed}
                        onReset={handleReset}
                        onExportJson={handleExportJson}
                        onExportCsv={handleExportCsv}
                      />
                    }
                    filters={filters}
                    onFiltersChange={setFilters}
                    view={matrixView}
                    onViewChange={setMatrixView}
                    focus={focusMode}
                    onToggleFocus={() => setFocusMode((value) => !value)}
                    mode={scenario.premises.schedulingMode}
                    onModeChange={sim.setSchedulingMode}
                    planningNote={planningNote}
                    sprintOneOptions={sprintOneOptions}
                    sprintOneValue={sprintOneAvailable ? sprintOneId : ''}
                    onSprintOneChange={handleSprintOneChange}
                    onReseedManual={() => {
                      sim.reseedManualFromAuto('continuous');
                      notify('Grade manual redistribuída com o Fluxo Contínuo.');
                    }}
                    visibleCount={visibleFeatures}
                    totalCount={totalFeatures}
                  />
                  <RoadmapMatrix
                    currentYearWeek={currentYearWeek}
                    onSprintOneChange={handleSprintOneChange}
                    onSquadNameChange={sim.setSquadName}
                    scenario={scenario}
                    result={result}
                    filters={filters}
                    view={matrixView}
                    onStoriesChange={sim.setFeatureStories}
                    onManualCell={sim.setManualCell}
                    onAutoDistribute={sim.autoDistributeFeature}
                    onClearFeature={sim.clearFeature}
                    onClearFilters={() => setFilters({ ...EMPTY_FILTERS })}
                    onAvgChange={sim.setAvgHoursPerStory}
                    onPeopleChange={sim.setSquadPeople}
                    onAddSquad={sim.addSquad}
                    onRemoveSquad={sim.removeSquad}
                  />
                </section>
              </div>
              {focusMode ? <div className="focus-shade" onClick={() => setFocusMode(false)} aria-hidden="true" /> : null}
            </div>

            <div role="tabpanel" id="panel-resultados" aria-label="Resultados e diagnóstico" className="tabpanel" hidden={tab !== 'resultados'}>
              <ProjectBar current="resultados" className="jg-projectbar--spaced" />
              <div className="results-grid">
                <KpiSummaryColumn result={result} />
                <SquadDiagnosticsCard result={result} onOpenCopilot={() => setCopilotOpen(true)} />
                <ScenarioOverviewCards scenario={scenario} result={result} />
              </div>
              <ContextTab scenario={scenario} result={result} />
              <p className="side-note">
                Estimativa de planejamento: os dados são simulados, ficam apenas neste navegador e não substituem o planejamento oficial das squads.
              </p>
            </div>

            <div role="tabpanel" id="panel-curva" aria-label="Curva de entrega" className="tabpanel" hidden={tab !== 'curva'}>
              <ProjectBar current="curva" className="jg-projectbar--spaced" />
              <ProjectionChartCard result={result} />
            </div>

            <div role="tabpanel" id="panel-builder" aria-label="Delta Builder" className="tabpanel" hidden={tab !== 'builder'}>
              {tab === 'builder' ? <DeltaBuilder scenario={scenario} result={result} /> : null}
            </div>
          </div>

          <footer className="main-footer">
            <span>Capgemini / Experiência do gestor</span>
            <span>Simulação local · Sem execução de operações</span>
          </footer>
        </main>
          ) : (
            <main id="main-content" className="main" tabIndex={-1}>
              {sistema === 'portal-darklabs' ? (
                <div className="content">
                  <PortalDarkLabs />
                </div>
              ) : (
                <SistemaEmBreve sistemaId={sistema} onVoltar={() => trocarSistema(SISTEMA_PADRAO)} />
              )}
            </main>
          )}

        {copilotOpen ? <div className="copilot-backdrop" onClick={closeCopilot} aria-hidden="true" /> : null}

        <CopilotDrawer
          open={copilotOpen}
          onClose={closeCopilot}
          scenario={scenario}
          result={result}
          onApplyPatch={(patch, label) => {
            sim.applyPatch(patch, label);
            notify('Proposta do Delta aplicada na simulação.');
          }}
          onUndo={sim.undo}
        />
        </div>
      </div>

      {/* Mascote do Delta: flutua sobre todas as telas, pode ser arrastada e tem um mini chat próprio;
          fica oculta (sem perder a conversa) enquanto a janela do Delta completo está aberta. */}
      {naJornada ? (
        <DeltaMascot onOpen={() => setCopilotOpen(true)} tab={tab} scenario={scenario} result={result} oculto={copilotOpen} />
      ) : null}

      {/* Atalho fixo do Delta no canto inferior direito; some enquanto o chat está aberto. */}
      {!copilotOpen ? (
        <button
          type="button"
          className="delta-fab"
          onClick={() => setCopilotOpen(true)}
          aria-label="Abrir o Delta"
          aria-controls="copilot-panel"
          aria-expanded="false"
          title="Delta"
        >
          <CopilotMark size={28} />
        </button>
      ) : null}

      <Toast toast={toast} onDone={clearToast} />
    </div>
  );
}
