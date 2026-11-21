/**
 * DarkLabs na Jornada Guiada: regras da simulação (sem React e sem navegador).
 * Todas as funções recebem o estado `S` da simulação e o alteram no lugar quando são ações.
 * Base: protótipo navegável do DarkLabs, com ajustes descritos nos comentários "Ajuste:".
 */
import { AREAS, BASE, DEF_D, DEMOS, GATILHOS, MOTORES, PACKS, PRODUTOS, STH } from './conteudo.js';
import { brl, dec1, fmt, lc, pvalor } from './formato.js';
import { triagemDoContexto } from './contexto.js';

export const VERSAO = 1;

const clone = (o) => JSON.parse(JSON.stringify(o));

/** Gerador pseudoaleatório determinístico: a mesma semente gera sempre os mesmos números. */
export function rng(seed) {
  let a = 7;
  for (const ch of String(seed)) a = (Math.imul(a, 31) + ch.charCodeAt(0)) >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function novo(empresa = '') {
  return {
    v: VERSAO,
    desafio: {
      empresa,
      setor: 'varejo',
      porte: 'grande',
      ambicao: '',
      problema: '',
      publico: '',
      meta: '',
      orcamento: '',
      stakeholders: '',
      perfil: 1,
      gatilho: 'escalar',
      longo: false,
      mat: { clareza: 3, evidencias: 3, capacidade: 3, alinhamento: 3, dados: 3 },
    },
    triado: false,
    rec: null,
    produto: null,
    squad: {},
    areas: [],
    iniciada: false,
    concluida: false,
    encerrada: null,
    ciclo: 1,
    dia: 0,
    // Ajuste: dias planejados do trabalho já executado (sem retrabalho), base do ganho de velocidade.
    planejado: 0,
    inicioCiclo: 0,
    motores: {},
    hipoteses: [],
    pilulas: [],
    exp: { n: 4000, c: 8, v: 10, csat: 78, ad: 34, ef: 12, reg: false },
    bc: null,
    invest: 0,
    num: { ativos: 0, backlog: 0 },
    backlogFuturo: [],
    memoria: [],
    decisoes: [],
    historico: [],
    log: {},
    // Contexto consolidado (01-contexto-002) usado na triagem e nos textos dos motores; null = sem vínculo.
    contexto: null,
    origens: null,
  };
}

/** Aceita um estado salvo ou importado; devolve null se não for uma simulação válida. */
export function restaurar(obj) {
  if (!obj || typeof obj !== 'object' || obj.v !== VERSAO || !obj.desafio) return null;
  const S = Object.assign(novo(), obj);
  S.desafio = Object.assign(novo().desafio, obj.desafio);
  S.desafio.mat = Object.assign(novo().desafio.mat, obj.desafio.mat);
  S.exp = Object.assign(novo().exp, obj.exp);
  if (typeof obj.planejado !== 'number') S.planejado = S.dia || 0;
  return S;
}

/* ── Cálculos ──────────────────────────────────────────────────────────────── */

const unicos = (lista) => [...new Set(lista.filter(Boolean))];

/**
 * Pacote do setor usado pelos geradores dos motores. Com o contexto vinculado, as dores, os sistemas,
 * os indicadores e o público do projeto entram na frente dos exemplos do setor.
 */
export function pack(S) {
  const P = PACKS[S.desafio.setor] || PACKS.outro;
  const c = S.contexto;
  if (!c) return P;
  return {
    ...P,
    cliente: c.atores[0] ? lc(c.atores[0].nome) : P.cliente,
    dores: unicos([...c.dores.map((x) => lc(x.nome)), ...P.dores]).slice(0, Math.max(5, c.dores.length)),
    sistemas: unicos([...c.sistemas.map((x) => x.nome), ...P.sistemas]).slice(0, Math.max(4, c.sistemas.length)),
    kpis: unicos([...c.indicadores.map((x) => lc(x.nome)), ...P.kpis]).slice(0, Math.max(4, c.indicadores.length)),
  };
}

/**
 * Vincula a simulação ao contexto consolidado e preenche a triagem com ele. Mantém os campos que o
 * contexto não informa (porte, apetite de investimento, perfil, capacidade interna) e pede nova triagem.
 */
export function aplicarContexto(S, ctx, projeto) {
  const { desafio, origem } = triagemDoContexto(ctx, { projeto });
  const { mat, ...resto } = desafio;
  Object.assign(S.desafio, resto);
  Object.assign(S.desafio.mat, mat);
  S.contexto = ctx;
  S.origens = origem;
  if (!S.iniciada || S.concluida) {
    S.triado = false;
    S.rec = null;
    // Hipóteses, pílulas e business case nascem do desafio: com um desafio novo, são geradas de novo.
    if (!S.iniciada) {
      S.hipoteses = [];
      S.pilulas = [];
      S.bc = null;
    }
  }
  registrarMemoria(
    S,
    'sistema',
    0,
    `Triagem preenchida com a Consolidação de contexto (002) R${ctx.revisao}: ${ctx.dores.length} dor(es), ${ctx.atores.length} ator(es), ${ctx.indicadores.length} indicador(es), ${ctx.conflitos.filter((x) => !x.resolvido).length} conflito(s) aberto(s).`,
  );
}
export const produtoPorId = (id) => PRODUTOS.find((p) => p.id === id) ?? null;
export const prod = (S) => produtoPorId(S.produto);

export function diasMotor(S, m, p = prod(S)) {
  if (!p) return 0;
  const soma = p.motores.reduce((a, k) => a + DEF_D[k], 0);
  return (p.dias * DEF_D[m]) / soma;
}

export function horasRole(S, r, p = prod(S)) {
  if (!p) return 0;
  const diasUteis = Math.round((p.dias * 5) / 7);
  const alocacao = (S.squad[r] ?? 0) / 100;
  return alocacao * 6 * diasUteis * (r === 'areas' ? Math.max(1, S.areas.length) : 1);
}

export const custo = (S, roles, p = prod(S)) => roles.reduce((a, r) => a + horasRole(S, r.id, p) * r.rate, 0);
export const horasTotais = (S, roles, p = prod(S)) => roles.reduce((a, r) => a + horasRole(S, r.id, p), 0);
export const payback = (S) => (S.bc ? Math.max(3, Math.round(S.invest / (S.bc.valor / 12))) : 0);

export function pilula(S) {
  const escolhida = S.pilulas.find((p) => p.escolhida);
  return escolhida || [...S.pilulas].sort((a, b) => b.score - a.score)[0] || { nome: 'nova solução', score: 0 };
}

export function escolher(S) {
  const top = [...S.pilulas].sort((a, b) => b.score - a.score)[0];
  S.pilulas.forEach((p) => {
    p.escolhida = p === top;
  });
  return top;
}

/** Contexto entregue aos geradores de texto dos motores. */
export function contexto(S, m, i) {
  const d = S.desafio;
  const P = pack(S);
  const R = rng(`${d.empresa}|${m}|${i}|${S.ciclo}|${S.motores[m]?.iter || 0}`);
  const n = (a, b) => Math.round(a + R() * (b - a));
  return {
    S,
    d,
    P,
    R,
    n,
    E: d.empresa || 'a empresa',
    pub: d.publico || P.cliente,
    prob: d.problema || P.dores[0],
    amb: lc(d.ambicao) || 'crescer de forma sustentável',
    meta: d.meta || P.kpis[0],
    pil: pilula(S).nome,
    H: S.hipoteses,
    payback: () => payback(S),
    escolher: () => escolher(S),
    ab: () => ab(S),
    rec6: () => rec6(S),
  };
}

export function gerarHipoteses(S) {
  const d = S.desafio;
  const pub = d.publico || pack(S).cliente;
  const pr = d.problema || pack(S).dores[0];
  return [
    { id: 'H1', tipo: 'Valor', txt: `Uma solução que resolva "${pr}" aumenta a conversão de ${pub} em pelo menos 10%.`, status: 'aberta', evid: '' },
    { id: 'H2', tipo: 'Desejabilidade', txt: `A nova experiência eleva a satisfação de ${pub} para CSAT 75 ou mais.`, status: 'aberta', evid: '' },
    { id: 'H3', tipo: 'Adoção', txt: 'Ao menos 30% da base ativa adota a solução nos primeiros 90 dias.', status: 'aberta', evid: '' },
    { id: 'H4', tipo: 'Viabilidade', txt: 'A solução reduz em 15% ou mais o esforço operacional das equipes envolvidas.', status: 'aberta', evid: '' },
  ];
}

export function gerarPilulas(S) {
  const R = rng(`${S.desafio.empresa}pil`);
  return pack(S).pilulas.map((nome) => {
    const valor = 5 + Math.round(R() * 5);
    const esforco = 2 + Math.round(R() * 6);
    const risco = 2 + Math.round(R() * 6);
    return { nome, valor, esforco, risco, score: Math.round((valor * 0.5 + (10 - esforco) * 0.3 + (10 - risco) * 0.2) * 10), escolhida: false };
  });
}

export function gerarBusinessCase(S) {
  const fat = { pequeno: 80e6, medio: 600e6, grande: 4e9 }[S.desafio.porte] || 600e6;
  const R = rng(`${S.desafio.empresa}bc`);
  const uplift = 0.0015 + R() * 0.003;
  return { fat, uplift, valor: fat * uplift };
}

/** Confiança do motor: métodos executados, insumos confirmados, rodadas de ajuste e laboratório registrado. */
export function confianca(S, m) {
  const M = S.motores[m];
  const mo = MOTORES[m - 1];
  if (!M) return 0;
  const feitos = Object.keys(M.metodos).length / mo.metodos.length;
  const entradas = Object.values(M.entrada).filter(Boolean).length / mo.entrada.length;
  let c = 30 + 45 * feitos + 15 * entradas + 8 * M.iter;
  if (m === 6 && S.exp.reg) c += 5;
  return Math.min(98, Math.round(c));
}

function Phi(x) {
  const t = 1 / (1 + 0.2316419 * x);
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  return 1 - d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
}

/** Teste A/B de duas proporções (bicaudal): lift da variante, z e p-valor. */
export function ab(S) {
  const { n, c, v } = S.exp;
  const p1 = c / 100;
  const p2 = v / 100;
  const p = (p1 + p2) / 2;
  const se = Math.sqrt((p * (1 - p) * 2) / n);
  const z = se ? (p2 - p1) / se : 0;
  return { lift: p1 ? ((p2 - p1) / p1) * 100 : 0, z, pv: 2 * (1 - Phi(Math.abs(z))) };
}

/** Classificação das hipóteses H1 a H4 a partir dos resultados do laboratório. */
export function avaliar(S) {
  const a = ab(S);
  const E = S.exp;
  const h1 = a.pv < 0.05 ? (a.lift >= 10 ? 'confirmada' : a.lift > 0 ? 'inconclusiva' : 'rejeitada') : a.lift > 0 ? 'inconclusiva' : 'rejeitada';
  const t = (x, ok, mid) => (x >= ok ? 'confirmada' : x >= mid ? 'inconclusiva' : 'rejeitada');
  return [
    { st: h1, ev: `lift ${dec1(a.lift)}%, p ${pvalor(a.pv)}` },
    { st: t(E.csat, 75, 60), ev: `CSAT ${E.csat}` },
    { st: t(E.ad, 30, 15), ev: `adoção ${E.ad}%` },
    { st: t(E.ef, 15, 5), ev: `esforço −${E.ef}%` },
  ];
}

export function rec6(S) {
  const H = S.hipoteses;
  if (!H.some((h) => h.status !== 'aberta')) {
    return { tit: 'Validar', txt: 'As hipóteses ainda não foram testadas em experimentos. O próximo passo é levá-las a um MVP medido.', cls: 'warn' };
  }
  const k = H.filter((h) => h.status === 'confirmada').length;
  const r = H.filter((h) => h.status === 'rejeitada').length;
  if (k >= 3) return { tit: 'Ampliar', txt: `${k} de ${H.length} hipóteses confirmadas. Escalar para toda a base e novos canais, mantendo os experimentos ativos.`, cls: 'ok' };
  if (k >= 2 && r <= 1) return { tit: 'Ajustar', txt: `${k} hipóteses confirmadas e as demais em aberto. Iterar nas inconclusivas antes de ampliar.`, cls: 'warn' };
  return { tit: 'Interromper ou pivotar', txt: `Só ${k} hipótese(s) confirmada(s) e ${r} rejeitada(s). As evidências não sustentam o investimento em escala.`, cls: 'bad' };
}

export function custoEvitado(S, roles) {
  let v = 0;
  const p = prod(S);
  if (S.encerrada && p) {
    const restante = p.motores.filter((m) => S.motores[m]?.status === 'cancelado').reduce((a, m) => a + diasMotor(S, m), 0);
    v += (custo(S, roles, p) * restante) / p.dias;
  }
  v += S.hipoteses.filter((h) => h.status === 'rejeitada').length * 0.08 * S.invest;
  return v;
}

export function metricas(S, roles) {
  const dec = S.decisoes;
  const H = S.hipoteses;
  const decEv = dec.filter((d) => d.conf >= 70).length;
  const dias = Math.round(S.dia);
  // Ajuste: no protótipo a base era dias × 2,4, o que deixava o ganho sempre em 58%. Agora a base é o
  // tempo planejado do trabalho executado no modelo tradicional; refazer métodos e ajustar gates reduz o ganho.
  const base = Math.round((S.planejado || 0) * BASE);
  return {
    dec: dec.length,
    decEv,
    pctEv: dec.length ? Math.round((decEv / dec.length) * 100) : 0,
    test: H.filter((h) => h.status !== 'aberta').length,
    tot: H.length,
    confd: H.filter((h) => h.status === 'confirmada').length,
    rej: H.filter((h) => h.status === 'rejeitada').length,
    inc: H.filter((h) => h.status === 'inconclusiva').length,
    dias,
    base,
    primeira: dec.length ? Math.round(dec[0].dia) : null,
    ganhoVel: base ? Math.max(0, Math.round((1 - S.dia / base) * 100)) : 0,
    custoEv: custoEvitado(S, roles),
    ciclos: S.historico.length,
    backlog: S.backlogFuturo.length,
    ativos: S.num.ativos,
    aprend: S.memoria.filter((x) => x.tipo !== 'sistema').length,
    valor: S.bc ? S.bc.valor : 0,
    invest: S.invest,
    roi: S.invest && S.bc ? ((S.bc.valor - S.invest) / S.invest) * 100 : 0,
  };
}

/** Triagem: maturidade média, gatilho e capacidade interna definem o produto recomendado. */
export function recomendar(S) {
  const d = S.desafio;
  const m = d.mat;
  const avg = (m.clareza + m.evidencias + m.capacidade + m.alinhamento + m.dados) / 5;
  const mot = [];
  let id;
  const g = GATILHOS[d.gatilho][0];
  if (avg < 2.5 && (d.gatilho === 'escalar' || d.gatilho === 'destravar')) {
    id = 'completa';
    mot.push(`Maturidade média de ${dec1(avg)} de 5: o desafio precisa passar por todos os motores, do enquadramento à evolução.`);
    mot.push(`Gatilho "${g}" com baixa clareza e poucas evidências.`);
  } else if (d.gatilho === 'escalar') {
    id = 'discovery';
    mot.push(`Gatilho "${g}": a ambição existe, mas problema e valor ainda precisam ser enquadrados.`);
    mot.push('O Discovery Sprint entrega o business case em 45 dias.');
  } else if (d.gatilho === 'evidencias') {
    id = 'innovation';
    mot.push(`Gatilho "${g}": é preciso testar interesse, experiência e viabilidade.`);
    mot.push('O Product Innovation leva a oportunidade a um protótipo validado com usuários em 60 dias.');
  } else if (d.gatilho === 'destravar') {
    id = 'impulso';
    mot.push(`Gatilho "${g}": faltam alinhamento e prioridades, então o caminho é uma jornada curta.`);
    mot.push('O Impulso mapeia sinais, cria pílulas de solução e desenha a solução ideal.');
  } else {
    id = m.evidencias >= 3 ? 'evolution' : 'mvp';
    mot.push(`Gatilho "${g}": o produto existe e o contexto mudou.`);
    mot.push(id === 'evolution' ? 'Há evidências suficientes para entrar em evolução contínua.' : 'As evidências ainda são fracas, então vale reconstruir e medir via MVP.');
  }
  if (m.capacidade <= 2) mot.push('A capacidade interna de produto é baixa, por isso o squad DarkLabs assume a condução.');
  const comp = (d.longo || d.gatilho === 'evoluir') && id !== 'foresight' && id !== 'completa' ? 'foresight' : null;
  return { id, mot, avg, comp };
}

/* ── Ações ─────────────────────────────────────────────────────────────────── */

export function registrarMemoria(S, tipo, motor, txt) {
  S.memoria.push({ dia: Math.round(S.dia), ciclo: S.ciclo, motor, tipo, txt });
}

export function addLog(S, m, t) {
  (S.log[m] = S.log[m] || []).push(t);
  if (S.log[m].length > 40) S.log[m].shift();
}

/** Escolhe o produto da prateleira. Devolve uma mensagem de erro quando há jornada em andamento. */
export function definirProduto(S, id) {
  const p = produtoPorId(id);
  if (!p) return 'Produto não encontrado.';
  if (S.iniciada && !S.concluida) return 'Há uma jornada em andamento. Conclua ou interrompa antes de trocar de produto.';
  if (S.concluida) {
    S.ciclo += 1;
    S.iniciada = false;
    S.concluida = false;
    S.encerrada = null;
  }
  S.produto = id;
  S.squad = clone(p.roles);
  S.areas = [...p.areas];
  return null;
}

export function triar(S) {
  if (!S.desafio.empresa.trim()) S.desafio.empresa = 'Empresa sem nome';
  S.rec = recomendar(S);
  S.triado = true;
  if (!S.iniciada || S.concluida) definirProduto(S, S.rec.id);
  registrarMemoria(S, 'sistema', 0, `Triagem concluída. Recomendação: ${produtoPorId(S.rec.id).nome}.`);
}

export function iniciar(S, roles) {
  const p = prod(S);
  if (!p) return;
  S.motores = {};
  S.log = {};
  for (let m = 1; m <= 7; m++) {
    S.motores[m] = { status: p.motores.includes(m) ? 'bloqueado' : 'fora', entrada: {}, metodos: {}, saidas: null, iter: 0, just: '' };
  }
  const primeiro = p.motores[0];
  S.motores[primeiro].status = 'disponivel';
  S.motores[primeiro].entrada = { 0: true, 1: Boolean(S.desafio.ambicao) };
  if (!S.hipoteses.length) S.hipoteses = gerarHipoteses(S);
  if (!S.pilulas.length) S.pilulas = gerarPilulas(S);
  if (!S.bc) S.bc = gerarBusinessCase(S);
  S.exp.reg = false;
  S.invest += custo(S, roles, p);
  S.iniciada = true;
  S.concluida = false;
  S.encerrada = null;
  S.inicioCiclo = S.dia;
  registrarMemoria(S, 'sistema', 0, `Ciclo ${S.ciclo} iniciado: ${p.nome}. Squad de ${fmt(horasTotais(S, roles, p))} h, investimento estimado de ${brl(custo(S, roles, p))}.`);
}

export const motorAtivo = (S, m) => ['disponivel', 'andamento'].includes(S.motores[m]?.status);

/** Conclui um método do motor (a parte assíncrona, com o "agente trabalhando", fica com quem chama). */
export function concluirMetodo(S, m, i) {
  const M = S.motores[m];
  const mo = MOTORES[m - 1];
  const nome = mo.metodos[i][0];
  const quem = mo.humanos[i % mo.humanos.length];
  const anterior = M.metodos[i];
  M.metodos[i] = { res: mo.metodos[i][3](contexto(S, m, i)), quem, iter: anterior ? anterior.iter + 1 : 0 };
  addLog(S, m, `🧑 ${quem} · validou "${nome}" e registrou na memória`);
  const fatia = diasMotor(S, m) / mo.metodos.length;
  S.dia += fatia * (anterior ? 0.4 : 1);
  if (!anterior) S.planejado = (S.planejado || 0) + fatia;
  registrarMemoria(S, 'metodo', m, `${nome}: ${M.metodos[i].res}`);
}

export function registrarLaboratorio(S) {
  const r = avaliar(S);
  S.hipoteses.forEach((h, i) => {
    h.status = r[i].st;
    h.evid = r[i].ev;
  });
  S.exp.reg = true;
  registrarMemoria(S, 'hipotese', 6, `Hipóteses classificadas: ${S.hipoteses.map((h) => `${h.id} ${h.status}`).join(', ')}.`);
}

/** Mínimos para consolidar: 60% dos métodos executados e 50% dos insumos confirmados. */
export function limitesConsolidacao(S, m) {
  const mo = MOTORES[m - 1];
  const M = S.motores[m];
  const minM = Math.ceil(mo.metodos.length * 0.6);
  const minE = Math.ceil(mo.entrada.length * 0.5);
  const feitos = Object.keys(M.metodos).length;
  const entradas = Object.values(M.entrada).filter(Boolean).length;
  return { minM, minE, feitos, entradas, pode: motorAtivo(S, m) && feitos >= minM && entradas >= minE };
}

export function consolidar(S, m) {
  const M = S.motores[m];
  const mo = MOTORES[m - 1];
  if (m === 6 && !S.exp.reg) registrarLaboratorio(S);
  if (m >= 3 && !S.pilulas.some((p) => p.escolhida)) escolher(S);
  if (mo.pre) mo.pre(contexto(S, m, 'pre'));
  M.saidas = mo.saidas.map((_, i) => mo.out[i](contexto(S, m, `o${i}`)));
  registrarMemoria(S, 'saida', m, `Saídas consolidadas${M.iter ? ` (revisão ${M.iter})` : ''}: ${mo.saidas.join('; ')}.`);
}

function fecharCiclo(S, status) {
  S.concluida = true;
  const dias = Math.round(S.dia - (S.inicioCiclo || 0));
  S.historico.push({ ciclo: S.ciclo, produto: prod(S).nome, dias, status });
  registrarMemoria(S, 'sistema', 0, `Ciclo ${S.ciclo} ${status === 'concluido' ? 'concluído' : 'interrompido'} após ${dias} dias simulados.`);
}

/**
 * Decisão do gate. Devolve o que aconteceu para a tela reagir:
 * { tipo: 'ajustar' } · { tipo: 'interromper' } · { tipo: 'avancar', proximo } · { tipo: 'concluir' }.
 */
export function decidir(S, m, decisao) {
  const M = S.motores[m];
  const mo = MOTORES[m - 1];
  const p = prod(S);
  const cf = confianca(S, m);
  const just = (M.just || '').trim() || 'Sem justificativa registrada.';
  if (decisao === 'ajustar') {
    M.iter += 1;
    S.dia += diasMotor(S, m) * 0.15;
    M.saidas = null;
    S.decisoes.push({ ciclo: S.ciclo, motor: m, dec: 'ajustar', conf: cf, dia: S.dia, just });
    registrarMemoria(S, 'decisao', m, `Gate AJUSTAR com confiança de ${cf}%. ${just}`);
    M.just = '';
    return { tipo: 'ajustar' };
  }
  if (decisao === 'interromper') {
    M.status = 'interrompido';
    p.motores.filter((x) => x > m).forEach((x) => {
      S.motores[x].status = 'cancelado';
    });
    S.encerrada = { motor: m, just };
    S.decisoes.push({ ciclo: S.ciclo, motor: m, dec: 'interromper', conf: cf, dia: S.dia, just });
    registrarMemoria(S, 'decisao', m, `Gate INTERROMPER com confiança de ${cf}%. ${just}`);
    fecharCiclo(S, 'interrompido');
    return { tipo: 'interromper' };
  }
  M.status = 'concluido';
  M.gate = { conf: cf, dia: S.dia, just };
  S.decisoes.push({ ciclo: S.ciclo, motor: m, dec: 'avancar', conf: cf, dia: S.dia, just });
  registrarMemoria(S, 'decisao', m, `Gate AVANÇAR com confiança de ${cf}%. ${just}`);
  const proximo = p.motores.find((x) => x > m);
  if (proximo) {
    const N = S.motores[proximo];
    N.status = 'disponivel';
    MOTORES[proximo - 1].entrada.forEach((_, i) => {
      N.entrada[i] = true;
    });
    addLog(S, proximo, `⇢ Insumos recebidos do Motor ${m} (${mo.nome})`);
    return { tipo: 'avancar', proximo };
  }
  fecharCiclo(S, 'concluido');
  return { tipo: 'concluir' };
}

export function proximoProduto(S) {
  const p = prod(S);
  if (!p || S.encerrada) return 'discovery';
  if (S.motores[6]?.status === 'concluido') return rec6(S).cls === 'bad' ? 'discovery' : 'evolution';
  return { impulso: 'innovation', foresight: 'discovery', discovery: 'innovation', innovation: 'mvp', mvp: 'evolution', evolution: 'evolution', completa: 'evolution' }[p.id];
}

export function recomendacaoFinal(S, roles) {
  const p = prod(S);
  if (S.encerrada) {
    const m = S.encerrada.motor;
    return {
      tit: 'Interromper com aprendizado',
      cls: 'bad',
      txt: `A jornada foi interrompida no Motor ${m} (${MOTORES[m - 1].nome}). Custo evitado estimado: ${brl(custoEvitado(S, roles))}. O aprendizado fica registrado na memória e alimenta o próximo ciclo.`,
    };
  }
  if (S.motores[6]?.status === 'concluido') {
    const r = rec6(S);
    return { tit: r.tit, cls: r.cls, txt: r.txt };
  }
  const t =
    {
      impulso: 'A solução ideal está desenhada. Próximo passo: validar com usuários no Product Innovation.',
      foresight: 'O backlog do futuro está pronto. Próximo passo: levar as oportunidades prioritárias a um Discovery Sprint.',
      discovery: 'O business case sustenta o investimento. Próximo passo: o Product Innovation, para chegar a um protótipo validado.',
      innovation: 'O protótipo foi validado e o backlog está pronto. Próximo passo: construir o MVP.',
    }[p?.id] || 'Seguir para o próximo ciclo.';
  return { tit: 'Avançar', cls: 'ok', txt: t };
}

/** Carrega um cenário de demonstração (substitui a simulação atual). */
export function cenarioDeDemonstracao(id) {
  const S = novo();
  S.desafio = clone(DEMOS[id]);
  return S;
}

export function dossieEmTexto(S, roles) {
  const p = prod(S);
  const d = S.desafio;
  const R = recomendacaoFinal(S, roles);
  let t = `DOSSIÊ DARKLABS · ${d.empresa} · ciclo ${S.ciclo} · ${p.nome}\n\nRECOMENDAÇÃO: ${R.tit}\n${R.txt}\n\nDESAFIO\nAmbição: ${d.ambicao}\nProblema: ${d.problema}\nIndicador: ${d.meta}\n`;
  p.motores
    .filter((m) => S.motores[m]?.saidas)
    .forEach((m) => {
      const mo = MOTORES[m - 1];
      t += `\n== MOTOR ${m}: ${mo.nome.toUpperCase()} (${mo.verbo}) ==\n`;
      mo.saidas.forEach((s, i) => {
        t += `\n${s}\n${S.motores[m].saidas[i]}\n`;
      });
    });
  t += `\nHIPÓTESES\n${S.hipoteses.map((h) => `${h.id} [${STH[h.status][0]}] ${h.txt}${h.evid ? ` (${h.evid})` : ''}`).join('\n')}`;
  t += `\n\nDECISÕES\n${S.decisoes.map((x) => `Ciclo ${x.ciclo} · Motor ${x.motor} · ${x.dec} · ${x.conf}% · ${x.just}`).join('\n')}`;
  if (S.backlogFuturo.length) {
    t += `\n\nBACKLOG DO FUTURO\n${S.backlogFuturo.map((b, i) => `${i + 1}. [${b.pri}] ${b.item} · ${b.ev} · gatilho: ${b.gat}`).join('\n')}`;
  }
  return t;
}

export { AREAS };
