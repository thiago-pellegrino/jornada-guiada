/**
 * Catálogo estático do Simulador de Roadmap e Capacity.
 * Reconciliado com SEMANAS.xlsx (abas C0-ROADMAP, C1-ROADMAP e SEMANAS).
 *
 * - 23 colunas de calendário: 22 semanas (S05–S26) + coluna FREEZING (17/12/2026).
 * - Semanas de segunda a domingo; S05 começa em 03/08/2026.
 * - Marcos da aba SEMANAS: ESTAMOS AQUI (S06), HOMOLOGAÇÃO (S21), PRODUÇÃO (S23), FREEZING (17/12).
 */

export const FREEZE_WEEK_ID = 'freeze';
export const DEFAULT_START_WEEK_ID = 'w03';
export const FREEZE_DATE_LABEL = '17/12/2026';

const S05_START_UTC = Date.UTC(2026, 7, 3); // 03/08/2026 (segunda-feira)
const DAY_MS = 24 * 60 * 60 * 1000;

const MILESTONES = {
  S06: 'ESTAMOS AQUI',
  S21: 'HOMOLOGAÇÃO',
  S23: 'PRODUÇÃO',
};

const RAW_WEEKS = [
  { id: 'w01', month: 'AGOSTO', sprint: '', sprintWeek: 'S05', monthWeek: 'S01', tone: 'light' },
  { id: 'w02', month: 'AGOSTO', sprint: '', sprintWeek: 'S06', monthWeek: 'S02', tone: 'light' },
  { id: 'w03', month: 'AGOSTO', sprint: 'SPRINT-04', sprintWeek: 'S07', monthWeek: 'S03', tone: 'gray' },
  { id: 'w04', month: 'AGOSTO', sprint: 'SPRINT-04', sprintWeek: 'S08', monthWeek: 'S04', tone: 'gray' },
  { id: 'w05', month: 'SETEMBRO', sprint: 'SPRINT-05', sprintWeek: 'S09', monthWeek: 'S01', tone: 'light' },
  { id: 'w06', month: 'SETEMBRO', sprint: 'SPRINT-05', sprintWeek: 'S10', monthWeek: 'S02', tone: 'light' },
  { id: 'w07', month: 'SETEMBRO', sprint: 'SPRINT-06', sprintWeek: 'S11', monthWeek: 'S03', tone: 'gray' },
  { id: 'w08', month: 'SETEMBRO', sprint: 'SPRINT-06', sprintWeek: 'S12', monthWeek: 'S04', tone: 'gray' },
  { id: 'w09', month: 'SETEMBRO', sprint: 'SPRINT-07', sprintWeek: 'S13', monthWeek: 'S05', tone: 'light' },
  { id: 'w10', month: 'OUTUBRO', sprint: 'SPRINT-07', sprintWeek: 'S14', monthWeek: 'S01', tone: 'light' },
  { id: 'w11', month: 'OUTUBRO', sprint: 'SPRINT-08', sprintWeek: 'S15', monthWeek: 'S02', tone: 'gray' },
  { id: 'w12', month: 'OUTUBRO', sprint: 'SPRINT-08', sprintWeek: 'S16', monthWeek: 'S03', tone: 'gray' },
  { id: 'w13', month: 'OUTUBRO', sprint: 'SPRINT-09', sprintWeek: 'S17', monthWeek: 'S04', tone: 'light' },
  { id: 'w14', month: 'NOVEMBRO', sprint: 'SPRINT-09', sprintWeek: 'S18', monthWeek: 'S01', tone: 'light' },
  { id: 'w15', month: 'NOVEMBRO', sprint: 'SPRINT-10', sprintWeek: 'S19', monthWeek: 'S02', tone: 'gray' },
  { id: 'w16', month: 'NOVEMBRO', sprint: 'SPRINT-10', sprintWeek: 'S20', monthWeek: 'S03', tone: 'gray' },
  { id: 'w17', month: 'NOVEMBRO', sprint: 'SPRINT-11', sprintWeek: 'S21', monthWeek: 'S04', tone: 'light' },
  { id: 'w18', month: 'NOVEMBRO', sprint: 'SPRINT-11', sprintWeek: 'S22', monthWeek: 'S05', tone: 'light' },
  { id: 'w19', month: 'DEZEMBRO', sprint: 'SPRINT-12', sprintWeek: 'S23', monthWeek: 'S01', tone: 'gray' },
  { id: 'w20', month: 'DEZEMBRO', sprint: 'SPRINT-12', sprintWeek: 'S24', monthWeek: 'S02', tone: 'gray' },
  { id: FREEZE_WEEK_ID, month: 'DEZEMBRO', sprint: 'FREEZING', sprintWeek: 'FREEZING', monthWeek: '', tone: 'freeze', frozen: true },
  { id: 'w21', month: 'DEZEMBRO', sprint: 'SPRINT-12', sprintWeek: 'S25', monthWeek: 'S03', tone: 'gray' },
  { id: 'w22', month: 'DEZEMBRO', sprint: 'SPRINT-12', sprintWeek: 'S26', monthWeek: 'S04', tone: 'gray' },
];

