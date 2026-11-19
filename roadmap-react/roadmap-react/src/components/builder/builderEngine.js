/**
 * Motor do Delta Builder: gera uma tela (HTML autocontido) a partir de um pedido em linguagem natural
 * e do dossiê da jornada do projeto.
 *  - Com uma chave configurada no B.Y.O.K., chama o modelo escolhido direto do navegador, em streaming.
 *  - Sem chave, usa um gerador local de demonstração (mesmos dados, telas prontas), também em streaming.
 * A tela gerada é sempre exibida isolada (iframe sandbox + CSP sem rede): não acessa a internet nem a página.
 */
import { getProvider } from '../../settings/byokCatalog.js';
import { getSecret, loadSettings } from '../../settings/settingsStore.js';

export const SUGESTOES = Object.freeze([
  'Painel executivo do projeto com os principais indicadores',
  'Linha do tempo dos 7 motores do DarkLabs com a situação de cada um',
  'Capacidade das squads até o Freezing com gráfico de barras',
  'Mapa de lacunas e riscos da jornada, por impacto',
  'Matriz de rastreabilidade: etapas, entregáveis e revisões',
]);

const REGRAS = `Você é o Delta Builder, agente que cria telas de visualização para a Jornada Guiada (Capgemini · DarkLabs).
Gere UMA tela como um documento HTML completo e autocontido:
- Responda SOMENTE com o HTML, começando em <!DOCTYPE html>. Sem explicações, sem blocos de código markdown.
- Todo CSS e JS embutidos. Proibido usar recursos externos (CDNs, fontes, imagens remotas) e qualquer requisição de rede (fetch, XHR, WebSocket).
- Gráficos em SVG inline ou CSS. Ícones em SVG inline.
- Use EXCLUSIVAMENTE os dados do bloco DADOS. Não invente números, nomes ou datas; quando faltar dado, mostre "não gerado" ou "sem dados".
- Textos em português do Brasil. Layout responsivo, legível e acessível (contraste AA, títulos semânticos).
- Visual: fonte system-ui, fundo #f7f7f8, cartões brancos com borda #e3e6eb e cantos de 12–16px, texto #1f2a37,
  destaque em degradê linear(90deg, #215ad7, #5e6fe1, #a650cf). Situações: verde #1f9d6b (aceito/concluído),
  laranja #d8901a (produzido/pendente), azul #5b6be0 (em andamento), vermelho #d0342c (dependência/atraso), cinza #9aa3af (não iniciado).
- Comece pelo cabeçalho com o código e o nome do projeto e o título da tela.`;

export function montarPedido({ pedido, dossie, anterior = null }) {
  let texto = `PEDIDO DO USUÁRIO:\n${pedido}\n\nDADOS (JSON do projeto e da jornada):\n${JSON.stringify(dossie)}`;
  if (anterior) texto += `\n\nTELA ATUAL (HTML) — ajuste esta tela conforme o pedido, mantendo o que não foi pedido para mudar:\n${anterior.slice(0, 60000)}`;
  return { sistema: REGRAS, usuario: texto };
}

/** Provedor e modelo ativos no B.Y.O.K. com chave disponível nesta sessão (ou null). */
export function motorAtivo(settings = loadSettings()) {
  const id = settings.byok?.ativo;
  if (!id) return null;
  const provider = getProvider(id);
  const cfg = settings.byok.providers?.[id];
  if (!provider || !cfg?.model) return null;
  const modelo = provider.models.find((m) => m.id === cfg.model);
  const segredo = (campo) => getSecret(id, campo) || '';
  if (!segredo('apiKey')) return { id, provider, cfg, modelo, semChave: true };
  return { id, provider, cfg, modelo, segredo, semChave: false };
}

/** Remove cercas de markdown e qualquer texto antes do documento. */
export function extrairHtml(texto) {
  let t = String(texto ?? '').replace(/^\s*```(?:html)?\s*/i, '').replace(/```\s*$/i, '');
  const i = t.search(/<!doctype html|<html/i);
  if (i > 0) t = t.slice(i);
  return t;
}

const CSP =
  "default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'";

/** Garante que a tela não acesse a rede: injeta a CSP no <head> (ou cria um). */
export function blindar(html) {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${CSP}">`;
  const t = String(html ?? '');
  if (/<head[^>]*>/i.test(t)) return t.replace(/<head[^>]*>/i, (m) => `${m}${meta}`);
  if (/<html[^>]*>/i.test(t)) return t.replace(/<html[^>]*>/i, (m) => `${m}<head>${meta}</head>`);
  return `<!DOCTYPE html><html lang="pt-BR"><head>${meta}<meta charset="utf-8"></head><body>${t}</body></html>`;
}

