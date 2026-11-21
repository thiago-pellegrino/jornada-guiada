/**
 * Conteúdo da tela DarkLabs › Vamos além?: a proposta de continuidade (DarkLabs Impulso), a prateleira
 * modular de ofertas e o time multidisciplinar Capgemini. É catálogo de ofertas — não traz dados de
 * nenhum projeto; o nome do projeto selecionado entra só nos textos de "aplicado a".
 */

/** Oferta já aplicada ao projeto atual (o protocolo em execução). */
export const OFERTA_ATUAL = 'business-case';

export const IMPULSO_ETAPAS = Object.freeze([
  {
    n: '01',
    titulo: 'Mapeamento de sinais',
    icone: 'target',
    itens: ['Tendências e cenários', 'Oportunidades de mercado', 'Frentes de interesse do negócio', 'Linha do tempo e priorização'],
  },
  {
    n: '02',
    titulo: 'Pílula de dores e conhecimento + processos de ideação',
    icone: 'signal',
    itens: ['Diagnóstico das dores', 'Síntese de conhecimento', 'Workshops e cocriação', 'Ideação e priorização de soluções'],
  },
  {
    n: '03',
    titulo: 'Aproximação de parceiros',
    icone: 'usersGroup',
    itens: ['Match com hyperscalers e parceiros estratégicos', 'Acesso a especialistas', 'Cocriação de soluções', 'Plano de ação conjunto'],
  },
  {
    n: '04',
    titulo: 'Provas de conceito',
    icone: 'flask',
    itens: ['Execução de PoCs', 'Testes em ambiente real', 'Validação de valor', 'Aprendizados e próximos passos'],
  },
]);

export const PARCEIROS = Object.freeze(['AWS', 'Microsoft', 'Google Cloud', 'Parceiros especializados']);

export const ATIVOS = Object.freeze([
  'Bases de dados e sinais de mercado',
  'Rede de parceiros e especialistas',
  'Estudos, benchmarks e conteúdos proprietários',
  'IA e analytics para insights',
  'Cenários e visões foresight',
]);

/** Prateleira de ofertas. `motores` liga cada oferta aos motores do DarkLabs que ela aprofunda. */
export const PRATELEIRA = Object.freeze([
  {
    id: 'impulso',
    nome: 'DarkLabs Impulso',
    frase: 'Da oportunidade à solução',
    prazo: 'Jornada acelerada',
    texto: 'Mapeamento de sinais, pílulas de solução, aproximação de parceiros e desenho da solução ideal para o negócio.',
    selo: 'Proposta de continuidade',
    cor: '#6c5ce7',
    icone: 'rocket',
    motores: [1, 2, 3],
  },
  {
    id: 'foresight',
    nome: 'DarkLabs Foresight',
    frase: 'Do hoje, para o futuro do seu negócio',
    prazo: 'Escopo modular',
    texto: 'Tendências, cenários, oportunidades futuras e backlog do futuro.',
    selo: 'Prateleira Capgemini',
    cor: '#2a95c8',
    icone: 'telescope',
    motores: [7],
  },
  {
    id: 'business-case',
    nome: 'Darklabs Business Case',
    frase: 'Da oportunidade ao business case',
    prazo: 'Referência de produto · 45 dias',
    texto:
      'Diagnóstico, imersão no negócio, dores e oportunidades, análise de mercado e construção do business case. A execução atual segue o cronograma e os status documentados do projeto.',
    selo: 'Prateleira Capgemini',
    cor: '#1f9d6b',
    icone: 'bars',
    motores: [1, 2, 3],
  },
  {
    id: 'product-innovation',
    nome: 'DarkLabs Product Innovation',
    frase: 'Da oportunidade ao protótipo validado',
    prazo: '60 dias',
    texto: 'Ideação e cocriação, desenho da experiência e serviço, protótipo validado e roadmap de implementação.',
    selo: 'Prateleira Capgemini',
    cor: '#a650cf',
    icone: 'penTool',
    motores: [3, 4],
  },
  {
    id: 'mvp',
    nome: 'DarkLabs MVP',
    frase: 'Do protótipo ao produto operacional',
    prazo: '6 meses',
    texto: 'Desenvolvimento, testes e validação real, instrumentação de métricas e plano de escalabilidade.',
    selo: 'Prateleira Capgemini',
    cor: '#d6336c',
    icone: 'cube',
    motores: [5, 6],
  },
  {
    id: 'evolution',
    nome: 'DarkLabs Evolution',
    frase: 'Evolução contínua baseada em dados e aprendizado',
    prazo: 'Recorrente',
    texto: 'Indicadores, experimentos, backlog do futuro e suporte para escala.',
    selo: 'Prateleira Capgemini',
    cor: '#5b6be0',
    icone: 'refresh',
    motores: [6, 7],
  },
]);

export const TIME = Object.freeze([
  {
    id: 'pmo',
    titulo: 'PMO',
    icone: 'shield',
    texto: 'Conecta estratégia e execução, garantindo alinhamento, governança, ritmo e entrega de valor em toda a jornada.',
    itens: ['Governança e priorização', 'Gestão de stakeholders', 'Orquestração de times', 'Acompanhamento de entregas e resultados'],
  },
  {
    id: 'product',
    titulo: 'Product Lead e Business Designer',
    icone: 'compass',
    texto: 'Lidera a descoberta, desenha soluções centradas no cliente e conecta oportunidades à estratégia do negócio.',
    itens: ['Visão de produto', 'Design de experiência e serviço', 'Validação de oportunidades', 'Roadmap e storytelling'],
  },
  {
    id: 'negocios',
    titulo: 'Especialista de Negócios',
    icone: 'target',
    texto: 'Traz conhecimento do setor, cliente e ecossistemas, identifica oportunidades e conecta estratégia e soluções.',
    itens: ['Contexto de mercado', 'Visão de cliente e jornada', 'Parceiros e ecossistemas', 'Requisitos regulatórios e operacionais'],
  },
  {
    id: 'areas',
    titulo: 'Especialistas de Áreas',
    icone: 'usersGroup',
    texto: 'Aplicam expertise técnica, criativa e analítica para desenhar, construir, validar e escalar com qualidade, segurança e eficiência.',
    itens: [
      'Inteligência Artificial',
      'Design de Produto e Serviço',
      'Research de Usuário e Mercado',
      'Data & Growth',
      'Arquitetura de Soluções',
      'SRE (Confiabilidade e Escala)',
    ],
  },
  {
    id: 'valuation',
    titulo: 'Especialista em Business Valuation',
    icone: 'bars',
    texto: 'Avalia potencial de valor, modela cenários e apoia priorização pelo retorno e impacto.',
    itens: ['Modelagem financeira', 'Análise de viabilidade e cenários', 'Mensuração de valor e ROI', 'Suporte à tomada de decisão'],
  },
]);

/** Texto da proposta montada na tela, pronto para colar num e-mail ou documento. */
export function resumoDaProposta({ projeto, ids }) {
  const ofertas = PRATELEIRA.filter((o) => ids.includes(o.id));
  if (!ofertas.length) return '';
  const linhas = ofertas.map((o) => `• ${o.nome} — ${o.frase} (${o.prazo}). ${o.texto}`);
  return [
    `Proposta de continuidade${projeto ? ` · ${projeto}` : ''}`,
    '',
    ...linhas,
    '',
    'Todas as ofertas são viabilizadas pela equipe multidisciplinar Capgemini e seus conhecimentos.',
    'Apresentação propositiva: não representa contratação, compromisso de execução ou garantia de sucesso.',
  ].join('\n');
}
