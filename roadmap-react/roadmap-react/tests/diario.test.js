import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../src/domain/journey/capabilityParser.js';
import { addSources, applyCapabilityRun, createEmptyState, createProject, runTurboToCompletion, selectedProject, setReviewState } from '../src/domain/journey/journeyEngine.js';
import { montarDiario } from '../src/components/darklab/diarioData.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const pastaSpecs = path.resolve(aqui, '../../../especificações');
const catalog = buildCatalog(
  Object.fromEntries(fs.readdirSync(pastaSpecs).filter((n) => n.endsWith('.md')).map((n) => [n, fs.readFileSync(path.join(pastaSpecs, n), 'utf8')])),
);
const motor = (n) => catalog.byPhase.darklab.find((c) => c.number === n).id;

test('projeto novo: só a criação aparece', () => {
  const p = selectedProject(createProject(createEmptyState(), { name: 'Teste', projectId: 'prj_db', now: '2026-10-19T12:00:00Z' }));
  const d = montarDiario({ project: p, catalog });
  assert.equal(d.publicacoes.length, 1);
  assert.equal(d.publicacoes[0].tipo, 'projeto');
  assert.equal(d.indicadores.fontes, 0);
  assert.equal(d.movimentos[0].total, 1);
});

test('fontes por dia, execuções agrupadas por rodada, aceites e etapas em ordem cronológica', () => {
  let p = selectedProject(createProject(createEmptyState(), { name: 'Teste', projectId: 'prj_db2', now: '2026-10-19T12:00:00Z' }));
  p = addSources(p, [{ name: 'a.pdf' }, { name: 'b.pdf' }], '2026-10-21T10:00:00Z');
  p = runTurboToCompletion(p, catalog, 'contexto', { now: '2026-10-22T10:00:00Z' });
  p = applyCapabilityRun(p, catalog, motor(1), { now: '2026-10-27T10:00:00Z' });
  p = setReviewState(p, motor(1), 'projeto', 1, 'aceito', 'Aprovador', '2026-10-28T10:00:00Z');
  const d = montarDiario({ project: p, catalog });
  const tipos = d.publicacoes.map((x) => x.tipo);
  assert.deepEqual([...new Set(tipos)].sort(), ['aceite', 'etapa', 'execucao', 'fontes', 'projeto']);
  assert.equal(d.publicacoes.filter((x) => x.tipo === 'fontes').length, 1, 'duas fontes no mesmo dia = uma publicação');
  const turbo = d.publicacoes.find((x) => x.tipo === 'execucao' && x.itens.length > 1);
  assert.ok(turbo && /Contexto/.test(turbo.titulo));
  const m1 = d.publicacoes.find((x) => x.tipo === 'execucao' && x.motores.includes(1));
  assert.deepEqual(m1.etapas, [1]);
  const datas = d.publicacoes.map((x) => x.at);
  assert.deepEqual(datas, [...datas].sort());
  assert.equal(d.indicadores.aceitas, 1);
  assert.equal(new Date(d.indicadores.posicao).toISOString(), '2026-10-28T10:00:00.000Z');
  assert.ok(d.movimentos[2].total >= 2, 'M1 conta em "Escutar o negócio"');
  assert.deepEqual(d.caminho.slice(0, 2), ['Contexto', 'Contexto consolidado']);
});
