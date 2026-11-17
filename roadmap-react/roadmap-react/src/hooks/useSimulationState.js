import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  WEEKS,
  LIMITS,
  SCHEDULING_MODE_IDS,
  createInitialScenario,
  resolveYearWeek,
  weekIdToYearWeek,
  createNewSquad,
  createCustomSquad,
  associateFeatureInScenario,
  moveFeatureInScenario,
  removeFeatureInScenario,
  BASE_SQUAD_KEYS,
  normalizeSquadName,
  formatSquadShortName,
} from '../data/initialRoadmapData.js';
import {
  runSimulation,
  deriveManualAllocationsFromResult,
  setManualCellValue,
  autoDistributeSingleFeature,
  clearFeatureAllocation,
  applyScenarioPatch,
} from '../domain/simulationEngine.js';
import { loadScenario, saveScenario } from '../domain/scenarioSerializer.js';

const HISTORY_LIMIT = 30;
const COALESCE_MS = 900;
const RESET_ARM_MS = 4000;

function getStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function initStore() {
  const { scenario, source } = loadScenario(getStorage());
  return { scenario, past: [], lastKey: null, lastAt: 0, lastLabel: null, source };
}

function reducer(store, action) {
  switch (action.type) {
    case 'commit': {
      const next = action.updater(store.scenario);
      if (!next || next === store.scenario) return store;
      const coalesce =
        action.coalesceKey && store.lastKey === action.coalesceKey && action.at - store.lastAt < COALESCE_MS;
      const past = coalesce ? store.past : [...store.past, store.scenario].slice(-HISTORY_LIMIT);
      return { ...store, scenario: next, past, lastKey: action.coalesceKey || null, lastAt: action.at, lastLabel: action.label };
    }
    case 'undo': {
      if (store.past.length === 0) return store;
      const previous = store.past[store.past.length - 1];
      return { ...store, scenario: previous, past: store.past.slice(0, -1), lastKey: null, lastAt: 0, lastLabel: 'Desfazer' };
    }
    default:
      return store;
  }
}

function clampInt(value, { min, max }) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function hasManualEntries(manualAllocations) {
  return Object.keys(manualAllocations || {}).length > 0;
}

/**
 * Estado central do simulador: cenário validado, resultado derivado (memoizado),
 * persistência automática, histórico para Desfazer (30 níveis) e restauração em dois cliques.
 */
