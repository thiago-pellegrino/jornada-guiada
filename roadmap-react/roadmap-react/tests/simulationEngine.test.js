import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { WEEKS, createInitialScenario } from '../src/data/initialRoadmapData.js';
import {
  runSimulation,
  getWeekContext,
  recommendPeopleForFreeze,
  deriveManualAllocationsFromResult,
  autoDistributeSingleFeature,
  setManualCellValue,
  sanitizeManualAllocations,
  applyScenarioPatch,
  computeScenarioFingerprint,
  buildCopilotInsights,
  FEATURE_STATUS,
} from '../src/domain/simulationEngine.js';

const close = (actual, expected, eps = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= eps, `esperado ${expected}, obtido ${actual}`);

function scenario(patch = {}) {
  const s = createInitialScenario();
  s.premises = { ...s.premises, ...patch };
  return s;
}

const squad = (result, key) => result.squads.find((s) => s.squadKey === key);

describe('Catálogo base (SEMANAS.xlsx)', () => {
  test('29 features, 163 histórias e 54 colunas de calendário (31 semanas de jan–jul + 23 do roadmap)', () => {
    const r = runSimulation(scenario());
    assert.equal(r.kpis.totalFeatures, 29);
    assert.equal(r.kpis.totalStories, 163);
    assert.equal(WEEKS.length, 54);
    assert.equal(WEEKS.filter((w) => w.frozen).length, 1);
  });

  test('marcos da aba SEMANAS mapeados nas semanas corretas', () => {
    const byMilestone = Object.fromEntries(WEEKS.filter((w) => w.milestone).map((w) => [w.milestone, w.sprintWeek]));
    assert.equal(byMilestone['ESTAMOS AQUI'], 'S06');
    assert.equal(byMilestone['HOMOLOGAÇÃO'], 'S21');
    assert.equal(byMilestone['PRODUÇÃO'], 'S23');
    assert.equal(byMilestone.FREEZING, 'FREEZING');
    assert.equal(WEEKS.find((w) => w.sprintWeek === 'S21').dateLabel, '23/11');
  });

  test('horizonte a partir de S07: 18 semanas até o Freezing e 20 até S26', () => {
    const ctx = getWeekContext(WEEKS, 'w03');
    assert.equal(ctx.eligibleBeforeFreeze.length, 18);
    assert.equal(ctx.eligible.length, 20);
    assert.ok(ctx.eligible.every((w) => !w.frozen));
  });
});

describe('Fluxo Contínuo (C1, 40 h/pessoa)', () => {
  const r = runSimulation(scenario());

  test('capacidade e esforço reconciliados com C1-ROADMAP', () => {
    assert.deepEqual(r.squads.map((s) => s.weeklyCapacityHours), [160, 40, 40, 80]);
    assert.deepEqual(r.squads.map((s) => s.demandHours), [2352, 1848, 1792, 3136]);
    close(squad(r, 'A').requiredWeeks, 14.7);
    close(squad(r, 'B').requiredWeeks, 46.2);
    close(squad(r, 'C').requiredWeeks, 44.8);
    close(squad(r, 'D').requiredWeeks, 39.2);
  });

  test('semanas por feature iguais a esforço ÷ capacity (coluna Semanas da planilha)', () => {
    close(r.features['A-1'].estimatedWeeks, 3.85);
    close(r.features['B-1'].estimatedWeeks, 7);
    close(r.features['D-5'].estimatedWeeks, 7.7);
  });

  test('aproveita saldo da semana: a feature seguinte começa na mesma semana', () => {
    // A-1 consome 3,85 semanas: a A-2 começa na 4ª semana elegível (S10).
    assert.equal(r.features['A-1'].endWeekCode, 'S10');
    assert.equal(r.features['A-2'].startWeekCode, 'S10');
  });

  test('Squad A no prazo e gargalo é a Squad B', () => {
    assert.equal(squad(r, 'A').status, 'ON_TIME');
    assert.equal(r.kpis.bottleneckSquadKey, 'B');
    assert.equal(r.kpis.globalEndLabel, 'S26 + 26,2 sem');
  });

  test('não há alocação na coluna FREEZING', () => {
    for (const f of Object.values(r.features)) assert.equal(f.allocatedByWeek.freeze, undefined);
  });

  test('nenhuma feature é omitida: excedente pós-S26 explícito e horas conservadas', () => {
    for (const f of Object.values(r.features)) {
      close(f.allocatedHoursInHorizon + f.spilloverHours, f.effortHours, 1e-6);
    }
    const b = squad(r, 'B');
    close(b.spilloverWeeks, 46.2 - 20);
    assert.ok(r.kpis.featuresOutOfWindow > 0);
  });

  test('recomendação de headcount para o Freezing', () => {
    assert.deepEqual(r.squads.map((s) => s.recommendedPeopleForFreeze), [4, 3, 3, 5]);
    assert.equal(r.kpis.totalAdditionalPeopleNeeded, 7);
  });

  test('aplicar a recomendação deixa todas as squads no prazo', () => {
    const s = applyScenarioPatch(scenario(), { squadPeople: { B: 3, C: 3, D: 5 } });
    const r2 = runSimulation(s);
    assert.ok(r2.squads.every((q) => q.status === 'ON_TIME'));
    assert.equal(r2.kpis.completionPctBeforeFreeze, 1);
  });
});

