/**
 * Backlog do Futuro no formato da planilha "Roadmap do Futuro" (Épico canônico → Feature → História):
 * resumo por superfície, roadmap por período, matriz de épicos, catálogo de features, lista de
 * histórias e dicionário. Puro (sem React): monta um modelo único a partir
 *
 *  - do que a jornada gerou para o projeto (Contexto → DarkLabs → ficha → épicos, features e
 *    histórias), com as regras de derivação descritas em DICIONARIO_DO_PROJETO; ou
 *  - do exemplo ilustrativo (planilha v3 convertida em src/data/backlogFuturoExemplo.json).
 */
import { CAP, backlogEpics, backlogFeatures, backlogStories, latestRevision } from '../journey/journeyEngine.js';

// ───────────────────────────── vocabulário ─────────────────────────────

export const TIPOS = Object.freeze({
  HISTÓRIA: { label: 'História', descricao: 'Comportamento percebido por usuário ou operador.' },
  ENABLER: { label: 'Enabler', descricao: 'Capacidade técnica ou operacional habilitadora.' },
  CONTROLE: { label: 'Controle', descricao: 'Controle de risco, segurança, auditoria ou governança.' },
  NFR: { label: 'NFR', descricao: 'Requisito não funcional.' },
  HIPÓTESE: { label: 'Hipótese', descricao: 'Oportunidade futura ainda não validada; não entra no backlog executável.' },
});

export const ORIGENS = Object.freeze({
  BASE_ATUAL: { label: 'Base atual', curto: 'Base' },
  NOVA_PROPOSTA: { label: 'Nova proposta', curto: 'Nova' },
});

export const MATURIDADES = Object.freeze({
  INVENTÁRIO_EXISTENTE: 'Inventário existente',
  CANDIDATA_DISCOVERY: 'Candidata a discovery',
  BLOQUEADA_MOD_D: 'Bloqueada (MOD-D)',
  DIFERIDA_P2: 'Diferida para P2',
});

/** Ondas do exemplo (DICIONARIO da planilha). No projeto, as ondas vêm da ficha (roadmapWaves). */
const ONDAS_DO_EXEMPLO = [
  { id: 'W0', nome: 'Fundação governada', descricao: 'Controles, dados, eventos, portfólio e workflows.' },
  { id: 'W1', nome: 'Core de participação', descricao: 'Aquisição, identidade, catálogo, suporte e relacionamento.' },
  { id: 'W2', nome: 'Geração de valor', descricao: 'Demandas, scouting, Value Cases, experimentos e resultados.' },
  { id: 'W3', nome: 'Expansão MOD-D', descricao: 'Permanece bloqueada até decisão de governança.' },
  { id: 'W4', nome: 'Inteligência assistiva', descricao: 'Diferida para P2; depende de dados e controles estabilizados.' },
];

/** Origem "NOVA_PROPOSTA_2026-09" da planilha e equivalentes viram a chave canônica NOVA_PROPOSTA. */
function origemCanonica(valor) {
  return String(valor).startsWith('NOVA_PROPOSTA') ? 'NOVA_PROPOSTA' : 'BASE_ATUAL';
}

// ───────────────────────────── exemplo ilustrativo ─────────────────────────────

