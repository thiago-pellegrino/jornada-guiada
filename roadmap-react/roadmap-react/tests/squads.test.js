import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  createNewSquad,
  createCustomSquad,
  associateFeatureInScenario,
  moveFeatureInScenario,
  removeFeatureInScenario,
  createInitialScenario,
  BASE_SQUAD_KEYS,
  MAX_SQUADS,
  normalizeSquadName,
  formatSquadShortName,
} from '../src/data/initialRoadmapData.js';
import { runSimulation } from '../src/domain/simulationEngine.js';
import { serializeScenario, validateAndParseScenarioJson } from '../src/domain/scenarioSerializer.js';

describe('Squads adicionadas e edição de nome', () => {
  test('a primeira squad nova é a E, com 1 pessoa e uma feature sem histórias', () => {
    const squad = createNewSquad(BASE_SQUAD_KEYS);
    assert.equal(squad.key, 'E');
    assert.equal(squad.people, 1);
    assert.equal(squad.colorToken, '--chart-5');
    assert.deepEqual(squad.features.map((f) => [f.id, f.stories]), [['E-1', 0]]);
  });

  test('as chaves não se repetem e há limite de squads', () => {
    const keys = [...BASE_SQUAD_KEYS];
    while (keys.length < MAX_SQUADS) keys.push(createNewSquad(keys).key);
    assert.equal(new Set(keys).size, MAX_SQUADS);
    assert.equal(createNewSquad(keys), null);
  });

  test('a capacidade da squad nova compõe a simulação sem alterar a demanda', () => {
    const base = createInitialScenario();
    const before = runSimulation(base);
    const s = { ...base, squads: [...base.squads, createNewSquad(base.squads.map((q) => q.key))] };
    const after = runSimulation(s);
    assert.equal(after.kpis.totalPeople, before.kpis.totalPeople + 1);
    assert.equal(after.kpis.totalWeeklyCapacity, before.kpis.totalWeeklyCapacity + 40);
    assert.equal(after.kpis.totalDemandHours, before.kpis.totalDemandHours);
    assert.equal(after.squads.find((q) => q.squadKey === 'E').status, 'EMPTY');
  });

  test('histórias informadas na squad nova entram na demanda e no cronograma', () => {
    const base = createInitialScenario();
    const squad = createNewSquad(base.squads.map((q) => q.key));
    squad.features[0].stories = 5;
    const r = runSimulation({ ...base, squads: [...base.squads, squad] });
    assert.equal(r.kpis.totalStories, 168);
    const f = r.features['E-1'];
    assert.equal(f.effortHours, 280);
    assert.equal(f.status, 'ON_TIME');
    assert.equal(f.startWeekCode, 'S07');
  });

  test('a squad nova sobrevive à exportação e importação', () => {
    const base = createInitialScenario();
    const squad = createNewSquad(base.squads.map((q) => q.key));
    squad.people = 3;
    squad.features[0].stories = 2;
    const parsed = validateAndParseScenarioJson(serializeScenario({ ...base, squads: [...base.squads, squad] }));
    assert.equal(parsed.ok, true);
    const e = parsed.state.squads.find((q) => q.key === 'E');
    assert.equal(e.people, 3);
    assert.equal(e.features[0].stories, 2);
    assert.equal(e.colorToken, '--chart-5');
  });

  test('editar o nome da squad mantém a letra como identificador interno e persiste no JSON', () => {
    assert.equal(normalizeSquadName('A', '  '), 'Squad A');
    assert.equal(formatSquadShortName('A', 'Squad A'), 'Squad A');
    assert.equal(formatSquadShortName('A', 'Pagamentos'), 'Pagamentos');

    const s = createInitialScenario();
    s.squads[0] = {
      ...s.squads[0],
      name: 'Pagamentos',
      shortName: formatSquadShortName('A', 'Pagamentos'),
    };
    const parsed = validateAndParseScenarioJson(serializeScenario(s));
    assert.equal(parsed.ok, true);
    const a = parsed.state.squads.find((q) => q.key === 'A');
    assert.equal(a.key, 'A');
    assert.equal(a.name, 'Pagamentos');
    assert.equal(a.shortName, 'Pagamentos');
  });

  test('Escopo das Squads: criar squad personalizada, associar features com histórias, mover e remover', () => {
    let s = createInitialScenario();
    const before = runSimulation(s);

    const created = createCustomSquad(s.squads.map((q) => q.key), { name: 'Squad Canais', people: 2 });
    assert.equal(created.key, 'E');
    assert.equal(created.shortName, 'Squad Canais');
    assert.equal(created.people, 2);
    assert.deepEqual(created.features, []);
    s = { ...s, squads: [...s.squads, created] };

    // Associa uma feature com 6 histórias na Squad Canais
    s = associateFeatureInScenario(s, 'E', {
      epic: 'EPC-001',
      name: 'A1 - Cadastro e ativação de conta',
      stories: 6,
    });
    const r1 = runSimulation(s);
    assert.equal(r1.kpis.totalPeople, before.kpis.totalPeople + 2);
    assert.equal(r1.kpis.totalStories, before.kpis.totalStories + 6);
    assert.equal(r1.features['E-1'].stories, 6);
    assert.equal(r1.features['E-1'].effortHours, 6 * 56);

    // Move uma feature existente de Squad A para Squad Canais
    s = moveFeatureInScenario(s, 'A-2', 'E');
    assert.equal(s.squads.find((q) => q.key === 'A').features.some((f) => f.id === 'A-2'), false);
    assert.equal(s.squads.find((q) => q.key === 'E').features.some((f) => f.id === 'A-2'), true);

    // Persiste e restaura o escopo personalizado
    const parsed = validateAndParseScenarioJson(serializeScenario(s));
    assert.equal(parsed.ok, true);
    assert.equal(parsed.state.squads.find((q) => q.key === 'E').features.length, 2);

    // Remove a feature associada
    s = removeFeatureInScenario(s, 'E-1');
    assert.equal(s.squads.find((q) => q.key === 'E').features.some((f) => f.id === 'E-1'), false);
  });
});
