import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../src/domain/journey/capabilityParser.js';
import { addSources, applyCapabilityRun, createEmptyState, createProject, runTurboToCompletion, selectedProject, setReviewState } from '../src/domain/journey/journeyEngine.js';
import { JANELAS, janelasDosItens, lerData, montarJanelas, montarRoadmap, rotuloPeriodo, segundaDa } from '../src/components/darklab/roadmapData.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const pastaSpecs = path.resolve(aqui, '../../../especificações');
const catalog = buildCatalog(
  Object.fromEntries(fs.readdirSync(pastaSpecs).filter((n) => n.endsWith('.md')).map((n) => [n, fs.readFileSync(path.join(pastaSpecs, n), 'utf8')])),
);
const NOW = '2026-11-02T12:00:00.000Z';
const motor = (n) => catalog.byPhase.darklab.find((c) => c.number === n).id;

function projeto() {
  let p = selectedProject(createProject(createEmptyState(), { name: 'Projeto de teste', projectId: 'prj_rm', now: NOW }));
  p = addSources(p, [{ name: 'doc.pdf', size: 10, type: 'application/pdf' }], NOW);
  return runTurboToCompletion(p, catalog, 'contexto', { now: NOW });
}

test('janelas começam na segunda-feira da criação e marcam a janela atual', () => {
  assert.equal(segundaDa('2026-11-05T10:00:00').getDay(), 1);
  const { janelas, atual } = montarJanelas(new Date(2026, 10, 2), new Date(2026, 10, 12));
  assert.equal(janelas.length, JANELAS.length);
  assert.equal(janelas[0].rotulo, '02–08 nov');
  assert.equal(janelas[1].inicio.getDate(), 9);
  assert.equal(atual, 1);
  assert.equal(montarJanelas(new Date(2026, 10, 2), new Date(2026, 9, 1)).atual, -1);
  assert.equal(rotuloPeriodo(new Date(2026, 9, 27), new Date(2026, 10, 5)), '27 out–05 nov');
});

test('entregáveis se espalham pelas janelas do plano, na ordem', () => {
  assert.deepEqual(janelasDosItens([0, 1, 2, 3], 5), [0, 0, 1, 2, 3]);
  assert.deepEqual(janelasDosItens([1, 3, 5], 4), [1, 1, 3, 5]);
  assert.deepEqual(lerData('12/11', 2026), new Date(2026, 10, 12));
  assert.deepEqual(lerData('2026-11-20', 2000), new Date(2026, 10, 20));
  assert.equal(lerData('sem data', 2026), null);
});

test('sem motores executados: insumo disponível até agora e planejado depois', () => {
  const p = projeto();
  const r = montarRoadmap({ project: p, catalog, inicio: new Date(2026, 10, 2), agora: new Date(2026, 10, 10) });
  assert.equal(r.atual, 1);
  const m1 = r.linhas.find((l) => l.numero === 1);
  assert.equal(m1.situacao, 'nao');
  assert.equal(m1.celulas[0][0].status, 'insumo');
  assert.equal(m1.celulas[3][0].status, 'planejado');
  assert.equal(r.etapas.every((e) => e.situacao === 'nao'), true);
  assert.equal(r.aprendizados.length, 0);
  assert.equal(r.origemRoadmap, null);
});

test('motor executado marca as janelas como ativadas e alimenta aprendizados, etapas e roadmap', () => {
  let p = projeto();
  p = applyCapabilityRun(p, catalog, motor(1), { now: NOW });
  p = applyCapabilityRun(p, catalog, motor(2), { now: NOW });
  p = setReviewState(p, motor(1), 'projeto', 1, 'aceito', 'Administrador', NOW);
  p = setReviewState(p, motor(2), 'projeto', 1, 'aceito', 'Administrador', NOW);
  p = applyCapabilityRun(p, catalog, motor(3), { now: NOW });
  const r = montarRoadmap({ project: p, catalog, inicio: new Date(2026, 10, 2), agora: new Date(2026, 10, 18) });
  const m1 = r.linhas.find((l) => l.numero === 1);
  assert.equal(m1.situacao, 'aceito');
  assert.equal(m1.celulas[0][0].status, 'executado');
  assert.equal(m1.celulas[2][0].status, 'executado');
  assert.equal(m1.celulas[3][0].status, 'planejado');
  assert.equal(r.linhas.find((l) => l.numero === 3).celulas[1][0].status, 'produzido');
  assert.equal(r.linhas.find((l) => l.numero === 4).celulas[1][0].status, 'insumo');
  assert.equal(r.etapas[0].situacao, 'concluida');
  assert.ok(['andamento', 'impedida'].includes(r.etapas[1].situacao));
  assert.equal(r.aprendizados.length, 3);
  assert.equal(r.origemRoadmap, 'M3 · roadmap inicial');
  assert.ok(r.ondas.agora.length >= 1);
  const perguntas = r.lacunas.map((g) => g.pergunta);
  assert.equal(new Set(perguntas).size, perguntas.length, 'lacunas sem repetição');
  assert.equal(r.marcos.length, 4);
});