/** Converte o JSON compacto da planilha no modelo normalizado. */
export function modeloDoExemplo(bruto) {
  const { codigos } = bruto;
  const ondaDoEpico = new Map(bruto.epicos.map((e) => [e.id, e.wave]));
  const featurePorId = new Map(bruto.features.map((f) => [f.id, f]));
  const historias = bruto.historias.map((h) => {
    const [id, legacyId, featureId, titulo, objetivo, descricao, valor, epcId, ini, tipo, origem, mat, horizonte, ready, authorized, obs] = h;
    const feature = featurePorId.get(featureId);
    return {
      id,
      legacyId,
      featureId,
      aba: feature?.aba ?? '',
      feature: feature?.nome ?? '',
      titulo,
      objetivo,
      descricao,
      valor: valor || objetivo,
      epcId,
      iniciativa: codigos.iniciativas[ini],
      tipo: codigos.tipos[tipo],
      origem: origemCanonica(codigos.origens[origem]),
      origemOriginal: codigos.origens[origem],
      maturidade: codigos.maturidades[mat],
      wave: ondaDoEpico.get(epcId),
      horizonte: String(horizonte),
      ready: ready === 1,
      authorized: authorized === 1,
      observacao: codigos.observacoes[obs],
    };
  });
  return {
    modo: 'exemplo',
    titulo: bruto.titulo,
    subtitulo: bruto.subtitulo,
    fonte: bruto.fonte,
    regraDeLeitura: bruto.regraDeLeitura,
    rotuloHorizonte: 'Ano',
    ondas: ONDAS_DO_EXEMPLO,
    superficies: bruto.superficies,
    epicos: bruto.epicos,
    features: bruto.features,
    historias,
    dicionario: bruto.dicionario,
    roadmap: bruto.roadmap,
  };
}

// ───────────────────────────── projeto (gerado pela jornada) ─────────────────────────────

const HORIZONTE_PARA_ONDA = { agora: 'W1', próximo: 'W2', proximo: 'W2', futuro: 'W3' };
const ROTULO_HORIZONTE = { agora: 'Agora', próximo: 'Próximo', proximo: 'Próximo', futuro: 'Futuro' };
const TIPO_DA_FEATURE = { funcional: 'HISTÓRIA', habilitadora: 'ENABLER', controle: 'CONTROLE' };

/** Índice id → nome das entidades do Contexto consolidado (lista plana ou agrupada por tipo). */
function nomesDoContexto(project) {
  const data = latestRevision(project, CAP.consolidar)?.envelope?.data;
  const mapa = new Map();
  const visitar = (v) => {
    if (Array.isArray(v)) v.forEach(visitar);
    else if (v && typeof v === 'object') {
      if (typeof v.id === 'string' && typeof v.name === 'string') mapa.set(v.id, v.name);
      Object.values(v).forEach(visitar);
    }
  };
  visitar(data?.entities);
  visitar(data?.actors);
  visitar(data?.systems);
  return mapa;
}

function textoDaHistoria(statement) {
  if (typeof statement === 'string') return statement;
  if (!statement || typeof statement !== 'object') return '';
  const { actor, need, benefit } = statement;
  const persona = typeof actor === 'string' && actor ? actor[0].toLowerCase() + actor.slice(1) : actor;
  return [persona && `Como ${persona}`, need && `quero ${need}`, benefit && `para ${benefit}`].filter(Boolean).join(', ') + '.';
}

const unicos = (lista) => [...new Set(lista.filter(Boolean))];
const texto = (v) => (typeof v === 'string' ? v : v && typeof v.texto === 'string' ? v.texto : '');

/**
 * Monta o modelo a partir do que a jornada gerou: ficha do projeto (ondas e sementes), épicos,
 * features e histórias do Backlog do Futuro. As colunas da planilha que a jornada não produz
 * diretamente são derivadas pelas regras de DICIONARIO_DO_PROJETO.
 */
