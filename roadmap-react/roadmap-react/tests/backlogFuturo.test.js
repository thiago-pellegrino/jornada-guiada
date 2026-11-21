import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../src/domain/journey/capabilityParser.js';
import { addSources, createEmptyState, createProject, runTurboToCompletion, selectedProject } from '../src/domain/journey/journeyEngine.js';
import {
  catalogoDeFeatures,
  cruzamentoEpicoSuperficie,
  filtrarFeatures,
  filtrarHistorias,
  indicadores,
  matrizDeEpicos,
  modeloDoExemplo,
  modeloDoProjeto,
  porSuperficie,
} from '../src/domain/backlog/backlogFuturo.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const bruto = JSON.parse(fs.readFileSync(path.join(aqui, '../src/data/backlogFuturoExemplo.json'), 'utf8'));
const exemplo = modeloDoExemplo(bruto);

test('exemplo reproduz os totais do RESUMO da planilha', () => {
  assert.deepEqual(indicadores(exemplo), { historias: 1200, features: 207, epicos: 14, base: 734, novas: 466, ready: 0, authorized: 0 });
});

test('exemplo reproduz a tabela por aba (features, histórias, base)', () => {
  const esperado = {
    'MOD-A ELO': [21, 110, 65], 'MOD-B ORACULO': [18, 110, 56], 'MOD-C ORBITA': [18, 120, 52], 'MOD-D ARENA': [19, 100, 62],
    'MOD-E ATLAS': [23, 120, 69], 'MOD-F FUTURO': [21, 100, 75], 'ADMIN CORPORATE': [25, 150, 108], 'ADMIN STARTUP': [23, 150, 120],
    'ADMIN ZEUS': [24, 150, 93], 'SQUAD AURORA': [15, 90, 34],
  };
  const linhas = porSuperficie(exemplo);
  assert.equal(linhas.length, 10);
  for (const l of linhas) assert.deepEqual([l.features, l.historias, l.base], esperado[l.id], l.id);
  assert.ok(Math.abs(linhas.reduce((s, l) => s + l.pct, 0) - 1) < 1e-9);
});

test('exemplo reproduz a MATRIZ EPC (features relacionadas, base e total)', () => {
  const esperado = {
    'EPC-001': [3, 9, 17], 'EPC-002': [24, 41, 69], 'EPC-003': [30, 93, 139], 'EPC-004': [51, 147, 191], 'EPC-005': [11, 17, 53],
    'EPC-006': [37, 106, 132], 'EPC-007': [9, 36, 42], 'EPC-008': [20, 20, 87], 'EPC-009': [34, 68, 96], 'EPC-010': [29, 59, 93],
    'EPC-011': [12, 24, 54], 'EPC-012': [25, 49, 85], 'EPC-013': [15, 30, 53], 'EPC-014': [25, 35, 89],
  };
  for (const e of matrizDeEpicos(exemplo)) assert.deepEqual([e.features, e.base, e.total], esperado[e.id], e.id);
  const cruz = cruzamentoEpicoSuperficie(exemplo);
  assert.equal(cruz.valor('EPC-002', 'MOD-A ELO') > 0, true);
});

test('cada história do exemplo herda a onda do seu épico e as features somam 1.200 histórias', () => {
  const onda = new Map(exemplo.epicos.map((e) => [e.id, e.wave]));
  assert.ok(exemplo.historias.every((h) => h.wave === onda.get(h.epcId)));
  assert.equal(catalogoDeFeatures(exemplo).reduce((s, f) => s + f.historias, 0), 1200);
});

test('filtros combinam e a busca ignora acentos', () => {
  const w3 = filtrarHistorias(exemplo.historias, { wave: 'W3' });
  assert.equal(w3.length, 174);
  assert.ok(filtrarHistorias(exemplo.historias, { busca: 'login com microsoft' }).some((h) => h.id === 'HST-A-001'));
  assert.equal(filtrarHistorias(exemplo.historias, { tipo: 'HIPÓTESE', origem: 'NOVA_PROPOSTA' }).length, 21);
  assert.equal(filtrarFeatures(exemplo.features, { epcId: 'EPC-004' }).length, 51);
});

test('projeto: Contexto → DarkLabs → Backlog vira o mesmo formato, com derivações rastreáveis', () => {
  const dir = path.join(aqui, '../../../especificações');
  if (!fs.existsSync(dir)) return; // especificações ficam fora da pasta do app
  const arquivos = Object.fromEntries(fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => [path.join('x', f), fs.readFileSync(path.join(dir, f), 'utf8')]));
  const catalog = buildCatalog(arquivos);
  let s = createProject(createEmptyState(), { name: 'Crédito', company: { id: 'emp-aurora' }, now: '2026-11-21T10:00:00Z' });
  let p = selectedProject(s);
  p = addSources(p, [{ name: 'briefing.pdf', size: 1000, type: 'application/pdf' }], '2026-11-21T10:01:00Z');
  p = runTurboToCompletion(p, catalog, 'contexto', { now: '2026-11-21T10:02:00Z' });
  p = runTurboToCompletion(p, catalog, 'darklab', { now: '2026-11-21T10:03:00Z' });
  assert.equal(modeloDoProjeto(p).historias.length, 0);
  p = runTurboToCompletion(p, catalog, 'backlog-do-futuro', { now: '2026-11-21T10:04:00Z' });
  const m = modeloDoProjeto(p);
  const k = indicadores(m);
  assert.ok(k.epicos > 0 && k.features > 0 && k.historias > 0);
  for (const h of m.historias) {
    assert.ok(h.id.startsWith(`${h.featureId}-US-`));
    assert.ok(h.featureId.startsWith(`${h.epcId}-FTR-`));
    assert.match(h.wave, /^W\d$/);
    assert.equal(h.authorized, false);
    assert.equal(h.ready, false); // nenhuma série aceita ainda
  }
  assert.ok(m.ondas.length >= 1 && m.roadmap.colunas.length === m.ondas.length);
  assert.equal(porSuperficie(m).reduce((s2, l) => s2 + l.historias, 0), k.historias);
});