// ───────────────────────────── provedores (streaming) ─────────────────────────────

async function lerSSE(resposta, aoEvento, signal) {
  const leitor = resposta.body.getReader();
  const dec = new TextDecoder();
  let resto = '';
  for (;;) {
    if (signal?.aborted) throw new DOMException('Cancelado', 'AbortError');
    const { value, done } = await leitor.read();
    if (done) break;
    resto += dec.decode(value, { stream: true });
    const linhas = resto.split(/\r?\n/);
    resto = linhas.pop() ?? '';
    for (const linha of linhas) {
      const l = linha.trim();
      if (!l.startsWith('data:')) continue;
      const dado = l.slice(5).trim();
      if (!dado || dado === '[DONE]') continue;
      try {
        aoEvento(JSON.parse(dado));
      } catch {
        /* linha parcial ou keep-alive */
      }
    }
  }
}

async function exigirOk(resposta) {
  if (resposta.ok) return;
  let detalhe = '';
  try {
    detalhe = (await resposta.text()).slice(0, 300);
  } catch {
    /* sem corpo */
  }
  throw new Error(`O provedor respondeu ${resposta.status}. ${detalhe}`.trim());
}

const semBarra = (u) => String(u ?? '').replace(/\/+$/, '');

async function chamarOpenAICompativel({ url, cabecalhos, modelo, sistema, usuario, onTexto, signal }) {
  const resposta = await fetch(url, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', ...cabecalhos },
    body: JSON.stringify({ model: modelo, stream: true, messages: [{ role: 'system', content: sistema }, { role: 'user', content: usuario }] }),
  });
  await exigirOk(resposta);
  await lerSSE(resposta, (ev) => {
    const t = ev?.choices?.[0]?.delta?.content;
    if (t) onTexto(t);
  }, signal);
}

async function chamarClaude({ base, chave, modelo, sistema, usuario, onTexto, signal }) {
  const resposta = await fetch(`${semBarra(base || 'https://api.anthropic.com')}/v1/messages`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': chave,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: modelo, max_tokens: 16000, stream: true, system: sistema, messages: [{ role: 'user', content: usuario }] }),
  });
  await exigirOk(resposta);
  await lerSSE(resposta, (ev) => {
    if (ev?.type === 'content_block_delta' && ev.delta?.type === 'text_delta') onTexto(ev.delta.text);
  }, signal);
}

async function chamarGemini({ base, chave, modelo, sistema, usuario, onTexto, signal }) {
  const url = `${semBarra(base || 'https://generativelanguage.googleapis.com/v1beta')}/models/${encodeURIComponent(modelo)}:streamGenerateContent?alt=sse`;
  const resposta = await fetch(url, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': chave },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: sistema }] }, contents: [{ role: 'user', parts: [{ text: usuario }] }] }),
  });
  await exigirOk(resposta);
  await lerSSE(resposta, (ev) => {
    for (const p of ev?.candidates?.[0]?.content?.parts ?? []) if (p.text) onTexto(p.text);
  }, signal);
}

/** Gera com o modelo do B.Y.O.K.; `onTexto` recebe cada trecho assim que chega. */
export async function gerarComModelo(motor, { sistema, usuario, onTexto, signal }) {
  const { id, cfg, segredo } = motor;
  const campos = cfg.fields ?? {};
  const chave = segredo('apiKey');
  const modelo = cfg.model;
  if (id === 'claude') return chamarClaude({ base: campos.baseUrl, chave, modelo, sistema, usuario, onTexto, signal });
  if (id === 'google') return chamarGemini({ base: campos.baseUrl, chave, modelo, sistema, usuario, onTexto, signal });
  if (id === 'openai' || id === 'grok') {
    const base = semBarra(campos.baseUrl || (id === 'grok' ? 'https://api.x.ai/v1' : 'https://api.openai.com/v1'));
    const cabecalhos = { Authorization: `Bearer ${chave}` };
    if (id === 'openai' && campos.organization) cabecalhos['OpenAI-Organization'] = campos.organization;
    if (id === 'openai' && campos.project) cabecalhos['OpenAI-Project'] = campos.project;
    return chamarOpenAICompativel({ url: `${base}/chat/completions`, cabecalhos, modelo, sistema, usuario, onTexto, signal });
  }
  if (id === 'copilot') {
    const endpoint = semBarra(campos.endpoint);
    const deployment = campos.deployment || modelo;
    const v1 = /\/openai\/v1$/.test(endpoint);
    const url = v1
      ? `${endpoint}/chat/completions`
      : `${endpoint}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=${encodeURIComponent(campos.apiVersion || '2025-04-01-preview')}`;
    return chamarOpenAICompativel({ url, cabecalhos: { 'api-key': chave }, modelo: deployment, sistema, usuario, onTexto, signal });
  }
  throw new Error('Provedor não suportado pelo Delta Builder.');
}