export function modeloDoProjeto(project) {
  const ficha = latestRevision(project, CAP.ficha)?.envelope?.data ?? null;
  const nomes = nomesDoContexto(project);
  const ondasDaFicha = Array.isArray(ficha?.roadmapWaves) ? ficha.roadmapWaves : [];
  const sementes = Array.isArray(ficha?.backlogSeeds) ? ficha.backlogSeeds : [];

  const ondaDoFbk = new Map();
  for (const w of ondasDaFicha) for (const fbk of w.futureBacklogIds ?? []) ondaDoFbk.set(fbk, `W${w.wave}`);
  const sementePorFbk = new Map(sementes.map((s) => [s.futureBacklogId, s]));
  const sementePorTitulo = new Map(sementes.map((s) => [String(s.title).toLowerCase(), s]));

  const epicosGerados = backlogEpics(project);
  const epicos = [];
  const features = [];
  const historias = [];
  const superficies = new Map();

  epicosGerados.forEach((e) => {
    const fbks = (e.darklabRefs ?? []).filter((r) => String(r).startsWith('FBK-'));
    const semente = fbks.map((f) => sementePorFbk.get(f)).find(Boolean) ?? sementePorTitulo.get(String(e.title).toLowerCase()) ?? null;
    const wave = fbks.map((f) => ondaDoFbk.get(f)).find(Boolean) ?? HORIZONTE_PARA_ONDA[semente?.horizon] ?? 'W1';
    const horizonte = ROTULO_HORIZONTE[semente?.horizon] ?? 'Agora';
    const domId = (e.domainIds ?? [])[0] ?? (e.capabilityIds ?? [])[0] ?? null;
    const aba = domId ? (nomes.get(domId) ? `${nomes.get(domId)}` : domId) : 'Projeto';
    if (!superficies.has(aba)) superficies.set(aba, { id: aba, nome: aba, origemId: domId });

    epicos.push({
      id: e.id,
      nome: e.title,
      wave,
      observacao: e.scopeBoundary || e.summary || '',
      resumo: e.summary || '',
      natureza: e.natureza,
    });

    backlogFeatures(project, e.id).forEach((f) => {
      const tipoDaFeature = TIPO_DA_FEATURE[f.type] ?? 'HISTÓRIA';
      features.push({
        id: f.id,
        aba,
        nome: f.title,
        objetivo: texto(f.refinement?.expectedOutcomeContribution) || f.summary || '',
        descricao: f.summary || '',
        valor: f.refinement?.valueRationale || '',
        epcs: [e.id],
        tipo: f.type,
      });
      const serie = latestRevision(project, CAP.historias, f.id);
      const aceita = serie?.reviewState === 'aceito';
      backlogStories(project, f.id).forEach((s) => {
        const tipo = s.natureza === 'hipótese' ? 'HIPÓTESE' : tipoDaFeature;
        const documentado = s.natureza === 'documentado';
        historias.push({
          id: s.id,
          legacyId: (s.legacyIds ?? [])[0] ?? '',
          featureId: f.id,
          aba,
          feature: f.title,
          titulo: s.title,
          objetivo: s.refinement?.functionalObjective || '',
          descricao: textoDaHistoria(s.statement),
          valor: typeof s.statement === 'object' && s.statement?.benefit ? s.statement.benefit : '',
          epcId: e.id,
          iniciativa: (e.objectiveIds ?? [])[0] ?? '',
          tipo,
          origem: documentado ? 'BASE_ATUAL' : 'NOVA_PROPOSTA',
          origemOriginal: s.natureza,
          maturidade: documentado ? 'INVENTÁRIO_EXISTENTE' : wave === 'W4' ? 'DIFERIDA_P2' : 'CANDIDATA_DISCOVERY',
          wave,
          horizonte,
          // READY só com a série de histórias aceita na revisão humana; AUTHORIZED exige owner e
          // registro de decisão, que o protótipo ainda não registra.
          ready: aceita && tipo !== 'HIPÓTESE',
          authorized: false,
          observacao: s.rationale || '',
        });
      });
    });
  });

  const usadas = [...new Set(epicos.map((e) => e.wave))].sort();
  const ondas = usadas.map((id) => {
    const daFicha = ondasDaFicha.find((w) => `W${w.wave}` === id);
    return daFicha
      ? { id, nome: daFicha.title, descricao: `Horizonte ${ROTULO_HORIZONTE[daFicha.horizon] ?? daFicha.horizon ?? '—'} · ficha do projeto` }
      : { id, nome: `Onda ${id.slice(1)}`, descricao: 'Derivada do horizonte da semente do backlog na ficha.' };
  });

  const nomeDaOnda = new Map(ondas.map((o) => [o.id, o.nome]));
  const listaSuperficies = [...superficies.values()];
  const roadmap = epicos.length
    ? {
        titulo: `${project.name} · roadmap por onda`,
        colunas: ondas.map((o) => ({ id: o.id, label: `${o.id} · ${o.nome}`, grupo: o.descricao })),
        linhas: listaSuperficies.map((sup) => ({
          tribo: project.company?.name ?? project.code,
          squad: sup.nome,
          produto: unicos(features.filter((f) => f.aba === sup.id).map((f) => f.nome))
            .slice(0, 3)
            .join(' · '),
          inicio: '',
          foco: unicos(epicos.filter((e) => features.some((f) => f.aba === sup.id && f.epcs.includes(e.id))).map((e) => e.nome)).join(' · '),
          celulas: ondas.map((o) =>
            unicos(features.filter((f) => f.aba === sup.id && epicos.some((e) => e.wave === o.id && f.epcs.includes(e.id))).map((f) => f.nome)).join(' · '),
          ),
        })),
        principio: ficha?.productVision?.statement || ficha?.framing?.problemStatement || '',
        totais: [],
        anos: [
          {
            titulo: 'Ondas do projeto',
            trimestres: ondas.map((o) => {
              const doPeriodo = epicos.filter((e) => e.wave === o.id);
              return {
                periodo: `${o.id} · ${nomeDaOnda.get(o.id)}`,
                objetivo: unicos(doPeriodo.map((e) => e.resumo || e.nome)).join(' '),
                entregas: unicos(features.filter((f) => doPeriodo.some((e) => f.epcs.includes(e.id))).map((f) => f.nome)).join(', '),
                squads: [...new Set(features.filter((f) => doPeriodo.some((e) => f.epcs.includes(e.id))).map((f) => f.aba))].join(', '),
                retorno: '',
              };
            }),
          },
        ],
        semestres: [],
        leituras: [],
      }
    : null;

  return {
    modo: 'projeto',
    titulo: `${project.code} · ${project.name}`,
    subtitulo: project.company?.name ? `Empresa: ${project.company.name}` : '',
    fonte: 'Contexto → DarkLabs → ficha do projeto → Backlog do Futuro',
    regraDeLeitura: 'Cada história tem um épico principal; a feature herda o épico em que foi gerada. Onda, origem, tipo, maturidade e READY são derivados pelas regras do dicionário.',
    rotuloHorizonte: 'Horizonte',
    ondas,
    superficies: listaSuperficies,
    epicos,
    features,
    historias,
    dicionario: DICIONARIO_DO_PROJETO,
    roadmap,
    fichaPresente: Boolean(ficha),
  };
}

