import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OFERTA_ATUAL, PRATELEIRA, TIME, resumoDaProposta } from '../src/components/darklab/vamosAlemData.js';

test('prateleira tem 6 ofertas, uma delas aplicada ao projeto atual, todas ligadas a motores válidos', () => {
  assert.equal(PRATELEIRA.length, 6);
  assert.ok(PRATELEIRA.some((o) => o.id === OFERTA_ATUAL));
  for (const o of PRATELEIRA) assert.ok(o.motores.length && o.motores.every((n) => n >= 1 && n <= 7), o.id);
  assert.equal(TIME.length, 5);
});

test('resumo da proposta lista as ofertas escolhidas na ordem da prateleira e traz a ressalva', () => {
  assert.equal(resumoDaProposta({ projeto: 'PRJ-001 · X', ids: [] }), '');
  const r = resumoDaProposta({ projeto: 'PRJ-001 · X', ids: ['mvp', 'impulso'] });
  assert.match(r, /^Proposta de continuidade · PRJ-001 · X/);
  assert.ok(r.indexOf('DarkLabs Impulso') < r.indexOf('DarkLabs MVP'));
  assert.match(r, /não representa contratação/);
});

test('o catálogo de ofertas não cita nenhum case de cliente', () => {
  const texto = JSON.stringify({ PRATELEIRA, TIME });
  assert.doesNotMatch(texto, /credit|wealth|crédito/i);
});