// ───────────────────────────── gerador local (demonstração) ─────────────────────────────

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const num = (v, casas = 0) => (Number.isFinite(v) ? v.toLocaleString('pt-BR', { maximumFractionDigits: casas, minimumFractionDigits: casas }) : '—');
const pct = (v) => (Number.isFinite(v) ? `${num(v * 100, 1)}%` : '—');
const COR = { 'executado e aceito': '#1f9d6b', 'aceite pendente': '#a650cf', produzido: '#d8901a', 'não iniciado': '#9aa3af' };

const BASE_CSS = `*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#f7f7f8;color:#1f2a37}
header{padding:22px 28px;background:linear-gradient(90deg,#215ad7,#5e6fe1,#a650cf);color:#fff}
header small{opacity:.85;letter-spacing:.08em;text-transform:uppercase;font-size:11px;font-weight:700}
header h1{margin:6px 0 2px;font-size:22px}header p{margin:0;opacity:.9;font-size:13px}
main{padding:22px 28px;display:grid;gap:16px}
.grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(170px,1fr))}
.card{background:#fff;border:1px solid #e3e6eb;border-radius:14px;padding:16px}
.card h2{margin:0 0 10px;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#5b6573}
.kpi b{display:block;font-size:26px}.kpi span{font-size:12px;color:#5b6573}
.chip{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;color:#fff}
table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:8px 10px;border-bottom:1px solid #eef0f3;text-align:left;vertical-align:top}th{font-size:11px;text-transform:uppercase;color:#5b6573}
.muted{color:#5b6573;font-size:12px}ul{margin:0;padding-left:18px}li{margin:4px 0}`;

function documento(d, titulo, pedido, corpo) {
  const p = d.projeto;
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titulo)}</title><style>${BASE_CSS}</style></head><body>
<header><small>Delta Builder · ${p ? `${esc(p.codigo)} · ${esc(p.nome)}` : 'Sem projeto selecionado'}</small><h1>${esc(titulo)}</h1><p>${esc(pedido)}</p></header>
<main>${corpo}<p class="muted">Gerado em ${esc(new Date(d.geradoEm).toLocaleString('pt-BR'))} com os dados processados da jornada${p ? ` · etapa ${esc(p.etapa)}` : ''}.</p></main></body></html>`;
}

function barras(itens, { max, unidade = '', limite = null, rotuloLimite = '' }) {
  const alto = itens.length * 34 + 30;
  const escala = (v) => (max ? (Math.max(0, v) / max) * 520 : 0);
  const linhas = itens
    .map((it, i) => {
      const y = 10 + i * 34;
      const cor = limite != null && it.valor > limite ? '#d0342c' : '#5e6fe1';
      return `<text x="0" y="${y + 15}" font-size="12" fill="#1f2a37">${esc(it.rotulo)}</text><rect x="130" y="${y}" width="${escala(it.valor).toFixed(1)}" height="20" rx="6" fill="${cor}"/><text x="${(136 + escala(it.valor)).toFixed(1)}" y="${y + 15}" font-size="12" fill="#5b6573">${num(it.valor, 1)}${unidade}</text>`;
    })
    .join('');
  const marca =
    limite != null
      ? `<line x1="${(130 + escala(limite)).toFixed(1)}" y1="0" x2="${(130 + escala(limite)).toFixed(1)}" y2="${alto - 18}" stroke="#d0342c" stroke-dasharray="4 4"/><text x="${(134 + escala(limite)).toFixed(1)}" y="${alto - 4}" font-size="11" fill="#d0342c">${esc(rotuloLimite)}</text>`
      : '';
  return `<svg viewBox="0 0 760 ${alto}" width="100%" role="img" aria-label="Gráfico de barras">${linhas}${marca}</svg>`;
}

function telaPainel(d, pedido) {
  const k = d.simulacao.indicadores;
  const motoresAceitos = d.darklab.motores.filter((m) => m.situacao === 'executado e aceito').length;
  const kpis = [
    ['Features', num(k.features)],
    ['Histórias', num(k.historias)],
    ['Concluído até o Freezing', pct(k.percentualConcluidoAteOFreezing)],
    ['Saldo de horas até o Freezing', `${num(k.saldoDeHorasAteOFreezing)} h`],
    ['Motores aceitos', `${motoresAceitos}/${d.darklab.motores.length}`],
    ['Contexto gerado', `${d.contexto.filter((c) => c.gerado).length}/${d.contexto.length}`],
  ]
    .map(([r, v]) => `<div class="card kpi"><b>${v}</b><span>${esc(r)}</span></div>`)
    .join('');
  const squads = d.simulacao.squads.map((s) => ({ rotulo: s.nome, valor: s.semanasNecessarias ?? 0 }));
  const max = Math.max(20, ...squads.map((s) => s.valor));
  const motores = d.darklab.motores
    .map((m) => `<li><span class="chip" style="background:${COR[m.situacao] ?? '#9aa3af'}">${esc(m.situacao)}</span> <b>${m.numero} · ${esc(m.nome)}</b></li>`)
    .join('');
  const lacunas = [...d.contexto, ...d.darklab.motores].flatMap((c) => c.lacunas.map((l) => ({ ...l, de: c.titulo }))).slice(0, 6);
  return documento(
    d,
    'Painel executivo do projeto',
    pedido,
    `<div class="grid">${kpis}</div>
