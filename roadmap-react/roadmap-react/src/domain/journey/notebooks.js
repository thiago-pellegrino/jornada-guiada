/**
 * Cadernos de anotações (notebooks) do projeto, no Contexto. Funções puras: recebem o projeto e
 * devolvem um projeto novo. Arquivos enviados a um caderno também entram no lote de fontes do
 * projeto (SRC-NNN), então seguem para a análise 001 como qualquer outra fonte.
 */
import { addSources } from './journeyEngine.js';

const pad3 = (n) => String(n).padStart(3, '0');

export function listNotebooks(project) {
  return project?.notebooks ?? [];
}

function nomeDoLink(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '') + (u.pathname !== '/' ? u.pathname : '');
  } catch {
    return url;
  }
}

/** Normaliza um link digitado; devolve null se não parecer um endereço http(s). */
export function normalizeLink(texto) {
  const bruto = String(texto ?? '').trim();
  if (!bruto) return null;
  const comEsquema = /^https?:\/\//i.test(bruto) ? bruto : `https://${bruto}`;
  try {
    const u = new URL(comEsquema);
    if (!u.hostname.includes('.')) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Acrescenta arquivos (viram fontes do lote) e links às referências de um caderno já existente. */
function comReferencias(project, notebook, { files = [], links = [], now }) {
  let p = project;
  const refs = [...notebook.references];
  let seq = refs.length;
  if (files.length) {
    const antes = p.sources.length;
    p = addSources(p, files, now);
    p.sources.slice(antes).forEach((src) => {
      seq += 1;
      refs.push({ id: `REF-${pad3(seq)}`, kind: 'arquivo', name: src.name, sourceId: src.id, addedAt: now });
    });
  }
  for (const url of links) {
    seq += 1;
    refs.push({ id: `REF-${pad3(seq)}`, kind: 'link', name: nomeDoLink(url), url, addedAt: now });
  }
  return { project: p, notebook: { ...notebook, references: refs, updatedAt: now } };
}

export function createNotebook(project, { name, files = [], links = [], now = new Date().toISOString(), owner = 'Você' } = {}) {
  const nome = String(name ?? '').trim();
  if (!nome) throw new Error('Informe o nome do caderno de anotações.');
  const atuais = listNotebooks(project);
  const maior = atuais.reduce((m, n) => Math.max(m, Number(n.id.replace('NB-', '')) || 0), 0);
  const base = { id: `NB-${pad3(maior + 1)}`, name: nome, owner, shared: false, createdAt: now, updatedAt: now, references: [], chats: [], creations: [] };
  const { project: p, notebook } = comReferencias(project, base, { files, links, now });
  return { project: { ...p, notebooks: [...atuais, notebook] }, notebookId: notebook.id };
}

function trocar(project, notebookId, fn) {
  return { ...project, notebooks: listNotebooks(project).map((n) => (n.id === notebookId ? fn(n) : n)) };
}

export function addNotebookReferences(project, notebookId, { files = [], links = [], now = new Date().toISOString() } = {}) {
  const alvo = listNotebooks(project).find((n) => n.id === notebookId);
  if (!alvo) return project;
  const { project: p, notebook } = comReferencias(project, alvo, { files, links, now });
  return trocar(p, notebookId, () => notebook);
}

export function setNotebookShared(project, notebookId, shared, now = new Date().toISOString()) {
  return trocar(project, notebookId, (n) => ({ ...n, shared: Boolean(shared), updatedAt: now }));
}

/** Remove o caderno; as fontes que ele trouxe continuam no lote do projeto. */
export function removeNotebook(project, notebookId) {
  return { ...project, notebooks: listNotebooks(project).filter((n) => n.id !== notebookId) };
}

export function getNotebook(project, notebookId) {
  return listNotebooks(project).find((n) => n.id === notebookId) ?? null;
}

export function renameNotebook(project, notebookId, name, now = new Date().toISOString()) {
  const nome = String(name ?? '').trim();
  if (!nome) return project;
  return trocar(project, notebookId, (n) => ({ ...n, name: nome, updatedAt: now }));
}

/** Fontes do lote que vieram por este caderno (na ordem do lote). */
export function notebookSources(project, notebook) {
  const ids = new Set((notebook?.references ?? []).filter((r) => r.kind === 'arquivo').map((r) => r.sourceId));
  return (project?.sources ?? []).filter((s) => ids.has(s.id));
}

/** Tipos de criação oferecidos no painel do caderno. */
export const CREATION_KINDS = Object.freeze([
  { id: 'resumo', label: 'Resumo', icon: 'summary' },
  { id: 'guia', label: 'Guia de estudo', icon: 'guide' },
  { id: 'teste', label: 'Teste', icon: 'quiz' },
  { id: 'flashcards', label: 'Flashcards', icon: 'cards' },
]);

/** Criação simulada a partir das referências do caderno (o conteúdo real vem do backend). */
export function addNotebookCreation(project, notebookId, kindId, now = new Date().toISOString()) {
  const kind = CREATION_KINDS.find((k) => k.id === kindId);
  if (!kind) return project;
  return trocar(project, notebookId, (n) => {
    const criacoes = n.creations ?? [];
    const refs = n.references.length;
    const criacao = {
      id: `CRI-${pad3(criacoes.length + 1)}`,
      kind: kind.id,
      title: `${kind.label} · ${n.name}`,
      createdAt: now,
      basis: refs,
      summary: refs
        ? `Gerado a partir de ${refs} referência${refs === 1 ? '' : 's'} do caderno (simulado).`
        : 'Sem referências ainda: o resultado fica vazio até você adicionar fontes (simulado).',
    };
    return { ...n, creations: [criacao, ...criacoes], updatedAt: now };
  });
}

function respostaSimulada(notebook) {
  const refs = notebook.references.length;
  return refs
    ? `Resposta simulada com base em ${refs} referência${refs === 1 ? '' : 's'} do notebook “${notebook.name}”. Na versão com backend, o Delta responde a partir dessas fontes e cita as evidências.`
    : `Resposta simulada. Adicione referências ao notebook “${notebook.name}” para eu responder com base nelas.`;
}

/** Nova conversa com o Delta no notebook; a resposta é simulada no protótipo. Devolve { project, chatId }. */
export function startNotebookChat(project, notebookId, message, now = new Date().toISOString()) {
  const texto = String(message ?? '').trim();
  const alvo = getNotebook(project, notebookId);
  if (!texto || !alvo) return { project, chatId: null };
  const chats = alvo.chats ?? [];
  const maior = chats.reduce((m, c) => Math.max(m, Number(c.id.replace('CHAT-', '')) || 0), 0);
  const chat = {
    id: `CHAT-${pad3(maior + 1)}`,
    title: texto.length > 80 ? `${texto.slice(0, 77)}…` : texto,
    createdAt: now,
    updatedAt: now,
    messages: [
      { role: 'user', text: texto, at: now },
      { role: 'delta', text: respostaSimulada(alvo), at: now },
    ],
  };
  return { project: trocar(project, notebookId, (n) => ({ ...n, chats: [chat, ...chats], updatedAt: now })), chatId: chat.id };
}

/** Atalho usado em testes e telas antigas: inicia uma conversa e devolve só o projeto. */
export function addNotebookChat(project, notebookId, message, now) {
  return startNotebookChat(project, notebookId, message, now).project;
}

/** Continua uma conversa existente (mensagem do usuário + resposta simulada). */
export function continueNotebookChat(project, notebookId, chatId, message, now = new Date().toISOString()) {
  const texto = String(message ?? '').trim();
  if (!texto) return project;
  return trocar(project, notebookId, (n) => ({
    ...n,
    updatedAt: now,
    chats: (n.chats ?? []).map((c) =>
      c.id === chatId
        ? { ...c, updatedAt: now, messages: [...c.messages, { role: 'user', text: texto, at: now }, { role: 'delta', text: respostaSimulada(n), at: now }] }
        : c,
    ),
  }));
}

export function removeNotebookChat(project, notebookId, chatId) {
  return trocar(project, notebookId, (n) => ({ ...n, chats: (n.chats ?? []).filter((c) => c.id !== chatId) }));
}

/** Busca (título e mensagens) e ordenação do histórico de chats. */
export function queryChats(notebook, { search = '', sort = 'recentes' } = {}) {
  const termo = search.trim().toLocaleLowerCase('pt-BR');
  const lista = (notebook?.chats ?? []).filter(
    (c) => !termo || c.title.toLocaleLowerCase('pt-BR').includes(termo) || c.messages.some((m) => m.text.toLocaleLowerCase('pt-BR').includes(termo)),
  );
  const quando = (c) => c.updatedAt ?? c.createdAt;
  return lista.sort((a, b) => (sort === 'antigos' ? quando(a).localeCompare(quando(b)) : quando(b).localeCompare(quando(a))));
}

/** Prévia do chat: a última resposta do Delta, encurtada. */
export function chatPreview(chat, max = 110) {
  const ultima = [...(chat?.messages ?? [])].reverse().find((m) => m.role === 'delta');
  if (!ultima) return '';
  return ultima.text.length > max ? `${ultima.text.slice(0, max - 1)}…` : ultima.text;
}

/** "Hoje 19:12", "Ontem 08:30" ou "16/11 14:05". */
export function chatTime(iso, agora = new Date()) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dia = (x) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
  if (dia(d) === dia(agora)) return `Hoje ${hora}`;
  const ontem = new Date(agora);
  ontem.setDate(agora.getDate() - 1);
  if (dia(d) === dia(ontem)) return `Ontem ${hora}`;
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${hora}`;
}

/** Filtro, busca e ordenação usados pela tela. */
export function queryNotebooks(project, { filter = 'tudo', search = '', sort = 'recentes' } = {}) {
  const termo = search.trim().toLocaleLowerCase('pt-BR');
  const lista = listNotebooks(project).filter((n) => {
    if (filter === 'compartilhado' && !n.shared) return false;
    if (filter === 'apenas-voce' && n.shared) return false;
    return !termo || n.name.toLocaleLowerCase('pt-BR').includes(termo);
  });
  return lista.sort((a, b) => (sort === 'nome' ? a.name.localeCompare(b.name, 'pt-BR') : b.updatedAt.localeCompare(a.updatedAt)));
}

/** "agora", "há 5 min", "há 3 h", "ontem" ou a data. */
export function relativeTime(iso, agora = new Date()) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const seg = Math.max(0, Math.round((agora.getTime() - t) / 1000));
  if (seg < 60) return 'agora';
  if (seg < 3600) return `há ${Math.floor(seg / 60)} min`;
  if (seg < 86400) return `há ${Math.floor(seg / 3600)} h`;
  if (seg < 172800) return 'ontem';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}
