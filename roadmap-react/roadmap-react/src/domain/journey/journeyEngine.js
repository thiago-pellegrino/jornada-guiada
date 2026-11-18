/**
 * Motor puro da Jornada Guiada no protótipo: projeto, etapas, elegibilidade, execuções
 * simuladas e Modo Turbo. Não chama IA nem backend: cada execução devolve o exemplo mínimo
 * da capacidade (lido de `especificações/`) ajustado ao projeto, como dado simulado.
 *
 * Fluxo: Contexto → DarkLabs → Projeto → Backlog. O projeto é criado no Contexto e é o
 * identificador de tudo o que vem depois (contrato §5.3, repositório §8).
 */

export const STORAGE_VERSION = 1;

export const STAGES = Object.freeze([
  { id: 'contexto', label: 'Contexto', step: 'Contexto' },
  { id: 'contexto_consolidado', label: 'Contexto consolidado', step: 'Contexto' },
  { id: 'darklab', label: 'DarkLabs em andamento', step: 'DarkLabs' },
  { id: 'projeto_definido', label: 'Projeto definido', step: 'Projeto' },
  { id: 'backlog', label: 'Backlog em geração', step: 'Backlog' },
]);

export const JOURNEY_STEPS = Object.freeze([
  { id: 'contexto', label: 'Contexto', tab: 'contexto', reachedAt: 'contexto' },
  { id: 'darklab', label: 'DarkLabs', tab: 'darklab', reachedAt: 'contexto_consolidado' },
  { id: 'projeto', label: 'Projeto', tab: 'projetos', reachedAt: 'projeto_definido' },
  { id: 'backlog', label: 'Backlog', tab: 'backlog-futuro', reachedAt: 'projeto_definido' },
  // Etapas de planejamento do simulador: liberadas quando o Backlog do Futuro existe; sem marca de concluída.
  { id: 'escopo-squads', label: 'Escopo das Squads', tab: 'escopo-squads', reachedAt: null, availableAt: 'backlog' },
  { id: 'epicos', label: 'Épicos, Features e Histórias', tab: 'epicos', reachedAt: null, availableAt: 'backlog' },
]);

export const ROLES = Object.freeze(['Leitor', 'Editor', 'Aprovador', 'Administrador']);

export const REVIEW_STATES = Object.freeze(['não revisado', 'revisado', 'aceito']);

export const CAP = Object.freeze({
  analisar: '01-contexto-001-analisar-e-enriquecer-artefato',
  consolidar: '01-contexto-002-consolidar-contexto',
  turboContexto: '01-contexto-011-modo-turbo',
  motor1: '02-darklab-001-motor-1-enquadrar-descoberta-estrategica',
  motor7: '02-darklab-007-motor-7-antecipar-foresight-e-evolucao',
  ficha: '02-darklab-008-consolidar-ficha-do-projeto',
  turboDarklab: '02-darklab-009-modo-turbo',
  epicos: '03-backlog-do-futuro-001-gerar-epicos',
  features: '03-backlog-do-futuro-002-gerar-features-do-epico',
  historias: '03-backlog-do-futuro-003-gerar-historias-da-feature',
  oQueFazer: '03-backlog-do-futuro-004-detalhar-o-que-deve-ser-feito',
  turboBacklog: '03-backlog-do-futuro-005-modo-turbo',
});

const PERMISSOES = {
  createProject: ['Editor', 'Aprovador', 'Administrador'],
  upload: ['Editor', 'Aprovador', 'Administrador'],
  run: ['Editor', 'Aprovador', 'Administrador'],
  review: ['Editor', 'Aprovador', 'Administrador'],
  accept: ['Aprovador', 'Administrador'],
  manageMembers: ['Administrador'],
  rename: ['Editor', 'Aprovador', 'Administrador'],
};

export function can(role, action) {
  return (PERMISSOES[action] ?? []).includes(role);
}

// ───────────────────────────── utilitários ─────────────────────────────

const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const pad3 = (n) => String(n).padStart(3, '0');

export function stageIndex(stage) {
  return STAGES.findIndex((s) => s.id === stage);
}

export function stageLabel(stage) {
  return STAGES.find((s) => s.id === stage)?.label ?? stage;
}