/** Regras de leitura do modo projeto: como cada coluna da planilha é obtida do que a jornada gerou. */
export const DICIONARIO_DO_PROJETO = Object.freeze([
  { conceito: 'Hierarquia', valor: 'ÉPICO → FEATURE → HISTÓRIA', definicao: 'Épicos gerados da ficha do projeto; Features por Épico; Histórias por Feature.', regra: 'Cada nível nasce preso à revisão do pai que consumiu.' },
  { conceito: 'EPC_ID', valor: 'EPC-NNN', definicao: 'Identificador do épico, único no projeto.', regra: 'Cada história tem um épico principal: o da sua feature.' },
  { conceito: 'FEATURE_ID', valor: 'EPC-NNN-FTR-NNN', definicao: 'Identificador da feature dentro do épico.', regra: 'O prefixo é sempre o ID do épico pai.' },
  { conceito: 'HISTORY_ID', valor: 'EPC-NNN-FTR-NNN-US-NNN', definicao: 'Identificador da história dentro da feature.', regra: 'IDs legados ficam em LEGACY_ITEM_ID.' },
  { conceito: 'SUPERFÍCIE', valor: 'Domínio do Contexto', definicao: 'Domínio (DOM) ou capacidade (CAP) ligado ao épico no Contexto consolidado.', regra: 'Sem domínio ligado, a superfície é "Projeto".' },
  { conceito: 'ONDA', valor: 'W1, W2…', definicao: 'Onda da ficha (roadmapWaves) que contém o item do backlog do futuro (FBK) do épico.', regra: 'Sem onda na ficha: horizonte da semente (agora → W1, próximo → W2, futuro → W3).' },
  { conceito: 'HORIZONTE', valor: 'Agora / Próximo / Futuro', definicao: 'Horizonte da semente do backlog na ficha do projeto.', regra: 'Sem semente ligada, o horizonte é "Agora".' },
  { conceito: 'INICIATIVA', valor: 'OBJ-NNN', definicao: 'Primeiro objetivo do Contexto ligado ao épico.', regra: 'Vazio quando o épico não cita objetivos.' },
  { conceito: 'TIPO', valor: 'HISTÓRIA / ENABLER / CONTROLE / HIPÓTESE', definicao: 'Tipo da feature: funcional → HISTÓRIA, habilitadora → ENABLER, controle → CONTROLE.', regra: 'História com natureza "hipótese" vira HIPÓTESE e não entra no backlog executável.' },
  { conceito: 'ORIGEM', valor: 'BASE_ATUAL / NOVA_PROPOSTA', definicao: 'Natureza da história: documentado nas fontes → BASE_ATUAL; proposta, inferido ou hipótese → NOVA_PROPOSTA.', regra: 'Nova proposta deve passar por Discovery.' },
  { conceito: 'MATURIDADE', valor: 'INVENTÁRIO / CANDIDATA / DIFERIDA', definicao: 'Base atual → inventário existente; nova proposta → candidata a discovery; onda W4 → diferida para P2.', regra: 'Muda conforme a origem e a onda.' },
  { conceito: 'READY', valor: 'TRUE / FALSE', definicao: 'TRUE quando a série de histórias da feature está "aceito" na revisão humana.', regra: 'Hipótese nunca fica READY.' },
  { conceito: 'AUTHORIZED', valor: 'FALSE', definicao: 'Autorização formal para execução.', regra: 'Exige owner e registro de decisão; o protótipo ainda não registra decisões, então fica FALSE.' },
]);

