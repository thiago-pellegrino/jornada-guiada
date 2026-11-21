/**
 * Integração Contexto → DarkLabs: lê o resultado da Consolidação de contexto (01-contexto-002)
 * do projeto e monta a triagem do DarkLabs (desafio, setor, gatilho e maturidade) a partir dele.
 * Funções puras: recebem a revisão do artefato e devolvem dados; quem grava é simulacao.js.
 */
import { lc } from './formato.js';

export const CAP_CONSOLIDAR = '01-contexto-002-consolidar-contexto';

const clamp = (n) => Math.max(1, Math.min(5, Math.round(n)));
const item = (x) => ({ id: x.id, nome: x.name ?? x.id, descricao: x.description ?? '' });

/** Palavras que indicam o setor do projeto (o texto do contexto é comparado sem acentos). */
const SETORES = [
  ['saude', ['paciente', 'consulta', 'clinica', 'hospital', 'saude', 'prontuario', 'medic', 'sinistro']],
  ['financeiro', ['reembolso', 'pagamento', 'credito', 'banco', 'conta', 'pix', 'emprestimo', 'cartao', 'fatura', 'cobranca', 'financ']],
  ['varejo', ['loja', 'compra', 'pedido de venda', 'varejo', 'estoque', 'checkout', 'e-commerce', 'ecommerce', 'consumidor']],
];

const semAcento = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export function inferirSetor(texto) {
  const t = semAcento(texto);
  let melhor = ['outro', 0];
  for (const [setor, palavras] of SETORES) {
    const pontos = palavras.filter((p) => t.includes(p)).length;
    if (pontos > melhor[1]) melhor = [setor, pontos];
  }
  return melhor[0];
}

/** Resumo do contexto consolidado guardado na simulação (só o que a triagem e os motores usam). */
export function lerContextoConsolidado(rev) {
  const env = rev?.envelope;
  if (!env?.data) return null;
  const d = env.data;
  const entidades = d.entities ?? [];
  return {
    capabilityId: CAP_CONSOLIDAR,
    revisao: rev.revision,
    geradoEm: rev.generatedAt ?? env.generatedAt ?? null,
    revisaoEstado: rev.reviewState ?? null,
    resumo: d.overview ?? env.summary ?? '',
    dores: (d.pains ?? []).map(item),
    atores: (d.actors ?? []).map(item),
    sistemas: (d.systems ?? []).map(item),
    regras: (d.rules ?? []).map(item),
    fatos: (d.facts ?? []).map(item),
    indicadores: entidades.filter((e) => e.category === 'indicador' || String(e.id).startsWith('KPI')).map(item),
    lacunas: (env.gaps ?? []).map((g) => ({ id: g.id, pergunta: g.question, impacto: g.impact ?? 'médio' })),
    conflitos: (env.conflicts ?? []).map((c) => ({ id: c.id, descricao: c.description, resolvido: Boolean(c.resolution) })),
    cobertura: typeof env.coverage?.coveragePct === 'number' ? env.coverage.coveragePct : null,
    evidencias: (env.evidenceRefs ?? []).length,
    fontes: (d.sourcesConsolidated ?? []).length,
  };
}

/**
 * Triagem a partir do contexto. Devolve os campos do desafio e, para cada um, de onde veio
 * (ids do contexto) — a tela mostra essa origem embaixo de cada campo.
 * Campos sem base no contexto (apetite de investimento, porte, capacidade interna) não são tocados.
 */
export function triagemDoContexto(ctx, { projeto } = {}) {
  const dores = ctx.dores;
  const ind = ctx.indicadores[0];
  const altos = ctx.lacunas.filter((g) => g.impacto === 'alto').length;
  const abertos = ctx.conflitos.filter((c) => !c.resolvido).length;
  const cobertura = ctx.cobertura ?? 0.5;
  const texto = [projeto?.name, ctx.resumo, ...dores.map((x) => `${x.nome} ${x.descricao}`), ...ctx.regras.map((x) => x.descricao), ...ctx.atores.map((x) => x.nome)].join(' ');

  const desafio = {};
  const origem = {};
  if (projeto?.name) {
    desafio.empresa = projeto.name;
    origem.empresa = `Projeto ${projeto.code ?? ''}`.trim();
  }
  desafio.setor = inferirSetor(texto);
  origem.setor = 'Termos do resumo, das dores e das regras do contexto';
  if (dores.length) {
    desafio.problema = lc(dores[0].nome);
    origem.problema = `${dores[0].id} · ${dores[0].descricao}`;
    desafio.ambicao = `Resolver ${dores.map((x) => lc(x.nome)).join(' e ')}`;
    origem.ambicao = dores.map((x) => x.id).join(', ');
  }
  if (ctx.atores.length) {
    desafio.publico = lc(ctx.atores[0].nome);
    origem.publico = `${ctx.atores[0].id} · ${ctx.atores[0].descricao}`;
    desafio.stakeholders = ctx.atores.map((x) => x.nome).join(', ');
    origem.stakeholders = ctx.atores.map((x) => x.id).join(', ');
  }
  if (ind) {
    desafio.meta = lc(ind.nome);
    origem.meta = `${ind.id} · ${ind.descricao}`;
  }

  // Gatilho: conflitos em aberto pedem destravar; lacunas de alto impacto pedem evidências.
  desafio.gatilho = abertos ? 'destravar' : altos ? 'evidencias' : 'escalar';
  origem.gatilho = abertos ? `${abertos} conflito(s) sem resolução` : altos ? `${altos} lacuna(s) de alto impacto` : 'Contexto sem conflitos nem lacunas críticas';

  desafio.mat = {
    clareza: clamp(1 + (dores.length > 0) + Boolean(ctx.resumo) + (ctx.regras.length > 0) + (ctx.indicadores.length > 0) - abertos),
    evidencias: clamp(1 + cobertura * 3 + (ctx.evidencias >= 5) - altos),
    alinhamento: clamp(4 - abertos - (altos > 0)),
    dados: clamp(1 + (ctx.indicadores.length > 0) + (ctx.sistemas.length >= 2) + (cobertura >= 0.9)),
  };
  origem.mat = {
    clareza: `${dores.length} dor(es), ${ctx.regras.length} regra(s), ${ctx.indicadores.length} indicador(es), ${abertos} conflito(s) aberto(s)`,
    evidencias: `cobertura de ${Math.round(cobertura * 100)}%, ${ctx.evidencias} evidência(s), ${altos} lacuna(s) de alto impacto`,
    alinhamento: `${abertos} conflito(s) aberto(s) entre as fontes`,
    dados: `${ctx.indicadores.length} indicador(es) e ${ctx.sistemas.length} sistema(s) mapeados`,
  };
  return { desafio, origem };
}
