import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runSimulation } from '../src/domain/simulationEngine.js';
import { WEEKS, createInitialScenario } from '../src/data/initialRoadmapData.js';
import { montarDossie, resumoDoDossie } from '../src/components/builder/builderData.js';
import { blindar, extrairHtml, gerarLocal, montarPedido, telaLocal } from '../src/components/builder/builderEngine.js';

const scenario = createInitialScenario();
const result = runSimulation(scenario, WEEKS);
const catalogo = { byPhase: { contexto: [], darklab: [] } };

test('dossiê sem projeto traz a simulação e nenhuma etapa da jornada', () => {
  const d = montarDossie({ project: null, catalog: catalogo, result, scenario, agora: '2026-11-19T12:00:00Z' });
  assert.equal(d.projeto, null);
  assert.equal(d.simulacao.squads.length, result.squads.length);
  assert.equal(d.simulacao.indicadores.features, result.kpis.totalFeatures);
  const r = resumoDoDossie(d);
  assert.equal(r.motores, '0/0');
  assert.equal(r.ficha, 'não gerada');
});

test('gerador local escolhe a tela pelo assunto do pedido', () => {
  const d = montarDossie({ project: null, catalog: catalogo, result, scenario, agora: '2026-11-19T12:00:00Z' });
  assert.match(telaLocal(d, 'Capacidade das squads até o Freezing'), /Capacidade das squads/);
  assert.match(telaLocal(d, 'linha do tempo dos motores'), /Linha do tempo dos 7 motores/);
  assert.match(telaLocal(d, 'mapa de lacunas e riscos'), /Mapa de lacunas e riscos/);
  assert.match(telaLocal(d, 'qualquer coisa'), /Painel executivo/);
});

test('gerador local entrega a tela em trechos que somam o documento inteiro', async () => {
  const d = montarDossie({ project: null, catalog: catalogo, result, scenario, agora: '2026-11-19T12:00:00Z' });
  let trechos = 0;
  let html = '';
  await gerarLocal({ dossie: d, pedido: 'painel', atraso: 0, onTexto: (t) => { trechos += 1; html += t; } });
  assert.ok(trechos > 5);
  assert.equal(html, telaLocal(d, 'painel'));
});

test('extrai o HTML de respostas com cercas de markdown ou texto antes do documento', () => {
  assert.equal(extrairHtml('```html\n<!DOCTYPE html><html></html>\n```').trim(), '<!DOCTYPE html><html></html>');
  assert.equal(extrairHtml('Aqui está: <!DOCTYPE html><html></html>'), '<!DOCTYPE html><html></html>');
});

test('a tela gerada é blindada sem acesso à rede', () => {
  const html = blindar('<!DOCTYPE html><html><head><title>x</title></head><body><script>fetch("https://x")</script></body></html>');
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /connect-src 'none'/);
  assert.match(blindar('<div>sem head</div>'), /<head><meta http-equiv="Content-Security-Policy"/);
});

test('o pedido ao modelo leva os dados e, quando há, a tela atual para ajuste', () => {
  const d = montarDossie({ project: null, catalog: catalogo, result, scenario, agora: '2026-11-19T12:00:00Z' });
  const p = montarPedido({ pedido: 'painel', dossie: d, anterior: '<html>antes</html>' });
  assert.match(p.sistema, /HTML/);
  assert.match(p.usuario, /DADOS/);
  assert.match(p.usuario, /TELA ATUAL/);
});

import { gerarComModelo } from '../src/components/builder/builderEngine.js';

function respostaSSE(eventos) {
  const corpo = eventos.map((e) => `data: ${typeof e === 'string' ? e : JSON.stringify(e)}\n\n`).join('');
  // entrega em pedaços pequenos para exercitar linhas quebradas no meio
  const bytes = new TextEncoder().encode(corpo);
  const stream = new ReadableStream({
    start(c) {
      for (let i = 0; i < bytes.length; i += 7) c.enqueue(bytes.slice(i, i + 7));
      c.close();
    },
  });
  return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

async function comFetch(resposta, fn) {
  const original = globalThis.fetch;
  const chamadas = [];
  globalThis.fetch = async (url, opcoes) => {
    chamadas.push({ url, opcoes });
    return resposta();
  };
  try {
    await fn();
  } finally {
    globalThis.fetch = original;
  }
  return chamadas;
}

const motor = (id, fields = {}) => ({ id, cfg: { model: 'modelo-x', fields }, segredo: () => 'chave-teste' });
const pedido = { sistema: 's', usuario: 'u' };

test('Claude: streaming de content_block_delta, cabeçalhos de acesso pelo navegador', async () => {
  let texto = '';
  const chamadas = await comFetch(
    () => respostaSSE([{ type: 'message_start' }, { type: 'content_block_delta', delta: { type: 'text_delta', text: '<!DOCTYPE html>' } }, { type: 'content_block_delta', delta: { type: 'text_delta', text: '<html></html>' } }, { type: 'message_stop' }]),
    () => gerarComModelo(motor('claude'), { ...pedido, onTexto: (t) => (texto += t) }),
  );
  assert.equal(texto, '<!DOCTYPE html><html></html>');
  assert.equal(chamadas[0].url, 'https://api.anthropic.com/v1/messages');
  assert.equal(chamadas[0].opcoes.headers['x-api-key'], 'chave-teste');
  assert.equal(chamadas[0].opcoes.headers['anthropic-dangerous-direct-browser-access'], 'true');
});

test('OpenAI, Grok e Azure (Copilot): formato chat/completions em streaming', async () => {
  for (const [id, fields, url] of [
    ['openai', {}, 'https://api.openai.com/v1/chat/completions'],
    ['grok', {}, 'https://api.x.ai/v1/chat/completions'],
    ['copilot', { endpoint: 'https://r.openai.azure.com/openai/v1', deployment: 'dep' }, 'https://r.openai.azure.com/openai/v1/chat/completions'],
  ]) {
    let texto = '';
    const chamadas = await comFetch(
      () => respostaSSE([{ choices: [{ delta: { content: '<html>' } }] }, { choices: [{ delta: { content: '</html>' } }] }, '[DONE]']),
      () => gerarComModelo(motor(id, fields), { ...pedido, onTexto: (t) => (texto += t) }),
    );
    assert.equal(texto, '<html></html>', id);
    assert.equal(chamadas[0].url, url, id);
  }
});

test('Gemini: streamGenerateContent com alt=sse', async () => {
  let texto = '';
  const chamadas = await comFetch(
    () => respostaSSE([{ candidates: [{ content: { parts: [{ text: '<html>' }] } }] }, { candidates: [{ content: { parts: [{ text: '</html>' }] } }] }]),
    () => gerarComModelo(motor('google'), { ...pedido, onTexto: (t) => (texto += t) }),
  );
  assert.equal(texto, '<html></html>');
  assert.match(chamadas[0].url, /models\/modelo-x:streamGenerateContent\?alt=sse$/);
});

test('erro do provedor vira mensagem legível', async () => {
  await assert.rejects(
    comFetch(() => new Response('{"error":"invalid x-api-key"}', { status: 401 }), () => gerarComModelo(motor('claude'), { ...pedido, onTexto: () => {} })),
    /respondeu 401/,
  );
});
