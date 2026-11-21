/**
 * DarkLabs na Jornada Guiada: conteúdo da simulação (transcrito do protótipo navegável do DarkLabs).
 * Setores, perfis, gatilhos, papéis, produtos da prateleira, os 7 motores (métodos e saídas geradas)
 * e os cenários de demonstração. Os geradores recebem o contexto `c` montado em simulacao.js.
 */
import { brl, fmt, lc, num } from './formato.js';

export const ETAPAS=['descoberta','decisão','contratação/compra','primeiro uso','suporte','recorrência'];
export const PACKS={
 varejo:{nome:'Varejo',cliente:'consumidores',canais:['app','e-commerce','lojas físicas','WhatsApp'],dores:['baixa recorrência de compra após a primeira experiência','jornada omnichannel fragmentada entre app e loja','promoções genéricas e pouco relevantes','rupturas de estoque nos itens mais buscados','atrito no checkout e na entrega'],sinais:['crescimento do social commerce e do live shopping','retail media como nova linha de receita','expectativa de entrega em até 2 horas','assistentes de compra com IA generativa','pressão por rastreabilidade e ESG na cadeia'],pilulas:['Assistente de compras com IA no app','Fidelidade com ofertas preditivas personalizadas','Estoque inteligente com previsão de demanda','Retail media com dados primários','Checkout sem fila (scan & go)'],kpis:['taxa de recompra em 90 dias','ticket médio','NPS','conversão do app'],parceiros:['plataforma de CRM e CDP','operador logístico last-mile','provedor de modelos de IA'],sistemas:['ERP','CRM/CDP','plataforma de e-commerce','gestão de estoque'],modelo:'aumento de recorrência e ticket médio, com receita adicional de retail media',beneficio:'recomendações e ofertas no momento certo, sem atrito entre canais',riscoTec:'personalização em tempo real com dados de CRM'},
 financeiro:{nome:'Serviços financeiros',cliente:'clientes PJ e PF',canais:['app','internet banking','gerentes de relacionamento','parceiros'],dores:['onboarding digital lento e com muitas etapas','alto custo de atendimento humano','churn elevado em pequenas empresas','baixa adoção de produtos além da conta','fraudes em pagamentos instantâneos'],sinais:['Open Finance ampliando portabilidade e comparação','Pix automático e novas modalidades de pagamento','agentes de IA para gestão financeira','embedded finance em plataformas de parceiros','regulação de IA e de proteção de dados mais rígida'],pilulas:['Onboarding com biometria e IA em 5 minutos','Copiloto financeiro para PMEs','Crédito embutido em parceiros (embedded finance)','Motor antifraude em tempo real','Hub de investimentos por objetivos'],kpis:['conversão do onboarding','CAC','churn','receita por cliente'],parceiros:['bureau de crédito e KYC','plataformas de ERP para PMEs','provedor de modelos de IA'],sistemas:['core bancário','KYC/AML','CRM','motor de crédito'],modelo:'tarifas de serviço, margem de crédito e redução do custo de servir',beneficio:'abertura e gestão da conta em minutos, com orientação financeira contínua',riscoTec:'validação de identidade e score em tempo real'},
 saude:{nome:'Saúde',cliente:'pacientes',canais:['app do paciente','central de agendamento','unidades de atendimento','WhatsApp'],dores:['absenteísmo alto nas consultas agendadas','agendamento difícil e pouco flexível','informações clínicas fragmentadas','pouco acompanhamento de pacientes crônicos','sobrecarga das equipes assistenciais'],sinais:['telemedicina consolidada','IA de apoio à decisão clínica','saúde baseada em valor','monitoramento remoto com wearables','interoperabilidade e regulação de dados de saúde'],pilulas:['Agendamento inteligente com lembretes e reagendamento por IA','Programa de cuidado crônico com monitoramento remoto','Copiloto clínico para documentação','Painel preditivo de sinistralidade','Navegador digital do paciente'],kpis:['taxa de absenteísmo','NPS do paciente','tempo de espera','custo por atendimento'],parceiros:['healthtechs de telemonitoramento','operadoras de saúde','provedor de modelos de IA'],sistemas:['prontuário eletrônico','sistema de agendamento','faturamento','CRM do paciente'],modelo:'redução de ociosidade da agenda, de custo assistencial e de sinistralidade',beneficio:'acesso simples ao cuidado, com lembretes e acompanhamento proativo',riscoTec:'integração com o prontuário e privacidade de dados sensíveis'},
 outro:{nome:'Outro setor',cliente:'clientes',canais:['canais digitais','atendimento','força de vendas','parceiros'],dores:['processos manuais e lentos','baixa visibilidade sobre o cliente','experiência inconsistente entre canais','dificuldade de priorizar investimentos','pouco uso de dados nas decisões'],sinais:['automação com agentes de IA','modelos de negócio por assinatura','ecossistemas e plataformas abertas','exigências de ESG','novas regulações de dados e de IA'],pilulas:['Assistente de atendimento com IA','Plataforma de autosserviço','Precificação dinâmica orientada a dados','Serviço por assinatura','Hub de parceiros'],kpis:['receita recorrente','custo de servir','NPS','tempo de ciclo'],parceiros:['integradores de tecnologia','plataformas de dados','provedor de modelos de IA'],sistemas:['ERP','CRM','plataforma de dados','canais digitais'],modelo:'novas receitas recorrentes e redução de custo operacional',beneficio:'respostas mais rápidas e personalizadas',riscoTec:'qualidade e integração de dados'}
};
export const PERFIS=[
 'Empresas com desafios estratégicos ainda pouco estruturados, com áreas de negócio que precisam transformar oportunidades em iniciativas executáveis.',
 'Organizações sem capacidade interna suficiente de produto e discovery, que recebem demandas imaturas ou mal definidas.',
 'Labs que precisam aumentar a taxa de experimentação e desejam adotar IA sem perder contexto, governança e decisão humana.'];
