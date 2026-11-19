/**
 * Diário de bordo › Personas sintéticas.
 *
 * Monta um grafo de conhecimento com todas as entidades identificadas (ID no padrão XXX-000) nos
 * resultados do projeto — atores, segmentos, stakeholders, dores, necessidades, sinais, insights,
 * jornadas, hipóteses, evidências, lacunas… — ligadas pelos campos de referência (`segmentIds`,
 * `painIds`, `supportingIds`, …). As personas sintéticas são os atores do Contexto, os segmentos do
 * Motor 2 e os stakeholders do Motor 1; o perfil de cada uma é a vizinhança dela no grafo.
 * Persona sintética é síntese de evidências: não substitui pesquisa com pessoas reais.
 */

const ID = /^[A-Z]{2,5}-\d{3,}$/;

/** Rótulo e cor de cada tipo de entidade, pelo prefixo do ID. */
export const TIPOS = Object.freeze({
  SEG: { rotulo: 'Segmento', grupo: 'persona' },
  ACT: { rotulo: 'Ator', grupo: 'persona' },
  STK: { rotulo: 'Stakeholder', grupo: 'persona' },
  PAIN: { rotulo: 'Dor', grupo: 'dor' },
  NEC: { rotulo: 'Necessidade', grupo: 'necessidade' },
  SIG: { rotulo: 'Sinal', grupo: 'sinal' },
  INS: { rotulo: 'Insight', grupo: 'insight' },
  PIL: { rotulo: 'Pílula de solução', grupo: 'solucao' },
  JRN: { rotulo: 'Jornada', grupo: 'jornada' },
  HIP: { rotulo: 'Hipótese', grupo: 'hipotese' },
  EVD: { rotulo: 'Evidência', grupo: 'evidencia' },
  GAP: { rotulo: 'Lacuna', grupo: 'lacuna' },
});
export const tipoDe = (id) => TIPOS[String(id).split('-')[0]] ?? { rotulo: String(id).split('-')[0], grupo: 'outro' };

export const PERSONA_TIPO = Object.freeze({ SEG: 'Segmento de clientes', ACT: 'Ator do processo', STK: 'Stakeholder do projeto' });

function rotuloDe(v) {
  return v.name ?? v.title ?? v.statement ?? v.description ?? v.question ?? v.condition ?? v.label ?? v.excerpt ?? v.quote ?? v.text ?? v.id;
}

/** Percorre os dados de um resultado e registra entidades e ligações. */
function coletar(valor, origem, nos, arestas) {
  if (Array.isArray(valor)) {
    for (const v of valor) coletar(v, origem, nos, arestas);
    return;
  }
  if (!valor || typeof valor !== 'object') return;
  if (typeof valor.id === 'string' && ID.test(valor.id)) {
    if (!nos.has(valor.id)) nos.set(valor.id, { id: valor.id, rotulo: String(rotuloDe(valor)), origem, dados: valor });
    for (const [k, v] of Object.entries(valor)) {
      if (k === 'id' || !/Ids?$/.test(k)) continue;
      for (const alvo of [].concat(v ?? [])) if (typeof alvo === 'string' && ID.test(alvo) && alvo !== valor.id) arestas.push([valor.id, alvo, k]);
    }
  }
  for (const v of Object.values(valor)) if (v && typeof v === 'object') coletar(v, origem, nos, arestas);
}

/**
 * Grafo a partir de envelopes: [{ origem: 'M2 · …', envelope }].
 * @returns {{ nos: Array, arestas: Array<[string,string]>, vizinhos: Map<string, Set<string>> }}
 */
export function montarGrafo(envelopes) {
  const nos = new Map();
  const brutas = [];
  for (const { origem, envelope } of envelopes) {
    coletar(envelope?.data ?? {}, origem, nos, brutas);
    coletar(envelope?.evidenceRefs ?? [], origem, nos, brutas);
    coletar(envelope?.gaps ?? [], origem, nos, brutas);
  }
  const vistas = new Set();
  const arestas = [];
  const vizinhos = new Map([...nos.keys()].map((id) => [id, new Set()]));
  for (const [a, b] of brutas) {
    if (!nos.has(a) || !nos.has(b)) continue;
    const k = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (vistas.has(k)) continue;
    vistas.add(k);
    arestas.push([a, b]);
    vizinhos.get(a).add(b);
    vizinhos.get(b).add(a);
  }
  const lista = [...nos.values()]
    .map((n) => ({ ...n, tipo: tipoDe(n.id), grau: vizinhos.get(n.id).size }))
    .sort((x, y) => x.id.localeCompare(y.id, 'pt-BR', { numeric: true }));
  return { nos: lista, arestas, vizinhos };
}