test('status registrado nas fontes tem prioridade sobre a situação do motor', () => {
  let p = projeto();
  p = applyCapabilityRun(p, catalog, motor(1), { now: NOW });
  const key = Object.keys(p.artifacts).find((k) => k.startsWith(motor(1)));
  const rev = p.artifacts[key][0];
  rev.envelope.data.deliverables[0].status = 'concluído';
  rev.envelope.data.deliverables[1].status = 'impedido';
  rev.envelope.data.activities = [{ id: 'ATV-001', period: '20/11/2026', title: 'Workshop com a área', status: 'em aceite' }];
  const r = montarRoadmap({ project: p, catalog, inicio: new Date(2026, 10, 2), agora: new Date(2026, 10, 4) });
  const m1 = r.linhas.find((l) => l.numero === 1);
  assert.equal(m1.celulas[0][0].status, 'executado');
  assert.equal(m1.celulas[0][1].status, 'impedido');
  const atividade = m1.celulas.flat().find((c) => c.tipo === 'atividade');
  assert.equal(atividade.status, 'produzido');
  assert.equal(r.janelas.findIndex((j, i) => m1.celulas[i].includes(atividade)), 2);
});

test('nada do roadmap depende de um case: textos vêm do catálogo e do projeto', () => {
  const p = applyCapabilityRun(projeto(), catalog, motor(1), { now: NOW });
  const r = montarRoadmap({ project: p, catalog, agora: new Date(2026, 10, 4) });
  const entregaveis = catalog.byId.get(motor(1)).example.data.deliverables.map((d) => d.name);
  assert.deepEqual(
    r.linhas.find((l) => l.numero === 1).celulas.flat().map((c) => c.titulo),
    entregaveis,
  );
});

test('exemplo ilustrativo colore a matriz sem tocar nos dados do projeto', () => {
  const p = projeto();
  const real = montarRoadmap({ project: p, catalog, inicio: new Date(2026, 10, 2), agora: new Date(2026, 10, 18) });
  assert.equal(real.semExecucao, true);
  const ex = montarRoadmap({ project: p, catalog, inicio: new Date(2026, 10, 2), agora: new Date(2026, 10, 18), exemplo: true });
  assert.equal(ex.exemplo, true);
  assert.equal(ex.semExecucao, false);
  const cores = new Set(ex.linhas.flatMap((l) => l.celulas.flat().map((c) => c.status)));
  for (const c of ['executado', 'produzido', 'ativado', 'insumo', 'planejado']) assert.ok(cores.has(c), c);
  assert.equal(ex.atual, 3, 'no exemplo, hoje cai na 4ª janela');
  assert.equal(ex.aprendizados.length, 0, 'exemplo não inventa aprendizados');
});

test('etapas do protocolo trazem prazo, motores e entregáveis sem repetição', () => {
  let p = projeto();
  p = applyCapabilityRun(p, catalog, motor(1), { now: NOW });
  const r = montarRoadmap({ project: p, catalog, inicio: new Date(2026, 10, 2), agora: new Date(2026, 10, 4) });
  const e1 = r.etapas[0];
  assert.equal(e1.prazo, 'Gate previsto em');
  assert.equal(e1.dataPrazo, '27 nov', 'fim da janela 4 (Gate 1 e arquitetura)');
  assert.deepEqual(
    e1.motoresDaEtapa.map((m) => m.numero),
    [1, 2],
  );
  const chaves = e1.entregaveis.map((d) => `${d.motor}:${d.titulo}`);
  assert.equal(new Set(chaves).size, chaves.length);
  assert.equal(e1.entregaveis.length, 9, '5 entregáveis do M1 + 4 do M2');
  assert.equal(r.etapas.every((e) => e.descricao && e.dataPrazo), true);
});