export function artifactKey(capabilityId, scopeKey = 'projeto') {
  return `${capabilityId}::${scopeKey}`;
}

export function latestRevision(project, capabilityId, scopeKey = 'projeto') {
  const lista = project?.artifacts?.[artifactKey(capabilityId, scopeKey)];
  return lista && lista.length ? lista[lista.length - 1] : null;
}

export function listRevisions(project, capabilityId, scopeKey = 'projeto') {
  return project?.artifacts?.[artifactKey(capabilityId, scopeKey)] ?? [];
}

function nextCode(projects) {
  const max = projects.reduce((m, p) => Math.max(m, Number(p.code?.replace('PRJ-', '')) || 0), 0);
  return `PRJ-${pad3(max + 1)}`;
}

/** Identificador interno do projeto: PRJ-NNN-AAAA-MM-DD-SS (código, data de criação e sequência do dia). */
export const PROJECT_ID_PATTERN = /^PRJ-\d{3}-\d{4}-\d{2}-\d{2}-\d{2}$/;

function dataLocal(iso) {
  const d = new Date(iso);
  const valida = Number.isNaN(d.getTime()) ? new Date() : d;
  return `${valida.getFullYear()}-${String(valida.getMonth() + 1).padStart(2, '0')}-${String(valida.getDate()).padStart(2, '0')}`;
}

export function formatProjectId(code, isoDate, sequenciaDoDia) {
  return `${code}-${dataLocal(isoDate)}-${String(sequenciaDoDia).padStart(2, '0')}`;
}

/** Próximo identificador para um projeto criado em `now`, contando os já criados no mesmo dia. */
function nextProjectId(projects, code, now) {
  const dia = dataLocal(now);
  const doDia = projects.filter((p) => PROJECT_ID_PATTERN.test(p.projectId) && p.projectId.slice(8, 18) === dia).length;
  return formatProjectId(code, now, doDia + 1);
}

function randomId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

// ───────────────────────────── estado e projetos ─────────────────────────────

export function createEmptyState() {
  return { version: STORAGE_VERSION, selectedProjectId: null, role: 'Editor', projects: [] };
}

/** Cria o projeto no Contexto: projectId imutável, código PRJ-NNN e etapa `contexto`. */
export function createProject(state, { name, description = '', now = new Date().toISOString(), projectId = null } = {}) {
  const nome = String(name ?? '').trim();
  if (!nome) throw new Error('Informe o nome do projeto.');
  const code = nextCode(state.projects);
  const id = projectId ?? nextProjectId(state.projects, code, now);
  const project = {
    projectId: id,
    code,
    name: nome,
    description: String(description).trim(),
    createdAt: now,
    createdBy: 'Você',
    stage: 'contexto',
    stageHistory: [{ stage: 'contexto', at: now, cause: 'POST /projects' }],
    members: [{ id: 'usr-001', name: 'Você', role: 'Administrador' }],
    batchId: `LOT-${id.slice(4)}`,
    sources: [],
    artifacts: {},
    runs: [],
  };
  return { ...state, selectedProjectId: project.projectId, projects: [...state.projects, project] };
}

export function selectedProject(state) {
  return state.projects.find((p) => p.projectId === state.selectedProjectId) ?? null;
}

function replaceProject(state, project) {
  return { ...state, projects: state.projects.map((p) => (p.projectId === project.projectId ? project : p)) };
}

export function updateProject(state, projectId, fn) {
  const atual = state.projects.find((p) => p.projectId === projectId);
  if (!atual) return state;
  return replaceProject(state, fn(atual));
}

export function renameProject(project, name) {
  const nome = String(name ?? '').trim();
  if (!nome) return project;
  return { ...project, name: nome };
}

export function addMember(project, { name, role }) {
  const nome = String(name ?? '').trim();
  if (!nome || !ROLES.includes(role)) return project;
  const id = `usr-${pad3(project.members.length + 1)}`;
  return { ...project, members: [...project.members, { id, name: nome, role }] };
}