export const GATILHOS={
 escalar:['Um negócio precisa escalar','Há uma ambição, mas o problema e o valor ainda não estão claros.'],
 evidencias:['Uma ideia precisa de evidências','É necessário testar interesse, experiência e viabilidade.'],
 destravar:['Uma iniciativa precisa destravar','Faltam alinhamento, prioridades ou condições de execução.'],
 evoluir:['Um produto precisa evoluir','O contexto mudou ou os resultados estão abaixo do esperado.']};
export const MAT={clareza:'Clareza do problema e do valor',evidencias:'Evidências disponíveis (dados, pesquisas)',capacidade:'Capacidade interna de produto e discovery',alinhamento:'Alinhamento entre negócio, produto e tecnologia',dados:'Maturidade em dados e IA'};
export const PROBLEMAS=[['Demandas avançam sem clareza','sobre a necessidade e o resultado esperado.'],['Negócio, produto, operação e tecnologia','sem conexão clara e baixa orquestração no delivery.'],['Equipes sobrecarregadas na sustentação','sem tempo para olhar para a evolução.'],['Inovação artesanal','e nada inteligente.'],['Excesso de esforço operacional','na produção de análises e artefatos, e baixa adesão da IA.'],['Rastreabilidade falha','entre investimento, aprendizado e geração de valor.']];
export const GANHOS=[['Decisão inteligente','gate'],['Velocidade de inovação','5'],['Produtos assertivos','3'],['Evolução contínua','7']];

export const ROLES=[
 {id:'pmo',nome:'PMO',icon:'org',rate:260,desc:'Conecta estratégia e execução, garantindo alinhamento, governança, ritmo e entrega de valor em toda a jornada.',itens:['Governança e priorização','Gestão de stakeholders','Orquestração de times','Acompanhamento de entregas e resultados']},
 {id:'product',nome:'Product Lead e Business Designer',icon:'1',rate:300,desc:'Lidera a descoberta, desenha soluções centradas no cliente e conecta oportunidades à estratégia do negócio.',itens:['Visão de produto','Design de experiência e serviço','Validação de oportunidades','Roadmap e storytelling']},
 {id:'negocios',nome:'Especialista de Negócios',icon:'bank',rate:320,desc:'Traz o conhecimento do setor, do cliente e dos ecossistemas, identificando oportunidades, viabilizando parcerias e conectando a estratégia do negócio às soluções.',itens:['Contexto de mercado','Visão de cliente e jornada','Parceiros e ecossistemas','Requisitos regulatórios e operacionais']},
 {id:'areas',nome:'Especialistas de Áreas',icon:'users',rate:280,desc:'Aplicam expertise técnica, criativa e analítica para desenhar, construir, validar e escalar soluções com qualidade, segurança e eficiência.',itens:[]},
 {id:'valuation',nome:'Especialista em Business Valuation',icon:'6',rate:330,desc:'Avalia o potencial de valor das oportunidades, modela cenários e apoia a priorização de iniciativas com base em retorno e impacto no negócio.',itens:['Modelagem financeira','Análise de viabilidade e cenários','Mensuração de valor e ROI','Suporte à tomada de decisão']}];
export const AREAS={ia:'Inteligência Artificial (IA)',design:'Design (Produto e Serviço)',research:'Researcher (Usuário e Mercado)',data:'Data & Growth',arq:'Arquitetura de Soluções',sre:'SRE (Confiabilidade e Escala)'};

