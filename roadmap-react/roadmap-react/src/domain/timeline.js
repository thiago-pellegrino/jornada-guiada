/**
 * Linha do tempo da matriz: as colunas começam na semana inicial do planejamento e a contagem
 * (S01, S02…) recomeça nela. A coluna congelada (Freezing) aparece mas não entra na contagem.
 */

export function getVisibleWeeks(weeks, startIndex) {
  return weeks.filter((week) => week.index >= startIndex);
}

/** Agrupa colunas consecutivas com o mesmo valor de `key` (ex.: mês ou sprint). */
export function buildSpans(list, key) {
  const spans = [];
  let start = 0;
  while (start < list.length) {
    const value = list[start][key] || '';
    let end = start + 1;
    while (end < list.length && (list[end][key] || '') === value) end += 1;
    spans.push({ value, count: end - start, start });
    start = end;
  }
  return spans;
}

/** Número da semana de planejamento (1 = semana inicial) por id de coluna; o Freezing não conta. */
export function planningWeekNumbers(visibleWeeks) {
  const numbers = {};
  let n = 0;
  for (const week of visibleWeeks) {
    if (week.frozen) continue;
    n += 1;
    numbers[week.id] = n;
  }
  return numbers;
}

export function formatPlanningWeek(n) {
  return `S${String(n).padStart(2, '0')}`;
}


export const SPRINT_LENGTH_WEEKS = 2;

/**
 * Recalcula as sprints a partir da semana em que a Sprint 01 começa: sprints de 2 semanas,
 * contadas só nas semanas úteis (o Freezing não conta e mantém o rótulo FREEZING).
 * Semanas anteriores à Sprint 01 ficam sem sprint. Com `sprintOneWeekId` nulo (ou inválido),
 * mantém as sprints originais do roadmap.
 */
export function assignSprints(weeks, sprintOneWeekId) {
  const startIdx = sprintOneWeekId ? weeks.findIndex((week) => week.id === sprintOneWeekId && !week.frozen) : -1;
  if (startIdx < 0) return weeks;
  let counted = 0;
  return weeks.map((week, i) => {
    if (week.frozen) return week;
    if (i < startIdx) return { ...week, sprint: '' };
    const sprintNumber = Math.floor(counted / SPRINT_LENGTH_WEEKS) + 1;
    counted += 1;
    return { ...week, sprint: `SPRINT-${String(sprintNumber).padStart(2, '0')}` };
  });
}

/**
 * Calcula os códigos de coluna dinâmicos (S01, S02…) e os rótulos auxiliares do cronograma
 * para que "Semana atual" e "Congelamento (Freezing)" reflitam sempre os parâmetros selecionados.
 */
export function describeScheduleLabels({
  weeks,
  yearWeeks,
  calendarStartIndex,
  startIndex,
  currentYearWeek,
  todayYearWeek,
  year,
  freezeDateLabel,
}) {
  const visible = getVisibleWeeks(weeks, calendarStartIndex);
  const counts = planningWeekNumbers(visible);
  const totalVisibleWeeks = Object.keys(counts).length;
  const lastPlanningCode = totalVisibleWeeks > 0 ? formatPlanningWeek(totalVisibleWeeks) : '—';

  const allocWeek = weeks[startIndex];
  const allocStartCode = allocWeek && counts[allocWeek.id] ? formatPlanningWeek(counts[allocWeek.id]) : 'S01';

  const currentItem = yearWeeks.find((item) => item.number === currentYearWeek) || null;
  const currentColumn = currentYearWeek ? weeks.find((week) => week.yearWeek === currentYearWeek && !week.frozen) : null;
  const currentPlanningCode = currentColumn && counts[currentColumn.id] ? formatPlanningWeek(counts[currentColumn.id]) : null;

  let currentWeekHint;
  if (!currentItem) {
    currentWeekHint = `Hoje está fora do calendário de ${year}.`;
  } else {
    const prefix =
      currentYearWeek === todayYearWeek
        ? 'Semana vigente de hoje'
        : `Semana ${currentItem.number} (${currentItem.startLabel} a ${currentItem.endLabel})`;
    currentWeekHint = currentPlanningCode
      ? `${prefix}, destacada no cronograma (coluna ${currentPlanningCode}).`
      : `${prefix}, anterior à semana inicial selecionada.`;
  }

  const freezeIdx = weeks.findIndex((week) => week.frozen);
  const hasFreezeInView = visible.some((week) => week.frozen);
  const postFreezeWeeks = visible.filter((week) => !week.frozen && freezeIdx >= 0 && week.index > freezeIdx);
  const postFreezeRange =
    postFreezeWeeks.length >= 2
      ? `${formatPlanningWeek(counts[postFreezeWeeks[0].id])}–${formatPlanningWeek(counts[postFreezeWeeks[postFreezeWeeks.length - 1].id])}`
      : postFreezeWeeks.length === 1
        ? formatPlanningWeek(counts[postFreezeWeeks[0].id])
        : null;

  let freezeHint;
  if (hasFreezeInView) {
    freezeHint = postFreezeRange
      ? `Sem alocação na coluna congelada; entregas seguem para ${postFreezeRange}.`
      : 'Sem alocação na coluna congelada.';
  } else {
    freezeHint = postFreezeRange
      ? `Congelamento (${freezeDateLabel}) anterior à semana inicial; entregas seguem em ${postFreezeRange}.`
      : `Congelamento em ${freezeDateLabel}.`;
  }

  return {
    counts,
    allocStartCode,
    lastPlanningCode,
    currentPlanningCode,
    postFreezeRange,
    currentWeekHint,
    freezeHint,
  };
}
