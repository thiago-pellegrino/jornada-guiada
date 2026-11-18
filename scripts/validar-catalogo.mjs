#!/usr/bin/env node
// Validador do catálogo de capacidades da Jornada Guiada.
// Uso: node scripts/validar-catalogo.mjs [pasta-das-especificacoes]
// Sem dependências obrigatórias. Com `ajv` instalado (devDependency), também compila
// os JSON Schemas e valida os exemplos mínimos contra envelope + schema de `data`.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pasta = path.resolve(process.argv[2] ?? path.join(raiz, 'especificações'));
const arquivoTermos = path.join(raiz, 'testes', 'termos-proibidos.txt');

const erros = [];
const avisos = [];
const erro = (arq, msg) => erros.push(`${arq}: ${msg}`);
const aviso = (arq, msg) => avisos.push(`${arq}: ${msg}`);

const FASES = { '01': 'contexto', '02': 'darklab', '03': 'backlog-do-futuro' };
const PADRAO = /^(0[1-3])-(contexto|darklab|backlog-do-futuro)-(\d{3})-([a-z0-9-]+)$/;
const SECOES = [
  'Objetivo',
  'Pré-condições',
  'Insumos',
  'Instruções para a IA',
  'Passo a passo',
  'Saída',
  'Regras de qualidade e guardrails',
  'Renderização na aplicação',
  'Tratamento de falhas e lacunas',
  'Critérios de aceite da capacidade',
  'Exemplo mínimo de saída',
];
const CHAVES_FRONTMATTER = ['id', 'fase', 'etapa', 'título', 'versão', 'schemaVersion', 'dependências', 'gatilho', 'executávelNoTurbo'];
const LIMITE_TOKENS_PROMPT = 200_000;

// ---------- utilitários ----------
const normaliza = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const lerMd = (p) => fs.readFileSync(p, 'utf8').replace(/^﻿/, '');

