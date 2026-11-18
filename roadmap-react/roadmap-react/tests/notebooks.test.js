import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyState, createProject, selectedProject } from '../src/domain/journey/journeyEngine.js';
import {
  chatPreview,
  chatTime,
  continueNotebookChat,
  queryChats,
  removeNotebookChat,
  startNotebookChat,
  addNotebookChat,
  addNotebookCreation,
  getNotebook,
  notebookSources,
  renameNotebook,
  addNotebookReferences,
  createNotebook,
  normalizeLink,
  queryNotebooks,
  relativeTime,
  removeNotebook,
  setNotebookShared,
} from '../src/domain/journey/notebooks.js';

const NOW = '2026-11-18T15:00:00.000Z';
const projeto = () => selectedProject(createProject(createEmptyState(), { name: 'P', now: NOW }));

describe('cadernos de anotações do Contexto', () => {
  test('cria com arquivos que viram fontes do lote e links como referências', () => {
    const { project, notebookId } = createNotebook(projeto(), {
      name: 'DarkLabs',
      files: [{ name: 'a.pdf', size: 10 }, { name: 'b.docx', size: 20 }],
      links: ['https://exemplo.com/estudo'],
      now: NOW,
    });
    assert.equal(notebookId, 'NB-001');
    assert.deepEqual(project.sources.map((s) => s.id), ['SRC-001', 'SRC-002']);
    const nb = project.notebooks[0];
    assert.deepEqual(nb.references.map((r) => [r.id, r.kind, r.sourceId ?? r.url]), [
      ['REF-001', 'arquivo', 'SRC-001'],
      ['REF-002', 'arquivo', 'SRC-002'],
      ['REF-003', 'link', 'https://exemplo.com/estudo'],
    ]);
    assert.equal(nb.shared, false);
  });

  test('acrescenta referências, compartilha, filtra e remove sem apagar fontes', () => {
    let { project } = createNotebook(projeto(), { name: 'Beta', now: NOW });
    ({ project } = createNotebook(project, { name: 'Alfa', now: '2026-11-18T16:00:00.000Z' }));
    project = addNotebookReferences(project, 'NB-001', { files: [{ name: 'c.csv' }], now: '2026-11-18T17:00:00.000Z' });
    project = setNotebookShared(project, 'NB-002', true, NOW);
    assert.deepEqual(queryNotebooks(project).map((n) => n.name), ['Beta', 'Alfa']);
    assert.deepEqual(queryNotebooks(project, { sort: 'nome' }).map((n) => n.name), ['Alfa', 'Beta']);
    assert.deepEqual(queryNotebooks(project, { filter: 'compartilhado' }).map((n) => n.id), ['NB-002']);
    assert.deepEqual(queryNotebooks(project, { filter: 'apenas-voce', search: 'bet' }).map((n) => n.id), ['NB-001']);
    project = removeNotebook(project, 'NB-001');
    assert.equal(project.notebooks.length, 1);
    assert.equal(project.sources.length, 1);
    assert.throws(() => createNotebook(project, { name: '  ' }));
  });

  test('normaliza links e escreve o tempo relativo', () => {
    assert.equal(normalizeLink('exemplo.com/a'), 'https://exemplo.com/a');
    assert.equal(normalizeLink('não é link'), null);
    const agora = new Date('2026-11-18T15:10:00.000Z');
    assert.equal(relativeTime('2026-11-18T15:09:30.000Z', agora), 'agora');
    assert.equal(relativeTime('2026-11-18T15:00:00.000Z', agora), 'há 10 min');
    assert.equal(relativeTime('2026-11-18T12:00:00.000Z', agora), 'há 3 h');
  });

  test('cada caderno pertence ao projeto e guarda fontes, conversas e criações próprias', () => {
    let { project } = createNotebook(projeto(), { name: 'A', files: [{ name: 'a.pdf' }], now: NOW });
    ({ project } = createNotebook(project, { name: 'B', files: [{ name: 'b.pdf' }, { name: 'c.pdf' }], now: NOW }));
    assert.equal(project.notebooks.length, 2);
    assert.deepEqual(notebookSources(project, getNotebook(project, 'NB-002')).map((s) => s.id), ['SRC-002', 'SRC-003']);
    project = addNotebookChat(project, 'NB-001', 'Quais são as dores principais?', NOW);
    project = addNotebookCreation(project, 'NB-001', 'resumo', NOW);
    project = addNotebookCreation(project, 'NB-001', 'inexistente', NOW);
    project = renameNotebook(project, 'NB-001', 'Pesquisa', NOW);
    const a = getNotebook(project, 'NB-001');
    assert.equal(a.name, 'Pesquisa');
    assert.equal(a.chats[0].messages.length, 2);
    assert.deepEqual(a.creations.map((c) => c.kind), ['resumo']);
    assert.equal(getNotebook(project, 'NB-002').chats.length, 0);
  });

  test('histórico de chats: inicia, continua, busca, ordena e remove', () => {
    let { project } = createNotebook(projeto(), { name: 'DarkLabs', now: NOW });
    let r = startNotebookChat(project, 'NB-001', 'qual o conceito de um darklab', '2026-11-18T19:12:00.000Z');
    assert.equal(r.chatId, 'CHAT-001');
    r = startNotebookChat(r.project, 'NB-001', 'liste as hipóteses', '2026-11-18T19:20:00.000Z');
    project = continueNotebookChat(r.project, 'NB-001', 'CHAT-001', 'e os motores?', '2026-11-18T19:30:00.000Z');
    const nb = getNotebook(project, 'NB-001');
    assert.equal(nb.chats.find((c) => c.id === 'CHAT-001').messages.length, 4);
    assert.deepEqual(queryChats(nb).map((c) => c.id), ['CHAT-001', 'CHAT-002']);
    assert.deepEqual(queryChats(nb, { sort: 'antigos' }).map((c) => c.id), ['CHAT-002', 'CHAT-001']);
    assert.deepEqual(queryChats(nb, { search: 'motores' }).map((c) => c.id), ['CHAT-001']);
    assert.match(chatPreview(nb.chats[0]), /Resposta simulada/);
    project = removeNotebookChat(project, 'NB-001', 'CHAT-002');
    assert.equal(getNotebook(project, 'NB-001').chats.length, 1);
    const agora = new Date(2026, 10, 18, 20, 0);
    assert.match(chatTime(new Date(2026, 10, 18, 19, 12).toISOString(), agora), /^Hoje 19:12$/);
    assert.match(chatTime(new Date(2026, 10, 17, 8, 30).toISOString(), agora), /^Ontem 08:30$/);
  });
});