export const PRODUTOS=[
 {id:'impulso',n:'01',nome:'DarkLabs Impulso',tag:'Da oportunidade à solução.',desc:'Jornada acelerada de mapeamento de sinais, criação de pílulas de solução, aproximação de parceiros e desenho da solução ideal para o seu negócio.',motores:[1,2,3],dias:21,est:true,icon:'chev',roles:{pmo:30,product:100,negocios:60,areas:50,valuation:20},areas:['research','ia']},
 {id:'foresight',n:'02',nome:'DarkLabs Foresight',tag:'Do hoje, para o futuro do seu negócio.',desc:'Mapeamento de tendências, análise de cenários e identificação de oportunidades futuras para orientar decisões estratégicas e construir um backlog do futuro.',motores:[2,7],dias:30,est:true,icon:'bino',roles:{pmo:30,product:50,negocios:80,areas:60,valuation:30},areas:['research','data']},
 {id:'discovery',n:'03',nome:'DarkLabs Discovery Sprint',tag:'Da oportunidade ao business case.',desc:'Diagnóstico, imersão no negócio, mapeamento de dores e oportunidades, análise de mercado e construção do business case.',motores:[1,2,3],dias:45,icon:'1',roles:{pmo:50,product:100,negocios:60,areas:80,valuation:60},areas:['research','ia','design']},
 {id:'innovation',n:'04',nome:'DarkLabs Product Innovation',tag:'Da oportunidade ao protótipo validado.',desc:'Ideação e cocriação de soluções, design de experiência e serviço, protótipo validado com usuários e roadmap de implementação.',motores:[3,4],dias:60,icon:'bulb',roles:{pmo:50,product:100,negocios:40,areas:100,valuation:40},areas:['design','research','arq']},
 {id:'mvp',n:'05',nome:'DarkLabs MVP',tag:'Do protótipo ao produto operacional.',desc:'Desenvolvimento do MVP, testes e validação em ambiente real, instrumentação de métricas e plano de escalabilidade.',motores:[5,6],dias:180,icon:'5',roles:{pmo:60,product:100,negocios:30,areas:100,valuation:30},areas:['ia','arq','sre','data']},
 {id:'evolution',n:'06',nome:'DarkLabs Evolution',tag:'Evolução contínua baseada em dados e aprendizado.',desc:'Acompanhamento de indicadores, novos experimentos, backlog do futuro e suporte para escala.',motores:[6,7],dias:90,rec:true,icon:'7',roles:{pmo:40,product:60,negocios:40,areas:60,valuation:30},areas:['data','sre','ia']},
 {id:'completa',n:'★',nome:'Jornada completa',tag:'Discovery Sprint → Product Innovation → MVP → Evolution.',desc:'Os 7 motores em sequência: do desafio ainda difuso ao produto operando, medido e evoluindo.',motores:[1,2,3,4,5,6,7],dias:375,icon:'layers',roles:{pmo:50,product:100,negocios:50,areas:70,valuation:40},areas:['ia','design','research','data','arq','sre']}];
export const DEF_D={1:15,2:15,3:20,4:35,5:120,6:60,7:30};
/** Premissa: o processo tradicional é 2,4× mais lento que o DarkLabs. */
export const BASE=2.4;