/** Entidades a até `saltos` ligações de distância (sem atravessar outras personas). */
export function vizinhanca(grafo, id, saltos = 2) {
  const visitados = new Map([[id, 0]]);
  let fronteira = [id];
  for (let s = 1; s <= saltos; s += 1) {
    const prox = [];
    for (const atual of fronteira) {
      for (const v of grafo.vizinhos.get(atual) ?? []) {
        if (visitados.has(v)) continue;
        visitados.set(v, s);
        if (tipoDe(v).grupo !== 'persona') prox.push(v);
      }
    }
    fronteira = prox;
  }
  return visitados;
}

/** Personas sintéticas: atores, segmentos e stakeholders, com o perfil montado da vizinhança no grafo. */
export function montarPersonas(grafo) {
  const porId = new Map(grafo.nos.map((n) => [n.id, n]));
  return grafo.nos
    .filter((n) => n.tipo.grupo === 'persona')
    .map((n) => {
      const viz = vizinhanca(grafo, n.id, 2);
      const doGrupo = (g) =>
        [...viz.keys()]
          .filter((id) => id !== n.id && tipoDe(id).grupo === g)
          .map((id) => porId.get(id))
          .filter(Boolean);
      const dores = doGrupo('dor');
      const necessidades = doGrupo('necessidade');
      const dados = n.dados ?? {};
      const prefixo = n.id.split('-')[0];
      const descricao = dados.description ?? (dados.role ? `${dados.role}${dados.expectation ? ` · espera ${dados.expectation}` : ''}` : '') ?? '';
      const sintese =
        dores.length || necessidades.length
          ? [
              dores[0] ? `O que mais pesa: ${dores[0].rotulo.replace(/\.$/, '')}.` : null,
              necessidades[0] ? `O que precisa: ${necessidades[0].rotulo.replace(/\.$/, '')}.` : null,
            ]
              .filter(Boolean)
              .join(' ')
          : dados.expectation
            ? `Expectativa registrada: ${dados.expectation}.`
            : 'Ainda sem dores ou necessidades ligadas a esta persona nos resultados.';
      return {
        id: n.id,
        nome: n.rotulo,
        tipo: PERSONA_TIPO[prefixo] ?? 'Persona',
        descricao,
        origem: n.origem,
        natureza: dados.natureza ?? null,
        sintese,
        dores,
        necessidades,
        sinais: doGrupo('sinal'),
        insights: doGrupo('insight'),
        solucoes: doGrupo('solucao'),
        jornadas: doGrupo('jornada'),
        hipoteses: doGrupo('hipotese'),
        evidencias: doGrupo('evidencia').length,
        lacunas: doGrupo('lacuna'),
        conexoes: viz.size - 1,
        vizinhanca: viz,
      };
    });
}

