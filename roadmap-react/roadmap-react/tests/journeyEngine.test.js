import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog, parseCapability } from '../src/domain/journey/capabilityParser.js';
import {
  PROJECT_ID_PATTERN,
  CAP,
  createEmptyState,
  createProject,
  selectedProject,
  addSources,
  checkEligibility,
  applyCapabilityRun,
  runTurboToCompletion,
  latestRevision,
  backlogCounts,
  backlogEpics,
  setReviewState,
  serializeState,
  parseState,
  can,
  startTurbo,
  stepTurbo,
  cancelTurbo,
} from '../src/domain/journey/journeyEngine.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const pastaSpecs = path.resolve(aqui, '../../../especificações');
const arquivos = Object.fromEntries(
  fs.readdirSync(pastaSpecs).filter((n) => n.endsWith('.md')).map((n) => [n, fs.readFileSync(path.join(pastaSpecs, n), 'utf8')]),
);
const catalog = buildCatalog(arquivos);
const NOW = '2026-11-18T15:00:00.000Z';

function projetoComFontes(n = 2) {
  let state = createProject(createEmptyState(), { name: 'Projeto de teste', projectId: 'prj_teste', now: NOW });
  let p = selectedProject(state);
  p = addSources(p, Array.from({ length: n }, (_, i) => ({ name: `doc-${i + 1}.pdf`, size: 1000, type: 'application/pdf' })), NOW);
  return p;
}

describe('catálogo lido de especificações/', () => {
  test('carrega as capacidades das três fases, sem 000, 00-* e obsoletos', () => {
    assert.equal(catalog.byPhase.contexto.length, 11);
    assert.equal(catalog.byPhase.darklab.length, 9);
    assert.equal(catalog.byPhase['backlog-do-futuro'].length, 5);
    assert.ok(!catalog.byId.has('02-darklab-008-modo-turbo'), 'arquivo obsoleto não entra');
    assert.ok(catalog.byId.get(CAP.ficha).example?.data?.readiness);
  });

  test('ignora arquivos fora do padrão e marcados como obsoletos', () => {
    assert.equal(parseCapability('00-contrato.md', '---\nid: x\n---'), null);
    assert.equal(parseCapability('02-darklab-008-modo-turbo.md', '---\nstatus: obsoleto\n---\n# x'), null);
  });
});

describe('projeto criado no Contexto', () => {
  test('gera projectId, código PRJ-NNN sequencial e etapa contexto', () => {
    let s = createProject(createEmptyState(), { name: 'Primeiro', projectId: 'prj_a', now: NOW });
    s = createProject(s, { name: 'Segundo', projectId: 'prj_b', now: NOW });
    assert.deepEqual(s.projects.map((p) => p.code), ['PRJ-001', 'PRJ-002']);
    assert.equal(s.selectedProjectId, 'prj_b');
    assert.equal(s.projects[0].stage, 'contexto');
    assert.throws(() => createProject(s, { name: '  ' }));
  });

  test('todas as saídas carregam o mesmo projectId', () => {
    let p = projetoComFontes(1);
    p = runTurboToCompletion(p, catalog, 'contexto', { now: NOW });
    p = runTurboToCompletion(p, catalog, 'darklab', { now: NOW });
    for (const revisoes of Object.values(p.artifacts)) {
      for (const r of revisoes) assert.equal(r.envelope.projectId, 'prj_teste');
    }
    assert.equal(latestRevision(p, CAP.ficha).envelope.data.project.code, 'PRJ-001');
  });
});

