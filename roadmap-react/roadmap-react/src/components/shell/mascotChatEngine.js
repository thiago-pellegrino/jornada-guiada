import { latestRevision, stageLabel } from '../../domain/journey/journeyEngine.js';
import { buildCopilotInsights } from '../../domain/simulationEngine.js';
import { situacaoDoMotor } from '../darklab/roadmapData.js';

/**
 * Respostas do mini chat da mascote do Delta.
 * A mascote não executa tarefas nem altera dados: responde com o que a página e o projeto já têm
 * (simulação das squads e situação da jornada) e sugere onde a pessoa faz cada coisa.
 * Ações das respostas: { rotulo, tipo: 'chat' | 'delta' | 'aba' | 'darklab', aba?, view? }.
 */

export const NOME_DA_ABA = Object.freeze({
  contexto: 'Criação de Contexto',
  darklab: 'DarkLabs',
  projetos: 'Projetos',
  'backlog-futuro': 'Backlog do Futuro',
  epicos: 'Épicos, Features e Histórias',
  'escopo-squads': 'Escopo das Squads',
  planejamento: 'Cronograma',
  resultados: 'Resultados',
  curva: 'Dashboards',
  builder: 'Delta Builder',
});

/** Dicas por aba (genéricas, sem dados de nenhum case). */
export const DICAS_DA_ABA = Object.freeze({
  contexto: {
    texto: 'Envie as fontes e use o Modo Turbo para consolidar o contexto de ponta a ponta.',
    acoes: [{ rotulo: 'Perguntar aqui', tipo: 'chat' }],
  },
  darklab: {
    texto: 'Os 7 motores destravam em ordem. Na jornada você vê qual executar agora e o que falta.',
    acoes: [{ rotulo: 'Ver a jornada', tipo: 'darklab', view: 'jornada-7-motores' }],
  },
  projetos: {
    texto: 'Aqui ficam os projetos definidos. Escolha um para seguir para o backlog.',
    acoes: [{ rotulo: 'Perguntar aqui', tipo: 'chat' }],
  },
  'backlog-futuro': {
    texto: 'O backlog do futuro vem do Motor 7. Priorize o que entra no próximo ciclo.',
    acoes: [{ rotulo: 'Perguntar aqui', tipo: 'chat' }],
  },
  epicos: {
    texto: 'Quebre os épicos em features e histórias antes de distribuir pelas squads.',
    acoes: [{ rotulo: 'Perguntar aqui', tipo: 'chat' }],
  },
  'escopo-squads': {
    texto: 'Confira o escopo de cada squad antes de simular a capacidade.',
    acoes: [{ rotulo: 'Ir para o cronograma', tipo: 'aba', aba: 'planejamento' }],
  },
  planejamento: {
    texto: 'Ajuste as horas de cada squad direto na grade e veja na hora o efeito nas semanas.',
    acoes: [{ rotulo: 'Qual squad é o gargalo?', tipo: 'pergunta' }],
  },
  resultados: {
    texto: 'Squads fora da janela? O Delta completo prepara uma proposta de redistribuição.',
    acoes: [{ rotulo: 'Abrir o Delta completo', tipo: 'delta' }],
  },
  curva: { texto: 'Compare a curva planejada com a realizada para achar os desvios.', acoes: [{ rotulo: 'Perguntar aqui', tipo: 'chat' }] },
  builder: { texto: 'Descreva a tela que quer ver; eu acompanho enquanto o Delta Builder gera.', acoes: [] },
});

const PERGUNTAS_DA_SIMULACAO = ['Qual squad é o gargalo?', 'Quantos profissionais faltam?', 'Quanto entregamos até o Freezing?'];
const PERGUNTAS_DA_JORNADA = ['Qual é o próximo passo?', 'O que falta revisar?', 'Resumo do projeto'];

/** Perguntas rápidas sugeridas conforme a aba. */
export function sugestoesDaAba(tab) {
  if (['planejamento', 'resultados', 'curva', 'escopo-squads'].includes(tab)) return [...PERGUNTAS_DA_SIMULACAO, 'O que faço nesta página?'];
  return [...PERGUNTAS_DA_JORNADA, 'O que faço nesta página?'];
}

export const normalizar = (t) =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** Quantos resultados (última revisão de cada um) ainda não foram aceitos. */
export function aguardandoRevisao(project) {
  return Object.values(project?.artifacts ?? {}).filter((revs) => {
    const ult = revs[revs.length - 1];
    return ult && ult.reviewState !== 'aceito';
  }).length;
}

