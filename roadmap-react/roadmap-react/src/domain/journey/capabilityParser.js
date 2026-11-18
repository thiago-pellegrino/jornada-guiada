/**
 * Leitor dos arquivos de capacidade de `especificações/` (puro, sem dependência do Vite).
 * Extrai frontmatter, título, objetivo e o exemplo mínimo de saída, que o protótipo usa
 * como resultado simulado de cada execução.
 */

const NOME_ARQUIVO = /^(0[1-3])-(contexto|darklab|backlog-do-futuro)-(\d{3})-([a-z0-9-]+)$/;

export const PHASES = Object.freeze([
  { id: 'contexto', label: 'Contexto', prefix: '01' },
  { id: 'darklab', label: 'DarkLabs', prefix: '02' },
  { id: 'backlog-do-futuro', label: 'Backlog do Futuro', prefix: '03' },
]);

export function parseFrontmatter(texto) {
  const m = texto.replace(/^﻿/, '').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const fm = {};
  for (const linha of m[1].split(/\r?\n/)) {
    const kv = linha.match(/^([^:#\s][^:]*):\s*(.*)$/);
    if (!kv) continue;
    let valor = kv[2].trim();
    if (valor.startsWith('[') && valor.endsWith(']')) {
      valor = valor
        .slice(1, -1)
        .split(',')
        .map((x) => x.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else {
      valor = valor.replace(/^["']|["']$/g, '');
    }
    fm[kv[1].trim()] = valor;
  }
  return fm;
}

function secao(texto, titulo) {
  const re = new RegExp(`^## (?:\\d+\\.\\s*)?${titulo}\\s*$`, 'm');
  const i = texto.search(re);
  if (i < 0) return '';
  const resto = texto.slice(i).replace(/^## .*\n/, '');
  const fim = resto.search(/^## /m);
  return (fim < 0 ? resto : resto.slice(0, fim)).trim();
}

function primeiroParagrafo(texto) {
  return (
    texto
      .replace(/```[\s\S]*?```/g, '')
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .find((p) => p && !p.startsWith('|') && !p.startsWith('#') && !p.startsWith('- ')) ?? ''
  )
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

/** Devolve a capacidade ou null quando o arquivo não é capacidade (00-*, obsoleto, nome fora do padrão). */
export function parseCapability(fileName, texto) {
  const nome = fileName.replace(/^.*[\\/]/, '').replace(/\.md$/, '');
  const m = nome.match(NOME_ARQUIVO);
  if (!m) return null;
  const fm = parseFrontmatter(texto);
  if (!fm || fm.status === 'obsoleto') return null;

  const numero = Number(m[3]);
  const fase = m[2];
  let exemplo = null;
  const iniExemplo = texto.search(/^## (?:\d+\.\s*)?Exemplo mínimo de saída/m);
  if (iniExemplo >= 0) {
    const bloco = texto.slice(iniExemplo).match(/```json\r?\n([\s\S]*?)```/);
    if (bloco) {
      try {
        exemplo = JSON.parse(bloco[1]);
      } catch {
        exemplo = null;
      }
    }
  }
  const titulo = (texto.match(/^# (.+)$/m)?.[1] ?? fm['título'] ?? nome).trim();
  return Object.freeze({
    id: nome,
    phase: fase,
    number: numero,
    step: m[3],
    slug: m[4],
    title: fm['título'] || titulo,
    heading: titulo,
    version: fm['versão'] ?? null,
    dependencies: Array.isArray(fm['dependências']) ? fm['dependências'] : [],
    trigger: fm.gatilho ?? '',
    turboEligible: fm['executávelNoTurbo'] === 'sim',
    isVision: numero === 0,
    isTurbo: nome.endsWith('-modo-turbo'),
    objective: primeiroParagrafo(secao(texto, 'Objetivo') || secao(texto, '1. Visão') || ''),
    example: exemplo,
  });
}

/** Monta o catálogo a partir de um mapa { caminho: conteúdo }. */
export function buildCatalog(arquivos) {
  const lista = Object.entries(arquivos)
    .map(([caminho, texto]) => parseCapability(caminho, texto))
    .filter(Boolean)
    .sort((a, b) => a.id.localeCompare(b.id));
  const porId = new Map(lista.map((c) => [c.id, c]));
  const porFase = Object.fromEntries(PHASES.map((f) => [f.id, lista.filter((c) => c.phase === f.id && !c.isVision)]));
  return { list: lista, byId: porId, byPhase: porFase };
}