/** Registra arquivos enviados como fontes do lote atual (só metadados; o conteúdo não é lido). */
export function addSources(project, files, now = new Date().toISOString()) {
  const base = project.sources.length;
  const novas = files.map((f, i) => ({
    id: `SRC-${pad3(base + i + 1)}`,
    name: f.name,
    size: f.size ?? 0,
    type: f.type || 'desconhecido',
    uploadedAt: now,
    status: 'enviada',
  }));
  return { ...project, sources: [...project.sources, ...novas] };
}

// ───────────────────────────── etapa do projeto ─────────────────────────────

export function fichaReadiness(project) {
  return latestRevision(project, CAP.ficha)?.envelope?.data?.readiness?.status ?? null;
}

/** Etapa derivada do que já foi gravado; nunca regride (contrato §5.3). */
export function deriveStage(project) {
  let derivada = 'contexto';
  if (latestRevision(project, CAP.consolidar)) derivada = 'contexto_consolidado';
  const algumMotor = Object.keys(project.artifacts).some((k) => /^02-darklab-00[1-7]-/.test(k));
  if (algumMotor) derivada = 'darklab';
  const prontidao = fichaReadiness(project);
  if (prontidao && prontidao !== 'insuficiente') derivada = 'projeto_definido';
  if (latestRevision(project, CAP.epicos)) derivada = 'backlog';
  return stageIndex(derivada) > stageIndex(project.stage) ? derivada : project.stage;
}

function advanceStage(project, cause, now) {
  const nova = deriveStage(project);
  if (nova === project.stage) return project;
  const entradas = STAGES.slice(stageIndex(project.stage) + 1, stageIndex(nova) + 1).map((s) => ({ stage: s.id, at: now, cause }));
  return { ...project, stage: nova, stageHistory: [...project.stageHistory, ...entradas] };
}

// ───────────────────────────── backlog (árvore) ─────────────────────────────

export function backlogEpics(project) {
  return latestRevision(project, CAP.epicos)?.envelope?.data?.epics ?? [];
}

export function backlogFeatures(project, epicId) {
  return latestRevision(project, CAP.features, epicId)?.envelope?.data?.features ?? [];
}

export function backlogStories(project, featureId) {
  return latestRevision(project, CAP.historias, featureId)?.envelope?.data?.stories ?? [];
}

export function backlogTasks(project, storyId) {
  return latestRevision(project, CAP.oQueFazer, storyId)?.envelope?.data?.tasks ?? [];
}

export function backlogCounts(project) {
  const epics = backlogEpics(project);
  let features = 0;
  let stories = 0;
  let tasks = 0;
  for (const e of epics) {
    const fs = backlogFeatures(project, e.id);
    features += fs.length;
    for (const f of fs) {
      const ss = backlogStories(project, f.id);
      stories += ss.length;
      for (const s of ss) tasks += backlogTasks(project, s.id).length;
    }
  }
  return { epics: epics.length, features, stories, tasks };
}

// ───────────────────────────── elegibilidade ─────────────────────────────

/**
 * Diz se a capacidade pode rodar agora no projeto e, se não puder, por quê.
 * `scopeKey` é a fonte (001), o Épico (002), a Feature (003) ou a História (004).
 */
