import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CATALOG } from './catalog.js';
import {
  addMember as addMemberFn,
  addSources,
  applyCapabilityRun,
  cancelTurbo as cancelTurboFn,
  can,
  checkEligibility,
  createEmptyState,
  createProject as createProjectFn,
  parseState,
  renameProject as renameProjectFn,
  selectedProject,
  serializeState,
  setReviewState,
  startTurbo,
  stepTurbo,
  updateProject,
} from '../domain/journey/journeyEngine.js';
import Toast from '../components/ui/Toast.jsx';
import {
  addNotebookCreation,
  continueNotebookChat,
  removeNotebookChat,
  startNotebookChat,
  addNotebookReferences,
  createNotebook as createNotebookFn,
  removeNotebook,
  renameNotebook as renameNotebookFn,
  setNotebookShared,
} from '../domain/journey/notebooks.js';

const STORAGE_KEY = 'jornada.v1';
const RUN_DELAY_MS = 650;
const TURBO_STEP_MS = 420;

const JourneyContext = createContext(null);

function storage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function loadState() {
  const raw = storage()?.getItem(STORAGE_KEY);
  return (raw && parseState(raw)) || createEmptyState();
}

/** Estado da Jornada Guiada no protótipo: projetos, fontes, revisões e execuções simuladas. */
export function JourneyProvider({ children }) {
  const [state, setState] = useState(loadState);
  const [pending, setPending] = useState({});
  const [viewer, setViewer] = useState(null);
  const [toast, setToast] = useState(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const timers = useRef(new Set());

  useEffect(() => {
    try {
      storage()?.setItem(STORAGE_KEY, serializeState(state));
    } catch {
      /* armazenamento cheio ou bloqueado: o protótipo segue em memória */
    }
  }, [state]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const later = useCallback((fn, ms) => {
    const t = window.setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  }, []);

  const notify = useCallback((message) => setToast({ id: Date.now() + Math.random(), message }), []);
  const project = selectedProject(state);
  // O papel vem da identidade autenticada no projeto (sem seletor na interface); quem cria é Administrador.
  const role = project?.members?.find((m) => m.id === 'usr-001')?.role ?? 'Administrador';
  const roleRef = useRef(role);
  roleRef.current = role;

  const patchProject = useCallback((fn) => {
    setState((s) => (s.selectedProjectId ? updateProject(s, s.selectedProjectId, fn) : s));
  }, []);

  const createProject = useCallback(
    (name, description) => {
      try {
        setState((s) => createProjectFn(s, { name, description }));
        notify(`Projeto criado no Contexto: ${name}.`);
        return true;
      } catch (e) {
        notify(e.message);
        return false;
      }
    },
    [notify],
  );

  const selectProject = useCallback((projectId) => setState((s) => ({ ...s, selectedProjectId: projectId })), []);

  const renameProject = useCallback(
    (name) => {
      patchProject((p) => renameProjectFn(p, name));
      notify('Nome do projeto atualizado. O identificador e o código não mudam.');
    },
    [patchProject, notify],
  );

  const addMember = useCallback((name, memberRole) => patchProject((p) => addMemberFn(p, { name, role: memberRole })), [patchProject]);

  const uploadFiles = useCallback(
    (fileList) => {
      const files = [...fileList].map((f) => ({ name: f.name, size: f.size, type: f.type }));
      if (!files.length) return;
      patchProject((p) => addSources(p, files));
      notify(`${files.length} fonte(s) enviada(s) ao lote do projeto.`);
    },
    [patchProject, notify],
  );

  const aFiles = (lista) => [...(lista ?? [])].map((f) => ({ name: f.name, size: f.size, type: f.type }));

  /** Cria um notebook no projeto; arquivos entram também no lote de fontes. Devolve o id criado (ou null). */
  const createNotebook = useCallback(
    (name, { files, links = [] } = {}) => {
      if (!String(name ?? '').trim()) return null;
      const atual = selectedProject(stateRef.current);
      if (!atual) return null;
      const arquivos = aFiles(files);
      const { notebookId } = createNotebookFn(atual, { name, files: arquivos, links });
      patchProject((p) => createNotebookFn(p, { name, files: arquivos, links }).project);
      const extra = arquivos.length ? ` ${arquivos.length} arquivo(s) também entraram nas fontes do lote.` : '';
      notify(`Notebook “${String(name).trim()}” criado no projeto ${atual.code}.${extra}`);
      return notebookId;
    },
    [patchProject, notify],
  );

  const addToNotebook = useCallback(
    (notebookId, { files, links = [] } = {}) => {
      const arquivos = aFiles(files);
      if (!arquivos.length && !links.length) return;
      patchProject((p) => addNotebookReferences(p, notebookId, { files: arquivos, links }));
      notify(`${arquivos.length + links.length} referência(s) adicionada(s) ao caderno.`);
    },
    [patchProject, notify],
  );

  const toggleNotebookShared = useCallback(
    (notebookId) =>
      patchProject((p) => {
        const nb = (p.notebooks ?? []).find((n) => n.id === notebookId);
        return nb ? setNotebookShared(p, notebookId, !nb.shared) : p;
      }),
    [patchProject],
  );

  const deleteNotebook = useCallback((notebookId) => patchProject((p) => removeNotebook(p, notebookId)), [patchProject]);
  const renameNotebook = useCallback((notebookId, name) => patchProject((p) => renameNotebookFn(p, notebookId, name)), [patchProject]);
  /** Inicia uma conversa com o Delta no notebook; devolve o id do chat criado. */
  const startChat = useCallback(
    (notebookId, text) => {
      const atual = selectedProject(stateRef.current);
      if (!atual) return null;
      const { chatId } = startNotebookChat(atual, notebookId, text);
      if (chatId) patchProject((p) => startNotebookChat(p, notebookId, text).project);
      return chatId;
    },
    [patchProject],
  );
  const continueChat = useCallback((notebookId, chatId, text) => patchProject((p) => continueNotebookChat(p, notebookId, chatId, text)), [patchProject]);
  const deleteChat = useCallback((notebookId, chatId) => patchProject((p) => removeNotebookChat(p, notebookId, chatId)), [patchProject]);
  const createNotebookArtifact = useCallback(
    (notebookId, kind) => {
      patchProject((p) => addNotebookCreation(p, notebookId, kind));
      notify('Criação simulada adicionada ao caderno.');
    },
    [patchProject, notify],
  );

  const runCapability = useCallback(
    (capabilityId, scopeKey = 'projeto') => {
      const key = `${capabilityId}::${scopeKey}`;
      const atual = selectedProject(stateRef.current);
      const elig = checkEligibility(atual, CATALOG, capabilityId, scopeKey);
      if (!elig.ok) {
        notify(elig.code === 'projeto_nao_definido' ? `422 projeto_nao_definido — ${elig.reason}` : elig.reason);
        return;
      }
      setPending((p) => ({ ...p, [key]: true }));
      later(() => {
        setPending((p) => {
          const { [key]: _omit, ...resto } = p;
          return resto;
        });
        try {
          patchProject((p) => applyCapabilityRun(p, CATALOG, capabilityId, { scopeKey }));
          const cap = CATALOG.byId.get(capabilityId);
          notify(`${cap?.title ?? capabilityId} gerado (simulado).`);
        } catch (e) {
          notify(e.message);
        }
      }, RUN_DELAY_MS);
    },
    [later, notify, patchProject],
  );

  const runTurbo = useCallback(
    (phase, { failAt = null } = {}) => {
      const atual = selectedProject(stateRef.current);
      if (!atual) return;
      const comRun = startTurbo(atual, CATALOG, phase, { failAt });
      const runId = comRun.runs[0].runId;
      patchProject(() => comRun);
      notify('Modo Turbo iniciado (execução simulada).');
      const passo = () => {
        let terminou = false;
        setState((s) => {
          const p = selectedProject(s);
          if (!p || p.projectId !== atual.projectId) {
            terminou = true;
            return s;
          }
          const r = stepTurbo(p, CATALOG, runId);
          terminou = r.done;
          return updateProject(s, p.projectId, () => r.project);
        });
        later(() => {
          const run = selectedProject(stateRef.current)?.runs.find((x) => x.runId === runId);
          if (run && run.status === 'running') passo();
          else if (run) notify(`Modo Turbo terminou: ${run.status}.`);
        }, terminou ? 0 : TURBO_STEP_MS);
      };
      later(passo, TURBO_STEP_MS);
    },
    [later, notify, patchProject],
  );

  const cancelTurbo = useCallback((runId) => patchProject((p) => cancelTurboFn(p, runId)), [patchProject]);

  const setReview = useCallback(
    (capabilityId, scopeKey, revision, reviewState) => {
      try {
        patchProject((p) => setReviewState(p, capabilityId, scopeKey, revision, reviewState, roleRef.current));
        notify(`Revisão marcada como "${reviewState}". Nada é bloqueado por isso.`);
      } catch (e) {
        notify(e.message);
      }
    },
    [patchProject, notify],
  );

  const resetJourney = useCallback(() => {
    setState(createEmptyState());
    setViewer(null);
    notify('Dados da jornada apagados deste navegador.');
  }, [notify]);

  const openArtifact = useCallback((capabilityId, scopeKey = 'projeto', revision = null) => setViewer({ capabilityId, scopeKey, revision }), []);
  const closeArtifact = useCallback(() => setViewer(null), []);

  const value = useMemo(
    () => ({
      catalog: CATALOG,
      state,
      project,
      role,
      can: (action) => can(role, action),
      pending,
      viewer,
      createProject,
      selectProject,
      renameProject,
      addMember,
      uploadFiles,
      createNotebook,
      addToNotebook,
      toggleNotebookShared,
      deleteNotebook,
      renameNotebook,
      startChat,
      continueChat,
      deleteChat,
      createNotebookArtifact,
      runCapability,
      runTurbo,
      cancelTurbo,
      setReview,
      resetJourney,
      openArtifact,
      closeArtifact,
      notify,
    }),
    [state, project, role, pending, viewer, createProject, selectProject, renameProject, addMember, uploadFiles, createNotebook, addToNotebook, toggleNotebookShared, deleteNotebook, renameNotebook, startChat, continueChat, deleteChat, createNotebookArtifact, runCapability, runTurbo, cancelTurbo, setReview, resetJourney, openArtifact, closeArtifact, notify],
  );

  const clearToast = useCallback(() => setToast(null), []);

  return (
    <JourneyContext.Provider value={value}>
      {children}
      <Toast toast={toast} onDone={clearToast} />
    </JourneyContext.Provider>
  );
}

export function useJourney() {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error('useJourney precisa estar dentro de <JourneyProvider>.');
  return ctx;
}

export function useOptionalJourney() {
  return useContext(JourneyContext);
}
