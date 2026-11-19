import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInitialScenario } from '../src/data/initialRoadmapData.js';
import { buildCatalog } from '../src/domain/journey/capabilityParser.js';
import { addSources, applyCapabilityRun, createEmptyState, createProject, runTurboToCompletion, selectedProject } from '../src/domain/journey/journeyEngine.js';
import { runSimulation } from '../src/domain/simulationEngine.js';
import { DICAS_DA_ABA, aguardandoRevisao, montarPedidoAoModelo, responderLocal, resumoDaJornada, sugestoesDaAba } from '../src/components/shell/mascotChatEngine.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const pastaSpecs = path.resolve(aqui, '../../../especificações');
const catalog = buildCatalog(
  Object.fromEntries(fs.readdirSync(pastaSpecs).filter((n) => n.endsWith('.md')).map((n) => [n, fs.readFileSync(path.join(pastaSpecs, n), 'utf8')])),
);
const NOW = '2026-11-02T12:00:00.000Z';
const scenario = createInitialScenario();
const result = runSimulation(scenario);

function projeto() {
  let p = selectedProject(createProject(createEmptyState(), { name: 'Projeto de teste', projectId: 'prj_mc', now: NOW }));
  p = addSources(p, [{ name: 'doc.pdf', size: 10, type: 'application/pdf' }], NOW);
  return runTurboToCompletion(p, catalog, 'contexto', { now: NOW });
}
const motor = (n) => catalog.byPhase.darklab.find((c) => c.number === n).id;

test('saudação e perguntas sem projeto', () => {
  const oi = responderLocal({ texto: 'Olá!', tab: 'planejamento', scenario, result });
  assert.match(oi.texto, /Sou o Delta/);
  assert.deepEqual(oi.sugestoes, sugestoesDaAba('planejamento'));
  const passo = responderLocal({ texto: 'qual é o próximo passo?', tab: 'contexto' });
  assert.match(passo.texto, /criar o projeto/);
  assert.equal(passo.acoes[0].aba, 'contexto');
  assert.equal(responderLocal({ texto: '   ' }), null);
});

test('simulação: gargalo vem do mesmo motor de insights do Delta', () => {
  const r = responderLocal({ texto: 'Qual squad é o gargalo?', tab: 'planejamento', scenario, result });
  assert.match(r.texto, /gargalo/i);
  assert.ok(r.bullets.length >= 1);
  const f = responderLocal({ texto: 'Quanto entregamos até o Freezing?', tab: 'planejamento', scenario, result });
  assert.ok(f.texto.length > 20);
});

test('jornada: próximo passo, revisão e resumo usam o projeto', () => {
  let p = projeto();
  const ctx = (texto) => ({ texto, tab: 'darklab', scenario, result, project: p, catalog, pending: {} });
  assert.match(responderLocal(ctx('Qual é o próximo passo?')).texto, /executar o Motor 1/);
  p = applyCapabilityRun(p, catalog, motor(1), { now: NOW });
  const j = resumoDaJornada({ project: p, catalog });
  assert.equal(j.produzidos, 1);
  assert.equal(j.aguardando, aguardandoRevisao(p));
  assert.match(responderLocal(ctx('Qual é o próximo passo?')).texto, /revisar: 1 motor/);
  assert.match(responderLocal(ctx('O que falta revisar?')).texto, new RegExp(`^${j.aguardando} resultado`));
  const resumo = responderLocal(ctx('Resumo do projeto'));
  assert.match(resumo.texto, /Projeto de teste/);
  assert.equal(resumo.bullets.length, 7);
});

test('a mascote não executa: pedidos de ação levam ao Delta completo', () => {
  for (const texto of ['Prepare uma proposta de balanceamento', 'executa o motor 2', 'aplica o ajuste']) {
    const r = responderLocal({ texto, tab: 'resultados', scenario, result });
    assert.match(r.texto, /não (faço|altero)/);
    assert.deepEqual(r.acoes, [{ rotulo: 'Abrir o Delta completo', tipo: 'delta' }]);
  }
  const fora = responderLocal({ texto: 'qual a capital da França?', tab: 'curva', scenario, result });
  assert.equal(fora.acoes[0].tipo, 'delta');
});

test('ajuda da página usa a dica da aba; pedido ao modelo leva contexto e não leva segredos', () => {
  const ajuda = responderLocal({ texto: 'o que faço nesta página?', tab: 'darklab' });
  assert.ok(ajuda.texto.includes(DICAS_DA_ABA.darklab.texto));
  const { sistema, usuario } = montarPedidoAoModelo({ texto: 'e agora?', historico: [{ role: 'user', texto: 'oi' }], tab: 'planejamento', scenario, result, project: projeto(), catalog });
  assert.match(sistema, /não executa ações/);
  assert.match(usuario, /Página atual: Cronograma/);
  assert.match(usuario, /Pergunta: e agora\?$/);
  assert.doesNotMatch(`${sistema}${usuario}`, /apiKey|sk-/i);
});