export function checkEligibility(project, catalog, capabilityId, scopeKey = 'projeto') {
  const cap = catalog.byId.get(capabilityId);
  if (!project) return { ok: false, reason: 'Crie ou selecione um projeto no Contexto.' };
  if (!cap) return { ok: false, reason: 'Capacidade fora do catálogo.' };

  if (capabilityId === CAP.analisar) {
    const fonte = project.sources.find((s) => s.id === scopeKey);
    return fonte ? { ok: true } : { ok: false, reason: 'Envie a fonte antes de analisar.' };
  }
  if (capabilityId === CAP.consolidar) {
    if (!project.sources.length) return { ok: false, reason: 'Envie ao menos uma fonte.' };
    const pendentes = project.sources.filter((s) => !latestRevision(project, CAP.analisar, s.id));
    return pendentes.length
      ? { ok: false, reason: `Faltam analisar ${pendentes.length} fonte(s): ${pendentes.map((s) => s.id).join(', ')}.` }
      : { ok: true };
  }
  if (capabilityId === CAP.epicos) {
    const prontidao = fichaReadiness(project);
    if (!prontidao) return { ok: false, reason: 'Projeto não definido: gere a ficha do projeto no DarkLabs.', code: 'projeto_nao_definido' };
    if (prontidao === 'insuficiente') {
      return { ok: false, reason: 'Projeto não definido: a ficha está insuficiente (falta o backlog do futuro do M7).', code: 'projeto_nao_definido' };
    }
  }
  if (capabilityId === CAP.features && !backlogEpics(project).some((e) => e.id === scopeKey)) {
    return { ok: false, reason: 'Épico inexistente na revisão atual.' };
  }
  if (capabilityId === CAP.historias && !findFeature(project, scopeKey)) {
    return { ok: false, reason: 'Feature inexistente na revisão atual.' };
  }
  if (capabilityId === CAP.oQueFazer && !findStory(project, scopeKey)) {
    return { ok: false, reason: 'História inexistente na revisão atual.' };
  }

  const faltando = cap.dependencies.filter((dep) => {
    if (dep === CAP.analisar) return false; // coberto pela regra da 002
    if ([CAP.features, CAP.historias, CAP.epicos].includes(dep) && capabilityId.startsWith('03-')) return false; // coberto pelo pai
    return !latestRevision(project, dep);
  });
  if (faltando.length) {
    const nomes = faltando.map((d) => catalog.byId.get(d)?.step ?? d);
    return { ok: false, reason: `Depende de ${nomes.join(', ')} ainda não gerado(s).` };
  }
  return { ok: true };
}

function findFeature(project, featureId) {
  const epicId = featureId.split('-FTR-')[0];
  return backlogFeatures(project, epicId).find((f) => f.id === featureId) ?? null;
}

function findStory(project, storyId) {
  const featureId = storyId.split('-US-')[0];
  return backlogStories(project, featureId).find((s) => s.id === storyId) ?? null;
}

// ───────────────────────────── execução simulada ─────────────────────────────

function variacoes(base, total, idDe, extra = () => ({})) {
  return Array.from({ length: total }, (_, i) => ({
    ...clone(base),
    id: idDe(i + 1),
    ...(i > 0 ? { title: `${base.title} (variação simulada ${i + 1})` } : {}),
    ...extra(i),
  }));
}

/** Ajusta o exemplo da capacidade ao projeto, ao escopo e à revisão. */
export function simulateEnvelope(project, cap, { scopeKey = 'projeto', revision, runId, now }) {
  const env = clone(cap.example) ?? { data: {} };
  env.capabilityId = cap.id;
  env.projectId = project.projectId;
  env.runId = runId;
  env.revision = revision;
  env.generatedAt = now;
  if (env.inputsSnapshot) env.inputsSnapshot.snapshotId = `snp_${runId.slice(4)}`;
  const d = env.data ?? (env.data = {});

  if (cap.id === CAP.analisar) {
    const fonte = project.sources.find((s) => s.id === scopeKey);
    d.sourceId = scopeKey;
    env.summary = `Análise simulada de ${fonte?.name ?? scopeKey} (${scopeKey}). ${env.summary ?? ''}`.trim();
  }
  if (cap.id === CAP.consolidar) {
    d.batchId = project.batchId;
    d.sourcesConsolidated = project.sources.map((s) => ({ sourceId: s.id, sourceRevision: 1 }));
  }
  if (cap.id === CAP.ficha) {
    const m7 = latestRevision(project, CAP.motor7)?.envelope?.data;
    d.project = { ...(d.project ?? {}), projectId: project.projectId, code: project.code, name: project.name };
    if (m7?.futureBacklog?.length) {
      d.backlogSeeds = m7.futureBacklog.map((f, i) => ({
        futureBacklogId: f.id,
        title: f.title,
        horizon: f.horizon ?? 'agora',
        priority: f.priority ?? null,
        rank: f.rank ?? i + 1,
        inScope: true,
        reason: 'Item do backlog do futuro do M7 dentro do escopo da ficha (simulado).',
      }));
    } else {
      d.backlogSeeds = [];
      d.readiness = {
        status: 'insuficiente',
        blockingGapIds: ['GAP-001'],
        note: 'Sem o Motor 7 não há sementes do backlog; execute o M7 e regenere a ficha.',
      };
      env.summary = `Ficha do ${project.code} insuficiente: o Motor 7 ainda não foi executado.`;
    }
  }
  if (cap.id === CAP.epicos) {
    const sementes = latestRevision(project, CAP.ficha)?.envelope?.data?.backlogSeeds?.filter((s) => s.inScope) ?? [];
    const base = d.epics?.[0];
    if (base) {
      const total = Math.max(1, sementes.length);
      d.epics = variacoes(base, total, (n) => `EPC-${pad3(n)}`, (i) => (sementes[i] ? { title: sementes[i].title } : {}));
    }
  }
  if (cap.id === CAP.features && d.features?.[0]) {
    d.features = variacoes(d.features[0], 2, (n) => `${scopeKey}-FTR-${pad3(n)}`, () => ({ epicId: scopeKey }));
  }
  if (cap.id === CAP.historias && d.stories?.[0]) {
    const epicId = scopeKey.split('-FTR-')[0];
    d.stories = variacoes(d.stories[0], 2, (n) => `${scopeKey}-US-${pad3(n)}`, () => ({ featureId: scopeKey, epicId }));
  }
  if (cap.id === CAP.oQueFazer && d.tasks?.length) {
    d.tasks = d.tasks.map((t, i) => ({ ...t, id: `${scopeKey}-TSK-${pad3(i + 1)}`, storyId: scopeKey }));
  }
  return env;
}