describe('Jornada de 30 h (C0-ROADMAP)', () => {
  test('capacidades caem proporcionalmente', () => {
    const r = runSimulation(scenario({ hoursPerPersonPerWeek: 30 }));
    assert.deepEqual(r.squads.map((s) => s.weeklyCapacityHours), [120, 30, 30, 60]);
    close(r.features['A-1'].estimatedWeeks, 616 / 120);
    close(r.features['B-1'].estimatedWeeks, 280 / 30);
  });
});

describe('Semanas Inteiras (C0)', () => {
  const r = runSimulation(scenario({ schedulingMode: 'whole_weeks' }));

  test('soma dos arredondamentos por feature', () => {
    assert.deepEqual(r.squads.map((s) => s.requiredWeeks), [19, 50, 48, 41]);
  });

  test('Squad A passa a terminar depois do Freezing', () => {
    assert.equal(squad(r, 'A').status, 'POST_FREEZE');
    assert.equal(r.features['A-8'].status, FEATURE_STATUS.POST_FREEZE);
  });

  test('cada feature ocupa semanas exclusivas', () => {
    const weeksA1 = Object.keys(r.features['A-1'].allocatedByWeek);
    const weeksA2 = Object.keys(r.features['A-2'].allocatedByWeek);
    assert.equal(weeksA1.length, 4);
    assert.equal(weeksA2.filter((w) => weeksA1.includes(w)).length, 0);
  });

  test('busca iterativa de headcount (não linear) — Squad A precisa de 5', () => {
    const s = scenario({ schedulingMode: 'whole_weeks' });
    const ctx = getWeekContext(WEEKS, 'w03');
    assert.equal(recommendPeopleForFreeze(s.squads[0], s.premises, ctx, 'whole_weeks'), 5);
    const r2 = runSimulation(applyScenarioPatch(s, { squadPeople: { A: 5 } }));
    assert.equal(squad(r2, 'A').status, 'ON_TIME');
  });
});

describe('Casos de borda', () => {
  test('squad com 0 pessoas: sem divisão por zero e status Sem capacidade', () => {
    const s = applyScenarioPatch(scenario(), { squadPeople: { B: 0 } });
    const r = runSimulation(s);
    const b = squad(r, 'B');
    assert.equal(b.weeklyCapacityHours, 0);
    assert.equal(b.status, 'NO_CAPACITY');
    assert.equal(r.features['B-1'].status, FEATURE_STATUS.NO_CAPACITY);
    assert.equal(b.recommendedPeopleForFreeze, 3);
    assert.equal(r.kpis.globalEndLabel, 'Sem capacidade');
  });

  test('feature com 0 histórias: Sem escopo e não consome semanas', () => {
    const s = scenario();
    s.squads[0].features[0].stories = 0;
    const r = runSimulation(s);
    assert.equal(r.features['A-1'].status, FEATURE_STATUS.EMPTY);
    assert.deepEqual(r.features['A-1'].allocatedByWeek, {});
    assert.equal(r.features['A-2'].startWeekCode, 'S07');
  });

  test('cenário extremo (120 h/US, 1 pessoa) calcula excedente sem omitir features', () => {
    const s = applyScenarioPatch(scenario({ avgHoursPerStory: 120 }), { squadPeople: { A: 1, D: 1 } });
    const r = runSimulation(s);
    assert.equal(Object.keys(r.features).length, 29);
    assert.ok(r.squads.every((q) => Number.isFinite(q.spilloverWeeks)));
    close(squad(r, 'D').requiredWeeks, (56 * 120) / 40);
  });

  test('semana inicial alterada desloca o horizonte', () => {
    const r = runSimulation(scenario({ startWeekId: 'w05' }));
    assert.equal(r.context.eligibleBeforeFreezeCount, 16);
    assert.equal(r.features['A-1'].startWeekCode, 'S09');
  });
});