/** Situação da jornada do projeto selecionado, em números. */
export function resumoDaJornada({ project, catalog, pending = {} }) {
  if (!project || !catalog) return null;
  const motores = (catalog.byPhase?.darklab ?? [])
    .filter((c) => c.number >= 1 && c.number <= 7)
    .sort((a, b) => a.number - b.number)
    .map((cap) => {
      const m = /^Motor\s+\d+\s*·\s*([^—–-]+?)\s*[—–-]/.exec(cap.title ?? '');
      return {
        numero: cap.number,
        verbo: m ? m[1].trim() : `Motor ${cap.number}`,
        situacao: situacaoDoMotor(project, catalog, cap, pending),
        revisao: latestRevision(project, cap.id)?.revision ?? null,
      };
    });
  const conta = (s) => motores.filter((m) => m.situacao === s).length;
  return {
    codigo: project.code,
    nome: project.name,
    etapa: stageLabel(project.stage),
    fontes: (project.sources ?? []).length,
    motores,
    aceitos: conta('aceito'),
    produzidos: conta('produzido'),
    emAndamento: conta('andamento'),
    proximo: motores.find((m) => m.situacao === 'nao') ?? null,
    aguardando: aguardandoRevisao(project),
  };
}

const INTENCOES_DA_SIMULACAO = [
  { id: 'bottleneck', padrao: /gargal|atras|pior squad|mais lent/ },
  { id: 'headcount', padrao: /profission|headcount|contrat|quantas pessoas|faltam pessoas|reforc/ },
  { id: 'freeze-delivery', padrao: /freez|17\/12|congel|quanto entreg|entregamos|ate a data/ },
  { id: 'mode-compare', padrao: /modalidade|fluxo continuo|semanas inteiras|comparar modo|compara os modos/ },
];

const IR_PARA_JORNADA = { rotulo: 'Ver a jornada', tipo: 'darklab', view: 'jornada-7-motores' };
const ABRIR_DELTA = { rotulo: 'Abrir o Delta completo', tipo: 'delta' };

function respostaDoProximoPasso(j) {
  if (!j)
    return {
      texto: 'Ainda não há projeto selecionado. O primeiro passo é criar o projeto e enviar as fontes no Contexto.',
      acoes: [{ rotulo: 'Ir para o Contexto', tipo: 'aba', aba: 'contexto' }],
    };
  if (!j.fontes)
    return {
      texto: `O projeto ${j.nome} ainda não tem fontes. Envie os documentos no Contexto para começar.`,
      acoes: [{ rotulo: 'Ir para o Contexto', tipo: 'aba', aba: 'contexto' }],
    };
  if (j.emAndamento)
    return { texto: 'Há uma execução em andamento. Assim que terminar, eu aviso para você revisar o resultado.', acoes: [IR_PARA_JORNADA] };
  if (j.produzidos)
    return {
      texto: `O próximo passo é revisar: ${j.produzidos} motor${j.produzidos === 1 ? '' : 'es'} com resultado aguardando aceite${j.proximo ? `. Depois, executar o Motor ${j.proximo.numero} · ${j.proximo.verbo}` : ''}.`,
      acoes: [IR_PARA_JORNADA],
    };
  if (j.proximo)
    return {
      texto: `O próximo passo é executar o Motor ${j.proximo.numero} · ${j.proximo.verbo}, que já tem os insumos que pede.`,
      acoes: [IR_PARA_JORNADA],
    };
  if (j.aceitos === 7)
    return {
      texto: 'Os 7 motores estão aceitos. O próximo passo é consolidar a ficha do projeto e seguir para o backlog.',
      acoes: [{ rotulo: 'Ir para Projetos', tipo: 'aba', aba: 'projetos' }],
    };
  return {
    texto: 'Os motores ainda têm dependência aberta. Consolide o Contexto para destravar o Motor 1.',
    acoes: [{ rotulo: 'Ir para o Contexto', tipo: 'aba', aba: 'contexto' }],
  };
}

/**
 * Resposta local (sem modelo). Devolve { texto, bullets?, acoes? }.
 * @param {{ texto: string, tab?: string, scenario?: object, result?: object, project?: object, catalog?: object, pending?: object }} ctx
 */
