/**
 * Motor de simulação do roadmap — módulo de domínio puro e determinístico
 * (contrato: specs/001-modernizar-simulador-roadmap/contracts/simulation-engine.contract.md).
 *
 * Sem dependência de DOM ou React: testável com `node --test`.
 */

import { WEEKS as DEFAULT_WEEKS, DEFAULT_START_WEEK_ID, featureCatalogKey } from '../data/initialRoadmapData.js';
import { fmtNumber, fmtPct, fmtWeeks, plural } from './format.js';

const EPS = 1e-6;
/** Tolerância em histórias (US) para considerar uma feature totalmente alocada no modo manual. */
const MANUAL_US_TOLERANCE = 0.001;
const MAX_RECOMMENDED_PEOPLE = 200;

export const FEATURE_STATUS = Object.freeze({
  EMPTY: 'EMPTY',
  NO_CAPACITY: 'NO_CAPACITY',
  ON_TIME: 'ON_TIME',
  POST_FREEZE: 'POST_FREEZE',
  OUT_OF_WINDOW: 'OUT_OF_WINDOW',
});

export const STATUS_META = Object.freeze({
  ON_TIME: { label: 'No prazo', variant: 'ok', description: 'Concluída até S24, antes do Freezing (17/12).' },
  POST_FREEZE: { label: 'Pós-Freezing', variant: 'warn', description: 'Conclui em S25–S26, depois do congelamento.' },
  OUT_OF_WINDOW: { label: 'Fora da janela', variant: 'bad', description: 'Precisa de semanas além de S26.' },
  NO_CAPACITY: { label: 'Sem capacidade', variant: 'bad', description: 'Squad sem profissionais alocados.' },
  OVERCAPACITY: { label: 'Sobrecarga', variant: 'bad', description: 'Semanas com mais horas que a capacidade.' },
  EMPTY: { label: 'Sem escopo', variant: 'neutral', description: 'Nenhuma história estimada.' },
});

/* ─────────────────────────────────────────────────────────────────────────────
   Calendário
   ────────────────────────────────────────────────────────────────────────── */

function normalizeWeeks(weeks) {
  return weeks.map((week, index) => (week.index === index ? week : { ...week, index }));
}

/** Contexto temporal: semanas elegíveis (a partir do início, sem a coluna congelada). */
export function getWeekContext(weeks = DEFAULT_WEEKS, startWeekId = DEFAULT_START_WEEK_ID) {
  const ws = normalizeWeeks(weeks);
  const freezeIndex = ws.findIndex((week) => week.frozen);
  let startIndex = ws.findIndex((week) => week.id === startWeekId && !week.frozen);
  if (startIndex < 0) startIndex = Math.max(0, ws.findIndex((week) => week.id === DEFAULT_START_WEEK_ID));

  const eligible = ws.filter((week) => week.index >= startIndex && !week.frozen);
  const eligibleBeforeFreeze = eligible.filter((week) => freezeIndex < 0 || week.index < freezeIndex);
  const eligibleAfterFreeze = eligible.filter((week) => freezeIndex >= 0 && week.index > freezeIndex);

  return {
    weeks: ws,
    startIndex,
    freezeIndex,
    eligible,
    eligibleIds: new Set(eligible.map((week) => week.id)),
    eligibleBeforeFreeze,
    eligibleAfterFreeze,
    startWeekCode: ws[startIndex]?.sprintWeek ?? '—',
    lastWeekCode: eligible[eligible.length - 1]?.sprintWeek ?? '—',
    lastBeforeFreezeCode: eligibleBeforeFreeze[eligibleBeforeFreeze.length - 1]?.sprintWeek ?? '—',
  };
}

