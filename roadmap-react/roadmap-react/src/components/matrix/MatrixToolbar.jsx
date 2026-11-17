import { useState } from 'react';
import {
  EPICS,
  SCHEDULING_MODES,
  FREEZE_DATE_LABEL,
  YEAR,
  YEAR_WEEKS,
  LIMITS,
  WEEKS,
  resolveYearWeek,
  weekIdToYearWeek,
  currentYearWeekNumber,
} from '../../data/initialRoadmapData.js';
import { STATUS_META } from '../../domain/simulationEngine.js';
import { describeScheduleLabels, formatPlanningWeek } from '../../domain/timeline.js';
import Icon from '../ui/Icon.jsx';
import NumberInput from '../ui/NumberInput.jsx';

const STATUS_OPTIONS = ['ON_TIME', 'POST_FREEZE', 'OUT_OF_WINDOW', 'NO_CAPACITY', 'EMPTY'];

const JOURNEY_PRESETS = [
  { value: 30, label: '30 h', hint: 'C0' },
  { value: 40, label: '40 h', hint: 'C1' },
];

const COVERAGE_NOTE = {
  before: 'Anterior ao calendário do roadmap: o planejamento começa na primeira coluna',
  after: 'Posterior ao calendário do roadmap: o planejamento usa a última coluna',
};

export const EMPTY_FILTERS = Object.freeze({ text: '', squad: '', epic: '', status: '' });

export function hasActiveFilters(filters) {
  return Boolean(filters.text || filters.squad || filters.epic || filters.status);
}

