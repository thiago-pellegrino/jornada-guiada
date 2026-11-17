import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { YEAR_WEEKS, WEEKS, DEFAULT_PREMISES, resolveYearWeek, weekIdToYearWeek, createInitialScenario, currentYearWeekNumber } from '../src/data/initialRoadmapData.js';
import { runSimulation } from '../src/domain/simulationEngine.js';
import { serializeScenario, validateAndParseScenarioJson } from '../src/domain/scenarioSerializer.js';

describe('Semanas do ano corrente (2026)', () => {
  test('53 semanas ISO, de 29/12/2025 a 03/01/2027', () => {
    assert.equal(YEAR_WEEKS.length, 53);
    assert.equal(YEAR_WEEKS[0].startLabel, '29/12');
    assert.equal(YEAR_WEEKS[52].startLabel, '28/12');
    assert.equal(YEAR_WEEKS[52].endLabel, '03/01');
    assert.deepEqual(YEAR_WEEKS.map((w) => w.number), Array.from({ length: 53 }, (_, i) => i + 1));
  });

  test('semana 34 (17/08) começa na coluna S07 e é o padrão', () => {
    assert.equal(YEAR_WEEKS[33].startLabel, '17/08');
    assert.deepEqual(resolveYearWeek(34), { weekId: 'w03', position: 'inside' });
    assert.equal(DEFAULT_PREMISES.startYearWeek, 34);
    assert.equal(weekIdToYearWeek('w03'), 34);
  });

  test('o ano todo vira coluna: semanas de jan–jul antes do roadmap e a semana 53 é a última (S26)', () => {
    assert.deepEqual(resolveYearWeek(1), { weekId: 'y01', position: 'inside' });
    assert.deepEqual(resolveYearWeek(31), { weekId: 'y31', position: 'inside' });
    assert.deepEqual(resolveYearWeek(32), { weekId: 'w01', position: 'inside' });
    assert.deepEqual(resolveYearWeek(53), { weekId: 'w22', position: 'inside' });
    assert.equal(resolveYearWeek(99), null);
    assert.equal(WEEKS.find((w) => w.id === 'y01').month, 'JANEIRO');
    assert.equal(WEEKS.find((w) => w.id === 'y28').month, 'JULHO');
  });

  test('o Freezing é pulado: semana 52 (21/12) é S25', () => {
    assert.equal(YEAR_WEEKS[51].startLabel, '21/12');
    assert.equal(resolveYearWeek(52).weekId, 'w21');
    assert.equal(WEEKS.find((w) => w.id === 'w21').sprintWeek, 'S25');
  });

  test('toda coluna do roadmap (menos o Freezing) corresponde a uma semana do ano', () => {
    for (const week of WEEKS.filter((w) => !w.frozen)) {
      const number = weekIdToYearWeek(week.id);
      assert.ok(number, week.id);
      assert.equal(resolveYearWeek(number).weekId, week.id);
    }
  });

  test('mudar a semana inicial desloca o horizonte da simulação', () => {
    const s = createInitialScenario();
    s.premises.startWeekId = resolveYearWeek(36).weekId;
    s.premises.startYearWeek = 36;
    const r = runSimulation(s);
    assert.equal(r.context.startWeekCode, 'S09');
    assert.equal(r.context.eligibleBeforeFreezeCount, 16);
  });

  test('persistência: startYearWeek é preservado e vence a coluna divergente', () => {
    const s = createInitialScenario();
    s.premises.startYearWeek = 40;
    s.premises.startWeekId = resolveYearWeek(40).weekId;
    const ok = validateAndParseScenarioJson(serializeScenario(s));
    assert.equal(ok.state.premises.startYearWeek, 40);
    assert.equal(ok.state.premises.startWeekId, 'w09');

    const envelope = JSON.parse(serializeScenario(s));
    envelope.premises.startYearWeek = 45;
    const mismatch = validateAndParseScenarioJson(JSON.stringify(envelope));
    assert.equal(mismatch.state.premises.startWeekId, resolveYearWeek(45).weekId);
  });

  test('arquivos sem startYearWeek derivam da coluna', () => {
    const envelope = JSON.parse(serializeScenario(createInitialScenario()));
    delete envelope.premises.startYearWeek;
    envelope.premises.startWeekId = 'w05';
    const parsed = validateAndParseScenarioJson(JSON.stringify(envelope));
    assert.equal(parsed.state.premises.startYearWeek, weekIdToYearWeek('w05'));
  });

  test('semana atual: carrega a semana vigente da data de hoje', () => {
    assert.equal(currentYearWeekNumber(new Date(2026, 10, 16)), 47); // segunda 16/11
    assert.equal(currentYearWeekNumber(new Date(2026, 10, 22)), 47); // domingo 22/11
    assert.equal(currentYearWeekNumber(new Date(2026, 10, 23)), 48);
    assert.equal(currentYearWeekNumber(new Date(2026, 0, 1)), 1);
    assert.equal(currentYearWeekNumber(new Date(2026, 11, 31)), 53);
  });

  test('semana atual fora de 2026 não existe', () => {
    assert.equal(currentYearWeekNumber(new Date(2027, 5, 10)), null);
    assert.equal(currentYearWeekNumber(new Date(2025, 5, 10)), null);
  });
});