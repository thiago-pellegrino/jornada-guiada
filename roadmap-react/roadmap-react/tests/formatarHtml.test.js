import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatarCss, formatarHtml, realcar } from '../src/components/builder/formatarHtml.js';

const HTML = '<!DOCTYPE html><html><head><style>body{margin:0;font-family:a,"B C"}@media (max-width:600px){.g{gap:4px}}</style></head>'
  + '<body><main><h1>Título <b>forte</b></h1><ul><li><span>1</span><div class="c"><b>x</b></div></li></ul></main></body></html>';

test('formatarHtml indenta blocos e mantém conteúdo de linha numa linha só', () => {
  const linhas = formatarHtml(HTML).split('\n');
  assert.equal(linhas[0], '<!DOCTYPE html>');
  assert.ok(linhas.includes('      <h1>Título <b>forte</b></h1>'));
  assert.ok(linhas.includes('          <span>1</span>'));
  assert.ok(linhas.includes('          <div class="c"><b>x</b></div>'));
  assert.equal(linhas.at(-1), '</html>');
});

test('formatarCss: uma declaração por linha, @media aninhado e vírgulas espaçadas', () => {
  const css = formatarCss('body{margin:0;font-family:a,"B,C"}@media (max-width:600px){.g{gap:4px}}');
  assert.deepEqual(css, ['body {', '  margin: 0;', '  font-family: a, "B,C";', '}', '@media (max-width:600px) {', '  .g {', '    gap: 4px;', '  }', '}']);
});

test('formatarHtml tolera o HTML incompleto que chega durante a geração', () => {
  const parcial = formatarHtml('<html><head><style>body{marg');
  assert.match(parcial, /<style>\n\s+body \{\n\s+marg$/);
  assert.doesNotThrow(() => formatarHtml('<div><span class="a'));
});

test('realcar classifica tags, atributos, valores e propriedades CSS', () => {
  const linhas = realcar(formatarHtml(HTML));
  const todas = linhas.flat();
  assert.ok(todas.some((p) => p.c === 'tg' && p.t === 'div'));
  assert.ok(todas.some((p) => p.c === 'at' && p.t === 'class'));
  assert.ok(todas.some((p) => p.c === 'vl' && p.t === '"c"'));
  assert.ok(todas.some((p) => p.c === 'pr' && p.t === 'margin'));
  assert.equal(linhas.map((l) => l.map((p) => p.t).join('')).join('\n'), formatarHtml(HTML));
});