function frontmatter(texto) {
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = {};
  for (const linha of m[1].split(/\r?\n/)) {
    const kv = linha.match(/^([^:#\s][^:]*):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('[') && v.endsWith(']')) {
      v = v.slice(1, -1).split(',').map((x) => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      v = v.replace(/^["']|["']$/g, '');
    }
    fm[kv[1].trim()] = v;
  }
  return fm;
}

function secoesH2(texto) {
  const semCodigo = texto.replace(/```[\s\S]*?```/g, '');
  return [...semCodigo.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim().replace(/^\d+\.\s*/, ''));
}

function blocosJson(texto) {
  return [...texto.matchAll(/```json\r?\n([\s\S]*?)```/g)].map((m) => ({ src: m[1], pos: m.index }));
}

// Slug de âncora no estilo GitHub.
function slug(titulo) {
  return titulo
    .trim()
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-');
}

function ancoras(texto) {
  const semCodigo = texto.replace(/```[\s\S]*?```/g, '');
  const vistos = new Map();
  const lista = new Set();
  for (const m of semCodigo.matchAll(/^#{1,6} (.+)$/gm)) {
    const base = slug(m[1]);
    const n = vistos.get(base) ?? 0;
    lista.add(n ? `${base}-${n}` : base);
    vistos.set(base, n + 1);
  }
  return lista;
}

function trechoDaSecao(texto, titulo) {
  const semCodigoIdx = texto.search(new RegExp(`^## (\\d+\\.\\s*)?${titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm'));
  if (semCodigoIdx < 0) return '';
  const resto = texto.slice(semCodigoIdx + 3);
  const prox = resto.search(/^## /m);
  return prox < 0 ? resto : resto.slice(0, prox);
}

// ---------- coleta ----------
if (!fs.existsSync(pasta)) {
  console.error(`Pasta não encontrada: ${pasta}`);
  process.exit(2);
}

const arquivosMd = [];
(function andar(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '_arquivo') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) andar(p);
    else if (e.name.endsWith('.md')) arquivosMd.push(p);
  }
})(pasta);

const capacidades = new Map(); // id -> { arq, fm, texto, fase, num }
const obsoletos = [];
for (const p of arquivosMd) {
  if (path.dirname(p) !== pasta) continue;
  const nome = path.basename(p, '.md');
  const m = nome.match(PADRAO);
  if (!m) continue;
  const texto = lerMd(p);
  const fm = frontmatter(texto);
  if (fm?.status === 'obsoleto') {
    obsoletos.push(nome);
    continue;
  }
  if (FASES[m[1]] !== m[2]) erro(nome, `prefixo ${m[1]} não corresponde à fase ${m[2]}`);
  capacidades.set(nome, { arq: nome, fm, texto, fase: m[2], num: Number(m[3]) });
}

// ---------- ajv opcional ----------
let ajv = null;
try {
  const { default: Ajv2020 } = await import('ajv/dist/2020.js');
  ajv = new Ajv2020({ strict: false, allErrors: true });
  try {
    const { default: addFormats } = await import('ajv-formats');
    addFormats(ajv);
  } catch {
    /* formatos são opcionais */
  }
} catch {
  avisos.push('ajv não instalado: schemas e exemplos só foram checados como JSON válido (rode npm install na raiz).');
}

// Schemas compartilhados: contrato comum e visões de fase (000), registrados no ajv
// para resolver $ref entre schemas.
const contratoArq = path.join(pasta, '00-contrato-comum-das-capacidades.md');
let validaEnvelope = null;
if (!fs.existsSync(contratoArq)) erro('00-contrato-comum-das-capacidades', 'arquivo ausente');
const compartilhados = [contratoArq, ...[...capacidades.values()].filter((c) => c.num === 0).map((c) => path.join(pasta, `${c.arq}.md`))];
for (const arqComp of compartilhados.filter((p) => fs.existsSync(p))) {
  const nomeComp = path.basename(arqComp, '.md');
  for (const b of blocosJson(lerMd(arqComp))) {
    let obj;
    try {
      obj = JSON.parse(b.src);
    } catch {
      continue;
    }
    if (ajv && obj.$schema && obj.$id) {
      try {
        ajv.addSchema(obj);
        if (obj.$id.endsWith('/envelope.json')) validaEnvelope = ajv.getSchema(obj.$id);
      } catch (e) {
        erro(nomeComp, `schema ${obj.$id} não compila: ${e.message}`);
      }
    }
  }
}

// ---------- regras por capacidade ----------
const porFase = { contexto: [], darklab: [], 'backlog-do-futuro': [] };
for (const [id, c] of capacidades) {
  porFase[c.fase].push(c);
  const { fm, texto } = c;
  if (!fm) {
    erro(id, 'sem frontmatter YAML');
    continue;
  }
  for (const k of CHAVES_FRONTMATTER) if (!(k in fm)) erro(id, `frontmatter sem a chave "${k}"`);
  if (fm.id !== id) erro(id, `frontmatter id "${fm.id}" difere do nome do arquivo`);
  if (fm.etapa && fm.etapa !== id.match(PADRAO)[3]) erro(id, `etapa "${fm.etapa}" difere do número do arquivo`);
  for (const d of fm.dependências ?? []) {
    if (!capacidades.has(d)) erro(id, `dependência inexistente: ${d}`);
  }

  if (c.num === 0) continue; // visão da fase: só frontmatter e links

  const ehTurbo = id.endsWith('-modo-turbo');
  const h2 = secoesH2(texto).map(normaliza);
  let cursor = 0;
  for (const s of SECOES) {
    const idx = h2.indexOf(normaliza(s), cursor);
    if (idx < 0) erro(id, `seção ausente ou fora de ordem: "${s}"`);
    else cursor = idx + 1;
  }

  // JSON válido em todos os blocos ```json
  const objetos = [];
  for (const b of blocosJson(texto)) {
    try {
      objetos.push({ obj: JSON.parse(b.src), pos: b.pos });
    } catch (e) {
      erro(id, `bloco JSON inválido (posição ${b.pos}): ${e.message.slice(0, 90)}`);
    }
  }

  // Schemas e exemplo
  const schemas = objetos.filter((o) => o.obj && typeof o.obj === 'object' && o.obj.$schema);
  if (!ehTurbo && schemas.length === 0) erro(id, 'nenhum JSON Schema (com $schema) na seção Saída');
  const inicioExemplo = texto.search(/^## (\d+\.\s*)?Exemplo mínimo de saída/m);
  const exemplos = objetos.filter((o) => o.pos > inicioExemplo && o.obj?.capabilityId);
  if (!exemplos.length) erro(id, 'exemplo mínimo sem envelope JSON (com capabilityId)');
  for (const ex of exemplos) {
    if (ex.obj.capabilityId !== id && !ehTurbo) erro(id, `exemplo com capabilityId "${ex.obj.capabilityId}"`);
  }

  if (ajv) {
    let validaData = null;
    for (const s of schemas) {
      try {
        const v = s.obj.$id ? ajv.getSchema(s.obj.$id) ?? (ajv.addSchema(s.obj), ajv.getSchema(s.obj.$id)) : ajv.compile(s.obj);
        if (!validaData) validaData = v;
      } catch (e) {
        erro(id, `JSON Schema não compila: ${e.message.slice(0, 160)}`);
      }
    }
    const ex = exemplos[0]?.obj;
    if (ex && !ehTurbo) {
      if (validaEnvelope && !validaEnvelope(ex)) {
        erro(id, `exemplo inválido contra o envelope: ${ajv.errorsText(validaEnvelope.errors).slice(0, 220)}`);
      }
      if (validaData && !validaData(ex.data)) {
        erro(id, `exemplo.data inválido contra o schema: ${ajv.errorsText(validaData.errors).slice(0, 220)}`);
      }
    }
  }

  // Tamanho do prompt
  const prompt = trechoDaSecao(texto, 'Instruções para a IA');
  const tokens = Math.ceil(prompt.length / 4);
  if (tokens > LIMITE_TOKENS_PROMPT) erro(id, `prompt com ~${tokens} tokens, acima de ${LIMITE_TOKENS_PROMPT}`);
  if (!ehTurbo && prompt.trim().length < 400) erro(id, 'seção "Instruções para a IA" curta demais para ser um prompt de sistema');
}

// Grafo acíclico
const visitando = new Set();
const feitos = new Set();
function dfs(id, trilha) {
  if (feitos.has(id)) return;
  if (visitando.has(id)) {
    erro(id, `ciclo de dependências: ${[...trilha, id].join(' → ')}`);
    return;
  }
  visitando.add(id);
  for (const d of capacidades.get(id)?.fm?.dependências ?? []) if (capacidades.has(d)) dfs(d, [...trilha, id]);
  visitando.delete(id);
  feitos.add(id);
}
for (const id of capacidades.keys()) dfs(id, []);

// Numeração contínua, 000 presente e Turbo por último
for (const [fase, lista] of Object.entries(porFase)) {
  const nums = lista.map((c) => c.num).sort((a, b) => a - b);
  if (!nums.length) {
    erro(fase, 'fase sem arquivos');
    continue;
  }
  if (nums[0] !== 0) erro(fase, 'falta o arquivo 000 (visão e contrato da fase)');
  nums.forEach((n, i) => {
    if (n !== i) erro(fase, `numeração com buraco ou repetição perto de ${String(n).padStart(3, '0')}`);
  });
  const ultimo = lista.find((c) => c.num === nums.at(-1));
  if (!ultimo.arq.endsWith('-modo-turbo')) erro(fase, `o último número (${ultimo.arq}) não é o Modo Turbo`);
  else {
    for (const c of lista) {
      if (c.num === 0 || c === ultimo) continue;
      if (!ultimo.texto.includes(c.arq)) erro(ultimo.arq, `o Turbo não cita a capacidade ${c.arq}`);
    }
  }
}

// ---------- regras para todos os .md da pasta ----------
const termos = fs.existsSync(arquivoTermos)
  ? lerMd(arquivoTermos)
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
  : [];
if (!termos.length) avisos.push(`lista de termos proibidos não encontrada em ${path.relative(raiz, arquivoTermos)}`);

const ancorasPorArquivo = new Map();
for (const p of arquivosMd) ancorasPorArquivo.set(path.resolve(p), ancoras(lerMd(p)));

for (const p of arquivosMd) {
  const rel = path.relative(pasta, p);
  const nome = path.basename(p, '.md');
  if (obsoletos.includes(nome)) continue;
  const texto = lerMd(p);
  const semCodigo = texto.replace(/```[\s\S]*?```/g, '');

  for (const t of termos) {
    const re = new RegExp(`(^|[^\\p{L}])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'iu');
    if (re.test(texto)) erro(rel, `contém termo do caso de teste: "${t}"`);
  }
  for (const g of ['Darklabs', 'DarkLabs', 'Darklab']) {
    if (new RegExp(`\\b${g}\\b`).test(semCodigo)) erro(rel, `grafia "${g}" (use "DarkLab")`);
  }

  for (const m of semCodigo.matchAll(/\]\(([^)\s]+)\)/g)) {
    const alvo = m[1];
    if (/^[a-z]+:/i.test(alvo)) continue; // http(s), mailto, repo://
    const [arqAlvo, ancora] = alvo.split('#');
    const destino = arqAlvo ? path.resolve(path.dirname(p), decodeURIComponent(arqAlvo)) : path.resolve(p);
    if (arqAlvo && !fs.existsSync(destino)) {
      erro(rel, `link quebrado: ${alvo}`);
      continue;
    }
    if (ancora && destino.endsWith('.md')) {
      const lista = ancorasPorArquivo.get(destino) ?? ancoras(lerMd(destino));
      if (!lista.has(decodeURIComponent(ancora).toLowerCase())) erro(rel, `âncora inexistente: ${alvo}`);
    }
  }
}

// Catálogo da especificação cobre exatamente os arquivos existentes
const specArq = path.join(pasta, 'especificacao-plataforma-jornada-guiada.md');
if (fs.existsSync(specArq)) {
  const spec = lerMd(specArq);
  const citados = new Set([...spec.matchAll(/\((0[1-3]-[a-z-]+-\d{3}-[a-z0-9-]+)\.md/g)].map((m) => m[1]));
  for (const id of capacidades.keys()) if (!citados.has(id)) erro('especificacao-plataforma-jornada-guiada', `catálogo não cita ${id}`);
  const total = spec.match(/Total:\s*(\d+)\s+capacidades/);
  const execIA = [...capacidades.values()].filter((c) => c.num > 0 && !c.arq.endsWith('-modo-turbo')).length;
  if (total && Number(total[1]) !== execIA) erro('especificacao-plataforma-jornada-guiada', `§9 diz ${total[1]} capacidades executadas pela IA; há ${execIA}`);
} else {
  erro('especificacao-plataforma-jornada-guiada', 'arquivo ausente');
}

for (const o of obsoletos) aviso(o, 'marcado como obsoleto; apague o arquivo (scripts/limpar-obsoletos.ps1)');

// ---------- relatório ----------
const fases = Object.entries(porFase).map(([f, l]) => `${f}: ${l.length}`).join(' · ');
console.log(`Catálogo em ${path.relative(raiz, pasta) || pasta}`);
console.log(`Arquivos de capacidade: ${capacidades.size} (${fases})`);
for (const a of avisos) console.log(`AVISO  ${a}`);
for (const e of erros) console.log(`ERRO   ${e}`);
console.log(erros.length ? `\n${erros.length} erro(s), ${avisos.length} aviso(s).` : `\nOK: nenhum erro, ${avisos.length} aviso(s).`);
process.exit(erros.length ? 1 : 0);
