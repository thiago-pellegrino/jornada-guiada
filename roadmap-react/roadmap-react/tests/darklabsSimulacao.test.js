import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MOTORES, ROLES } from '../src/domain/darklabs/conteudo.js';
import { buildCatalog } from '../src/domain/journey/capabilityParser.js';
import { CAP_CONSOLIDAR, inferirSetor, lerContextoConsolidado } from '../src/domain/darklabs/contexto.js';
import {
  ab, aplicarContexto, cenarioDeDemonstracao, pack, concluirMetodo, confianca, consolidar, decidir, definirProduto, dossieEmTexto,
  iniciar, limitesConsolidacao, metricas, novo, prod, proximoProduto, recomendar, recomendacaoFinal,
  registrarLaboratorio, restaurar, triar,
} from '../src/domain/darklabs/simulacao.js';

/** Roda a jornada inteira como o modo apresentação do protótipo. */
function jornadaCompleta(S) {
  for (const m of prod(S).motores) {
    MOTORES[m - 1].entrada.forEach((_, i) => { S.motores[m].entrada[i] = true; });
    if (m === 6) { S.exp.v = 10.6; registrarLaboratorio(S); }
    MOTORES[m - 1].metodos.forEach((_, i) => { if (!S.motores[m].metodos[i]) concluirMetodo(S, m, i); });
    consolidar(S, m);
    S.motores[m].just = 'Evidências suficientes.';
    decidir(S, m, 'avancar');
  }
}

test('triagem do cenário de varejo recomenda a Jornada completa', () => {
  const S = cenarioDeDemonstracao('varejo');
  triar(S);
  assert.equal(S.rec.id, 'completa');
  assert.equal(S.produto, 'completa');
});

test('jornada completa reproduz os números do protótipo', () => {
  const S = cenarioDeDemonstracao('varejo');
  triar(S);
  iniciar(S, ROLES);
  jornadaCompleta(S);
  assert.equal(Math.round(S.dia), 375);
  assert.equal(Math.round(S.invest), 3051984);
  assert.equal(Math.round(S.bc.valor), 16953223);
  assert.equal(S.decisoes.length, 7);
  assert.deepEqual(S.hipoteses.map((h) => h.status), ['confirmada', 'confirmada', 'confirmada', 'inconclusiva']);
  assert.equal(recomendacaoFinal(S, ROLES).tit, 'Ampliar');
  assert.equal(S.backlogFuturo.length, 6);
  assert.ok(S.concluida);
  const M = metricas(S, ROLES);
  assert.equal(M.ganhoVel, 58);
  assert.equal(proximoProduto(S), 'evolution');
  assert.match(dossieEmTexto(S, ROLES), /MOTOR 7: FORESIGHT/);
});

test('retrabalho reduz o ganho de velocidade', () => {
  const S = cenarioDeDemonstracao('financeiro');
  triar(S);
  iniciar(S, ROLES);
  const m = prod(S).motores[0];
  MOTORES[m - 1].metodos.forEach((_, i) => concluirMetodo(S, m, i));
  const antes = metricas(S, ROLES).ganhoVel;
  concluirMetodo(S, m, 0);
  consolidar(S, m);
  decidir(S, m, 'ajustar');
  assert.ok(metricas(S, ROLES).ganhoVel < antes);
  assert.equal(S.motores[m].iter, 1);
  assert.equal(S.motores[m].saidas, null);
});

test('consolidação exige 60% dos métodos e 50% dos insumos', () => {
  const S = cenarioDeDemonstracao('saude');
  triar(S);
  iniciar(S, ROLES);
  const m = prod(S).motores[0];
  assert.equal(limitesConsolidacao(S, m).pode, false);
  const { minM } = limitesConsolidacao(S, m);
  for (let i = 0; i < minM; i++) concluirMetodo(S, m, i);
  assert.equal(limitesConsolidacao(S, m).pode, true);
});

