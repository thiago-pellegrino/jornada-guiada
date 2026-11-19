import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../src/domain/journey/capabilityParser.js';
import { addSources, createEmptyState, createProject, runTurboToCompletion, selectedProject } from '../src/domain/journey/journeyEngine.js';
import { envelopesDeExemplo, envelopesDoProjeto, layoutForca, montarGrafo, montarPersonas, vizinhanca } from '../src/components/darklab/personasData.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const pastaSpecs = path.resolve(aqui, '../../../especificações');
const catalog = buildCatalog(
  Object.fromEntries(fs.readdirSync(pastaSpecs).filter((n) => n.endsWith('.md')).map((n) => [n, fs.readFileSync(path.join(pastaSpecs, n), 'utf8')])),
);

test('grafo liga entidades pelos campos de referência e ignora alvos inexistentes', () => {
  const g = montarGrafo([
    {
      origem: 'teste',
      envelope: {
        data: {
          segments: [{ id: 'SEG-001', name: 'Clientes' }],
          pains: [{ id: 'PAIN-001', description: 'Dor', segmentIds: ['SEG-001', 'SEG-999'] }],
          needs: [{ id: 'NEC-001', description: 'Precisa', painIds: ['PAIN-001'] }],
        },
      },
    },
  ]);
  assert.equal(g.nos.length, 3);
  assert.equal(g.arestas.length, 2);
  const [p] = montarPersonas(g);
  assert.equal(p.tipo, 'Segmento de clientes');
  assert.equal(p.dores[0].id, 'PAIN-001');
  assert.equal(p.necessidades[0].id, 'NEC-001', 'necessidade a 2 saltos');
  assert.match(p.sintese, /O que mais pesa: Dor\. O que precisa: Precisa\./);
});

test('vizinhança não atravessa outras personas', () => {
  const g = montarGrafo([{ origem: 't', envelope: { data: { a: [{ id: 'SEG-001' }, { id: 'ACT-001', segmentIds: ['SEG-001'] }, { id: 'PAIN-001', actorIds: ['ACT-001'] }] } } }]);
  const v = vizinhanca(g, 'SEG-001', 2);
  assert.ok(v.has('ACT-001'));
  assert.ok(!v.has('PAIN-001'));
});

test('projeto com Contexto e DarkLabs gera personas de atores, stakeholders e segmentos; layout fica dentro do quadro', () => {
  let p = selectedProject(createProject(createEmptyState(), { name: 'Teste', projectId: 'prj_ps', now: '2026-11-02T12:00:00Z' }));
  p = addSources(p, [{ name: 'doc.pdf' }], '2026-11-02T12:00:00Z');
  p = runTurboToCompletion(p, catalog, 'contexto', { now: '2026-11-02T12:00:00Z' });
  p = runTurboToCompletion(p, catalog, 'darklab', { now: '2026-11-02T12:00:00Z' });
  const g = montarGrafo(envelopesDoProjeto(p, catalog));
  const personas = montarPersonas(g);
  const tipos = new Set(personas.map((x) => x.id.split('-')[0]));
  for (const t of ['ACT', 'STK', 'SEG']) assert.ok(tipos.has(t), t);
  const pos = layoutForca(g, { largura: 1000, altura: 680, iteracoes: 60 });
  for (const n of g.nos) {
    assert.ok(pos[n.id].x >= 0 && pos[n.id].x <= 1000 && pos[n.id].y >= 0 && pos[n.id].y <= 680, n.id);
  }
  assert.deepEqual(layoutForca(g, { iteracoes: 30 }), layoutForca(g, { iteracoes: 30 }), 'layout determinístico');
});

test('exemplo ilustrativo usa os exemplos das especificações', () => {
  const g = montarGrafo(envelopesDeExemplo(catalog));
  assert.ok(montarPersonas(g).length >= 1);
  assert.ok(g.nos.every((n) => /\(exemplo\)$/.test(n.origem)));
});
