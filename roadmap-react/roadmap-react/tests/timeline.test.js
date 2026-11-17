import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { WEEKS, YEAR_WEEKS, YEAR, FREEZE_DATE_LABEL, createInitialScenario, resolveYearWeek } from '../src/data/initialRoadmapData.js';
import {
  getVisibleWeeks,
  buildSpans,
  planningWeekNumbers,
  formatPlanningWeek,
  assignSprints,
  describeScheduleLabels,
} from '../src/domain/timeline.js';
import { runSimulation } from '../src/domain/simulationEngine.js';
import { serializeScenario, validateAndParseScenarioJson } from '../src/domain/scenarioSerializer.js';

describe('Linha do tempo a partir da semana inicial', () => {
  test('sem deslocamento a matriz mostra o ano todo; a partir de S05, as 23 colunas do roadmap', () => {
    assert.equal(getVisibleWeeks(WEEKS, 0).length, 54);
    assert.equal(getVisibleWeeks(WEEKS, WEEKS.find((w) => w.id === 'w01').index).length, 23);
  });

  test('semana 40 (28/09 → S13): começa em setembro e a contagem recomeça em S01', () => {
    const startId = resolveYearWeek(40).weekId;
    const startIndex = WEEKS.find((w) => w.id === startId).index;
    const visible = getVisibleWeeks(WEEKS, startIndex);
    assert.equal(visible[0].sprintWeek, 'S13');
    assert.equal(visible[0].dateLabel, '28/09');
    const months = buildSpans(visible, 'month');
    assert.equal(months[0].value, 'SETEMBRO');
    assert.equal(months[0].count, 1);
    const counts = planningWeekNumbers(visible);
    assert.equal(counts[visible[0].id], 1);
    assert.equal(formatPlanningWeek(counts[visible[0].id]), 'S01');
    assert.equal(counts.freeze, undefined);
    assert.equal(Math.max(...Object.values(counts)), 14);
  });

  test('o Freezing não entra na contagem e as semanas seguintes continuam sequenciais', () => {
    const visible = getVisibleWeeks(WEEKS, WEEKS.find((w) => w.id === 'w01').index);
    const counts = planningWeekNumbers(visible);
    assert.equal(counts.w20, 20);
    assert.equal(counts.w21, 21);
    assert.equal(counts.w22, 22);
  });

  test('o horizonte da simulação acompanha a mesma semana inicial', () => {
    const s = createInitialScenario();
    s.premises.startYearWeek = 40;
    s.premises.startWeekId = resolveYearWeek(40).weekId;
    const r = runSimulation(s);
    assert.equal(r.context.startWeekCode, 'S13');
    assert.equal(r.features['A-1'].startWeekCode, 'S13');
  });

  test('semana inicial em julho: o cronograma começa em julho, antes do roadmap', () => {
    const number = 28; // 06/07 a 12/07
    const startId = resolveYearWeek(number).weekId;
    assert.equal(startId, 'y28');
    const startIndex = WEEKS.find((w) => w.id === startId).index;
    const visible = getVisibleWeeks(WEEKS, startIndex);
    assert.equal(visible[0].dateLabel, '06/07');
    assert.equal(buildSpans(visible, 'month')[0].value, 'JULHO');
    assert.equal(visible.length, 54 - 27);
    const s = createInitialScenario();
    s.premises.startWeekId = startId;
    s.premises.startYearWeek = number;
    const r = runSimulation(s);
    assert.equal(r.context.startWeekCode, 'Sem 28');
    assert.equal(r.features['A-1'].startWeekCode, 'Sem 28');
    assert.equal(r.curve[0].weekId, 'y28');
  });
});

