/**
 * Persistência local, importação e exportação de cenários
 * (contrato: specs/001-modernizar-simulador-roadmap/contracts/scenario-storage-export.contract.md).
 * Funções puras + adaptadores que recebem um Storage (testável em Node).
 */

import {
  WEEKS,
  INITIAL_SQUADS,
  SQUAD_COLOR_TOKENS,
  DEFAULT_PREMISES,
  SCHEDULING_MODE_IDS,
  LIMITS,
  createInitialScenario,
  resolveYearWeek,
  weekIdToYearWeek,
  normalizeSquadName,
  formatSquadShortName,
} from '../data/initialRoadmapData.js';
import { sanitizeManualAllocations, STATUS_META } from './simulationEngine.js';
import { fmtNumber } from './format.js';

export const STORAGE_KEY = 'roadmap.sim.v2';
export const LEGACY_AVG_KEY = 'roadmap.avg';
export const LEGACY_SQUADS_KEY = 'roadmap.squads';
export const SCHEMA_VERSION = '2.0';
export const APP_ID = 'nextprev-roadmap-simulator';

export const IMPORT_ERRORS = Object.freeze({
  INVALID_JSON: 'Arquivo inválido: não foi possível ler o formato do cenário.',
  UNSUPPORTED_SCHEMA: 'Versão de cenário não reconhecida. Exporte um arquivo gerado por este simulador.',
  INVALID_PREMISES: 'Premissas fora dos limites permitidos no arquivo importado.',
  INVALID_SQUADS: 'Estrutura de Squads ou Features inválida no arquivo importado.',
});

function isInt(value) {
  return typeof value === 'number' && Number.isInteger(value);
}

function inRange(value, { min, max }) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function validPremises(premises) {
  if (!premises || typeof premises !== 'object') return false;
  const startWeek = WEEKS.find((week) => week.id === premises.startWeekId);
  return (
    inRange(premises.avgHoursPerStory, LIMITS.avgHoursPerStory) &&
    inRange(premises.hoursPerPersonPerWeek, LIMITS.hoursPerPersonPerWeek) &&
    SCHEDULING_MODE_IDS.includes(premises.schedulingMode) &&
    Boolean(startWeek) &&
    !startWeek.frozen
  );
}

function normalizeSquads(rawSquads) {
  if (!Array.isArray(rawSquads) || rawSquads.length === 0) return null;
  const squads = [];
  const seenKeys = new Set();
  const seenIds = new Set();
  for (const raw of rawSquads) {
    if (!raw || typeof raw !== 'object') return null;
    const key = String(raw.key || '');
    if (!key || seenKeys.has(key)) return null;
    seenKeys.add(key);
    if (!isInt(raw.people) || !inRange(raw.people, LIMITS.people)) return null;
    if (!Array.isArray(raw.features)) return null;
    const base = INITIAL_SQUADS.find((squad) => squad.key === key);
    const features = [];
    for (const feature of raw.features) {
      if (!feature || typeof feature !== 'object') return null;
      const id = String(feature.id || '');
      if (!id || seenIds.has(id)) return null;
      seenIds.add(id);
      if (!isInt(feature.stories) || !inRange(feature.stories, LIMITS.stories)) return null;
      features.push({
        id,
        epic: String(feature.epic || ''),
        name: String(feature.name || id),
        stories: feature.stories,
      });
    }
    const name = normalizeSquadName(key, raw.name ?? base?.name ?? `Squad ${key}`);
    squads.push({
      key,
      name,
      title: String(raw.title || base?.title || `Módulo ${key} - SQUAD ${key}`),
      shortName: formatSquadShortName(key, name),
      colorToken: SQUAD_COLOR_TOKENS[key] || '--chart-other',
      people: raw.people,
      features,
    });
  }
  return squads;
}

/** Normaliza um cenário bruto (persistido ou importado). Retorna null se inválido. */
export function normalizeScenario(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (!validPremises(raw.premises)) return null;
  const squads = normalizeSquads(raw.squads);
  if (!squads) return null;

  // A semana do ano (startYearWeek) manda quando válida; senão deriva da coluna do roadmap.
  const requested = raw.premises.startYearWeek;
  const resolved = Number.isInteger(requested) ? resolveYearWeek(requested) : null;
  const startWeekId = resolved ? resolved.weekId : raw.premises.startWeekId;
  const startYearWeek = resolved ? requested : weekIdToYearWeek(startWeekId);

  const startWeek = WEEKS.find((week) => week.id === startWeekId);
  const rawSprintOne = WEEKS.find((week) => week.id === raw.premises.sprintOneWeekId && !week.frozen) || null;
  const sprintOneWeekId = rawSprintOne
    ? rawSprintOne.index < startWeek.index
      ? startWeekId
      : rawSprintOne.id
    : null;

  return {
    premises: {
      avgHoursPerStory: raw.premises.avgHoursPerStory,
      hoursPerPersonPerWeek: raw.premises.hoursPerPersonPerWeek,
      startWeekId,
      startYearWeek,
      sprintOneWeekId,
      schedulingMode: raw.premises.schedulingMode,
    },
    squads,
    manualAllocations: sanitizeManualAllocations(raw.manualAllocations, WEEKS),
  };
}