describe('Alocação manual', () => {
  test('inicialização a partir do Fluxo Contínuo preserva o resultado', () => {
    const base = scenario();
    const auto = runSimulation(base);
    const manualAllocations = deriveManualAllocationsFromResult(auto, 56);
    const r = runSimulation({ ...base, premises: { ...base.premises, schedulingMode: 'manual' }, manualAllocations });
    for (const id of auto.featureOrder) {
      assert.equal(r.features[id].status, auto.features[id].status, id);
    }
    const sum = Object.values(manualAllocations['A-1']).reduce((a, b) => a + b, 0);
    close(sum, 11, 1e-9);
  });

  test('sobrecarga semanal detectada com horas excedentes', () => {
    const base = scenario({ schedulingMode: 'manual' });
    base.manualAllocations = { 'B-1': { w03: 4 } };
    const r = runSimulation(base);
    const b = squad(r, 'B');
    assert.equal(b.weeklyUsage.w03.isOvercapacity, true);
    close(b.weeklyUsage.w03.overHours, 4 * 56 - 40);
    assert.equal(b.status, 'OVERCAPACITY');
  });

  test('histórias não alocadas aparecem como fora da janela', () => {
    const base = scenario({ schedulingMode: 'manual' });
    base.manualAllocations = { 'A-1': { w03: 2 } };
    const r = runSimulation(base);
    assert.equal(r.features['A-1'].status, FEATURE_STATUS.OUT_OF_WINDOW);
    close(r.features['A-1'].spilloverHours, 9 * 56);
  });

  test('coluna FREEZING rejeita valores', () => {
    const next = setManualCellValue({}, 'A-1', 'freeze', 3, WEEKS);
    assert.deepEqual(next, {});
    const clean = sanitizeManualAllocations({ 'A-1': { freeze: 2, w03: 1, w04: -1, w05: 'x' } }, WEEKS);
    assert.deepEqual(clean, { 'A-1': { w03: 1 } });
  });

  test('valores ≤ 0 removem a célula do mapa esparso', () => {
    const one = setManualCellValue({}, 'A-1', 'w03', 2, WEEKS);
    assert.deepEqual(one, { 'A-1': { w03: 2 } });
    assert.deepEqual(setManualCellValue(one, 'A-1', 'w03', 0, WEEKS), {});
  });

  test('auto-distribuir respeita o saldo das demais features', () => {
    const base = scenario({ schedulingMode: 'manual' });
    // Squad B (40 h = 0,714 US/sem): B-1 ocupa toda a S07.
    base.manualAllocations = { 'B-1': { w03: 40 / 56 } };
    const map = autoDistributeSingleFeature(base, 'B-2', WEEKS);
    assert.equal(map['B-2'].w03, undefined);
    assert.ok(map['B-2'].w04 > 0);
    const total = Object.values(map['B-2']).reduce((a, b) => a + b, 0);
    close(total, 4, 0.011);
  });
});

describe('Copiloto', () => {
  test('propostas trazem impressão digital do contexto e patch aplicável', () => {
    const s = scenario();
    const r = runSimulation(s);
    const bundle = buildCopilotInsights(s, r);
    assert.equal(bundle.fingerprint, computeScenarioFingerprint(s));
    const balance = bundle.proposals.find((p) => p.id === 'balance-for-freeze');
    assert.ok(balance);
    assert.deepEqual(balance.patch, { squadPeople: { B: 3, C: 3, D: 5 } });
    assert.ok(bundle.insights.some((i) => i.id === 'mode-compare'));
  });

  test('fingerprint muda quando o cenário muda', () => {
    const s = scenario();
    const changed = applyScenarioPatch(s, { premises: { avgHoursPerStory: 40 } });
    assert.notEqual(computeScenarioFingerprint(s), computeScenarioFingerprint(changed));
  });

  test('em Semanas Inteiras sugere migrar para Fluxo Contínuo', () => {
    const s = scenario({ schedulingMode: 'whole_weeks' });
    const bundle = buildCopilotInsights(s, runSimulation(s));
    assert.ok(bundle.proposals.some((p) => p.id === 'switch-to-continuous'));
  });
});
