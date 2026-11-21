import { CAP, stageLabel } from '../../../domain/journey/journeyEngine.js';
import { ETAPAS_DO_PROTOCOLO } from './roadmapData.js';

/**
 * Diário de bordo › Todas as publicações. Monta a linha do tempo do projeto só com o que está gravado:
 * criação do projeto, fontes enviadas, notebooks, execuções (cada resultado gerado), aceites e mudanças
 * de etapa. A etapa do protocolo e o motor de cada publicação são classificação proposta pela
 * plataforma (vêm do motor que gerou o resultado), não algo declarado nas fontes.
 */

export const TIPOS = Object.freeze({
  projeto: { rotulo: 'Projeto', cor: '#5e6fe1' },
  fontes: { rotulo: 'Fontes', cor: '#2a95c8' },
  notebook: { rotulo: 'Notebooks', cor: '#3cc7b4' },
  execucao: { rotulo: 'Execuções', cor: '#a650cf' },
  aceite: { rotulo: 'Aceites', cor: '#1f9d6b' },
  etapa: { rotulo: 'Etapas', cor: '#e0a91a' },
});

/** Seis movimentos do discovery e o que conta como publicação de cada um. */
export const MOVIMENTOS = Object.freeze([
  {
    n: 1,
    titulo: 'Mobilizar e governar',
    texto: 'Preparação, kickoff, células, cronograma, ritos e controle de pendências.',
    tipos: ['projeto', 'notebook', 'etapa'],
    motores: [],
  },
  {
    n: 2,
    titulo: 'Assimilar o AS IS',
    texto: 'Ingestão de estudos, fatos, premissas, decisões, dependências e lacunas.',
    tipos: ['fontes'],
    fase: 'contexto',
    motores: [],
  },
  { n: 3, titulo: 'Escutar o negócio e o ecossistema', texto: 'Sessões com áreas de negócio, clientes, parceiros e segmentos.', motores: [1, 2] },
  {
    n: 4,
    titulo: 'Redesenhar produto e experiência',
    texto: 'Jornadas, pesquisa existente, workshop TO-BE, protótipos e requisitos de compreensão.',
    motores: [3, 4],
  },
  {
    n: 5,
    titulo: 'Convergir arquitetura, dados e IA',
    texto: 'AS-IS/TO-BE, estados, integrações, APIs, dados, guardrails e transição.',
    motores: [4, 5],
  },
  {
    n: 6,
    titulo: 'Preparar a decisão',
    texto: 'Business case, TCO, sourcing, roadmap, decision pack e condicionantes de experimentação.',
    motores: [6, 7],
    ficha: true,
  },
]);

const dia = (iso) => String(iso ?? '').slice(0, 10);

function motorDo(cap) {
  return cap?.phase === 'darklab' && cap.number >= 1 && cap.number <= 7 ? cap.number : null;
}

function nomeCurto(cap) {
  if (!cap) return 'Capacidade';
  if (cap.id === CAP.ficha) return 'Ficha do projeto';
  const m = /^Motor\s+\d+\s*·\s*([^—–-]+?)\s*[—–-]\s*(.+)$/.exec(cap.title ?? '');
  if (m) return `M${cap.number} · ${m[2].trim()}`;
  return cap.title ?? cap.id;
}

function etapasDosMotores(motores, contexto) {
  const n = new Set(contexto ? [1] : []);
  for (const e of ETAPAS_DO_PROTOCOLO) if (e.motores.some((m) => motores.includes(m))) n.add(e.n);
  return [...n].sort((a, b) => a - b);
}

/**
 * @param {{project, catalog}} p
 * @returns publicações em ordem cronológica, indicadores, movimentos e caminho de etapas.
 */