export function responderLocal({ texto, tab, scenario, result, project, catalog, pending }) {
  const n = normalizar(texto);
  if (!n) return null;
  const j = resumoDaJornada({ project, catalog, pending });

  if (/^(oi|ola|opa|bom dia|boa tarde|boa noite|e ai|hey|hello|hi)\b/.test(n) && n.length < 24) {
    return {
      texto: `Oi! Sou o Delta. Posso falar sobre esta página (${NOME_DA_ABA[tab] ?? 'a plataforma'}), a situação do projeto e a simulação das squads.`,
      sugestoes: sugestoesDaAba(tab),
    };
  }
  if (/quem (e|es) voce|o que voce faz|voce (e|eh) (um|uma)|mascote/.test(n)) {
    return {
      texto:
        'Sou a mascote do Delta: acompanho o que acontece nas páginas, respondo dúvidas rápidas e sugiro próximos passos. Eu não executo tarefas nem altero dados — isso continua com você.',
      acoes: [ABRIR_DELTA],
    };
  }
  if (/propost|balance|redistribu|otimiz|ajust(a|e|ar)\b|resolv|aplica|executa|roda(r)? (o|os) motor/.test(n)) {
    return {
      texto:
        'Isso eu não faço por aqui: não altero a simulação nem executo motores. O Delta completo prepara a proposta e você confirma antes de aplicar.',
      acoes: [ABRIR_DELTA],
    };
  }
  if (/revis|aceit|aprova|pendenc|pendent/.test(n)) {
    if (!j) return respostaDoProximoPasso(null);
    return j.aguardando
      ? {
          texto: `${j.aguardando} resultado${j.aguardando === 1 ? '' : 's'} do projeto ${j.nome} ${j.aguardando === 1 ? 'está' : 'estão'} aguardando revisão. ${j.aceitos} de 7 motores já foram aceitos.`,
          acoes: [IR_PARA_JORNADA],
        }
      : { texto: `Nada aguardando revisão no projeto ${j.nome}. ${j.aceitos} de 7 motores aceitos.`, acoes: [IR_PARA_JORNADA] };
  }
  if (/proximo passo|o que (eu )?fa(co|zer) agora|por onde|como comec|e agora|proxima etapa/.test(n)) return respostaDoProximoPasso(j);

  if (result && scenario) {
    const intencao = INTENCOES_DA_SIMULACAO.find((i) => i.padrao.test(n));
    if (intencao) {
      const insight = buildCopilotInsights(scenario, result).insights.find((i) => i.id === intencao.id);
      if (insight)
        return {
          texto: `${insight.title}. ${(insight.paragraphs ?? []).join(' ')}`,
          bullets: (insight.bullets ?? []).slice(0, 6),
          acoes: [{ rotulo: 'Ir para o cronograma', tipo: 'aba', aba: 'planejamento' }],
        };
    }
  }

  if (/projeto|resumo|status|situac|motor|jornada|andamento|onde estou|como esta/.test(n)) {
    if (!j) return respostaDoProximoPasso(null);
    return {
      texto: `${j.codigo} · ${j.nome} está em "${j.etapa}", com ${j.fontes} fonte${j.fontes === 1 ? '' : 's'}. Motores: ${j.aceitos} aceito${j.aceitos === 1 ? '' : 's'}, ${j.produzidos} aguardando aceite e ${7 - j.aceitos - j.produzidos} sem resultado.`,
      bullets: j.motores.map(
        (m) =>
          `M${m.numero} · ${m.verbo}: ${{ aceito: 'aceito', produzido: 'aguardando aceite', andamento: 'em execução', nao: 'pronto para executar', dependencia: 'dependência aberta' }[m.situacao]}`,
      ),
      acoes: [IR_PARA_JORNADA],
    };
  }
  if (/pagina|tela|aqui|ajuda|help|como (usar|funciona|uso)|pra que serve|para que serve|o que (e|eh) (isso|esta|essa)|nesta/.test(n)) {
    const dica = DICAS_DA_ABA[tab];
    return dica
      ? {
          texto: `Você está em ${NOME_DA_ABA[tab] ?? 'uma página da plataforma'}. ${dica.texto}`,
          acoes: dica.acoes.filter((a) => a.tipo !== 'chat' && a.tipo !== 'pergunta'),
        }
      : { texto: 'Posso explicar as páginas da plataforma, a situação do projeto e a simulação das squads.', sugestoes: sugestoesDaAba(tab) };
  }
  return {
    texto:
      'Essa eu ainda não sei responder por aqui. Posso falar do próximo passo, do que falta revisar, do resumo do projeto e da simulação das squads — ou você leva a pergunta ao Delta completo.',
    acoes: [ABRIR_DELTA],
    sugestoes: sugestoesDaAba(tab),
  };
}

/** Instruções e contexto enviados ao modelo B.Y.O.K. (quando há um ativo). */
export function montarPedidoAoModelo({ texto, historico = [], tab, scenario, result, project, catalog, pending }) {
  const j = resumoDaJornada({ project, catalog, pending });
  const linhas = [`Página atual: ${NOME_DA_ABA[tab] ?? tab ?? 'não informada'}.`];
  if (j) {
    linhas.push(`Projeto: ${j.codigo} · ${j.nome} — etapa "${j.etapa}", ${j.fontes} fonte(s).`);
    linhas.push(`Motores DarkLabs: ${j.motores.map((m) => `M${m.numero} ${m.verbo}=${m.situacao}`).join('; ')}.`);
    linhas.push(`Resultados aguardando revisão: ${j.aguardando}.`);
  } else linhas.push('Nenhum projeto selecionado.');
  if (result?.kpis && scenario) {
    const insights = buildCopilotInsights(scenario, result).insights;
    for (const i of insights.slice(0, 3)) linhas.push(`Simulação — ${i.title}: ${(i.paragraphs ?? []).join(' ')}`);
  }
  const sistema = [
    'Você é o Delta, assistente da plataforma Jornada Guiada, respondendo num mini chat preso à mascote.',
    'Responda em português do Brasil, em texto simples, com no máximo 4 frases curtas.',
    'Você não executa ações nem altera dados: quando o pedido exigir executar algo, diga em que página a pessoa faz isso.',
    'Use apenas o contexto fornecido; se a informação não estiver nele, diga que não tem esse dado.',
  ].join(' ');
  const conversa = historico
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'Pessoa' : 'Delta'}: ${m.texto}`)
    .join('\n');
  const usuario = `Contexto:\n${linhas.join('\n')}\n\n${conversa ? `Conversa até aqui:\n${conversa}\n\n` : ''}Pergunta: ${texto}`;
  return { sistema, usuario };
}
