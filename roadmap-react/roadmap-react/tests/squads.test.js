import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  createNewSquad,
  createCustomSquad,
  associateFeatureInScenario,
  updateFeatureStoriesInScenario,
  updateEpicFeatureTotalStoriesInScenario,
  moveFeatureInScenario,
  removeFeatureInScenario,
  removeSquadInScenario,
  splitStoriesEvenly,
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

  test('Escopo das Squads: criar squad personalizada, associar features dividindo histórias, mover e remover', () => {
    let s = createInitialScenario();
    const before = runSimulation(s);

    const created = createCustomSquad(s.squads.map((q) => q.key), { name: 'Squad Canais', people: 2 });
    assert.equal(created.key, 'E');
    assert.equal(created.shortName, 'Squad Canais');
    assert.equal(created.people, 2);
    assert.deepEqual(created.features, []);
    s = { ...s, squads: [...s.squads, created] };

    // Associa a mesma feature do mesmo épico (A1 = 11 US na Squad A) com 6 US na Squad Canais -> Squad A fica com 5 US
    s = associateFeatureInScenario(s, 'E', {
      epic: 'EPC-001',
      name: 'A1 - Cadastro e ativação de conta',
      stories: 6,
    });
    const r1 = runSimulation(s);
    assert.equal(r1.kpis.totalPeople, before.kpis.totalPeople + 2);
    assert.equal(r1.kpis.totalStories, before.kpis.totalStories);
    assert.equal(r1.kpis.totalFeatures, before.kpis.totalFeatures);
    assert.equal(r1.features['A-1'].stories, 5);
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
    assert.equal(parsed.state.squads.find((q) => q.key === 'A').features.find((f) => f.id === 'A-1').stories, 5);
    assert.equal(parsed.state.squads.find((q) => q.key === 'E').features.find((f) => f.id === 'E-1').stories, 6);

    // Desassociar a feature compartilhada devolve suas histórias à Squad A (5 + 6 = 11)
    s = removeFeatureInScenario(s, 'E-1');
    assert.equal(s.squads.find((q) => q.key === 'E').features.some((f) => f.id === 'E-1'), false);
    assert.equal(s.squads.find((q) => q.key === 'A').features.find((f) => f.id === 'A-1').stories, 11);
  });

  test('Divisão de histórias entre squads com a mesma feature do mesmo épico (ex.: 5 US -> 3 e 2)', () => {
    assert.deepEqual(splitStoriesEvenly(5, 2), [3, 2]);
    assert.deepEqual(splitStoriesEvenly(11, 2), [6, 5]);
    assert.deepEqual(splitStoriesEvenly(5, 3), [2, 2, 1]);

    let s = createInitialScenario();
    // B1 (EPC-003) possui 5 histórias na Squad B
    const b1Initial = s.squads.find((q) => q.key === 'B').features.find((f) => f.id === 'B-1');
    assert.equal(b1Initial.stories, 5);

    // Associando a mesma feature do mesmo épico à Squad A sem informar histórias -> divide 5 em 3 (Squad B) e 2 (Squad A)
    s = associateFeatureInScenario(s, 'A', {
      epic: 'EPC-003',
      name: 'B1 – Vitrine e Catálogo Curado',
    });
    const bSlice1 = s.squads.find((q) => q.key === 'B').features.find((f) => f.name === 'B1 – Vitrine e Catálogo Curado');
    const aSlice1 = s.squads.find((q) => q.key === 'A').features.find((f) => f.name === 'B1 – Vitrine e Catálogo Curado');
    assert.equal(bSlice1.stories, 3);
    assert.equal(aSlice1.stories, 2);
    assert.equal(bSlice1.stories + aSlice1.stories, 5);

    // Editando a fatia da Squad A para 3 rebalanceia automaticamente a Squad B para 2 (mantendo total = 5)
    s = updateFeatureStoriesInScenario(s, aSlice1.id, 3);
    assert.equal(s.squads.find((q) => q.key === 'A').features.find((f) => f.id === aSlice1.id).stories, 3);
    assert.equal(s.squads.find((q) => q.key === 'B').features.find((f) => f.id === bSlice1.id).stories, 2);

    // Editando o total na visão de Épicos para 8 redistribui entre as squads (5 e 3)
    s = updateEpicFeatureTotalStoriesInScenario(s, 'EPC-003', 'B1 – Vitrine e Catálogo Curado', 8);
    const aAfterEpic = s.squads.find((q) => q.key === 'A').features.find((f) => f.id === aSlice1.id).stories;
    const bAfterEpic = s.squads.find((q) => q.key === 'B').features.find((f) => f.id === bSlice1.id).stories;
    assert.equal(aAfterEpic + bAfterEpic, 8);
    assert.deepEqual([aAfterEpic, bAfterEpic], [5, 3]);

    // Mesma feature de ÉPICO DIFERENTE não interfere na divisão
    s = associateFeatureInScenario(s, 'C', {
      epic: 'EPC-009',
      name: 'B1 – Vitrine e Catálogo Curado',
      stories: 7,
    });
    assert.equal(s.squads.find((q) => q.key === 'A').features.find((f) => f.id === aSlice1.id).stories, 5);
    assert.equal(s.squads.find((q) => q.key === 'B').features.find((f) => f.id === bSlice1.id).stories, 3);
    assert.equal(s.squads.find((q) => q.key === 'C').features.find((f) => f.epic === 'EPC-009').stories, 7);

    // Mover a fatia da Squad A para a Squad B (que já tem a mesma feature do mesmo épico) soma as histórias sem duplicar linha
    s = moveFeatureInScenario(s, aSlice1.id, 'B');
    const bFeatures = s.squads.find((q) => q.key === 'B').features.filter((f) => f.name === 'B1 – Vitrine e Catálogo Curado');
    assert.equal(bFeatures.length, 1);
    assert.equal(bFeatures[0].stories, 8);
  });

  test('Remover squad personalizada devolve histórias de features compartilhadas e reconcilia duplicatas legadas', () => {
    let s = createInitialScenario();
    const custom = createCustomSquad(s.squads.map((q) => q.key), { name: 'Squad Extra', people: 2 });
    s = { ...s, squads: [...s.squads, custom] };
    s = associateFeatureInScenario(s, 'E', { epic: 'EPC-003', name: 'B1 – Vitrine e Catálogo Curado', stories: 2 });
    assert.equal(s.squads.find((q) => q.key === 'B').features.find((f) => f.id === 'B-1').stories, 3);
    assert.equal(s.squads.find((q) => q.key === 'E').features[0].stories, 2);

    s = removeSquadInScenario(s, 'E');
    assert.equal(s.squads.some((q) => q.key === 'E'), false);
    assert.equal(s.squads.find((q) => q.key === 'B').features.find((f) => f.id === 'B-1').stories, 5);

    // Cenário legado (sem sharedFeaturesSplit) com 11 + 11 na mesma feature/épico é reconciliado para 6 + 5
    const legacyEnvelope = JSON.parse(serializeScenario(createInitialScenario()));
    delete legacyEnvelope.sharedFeaturesSplit;
    legacyEnvelope.squads[1].features.push({
      id: 'B-99',
      epic: 'EPC-001',
      name: 'A1 - Cadastro e ativação de conta',
      stories: 11,
    });
    const reconciled = validateAndParseScenarioJson(JSON.stringify(legacyEnvelope));
    assert.equal(reconciled.ok, true);
    assert.equal(reconciled.state.squads[0].features.find((f) => f.id === 'A-1').stories, 6);
    assert.equal(reconciled.state.squads[1].features.find((f) => f.id === 'B-99').stories, 5);
  });
});
