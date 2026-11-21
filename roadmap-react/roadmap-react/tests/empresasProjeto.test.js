import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, editProject } from '../src/domain/journey/journeyEngine.js';
import { EMPRESAS, filtrarEmpresas, normalizarEmpresa } from '../src/domain/journey/empresas.js';

const vazio = { projects: [], selectedProjectId: null };
const agora = '2026-11-21T12:00:00.000Z';

test('projeto criado guarda a empresa escolhida da lista', () => {
  const s = createProject(vazio, { name: 'Crédito', company: { id: 'emp-aurora' , name: 'x' }, now: agora });
  assert.deepEqual(s.projects[0].company, EMPRESAS.find((e) => e.id === 'emp-aurora'));
});

test('outra empresa digitada vira empresa com id próprio', () => {
  const e = normalizarEmpresa({ id: 'outra', name: '  Cooperativa São José ' });
  assert.equal(e.name, 'Cooperativa São José');
  assert.equal(e.id, 'emp-outra-cooperativa-sao-jose');
});

test('sem empresa, o projeto continua válido (projetos antigos)', () => {
  const s = createProject(vazio, { name: 'Legado', now: agora });
  assert.equal(s.projects[0].company, null);
});

test('busca de empresa ignora acentos e procura também o setor', () => {
  assert.deepEqual(filtrarEmpresas('saude').map((e) => e.id), ['emp-vitalis']);
  assert.ok(filtrarEmpresas('SEGUROS').some((e) => e.id === 'emp-horizonte'));
});

test('editar projeto muda nome, descrição e empresa sem mexer no código nem no histórico', () => {
  const p = createProject(vazio, { name: 'Credito', now: agora }).projects[0];
  const e = editProject(p, { name: ' Credito on Wealth ', description: 'Alta renda', company: { id: 'emp-aurora' } });
  assert.equal(e.name, 'Credito on Wealth');
  assert.equal(e.description, 'Alta renda');
  assert.equal(e.company.name, 'Banco Aurora');
  assert.equal(e.code, p.code);
  assert.equal(e.projectId, p.projectId);
  assert.equal(e.artifacts, p.artifacts);
  assert.equal(editProject(p, { name: '   ' }).name, 'Credito');
});
