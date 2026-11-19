import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../src/domain/journey/capabilityParser.js';
import { CAP, addSources, createEmptyState, createProject, runTurboToCompletion, selectedProject, setReviewState } from '../src/domain/journey/journeyEngine.js';
import { montarFuturo } from '../src/components/darklab/futuroData.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const pastaSpecs = path.resolve(aqui, '../../../especificações');
const catalog = buildCatalog(
  Object.fromEntries(fs.readdirSync(pastaSpecs).filter((n) => n.endsWith('.md')).map((n) => [n, fs.readFileSync(path.join(pastaSpecs, n), 'utf8')])),
);
const NOW = '2026-11-02T12:00:00.000Z';

function projeto() {
  let p = selectedProject(createProject(createEmptyState(), { name: 'Projeto de teste', projectId: 'prj_jf', now: NOW }));
  p = addSources(p, [{ name: 'doc.pdf', size: 10, type: 'application/pdf' }], NOW);
  return runTurboToCompletion(p, catalog, 'contexto', { now: NOW });
}

test('sem DarkLabs executado: nenhuma condição atendida e ciclo não iniciado', () => {
  const f = montarFuturo({ project: projeto(), catalog, agora: new Date(2026, 10, 17) });
  assert.deepEqual(
    f.condicoes.map((c) => c.status),
    ['falta', 'falta', 'manual', 'manual'],
  );
  assert.equal(f.liberado, false);
  assert.equal(f.posicao, 'Não iniciado na posição de 17/11/2026.');
  assert.equal(f.temM7, false);
  assert.deepEqual(
    f.linhas.map((l) => l.numero),
    [5, 6, 7],
  );
});

test('com o DarkLabs completo: ficha, MVP e backlog do futuro alimentam a tela', () => {
  let p = runTurboToCompletion(projeto(), catalog, 'darklab', { now: NOW });
  let f = montarFuturo({ project: p, catalog });
  assert.equal(f.condicoes[0].status, 'pendente', 'ficha gerada ainda sem aceite');
  assert.equal(f.condicoes[1].status, 'ok');
  assert.equal(f.temM7, true);
  assert.ok(f.backlog.length >= 1);
  assert.ok(f.gatilhos.length >= 1);
  assert.match(f.posicao, /^3 de 3 motores com resultado/);

  p = setReviewState(p, CAP.ficha, 'projeto', 1, 'aceito', 'Administrador', NOW);
  const confirmacoes = { owners: { por: 'Aprovador', em: NOW }, guardrails: { por: 'Aprovador', em: NOW } };
  f = montarFuturo({ project: p, catalog, confirmacoes });
  assert.equal(f.atendidas, 4);
  assert.equal(f.liberado, true);
  assert.equal(f.condicoes[2].confirmadoPor, 'Aprovador');
});