<div class="grid" style="grid-template-columns:2fr 1fr"><section class="card"><h2>Semanas necessárias por squad</h2>${barras(squads, { max, unidade: ' sem', limite: 18, rotuloLimite: 'janela até o Freezing (18 sem.)' })}</section>
<section class="card"><h2>Motores do DarkLabs</h2><ul style="list-style:none;padding:0">${motores}</ul></section></div>
<section class="card"><h2>Lacunas abertas</h2>${lacunas.length ? `<ul>${lacunas.map((l) => `<li>${esc(l.pergunta)} <span class="muted">· ${esc(l.de)}${l.impacto ? ` · impacto ${esc(l.impacto)}` : ''}</span></li>`).join('')}</ul>` : '<p class="muted">Sem lacunas registradas nos resultados gerados.</p>'}</section>`,
  );
}

function telaMotores(d, pedido) {
  const itens = d.darklab.motores
    .map((m) => {
      const cor = COR[m.situacao] ?? '#9aa3af';
      return `<li style="display:grid;grid-template-columns:44px 1fr;gap:14px;margin:0 0 14px"><span style="width:44px;height:44px;border-radius:50%;border:2px solid ${cor};display:grid;place-items:center;font-weight:800;color:${cor};background:#fff">${m.numero}</span>
<div class="card"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><b>${esc(m.verbo)} · ${esc(m.nome)}</b><span class="chip" style="background:${cor}">${esc(m.situacao)}</span></div>
<p class="muted" style="margin:6px 0">${esc(m.faixa)}${m.revisao ? ` · ${m.revisao} · ${esc(new Date(m.geradoEm).toLocaleDateString('pt-BR'))}` : ''}</p><p style="margin:0;font-size:13px">${esc(m.resumo ?? 'Ainda não gerado.')}</p></div></li>`;
    })
    .join('');
  return documento(d, 'Linha do tempo dos 7 motores', pedido, `<section><ol style="list-style:none;padding:0;margin:0;position:relative">${itens}</ol></section>`);
}

function telaSquads(d, pedido) {
  const s = d.simulacao.squads;
  const max = Math.max(1, ...s.map((x) => x.demandaHoras ?? 0));
  const linhas = s
    .map((x) => `<tr><td><b>${esc(x.nome)}</b></td><td>${num(x.pessoas)}</td><td>${num(x.capacidadeSemanalHoras)} h</td><td>${num(x.historias)}</td><td>${num(x.demandaHoras)} h</td><td>${num(x.semanasNecessarias, 1)}</td><td>${num(x.pessoasRecomendadasParaOFreezing)}</td><td>${esc(x.terminoPrevisto ?? '—')}</td></tr>`)
    .join('');
  return documento(
    d,
    'Capacidade das squads até o Freezing',
    pedido,
    `<section class="card"><h2>Demanda em horas por squad</h2>${barras(
      s.map((x) => ({ rotulo: x.nome, valor: x.demandaHoras ?? 0 })),
      { max, unidade: ' h' },
    )}</section><section class="card"><h2>Detalhe por squad</h2><table><thead><tr><th>Squad</th><th>Pessoas</th><th>Capacidade/sem.</th><th>Histórias</th><th>Demanda</th><th>Semanas</th><th>Pessoas p/ Freezing</th><th>Término</th></tr></thead><tbody>${linhas}</tbody></table></section>`,
  );
}

function telaLacunas(d, pedido) {
  const todas = [...d.contexto, ...d.darklab.motores, ...(d.darklab.ficha ? [d.darklab.ficha] : [])].flatMap((c) => c.lacunas.map((l) => ({ ...l, de: `${c.passo} · ${c.titulo}` })));
  const norm = (v) => String(v ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const grupo = (l) => (['alto', 'medio', 'baixo'].includes(norm(l.impacto)) ? norm(l.impacto) : 'outro');
  const titulos = { alto: 'Impacto alto', medio: 'Impacto médio', baixo: 'Impacto baixo', outro: 'Impacto não informado' };
  const blocos = ['alto', 'medio', 'baixo', 'outro']
    .map((g) => {
      const itens = todas.filter((l) => grupo(l) === g);
      return itens.length ? `<section class="card"><h2>${titulos[g]}</h2><ul>${itens.map((l) => `<li>${esc(l.pergunta)} <span class="muted">· ${esc(l.de)}</span></li>`).join('')}</ul></section>` : '';
    })
    .join('');
  const atrasos = d.simulacao.squads.filter((s) => (s.semanasAlemDoFreezing ?? 0) > 0);
  return documento(
    d,
    'Mapa de lacunas e riscos',
    pedido,
    `${blocos || '<section class="card"><p class="muted">Nenhuma lacuna registrada nos resultados gerados até agora.</p></section>'}