/** Envelope versionado usado tanto na persistência quanto no arquivo exportado. */
export function createEnvelope(scenario, now = new Date()) {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    app: APP_ID,
    premises: { ...scenario.premises },
    squads: scenario.squads.map((squad) => ({
      key: squad.key,
      name: squad.name || `Squad ${squad.key}`,
      title: squad.title,
      people: squad.people,
      features: squad.features.map(({ id, epic, name, stories }) => ({ id, epic, name, stories })),
    })),
    manualAllocations: scenario.manualAllocations || {},
  };
}

export function serializeScenario(scenario, now = new Date()) {
  return JSON.stringify(createEnvelope(scenario, now), null, 2);
}

/**
 * Valida e interpreta um arquivo de cenário.
 * @returns {{ok: true, state: object} | {ok: false, errorCode: string, messagePtBr: string}}
 */
export function validateAndParseScenarioJson(text) {
  const fail = (errorCode) => ({ ok: false, errorCode, messagePtBr: IMPORT_ERRORS[errorCode] });
  if (typeof text !== 'string' || text.trim() === '') return fail('INVALID_JSON');
  let raw;
  try {
    raw = JSON.parse(text.replace(/^\uFEFF/, ''));
  } catch {
    return fail('INVALID_JSON');
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fail('INVALID_JSON');
  if (raw.schemaVersion !== SCHEMA_VERSION) return fail('UNSUPPORTED_SCHEMA');
  if (!validPremises(raw.premises)) return fail('INVALID_PREMISES');
  const state = normalizeScenario(raw);
  if (!state) return fail('INVALID_SQUADS');
  return { ok: true, state };
}

/** Migra os dados do protótipo anterior (roadmap.avg / roadmap.squads) sem apagá-los. */
export function migrateLegacy(storage) {
  let avgRaw = null;
  let squadsRaw = null;
  try {
    avgRaw = storage.getItem(LEGACY_AVG_KEY);
    squadsRaw = storage.getItem(LEGACY_SQUADS_KEY);
  } catch {
    return null;
  }
  if (avgRaw === null && squadsRaw === null) return null;

  const scenario = createInitialScenario();
  const avg = Number(avgRaw);
  if (avgRaw !== null && Number.isInteger(avg) && inRange(avg, LIMITS.avgHoursPerStory)) {
    scenario.premises.avgHoursPerStory = avg;
  }
  if (squadsRaw !== null) {
    try {
      const squads = normalizeSquads(JSON.parse(squadsRaw));
      if (squads) scenario.squads = squads;
    } catch {
      /* mantém squads padrão */
    }
  }
  return scenario;
}

/** Carrega o cenário ativo: v2 → migração legada → cenário inicial. */
export function loadScenario(storage) {
  if (!storage) return { scenario: createInitialScenario(), source: 'initial' };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = validateAndParseScenarioJson(raw);
      if (parsed.ok) return { scenario: parsed.state, source: 'v2' };
    }
  } catch {
    /* segue para migração */
  }
  const migrated = migrateLegacy(storage);
  if (migrated) return { scenario: migrated, source: 'legacy' };
  return { scenario: createInitialScenario(), source: 'initial' };
}

export function saveScenario(storage, scenario) {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(createEnvelope(scenario)));
    return true;
  } catch {
    return false;
  }
}

/** Carimbo para nomes de arquivo: YYYYMMDD-HHMM. */
export function fileTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Planilha da matriz calculada: UTF-8 com BOM, separador ";", decimais com vírgula (pt-BR).
 * Células semanais em histórias (US) equivalentes.
 */
export function buildCsv(scenario, result, allWeeks = WEEKS) {
  // Colunas a partir da primeira do roadmap (S05) ou da semana inicial, o que vier antes.
  const firstRoadmapIndex = Math.max(0, allWeeks.findIndex((week) => week.inRoadmap !== false));
  const csvStart = Math.min(result.context.calendarStartIndex ?? result.context.startIndex, firstRoadmapIndex);
  const weeks = allWeeks.filter((week) => week.index >= csvStart);
  const avg = scenario.premises.avgHoursPerStory;
  const header = [
    'Squad',
    'Épico',
    'Código/Feature',
    'Qtd. US',
    'Esforço (h)',
    'Capacity Squad (h/sem)',
    'Semanas Estimadas',
    'Situação',
    'Excedente Pós-S26 (sem)',
    ...weeks.map((week) => (week.frozen ? 'FREEZING' : week.sprintWeek)),
  ];
  const lines = [header.map(csvCell).join(';')];
  for (const squad of scenario.squads) {
    const diag = result.squads.find((s) => s.squadKey === squad.key);
    for (const feature of squad.features) {
      const schedule = result.features[feature.id];
      if (!schedule) continue;
      const spill = schedule.spilloverWeeks;
      const row = [
        squad.shortName || `Squad ${squad.key}`,
        feature.epic,
        feature.name,
        fmtNumber(feature.stories),
        fmtNumber(schedule.effortHours),
        fmtNumber(diag?.weeklyCapacityHours ?? 0),
        fmtNumber(schedule.estimatedWeeks, 2, 2),
        STATUS_META[schedule.status]?.label ?? schedule.status,
        spill > 0 ? (Number.isFinite(spill) ? fmtNumber(spill, 2, 2) : 'Sem capacidade') : '0',
        ...weeks.map((week) => {
          const hours = schedule.allocatedByWeek[week.id] || 0;
          return hours > 0 && avg > 0 ? fmtNumber(hours / avg, 2, 0) : '';
        }),
      ];
      lines.push(row.map(csvCell).join(';'));
    }
  }
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export { DEFAULT_PREMISES };
