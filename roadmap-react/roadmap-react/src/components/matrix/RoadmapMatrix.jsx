import { useMemo, useRef, useState } from 'react';
import { WEEKS, LIMITS, resolveYearWeek } from '../../data/initialRoadmapData.js';
import { STATUS_META } from '../../domain/simulationEngine.js';
import { fmtNumber, fmtPct, fmtWeeks, plural } from '../../domain/format.js';
import { getVisibleWeeks, buildSpans, planningWeekNumbers, formatPlanningWeek, assignSprints } from '../../domain/timeline.js';
import Badge from '../ui/Badge.jsx';
import Icon from '../ui/Icon.jsx';
import NumberInput from '../ui/NumberInput.jsx';


export function normalizeText(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function featureMatches(squad, feature, schedule, filters) {
  if (filters.squad && squad.key !== filters.squad) return false;
  if (filters.epic && feature.epic !== filters.epic) return false;
  if (filters.status && schedule?.status !== filters.status) return false;
  if (filters.text) {
    const haystack = normalizeText(`${feature.name} ${feature.epic} ${squad.shortName} ${squad.title}`);
    if (!haystack.includes(normalizeText(filters.text))) return false;
  }
  return true;
}

function spillText(weeks) {
  if (!(weeks > 0)) return '—';
  if (!Number.isFinite(weeks)) return '∞';
  return `+${fmtWeeks(weeks)}`;
}

/** Matriz/Gantt do roadmap com coluna de excedente pós-S26 e células manuais com sobrecarga. */
export default function RoadmapMatrix({
  scenario,
  result,
  currentYearWeek,
  onSprintOneChange,
  onSquadNameChange,
  filters,
  view,
  onStoriesChange,
  onManualCell,
  onAutoDistribute,
  onClearFeature,
  onClearFilters,
}) {
  // Todas as squads iniciam recolhidas (collapsed close); clicar no nome expande/recolhe.
  const [expandedSquads, setExpandedSquads] = useState([]);
  const [editingKey, setEditingKey] = useState(null);
  const [editingDraft, setEditingDraft] = useState('');

  // Destaque de linha e coluna ao passar o mouse: a linha vem do CSS (:hover); a coluna marca as
  // células da mesma semana (data-w) direto no DOM, sem renderizar a matriz a cada movimento.
  const colunaAtual = useRef(null);
  const tabelaRef = useRef(null);
  function marcarColuna(semana) {
    if (semana === colunaAtual.current) return;
    const tabela = tabelaRef.current;
    if (!tabela) return;
    tabela.querySelectorAll('.is-hcol').forEach((el) => el.classList.remove('is-hcol'));
    colunaAtual.current = semana;
    if (semana) tabela.querySelectorAll(`[data-w="${semana}"]`).forEach((el) => el.classList.add('is-hcol'));
  }

  function toggleSquadCollapse(squadKey) {
    setExpandedSquads((prev) => (prev.includes(squadKey) ? prev.filter((key) => key !== squadKey) : [...prev, squadKey]));
  }

  function commitSquadEdit(squadKey) {
    const clean = editingDraft.trim() || `Squad ${squadKey}`;
    onSquadNameChange?.(squadKey, clean);
    setEditingKey(null);
  }
  const mode = scenario.premises.schedulingMode;
  const manual = mode === 'manual';
  const avg = scenario.premises.avgHoursPerStory;
  const { startIndex, calendarStartIndex = startIndex, freezeIndex } = result.context;

  // A matriz começa na semana inicial do planejamento; quando SP 01 é selecionada, as alocações começam nela (startIndex).
  const sprintOneWeekId = scenario.premises.sprintOneWeekId ?? null;
  const weeks = useMemo(
    () => getVisibleWeeks(assignSprints(WEEKS, sprintOneWeekId), calendarStartIndex),
    [calendarStartIndex, sprintOneWeekId],
  );
  const monthSpans = useMemo(() => buildSpans(weeks, 'month'), [weeks]);
  const sprintSpans = useMemo(() => buildSpans(weeks, 'sprint'), [weeks]);
  const counts = useMemo(() => planningWeekNumbers(weeks), [weeks]);
  const currentWeekId = currentYearWeek ? resolveYearWeek(currentYearWeek)?.weekId : null;

  const hasFeatureFilter = Boolean(filters.text || filters.epic || filters.status);
  const groups = useMemo(
    () =>
      scenario.squads
        .filter((squad) => !filters.squad || squad.key === filters.squad)
        .map((squad) => ({
          squad,
          diag: result.squads.find((s) => s.squadKey === squad.key),
          features: squad.features.filter((feature) => featureMatches(squad, feature, result.features[feature.id], filters)),
        }))
        .filter((group) => !hasFeatureFilter || group.features.length > 0),
    [scenario.squads, result, filters, hasFeatureFilter],
  );

  if (groups.length === 0) {
    return (
      <div className="empty">
        <h3>Nenhuma feature corresponde aos filtros</h3>
        <p>Revise a busca ou remova filtros para voltar a ver o cronograma completo.</p>
        <button type="button" className="btn btn--primary" onClick={onClearFilters}>
          Limpar filtros
        </button>
      </div>
    );
  }

  return (
    <div className="matrix-scroll" role="region" aria-labelledby="matrix-title" tabIndex={0}>
      <table
        ref={tabelaRef}
        className={`matrix matrix--${view} ${manual ? 'matrix--manual' : ''}`}
        onMouseOver={(event) => marcarColuna(event.target.closest?.('[data-w]')?.dataset.w ?? null)}
        onMouseLeave={() => marcarColuna(null)}
      >
        <caption className="visually-hidden">
          Cronograma por squad e feature, da semana {formatPlanningWeek(1)} (início do planejamento) à {formatPlanningWeek(Object.keys(counts).length)}, modalidade {mode}. Valores semanais em{' '}
          {view === 'grid' || manual ? 'histórias (US)' : 'barras proporcionais à ocupação'}.
        </caption>
        <colgroup>
          <col className="col-feature" />
          <col className="col-us" />
          <col className="col-hours" />
          <col className="col-weeks" />
          <col className="col-status" />
          {weeks.map((week) => (
            <col key={week.id} className={week.frozen ? 'col-freeze' : 'col-week'} />
          ))}
          <col className="col-spill" />
        </colgroup>
        <thead>
          <tr className="matrix__head-months">
            <th scope="col" rowSpan={3} className="sticky-col sticky-col--1 th-col-title">
              Feature
            </th>
            <th scope="col" rowSpan={3} className="sticky-col sticky-col--2 th-col-title">
              US
            </th>
            <th scope="col" rowSpan={3} className="sticky-col sticky-col--3 th-col-title">
              Horas
            </th>
            <th scope="col" rowSpan={3} className="sticky-col sticky-col--4 th-col-title">
              Semanas
            </th>
            <th scope="col" rowSpan={3} className="sticky-col sticky-col--5 sticky-col--last th-col-title">
              Situação
            </th>
            {monthSpans.map((span) => (
              <th key={`${span.value}-${span.start}`} scope="colgroup" colSpan={span.count} className="th-month" title={span.value}>
                {span.count < 3 ? span.value.slice(0, 3) : span.value}
              </th>
            ))}
            <th
              scope="col"
              rowSpan={3}
              className="th-spill th-col-title"
              title={`Semanas necessárias além de ${formatPlanningWeek(Object.keys(counts).length)}`}
            >
              Excedente pós-{formatPlanningWeek(Object.keys(counts).length)}
            </th>
          </tr>
          <tr className="matrix__head-sprints">
            {sprintSpans.map((span) => {
              const isFreeze = span.value === 'FREEZING';
              const isSprintOne = span.value === 'SPRINT-01';
              const firstWeek = weeks[span.start];
              const label = isFreeze ? 'Freezing' : span.value ? span.value.replace('SPRINT-', 'SP ') : '—';
              return (
                <th
                  key={`${span.value}-${span.start}`}
                  scope="colgroup"
                  colSpan={span.count}
                  className={['th-sprint', isFreeze ? 'is-freeze' : '', isSprintOne ? 'is-sprint-one' : ''].filter(Boolean).join(' ')}
                >
                  {isFreeze || !firstWeek ? (
                    label
                  ) : (
                    <button
                      type="button"
                      className="th-sprint__btn"
                      onClick={() => onSprintOneChange?.(firstWeek.id)}
                      title={`Iniciar a SP 01 em ${formatPlanningWeek(counts[firstWeek.id])} (${firstWeek.dateLabel})`}
                    >
                      {label}
                    </button>
                  )}
                </th>
              );
            })}
          </tr>
          <tr className="matrix__head-weeks">
            {weeks.map((week) => (
              <th
                key={week.id}
                scope="col"
                data-w={week.id}
                className={[
                  'th-week',
                  week.frozen ? 'is-freeze' : '',
                  week.index < startIndex ? 'is-history' : '',
                  week.milestone && !week.frozen ? 'has-milestone' : '',
                  week.id === currentWeekId ? 'is-current' : '',
                  week.id === sprintOneWeekId ? 'is-sprint-start' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                title={week.frozen ? 'Freezing 17/12/2026 — sem alocação' : `Semana ${counts[week.id]} do planejamento · roadmap ${week.sprintWeek} · semana de ${week.dateLabel}${week.milestone ? ` · ${week.milestone}` : ''}`}
              >
                {week.frozen ? (
                  <>
                    <Icon name="lock" size={13} />
                    <span className="th-week__date">17/12</span>
                  </>
                ) : (
                  <button
                    type="button"
                    className="th-week__btn"
                    onClick={() => onSprintOneChange?.(week.id)}
                    title={`Iniciar a SP 01 em ${formatPlanningWeek(counts[week.id])} (${week.dateLabel})`}
                    aria-label={`Iniciar a SP 01 em ${formatPlanningWeek(counts[week.id])}, semana de ${week.dateLabel}`}
                  >
                    <span className="th-week__code">{formatPlanningWeek(counts[week.id])}</span>
                    <span className="th-week__date">{week.dateLabel}</span>
                    {week.id === currentWeekId ? <span className="th-week__now">Atual</span> : null}
                  </button>
                )}
                {week.milestone && !week.frozen ? <span className="th-week__milestone" aria-label={week.milestone} /> : null}
              </th>
            ))}
          </tr>
        </thead>

        {groups.map(({ squad, diag, features }) => {
          const meta = STATUS_META[diag.status] || STATUS_META.EMPTY;
          const capacity = diag.weeklyCapacityHours;
          const isCollapsed = !expandedSquads.includes(squad.key);
          const displayName = squad.name || `Squad ${squad.key}`;
          return (
            <tbody key={squad.key} className="matrix__group" style={{ '--squad': `var(${squad.colorToken})` }}>
              <tr className={`matrix__squad ${isCollapsed ? 'is-collapsed' : ''}`}>
                <th scope="rowgroup" className="sticky-col sticky-col--1 squad-cell">
                  <div className="squad-cell__inner">
                    {editingKey === squad.key ? (
                      <span className="squad-cell__editor">
                        <span className="squad-dot" aria-hidden="true" />
                        <span className="squad-id" hidden data-squad-key={squad.key}>
                          {squad.key}
                        </span>
                        <input
                          type="text"
                          className="squad-name-input is-editing"
                          value={editingDraft}
                          maxLength={40}
                          autoFocus
                          aria-label={`Nome da squad ${squad.key}`}
                          onChange={(event) => setEditingDraft(event.target.value)}
                          onBlur={() => commitSquadEdit(squad.key)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') commitSquadEdit(squad.key);
                            if (event.key === 'Escape') setEditingKey(null);
                          }}
                        />
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="squad-cell__toggle"
                          aria-expanded={!isCollapsed}
                          onClick={() => toggleSquadCollapse(squad.key)}
                          title={isCollapsed ? `Expandir features de ${squad.shortName}` : `Recolher features de ${squad.shortName}`}
                        >
                          <Icon name="chevronDown" size={14} className={`squad-cell__chevron ${isCollapsed ? 'is-collapsed' : ''}`} />
                          <span className="squad-dot" aria-hidden="true" />
                          <span className="squad-id" hidden data-squad-key={squad.key}>
                            {squad.key}
                          </span>
                          <span className="squad-cell__name">{displayName}</span>
                        </button>
                        {onSquadNameChange ? (
                          <button
                            type="button"
                            className="squad-name-edit-btn"
                            onClick={() => {
                              setEditingKey(squad.key);
                              setEditingDraft(displayName);
                            }}
                            aria-label={`Editar nome da squad ${squad.key}`}
                            title="Editar nome da squad"
                          >
                            <Icon name="edit" size={12} />
                          </button>
                        ) : null}
                      </>
                    )}
                    <span className="squad-cell__meta tabular">
                      {plural(squad.people, 'pessoa', 'pessoas')} · {fmtNumber(capacity)} h/sem
                    </span>
                  </div>
                </th>
                <td className="sticky-col sticky-col--2 num tabular">{fmtNumber(diag.stories)}</td>
                <td className="sticky-col sticky-col--3 num tabular">{fmtNumber(diag.demandHours)}</td>
                <td className="sticky-col sticky-col--4 num tabular">{Number.isFinite(diag.requiredWeeks) ? fmtNumber(diag.requiredWeeks, 2, 2) : '∞'}</td>
                <td className="sticky-col sticky-col--5 sticky-col--last cell-status">
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </td>
                {weeks.map((week) => {
                  if (week.frozen) {
                    return (
                      <td key={week.id} data-w={week.id} className="cell cell--freeze" title="Freezing 17/12/2026: alocação bloqueada">
                        <Icon name="lock" size={12} />
                      </td>
                    );
                  }
                  const usage = diag.weeklyUsage[week.id];
                  const ratio = usage?.ratio ?? 0;
                  const label = `${week.sprintWeek}: ${fmtNumber(usage?.hours ?? 0)} h de ${fmtNumber(capacity)} h (${Number.isFinite(ratio) ? fmtPct(ratio, 0) : 'sem capacidade'})${usage?.isOvercapacity ? ` — sobrecarga de ${fmtNumber(usage.overHours)} h` : ''}`;
                  return (
                    <td
                      key={week.id}
                      data-w={week.id}
                      className={`cell cell--usage ${usage?.isOvercapacity ? 'is-over' : ''} ${week.index < startIndex ? 'is-history' : ''} ${week.id === currentWeekId ? 'is-now' : ''}`}
                      title={label}
                    >
                      {usage && usage.hours > 0 ? (
                        <span className="capacity-meter" aria-hidden="true">
                          <span className="capacity-meter__fill" style={{ height: `${Math.min(100, (Number.isFinite(ratio) ? ratio : 1) * 100)}%` }} />
                        </span>
                      ) : null}
                      {usage?.isOvercapacity ? <Icon name="warning" size={12} className="over-icon" /> : null}
                      <span className="visually-hidden">{label}</span>
                    </td>
                  );
                })}
                <td className={`num tabular ${diag.spilloverWeeks > 0 ? 'is-danger' : ''}`}>{spillText(diag.spilloverWeeks)}</td>
              </tr>

              {!isCollapsed
                ? features.map((feature) => {
                const schedule = result.features[feature.id];
                const fMeta = STATUS_META[schedule.status] || STATUS_META.EMPTY;
                const manualRow = scenario.manualAllocations[feature.id] || {};
                return (
                  <tr key={feature.id} className="matrix__feature">
                    <th scope="row" className="sticky-col sticky-col--1 feature-cell">
                      <div className="feature-cell__inner">
                        <span className="epic-tag">{feature.epic}</span>
                        <span
                          className="feature-cell__name"
                          title={manual ? `${feature.name} — duplo clique distribui, botão direito limpa` : feature.name}
                          onDoubleClick={manual ? () => onAutoDistribute(feature.id) : undefined}
                          onContextMenu={
                            manual
                              ? (event) => {
                                  event.preventDefault();
                                  onClearFeature(feature.id);
                                }
                              : undefined
                          }
                        >
                          {feature.name}
                        </span>
                        {manual ? (
                          <span className="feature-cell__actions">
                            <button type="button" className="icon-btn" onClick={() => onAutoDistribute(feature.id)} aria-label={`Auto-distribuir ${feature.name}`} title="Auto-distribuir">
                              <Icon name="wand" size={14} />
                            </button>
                            <button type="button" className="icon-btn" onClick={() => onClearFeature(feature.id)} aria-label={`Limpar alocação de ${feature.name}`} title="Limpar">
                              <Icon name="eraser" size={14} />
                            </button>
                          </span>
                        ) : null}
                      </div>
                      {manual && schedule.spilloverHours > 0 && avg > 0 ? (
                        <span className="feature-cell__warn">Faltam {fmtNumber(schedule.spilloverHours / avg, 2, 0)} US para alocar</span>
                      ) : null}
                      {manual && schedule.overAllocatedHours > 0 && avg > 0 ? (
                        <span className="feature-cell__warn">Excedem {fmtNumber(schedule.overAllocatedHours / avg, 2, 0)} US</span>
                      ) : null}
                    </th>
                    <td className="sticky-col sticky-col--2 num">
                      <NumberInput
                        className="cell-input tabular"
                        value={feature.stories}
                        onCommit={(value) => onStoriesChange(feature.id, value)}
                        min={LIMITS.stories.min}
                        max={LIMITS.stories.max}
                        aria-label={`Histórias (US) de ${feature.name}`}
                        invalidMessage="Informe de 0 a 200 histórias."
                      />
                    </td>
                    <td className="sticky-col sticky-col--3 num tabular">{fmtNumber(schedule.effortHours)}</td>
                    <td className="sticky-col sticky-col--4 num tabular">{fmtNumber(schedule.estimatedWeeks, 2, 2)}</td>
                    <td className="sticky-col sticky-col--5 sticky-col--last cell-status">
                      <Badge variant={fMeta.variant} title={`${fMeta.label} — ${fMeta.description} Término: ${schedule.endLabel}`}>
                        {fMeta.label}
                      </Badge>
                    </td>
                    {weeks.map((week) => {
                      if (week.frozen) return <td key={week.id} data-w={week.id} className="cell cell--freeze" aria-label="Freezing: bloqueado" />;
                      const hours = schedule.allocatedByWeek[week.id] || 0;
                      const usage = diag.weeklyUsage[week.id];
                      const classes = [
                        'cell',
                        week.index < startIndex ? 'is-history' : '',
                        freezeIndex >= 0 && week.index > freezeIndex ? 'is-post' : '',
                        usage?.isOvercapacity && hours > 0 ? 'is-over' : '',
                        week.id === currentWeekId ? 'is-now' : '',
                      ].join(' ');

                      if (manual) {
                        if (week.index < startIndex) {
                          return <td key={week.id} data-w={week.id} className={`${classes} cell--locked`} title="Antes do início do planejamento" />;
                        }
                        const value = Number(manualRow[week.id]) || 0;
                        return (
                          <td key={week.id} data-w={week.id} className={`${classes} cell--input`}>
                            <NumberInput
                              className="cell-input cell-input--week tabular"
                              value={value}
                              allowEmptyAsZero
                              integer={false}
                              step={0.5}
                              min={LIMITS.manualStories.min}
                              max={LIMITS.manualStories.max}
                              onCommit={(next) => onManualCell(feature.id, week.id, next)}
                              aria-label={`${feature.name} — ${week.sprintWeek} (histórias)`}
                              invalidMessage="Informe de 0 a 200 histórias."
                            />
                          </td>
                        );
                      }

                      const fraction = capacity > 0 ? Math.min(1, hours / capacity) : 0;
                      const title = hours > 0 ? `${feature.name} · ${week.sprintWeek}: ${fmtNumber(hours)} h (${fmtNumber(hours / avg, 2, 0)} US)` : undefined;
                      return (
                        <td key={week.id} data-w={week.id} className={classes} title={title}>
                          {hours > 0 ? (
                            view === 'grid' ? (
                              <span className="cell-value tabular">{fmtNumber(hours / avg, 1, 0)}</span>
                            ) : (
                              <span className="bar" style={{ '--fill': 0.35 + 0.65 * fraction }}>
                                <span className="visually-hidden">{title}</span>
                              </span>
                            )
                          ) : null}
                        </td>
                      );
                    })}
                    <td className={`num tabular ${schedule.spilloverWeeks > 0 ? 'is-danger' : ''}`}>{spillText(schedule.spilloverWeeks)}</td>
                  </tr>
                );
              })
                : null}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