export function montarDiario({ project, catalog }) {
  const pubs = [];
  const add = (p) => pubs.push({ etapas: [], motores: [], itens: [], ...p });

  add({
    id: 'projeto',
    at: project.createdAt,
    tipo: 'projeto',
    titulo: 'Projeto criado no Contexto',
    descricao: `${project.code} · ${project.name}${project.description ? ` — ${project.description}` : ''}. Responsável: ${project.createdBy ?? 'Você'}.`,
    etapas: [1],
  });

  // Fontes enviadas no mesmo dia viram uma publicação.
  const fontesPorDia = new Map();
  for (const s of project.sources ?? []) {
    const k = dia(s.uploadedAt);
    if (!fontesPorDia.has(k)) fontesPorDia.set(k, []);
    fontesPorDia.get(k).push(s);
  }
  for (const [k, lista] of fontesPorDia) {
    add({
      id: `fontes-${k}`,
      at: lista.map((s) => s.uploadedAt).sort()[0],
      tipo: 'fontes',
      titulo: `${lista.length} fonte${lista.length === 1 ? '' : 's'} enviada${lista.length === 1 ? '' : 's'} ao Contexto`,
      descricao: lista.map((s) => s.name).join(', '),
      etapas: [1],
      itens: lista.map((s) => ({ titulo: `${s.id} · ${s.name}`, resumo: `Situação: ${s.status}.` })),
    });
  }

  for (const nb of project.notebooks ?? []) {
    add({
      id: `nb-${nb.id}`,
      at: nb.createdAt,
      tipo: 'notebook',
      titulo: `Notebook criado: ${nb.name}`,
      descricao: `${(nb.references ?? []).length} referência${(nb.references ?? []).length === 1 ? '' : 's'} · ${(nb.chats ?? []).length} conversa${(nb.chats ?? []).length === 1 ? '' : 's'} · ${nb.shared ? 'compartilhado' : 'privado'}.`,
      etapas: [1],
      itens: (nb.references ?? []).map((r) => ({ titulo: r.name, resumo: `Referência ${r.kind}.` })),
    });
  }

  // Resultados gerados: agrupados por execução (um Modo Turbo vira uma publicação com vários resultados).
  const porExecucao = new Map();
  const aceites = [];
  for (const [chave, revisoes] of Object.entries(project.artifacts ?? {})) {
    const [capId, scopeKey = 'projeto'] = chave.split('::');
    const cap = catalog.byId.get(capId);
    for (const r of revisoes) {
      const grupo = r.runId ?? `${capId}-${r.revision}`;
      if (!porExecucao.has(grupo)) porExecucao.set(grupo, []);
      porExecucao.get(grupo).push({ cap, capId, scopeKey, r });
      for (const log of r.reviewLog ?? []) if (log.reviewState === 'aceito') aceites.push({ cap, capId, scopeKey, r, log });
    }
  }
  const runs = new Map((project.runs ?? []).map((r) => [r.runId, r]));
  for (const [runId, lista] of porExecucao) {
    lista.sort((a, b) => String(a.r.generatedAt).localeCompare(String(b.r.generatedAt)));
    const run = runs.get(runId);
    const motores = [...new Set(lista.map((x) => motorDo(x.cap)).filter(Boolean))].sort((a, b) => a - b);
    const contexto = lista.some((x) => x.cap?.phase === 'contexto');
    const fase = contexto ? 'Contexto' : lista.some((x) => x.cap?.phase === 'darklab') ? 'DarkLabs' : 'Backlog';
    const unico = lista.length === 1 ? lista[0] : null;
    add({
      id: `exec-${runId}`,
      at: lista[0].r.generatedAt,
      tipo: 'execucao',
      titulo: unico
        ? `${nomeCurto(unico.cap)} · R${unico.r.revision}`
        : `${run?.kind === 'turbo' ? 'Modo Turbo' : 'Execução'} · ${fase}: ${lista.length} resultados gerados`,
      descricao: unico
        ? (unico.r.envelope?.summary ?? 'Resultado gerado.')
        : `${lista
            .slice(0, 4)
            .map((x) => nomeCurto(x.cap))
            .join(' · ')}${lista.length > 4 ? ` e mais ${lista.length - 4}` : ''}.`,
      etapas: etapasDosMotores(motores, contexto),
      motores,
      fase,
      itens: lista.map((x) => ({
        titulo: `${nomeCurto(x.cap)}${x.scopeKey !== 'projeto' ? ` (${x.scopeKey})` : ''} · R${x.r.revision}`,
        resumo: x.r.envelope?.summary ?? '',
        capId: x.capId,
        scopeKey: x.scopeKey,
        revisao: x.r.revision,
        lacunas: (x.r.envelope?.gaps ?? []).length,
        situacao: x.r.reviewState,
      })),
    });
  }

  for (const a of aceites) {
    const m = motorDo(a.cap);
    add({
      id: `aceite-${a.capId}-${a.scopeKey}-${a.r.revision}-${a.log.at}`,
      at: a.log.at,
      tipo: 'aceite',
      titulo: `Aceite registrado: ${nomeCurto(a.cap)} · R${a.r.revision}`,
      descricao: `Marcado como aceito por ${a.log.role}. O aceite confirma o resultado da plataforma; não comprova a conclusão dos entregáveis no projeto.`,
      etapas: etapasDosMotores(m ? [m] : [], a.cap?.phase === 'contexto'),
      motores: m ? [m] : [],
      itens: [{ titulo: nomeCurto(a.cap), resumo: a.r.envelope?.summary ?? '', capId: a.capId, scopeKey: a.scopeKey, revisao: a.r.revision }],
    });
  }

  for (const [i, h] of (project.stageHistory ?? []).entries()) {
    if (i === 0) continue;
    add({
      id: `etapa-${i}`,
      at: h.at,
      tipo: 'etapa',
      titulo: `Etapa do projeto: ${stageLabel(h.stage)}`,
      descricao: `Mudança registrada por ${h.cause}.`,
      etapas: [],
    });
  }

  pubs.sort((a, b) => String(a.at).localeCompare(String(b.at)) || a.id.localeCompare(b.id));

  const revisoes = Object.values(project.artifacts ?? {}).flat();
  const ultima = pubs.length ? pubs[pubs.length - 1].at : project.createdAt;
  const indicadores = {
    fontes: (project.sources ?? []).length,
    ultimaFonte:
      (project.sources ?? [])
        .map((s) => s.uploadedAt)
        .sort()
        .pop() ?? null,
    revisoes: revisoes.length,
    aceitas: revisoes.filter((r) => r.reviewState === 'aceito').length,
    posicao: ultima,
  };

  const movimentos = MOVIMENTOS.map((mv) => {
    const doMov = pubs.filter(
      (p) =>
        (mv.tipos ?? []).includes(p.tipo) ||
        (mv.fase && p.fase === 'Contexto') ||
        p.motores.some((n) => mv.motores.includes(n)) ||
        (mv.ficha && p.itens.some((it) => it.capId === CAP.ficha)),
    );
    return { ...mv, total: doMov.length, ultima: doMov.length ? doMov[doMov.length - 1].at : null };
  });

  const caminho = (project.stageHistory ?? []).map((h) => stageLabel(h.stage));

  return { publicacoes: pubs, indicadores, movimentos, caminho };
}