test('interromper cancela os motores seguintes e fecha o ciclo', () => {
  const S = cenarioDeDemonstracao('varejo');
  triar(S);
  iniciar(S, ROLES);
  MOTORES[0].metodos.forEach((_, i) => concluirMetodo(S, 1, i));
  consolidar(S, 1);
  assert.equal(decidir(S, 1, 'interromper').tipo, 'interromper');
  assert.equal(S.motores[2].status, 'cancelado');
  assert.ok(S.concluida);
  assert.equal(recomendacaoFinal(S, ROLES).tit, 'Interromper com aprendizado');
  assert.equal(proximoProduto(S), 'discovery');
  assert.equal(definirProduto(S, 'discovery'), null);
  assert.equal(S.ciclo, 2);
});

test('teste A/B e confiança', () => {
  const S = novo();
  const r = ab(S);
  assert.ok(r.lift > 24 && r.lift < 26);
  assert.ok(r.pv < 0.01);
  S.desafio.gatilho = 'evidencias';
  assert.equal(recomendar(S).id, 'innovation');
  S.produto = 'impulso';
  S.squad = { pmo: 30 };
  iniciar(S, ROLES);
  assert.equal(confianca(S, 1), 30 + Math.round(15 * (1 / 4)));
});

test('restaurar recusa JSON inválido e completa campos novos', () => {
  assert.equal(restaurar({ v: 2 }), null);
  const S = restaurar({ v: 1, desafio: { empresa: 'X' }, dia: 10 });
  assert.equal(S.desafio.setor, 'varejo');
  assert.equal(S.planejado, 10);
});

/** Revisão da Consolidação de contexto (002) com o exemplo da especificação, como o simulador grava. */
function revisaoDoContexto() {
  const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../especificações');
  const arquivos = {};
  for (const f of fs.readdirSync(dir)) if (f.endsWith('.md')) arquivos[`../../../../especificações/${f}`] = fs.readFileSync(path.join(dir, f), 'utf8');
  const cat = buildCatalog(arquivos);
  const cap = cat.byId.get(CAP_CONSOLIDAR);
  return { revision: 1, generatedAt: '2026-11-20T15:17:00Z', reviewState: 'não revisado', envelope: JSON.parse(JSON.stringify(cap.example)) };
}

test('triagem preenchida com a consolidação de contexto (002)', () => {
  const ctx = lerContextoConsolidado(revisaoDoContexto());
  assert.equal(ctx.dores.length, 2);
  const S = novo();
  aplicarContexto(S, ctx, { name: 'Reembolso digital', code: 'PRJ-001' });
  assert.equal(S.desafio.empresa, 'Reembolso digital');
  assert.equal(S.desafio.setor, 'financeiro');
  assert.equal(S.desafio.problema, 'conferência manual de pedidos');
  assert.equal(S.desafio.publico, 'beneficiário');
  assert.equal(S.desafio.meta, 'prazo médio de pagamento');
  assert.equal(S.desafio.gatilho, 'destravar');
  assert.match(S.origens.problema, /PAIN-001/);
  assert.equal(S.contexto.revisao, 1);
  assert.equal(S.triado, false);
  // As dores do contexto entram nos textos gerados pelos motores.
  assert.equal(pack(S).dores[0], 'conferência manual de pedidos');
  triar(S);
  iniciar(S, ROLES);
  const m = prod(S).motores[0];
  MOTORES[m - 1].metodos.forEach((_, i) => concluirMetodo(S, m, i));
  consolidar(S, m);
  assert.match(JSON.stringify(S.motores[m].saidas), /conferência manual de pedidos/);
});

test('setor inferido pelo texto do contexto', () => {
  assert.equal(inferirSetor('Agendamento de consultas do paciente'), 'saude');
  assert.equal(inferirSetor('Checkout da loja e estoque'), 'varejo');
  assert.equal(inferirSetor('Gestão de frotas'), 'outro');
});