/** Grava uma revisão simulada e devolve o projeto atualizado. */
export function applyCapabilityRun(project, catalog, capabilityId, { scopeKey = 'projeto', now = new Date().toISOString(), runId = randomId('run'), record = true } = {}) {
  const cap = catalog.byId.get(capabilityId);
  const elig = checkEligibility(project, catalog, capabilityId, scopeKey);
  if (!elig.ok) throw Object.assign(new Error(elig.reason), { code: elig.code ?? 'nao_elegivel' });
  const key = artifactKey(capabilityId, scopeKey);
  const anteriores = project.artifacts[key] ?? [];
  const revision = anteriores.length + 1;
  const envelope = simulateEnvelope(project, cap, { scopeKey, revision, runId, now });
  const rev = { revision, runId, generatedAt: now, reviewState: 'não revisado', reviewLog: [], envelope };
  let proximo = { ...project, artifacts: { ...project.artifacts, [key]: [...anteriores, rev] } };
  if (capabilityId === CAP.analisar) {
    proximo.sources = proximo.sources.map((s) => (s.id === scopeKey ? { ...s, status: 'analisada' } : s));
  }
  if (record) {
    proximo.runs = [
      { runId, kind: 'capability', phase: cap.phase, capabilityId, scopeKey, status: 'succeeded', startedAt: now, finishedAt: now, revision },
      ...proximo.runs,
    ];
  }
  return advanceStage(proximo, `${cap.step} ${cap.phase === 'contexto' ? 'Contexto' : cap.phase === 'darklab' ? 'DarkLabs' : 'Backlog'} r${revision}`, now);
}

export function setReviewState(project, capabilityId, scopeKey, revision, reviewState, role, now = new Date().toISOString()) {
  if (!REVIEW_STATES.includes(reviewState)) throw new Error('Estado de revisão inválido.');
  if (reviewState === 'aceito' && !can(role, 'accept')) throw new Error('Só Aprovador ou Administrador marca "aceito".');
  if (!can(role, 'review')) throw new Error('Leitor não altera o estado de revisão.');
  const key = artifactKey(capabilityId, scopeKey);
  const lista = (project.artifacts[key] ?? []).map((r) =>
    r.revision === revision ? { ...r, reviewState, reviewLog: [...(r.reviewLog ?? []), { reviewState, role, at: now }] } : r,
  );
  return { ...project, artifacts: { ...project.artifacts, [key]: lista } };
}

// ───────────────────────────── Modo Turbo ─────────────────────────────