export function useSimulationState() {
  const [store, dispatch] = useReducer(reducer, undefined, initStore);
  const { scenario } = store;
  const result = useMemo(() => runSimulation(scenario, WEEKS), [scenario]);

  useEffect(() => {
    saveScenario(getStorage(), scenario);
  }, [scenario]);

  const commit = useCallback((updater, label, coalesceKey) => {
    dispatch({ type: 'commit', updater, label, coalesceKey, at: Date.now() });
  }, []);

  /* ── Premissas ─────────────────────────────────────────── */
  const setAvgHoursPerStory = useCallback(
    (value) => {
      const v = clampInt(value, LIMITS.avgHoursPerStory);
      if (v === null) return;
      commit((s) => (s.premises.avgHoursPerStory === v ? s : { ...s, premises: { ...s.premises, avgHoursPerStory: v } }), 'Média de horas por história', 'avg');
    },
    [commit],
  );

  const setHoursPerPerson = useCallback(
    (value) => {
      const v = clampInt(value, LIMITS.hoursPerPersonPerWeek);
      if (v === null) return;
      commit((s) => (s.premises.hoursPerPersonPerWeek === v ? s : { ...s, premises: { ...s.premises, hoursPerPersonPerWeek: v } }), 'Jornada semanal', 'hpp');
    },
    [commit],
  );

  const setStartWeek = useCallback(
    (weekId) => {
      const week = WEEKS.find((w) => w.id === weekId);
      if (!week || week.frozen) return;
      commit(
        (s) => {
          if (s.premises.startWeekId === weekId) return s;
          const prevSprintOne = s.premises.sprintOneWeekId ? WEEKS.find((w) => w.id === s.premises.sprintOneWeekId) : null;
          const sprintOneWeekId = prevSprintOne && prevSprintOne.index < week.index ? weekId : s.premises.sprintOneWeekId ?? null;
          return {
            ...s,
            premises: { ...s.premises, startWeekId: weekId, startYearWeek: weekIdToYearWeek(weekId), sprintOneWeekId },
          };
        },
        'Semana inicial',
      );
    },
    [commit],
  );

  /** Define a semana em que a Sprint 01 começa (null volta às sprints do roadmap). */
  const setSprintOneWeek = useCallback(
    (weekId) => {
      const valid = weekId && WEEKS.some((week) => week.id === weekId && !week.frozen) ? weekId : null;
      commit((s) => ((s.premises.sprintOneWeekId ?? null) === valid ? s : { ...s, premises: { ...s.premises, sprintOneWeekId: valid } }), 'Sprint 01');
    },
    [commit],
  );

  /** Semana inicial escolhida entre todas as semanas do ano (ISO), mapeada para o calendário do roadmap. */
  const setStartYearWeek = useCallback(
    (number) => {
      const resolved = resolveYearWeek(Number(number));
      if (!resolved) return;
      const nextStartWeek = WEEKS.find((w) => w.id === resolved.weekId);
      commit(
        (s) => {
          if (s.premises.startYearWeek === Number(number) && s.premises.startWeekId === resolved.weekId) return s;
          const prevSprintOne = s.premises.sprintOneWeekId ? WEEKS.find((w) => w.id === s.premises.sprintOneWeekId) : null;
          const sprintOneWeekId =
            prevSprintOne && nextStartWeek && prevSprintOne.index < nextStartWeek.index
              ? resolved.weekId
              : s.premises.sprintOneWeekId ?? null;
          return {
            ...s,
            premises: { ...s.premises, startWeekId: resolved.weekId, startYearWeek: Number(number), sprintOneWeekId },
          };
        },
        'Semana inicial',
      );
    },
    [commit],
  );

  const setSchedulingMode = useCallback(
    (mode) => {
      if (!SCHEDULING_MODE_IDS.includes(mode)) return;
      commit((s) => {
        if (s.premises.schedulingMode === mode) return s;
        let manualAllocations = s.manualAllocations;
        if (mode === 'manual' && !hasManualEntries(manualAllocations)) {
          // Inicializa a grade manual a partir da distribuição vigente (ajustes pontuais).
          manualAllocations = deriveManualAllocationsFromResult(runSimulation(s, WEEKS), s.premises.avgHoursPerStory);
        }
        return { ...s, premises: { ...s.premises, schedulingMode: mode }, manualAllocations };
      }, 'Modalidade de alocação');
    },
    [commit],
  );

  /* ── Squads e features ─────────────────────────────────── */
  const setSquadName = useCallback(
    (squadKey, rawName) => {
      const name = normalizeSquadName(squadKey, rawName);
      commit(
        (s) => {
          const squad = s.squads.find((q) => q.key === squadKey);
          if (!squad || squad.name === name) return s;
          const shortName = formatSquadShortName(squadKey, name);
          return {
            ...s,
            squads: s.squads.map((q) => (q.key === squadKey ? { ...q, name, shortName } : q)),
          };
        },
        `Nome da Squad ${squadKey}`,
        `squad-name-${squadKey}`,
      );
    },
    [commit],
  );

  const setSquadPeople = useCallback(
    (squadKey, value) => {
      const v = clampInt(value, LIMITS.people);
      if (v === null) return;
      commit(
        (s) => {
          const squad = s.squads.find((q) => q.key === squadKey);
          if (!squad || squad.people === v) return s;
          return { ...s, squads: s.squads.map((q) => (q.key === squadKey ? { ...q, people: v } : q)) };
        },
        `Profissionais da Squad ${squadKey}`,
        `people-${squadKey}`,
      );
    },
    [commit],
  );

  const setFeatureStories = useCallback(
    (featureId, value) => {
      const v = clampInt(value, LIMITS.stories);
      if (v === null) return;
      commit(
        (s) => ({
          ...s,
          squads: s.squads.map((q) =>
            q.features.some((f) => f.id === featureId)
              ? { ...q, features: q.features.map((f) => (f.id === featureId ? { ...f, stories: v } : f)) }
              : q,
          ),
        }),
        'Histórias da feature',
        `stories-${featureId}`,
      );
    },
    [commit],
  );

  /** Adiciona uma squad nova (E, F, G…) que passa a compor a simulação (capacidade e demanda). */
  const addSquad = useCallback(() => {
    commit((s) => {
      const created = createNewSquad(s.squads.map((q) => q.key));
      return created ? { ...s, squads: [...s.squads, created] } : s;
    }, 'Adicionar squad');
  }, [commit]);

  /** Cria uma squad personalizada na aba "Escopo das Squads" integrada à simulação. */
  const addCustomSquad = useCallback(
    (options) => {
      commit((s) => {
        const created = createCustomSquad(s.squads.map((q) => q.key), options);
        return created ? { ...s, squads: [...s.squads, created] } : s;
      }, 'Criar squad');
    },
    [commit],
  );

  /** Associa uma feature com sua quantidade de histórias a uma squad específica. */
  const associateFeature = useCallback(
    (squadKey, payload) => {
      commit((s) => associateFeatureInScenario(s, squadKey, payload), `Associar feature à Squad ${squadKey}`);
    },
    [commit],
  );

  /** Move uma feature existente de uma squad para outra. */
  const moveFeature = useCallback(
    (featureId, targetSquadKey) => {
      commit((s) => moveFeatureInScenario(s, featureId, targetSquadKey), 'Alterar squad da feature');
    },
    [commit],
  );

  /** Desassocia/remove uma feature de uma squad. */
  const removeFeature = useCallback(
    (featureId) => {
      commit((s) => removeFeatureInScenario(s, featureId), 'Remover feature da squad');
    },
    [commit],
  );
  /** Remove uma squad adicionada pelo usuário (as squads do catálogo base não podem ser removidas). */
  const removeSquad = useCallback(
    (squadKey) => {
      if (BASE_SQUAD_KEYS.includes(squadKey)) return;
      commit((s) => {
        const squad = s.squads.find((q) => q.key === squadKey);
        if (!squad) return s;
        const manualAllocations = { ...s.manualAllocations };
        squad.features.forEach((feature) => delete manualAllocations[feature.id]);
        return { ...s, squads: s.squads.filter((q) => q.key !== squadKey), manualAllocations };
      }, 'Remover squad');
    },
    [commit],
  );

  /* ── Alocação manual ───────────────────────────────────── */
  const setManualCell = useCallback(
    (featureId, weekId, value) => {
      commit(
        (s) => {
          const manualAllocations = setManualCellValue(s.manualAllocations, featureId, weekId, value, WEEKS);
          return manualAllocations === s.manualAllocations ? s : { ...s, manualAllocations };
        },
        'Alocação manual',
        `cell-${featureId}-${weekId}`,
      );
    },
    [commit],
  );

  const autoDistributeFeature = useCallback(
    (featureId) => {
      commit((s) => ({ ...s, manualAllocations: autoDistributeSingleFeature(s, featureId, WEEKS) }), 'Auto-distribuir feature');
    },
    [commit],
  );

  const clearFeature = useCallback(
    (featureId) => {
      commit((s) => {
        const manualAllocations = clearFeatureAllocation(s.manualAllocations, featureId);
        return manualAllocations === s.manualAllocations ? s : { ...s, manualAllocations };
      }, 'Limpar alocação da feature');
    },
    [commit],
  );

  const reseedManualFromAuto = useCallback(
    (sourceMode = 'continuous') => {
      commit((s) => {
        const auto = runSimulation({ ...s, premises: { ...s.premises, schedulingMode: sourceMode } }, WEEKS);
        return { ...s, manualAllocations: deriveManualAllocationsFromResult(auto, s.premises.avgHoursPerStory) };
      }, 'Redistribuir grade manual');
    },
    [commit],
  );

  /* ── Patches, importação, desfazer e restaurar ─────────── */
  const applyPatch = useCallback(
    (patch, label = 'Proposta do Delta') => {
      commit((s) => applyScenarioPatch(s, patch), label);
    },
    [commit],
  );

  const replaceScenario = useCallback(
    (next, label = 'Importar cenário') => {
      commit(() => next, label);
    },
    [commit],
  );

  const undo = useCallback(() => dispatch({ type: 'undo' }), []);

  const [resetArmed, setResetArmed] = useState(false);
  const resetTimer = useRef(null);

  const disarmReset = useCallback(() => {
    window.clearTimeout(resetTimer.current);
    setResetArmed(false);
  }, []);

  /** Primeiro clique arma (4 s); segundo clique restaura. Retorna 'armed' | 'reset'. */
  const requestReset = useCallback(() => {
    if (!resetArmed) {
      setResetArmed(true);
      window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setResetArmed(false), RESET_ARM_MS);
      return 'armed';
    }
    window.clearTimeout(resetTimer.current);
    setResetArmed(false);
    commit(() => createInitialScenario(), 'Restaurar valores iniciais');
    return 'reset';
  }, [resetArmed, commit]);

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  return {
    scenario,
    result,
    source: store.source,
    canUndo: store.past.length > 0,
    historySize: store.past.length,
    lastLabel: store.lastLabel,
    resetArmed,
    setAvgHoursPerStory,
    setHoursPerPerson,
    setStartWeek,
    setStartYearWeek,
    setSprintOneWeek,
    setSchedulingMode,
    setSquadName,
    setSquadPeople,
    addSquad,
    addCustomSquad,
    removeSquad,
    setFeatureStories,
    associateFeature,
    moveFeature,
    removeFeature,
    setManualCell,
    autoDistributeFeature,
    clearFeature,
    reseedManualFromAuto,
    applyPatch,
    replaceScenario,
    undo,
    requestReset,
    disarmReset,
  };
}