/** Converte semanas necessárias (a partir do início) em rótulo de término. */
export function endLabelFor(requiredWeeks, ctx) {
  if (!Number.isFinite(requiredWeeks)) return 'Sem capacidade';
  if (requiredWeeks <= EPS) return '—';
  const n = ctx.eligible.length;
  if (n === 0) return `+${fmtWeeks(requiredWeeks)} sem`;
  if (requiredWeeks <= n + EPS) {
    const position = Math.min(n, Math.max(1, Math.ceil(requiredWeeks - EPS)));
    return ctx.eligible[position - 1].sprintWeek;
  }
  return `${ctx.lastWeekCode} + ${fmtWeeks(requiredWeeks - n)} sem`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Agendadores por squad
   ────────────────────────────────────────────────────────────────────────── */

function effortOf(feature, avg) {
  return Math.max(0, Number(feature.stories) || 0) * avg;
}

function scheduleContinuous(squad, premises, ctx) {
  const capacity = squad.people * premises.hoursPerPersonPerWeek;
  const avg = premises.avgHoursPerStory;
  const rows = [];
  const demand = squad.features.reduce((sum, f) => sum + effortOf(f, avg), 0);

  if (capacity <= EPS) {
    for (const feature of squad.features) {
      const effort = effortOf(feature, avg);
      rows.push({ feature, effort, allocatedByWeek: {}, spilloverHours: effort, spilloverWeeks: effort > 0 ? Infinity : 0 });
    }
    return { rows, requiredWeeks: demand > 0 ? Infinity : 0, capacity };
  }

  let slot = 0;
  let remainingCap = capacity;
  for (const feature of squad.features) {
    const effort = effortOf(feature, avg);
    const allocatedByWeek = {};
    let remaining = effort;
    while (remaining > EPS && slot < ctx.eligible.length) {
      const weekId = ctx.eligible[slot].id;
      const consumed = Math.min(remaining, remainingCap);
      allocatedByWeek[weekId] = (allocatedByWeek[weekId] || 0) + consumed;
      remaining -= consumed;
      remainingCap -= consumed;
      if (remainingCap <= EPS) {
        slot += 1;
        remainingCap = capacity;
      }
    }
    const spilloverHours = remaining > EPS ? remaining : 0;
    rows.push({ feature, effort, allocatedByWeek, spilloverHours, spilloverWeeks: spilloverHours / capacity });
  }
  return { rows, requiredWeeks: demand / capacity, capacity };
}

function scheduleWholeWeeks(squad, premises, ctx) {
  const capacity = squad.people * premises.hoursPerPersonPerWeek;
  const avg = premises.avgHoursPerStory;
  const rows = [];

  if (capacity <= EPS) {
    const fallback = scheduleContinuous(squad, premises, ctx);
    return fallback;
  }

  let slot = 0;
  let requiredWeeks = 0;
  for (const feature of squad.features) {
    const effort = effortOf(feature, avg);
    const weeksNeeded = effort > EPS ? Math.ceil(effort / capacity - 1e-9) : 0;
    requiredWeeks += weeksNeeded;
    const allocatedByWeek = {};
    let allocatedSlots = 0;
    let allocatedHours = 0;
    while (allocatedSlots < weeksNeeded && slot < ctx.eligible.length) {
      const hours = Math.min(capacity, effort - allocatedSlots * capacity);
      allocatedByWeek[ctx.eligible[slot].id] = hours;
      allocatedHours += hours;
      allocatedSlots += 1;
      slot += 1;
    }
    const missingSlots = weeksNeeded - allocatedSlots;
    const spilloverHours = missingSlots > 0 ? Math.max(0, effort - allocatedHours) : 0;
    rows.push({ feature, effort, allocatedByWeek, spilloverHours, spilloverWeeks: missingSlots });
  }
  return { rows, requiredWeeks, capacity };
}

function scheduleManual(squad, premises, ctx, manualAllocations) {
  const capacity = squad.people * premises.hoursPerPersonPerWeek;
  const avg = premises.avgHoursPerStory;
  const rows = [];
  let lastUsedSlot = 0;
  let totalSpill = 0;

  for (const feature of squad.features) {
    const effort = effortOf(feature, avg);
    const entries = manualAllocations?.[feature.id] || {};
    const allocatedByWeek = {};
    let allocatedStories = 0;
    ctx.eligible.forEach((week, position) => {
      const stories = Number(entries[week.id]) || 0;
      if (stories > 0) {
        allocatedByWeek[week.id] = stories * avg;
        allocatedStories += stories;
        lastUsedSlot = Math.max(lastUsedSlot, position + 1);
      }
    });
    const stories = Math.max(0, Number(feature.stories) || 0);
    const unallocatedStories = stories - allocatedStories;
    const spilloverHours = unallocatedStories > MANUAL_US_TOLERANCE ? unallocatedStories * avg : 0;
    const overAllocatedHours = -unallocatedStories > MANUAL_US_TOLERANCE ? -unallocatedStories * avg : 0;
    totalSpill += spilloverHours;
    rows.push({
      feature,
      effort,
      allocatedByWeek,
      spilloverHours,
      overAllocatedHours,
      spilloverWeeks: capacity > EPS ? spilloverHours / capacity : spilloverHours > 0 ? Infinity : 0,
    });
  }

  let requiredWeeks;
  if (capacity <= EPS) requiredWeeks = totalSpill > 0 || lastUsedSlot > 0 ? Infinity : 0;
  else requiredWeeks = lastUsedSlot + totalSpill / capacity;
  return { rows, requiredWeeks, capacity };
}

function scheduleSquad(squad, premises, ctx, mode, manualAllocations) {
  if (mode === 'whole_weeks') return scheduleWholeWeeks(squad, premises, ctx);
  if (mode === 'manual') return scheduleManual(squad, premises, ctx, manualAllocations);
  return scheduleContinuous(squad, premises, ctx);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Recomendação de headcount para o Freezing
   ────────────────────────────────────────────────────────────────────────── */

function fitsBeforeFreeze(squad, people, premises, weeksBeforeFreeze, refMode) {
  const capacity = people * premises.hoursPerPersonPerWeek;
  if (capacity <= EPS) return false;
  const avg = premises.avgHoursPerStory;
  if (refMode === 'whole_weeks') {
    let total = 0;
    for (const feature of squad.features) {
      const effort = effortOf(feature, avg);
      if (effort > EPS) total += Math.ceil(effort / capacity - 1e-9);
      if (total > weeksBeforeFreeze) return false;
    }
    return true;
  }
  const demand = squad.features.reduce((sum, f) => sum + effortOf(f, avg), 0);
  return demand / capacity <= weeksBeforeFreeze + EPS;
}

/**
 * Menor número de profissionais que conclui 100% das features da squad até S24 (antes do Freezing).
 * Em `whole_weeks` a busca é iterativa (a soma de arredondamentos não é linear); no modo manual
 * usa o Fluxo Contínuo como referência. Retorna `null` quando é impossível no horizonte.
 */
export function recommendPeopleForFreeze(squad, premises, ctx, mode) {
  const avg = premises.avgHoursPerStory;
  const demand = squad.features.reduce((sum, f) => sum + effortOf(f, avg), 0);
  if (demand <= EPS) return 0;
  const weeksBeforeFreeze = ctx.eligibleBeforeFreeze.length;
  if (weeksBeforeFreeze === 0) return null;
  const refMode = mode === 'whole_weeks' ? 'whole_weeks' : 'continuous';
  let people = Math.max(1, Math.ceil(demand / (weeksBeforeFreeze * premises.hoursPerPersonPerWeek) - 1e-9));
  for (; people <= MAX_RECOMMENDED_PEOPLE; people += 1) {
    if (fitsBeforeFreeze(squad, people, premises, weeksBeforeFreeze, refMode)) return people;
  }
  return null;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Simulação completa
   ────────────────────────────────────────────────────────────────────────── */

function featureStatus({ stories, capacity, spilloverHours, hasPostFreeze }) {
  if (stories <= 0) return FEATURE_STATUS.EMPTY;
  if (capacity <= EPS) return FEATURE_STATUS.NO_CAPACITY;
  if (spilloverHours > EPS) return FEATURE_STATUS.OUT_OF_WINDOW;
  if (hasPostFreeze) return FEATURE_STATUS.POST_FREEZE;
  return FEATURE_STATUS.ON_TIME;
}

/**
 * Executa o cálculo completo do roadmap e do diagnóstico executivo.
 * @param {object} state ScenarioState { premises, squads, manualAllocations }
 * @param {Array} weeks Catálogo temporal (WEEKS)
 */
export function runSimulation(state, weeks = DEFAULT_WEEKS) {
  const premises = state.premises;
  const mode = premises.schedulingMode;
  const effectiveStartWeekId = premises.sprintOneWeekId || premises.startWeekId;
  const ctx = getWeekContext(weeks, effectiveStartWeekId);
  const calendarCtx = getWeekContext(weeks, premises.startWeekId);
  const weekById = new Map(ctx.weeks.map((week) => [week.id, week]));
  const avg = premises.avgHoursPerStory;

  const features = {};
  const featureOrder = [];
  const squads = [];

  for (const squad of state.squads) {
    const { rows, requiredWeeks, capacity } = scheduleSquad(squad, premises, ctx, mode, state.manualAllocations);
    const weeklyUsage = {};
    for (const week of ctx.weeks) {
      if (!week.frozen) weeklyUsage[week.id] = { hours: 0, ratio: 0, isOvercapacity: false, overHours: 0 };
    }

    let demandHours = 0;
    let spilloverWeeks = 0;
    let spilloverHours = 0;
    const statusCounts = { ON_TIME: 0, POST_FREEZE: 0, OUT_OF_WINDOW: 0, NO_CAPACITY: 0, EMPTY: 0 };

    for (const row of rows) {
      const { feature, effort, allocatedByWeek } = row;
      const stories = Math.max(0, Number(feature.stories) || 0);
      demandHours += effort;
      let inHorizon = 0;
      let beforeFreeze = 0;
      let hasPostFreeze = false;
      let firstIndex = Infinity;
      let lastIndex = -Infinity;
      for (const [weekId, hours] of Object.entries(allocatedByWeek)) {
        const week = weekById.get(weekId);
        if (!week || hours <= 0) continue;
        inHorizon += hours;
        if (ctx.freezeIndex < 0 || week.index < ctx.freezeIndex) beforeFreeze += hours;
        else hasPostFreeze = true;
        firstIndex = Math.min(firstIndex, week.index);
        lastIndex = Math.max(lastIndex, week.index);
        weeklyUsage[weekId].hours += hours;
      }
      const status = featureStatus({ stories, capacity, spilloverHours: row.spilloverHours, hasPostFreeze });
      statusCounts[status] += 1;
      spilloverHours += row.spilloverHours;
      if (row.spilloverWeeks > 0) spilloverWeeks += row.spilloverWeeks;

      features[feature.id] = {
        featureId: feature.id,
        squadKey: squad.key,
        stories,
        effortHours: effort,
        estimatedWeeks: capacity > EPS ? effort / capacity : 0,
        allocatedByWeek,
        allocatedHoursInHorizon: inHorizon,
        allocatedHoursBeforeFreeze: beforeFreeze,
        overAllocatedHours: row.overAllocatedHours || 0,
        spilloverHours: row.spilloverHours,
        spilloverWeeks: row.spilloverWeeks,
        startWeekCode: Number.isFinite(firstIndex) ? ctx.weeks[firstIndex].sprintWeek : null,
        endWeekCode: Number.isFinite(lastIndex) ? ctx.weeks[lastIndex].sprintWeek : null,
        endLabel:
          row.spilloverHours > EPS
            ? Number.isFinite(row.spilloverWeeks)
              ? `${ctx.lastWeekCode} + ${fmtWeeks(row.spilloverWeeks)} sem`
              : 'Sem capacidade'
            : Number.isFinite(lastIndex)
              ? ctx.weeks[lastIndex].sprintWeek
              : '—',
        status,
      };
      featureOrder.push(feature.id);
    }

    const overcapacityWeeks = [];
    for (const [weekId, usage] of Object.entries(weeklyUsage)) {
      usage.ratio = capacity > EPS ? usage.hours / capacity : usage.hours > 0 ? Infinity : 0;
      if (usage.hours > capacity + EPS) {
        usage.isOvercapacity = true;
        usage.overHours = usage.hours - capacity;
        overcapacityWeeks.push(weekId);
      }
    }

    const recommended = recommendPeopleForFreeze(squad, premises, ctx, mode);
    let status;
    if (demandHours <= EPS) status = 'EMPTY';
    else if (capacity <= EPS) status = 'NO_CAPACITY';
    else if (mode === 'manual' && overcapacityWeeks.length > 0) status = 'OVERCAPACITY';
    else if (statusCounts.OUT_OF_WINDOW > 0) status = 'OUT_OF_WINDOW';
    else if (statusCounts.POST_FREEZE > 0) status = 'POST_FREEZE';
    else status = 'ON_TIME';

    squads.push({
      squadKey: squad.key,
      title: squad.title,
      shortName: squad.shortName || `Squad ${squad.key}`,
      colorToken: squad.colorToken,
      people: squad.people,
      weeklyCapacityHours: capacity,
      availableHoursBeforeFreeze: ctx.eligibleBeforeFreeze.length * capacity,
      availableHoursTotalHorizon: ctx.eligible.length * capacity,
      demandHours,
      stories: squad.features.reduce((sum, f) => sum + Math.max(0, Number(f.stories) || 0), 0),
      requiredWeeks,
      spilloverWeeks,
      spilloverHours,
      weeksBeyondFreeze: Number.isFinite(requiredWeeks)
        ? Math.max(0, requiredWeeks - ctx.eligibleBeforeFreeze.length)
        : Infinity,
      recommendedPeopleForFreeze: recommended,
      peopleDeltaForFreeze: recommended === null ? null : Math.max(0, recommended - squad.people),
      weeklyUsage,
      overcapacityWeeks,
      statusCounts,
      endLabel: endLabelFor(requiredWeeks, ctx),
      status,
    });
  }

  const kpis = buildKpis(state, squads, features, ctx);
  const curve = buildCurve(ctx, calendarCtx.startIndex, squads, features, kpis, avg);

  return {
    mode,
    premises,
    context: {
      startIndex: ctx.startIndex,
      calendarStartIndex: calendarCtx.startIndex,
      freezeIndex: ctx.freezeIndex,
      startWeekCode: ctx.startWeekCode,
      calendarStartWeekCode: calendarCtx.startWeekCode,
      lastWeekCode: ctx.lastWeekCode,
      lastBeforeFreezeCode: ctx.lastBeforeFreezeCode,
      eligibleCount: ctx.eligible.length,
      eligibleBeforeFreezeCount: ctx.eligibleBeforeFreeze.length,
      eligibleAfterFreezeCount: ctx.eligibleAfterFreeze.length,
      eligibleWeekIds: [...ctx.eligibleIds],
    },
    features,
    featureOrder,
    squads,
    kpis,
    curve,
  };
}

/** Status consolidado de uma feature potencialmente dividida entre múltiplas squads (prevalece a situação mais crítica entre as fatias com escopo). */
export function aggregateFeatureStatus(schedules) {
  const active = schedules.filter((s) => s && s.stories > 0);
  if (active.length === 0) return FEATURE_STATUS.EMPTY;
  if (active.some((s) => s.status === FEATURE_STATUS.NO_CAPACITY)) return FEATURE_STATUS.NO_CAPACITY;
  if (active.some((s) => s.status === FEATURE_STATUS.OUT_OF_WINDOW)) return FEATURE_STATUS.OUT_OF_WINDOW;
  if (active.some((s) => s.status === FEATURE_STATUS.POST_FREEZE)) return FEATURE_STATUS.POST_FREEZE;
  return FEATURE_STATUS.ON_TIME;
}

function buildKpis(state, squads, features, ctx) {
  const all = Object.values(features);
  const totalStories = all.reduce((sum, f) => sum + f.stories, 0);
  const totalDemandHours = all.reduce((sum, f) => sum + f.effortHours, 0);
  const onTimeSlices = all.filter((f) => f.status === FEATURE_STATUS.ON_TIME);
  const storiesOnTime = onTimeSlices.reduce((sum, f) => sum + f.stories, 0);
  const hoursBeforeFreeze = all.reduce((sum, f) => sum + Math.min(f.allocatedHoursBeforeFreeze, f.effortHours), 0);
  const totalWeeklyCapacity = squads.reduce((sum, s) => sum + s.weeklyCapacityHours, 0);
  const withDemand = squads.filter((s) => s.demandHours > EPS);

  // Consolida features compartilhadas (mesma feature do mesmo épico) para não duplicar a contagem de features
  const groupedFeatures = new Map();
  for (const squad of state.squads) {
    for (const feature of squad.features) {
      const key = featureCatalogKey(feature.epic, feature.name);
      if (!groupedFeatures.has(key)) groupedFeatures.set(key, []);
      const sched = features[feature.id];
      if (sched) groupedFeatures.get(key).push(sched);
    }
  }
  const consolidated = [...groupedFeatures.values()].map((schedules) => ({
    stories: schedules.reduce((sum, s) => sum + s.stories, 0),
    status: aggregateFeatureStatus(schedules),
  }));

  let bottleneck = null;
  for (const squad of withDemand) {
    if (!bottleneck || squad.requiredWeeks > bottleneck.requiredWeeks) bottleneck = squad;
  }
  const globalRequiredWeeks = bottleneck ? bottleneck.requiredWeeks : 0;
  const recommendations = squads.map((s) => s.recommendedPeopleForFreeze);
  const hasImpossible = recommendations.some((r) => r === null);

  return {
    totalFeatures: consolidated.length,
    featuresWithScope: consolidated.filter((f) => f.stories > 0).length,
    totalStories,
    totalDemandHours,
    totalPeople: squads.reduce((sum, s) => sum + s.people, 0),
    totalWeeklyCapacity,
    availableHoursBeforeFreeze: ctx.eligibleBeforeFreeze.length * totalWeeklyCapacity,
    availableHoursTotalHorizon: ctx.eligible.length * totalWeeklyCapacity,
    balanceHoursBeforeFreeze: ctx.eligibleBeforeFreeze.length * totalWeeklyCapacity - totalDemandHours,
    featuresCompletedBeforeFreeze: consolidated.filter((f) => f.status === FEATURE_STATUS.ON_TIME).length,
    storiesCompletedBeforeFreeze: storiesOnTime,
    completionPctBeforeFreeze: totalStories > 0 ? storiesOnTime / totalStories : 1,
    hoursDeliveredBeforeFreeze: hoursBeforeFreeze,
    hoursPctBeforeFreeze: totalDemandHours > 0 ? hoursBeforeFreeze / totalDemandHours : 1,
    featuresPostFreeze: consolidated.filter((f) => f.status === FEATURE_STATUS.POST_FREEZE).length,
    featuresOutOfWindow: consolidated.filter((f) => f.status === FEATURE_STATUS.OUT_OF_WINDOW).length,
    featuresNoCapacity: consolidated.filter((f) => f.status === FEATURE_STATUS.NO_CAPACITY).length,
    totalSpilloverHours: all.reduce((sum, f) => sum + f.spilloverHours, 0),
    bottleneckSquadKey: bottleneck ? bottleneck.squadKey : null,
    maxRequiredWeeks: globalRequiredWeeks,
    globalSpilloverWeeks: Number.isFinite(globalRequiredWeeks)
      ? Math.max(0, globalRequiredWeeks - ctx.eligible.length)
      : Infinity,
    globalEndLabel: endLabelFor(globalRequiredWeeks, ctx),
    squadsOnTime: squads.filter((s) => s.status === 'ON_TIME' || s.status === 'EMPTY').length,
    totalRecommendedPeople: hasImpossible ? null : recommendations.reduce((sum, r) => sum + r, 0),
    totalAdditionalPeopleNeeded: squads.reduce((sum, s) => sum + (s.peopleDeltaForFreeze || 0), 0),
    overcapacityWeeksCount: squads.reduce((sum, s) => sum + s.overcapacityWeeks.length, 0),
  };
}

function buildCurve(ctx, calendarStartIndex, squads, features, kpis, avg) {
  const all = Object.values(features);
  let plannedCumulative = 0;
  let capacityCumulative = 0;
  // A curva começa na primeira coluna do roadmap (S05) ou na semana inicial visível, o que vier antes.
  const firstRoadmapIndex = Math.max(0, ctx.weeks.findIndex((week) => week.inRoadmap !== false));
  const curveStart = Math.min(calendarStartIndex, ctx.startIndex, firstRoadmapIndex);
  return ctx.weeks.filter((week) => week.index >= curveStart).map((week) => {
    const planned = all.reduce((sum, f) => sum + (f.allocatedByWeek[week.id] || 0), 0);
    const capacity = ctx.eligibleIds.has(week.id) ? kpis.totalWeeklyCapacity : 0;
    plannedCumulative += planned;
    capacityCumulative += capacity;
    return {
      weekId: week.id,
      index: week.index,
      sprintWeek: week.sprintWeek,
      dateLabel: week.dateLabel,
      month: week.month,
      milestone: week.milestone,
      frozen: week.frozen,
      plannedHours: planned,
      plannedCumulativeHours: plannedCumulative,
      capacityCumulativeHours: capacityCumulative,
      completedStoriesEquivalent: avg > 0 ? plannedCumulative / avg : 0,
      pctOfDemand: kpis.totalDemandHours > 0 ? plannedCumulative / kpis.totalDemandHours : 0,
    };
  });
}

/* ─────────────────────────────────────────────────────────────────────────────
   Alocação manual
   ────────────────────────────────────────────────────────────────────────── */

function roundStories(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Converte a alocação calculada de um modo automático em um ManualAllocationMap (US por semana,
 * 2 casas decimais). Quando a feature foi totalmente alocada, a última semana absorve o
 * arredondamento para que a soma bata exatamente com as histórias da feature.
 */
export function deriveManualAllocationsFromResult(simulationResult, avgHoursPerStory) {
  const map = {};
  if (!(avgHoursPerStory > 0)) return map;
  for (const id of simulationResult.featureOrder) {
    const schedule = simulationResult.features[id];
    const entries = Object.entries(schedule.allocatedByWeek).filter(([, hours]) => hours > EPS);
    if (entries.length === 0) continue;
    const row = {};
    let sum = 0;
    entries.forEach(([weekId, hours], i) => {
      const isLast = i === entries.length - 1;
      let value = roundStories(hours / avgHoursPerStory);
      if (isLast && schedule.spilloverHours <= EPS) value = roundStories(schedule.stories - sum);
      if (value > 0) {
        row[weekId] = value;
        sum = roundStories(sum + value);
      }
    });
    if (Object.keys(row).length > 0) map[id] = row;
  }
  return map;
}

/** Remove entradas inválidas (≤ 0, NaN, semanas congeladas ou inexistentes) do mapa manual. */
export function sanitizeManualAllocations(manualAllocations, weeks = DEFAULT_WEEKS) {
  const validWeekIds = new Set(weeks.filter((week) => !week.frozen).map((week) => week.id));
  const clean = {};
  for (const [featureId, row] of Object.entries(manualAllocations || {})) {
    if (!row || typeof row !== 'object') continue;
    const nextRow = {};
    for (const [weekId, value] of Object.entries(row)) {
      const n = Number(value);
      if (validWeekIds.has(weekId) && Number.isFinite(n) && n > 0) nextRow[weekId] = roundStories(n);
    }
    if (Object.keys(nextRow).length > 0) clean[featureId] = nextRow;
  }
  return clean;
}

/** Define (ou limpa) as histórias de uma célula manual Feature × Semana, respeitando o Freezing. */
export function setManualCellValue(manualAllocations, featureId, weekId, value, weeks = DEFAULT_WEEKS) {
  const week = weeks.find((w) => w.id === weekId);
  if (!week || week.frozen) return manualAllocations;
  const n = Number(value);
  const next = { ...manualAllocations };
  const row = { ...(next[featureId] || {}) };
  if (!Number.isFinite(n) || n <= 0) delete row[weekId];
  else row[weekId] = roundStories(Math.min(n, 200));
  if (Object.keys(row).length > 0) next[featureId] = row;
  else delete next[featureId];
  return next;
}

/**
 * Distribui automaticamente uma única feature no modo manual a partir da semana inicial,
 * usando apenas o saldo de capacidade deixado pelas demais features da squad.
 */
export function autoDistributeSingleFeature(state, featureId, weeks = DEFAULT_WEEKS) {
  const squad = state.squads.find((s) => s.features.some((f) => f.id === featureId));
  if (!squad) return state.manualAllocations;
  const feature = squad.features.find((f) => f.id === featureId);
  const { premises } = state;
  const avg = premises.avgHoursPerStory;
  const capacity = squad.people * premises.hoursPerPersonPerWeek;
  const ctx = getWeekContext(weeks, premises.sprintOneWeekId || premises.startWeekId);
  const next = { ...state.manualAllocations };
  delete next[featureId];
  if (capacity <= EPS || !(avg > 0)) return next;

  const usedStoriesByWeek = {};
  for (const other of squad.features) {
    if (other.id === featureId) continue;
    for (const [weekId, stories] of Object.entries(next[other.id] || {})) {
      usedStoriesByWeek[weekId] = (usedStoriesByWeek[weekId] || 0) + (Number(stories) || 0);
    }
  }

  const capacityStories = capacity / avg;
  let remaining = Math.max(0, Number(feature.stories) || 0);
  const row = {};
  for (const week of ctx.eligible) {
    if (remaining <= MANUAL_US_TOLERANCE) break;
    const free = capacityStories - (usedStoriesByWeek[week.id] || 0);
    if (free <= MANUAL_US_TOLERANCE) continue;
    const take = Math.min(free, remaining);
    const rounded = roundStories(take);
    if (rounded <= 0) continue;
    row[week.id] = rounded;
    remaining = roundStories(remaining - rounded);
  }
  if (Object.keys(row).length > 0) next[featureId] = row;
  return next;
}

/** Limpa a alocação manual de uma feature. */
export function clearFeatureAllocation(manualAllocations, featureId) {
  if (!manualAllocations?.[featureId]) return manualAllocations;
  const next = { ...manualAllocations };
  delete next[featureId];
  return next;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Patches e Copiloto
   ────────────────────────────────────────────────────────────────────────── */

/** Aplica um patch serializável { premises?, squadPeople? } ao cenário (função pura). */
export function applyScenarioPatch(state, patch) {
  let next = state;
  if (patch?.premises) next = { ...next, premises: { ...next.premises, ...patch.premises } };
  if (patch?.squadPeople) {
    next = {
      ...next,
      squads: next.squads.map((squad) =>
        Object.prototype.hasOwnProperty.call(patch.squadPeople, squad.key)
          ? { ...squad, people: patch.squadPeople[squad.key] }
          : squad,
      ),
    };
  }
  return next;
}

/** Impressão digital leve (djb2) do cenário, usada para detectar propostas desatualizadas. */
export function computeScenarioFingerprint(state) {
  const payload = JSON.stringify({
    p: state.premises,
    s: state.squads.map((squad) => [squad.key, squad.people, squad.features.map((f) => [f.id, f.epic, f.name, f.stories])]),
    m: state.manualAllocations,
  });
  let hash = 5381;
  for (let i = 0; i < payload.length; i += 1) hash = ((hash << 5) + hash + payload.charCodeAt(i)) | 0;
  return (hash >>> 0).toString(36);
}

/**
 * Gera respostas contextuais e propostas confirmáveis para o painel do Copiloto
 * (DS §8.4 / §20.5): nada é aplicado sem confirmação explícita do usuário.
 */
export function buildCopilotInsights(state, result, weeks = DEFAULT_WEEKS) {
  const fingerprint = computeScenarioFingerprint(state);
  const { kpis, squads, context } = result;
  const bottleneck = squads.find((s) => s.squadKey === kpis.bottleneckSquadKey);
  const deficit = squads.filter((s) => (s.peopleDeltaForFreeze || 0) > 0);
  const impossible = squads.filter((s) => s.recommendedPeopleForFreeze === null);

  const insights = [
    {
      id: 'bottleneck',
      question: 'Qual squad é o gargalo do roadmap?',
      title: bottleneck ? `${bottleneck.shortName} é o gargalo` : 'Nenhum gargalo identificado',
      paragraphs: bottleneck
        ? [
          Number.isFinite(bottleneck.requiredWeeks)
            ? `${bottleneck.shortName} precisa de ${fmtWeeks(bottleneck.requiredWeeks)} semanas para concluir ${plural(bottleneck.stories, 'história', 'histórias')}, frente a ${context.eligibleBeforeFreezeCount} semanas úteis até o Freezing e ${context.eligibleCount} até ${context.lastWeekCode}.`
            : `${bottleneck.shortName} está sem profissionais e não tem capacidade para entregar ${plural(bottleneck.stories, 'história', 'histórias')}.`,
          `Término previsto do backlog: ${kpis.globalEndLabel}.`,
        ]
        : ['Todas as squads estão sem escopo pendente.'],
      bullets: squads
        .filter((s) => s.demandHours > 0)
        .map((s) => `${s.shortName}: ${Number.isFinite(s.requiredWeeks) ? `${fmtWeeks(s.requiredWeeks)} semanas` : 'sem capacidade'} · ${STATUS_META[s.status]?.label ?? s.status}`),
    },
    {
      id: 'headcount',
      question: 'Quantos profissionais faltam para entregar até o Freezing?',
      title:
        kpis.totalAdditionalPeopleNeeded > 0
          ? `Faltam ${plural(kpis.totalAdditionalPeopleNeeded, 'profissional', 'profissionais')}`
          : 'O time atual entrega tudo até o Freezing',
      paragraphs: [
        kpis.totalAdditionalPeopleNeeded > 0
          ? `Para concluir 100% do escopo até ${context.lastBeforeFreezeCode} (antes de 17/12) no modo atual, o portfólio precisa de ${plural(kpis.totalAdditionalPeopleNeeded, 'profissional adicional', 'profissionais adicionais')}.`
          : 'Nenhuma squad precisa de reforço no cenário atual.',
        ...(impossible.length
          ? [`Sem solução no horizonte para: ${impossible.map((s) => s.shortName).join(', ')} (há mais features do que semanas disponíveis).`]
          : []),
      ],
      bullets: deficit.map(
        (s) => `${s.shortName}: ${s.people} → ${s.recommendedPeopleForFreeze} (+${s.peopleDeltaForFreeze})`,
      ),
    },
    {
      id: 'freeze-delivery',
      question: 'Quanto do escopo entregamos até 17/12?',
      title: `${fmtPct(kpis.completionPctBeforeFreeze)} das histórias até o Freezing`,
      paragraphs: [
        `${plural(kpis.featuresCompletedBeforeFreeze, 'feature concluída', 'features concluídas')} de ${kpis.featuresWithScope} com escopo (${fmtNumber(kpis.storiesCompletedBeforeFreeze)} de ${fmtNumber(kpis.totalStories)} US).`,
        `${plural(kpis.featuresPostFreeze, 'feature termina', 'features terminam')} depois do congelamento e ${plural(kpis.featuresOutOfWindow, 'fica', 'ficam')} fora da janela de ${context.lastWeekCode}.`,
      ],
      bullets: [],
    },
  ];

  const continuous = state.premises.schedulingMode === 'continuous'
    ? result
    : runSimulation({ ...state, premises: { ...state.premises, schedulingMode: 'continuous' } }, weeks);
  const whole = state.premises.schedulingMode === 'whole_weeks'
    ? result
    : runSimulation({ ...state, premises: { ...state.premises, schedulingMode: 'whole_weeks' } }, weeks);
  insights.push({
    id: 'mode-compare',
    question: 'Comparar Fluxo Contínuo × Semanas Inteiras',
    title: 'Comparação entre modalidades',
    paragraphs: [
      `Fluxo Contínuo: ${fmtPct(continuous.kpis.completionPctBeforeFreeze)} das histórias até o Freezing, término em ${continuous.kpis.globalEndLabel}.`,
      `Semanas Inteiras: ${fmtPct(whole.kpis.completionPctBeforeFreeze)} das histórias até o Freezing, término em ${whole.kpis.globalEndLabel}.`,
    ],
    bullets: continuous.squads.map((s, i) => {
      const w = whole.squads[i];
      return `${s.shortName}: ${fmtWeeks(s.requiredWeeks)} × ${fmtWeeks(w.requiredWeeks, 0)} semanas`;
    }),
  });

  const proposals = [];
  if (deficit.length > 0) {
    const squadPeople = {};
    deficit.forEach((s) => {
      squadPeople[s.squadKey] = s.recommendedPeopleForFreeze;
    });
    proposals.push({
      id: 'balance-for-freeze',
      title: 'Balancear squads para entregar até o Freezing',
      summary: `Ajusta o número de profissionais das squads deficitárias para concluir 100% do escopo até ${context.lastBeforeFreezeCode}.`,
      contextFingerprint: fingerprint,
      changes: deficit.map((s) => ({
        label: `${s.shortName} — profissionais`,
        from: String(s.people),
        to: String(s.recommendedPeopleForFreeze),
      })),
      patch: { squadPeople },
    });
  }

  if (
    state.premises.schedulingMode === 'whole_weeks' &&
    continuous.kpis.storiesCompletedBeforeFreeze > whole.kpis.storiesCompletedBeforeFreeze
  ) {
    proposals.push({
      id: 'switch-to-continuous',
      title: 'Usar Fluxo Contínuo',
      summary: `Aproveita o saldo de horas das semanas e eleva as entregas até o Freezing de ${fmtPct(whole.kpis.completionPctBeforeFreeze)} para ${fmtPct(continuous.kpis.completionPctBeforeFreeze)}.`,
      contextFingerprint: fingerprint,
      changes: [{ label: 'Modalidade de alocação', from: 'Semanas Inteiras', to: 'Fluxo Contínuo' }],
      patch: { premises: { schedulingMode: 'continuous' } },
    });
  }

  const weeksBefore = context.eligibleBeforeFreezeCount;
  const activeSquads = state.squads.filter((s) => s.features.some((f) => f.stories > 0));
  const canSlice = weeksBefore > 0 && activeSquads.length > 0 && activeSquads.every((s) => s.people > 0);
  if (canSlice) {
    const target = Math.min(
      ...activeSquads.map((s) => {
        const stories = s.features.reduce((sum, f) => sum + Math.max(0, f.stories), 0);
        return Math.floor((weeksBefore * s.people * state.premises.hoursPerPersonPerWeek) / stories);
      }),
    );
    if (target >= 1 && target < state.premises.avgHoursPerStory) {
      proposals.push({
        id: 'optimize-story-slicing',
        title: 'Fatiar histórias menores',
        summary: `Com histórias de até ${target} h (Fluxo Contínuo), todas as squads cabem antes do Freezing sem alterar o time${target < 16 ? ' — meta agressiva, abaixo da faixa usual' : ''}.`,
        contextFingerprint: fingerprint,
        changes: [
          { label: 'Média de horas por história', from: `${state.premises.avgHoursPerStory} h`, to: `${target} h` },
        ],
        patch: { premises: { avgHoursPerStory: target } },
      });
    }
  }

  return { fingerprint, insights, proposals };
}