/** Grafo inicial do Turbo da fase. O do Backlog se expande à medida que os níveis são gravados. */
export function planTurbo(project, catalog, phase) {
  const caps = catalog.byPhase[phase].filter((c) => !c.isTurbo);
  const nodes = [];
  if (phase === 'contexto') {
    const analises = project.sources.map((s) => ({ nodeKey: `001:${s.id}`, capabilityId: CAP.analisar, scopeKey: s.id, dependsOn: [] }));
    nodes.push(...analises);
    for (const c of caps.filter((x) => x.id !== CAP.analisar)) {
      const deps = c.dependencies
        .filter((d) => catalog.byId.has(d))
        .flatMap((d) => (d === CAP.analisar ? analises.map((a) => a.nodeKey) : [`${catalog.byId.get(d).step}:projeto`]));
      nodes.push({ nodeKey: `${c.step}:projeto`, capabilityId: c.id, scopeKey: 'projeto', dependsOn: deps });
    }
  } else if (phase === 'darklab') {
    let anterior = null;
    for (const c of caps) {
      nodes.push({ nodeKey: `${c.step}:projeto`, capabilityId: c.id, scopeKey: 'projeto', dependsOn: anterior ? [anterior] : [] });
      anterior = `${c.step}:projeto`;
    }
  } else {
    nodes.push({ nodeKey: '001:projeto', capabilityId: CAP.epicos, scopeKey: 'projeto', dependsOn: [] });
  }
  return nodes.map((n) => ({ ...n, status: 'pending', attempts: 0, outputRevision: null, skipReason: null, error: null }));
}

export function startTurbo(project, catalog, phase, { now = new Date().toISOString(), runId = randomId('run'), failAt = null } = {}) {
  const turbo = catalog.byPhase[phase].find((c) => c.isTurbo);
  const run = {
    runId,
    kind: 'turbo',
    phase,
    capabilityId: turbo?.id ?? `${phase}-turbo`,
    status: 'running',
    startedAt: now,
    finishedAt: null,
    failAt,
    nodes: planTurbo(project, catalog, phase),
  };
  return { ...project, runs: [run, ...project.runs] };
}

function aggregate(nodes) {
  if (nodes.some((n) => ['pending', 'running'].includes(n.status))) return 'running';
  const ok = nodes.filter((n) => n.status === 'succeeded').length;
  if (ok === nodes.length) return 'succeeded';
  if (nodes.every((n) => n.status === 'cancelled' || n.status === 'succeeded') && nodes.some((n) => n.status === 'cancelled')) return 'cancelled';
  return ok ? 'partial' : 'failed';
}

function skipDependents(nodes, origem) {
  const afetados = new Set([origem]);
  let mudou = true;
  while (mudou) {
    mudou = false;
    for (const n of nodes) {
      if (n.status === 'pending' && !afetados.has(n.nodeKey) && n.dependsOn.some((d) => afetados.has(d))) {
        afetados.add(n.nodeKey);
        n.status = 'skipped';
        n.skipReason = `dependência ${origem} failed`;
        mudou = true;
      }
    }
  }
}

function expandBacklog(project, node) {
  const filhos = [];
  if (node.capabilityId === CAP.epicos) {
    for (const e of backlogEpics(project)) filhos.push({ nodeKey: `002:${e.id}`, capabilityId: CAP.features, scopeKey: e.id });
  } else if (node.capabilityId === CAP.features) {
    for (const f of backlogFeatures(project, node.scopeKey)) filhos.push({ nodeKey: `003:${f.id}`, capabilityId: CAP.historias, scopeKey: f.id });
  } else if (node.capabilityId === CAP.historias) {
    for (const s of backlogStories(project, node.scopeKey)) filhos.push({ nodeKey: `004:${s.id}`, capabilityId: CAP.oQueFazer, scopeKey: s.id });
  }
  return filhos.map((f) => ({ ...f, dependsOn: [node.nodeKey], status: 'pending', attempts: 0, outputRevision: null, skipReason: null, error: null }));
}

