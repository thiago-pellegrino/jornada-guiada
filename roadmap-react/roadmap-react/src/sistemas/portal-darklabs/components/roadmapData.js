import { checkEligibility, latestRevision } from '../../../domain/journey/journeyEngine.js';

/**
 * Dados da tela DarkLabs › Aprendizados e roadmap, montados só com o que o projeto tem gravado:
 * situação dos 7 motores, entregáveis e atividades de cada resultado, lacunas, o que cada resultado
 * comprova e o roadmap do M7 (ou do M3). Nada aqui é específico de um case.
 *
 * Cor de cada célula da matriz motor × janela (até a janela atual; janelas futuras ficam "planejado"):
 *   executado  — resultado do motor aceito, ou entregável/atividade com evidência de conclusão;
 *   produzido  — resultado gerado aguardando aceite, ou entregável "em aceite" nas fontes;
 *   ativado    — motor em execução, ou entregável "em andamento" nas fontes;
 *   insumo     — o motor tem os insumos que pede, mas ainda não foi executado;
 *   planejado  — janela futura, ou motor com dependência aberta;
 *   impedido   — bloqueio registrado nas fontes.
 * O status registrado nas fontes (quando o resultado traz) tem prioridade sobre a situação do motor.
 */

const DIA = 86400000;

/** Janelas do ciclo de descoberta (duração em dias). O início vem do projeto ou da data escolhida na tela. */
export const JANELAS = Object.freeze([
  { id: 'J1', titulo: 'Enquadramento e mobilização', dias: 7 },
  { id: 'J2', titulo: 'Discovery e referências', dias: 7 },
  { id: 'J3', titulo: 'Workshop e síntese', dias: 5 },
  { id: 'J4', titulo: 'Gate 1 e arquitetura', dias: 7 },
  { id: 'J5', titulo: 'Produto e aprovações', dias: 5 },
  { id: 'J6', titulo: 'Business case e decisão', dias: 14 },
]);

/** Em que janelas cada motor costuma atuar; os entregáveis do motor se distribuem por elas, na ordem. */
export const PLANO_DOS_MOTORES = Object.freeze({
  1: [0, 1, 2, 3],
  2: [0, 1, 2, 3, 4],
  3: [1, 2, 3, 4, 5],
  4: [1, 2, 3, 4, 5],
  5: [2, 3, 4, 5],
  6: [4, 5],
  7: [1, 3, 5],
});

/** Protocolo padrão do projeto em 5 etapas, com os motores que alimentam cada uma. */
export const ETAPAS_DO_PROTOCOLO = Object.freeze([
  {
    n: 1,
    titulo: 'Mobilização e assimilação',
    motores: [1, 2],
    descricao: 'Consolidar o conhecimento existente, alinhar stakeholders e definir as decisões críticas da Discovery.',
    janela: 3,
    prazo: 'Gate previsto em',
  },
  {
    n: 2,
    titulo: 'Produto e experiência',
    motores: [3, 4],
    descricao: 'Definir visão de produto, usuários, canais, jornadas, experiência-alvo e escopo funcional.',
    janela: 4,
    prazo: 'Entregáveis previstos em',
  },
  {
    n: 3,
    titulo: 'Arquitetura, dados e IA',
    motores: [4, 5],
    descricao: 'Desenhar a arquitetura da solução, suas integrações, requisitos de dados e capacidades de IA.',
    janela: 4,
    prazo: 'Aprovações previstas em',
  },
  {
    n: 4,
    titulo: 'Business case e sourcing',
    motores: [3, 6],
    descricao: 'Atualizar business case, TCO e sourcing por capability coverage; quantificar valor, investimento e riscos.',
    janela: 5,
    prazo: 'Conclusão prevista em',
  },
  {
    n: 5,
    titulo: 'Roadmap e transição',
    motores: [7],
    descricao: 'Preparar o roadmap para MVP, implantação e futuras experimentações; converter recomendação em plano executável.',
    janela: 5,
    prazo: 'Entrega final prevista em',
  },
]);

/** Data de início da janela 1 escolhida na tela de roadmap (compartilhada com o protocolo). */
export const CHAVE_INICIO_ROADMAP = (projectId) => `jornada.darklab.roadmap-inicio.${projectId}`;
export function lerInicioDoRoadmap(projectId) {
  try {
    const v = globalThis.localStorage?.getItem(CHAVE_INICIO_ROADMAP(projectId));
    if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [a, m, d] = v.split('-').map(Number);
      return new Date(a, m - 1, d);
    }
  } catch {
    /* sem localStorage: usa a semana de criação do projeto */
  }
  return null;
}