export const MOTORES=[
{n:1,nome:'Descoberta Estratégica',verbo:'Enquadrar',cor:'#3aa0ff',desc:'Entenda o desafio, o contexto e o valor da oportunidade.',agente:'Agente de Pesquisa',humanos:['Especialista de Negócios','Product Lead','PMO'],
 entrada:['Demandas, ambições, problemas e metas','Contexto do negócio','Documentos estratégicos','Stakeholders'],
 metodos:[
  ['Entrevistas com stakeholders','Gera roteiro, transcreve e sintetiza falas','Conduz as conversas e valida convergências',c=>`${c.n(6,10)} entrevistas com ${c.d.stakeholders||'lideranças'}. ${c.n(60,85)}% apontam "${c.prob}" como prioridade; há divergência sobre quem é dono do resultado.`],
  ['Análise documental','Lê planos, OKRs e relatórios e extrai metas e restrições','Confirma o que está vigente',c=>`${c.n(12,25)} documentos analisados. ${c.n(18,40)} metas e restrições extraídas; ${c.n(3,6)} conflitos de prioridade enviados ao PMO.`],
  ['Desk research','Varre fontes do setor e resume referências','Seleciona o que é relevante',c=>`${c.n(40,90)} fontes de ${lc(c.P.nome)} analisadas. Destaques: ${c.P.sinais[0]}; ${c.P.sinais[1]}.`],
  ['Benchmarking','Compara casos nacionais e globais','Avalia aderência ao contexto',c=>`${c.n(5,8)} casos comparados. Maior lacuna de ${c.E} frente aos líderes: ${c.P.dores[1]}.`],
  ['Workshops de enquadramento','Prepara o material e registra a síntese','Facilita e fecha o enquadramento',c=>`Workshop com ${c.n(8,14)} participantes. Pergunta-desafio acordada e critérios de sucesso ligados a ${c.meta}.`]],
 saidas:['Desafio enquadrado','Mapa inicial de oportunidades','Hipóteses de investigação','Stakeholders, restrições e resultados esperados','Critérios de sucesso'],
 out:[
  c=>`Pergunta-desafio:\nComo podemos ${c.amb} para ${c.pub}, resolvendo "${c.prob}"?\n\nResultado esperado: melhora mensurável em ${c.meta}.\nEscopo: ${c.P.canais.slice(0,2).join(' e ')}.\nFora de escopo nesta fase: substituição de sistemas legados.`,
  c=>c.P.dores.slice(0,4).map((x,i)=>`• Oportunidade ${i+1}: atacar ${x} (potencial ${['alto','alto','médio','médio'][i]})`).join('\n'),
  c=>c.H.map(h=>`• ${h.id} [${h.tipo}] ${h.txt}`).join('\n'),
  c=>`Stakeholders: ${c.d.stakeholders||'diretoria, áreas de negócio e TI'}\nRestrições: orçamento ${c.d.orcamento||'a definir'}; LGPD e requisitos regulatórios do setor; integração com sistemas existentes.\nResultados esperados: avanço em ${c.meta} e aprendizado documentado para decisão.`,
  c=>`• Indicador principal: ${c.meta}\n`+c.P.kpis.filter(k=>k!==c.meta).slice(0,3).map(k=>`• Indicador de apoio: ${k}`).join('\n')+`\n• Regra de governança: avançar nos gates exige confiança de 70% ou mais.`],
 crit:['Desafio reescrito e validado com stakeholders','Hipóteses de investigação explícitas','Critérios de sucesso acordados']},
{n:2,nome:'Escuta e Inteligência de Sinais',verbo:'Compreender',cor:'#22d3ee',desc:'Escute, analise sinais e construa uma visão integrada.',agente:'Agente de Sinais',humanos:['Researcher (Usuário e Mercado)','Product Lead','Especialista de Negócios'],
 entrada:['Dores e comportamentos','Jornadas de clientes e colaboradores','Percepções e feedbacks','Tendências e sinais externos'],
 metodos:[
  ['Entrevistas em profundidade','Recruta perfis, transcreve e agrupa temas','Conduz as entrevistas',c=>`${c.n(12,20)} entrevistas com ${c.pub}. ${c.n(55,80)}% relatam ${c.P.dores[0]}; ${c.n(30,50)}% citam ${c.P.dores[2]}.`],
  ['Observação contextual','Organiza registros e marca atritos','Observa o uso real',c=>`${c.n(3,6)} sessões em ${c.P.canais[c.n(0,2)]}. Atrito recorrente: ${c.P.dores[4]}.`],
  ['Análise de jornada','Cruza dados de uso com as etapas da jornada','Valida os momentos da verdade',c=>`Jornada mapeada em ${c.n(6,8)} etapas; a maior perda acontece na etapa de ${ETAPAS[c.n(1,4)]}.`],
  ['Social listening','Classifica menções e sentimento','Interpreta o contexto',c=>`${fmt(c.n(8000,40000))} menções analisadas, ${c.n(28,45)}% negativas. Tema dominante: ${c.P.dores[0]}.`],
  ['Horizon scanning','Cataloga sinais externos e tendências','Avalia relevância e prazo',c=>`${c.n(15,30)} sinais catalogados. Mais relevantes: ${c.P.sinais[0]}; ${c.P.sinais[3]}.`],
  ['Desk research','Consolida dados de mercado','Checa as fontes',c=>`O tema "${c.P.pilulas[0]}" cresce cerca de ${c.n(12,35)}% ao ano no setor (estimativa simulada).`]],
 saidas:['Mapa de dores, necessidades e sinais','Jornadas e padrões identificados','Insights fundamentados','Pílulas de solução priorizadas'],
 out:[
  c=>c.P.dores.map(x=>`• Dor: ${x} (intensidade ${c.n(5,9)}/10)`).join('\n')+'\n\n'+c.P.sinais.slice(0,4).map(x=>`• Sinal: ${x}`).join('\n'),
  c=>`Jornada atual: ${ETAPAS.join(' → ')}\n\n• Padrão 1: abandono concentrado na etapa de ${ETAPAS[c.n(1,3)]}\n• Padrão 2: ${c.pub} que usam mais de um canal geram ${c.n(20,45)}% mais valor no ano\n• Padrão 3: atendimento humano acionado em ${c.n(25,50)}% dos casos por falta de autosserviço`,
  c=>`• Insight 1: "${c.prob}" é sintoma; a causa raiz está em ${c.P.dores[1]}.\n• Insight 2: ${c.P.sinais[0]} abre espaço para diferenciação em 12 a 18 meses.\n• Insight 3: os dados que ${c.E} já tem permitem personalizar a experiência, mas não chegam à ponta.`,
  c=>[...c.S.pilulas].sort((a,b)=>b.score-a.score).map(p=>`• ${p.nome}: valor ${p.valor}/10 · esforço ${p.esforco}/10 · risco ${p.risco}/10 · score ${p.score}`).join('\n')],
 crit:['Dores sustentadas por dados de campo','Sinais externos considerados','Pílulas de solução priorizadas']},
{n:3,nome:'Estratégia e Visão de Produto',verbo:'Direcionar',cor:'#a855f7',desc:'Defina a estratégia e a visão de produto com base em evidências.',agente:'Agente de Modelagem',humanos:['Product Lead e Business Designer','Especialista em Business Valuation','Especialista de Negócios'],
 entrada:['Pílulas de solução','Evidências da pesquisa','Objetivos estratégicos','Capacidades, restrições e métricas do negócio'],
 metodos:[
  ['Workshops de cocriação','Gera variações de solução a partir das pílulas','Facilita e converge',c=>`${c.n(2,3)} workshops; ${c.n(20,35)} ideias geradas a partir de ${c.S.pilulas.length} pílulas de solução.`],
  ['Proposta de valor','Rascunha o canvas de proposta de valor','Refina a mensagem',c=>`Para ${c.pub}: "${c.pil}" entrega ${c.P.beneficio}.`],
  ['Modelagem de negócio','Simula receitas, custos e cenários','Valida as premissas financeiras',c=>`Modelo: ${c.P.modelo}. Valor potencial anual estimado: ${brl(c.S.bc.valor)}.`],
  ['Análise de viabilidade','Calcula desejabilidade, viabilidade e retorno','Decide os riscos aceitáveis',c=>`Desejabilidade ${c.n(70,90)}/100 · viabilidade técnica ${c.n(62,85)}/100 · payback estimado de ${c.payback()} meses.`],
  ['Priorização (valor, esforço, risco)','Pontua as pílulas na matriz','Confirma a escolha',c=>{const p=c.escolher();return`Matriz aplicada a ${c.S.pilulas.length} pílulas. Escolhida: "${p.nome}" (score ${p.score}).`}]],
 saidas:['Proposta de valor e modelo de negócio','Product Statement Pack','Visão do produto','Métricas e prioridades','Roadmap inicial','Mapa de capacidades, parceiros e dependências'],
 out:[
  c=>`Proposta de valor: para ${c.pub}, que enfrentam ${c.P.dores[0]}, "${c.pil}" oferece ${c.P.beneficio}. O diferencial é usar dados e IA de forma contínua, com decisão humana nos pontos críticos.\n\nModelo de negócio: ${c.P.modelo}.\nValor potencial anual: ${brl(c.S.bc.valor)} · investimento acumulado: ${brl(c.S.invest)} · payback: ${c.payback()} meses.`,
  c=>`Produto: ${c.pil}\nPara: ${c.pub}\nProblema: ${c.prob}\nSolução: ${c.P.beneficio}\nDiferencial: orquestração de dados, IA e jornada integrada\nMétrica-norte: ${c.meta}\nAntiobjetivo: não substituir sistemas centrais nesta fase`,
  c=>`Em 18 meses, "${c.pil}" será o caminho preferido de ${c.pub} para resolver ${c.P.dores[0]}, presente em ${c.P.canais.slice(0,3).join(', ')}.`,
  c=>`Métrica-norte: ${c.meta}\nMétricas de apoio: ${c.P.kpis.filter(k=>k!==c.meta).join(', ')}\n\nPrioridades:\n`+[...c.S.pilulas].sort((a,b)=>b.score-a.score).slice(0,3).map((p,i)=>`${i+1}. ${p.nome}${p.nome===c.pil?' (escolhida)':''}`).join('\n'),
  c=>`Agora (0 a 3 meses): protótipo e validação com usuários\nPróximo (3 a 9 meses): MVP em ambiente real no canal ${c.P.canais[0]}\nDepois (9 a 18 meses): escala para ${c.P.canais.slice(1,3).join(' e ')} e novos experimentos`,
  c=>`Capacidades internas: dados de clientes, operação de ${c.P.canais[0]}, time de negócio\nLacunas: ${AREAS.ia}, ${AREAS.design}\nParceiros: ${c.P.parceiros.join(', ')}\nDependências: integração com ${c.P.sistemas.slice(0,2).join(' e ')}; aprovação jurídica e LGPD`],
 crit:['Proposta de valor clara e diferenciada','Business case com retorno positivo','Roadmap e dependências mapeados']},
{n:4,nome:'Design e Ativos Digitais',verbo:'Materializar',cor:'#d16bff',desc:'Desenhe soluções e ativos digitais que gerem valor.',agente:'Agente de Design',humanos:['Design (Produto e Serviço)','Arquitetura de Soluções','Product Lead'],
 entrada:['Visão de produto','Product Statement','Jornadas atuais e requisitos','Regras de negócio','Ativos existentes'],
 metodos:[
  ['Design Thinking','Gera alternativas e cenários de uso','Conduz a ideação',c=>`${c.n(3,5)} conceitos explorados; o vencedor está alinhado a "${c.pil}".`],
  ['Service Design','Mapeia atores, canais e processos','Desenha o serviço ponta a ponta',c=>`Serviço desenhado para ${c.P.canais.slice(0,3).join(', ')}, com ${c.n(4,7)} atores envolvidos.`],
  ['Arquitetura de informação','Organiza conteúdos e navegação','Valida com usuários',c=>`${c.n(20,40)} itens de conteúdo organizados em ${c.n(4,6)} seções principais.`],
  ['Prototipação','Gera telas e fluxos navegáveis','Testa com usuários',c=>`${c.n(15,28)} telas prototipadas; teste com ${c.n(6,10)} usuários e ${c.n(78,92)}% de sucesso nas tarefas.`],
  ['Blueprint de serviço','Desenha frontstage, backstage e suporte','Valida com a operação',c=>`Blueprint com ${c.n(4,7)} pontos de falha tratados e ${c.n(2,4)} momentos assistidos por IA.`],
  ['Análise técnica e integrações','Lê APIs e sistemas e aponta riscos','Define a arquitetura',c=>`Integrações necessárias: ${c.P.sistemas.join(', ')}. Risco principal: ${c.P.riscoTec}.`],
  ['Curadoria de ativos digitais','Identifica componentes reaproveitáveis','Aprova a biblioteca',c=>`${c.n(8,15)} ativos existentes de ${c.E} reaproveitados; ${c.n(10,20)} novos ativos criados.`]],
 saidas:['Jornadas futuras, fluxos e protótipos','Blueprint do serviço','Visão técnica e integrações','Biblioteca de ativos digitais reutilizáveis','Backlog preparado para construção'],
 pre:c=>{c.S.num.ativos=c.n(26,44)},
 out:[
  c=>`Jornada futura (to be) em ${c.n(5,7)} etapas, com ${c.n(2,4)} momentos assistidos por IA.\nFluxos desenhados: ${c.n(8,14)} · telas prototipadas: ${c.n(15,28)}\nTeste com usuários: ${c.n(78,92)}% de sucesso nas tarefas.`,
  c=>`Frontstage: ${c.P.canais.slice(0,3).join(', ')}\nBackstage: orquestração de dados, regras de negócio e agentes de IA\nProcessos de suporte: atendimento, operação e governança de dados\nPontos de falha tratados: ${c.n(4,7)}`,
  c=>`Arquitetura: camada de experiência + APIs + plataforma de dados + serviços de IA\nIntegrações: ${c.P.sistemas.join(', ')}\nRiscos técnicos: ${c.P.riscoTec}; qualidade de dados; segurança.`,
  c=>`${c.S.num.ativos} ativos reutilizáveis: ${c.n(16,24)} componentes de interface, ${c.n(4,8)} prompts e agentes, ${c.n(3,6)} APIs documentadas.`,
  c=>`${c.n(4,6)} épicos e ${c.n(30,55)} histórias priorizadas.\nÉpico 1: experiência principal de "${c.pil}"\nÉpico 2: integração com ${c.P.sistemas[0]}\nÉpico 3: instrumentação e painel de ${c.meta}\nÉpico 4: governança, segurança e LGPD`],
 crit:['Protótipo testado com usuários','Viabilidade técnica confirmada','Backlog pronto para construção']},
{n:5,nome:'MVP e Validação',verbo:'Construir',cor:'#ff4fd8',desc:'Valide com MVPs, testes e evidências reais.',agente:'Agente de Engenharia',humanos:['Arquitetura de Soluções','Inteligência Artificial (IA)','SRE (Confiabilidade e Escala)','Data & Growth'],
 entrada:['Protótipos e backlog priorizado','Hipóteses críticas','Arquitetura e requisitos','Critérios de qualidade','Plano de validação'],
 metodos:[
  ['Prova de conceito (quando necessária)','Gera código de teste para o componente de maior risco','Avalia o resultado',c=>`PoC de ${c.P.riscoTec}: viável, com latência média de ${c.n(180,420)} ms.`],
  ['Desenvolvimento incremental','Gera código, testes e documentação','Revisa e integra',c=>`${c.n(6,10)} sprints; ${c.n(5,8)} funcionalidades essenciais entregues.`],
  ['Lean Startup','Monta ciclos de construir, medir e aprender','Decide o que cortar',c=>`${c.n(3,5)} ciclos curtos; ${c.n(2,4)} funcionalidades retiradas do escopo por falta de evidência.`],
  ['Testes de usabilidade','Analisa gravações e aponta atritos','Conduz os testes',c=>`Nota SUS ${c.n(72,86)}; ${c.n(4,9)} melhorias aplicadas antes da liberação.`],
  ['Instrumentação de dados','Define eventos e painéis','Valida as métricas',c=>`${c.n(20,40)} eventos rastreados; painel de ${c.meta} ativo.`],
  ['Validação em condições reais','Monitora uso e incidentes','Decide a ampliação da liberação',c=>`Liberado para ${c.n(5,15)}% da base no canal ${c.P.canais[0]}; ${c.n(0,2)} incidentes críticos.`]],
 saidas:['PoC, quando necessária','MVP funcional com escopo delimitado','Testes e evidências de qualidade','Instrumentação e plano de validação'],
 out:[
  c=>`PoC executada para o componente de maior risco (${c.P.riscoTec}). Resultado: viável com ajustes de performance.`,
  c=>`MVP de "${c.pil}" com ${c.n(5,8)} funcionalidades essenciais, construído em ${c.n(6,10)} sprints e liberado para ${c.n(5,15)}% da base no canal ${c.P.canais[0]}.`,
  c=>`Cobertura de testes: ${c.n(72,88)}% · incidentes críticos: ${c.n(0,2)} · nota de usabilidade SUS: ${c.n(72,86)} · revisão de segurança e LGPD aprovada.`,
  c=>`${c.n(20,40)} eventos rastreados; painéis de ${c.meta} e de adoção.\nPlano de validação: grupo controle × variante, amostra mínima por grupo, 4 hipóteses críticas (H1 a H4).`],
 crit:['MVP com escopo delimitado entregue','Qualidade e segurança evidenciadas','Instrumentação ativa para medir']},
{n:6,nome:'Experimentação e Impacto',verbo:'Comprovar',cor:'#6d7bff',desc:'Meça o impacto, ajuste e escale com segurança.',agente:'Agente de Análise',humanos:['Data & Growth','Especialista em Business Valuation','Researcher (Usuário e Mercado)'],
 entrada:['MVP em operação','Dados de uso e telemetria','Feedbacks de clientes e equipes','Indicadores e hipóteses','Outcomes definidos'],
 metodos:[
  ['Testes A/B','Calcula significância e lift','Interpreta o resultado',c=>{const a=c.ab();return`Controle ${num(c.S.exp.c)}% × variante ${num(c.S.exp.v)}% (${fmt(c.S.exp.n)} por grupo): lift ${a.lift.toFixed(1).replace('.',',')}%, p ${a.pv<0.001?'< 0,001':'= '+a.pv.toFixed(3).replace('.',',')}.`}],
  ['Análise de funil','Mapeia quedas entre etapas','Prioriza correções',c=>`Adoção de ${c.S.exp.ad}% em 90 dias; maior queda entre ativação e uso recorrente.`],
  ['Pesquisas de satisfação','Aplica e consolida a pesquisa','Analisa os comentários',c=>`CSAT ${c.S.exp.csat}, com ${c.n(300,900)} respostas.`],
  ['Análise comportamental','Segmenta usuários por padrão de uso','Valida os segmentos',c=>`${c.n(3,5)} segmentos; os mais engajados valem ${c.n(2,3)}× a média.`],
  ['Acompanhamento de indicadores','Atualiza painéis e alertas','Lê as tendências',c=>`Esforço operacional ${c.S.exp.ef}% menor; ${c.meta} acompanhado semanalmente.`],
  ['Entrevistas pós-uso','Sintetiza as entrevistas','Conduz as conversas',c=>`${c.n(8,14)} entrevistas; o pedido mais frequente é integração com ${c.P.canais[1]}.`]],
 saidas:['Resultados dos experimentos','Indicadores de adoção, eficiência, qualidade e satisfação','Hipóteses confirmadas, rejeitadas ou inconclusivas','Recomendação de ajustar, ampliar ou interromper'],
 out:[
  c=>{const a=c.ab();return`Teste A/B com ${fmt(c.S.exp.n)} usuários por grupo.\nConversão: controle ${num(c.S.exp.c)}% × variante ${num(c.S.exp.v)}% (lift ${a.lift.toFixed(1).replace('.',',')}%).\nSignificância: p ${a.pv<0.001?'< 0,001':'= '+a.pv.toFixed(3).replace('.',',')} (${a.pv<0.05?'estatisticamente significativo':'não significativo'}).`},
  c=>`Adoção em 90 dias: ${c.S.exp.ad}%\nEficiência: esforço operacional ${c.S.exp.ef}% menor\nQualidade: ${c.n(0,2)} incidentes críticos no período\nSatisfação: CSAT ${c.S.exp.csat}`,
  c=>c.S.hipoteses.map(h=>`• ${h.id} ${STH[h.status][0].toUpperCase()}: ${h.txt}${h.evid?' ('+h.evid+')':''}`).join('\n'),
  c=>{const r=c.rec6();return`${r.tit}. ${r.txt}`}],
 crit:['Experimentos com significância','Hipóteses classificadas','Recomendação suportada por indicadores']},
{n:7,nome:'Foresight e Evolução Contínua',verbo:'Antecipar',cor:'#9b7bff',desc:'Projete o futuro e evolua continuamente.',agente:'Agente de Foresight',humanos:['Especialista de Negócios','Product Lead e Business Designer','Data & Growth'],
 entrada:['Resultados dos experimentos','Aprendizados','Novos sinais e tendências','Mudanças de comportamento','Forças de transformação'],
 metodos:[
  ['Horizon scanning','Atualiza o radar de sinais','Prioriza o que monitorar',c=>`Radar atualizado com ${c.n(20,40)} sinais; ${c.n(4,7)} novos desde o último ciclo.`],
  ['Análise STEEP','Classifica forças sociais, tecnológicas, econômicas, ambientais e políticas','Valida os impactos',c=>`Força mais crítica: ${c.P.sinais[4]} (política e regulação).`],
  ['Construção de cenários','Gera cenários a partir de duas incertezas críticas','Nomeia e calibra os cenários',c=>`4 cenários construídos a partir de adoção de IA × intensidade regulatória.`],
  ['Backcasting','Traça caminhos do futuro desejado até hoje','Define os marcos',c=>`${c.n(3,5)} marcos definidos até o futuro desejado em 2030.`],
  ['Análise de implicações','Desdobra impactos em produto, operação e receita','Prioriza as respostas',c=>`${c.n(8,14)} implicações mapeadas; ${c.n(3,5)} viram experimentos.`],
  ['Monitoramento de sinais','Configura alertas e gatilhos de revisão','Define os donos dos gatilhos',c=>`${c.n(5,8)} gatilhos de revisão configurados, cada um com dono e limiar.`]],
 saidas:['Cenários e implicações para o negócio','Oportunidades e experimentos futuros','Roadmap revisado','Backlog do futuro com evidências, prioridades e gatilhos de revisão'],
 pre:c=>{const outras=[...c.S.pilulas].filter(p=>p.nome!==c.pil).sort((a,b)=>b.score-a.score);const pr=['Alta','Alta','Média','Média','Baixa','Baixa'];
   c.S.backlogFuturo=[...outras.slice(0,4).map(p=>({item:p.nome,ev:`score ${p.score} na priorização`})),{item:`Explorar ${c.P.sinais[1]}`,ev:'sinal forte no horizon scanning'},{item:`Preparar resposta a ${c.P.sinais[4]}`,ev:'força crítica na análise STEEP'}].map((x,i)=>({...x,pri:pr[i],gat:['queda de 10% na métrica-norte','novo concorrente no radar','mudança regulatória publicada','adoção acima de 40%','resultado do próximo A/B','revisão trimestral'][i]}));c.S.num.backlog=c.S.backlogFuturo.length},
 out:[
  c=>`Eixos: adoção de IA pelo mercado (lenta ↔ acelerada) × intensidade regulatória (baixa ↔ alta)\n\n• "Corrida aberta" (IA acelerada, regulação baixa): escalar "${c.pil}" rápido; risco de cópia.\n• "Confiança como produto" (IA acelerada, regulação alta): diferenciar por governança e transparência.\n• "Evolução gradual" (IA lenta, regulação baixa): foco em eficiência e custo.\n• "Freio de mão" (IA lenta, regulação alta): proteger a base e experimentar em nichos.\n\nImplicação central para ${c.E}: tratar capacidade de experimentação e governança de dados como ativos estratégicos.`,
  c=>c.S.backlogFuturo.slice(0,4).map(b=>`• ${b.item}: experimento de 6 a 8 semanas`).join('\n'),
  c=>{const r=c.rec6();return`Próximo trimestre: ${r.tit.toLowerCase()} "${c.pil}"\n6 a 12 meses: testar os 2 primeiros itens do backlog do futuro\n12 a 24 meses: preparar o portfólio para o cenário mais provável`},
  c=>c.S.backlogFuturo.map((b,i)=>`${i+1}. [${b.pri}] ${b.item}\n   Evidência: ${b.ev} · Gatilho de revisão: ${b.gat}`).join('\n')],
 crit:['Cenários e implicações claros','Backlog do futuro priorizado','Gatilhos de revisão definidos']}];