// ───────────────────────────── leituras do modelo ─────────────────────────────

const pct = (parte, todo) => (todo ? parte / todo : 0);

/** Totais do RESUMO: histórias, features, épicos, base, novas e READY. */
export function indicadores(modelo) {
  const h = modelo.historias;
  return {
    historias: h.length,
    features: modelo.features.length,
    epicos: modelo.epicos.length,
    base: h.filter((x) => x.origem === 'BASE_ATUAL').length,
    novas: h.filter((x) => x.origem === 'NOVA_PROPOSTA').length,
    ready: h.filter((x) => x.ready).length,
    authorized: h.filter((x) => x.authorized).length,
  };
}

/** Tabela "por aba/superfície" do RESUMO. */
export function porSuperficie(modelo) {
  const total = modelo.historias.length;
  return modelo.superficies.map((s) => {
    const hs = modelo.historias.filter((x) => x.aba === s.id);
    return {
      ...s,
      features: modelo.features.filter((f) => f.aba === s.id).length,
      historias: hs.length,
      base: hs.filter((x) => x.origem === 'BASE_ATUAL').length,
      novas: hs.filter((x) => x.origem === 'NOVA_PROPOSTA').length,
      pct: pct(hs.length, total),
    };
  });
}

/** MATRIZ EPC: por épico, features relacionadas, histórias base/novas/total e READY. */
export function matrizDeEpicos(modelo) {
  return modelo.epicos.map((e) => {
    const hs = modelo.historias.filter((x) => x.epcId === e.id);
    return {
      ...e,
      features: modelo.features.filter((f) => f.epcs.includes(e.id)).length,
      base: hs.filter((x) => x.origem === 'BASE_ATUAL').length,
      novas: hs.filter((x) => x.origem === 'NOVA_PROPOSTA').length,
      total: hs.length,
      ready: hs.filter((x) => x.ready).length,
    };
  });
}

