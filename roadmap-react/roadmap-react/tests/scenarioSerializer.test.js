import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialScenario } from '../src/data/initialRoadmapData.js';
import { runSimulation } from '../src/domain/simulationEngine.js';
import {
  STORAGE_KEY,
  LEGACY_AVG_KEY,
  LEGACY_SQUADS_KEY,
  loadScenario,
  saveScenario,
  migrateLegacy,
  serializeScenario,
  validateAndParseScenarioJson,
  buildCsv,
  fileTimestamp,
} from '../src/domain/scenarioSerializer.js';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    has: (key) => data.has(key),
  };
}

describe('Persistência local (roadmap.sim.v2)', () => {
  test('sem dados carrega o cenário inicial', () => {
    const { scenario, source } = loadScenario(memoryStorage());
    assert.equal(source, 'initial');
    assert.equal(scenario.premises.avgHoursPerStory, 56);
  });

  test('salvar e carregar preservam o cenário', () => {
    const storage = memoryStorage();
    const s = createInitialScenario();
    s.premises.avgHoursPerStory = 48;
    s.squads[1].people = 3;
    s.premises.schedulingMode = 'manual';
    s.manualAllocations = { 'A-1': { w03: 2.5 } };
    assert.equal(saveScenario(storage, s), true);
    const { scenario, source } = loadScenario(storage);
    assert.equal(source, 'v2');
    assert.equal(scenario.premises.avgHoursPerStory, 48);
    assert.equal(scenario.squads[1].people, 3);
    assert.deepEqual(scenario.manualAllocations, { 'A-1': { w03: 2.5 } });
  });

  test('migra roadmap.avg e roadmap.squads do protótipo anterior sem apagá-los', () => {
    const legacySquads = createInitialScenario().squads.map(({ key, title, people, features }) => ({
      key,
      title,
      people: key === 'C' ? 2 : people,
      features,
    }));
    const storage = memoryStorage({
      [LEGACY_AVG_KEY]: '40',
      [LEGACY_SQUADS_KEY]: JSON.stringify(legacySquads),
    });
    const { scenario, source } = loadScenario(storage);
    assert.equal(source, 'legacy');
    assert.equal(scenario.premises.avgHoursPerStory, 40);
    assert.equal(scenario.squads.find((q) => q.key === 'C').people, 2);
    assert.equal(scenario.squads[0].colorToken, '--chart-1');
    assert.ok(storage.has(LEGACY_AVG_KEY));
    assert.ok(storage.has(LEGACY_SQUADS_KEY));
  });

  test('migração ignora dados legados corrompidos', () => {
    const migrated = migrateLegacy(memoryStorage({ [LEGACY_SQUADS_KEY]: '{oops', [LEGACY_AVG_KEY]: 'abc' }));
    assert.equal(migrated.premises.avgHoursPerStory, 56);
    assert.equal(migrated.squads.length, 4);
  });

  test('v2 corrompido cai para o cenário inicial', () => {
    const { source } = loadScenario(memoryStorage({ [STORAGE_KEY]: 'not json' }));
    assert.equal(source, 'initial');
  });
});

describe('Importação e exportação JSON (ScenarioEnvelopeV2)', () => {
  test('ida e volta', () => {
    const s = createInitialScenario();
    s.squads[3].people = 5;
    const json = serializeScenario(s, new Date('2026-11-16T19:45:00Z'));
    const envelope = JSON.parse(json);
    assert.equal(envelope.schemaVersion, '2.0');
    assert.equal(envelope.app, 'nextprev-roadmap-simulator');
    assert.equal(envelope.exportedAt, '2026-11-16T19:45:00.000Z');
    const parsed = validateAndParseScenarioJson(json);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.state.squads[3].people, 5);
  });

  test('INVALID_JSON', () => {
    for (const text of ['', '   ', '{', '[]', '42']) {
      const r = validateAndParseScenarioJson(text);
      assert.equal(r.ok, false);
      assert.equal(r.errorCode, 'INVALID_JSON');
      assert.match(r.messagePtBr, /Arquivo inválido/);
    }
  });

  test('UNSUPPORTED_SCHEMA', () => {
    const r = validateAndParseScenarioJson(JSON.stringify({ schemaVersion: '1.0' }));
    assert.equal(r.errorCode, 'UNSUPPORTED_SCHEMA');
  });

  test('INVALID_PREMISES', () => {
    const envelope = JSON.parse(serializeScenario(createInitialScenario()));
    for (const premises of [
      { ...envelope.premises, avgHoursPerStory: 0 },
      { ...envelope.premises, avgHoursPerStory: 241 },
      { ...envelope.premises, hoursPerPersonPerWeek: 61 },
      { ...envelope.premises, schedulingMode: 'turbo' },
      { ...envelope.premises, startWeekId: 'freeze' },
    ]) {
      const r = validateAndParseScenarioJson(JSON.stringify({ ...envelope, premises }));
      assert.equal(r.errorCode, 'INVALID_PREMISES', JSON.stringify(premises));
    }
  });

  test('INVALID_SQUADS', () => {
    const envelope = JSON.parse(serializeScenario(createInitialScenario()));
    const negativePeople = structuredClone(envelope);
    negativePeople.squads[0].people = -1;
    const negativeStories = structuredClone(envelope);
    negativeStories.squads[1].features[0].stories = -3;
    for (const bad of [{ ...envelope, squads: [] }, { ...envelope, squads: 'x' }, negativePeople, negativeStories]) {
      assert.equal(validateAndParseScenarioJson(JSON.stringify(bad)).errorCode, 'INVALID_SQUADS');
    }
  });

  test('entradas manuais na coluna FREEZING são descartadas na importação', () => {
    const envelope = JSON.parse(serializeScenario(createInitialScenario()));
    envelope.manualAllocations = { 'A-1': { freeze: 3, w03: 1.5 } };
    const r = validateAndParseScenarioJson(JSON.stringify(envelope));
    assert.equal(r.ok, true);
    assert.deepEqual(r.state.manualAllocations, { 'A-1': { w03: 1.5 } });
  });
});

describe('Exportação CSV', () => {
  const s = createInitialScenario();
  const csv = buildCsv(s, runSimulation(s));
  const lines = csv.replace(/^\uFEFF/, '').trim().split('\r\n');

  test('UTF-8 com BOM e separador ponto e vírgula', () => {
    assert.ok(csv.startsWith('\uFEFF'));
    assert.ok(lines[0].startsWith('Squad;Épico;Código/Feature;Qtd. US;Esforço (h)'));
    assert.ok(lines[0].includes(';FREEZING;S25;S26'));
  });

  test('uma linha por feature com decimais em vírgula', () => {
    assert.equal(lines.length, 1 + 29);
    const a1 = lines.find((line) => line.includes('A1 - Cadastro'));
    const cells = a1.split(';');
    assert.equal(cells[3], '11');
    assert.equal(cells[4], '616');
    assert.equal(cells[6], '3,85');
    assert.equal(cells[7], 'No prazo');
  });

  test('carimbo de arquivo no formato YYYYMMDD-HHMM', () => {
    assert.equal(fileTimestamp(new Date(2026, 10, 16, 9, 5)), '20261116-0905');
  });
});