export const STH={aberta:['aberta',''],confirmada:['confirmada','ok'],rejeitada:['rejeitada','bad'],inconclusiva:['inconclusiva','warn']};
export const STM={bloqueado:'Aguardando',disponivel:'Disponível',andamento:'Em andamento',concluido:'Concluído',fora:'Fora do escopo',interrompido:'Interrompido',cancelado:'Cancelado'};
export const DEMOS={
 varejo:{empresa:'Aurora Varejo (fictícia)',setor:'varejo',porte:'grande',ambicao:'Aumentar a recorrência de compra no digital',problema:'clientes compram uma vez no app e não voltam',publico:'clientes do programa de fidelidade',meta:'taxa de recompra em 90 dias',orcamento:'R$ 2 a 4 mi',stakeholders:'Diretoria Digital, CRM, Operações de Loja e TI',perfil:1,gatilho:'escalar',longo:false,mat:{clareza:2,evidencias:2,capacidade:2,alinhamento:3,dados:2}},
 financeiro:{empresa:'Banco Horizonte (fictício)',setor:'financeiro',porte:'medio',ambicao:'Ganhar participação no segmento de pequenas empresas',problema:'o onboarding de PMEs leva dias e metade desiste',publico:'donos de pequenas empresas',meta:'conversão do onboarding',orcamento:'R$ 1 a 2 mi',stakeholders:'Diretoria PJ, Produtos, Risco, Compliance e TI',perfil:2,gatilho:'evidencias',longo:false,mat:{clareza:3,evidencias:2,capacidade:2,alinhamento:3,dados:3}},
 saude:{empresa:'Rede Vitalis Saúde (fictícia)',setor:'saude',porte:'grande',ambicao:'Reduzir o absenteísmo e melhorar a experiência do paciente',problema:'30% das consultas agendadas não acontecem',publico:'pacientes das clínicas ambulatoriais',meta:'taxa de absenteísmo',orcamento:'R$ 1,5 a 3 mi',stakeholders:'Diretoria Assistencial, Operações, Relacionamento e TI',perfil:1,gatilho:'destravar',longo:true,mat:{clareza:3,evidencias:3,capacidade:2,alinhamento:2,dados:2}}};