/** Barra da matriz: ações de cenário, filtros, parâmetros temporais/jornada/SP 01 e modalidade. */
export default function MatrixToolbar({
  squads,
  premises,
  context,
  onStartYearWeekChange,
  onHoursPerPersonChange,
  currentYearWeek,
  onCurrentYearWeekChange,
  actions,
  filters,
  onFiltersChange,
  view,
  onViewChange,
  focus,
  onToggleFocus,
  mode,
  onModeChange,
  planningNote,
  sprintOneOptions,
  sprintOneValue,
  onSprintOneChange,
  onReseedManual,
  visibleCount,
  totalCount,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const set = (patch) => onFiltersChange({ ...filters, ...patch });
  const chips = [
    filters.text ? { key: 'text', label: `“${filters.text}”` } : null,
    filters.squad ? { key: 'squad', label: squads.find((s) => s.key === filters.squad)?.shortName || `Squad ${filters.squad}` } : null,
    filters.epic ? { key: 'epic', label: filters.epic } : null,
    filters.status ? { key: 'status', label: STATUS_META[filters.status]?.label } : null,
  ].filter(Boolean);

  const hpp = premises.hoursPerPersonPerWeek;
  const yearWeek = premises.startYearWeek ?? weekIdToYearWeek(premises.startWeekId);
  const resolved = resolveYearWeek(yearWeek);
  const startColumn = WEEKS.find((week) => week.id === premises.startWeekId);
  const scheduleLabels = describeScheduleLabels({
    weeks: WEEKS,
    yearWeeks: YEAR_WEEKS,
    calendarStartIndex: context.calendarStartIndex ?? context.startIndex,
    startIndex: context.startIndex,
    currentYearWeek,
    todayYearWeek: currentYearWeekNumber(),
    year: YEAR,
    freezeDateLabel: FREEZE_DATE_LABEL,
  });

  const startWeekOptions = YEAR_WEEKS.map((item) => (
    <option key={item.number} value={item.number}>
      Semana {item.number} · {item.startLabel} a {item.endLabel}
    </option>
  ));
  const currentWeekOptions = YEAR_WEEKS.map((item) => {
    const mapped = resolveYearWeek(item.number);
    const colNum = mapped ? scheduleLabels.counts[mapped.weekId] : null;
    return (
      <option key={item.number} value={item.number}>
        Semana {item.number} · {item.startLabel} a {item.endLabel}
        {colNum ? ` · ${formatPlanningWeek(colNum)}` : ''}
      </option>
    );
  });
  const coverageNote = resolved && resolved.position !== 'inside' ? COVERAGE_NOTE[resolved.position] : null;

  return (
    <div className="matrix-toolbar">
      <div className="matrix-toolbar__row">
        <div className="matrix-toolbar__title">
          <h2 id="matrix-title" className="surface-title">Cronograma detalhado por squad e feature</h2>
          <span className="surface-meta tabular">
            {visibleCount === totalCount ? `${totalCount} features` : `${visibleCount} de ${totalCount} features`}
          </span>
        </div>
        <div className="matrix-toolbar__actions">
          {actions}
          <div className="segmented segmented--sm" role="radiogroup" aria-label="Visão da matriz">
            {[
              ['gantt', 'Gantt', 'gantt'],
              ['grid', 'Grade', 'table'],
            ].map(([value, label, icon]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={view === value}
                className={`segmented__btn ${view === value ? 'is-selected' : ''}`}
                onClick={() => onViewChange(value)}
              >
                <Icon name={icon} size={15} /> {label}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn--sm" onClick={onToggleFocus} aria-pressed={focus}>
            <Icon name={focus ? 'collapse' : 'expand'} size={15} />
            {focus ? 'Sair do foco' : 'Expandir matriz'}
          </button>
          <button
            type="button"
            className={`icon-btn matrix-filter-toggle ${filtersOpen ? 'is-active' : ''} ${chips.length > 0 ? 'has-filters' : ''}`.trim()}
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
            aria-controls="matrix-filters-panel"
            aria-label={filtersOpen ? 'Ocultar filtros e parâmetros do cronograma' : 'Mostrar filtros e parâmetros do cronograma'}
            title={filtersOpen ? 'Ocultar filtros e parâmetros' : 'Mostrar filtros e parâmetros'}
          >
            <Icon name="filter" size={16} />
          </button>
        </div>
      </div>

        <div id="matrix-filters-panel" className="matrix-filters-panel" hidden={!filtersOpen}>
          <div className="filters" role="search" aria-label="Filtrar features da matriz">
            <div className="field filters__search">
              <label className="field-label" htmlFor="matrix-text">
                Feature, épico ou squad
              </label>
              <div className="search-field">
                <Icon name="search" size={16} />
                <input
                  id="matrix-text"
                  type="search"
                  className="input"
                  value={filters.text}
                  onChange={(event) => set({ text: event.target.value })}
                  placeholder="Buscar na matriz…"
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="matrix-squad">
                Squad
              </label>
              <select id="matrix-squad" className="input" value={filters.squad} onChange={(event) => set({ squad: event.target.value })}>
                <option value="">Todas as squads</option>
                {squads.map((squad) => (
                  <option key={squad.key} value={squad.key}>
                    {squad.shortName}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="matrix-epic">
                Épico
              </label>
              <select id="matrix-epic" className="input" value={filters.epic} onChange={(event) => set({ epic: event.target.value })}>
                <option value="">Todos os épicos</option>
                {EPICS.map((epic) => (
                  <option key={epic} value={epic}>
                    {epic}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="matrix-status">
                Situação de prazo
              </label>
              <select id="matrix-status" className="input" value={filters.status} onChange={(event) => set({ status: event.target.value })}>
                <option value="">Todas as situações</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_META[status].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field-grid matrix-schedule-fields">
            <div className="field">
              <label className="field-label" htmlFor="start-week">
                Semana inicial do planejamento
              </label>
              <select
                id="start-week"
                className="input"
                value={yearWeek ?? ''}
                onChange={(event) => onStartYearWeekChange(Number(event.target.value))}
                aria-describedby="start-week-hint"
              >
                {startWeekOptions}
              </select>
              <p className="field-hint" id="start-week-hint">
                {coverageNote
                  ? `${coverageNote} (${startColumn?.dateLabel}).`
                  : `Semanas de ${YEAR}. O cronograma começa em ${startColumn?.month?.toLowerCase()} (coluna S01 em ${startColumn?.dateLabel}).`}
              </p>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="current-week">
                Semana atual
              </label>
              <select
                id="current-week"
                className="input"
                value={currentYearWeek ?? ''}
                onChange={(event) => onCurrentYearWeekChange(Number(event.target.value))}
                aria-describedby="current-week-hint"
              >
                {currentWeekOptions}
              </select>
              <p className="field-hint" id="current-week-hint">
                {scheduleLabels.currentWeekHint}
              </p>
            </div>

            <div className="field field--journey">
              <label className="field-label" htmlFor="hpp">
                Jornada Semanal
              </label>
              <div className="input-group">
                <NumberInput
                  id="hpp"
                  className="input tabular"
                  value={hpp}
                  onCommit={onHoursPerPersonChange}
                  min={LIMITS.hoursPerPersonPerWeek.min}
                  max={LIMITS.hoursPerPersonPerWeek.max}
                  invalidMessage="Informe uma jornada entre 1 e 60 horas."
                  aria-describedby="hpp-hint"
                />
                <span className="input-group__unit">h</span>
              </div>
              <div className="chip-toggle" role="group" aria-label="Atalhos de jornada semanal">
                {JOURNEY_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    className="chip-toggle__btn"
                    aria-pressed={hpp === preset.value}
                    onClick={() => onHoursPerPersonChange(preset.value)}
                  >
                    {preset.label} <span className="chip-toggle__hint">{preset.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="sprint-one">
                SP 01 no cronograma
              </label>
              <select
                id="sprint-one"
                className="input"
                value={sprintOneValue}
                onChange={(event) => onSprintOneChange(event.target.value || null)}
              >
                <option value="">Padrão do roadmap (17/08)</option>
                {sprintOneOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="field-hint">Recalcula sprints de 2 semanas e inicia as alocações na SP 01 (ou clique em uma semana na tabela).</p>
            </div>

            <div className="field">
              <span className="field-label" id="freeze-label">
                Congelamento (Freezing)
              </span>
              <div className="input input--readonly" aria-labelledby="freeze-label" role="note">
                <Icon name="lock" size={16} />
                <span className="tabular">{FREEZE_DATE_LABEL}</span>
              </div>
              <p className="field-hint">{scheduleLabels.freezeHint}</p>
            </div>
          </div>
        </div>

        <div className="mode-row matrix-mode-bar">
          <span className="field-label" id="mode-label">
            Modalidade de alocação
          </span>
          <div className="segmented segmented--sm" role="radiogroup" aria-labelledby="mode-label">
            {SCHEDULING_MODES.map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={mode === option.id}
                className={`segmented__btn ${mode === option.id ? 'is-selected' : ''}`}
                onClick={() => onModeChange(option.id)}
              >
                {option.label} <span className="segmented__hint">{option.short}</span>
              </button>
            ))}
          </div>
          <p className="field-hint">{SCHEDULING_MODES.find((option) => option.id === mode)?.description}</p>
        </div>

        <p className="field-hint matrix-toolbar__note" id="hpp-hint">
          {planningNote ? `${planningNote} ` : ''}Horizonte de alocação a partir de {scheduleLabels.allocStartCode}:{' '}
          <strong className="tabular">{context.eligibleBeforeFreezeCount}</strong> semanas úteis até o Freezing e{' '}
          <strong className="tabular">{context.eligibleCount}</strong> até {scheduleLabels.lastPlanningCode}.
        </p>

        {chips.length > 0 ? (
          <div className="chips" aria-label="Filtros ativos">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className="chip"
                onClick={() => set({ [chip.key]: '' })}
                aria-label={`Remover filtro ${chip.label}`}
              >
                {chip.label}
                <Icon name="close" size={13} />
              </button>
            ))}
            <button type="button" className="btn btn--link" onClick={() => onFiltersChange({ ...EMPTY_FILTERS })}>
              Limpar filtros
            </button>
          </div>
        ) : null}

        {mode === 'manual' ? (
          <div className="note note--info">
            <Icon name="info" size={17} />
            <p>
              <strong>Alocação manual:</strong> informe as histórias (US) por semana. A coluna Freezing e as semanas antes da SP 01 ficam bloqueadas.
              Duplo clique no nome distribui a feature automaticamente; botão direito limpa a feature.
            </p>
            <button type="button" className="btn btn--sm" onClick={onReseedManual}>
              <Icon name="wand" size={15} /> Redistribuir tudo (Fluxo Contínuo)
            </button>
          </div>
        ) : null}
      </div>
      );
}