/* ── Semanas do ano corrente (semanas ISO, segunda a domingo) ──────────────────
   O calendário cobre o ano inteiro: as semanas de janeiro a julho (colunas "y01"…"y31", sem
   código de sprint) vêm antes das colunas do roadmap (S05–S26 + Freezing). A "semana inicial do
   planejamento" pode ser qualquer semana do ano e o cronograma passa a começar no mês dela. */
export const YEAR = 2026;

const MONTH_NAMES = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

function formatDayMonth(ms) {
  const date = new Date(ms);
  return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function buildYearWeeks(year) {
  const jan4 = Date.UTC(year, 0, 4);
  const dayOfWeek = (new Date(jan4).getUTCDay() + 6) % 7; // segunda = 0
  const week1Start = jan4 - dayOfWeek * DAY_MS;
  const list = [];
  for (let number = 1; number <= 53; number += 1) {
    const startMs = week1Start + (number - 1) * 7 * DAY_MS;
    const thursday = new Date(startMs + 3 * DAY_MS);
    if (thursday.getUTCFullYear() !== year) break; // a semana 53 só existe em alguns anos
    list.push(
      Object.freeze({
        number,
        startMs,
        startLabel: formatDayMonth(startMs),
        endLabel: formatDayMonth(startMs + 6 * DAY_MS),
      }),
    );
  }
  return Object.freeze(list);
}

export const YEAR_WEEKS = buildYearWeeks(YEAR);

// Semanas anteriores ao roadmap (janeiro a julho). O mês segue a quinta-feira da semana (padrão ISO).
const PRE_WEEKS = YEAR_WEEKS.filter((item) => item.startMs < S05_START_UTC).map((item) => ({
  id: `y${String(item.number).padStart(2, '0')}`,
  month: MONTH_NAMES[new Date(item.startMs + 3 * DAY_MS).getUTCMonth()],
  sprint: '',
  sprintWeek: `Sem ${String(item.number).padStart(2, '0')}`,
  monthWeek: '',
  tone: 'light',
  preRoadmap: true,
  startMs: item.startMs,
}));

export const WEEKS = Object.freeze(
  [...PRE_WEEKS, ...RAW_WEEKS].map((week, index) => {
    const frozen = Boolean(week.frozen);
    const startMs = frozen
      ? null
      : week.startMs ?? S05_START_UTC + (Number(week.sprintWeek.slice(1)) - 5) * 7 * DAY_MS;
    return Object.freeze({
      ...week,
      index,
      frozen,
      inRoadmap: !week.preRoadmap,
      startMs,
      yearWeek: frozen ? null : YEAR_WEEKS.find((item) => item.startMs === startMs)?.number ?? null,
      dateLabel: frozen ? FREEZE_DATE_LABEL : formatDayMonth(startMs),
      isHistoricalDefault: week.id === 'w01' || week.id === 'w02',
      milestone: frozen ? 'FREEZING' : MILESTONES[week.sprintWeek] || null,
    });
  }),
);

/** Mapeia uma semana do ano para a coluna do calendário: { weekId, position: 'inside' } ou null. */
export function resolveYearWeek(number) {
  const week = WEEKS.find((item) => item.yearWeek === number);
  return week ? { weekId: week.id, position: 'inside' } : null;
}

/** Semana do ano (ISO) em que começa uma coluna do calendário. */
export function weekIdToYearWeek(weekId) {
  const week = WEEKS.find((item) => item.id === weekId && !item.frozen);
  return week ? week.yearWeek : null;
}

export const SQUAD_COLOR_TOKENS = Object.freeze({
  A: '--chart-1',
  B: '--chart-2',
  C: '--chart-3',
  D: '--chart-4',
  E: '--chart-5',
  F: '--chart-6',
  G: '--chart-7',
  H: '--chart-8',
});

export const MAX_SQUADS = 20;

export const SCHEDULING_MODES = Object.freeze([
  {
    id: 'continuous',
    label: 'Fluxo Contínuo',
    short: 'C1',
    description: 'Aproveita o saldo de horas da semana para iniciar a próxima feature da squad.',
  },
  {
    id: 'whole_weeks',
    label: 'Semanas Inteiras',
    short: 'C0',
    description: 'Cada feature reserva semanas inteiras e exclusivas (arredondamento para cima).',
  },
  {
    id: 'manual',
    label: 'Alocação Manual',
    short: 'Manual',
    description: 'Você distribui as histórias por semana na matriz e acompanha a ocupação.',
  },
]);

export const SCHEDULING_MODE_IDS = Object.freeze(SCHEDULING_MODES.map((mode) => mode.id));

export const LIMITS = Object.freeze({
  avgHoursPerStory: { min: 1, max: 240, sliderMin: 16, sliderMax: 120, reference: 56 },
  hoursPerPersonPerWeek: { min: 1, max: 60, sliderMin: 20, sliderMax: 44, reference: 40 },
  people: { min: 0, max: 25, sliderMin: 0, sliderMax: 12 },
  stories: { min: 0, max: 200 },
  manualStories: { min: 0, max: 200 },
});

export const DEFAULT_PREMISES = Object.freeze({
  avgHoursPerStory: 56,
  hoursPerPersonPerWeek: 40,
  startWeekId: DEFAULT_START_WEEK_ID,
  startYearWeek: weekIdToYearWeek(DEFAULT_START_WEEK_ID),
  sprintOneWeekId: null, // null = sprints do roadmap (Sprint 04 em S07…); senão, a semana em que a Sprint 01 começa
  schedulingMode: 'continuous',
});

const RAW_SQUADS = [
  {
    key: 'A',
    title: 'Módulo A - SQUAD A',
    people: 4,
    features: [
      ['EPC-001', 'A1 - Cadastro e ativação de conta', 11],
      ['EPC-002', 'A2 - Login e gerenciamento de sessão', 4],
      ['EPC-002', 'A3 - Fundação da Aplicação', 1],
      ['EPC-002', 'A4 - Grupos de Acesso/Autorização', 2],
      ['EPC-008', 'A5 - Painel Administrativo', 8],
      ['EPC-002', 'A6 - Perfil de Usuário e Autosserviço de Dados', 6],
      ['EPC-008', 'A7 - Politica', 7],
      ['EPC-001', 'A8 - Onboarding e Preferencias', 3],
    ],
  },
  {
    key: 'B',
    title: 'Módulo B - SQUAD B',
    people: 1,
    features: [
      ['EPC-003', 'B1 – Vitrine e Catálogo Curado', 5],
      ['EPC-010', 'B2 – Busca e Taxonomia do Catálogo', 4],
      ['EPC-004', 'B3 – Marketplace de Serviços e Capacidades', 3],
      ['EPC-003', 'B4 – Conteúdo, Repositório de Arquivos', 4],
      ['EPC-003', 'B5 – Perfil Institucional do Membro no Catálogo', 4],
      ['EPC-004', 'B6 – Diagnóstico Innolite e Conversão para Innodive', 6],
      ['EPC-003', 'B7 – Backoffice de Curadoria do Catálogo', 4],
      ['EPC-003', 'B8 – Tombamento da Base Atual', 3],
    ],
  },
  {
    key: 'C',
    title: 'Módulo C - SQUAD C',
    people: 1,
    features: [
      ['EPC-004', 'C1 – Vitrine de Desafios', 6],
      ['EPC-004', 'C2 – Manifestação de Interesse e Geração de Leads', 3],
      ['EPC-010', 'C3 - Buscador', 4],
      ['EPC-004', 'C4 – Criar desafio - admin gestor', 6],
      ['EPC-005', 'C5 – Dashboard Backoffice (Admin Bradesco) - Triagem e Acompanhamento', 12],
      ['EPC-010', 'C6 - Cluster do usuário consumidor de desafios', 1],
    ],
  },
  {
    key: 'D',
    title: 'Módulo D - SQUAD D',
    people: 2,
    features: [
      ['EPC-006', 'D1 - Gerenciar espaços', 10],
      ['EPC-006', 'D2 - Reserva de Espaços', 10],
      ['EPC-006', 'D3 - Eventos', 7],
      ['EPC-011', 'D4 - FAQ', 3],
      ['EPC-007', 'D5 - Créditos', 11],
      ['EPC-007', 'D6 - Preços', 8],
      ['EPC-007', 'D7 - Assinaturas', 7],
    ],
  },
];

/** Normaliza o nome editável da squad (mantendo `Squad X` como padrão quando vazio). */
export function normalizeSquadName(key, rawName) {
  const trimmed = String(rawName ?? '').trim().slice(0, 40);
  return trimmed || `Squad ${key}`;
}

/** Rótulo curto da squad: usa o nome editado, mantendo `key` apenas como identificador interno. */
export function formatSquadShortName(key, name) {
  return normalizeSquadName(key, name);
}

export const INITIAL_SQUADS = Object.freeze(
  RAW_SQUADS.map((squad) =>
    Object.freeze({
      key: squad.key,
      name: `Squad ${squad.key}`,
      title: squad.title,
      shortName: `Squad ${squad.key}`,
      colorToken: SQUAD_COLOR_TOKENS[squad.key],
      people: squad.people,
      features: Object.freeze(
        squad.features.map(([epic, name, stories], i) =>
          Object.freeze({ id: `${squad.key}-${i + 1}`, epic, name, stories }),
        ),
      ),
    }),
  ),
);

export const EPICS = Object.freeze(
  [...new Set(INITIAL_SQUADS.flatMap((squad) => squad.features.map((feature) => feature.epic)))].sort(),
);

/** Catálogo canônico de features disponíveis para associação às squads. */
export const FEATURE_CATALOG = Object.freeze(
  INITIAL_SQUADS.flatMap((squad) =>
    squad.features.map((feature) =>
      Object.freeze({
        catalogKey: `${feature.epic}||${feature.name}`,
        epic: feature.epic,
        name: feature.name,
        defaultStories: feature.stories,
      }),
    ),
  ),
);

/** Cria um cenário novo (mutável) a partir do catálogo base. */
export function createInitialScenario() {
  return {
    premises: { ...DEFAULT_PREMISES },
    squads: INITIAL_SQUADS.map((squad) => ({
      ...squad,
      features: squad.features.map((feature) => ({ ...feature })),
    })),
    manualAllocations: {},
  };
}


/** Chaves das squads do catálogo base (as demais são squads adicionadas pelo usuário). */
export const BASE_SQUAD_KEYS = Object.freeze(INITIAL_SQUADS.map((squad) => squad.key));

/**
 * Cria uma squad nova (E, F, G…) com 1 profissional e uma feature sem histórias:
 * a capacidade entra na simulação na hora e a demanda vem das histórias informadas na matriz.
 * Retorna null quando o limite de squads é atingido.
 */
export function createNewSquad(existingKeys) {
  if (existingKeys.length >= MAX_SQUADS) return null;
  const letters = 'EFGHIJKLMNOPQRSTUVWXYZ';
  const key = [...letters].find((letter) => !existingKeys.includes(letter));
  if (!key) return null;
  return {
    key,
    name: `Squad ${key}`,
    title: `Módulo ${key} - SQUAD ${key}`,
    shortName: `Squad ${key}`,
    colorToken: SQUAD_COLOR_TOKENS[key] || '--chart-other',
    people: 1,
    features: [{ id: `${key}-1`, epic: '—', name: `${key}1 - Nova feature`, stories: 0 }],
  };
}

/**
 * Cria uma squad personalizada na aba "Escopo das Squads" (com nome e profissionais escolhidos,
 * iniciando sem features até que o usuário associe o escopo).
 */
export function createCustomSquad(existingKeys, { name = '', people = 2 } = {}) {
  if (existingKeys.length >= MAX_SQUADS) return null;
  const letters = 'EFGHIJKLMNOPQRSTUVWXYZ';
  const key = [...letters].find((letter) => !existingKeys.includes(letter));
  if (!key) return null;
  const cleanName = normalizeSquadName(key, name);
  const clampedPeople = Number.isFinite(Number(people))
    ? Math.min(LIMITS.people.max, Math.max(LIMITS.people.min, Math.round(Number(people))))
    : 2;
  return {
    key,
    name: cleanName,
    title: `Módulo ${key} - SQUAD ${key}`,
    shortName: formatSquadShortName(key, cleanName),
    colorToken: SQUAD_COLOR_TOKENS[key] || '--chart-other',
    people: clampedPeople,
    features: [],
  };
}

export function nextFeatureId(squads, squadKey) {
  const used = new Set(squads.flatMap((q) => q.features.map((f) => f.id)));
  let seq = 1;
  while (used.has(`${squadKey}-${seq}`)) seq += 1;
  return `${squadKey}-${seq}`;
}

/** Associa uma feature (do catálogo ou nova) a uma squad com a respectiva quantidade de histórias. */
export function associateFeatureInScenario(scenario, squadKey, { epic = '—', name = '', stories = 0 } = {}) {
  const squad = scenario.squads.find((q) => q.key === squadKey);
  const cleanName = String(name ?? '').trim().slice(0, 120);
  if (!squad || !cleanName) return scenario;
  const cleanEpic = String(epic ?? '').trim().slice(0, 24) || '—';
  const n = Number(stories);
  const clampedStories = Number.isFinite(n)
    ? Math.min(LIMITS.stories.max, Math.max(LIMITS.stories.min, Math.round(n)))
    : 0;
  const id = nextFeatureId(scenario.squads, squadKey);
  const created = { id, epic: cleanEpic, name: cleanName, stories: clampedStories };
  return {
    ...scenario,
    squads: scenario.squads.map((q) => (q.key === squadKey ? { ...q, features: [...q.features, created] } : q)),
  };
}

/** Transfere uma feature existente (e suas histórias) para outra squad. */
export function moveFeatureInScenario(scenario, featureId, targetSquadKey) {
  const sourceSquad = scenario.squads.find((q) => q.features.some((f) => f.id === featureId));
  const targetSquad = scenario.squads.find((q) => q.key === targetSquadKey);
  if (!sourceSquad || !targetSquad || sourceSquad.key === targetSquadKey) return scenario;
  const feature = sourceSquad.features.find((f) => f.id === featureId);
  return {
    ...scenario,
    squads: scenario.squads.map((q) => {
      if (q.key === sourceSquad.key) return { ...q, features: q.features.filter((f) => f.id !== featureId) };
      if (q.key === targetSquadKey) return { ...q, features: [...q.features, { ...feature }] };
      return q;
    }),
  };
}

/** Desassocia/remove uma feature de sua squad (limpando eventual alocação manual). */
export function removeFeatureInScenario(scenario, featureId) {
  const owner = scenario.squads.find((q) => q.features.some((f) => f.id === featureId));
  if (!owner) return scenario;
  const manualAllocations = { ...scenario.manualAllocations };
  delete manualAllocations[featureId];
  return {
    ...scenario,
    squads: scenario.squads.map((q) =>
      q.key === owner.key ? { ...q, features: q.features.filter((f) => f.id !== featureId) } : q,
    ),
    manualAllocations,
  };
}

/** Número da semana (ISO) do ano em que cai a data informada; null se estiver fora do ano do calendário. */
export function currentYearWeekNumber(date = new Date()) {
  const todayMs = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const found = YEAR_WEEKS.find((item) => todayMs >= item.startMs && todayMs < item.startMs + 7 * DAY_MS);
  return found ? found.number : null;
}