describe('Contexto', () => {
  test('a consolidação só libera depois de todas as fontes analisadas', () => {
    let p = projetoComFontes(2);
    assert.equal(checkEligibility(p, catalog, CAP.consolidar).ok, false);
    p = applyCapabilityRun(p, catalog, CAP.analisar, { scopeKey: 'SRC-001', now: NOW });
    assert.match(checkEligibility(p, catalog, CAP.consolidar).reason, /SRC-002/);
    p = applyCapabilityRun(p, catalog, CAP.analisar, { scopeKey: 'SRC-002', now: NOW });
    assert.equal(checkEligibility(p, catalog, CAP.consolidar).ok, true);
    p = applyCapabilityRun(p, catalog, CAP.consolidar, { now: NOW });
    assert.equal(p.stage, 'contexto_consolidado');
  });

  test('Turbo do Contexto grava 001 por fonte, 002 e as oito gerações', () => {
    const p = runTurboToCompletion(projetoComFontes(3), catalog, 'contexto', { now: NOW });
    const run = p.runs[0];
    assert.equal(run.status, 'succeeded');
    assert.equal(run.nodes.length, 3 + 1 + 8);
  });

  test('falha simulada na 005 deixa rodar só 003 e 004', () => {
    const p = runTurboToCompletion(projetoComFontes(1), catalog, 'contexto', { now: NOW, failAt: '005:projeto' });
    const run = p.runs[0];
    const st = Object.fromEntries(run.nodes.map((n) => [n.nodeKey, n.status]));
    assert.equal(run.status, 'partial');
    assert.equal(st['005:projeto'], 'failed');
    assert.equal(st['003:projeto'], 'succeeded');
    assert.equal(st['004:projeto'], 'succeeded');
    for (const k of ['006', '007', '008', '009', '010']) assert.equal(st[`${k}:projeto`], 'skipped', k);
  });
});

describe('DarkLab → Projeto → Backlog', () => {
  test('sem M7 a ficha sai insuficiente e o Backlog fica travado', () => {
    let p = runTurboToCompletion(projetoComFontes(1), catalog, 'contexto', { now: NOW });
    p = applyCapabilityRun(p, catalog, CAP.motor1, { now: NOW });
    assert.equal(p.stage, 'darklab');
    p = applyCapabilityRun(p, catalog, CAP.ficha, { now: NOW });
    assert.equal(latestRevision(p, CAP.ficha).envelope.data.readiness.status, 'insuficiente');
    const elig = checkEligibility(p, catalog, CAP.epicos);
    assert.equal(elig.ok, false);
    assert.equal(elig.code, 'projeto_nao_definido');
    assert.equal(p.stage, 'darklab');
  });

  test('Turbo do DarkLab termina na ficha e define o projeto', () => {
    let p = runTurboToCompletion(projetoComFontes(1), catalog, 'contexto', { now: NOW });
    p = runTurboToCompletion(p, catalog, 'darklab', { now: NOW });
    assert.equal(p.runs[0].nodes.length, 8);
    assert.equal(p.runs[0].nodes.at(-1).capabilityId, CAP.ficha);
    assert.equal(p.stage, 'projeto_definido');
    assert.ok(latestRevision(p, CAP.ficha).envelope.data.backlogSeeds.length >= 1);
    assert.equal(checkEligibility(p, catalog, CAP.epicos).ok, true);
  });

  test('Turbo do Backlog expande a árvore até o o que fazer', () => {
    let p = runTurboToCompletion(projetoComFontes(1), catalog, 'contexto', { now: NOW });
    p = runTurboToCompletion(p, catalog, 'darklab', { now: NOW });
    p = runTurboToCompletion(p, catalog, 'backlog-do-futuro', { now: NOW });
    const c = backlogCounts(p);
    assert.equal(p.stage, 'backlog');
    assert.equal(c.epics, latestRevision(p, CAP.ficha).envelope.data.backlogSeeds.length);
    assert.equal(c.features, c.epics * 2);
    assert.equal(c.stories, c.features * 2);
    assert.ok(c.tasks >= c.stories);
    assert.equal(p.runs[0].status, 'succeeded');
    assert.match(backlogEpics(p)[0].id, /^EPC-\d{3}$/);
  });

  test('a etapa nunca regride ao regenerar', () => {
    let p = runTurboToCompletion(projetoComFontes(1), catalog, 'contexto', { now: NOW });
    p = runTurboToCompletion(p, catalog, 'darklab', { now: NOW });
    p = applyCapabilityRun(p, catalog, CAP.consolidar, { now: NOW });
    assert.equal(p.stage, 'projeto_definido');
    assert.equal(latestRevision(p, CAP.consolidar).revision, 2);
  });

  test('cancelar um Turbo marca os nós pendentes como cancelados', () => {
    let p = runTurboToCompletion(projetoComFontes(1), catalog, 'contexto', { now: NOW });
    p = startTurbo(p, catalog, 'darklab', { now: NOW });
    const runId = p.runs[0].runId;
    p = stepTurbo(p, catalog, runId, NOW).project;
    p = cancelTurbo(p, runId, NOW);
    assert.equal(p.runs[0].status, 'cancelled');
    assert.equal(p.runs[0].nodes.filter((n) => n.status === 'succeeded').length, 1);
    assert.ok(p.runs[0].nodes.slice(1).every((n) => n.status === 'cancelled'));
  });
});