/** Cruzamento épico × superfície (quantidade de histórias). */
export function cruzamentoEpicoSuperficie(modelo) {
  const mapa = new Map();
  for (const h of modelo.historias) {
    const k = `${h.epcId}|${h.aba}`;
    mapa.set(k, (mapa.get(k) ?? 0) + 1);
  }
  let max = 0;
  for (const v of mapa.values()) max = Math.max(max, v);
  return { valor: (epcId, aba) => mapa.get(`${epcId}|${aba}`) ?? 0, max };
}

/** CATÁLOGO FEATURES: contagens de histórias por feature. */
export function catalogoDeFeatures(modelo) {
  const porFeature = new Map();
  for (const h of modelo.historias) {
    const c = porFeature.get(h.featureId) ?? { historias: 0, base: 0, novas: 0, ready: 0, authorized: 0 };
    c.historias += 1;
    if (h.origem === 'BASE_ATUAL') c.base += 1;
    else c.novas += 1;
    if (h.ready) c.ready += 1;
    if (h.authorized) c.authorized += 1;
    porFeature.set(h.featureId, c);
  }
  return modelo.features.map((f) => ({ ...f, ...(porFeature.get(f.id) ?? { historias: 0, base: 0, novas: 0, ready: 0, authorized: 0 }) }));
}

/** Distribuição de uma coluna das histórias (tipo, origem, maturidade, onda, horizonte). */
export function distribuicao(modelo, campo) {
  const mapa = new Map();
  for (const h of modelo.historias) mapa.set(h[campo], (mapa.get(h[campo]) ?? 0) + 1);
  return [...mapa.entries()].map(([valor, quantidade]) => ({ valor, quantidade })).sort((a, b) => b.quantidade - a.quantidade);
}

function semAcento(t) {
  return String(t ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export const FILTROS_VAZIOS = Object.freeze({ busca: '', aba: '', epcId: '', featureId: '', wave: '', tipo: '', origem: '', maturidade: '', horizonte: '', ready: '' });

/** ROADMAP MASTER filtrado: todos os filtros combinam (E); a busca olha IDs, títulos e textos. */
export function filtrarHistorias(historias, filtros = FILTROS_VAZIOS) {
  const q = semAcento(filtros.busca).trim();
  return historias.filter((h) => {
    if (filtros.aba && h.aba !== filtros.aba) return false;
    if (filtros.epcId && h.epcId !== filtros.epcId) return false;
    if (filtros.featureId && h.featureId !== filtros.featureId) return false;
    if (filtros.wave && h.wave !== filtros.wave) return false;
    if (filtros.tipo && h.tipo !== filtros.tipo) return false;
    if (filtros.origem && h.origem !== filtros.origem) return false;
    if (filtros.maturidade && h.maturidade !== filtros.maturidade) return false;
    if (filtros.horizonte && h.horizonte !== filtros.horizonte) return false;
    if (filtros.ready === 'sim' && !h.ready) return false;
    if (filtros.ready === 'nao' && h.ready) return false;
    if (!q) return true;
    return semAcento(`${h.id} ${h.legacyId} ${h.featureId} ${h.titulo} ${h.feature} ${h.objetivo} ${h.descricao}`).includes(q);
  });
}

/** Catálogo filtrado por busca, superfície e épico. */
export function filtrarFeatures(features, { busca = '', aba = '', epcId = '' } = {}) {
  const q = semAcento(busca).trim();
  return features.filter((f) => {
    if (aba && f.aba !== aba) return false;
    if (epcId && !f.epcs.includes(epcId)) return false;
    if (!q) return true;
    return semAcento(`${f.id} ${f.nome} ${f.objetivo} ${f.descricao}`).includes(q);
  });
}