export const SITUACAO_DA_ETAPA = Object.freeze({
  concluida: 'Concluída',
  fechamento: 'Em fechamento',
  andamento: 'Em andamento',
  impedida: 'Impedido por dados',
  nao: 'Não iniciado',
});

export const LEGENDA = Object.freeze([
  ['executado', 'executado'],
  ['produzido', 'produzido · aceite pendente'],
  ['ativado', 'ativado / em andamento'],
  ['insumo', 'insumo disponível, motor não iniciado'],
  ['planejado', 'planejado'],
  ['impedido', 'impedido'],
]);

export const ROTULO_CELULA = Object.freeze({
  executado: 'executado',
  produzido: 'aceite pendente',
  ativado: 'em curso',
  insumo: 'insumo disponível',
  planejado: 'planejado',
  impedido: 'impedido',
});

const PESO_IMPACTO = { alto: 0, médio: 1, medio: 1, baixo: 2 };
const DO_STATUS = {
  concluído: 'executado',
  'em aceite': 'produzido',
  'em andamento': 'ativado',
  impedido: 'impedido',
};

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const doisDig = (n) => String(n).padStart(2, '0');
export const diaMes = (d) => `${doisDig(d.getDate())} ${MESES[d.getMonth()]}`;
const meiaNoite = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Segunda-feira da semana da data. */
export function segundaDa(data) {
  const d = meiaNoite(new Date(data));
  const dow = (d.getDay() + 6) % 7;
  return new Date(d.getTime() - dow * DIA);
}

/** "27 out–05 nov" ou "13–16 nov". */
export function rotuloPeriodo(inicio, fim) {
  if (inicio.getMonth() === fim.getMonth()) return `${doisDig(inicio.getDate())}–${diaMes(fim)}`;
  return `${diaMes(inicio)}–${diaMes(fim)}`;
}

/** Datas de cada janela a partir do início (inclusive), e qual delas contém "agora". */
export function montarJanelas(inicio, agora = new Date()) {
  let cursor = meiaNoite(new Date(inicio));
  const hoje = meiaNoite(new Date(agora)).getTime();
  const janelas = JANELAS.map((j, i) => {
    const ini = cursor;
    const fim = new Date(ini.getTime() + (j.dias - 1) * DIA);
    cursor = new Date(fim.getTime() + DIA);
    return {
      ...j,
      indice: i,
      inicio: ini,
      fim,
      rotulo: rotuloPeriodo(ini, fim),
    };
  });
  let atual = janelas.findIndex((j) => hoje >= j.inicio.getTime() && hoje <= j.fim.getTime());
  if (atual === -1) atual = hoje < janelas[0].inicio.getTime() ? -1 : janelas.length;
  return { janelas, atual };
}

/** Distribui n itens pelas janelas do plano, na ordem. */
export function janelasDosItens(plano, n) {
  return Array.from({ length: n }, (_, i) => plano[Math.min(plano.length - 1, Math.floor((i * plano.length) / Math.max(1, n)))]);
}