describe('revisão humana e papéis', () => {
  test('só Aprovador e Administrador marcam aceito; Leitor não revisa', () => {
    let p = projetoComFontes(1);
    p = applyCapabilityRun(p, catalog, CAP.analisar, { scopeKey: 'SRC-001', now: NOW });
    assert.throws(() => setReviewState(p, CAP.analisar, 'SRC-001', 1, 'aceito', 'Editor'));
    assert.throws(() => setReviewState(p, CAP.analisar, 'SRC-001', 1, 'revisado', 'Leitor'));
    p = setReviewState(p, CAP.analisar, 'SRC-001', 1, 'aceito', 'Aprovador', NOW);
    assert.equal(latestRevision(p, CAP.analisar, 'SRC-001').reviewState, 'aceito');
    assert.equal(can('Leitor', 'run'), false);
    assert.equal(can('Editor', 'run'), true);
  });
});

describe('identificador interno do projeto', () => {
  test('segue PRJ-NNN-AAAA-MM-DD-SS e conta a sequência do dia', () => {
    let s = createProject(createEmptyState(), { name: 'A', now: NOW });
    s = createProject(s, { name: 'B', now: NOW });
    s = createProject(s, { name: 'C', now: '2026-11-20T15:00:00.000Z' });
    assert.deepEqual(
      s.projects.map((p) => p.projectId),
      ['PRJ-001-2026-11-18-01', 'PRJ-002-2026-11-18-02', 'PRJ-003-2026-11-20-01'],
    );
    assert.ok(s.projects.every((p) => PROJECT_ID_PATTERN.test(p.projectId)));
    assert.equal(s.projects[0].batchId, 'LOT-001-2026-11-18-01');
  });

  test('converte o formato antigo em todas as referências ao abrir', () => {
    let s = createProject(createEmptyState(), { name: 'Antigo', projectId: 'prj_mwmgfrbnhw6sr', now: NOW });
    let p = addSources(selectedProject(s), [{ name: 'a.pdf' }], NOW);
    p = applyCapabilityRun(p, catalog, CAP.analisar, { scopeKey: 'SRC-001', now: NOW });
    s = { ...s, projects: [p] };
    const lido = parseState(serializeState(s));
    assert.equal(lido.projects[0].projectId, 'PRJ-001-2026-11-18-01');
    assert.equal(lido.selectedProjectId, 'PRJ-001-2026-11-18-01');
    assert.ok(!serializeState(lido).includes('prj_mwmgfrbnhw6sr'));
  });
});

describe('persistência', () => {
  test('ida e volta preserva o estado e cancela execuções interrompidas', () => {
    let s = createProject(createEmptyState(), { name: 'P', projectId: 'prj_p', now: NOW });
    let p = addSources(selectedProject(s), [{ name: 'a.pdf' }], NOW);
    p = startTurbo(p, catalog, 'contexto', { now: NOW });
    s = { ...s, projects: [p] };
    const lido = parseState(serializeState(s));
    assert.equal(lido.projects[0].code, 'PRJ-001');
    assert.equal(lido.projects[0].runs[0].status, 'cancelled');
    assert.equal(parseState('{"version":99}'), null);
    assert.equal(parseState('não é json'), null);
  });
});