describe('Seleção da Sprint 01 e recálculo das sprints seguintes', () => {
  test('sem seleção customizada mantém as sprints originais do roadmap', () => {
    const weeks = assignSprints(WEEKS, null);
    assert.equal(weeks.find((w) => w.id === 'w01').sprint, '');
    assert.equal(weeks.find((w) => w.id === 'w03').sprint, 'SPRINT-04');
    assert.equal(weeks.find((w) => w.id === 'w22').sprint, 'SPRINT-12');
    assert.equal(weeks.find((w) => w.id === 'freeze').sprint, 'FREEZING');
  });

  test('selecionar Sprint 01 em w02 (10/08) limpa anteriores e recalcula sprints de 2 semanas sem contar o Freezing', () => {
    const startIndex = WEEKS.find((w) => w.id === 'w01').index;
    const visible = getVisibleWeeks(assignSprints(WEEKS, 'w02'), startIndex);
    const byId = Object.fromEntries(visible.map((w) => [w.id, w.sprint]));

    assert.equal(byId.w01, '');
    assert.equal(byId.w02, 'SPRINT-01');
    assert.equal(byId.w03, 'SPRINT-01');
    assert.equal(byId.w04, 'SPRINT-02');
    assert.equal(byId.w05, 'SPRINT-02');
    // w20 é a 19ª semana útil desde w02 -> 1ª metade da SPRINT-10; o Freezing fica no meio e w21 fecha a SPRINT-10
    assert.equal(byId.w20, 'SPRINT-10');
    assert.equal(byId.freeze, 'FREEZING');
    assert.equal(byId.w21, 'SPRINT-10');
    assert.equal(byId.w22, 'SPRINT-11');
  });

  test('selecionar Sprint 01 em julho (y28) numera continuamente até dezembro e preserva o Freezing', () => {
    const startIndex = WEEKS.find((w) => w.id === 'y28').index;
    const visible = getVisibleWeeks(assignSprints(WEEKS, 'y28'), startIndex);
    assert.equal(visible[0].sprint, 'SPRINT-01');
    assert.equal(visible[1].sprint, 'SPRINT-01');
    assert.equal(visible[2].sprint, 'SPRINT-02');
    assert.equal(visible.find((w) => w.id === 'w01').sprint, 'SPRINT-03');
    assert.equal(visible.find((w) => w.id === 'freeze').sprint, 'FREEZING');
    assert.equal(visible.find((w) => w.id === 'w22').sprint, 'SPRINT-13');
  });

  test('selecionar Sprint 01 após o Freezing mantém o rótulo FREEZING intacto', () => {
    const weeks = assignSprints(WEEKS, 'w21');
    assert.equal(weeks.find((w) => w.id === 'w20').sprint, '');
    assert.equal(weeks.find((w) => w.id === 'freeze').sprint, 'FREEZING');
    assert.equal(weeks.find((w) => w.id === 'w21').sprint, 'SPRINT-01');
    assert.equal(weeks.find((w) => w.id === 'w22').sprint, 'SPRINT-01');
  });

  test('persistência preserva sprintOneWeekId válida e ajusta se ficar antes da semana inicial', () => {
    const s = createInitialScenario();
    s.premises.startYearWeek = 40;
    s.premises.startWeekId = resolveYearWeek(40).weekId; // w09
    s.premises.sprintOneWeekId = 'w10';

    const parsed = validateAndParseScenarioJson(serializeScenario(s));
    assert.equal(parsed.ok, true);
    assert.equal(parsed.state.premises.sprintOneWeekId, 'w10');

    // Se sprintOneWeekId vier antes da semana inicial carregada (ex.: y28 < w09), avança para a semana inicial
    s.premises.sprintOneWeekId = 'y28';
    const clamped = validateAndParseScenarioJson(serializeScenario(s));
    assert.equal(clamped.ok, true);
    assert.equal(clamped.state.premises.sprintOneWeekId, 'w09');
  });

  test('as alocações (cores) acompanham dinamicamente a SP 01 mantendo as semanas anteriores visíveis no calendário', () => {
    const s = createInitialScenario();
    s.premises.startYearWeek = 11; // 09/03 -> y11
    s.premises.startWeekId = resolveYearWeek(11).weekId;
    s.premises.sprintOneWeekId = 'y14'; // 30/03 (S04 do planejamento)

    const r1 = runSimulation(s);
    assert.equal(r1.context.calendarStartIndex, WEEKS.find((w) => w.id === 'y11').index);
    assert.equal(r1.context.startIndex, WEEKS.find((w) => w.id === 'y14').index);
    const squadA1 = r1.squads.find((q) => q.squadKey === 'A');
    assert.equal(squadA1.weeklyUsage.y11.hours, 0);
    assert.equal(squadA1.weeklyUsage.y12.hours, 0);
    assert.equal(squadA1.weeklyUsage.y13.hours, 0);
    assert.ok(squadA1.weeklyUsage.y14.hours > 0);
    assert.equal(r1.features['A-1'].startWeekCode, 'Sem 14');

    // Mudando SP 01 para y16 (13/04), as alocações caminham para y16
    s.premises.sprintOneWeekId = 'y16';
    const r2 = runSimulation(s);
    const squadA2 = r2.squads.find((q) => q.squadKey === 'A');
    assert.equal(squadA2.weeklyUsage.y14.hours, 0);
    assert.equal(squadA2.weeklyUsage.y15.hours, 0);
    assert.ok(squadA2.weeklyUsage.y16.hours > 0);
    assert.equal(r2.features['A-1'].startWeekCode, 'Sem 16');
  });

  test('rótulos de Semana atual e Congelamento (Freezing) refletem dinamicamente as colunas carregadas', () => {
    // Semana inicial = Semana 42 (12/10 -> w11), Semana atual = Semana 47 (16/11 -> w16 = S06), pós-Freezing = S11–S12
    const idx42 = WEEKS.find((w) => w.id === 'w11').index;
    const labels1 = describeScheduleLabels({
      weeks: WEEKS,
      yearWeeks: YEAR_WEEKS,
      calendarStartIndex: idx42,
      startIndex: idx42,
      currentYearWeek: 47,
      todayYearWeek: 47,
      year: YEAR,
      freezeDateLabel: FREEZE_DATE_LABEL,
    });
    assert.equal(labels1.currentWeekHint, 'Semana vigente de hoje, destacada no cronograma (coluna S06).');
    assert.equal(labels1.freezeHint, 'Sem alocação na coluna congelada; entregas seguem para S11–S12.');

    // Quando o usuário escolhe outra Semana atual (ex.: Semana 44 -> 26/10 = S03)
    const labels2 = describeScheduleLabels({
      weeks: WEEKS,
      yearWeeks: YEAR_WEEKS,
      calendarStartIndex: idx42,
      startIndex: idx42,
      currentYearWeek: 44,
      todayYearWeek: 47,
      year: YEAR,
      freezeDateLabel: FREEZE_DATE_LABEL,
    });
    assert.equal(labels2.currentWeekHint, 'Semana 44 (26/10 a 01/11), destacada no cronograma (coluna S03).');

    // Quando a Semana atual fica antes da Semana inicial (ex.: início na Semana 50 -> 07/12 = w19)
    const idx50 = WEEKS.find((w) => w.id === 'w19').index;
    const labels3 = describeScheduleLabels({
      weeks: WEEKS,
      yearWeeks: YEAR_WEEKS,
      calendarStartIndex: idx50,
      startIndex: idx50,
      currentYearWeek: 47,
      todayYearWeek: 47,
      year: YEAR,
      freezeDateLabel: FREEZE_DATE_LABEL,
    });
    assert.equal(labels3.currentWeekHint, 'Semana vigente de hoje, anterior à semana inicial selecionada.');
    assert.equal(labels3.freezeHint, 'Sem alocação na coluna congelada; entregas seguem para S03–S04.');
  });
});