/** Executa o próximo nó pronto do Turbo em andamento. Devolve o projeto e se o run terminou. */
export function stepTurbo(project, catalog, runId, now = new Date().toISOString()) {
  const idx = project.runs.findIndex((r) => r.runId === runId);
  if (idx < 0) return { project, done: true };
  const run = clone(project.runs[idx]);
  if (run.status !== 'running') return { project, done: true };
  const pronto = run.nodes.find(
    (n) => n.status === 'pending' && n.dependsOn.every((d) => run.nodes.find((x) => x.nodeKey === d)?.status === 'succeeded'),
  );
  let proximo = project;
  if (pronto) {
    pronto.attempts += 1;
    const falhaSimulada = run.failAt && (pronto.nodeKey === run.failAt || pronto.capabilityId === run.failAt);
    if (falhaSimulada) {
      pronto.status = 'failed';
      pronto.attempts = 3;
      pronto.error = { code: 'saida_invalida', message: 'Falha simulada para validar a tela (3 tentativas).' };
      skipDependents(run.nodes, pronto.nodeKey);
    } else {
      try {
        proximo = applyCapabilityRun(proximo, catalog, pronto.capabilityId, { scopeKey: pronto.scopeKey, now, runId, record: false });
        pronto.status = 'succeeded';
        pronto.outputRevision = latestRevision(proximo, pronto.capabilityId, pronto.scopeKey).revision;
        if (run.phase === 'backlog-do-futuro') run.nodes.push(...expandBacklog(proximo, pronto));
      } catch (e) {
        pronto.status = 'failed';
        pronto.error = { code: e.code ?? 'nao_elegivel', message: e.message };
        skipDependents(run.nodes, pronto.nodeKey);
      }
    }
  } else {
    for (const n of run.nodes) {
      if (n.status === 'pending') {
        n.status = 'skipped';
        n.skipReason = n.skipReason ?? 'dependência não concluída';
      }
    }
  }
  run.status = aggregate(run.nodes);
  if (run.status !== 'running') run.finishedAt = now;
  const runs = [...proximo.runs];
  const pos = runs.findIndex((r) => r.runId === runId);
  runs[pos] = run;
  return { project: { ...proximo, runs }, done: run.status !== 'running' };
}

export function cancelTurbo(project, runId, now = new Date().toISOString()) {
  const runs = project.runs.map((r) => {
    if (r.runId !== runId || r.status !== 'running') return r;
    const nodes = r.nodes.map((n) => (n.status === 'pending' ? { ...n, status: 'cancelled' } : n));
    return { ...r, nodes, status: 'cancelled', finishedAt: now };
  });
  return { ...project, runs };
}

/** Roda o Turbo inteiro de uma vez (usado em testes e no modo "sem animação"). */
export function runTurboToCompletion(project, catalog, phase, opts = {}) {
  let p = startTurbo(project, catalog, phase, opts);
  const runId = p.runs[0].runId;
  for (let i = 0; i < 500; i += 1) {
    const r = stepTurbo(p, catalog, runId, opts.now);
    p = r.project;
    if (r.done) break;
  }
  return p;
}

// ───────────────────────────── persistência ─────────────────────────────

export function serializeState(state) {
  return JSON.stringify({ ...state, version: STORAGE_VERSION });
}

/** Projetos salvos com o identificador antigo (prj_…) recebem o novo formato em todas as referências. */
function migrarIdentificadores(state) {
  let selecionado = state.selectedProjectId;
  const convertidos = [];
  for (const p of state.projects) {
    if (PROJECT_ID_PATTERN.test(p.projectId)) {
      convertidos.push(p);
      continue;
    }
    const novoId = nextProjectId(convertidos, p.code, p.createdAt);
    const texto = JSON.stringify(p).split(JSON.stringify(p.projectId).slice(1, -1)).join(novoId);
    const migrado = JSON.parse(texto);
    if (selecionado === p.projectId) selecionado = novoId;
    convertidos.push(migrado);
  }
  return { ...state, selectedProjectId: selecionado, projects: convertidos };
}

export function parseState(texto) {
  try {
    const obj = JSON.parse(texto);
    if (!obj || obj.version !== STORAGE_VERSION || !Array.isArray(obj.projects)) return null;
    // Execuções que estavam em andamento quando a página fechou são canceladas.
    obj.projects = obj.projects.map((p) => ({
      ...p,
      runs: (p.runs ?? []).map((r) => (r.status === 'running' ? { ...r, status: 'cancelled', nodes: (r.nodes ?? []).map((n) => (n.status === 'pending' ? { ...n, status: 'cancelled' } : n)) } : r)),
    }));
    return migrarIdentificadores({ ...createEmptyState(), ...obj });
  } catch {
    return null;
  }
}