/** Tenta ler uma data de um período livre ("12/11", "12/11/2026", "2026-11-12"). */
export function lerData(periodo, anoBase) {
  const t = String(periodo ?? '');
  let m = /(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  m = /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/.exec(t);
  if (m) {
    const ano = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : anoBase;
    return new Date(ano, Number(m[2]) - 1, Number(m[1]));
  }
  return null;
}

function janelaDaData(janelas, data) {
  if (!data) return null;
  const t = meiaNoite(data).getTime();
  const i = janelas.findIndex((j) => t >= j.inicio.getTime() && t <= j.fim.getTime());
  if (i !== -1) return i;
  return t < janelas[0].inicio.getTime() ? 0 : janelas.length - 1;
}

/** Situação do motor: aceito, produzido (resultado sem aceite), andamento, nao (insumo pronto) ou dependencia. */
export function situacaoDoMotor(project, catalog, cap, pending) {
  if (pending?.[`${cap.id}::projeto`]) return 'andamento';
  const rev = latestRevision(project, cap.id);
  if (rev) return rev.reviewState === 'aceito' ? 'aceito' : 'produzido';
  return checkEligibility(project, catalog, cap.id).ok ? 'nao' : 'dependencia';
}

function statusDaCelula(situacao, statusReal, janela, atual) {
  if (statusReal && DO_STATUS[statusReal]) return DO_STATUS[statusReal];
  if (janela > atual) return 'planejado';
  return { aceito: 'executado', produzido: 'produzido', andamento: 'ativado', nao: 'insumo' }[situacao] ?? 'planejado';
}

function nomeDoMotor(cap) {
  const m = /^Motor\s+\d+\s*·\s*([^—–-]+?)\s*[—–-]\s*(.+)$/.exec(cap.title ?? '');
  return m ? { verbo: m[1].trim(), nome: m[2].trim() } : { verbo: '', nome: cap.title };
}

/**
 * Monta tudo o que a tela mostra.
 * @param {{project, catalog, pending?, inicio?: Date|string, agora?: Date}} p
 */
/** Situações usadas no exemplo ilustrativo (só quando o usuário pede, com aviso na tela). */
export const SITUACOES_DE_EXEMPLO = Object.freeze({ 1: 'aceito', 2: 'aceito', 3: 'produzido', 4: 'andamento', 5: 'nao', 6: 'dependencia', 7: 'nao' });

export function montarRoadmap({ project, catalog, pending = {}, inicio = null, agora = new Date(), exemplo = false }) {
  const motores = catalog.byPhase.darklab.filter((c) => c.number >= 1 && c.number <= 7).sort((a, b) => a.number - b.number);
  // No exemplo ilustrativo, o ciclo é posicionado para "hoje" cair na 4ª janela, como num projeto em andamento.
  const diasAteJ4 = JANELAS.slice(0, 3).reduce((t, jn) => t + jn.dias, 0);
  const base = exemplo
    ? new Date(meiaNoite(new Date(agora)).getTime() - diasAteJ4 * DIA)
    : inicio
      ? new Date(inicio)
      : segundaDa(project.createdAt ?? agora);
  const { janelas, atual } = montarJanelas(base, agora);
  const ano = base.getFullYear();

  const linhas = motores.map((cap) => {
    const situacao = exemplo ? SITUACOES_DE_EXEMPLO[cap.number] : situacaoDoMotor(project, catalog, cap, pending);
    const rev = latestRevision(project, cap.id);
    const env = rev?.envelope;
    const dados = env?.data ?? {};
    const entregaveis = (dados.deliverables?.length ? dados.deliverables : (cap.example?.data?.deliverables ?? [])).map((d) => ({
      titulo: d.name,
      statusReal: rev ? d.status : null,
    }));
    const plano = PLANO_DOS_MOTORES[cap.number] ?? [0];
    const celulas = janelas.map(() => []);
    janelasDosItens(plano, entregaveis.length).forEach((w, i) => {
      const e = entregaveis[i];
      celulas[w].push({
        titulo: e.titulo,
        tipo: 'entregavel',
        status: statusDaCelula(situacao, e.statusReal, w, atual),
      });
    });
    // Atividades registradas nas fontes (quando o resultado traz) entram na janela da data delas.
    for (const a of dados.activities ?? []) {
      const w = janelaDaData(janelas, lerData(a.period, ano));
      if (w === null) continue;
      celulas[w].push({
        titulo: a.title,
        tipo: 'atividade',
        periodo: a.period,
        status: DO_STATUS[a.status] ?? statusDaCelula(situacao, null, w, atual),
      });
    }
    const lacunas = (env?.gaps ?? []).map((g) => ({
      id: g.id,
      pergunta: g.question,
      impacto: g.impact,
    }));
    return {
      cap,
      numero: cap.number,
      ...nomeDoMotor(cap),
      faixa: cap.number <= 2 ? 'up' : 'down',
      situacao,
      revisao: rev?.revision ?? null,
      geradoEm: rev?.generatedAt ?? null,
      celulas,
      lacunas,
      comprova: dados.readingNote?.proves ?? [],
      naoComprova: dados.readingNote?.doesNotProve ?? [],
      entregaveis: entregaveis.length,
    };
  });

  const porNumero = new Map(linhas.map((l) => [l.numero, l]));
  const comResultado = (s) => s === 'aceito' || s === 'produzido';

  const etapas = ETAPAS_DO_PROTOCOLO.map((e) => {
    const ls = e.motores.map((n) => porNumero.get(n)).filter(Boolean);
    const iniciados = ls.filter((l) => comResultado(l.situacao) || l.situacao === 'andamento');
    const lacunasAltas = iniciados.flatMap((l) => l.lacunas.filter((g) => g.impacto === 'alto'));
    let situacao = 'nao';
    if (ls.length && ls.every((l) => l.situacao === 'aceito')) situacao = 'concluida';
    else if (ls.length && ls.every((l) => comResultado(l.situacao))) situacao = 'fechamento';
    else if (iniciados.length) situacao = lacunasAltas.length ? 'impedida' : 'andamento';
    const vistos = new Set();
    const entregaveis = ls.flatMap((l) =>
      l.celulas.flatMap((itens, w) =>
        itens
          .filter((c) => !vistos.has(`${l.numero}:${c.titulo}`) && vistos.add(`${l.numero}:${c.titulo}`))
          .map((c) => ({ ...c, motor: l.numero, janela: janelas[w]?.titulo ?? '' })),
      ),
    );
    const jPrazo = janelas[Math.min(e.janela, janelas.length - 1)];
    return {
      ...e,
      situacao,
      lacunasAltas: lacunasAltas.length,
      perguntasAltas: [...new Set(lacunasAltas.map((g) => g.pergunta))],
      entregaveis,
      motoresDaEtapa: ls.map((l) => ({ numero: l.numero, verbo: l.verbo, nome: l.nome, situacao: l.situacao, revisao: l.revisao, capId: l.cap.id })),
      dataPrazo: jPrazo ? diaMes(jPrazo.fim) : null,
    };
  });

  // Marcos: a janela atual e as seguintes, com o que falta entregar em cada uma.
  const primeira = Math.max(0, Math.min(atual, janelas.length - 4));
  const marcos = janelas.slice(primeira, primeira + 4).map((j) => {
    const itens = linhas.flatMap((l) =>
      l.celulas[j.indice].map((c) => ({
        ...c,
        motor: l.numero,
        situacaoMotor: l.situacao,
      })),
    );
    const abertos = itens.filter((c) => c.status !== 'executado');
    return {
      janela: j,
      data: atual === j.indice ? diaMes(j.fim) : rotuloPeriodo(j.inicio, j.fim),
      atual: j.indice === atual,
      passado: j.indice < atual,
      abertos,
      total: itens.length,
      motores: [...new Set(itens.map((c) => c.motor))].map((n) => ({
        numero: n,
        situacao: porNumero.get(n)?.situacao,
      })),
    };
  });

  // Próxima sequência crítica: fim da janela atual e das duas seguintes.
  const seq = janelas.slice(Math.max(0, atual), Math.max(0, atual) + 3);
  const sequencia = {
    datas: seq.map((j) => `${doisDig(j.fim.getDate())}`),
    mes: seq.length ? MESES[seq[seq.length - 1].fim.getMonth()] : '',
    rotulos: seq.map((j) => diaMes(j.fim)),
    titulos: seq.map((j) => j.titulo),
    encerrado: atual >= janelas.length,
  };

  // Roadmap: M7 revisado; sem M7, o roadmap inicial do M3.
  const m7 = latestRevision(project, motores.find((m) => m.number === 7)?.id)?.envelope?.data;
  const m3 = latestRevision(project, motores.find((m) => m.number === 3)?.id)?.envelope?.data;
  const itensRoadmap = m7?.revisedRoadmap?.length ? m7.revisedRoadmap : (m3?.initialRoadmap ?? []);
  const origemRoadmap = m7?.revisedRoadmap?.length ? 'M7 · roadmap revisado' : m3?.initialRoadmap?.length ? 'M3 · roadmap inicial' : null;
  const ondas = { agora: [], próximo: [], futuro: [] };
  for (const r of itensRoadmap)
    (ondas[r.wave] ?? ondas.futuro).push({
      id: r.id,
      titulo: r.title,
      detalhe: r.exitCriteria ?? r.reason ?? r.rationale ?? '',
      mudanca: r.changeType ?? null,
    });

  const aprendizados = linhas
    .filter((l) => l.revisao)
    .map((l) => ({
      numero: l.numero,
      nome: l.nome,
      situacao: l.situacao,
      comprova: l.comprova,
      naoComprova: l.naoComprova,
    }));
  // Lacunas abertas, sem repetir a mesma pergunta levantada por motores diferentes.
  const porPergunta = new Map();
  for (const l of linhas) {
    for (const g of l.lacunas) {
      const chave = String(g.pergunta ?? g.id)
        .trim()
        .toLowerCase();
      const atualG = porPergunta.get(chave);
      if (atualG) {
        if (!atualG.motores.includes(l.numero)) atualG.motores.push(l.numero);
        if ((PESO_IMPACTO[g.impacto] ?? 3) < (PESO_IMPACTO[atualG.impacto] ?? 3)) atualG.impacto = g.impacto;
      } else porPergunta.set(chave, { ...g, motores: [l.numero] });
    }
  }
  const lacunas = [...porPergunta.values()].sort((a, b) => (PESO_IMPACTO[a.impacto] ?? 3) - (PESO_IMPACTO[b.impacto] ?? 3));

  return {
    janelas,
    atual,
    inicio: base,
    linhas,
    etapas,
    marcos,
    sequencia,
    ondas,
    origemRoadmap,
    aprendizados,
    lacunas,
    exemplo,
    semExecucao: !exemplo && linhas.every((l) => !l.revisao && l.situacao !== 'andamento'),
  };
}