/** Número pseudoaleatório estável a partir de um texto (posições iniciais reproduzíveis). */
function semente(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i += 1) h = Math.imul(h ^ texto.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * Layout de forças simples e determinístico: repulsão entre todos os nós, molas nas ligações e
 * atração ao centro. Devolve { id: {x, y} } dentro de largura × altura.
 */
export function layoutForca(grafo, { largura = 1000, altura = 700, iteracoes = 260 } = {}) {
  const n = grafo.nos.length;
  if (!n) return {};
  const idx = new Map(grafo.nos.map((no, i) => [no.id, i]));
  const x = new Float64Array(n);
  const y = new Float64Array(n);
  grafo.nos.forEach((no, i) => {
    const a = semente(no.id) * Math.PI * 2;
    const r = 120 + semente(`${no.id}r`) * 220;
    x[i] = largura / 2 + Math.cos(a) * r;
    y[i] = altura / 2 + Math.sin(a) * r;
  });
  const ligs = grafo.arestas.map(([a, b]) => [idx.get(a), idx.get(b)]);
  const k = Math.sqrt((largura * altura) / n) * 0.62;
  const corte2 = (k * 4) ** 2;
  let temp = largura / 8;
  for (let it = 0; it < iteracoes; it += 1) {
    const dx = new Float64Array(n);
    const dy = new Float64Array(n);
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        let ex = x[i] - x[j];
        let ey = y[i] - y[j];
        let d2 = ex * ex + ey * ey;
        if (d2 < 0.01) {
          ex = 0.1;
          ey = 0.1;
          d2 = 0.02;
        }
        // Repulsão só entre vizinhos próximos: nós soltos não empurram o grafo para fora do quadro.
        if (d2 > corte2) continue;
        const f = (k * k) / d2;
        dx[i] += ex * f;
        dy[i] += ey * f;
        dx[j] -= ex * f;
        dy[j] -= ey * f;
      }
    }
    for (const [a, b] of ligs) {
      const ex = x[a] - x[b];
      const ey = y[a] - y[b];
      const d = Math.sqrt(ex * ex + ey * ey) || 0.1;
      const f = d / k;
      dx[a] -= ex * f;
      dy[a] -= ey * f;
      dx[b] += ex * f;
      dy[b] += ey * f;
    }
    for (let i = 0; i < n; i += 1) {
      dx[i] += (largura / 2 - x[i]) * 0.06;
      dy[i] += (altura / 2 - y[i]) * 0.06;
      const d = Math.sqrt(dx[i] * dx[i] + dy[i] * dy[i]) || 1;
      const passo = Math.min(d, temp);
      x[i] += (dx[i] / d) * passo;
      y[i] += (dy[i] / d) * passo;
    }
    temp *= 0.985;
  }
  // Encaixa no quadro com margem, usando os percentis 3–97 (um nó solto não encolhe o resto).
  const mx = 40;
  const faixa = (arr) => {
    const o = [...arr].sort((a, b) => a - b);
    const q = (p) => o[Math.min(o.length - 1, Math.max(0, Math.round(p * (o.length - 1))))];
    return n > 12 ? [q(0.03), q(0.97)] : [o[0], o[o.length - 1]];
  };
  const [minX, maxX] = faixa(x);
  const [minY, maxY] = faixa(y);
  const sx = (largura - 2 * mx) / Math.max(1, maxX - minX);
  const sy = (altura - 2 * mx) / Math.max(1, maxY - minY);
  const s = Math.min(sx, sy * 1.25);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const limita = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const pos = {};
  grafo.nos.forEach((no, i) => {
    pos[no.id] = {
      x: limita(largura / 2 + (x[i] - cx) * s, mx / 2, largura - mx / 2),
      y: limita(altura / 2 + (y[i] - cy) * Math.min(sy, s * 1.1), mx / 2, altura - mx / 2),
    };
  });
  return pos;
}

/** Envelopes do projeto (último resultado de cada capacidade) com um rótulo de origem legível. */
export function envelopesDoProjeto(project, catalog) {
  const lista = [];
  for (const [chave, revisoes] of Object.entries(project?.artifacts ?? {})) {
    const capId = chave.split('::')[0];
    const ultima = revisoes[revisoes.length - 1];
    if (!ultima) continue;
    lista.push({ origem: origemDe(catalog.byId.get(capId), ultima.revision), envelope: ultima.envelope });
  }
  return lista;
}

/** Envelopes de exemplo das especificações (Contexto e DarkLabs), para o exemplo ilustrativo. */
export function envelopesDeExemplo(catalog) {
  return [...(catalog.byPhase.contexto ?? []), ...(catalog.byPhase.darklab ?? [])]
    .filter((c) => c.example)
    .map((c) => ({ origem: `${origemDe(c, null)} (exemplo)`, envelope: c.example }));
}

function origemDe(cap, revisao) {
  if (!cap) return 'Resultado';
  const m = /^Motor\s+(\d+)/.exec(cap.title ?? '');
  const nome = m ? `M${m[1]}` : cap.phase === 'contexto' ? `Contexto ${cap.step ?? ''}`.trim() : (cap.title ?? cap.id);
  return revisao ? `${nome} · R${revisao}` : nome;
}