<section class="card"><h2>Riscos de prazo (simulação)</h2>${atrasos.length ? `<ul>${atrasos.map((s) => `<li><b>${esc(s.nome)}</b> termina ${num(s.semanasAlemDoFreezing, 1)} semana(s) depois do Freezing; recomendadas ${num(s.pessoasRecomendadasParaOFreezing)} pessoa(s).</li>`).join('')}</ul>` : '<p class="muted">Todas as squads cabem na janela até o Freezing.</p>'}</section>`,
  );
}

function telaRastreabilidade(d, pedido) {
  const linhas = [...d.contexto, ...d.darklab.motores, ...(d.darklab.ficha ? [d.darklab.ficha] : []), ...d.backlog]
    .map((c) => `<tr><td><b>${esc(c.passo)}</b></td><td>${esc(c.titulo)}</td><td>${c.gerado ? `${c.revisao} · ${esc(c.estadoDeRevisao)}` : '<span class="muted">não gerado</span>'}</td><td>${c.entregaveis.length ? c.entregaveis.map((e) => esc(e.nome)).join('<br>') : '<span class="muted">—</span>'}</td><td>${c.evidencias || 0}</td><td>${c.lacunas.length}</td></tr>`)
    .join('');
  return documento(d, 'Matriz de rastreabilidade da jornada', pedido, `<section class="card"><table><thead><tr><th>Etapa</th><th>Resultado</th><th>Revisão</th><th>Entregáveis</th><th>Evidências</th><th>Lacunas</th></tr></thead><tbody>${linhas}</tbody></table></section>`);
}

/** Escolhe o modelo de tela local pelo assunto do pedido. */
export function telaLocal(dossie, pedido) {
  const t = String(pedido ?? '').toLowerCase();
  if (/motor|darklab|linha do tempo|timeline/.test(t)) return telaMotores(dossie, pedido);
  if (/squad|capacidade|freezing|equipe|pessoas|cronograma/.test(t)) return telaSquads(dossie, pedido);
  if (/lacuna|risco|gap|pend[eê]ncia/.test(t)) return telaLacunas(dossie, pedido);
  if (/rastreab|entreg[aá]ve|matriz|revis/.test(t)) return telaRastreabilidade(dossie, pedido);
  return telaPainel(dossie, pedido);
}

/** Gerador local: monta a tela e a entrega em trechos, como um modelo em streaming. */
export async function gerarLocal({ dossie, pedido, onTexto, signal, atraso = 14, trecho = 140 }) {
  const html = telaLocal(dossie, pedido);
  for (let i = 0; i < html.length; i += trecho) {
    if (signal?.aborted) throw new DOMException('Cancelado', 'AbortError');
    onTexto(html.slice(i, i + trecho));
    if (atraso) await new Promise((r) => setTimeout(r, atraso));
  }
}
