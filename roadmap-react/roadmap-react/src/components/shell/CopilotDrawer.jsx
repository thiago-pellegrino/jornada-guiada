import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildCopilotInsights,
  computeScenarioFingerprint,
  applyScenarioPatch,
} from '../../domain/simulationEngine.js';
import Icon, { CopilotMark } from '../ui/Icon.jsx';

const KEYWORDS = [
  { id: 'bottleneck', pattern: /gargal|atras|pior|lent/ },
  { id: 'headcount', pattern: /profission|pessoa|headcount|contrat|time|equipe|dev/ },
  { id: 'freeze-delivery', pattern: /freez|17\/12|congel|entreg|quanto/ },
  { id: 'mode-compare', pattern: /modo|modal|contínu|continu|inteir|compar/ },
];

const INITIAL_FOLDERS = [
  { id: 'f-planejamento', name: 'Planejamento & Capacity', open: true },
  { id: 'f-contexto', name: 'Contexto & Upstream', open: true },
  { id: 'f-darklab', name: 'Darklab & Discovery', open: true },
  { id: 'f-backlog', name: 'Backlog & Projetos', open: true },
];

const INITIAL_CHATS = [
  {
    id: 'c-gargalos',
    folderId: 'f-planejamento',
    title: 'Diagnóstico e Freezing',
    updatedAt: 'Agora',
    messages: [],
  },
  {
    id: 'c-modos',
    folderId: 'f-planejamento',
    title: 'Comparativo Fluxo × C2',
    updatedAt: 'Hoje',
    messages: [],
  },
  {
    id: 'c-fontes',
    folderId: 'f-contexto',
    title: 'Análise de fontes e lotes',
    updatedAt: 'Hoje',
    messages: [],
  },
  {
    id: 'c-motores',
    folderId: 'f-darklab',
    title: 'Motores M1–M7 · Síntese',
    updatedAt: 'Ontem',
    messages: [],
  },
  {
    id: 'c-epicos',
    folderId: 'f-backlog',
    title: 'Épicos, Features e US',
    updatedAt: 'Ontem',
    messages: [],
  },
];

function normalize(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1).replace('.', ',')} KB`;
  return `${(kb / 1024).toFixed(2).replace('.', ',')} MB`;
}

function formatDuration(seconds) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

function extractSpeechText(message) {
  if (!message) return '';
  if (message.kind === 'insight' && message.insight) {
    return [message.insight.title, ...(message.insight.paragraphs || []), ...(message.insight.bullets || [])].join('. ');
  }
  if (message.kind === 'proposal' && message.proposal) {
    return `Proposta de ação: ${message.proposal.title}. ${message.proposal.summary}`;
  }
  return message.text || '';
}

let seq = 10;
const nextId = (prefix = 'm') => {
  seq += 1;
  return `${prefix}${seq}`;
};

/**
 * Painel do Agente de IA Delta (50% da largura da tela, sobreposto à página carregada):
 * inclui menu lateral esquerdo com pastas e chats, área de conversação, upload de arquivos
 * e áudio conversacional (entrada por voz/ditado + síntese de voz pt-BR).
 */
export default function CopilotDrawer({ open, onClose, scenario, result, onApplyPatch, onUndo, panelRef }) {
  const [folders, setFolders] = useState(INITIAL_FOLDERS);
  const [chats, setChats] = useState(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState(INITIAL_CHATS[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [navQuery, setNavQuery] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  // Estado de áudio conversacional (gravação/ditado e resposta por voz)
  const [voiceMode, setVoiceMode] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);

  const logEndRef = useRef(null);
  const closeRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const recordSecondsRef = useRef(0);
  const draftRef = useRef('');
  draftRef.current = draft;

  const activeChat = useMemo(() => chats.find((c) => c.id === activeChatId) || chats[0], [chats, activeChatId]);
  const activeFolder = useMemo(
    () => folders.find((f) => f.id === activeChat?.folderId) || folders[0],
    [folders, activeChat],
  );
  const messages = activeChat?.messages || [];

  const fingerprint = useMemo(() => computeScenarioFingerprint(scenario), [scenario]);
  const bundle = useMemo(() => (open ? buildCopilotInsights(scenario, result) : null), [open, scenario, result]);

  useEffect(() => {
    if (open) closeRef.current?.focus();
    else {
      stopListening(false);
      stopSpeaking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length, activeChatId]);

  useEffect(() => {
    if (!isListening) {
      setRecordSeconds(0);
      recordSecondsRef.current = 0;
      return undefined;
    }
    const timer = window.setInterval(() => {
      setRecordSeconds((prev) => {
        const next = prev + 1;
        recordSecondsRef.current = next;
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isListening]);

  function speakText(msgId, text) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.04;
      utterance.onstart = () => setSpeakingMsgId(msgId);
      utterance.onend = () => setSpeakingMsgId((current) => (current === msgId ? null : current));
      utterance.onerror = () => setSpeakingMsgId(null);
      setSpeakingMsgId(msgId);
      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeakingMsgId(null);
    }
  }

  function stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* sem suporte */
      }
    }
    setSpeakingMsgId(null);
  }

  function toggleSpeakMessage(message) {
    if (speakingMsgId === message.id) {
      stopSpeaking();
      return;
    }
    speakText(message.id, extractSpeechText(message));
  }

  function appendMessagesToActiveChat(newItems, maybeTitleHint) {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== activeChat.id) return chat;
        const isFreshNewChat = chat.messages.length === 0 && chat.title.startsWith('Novo chat');
        const nextTitle =
          isFreshNewChat && maybeTitleHint
            ? maybeTitleHint.slice(0, 36) + (maybeTitleHint.length > 36 ? '…' : '')
            : chat.title;
        return {
          ...chat,
          title: nextTitle,
          updatedAt: 'Agora',
          messages: [...chat.messages, ...newItems],
        };
      }),
    );

    const lastAssistant = [...newItems].reverse().find((item) => item.role === 'assistant');
    if (lastAssistant && (voiceMode || autoSpeak) && lastAssistant.autoSpeak) {
      speakText(lastAssistant.id, extractSpeechText(lastAssistant));
    }
  }

  function handleCreateChat(targetFolderId) {
    const folderId = targetFolderId || activeFolder?.id || folders[0].id;
    const newChat = {
      id: nextId('c-'),
      folderId,
      title: 'Novo chat',
      updatedAt: 'Agora',
      messages: [],
    };
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, open: true } : f)));
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  }

  function handleDeleteChat(event, chatId) {
    event.stopPropagation();
    if (chats.length <= 1) return;
    const remaining = chats.filter((c) => c.id !== chatId);
    setChats(remaining);
    if (activeChatId === chatId) {
      setActiveChatId(remaining[0].id);
    }
  }

  function handleCreateFolder(event) {
    event.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    const folder = { id: nextId('f-'), name: trimmed, open: true };
    const initialChat = {
      id: nextId('c-'),
      folderId: folder.id,
      title: 'Novo chat',
      updatedAt: 'Agora',
      messages: [],
    };
    setFolders((prev) => [...prev, folder]);
    setChats((prev) => [initialChat, ...prev]);
    setActiveChatId(initialChat.id);
    setNewFolderName('');
    setCreatingFolder(false);
  }

  function toggleFolder(folderId) {
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, open: !f.open } : f)));
  }

  async function processFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const processed = await Promise.all(
      files.map(async (file) => {
        const ext = (file.name.split('.').pop() || 'arq').toUpperCase();
        let preview = '';
        if (
          file.size <= 250 * 1024 &&
          /\.(txt|md|csv|json|html)$/i.test(file.name)
        ) {
          try {
            const raw = await file.text();
            preview = raw.slice(0, 320).trim();
          } catch {
            preview = '';
          }
        }
        return {
          id: nextId('att-'),
          name: file.name,
          size: file.size,
          sizeLabel: formatBytes(file.size),
          ext,
          preview,
        };
      }),
    );
    setAttachments((prev) => [...prev, ...processed]);
  }

  function handleFileChange(event) {
    processFiles(event.target.files);
    event.target.value = '';
  }

  function removeAttachment(attId) {
    setAttachments((prev) => prev.filter((item) => item.id !== attId));
  }

  function startListening() {
    stopSpeaking();
    setIsListening(true);
    setVoiceMode(true);

    const SpeechRecognition =
      typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.onresult = (event) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i += 1) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript.trim()) {
            setDraft(transcript.trim());
          }
        };
        recognition.onerror = () => {
          /* mantém gravação visual ativa caso o navegador bloqueie o microfone */
        };
        recognition.start();
        recognitionRef.current = recognition;
      } catch {
        recognitionRef.current = null;
      }
    }
  }

  function stopListening(shouldSend = false) {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
    const elapsed = Math.max(1, recordSecondsRef.current);
    setIsListening(false);

    if (shouldSend) {
      const spokenText =
        draftRef.current.trim() ||
        'Qual squad é o gargalo do roadmap e quanto do escopo entregamos até o Freezing?';
      setDraft('');
      submitTurn({
        text: spokenText,
        files: attachments,
        voiceMeta: { durationLabel: formatDuration(elapsed) },
      });
      setAttachments([]);
    }
  }

  function ask(insightId, questionText, options = {}) {
    if (!bundle) return;
    const insight = bundle.insights.find((item) => item.id === insightId);
    if (!insight) return;
    const userMsg = {
      id: nextId(),
      role: 'user',
      text: questionText || insight.question,
      attachments: options.files || [],
      voiceMeta: options.voiceMeta || null,
    };
    const assistantMsg = {
      id: nextId(),
      role: 'assistant',
      kind: 'insight',
      insight,
      autoSpeak: Boolean(options.voiceMeta || voiceMode),
    };
    appendMessagesToActiveChat([userMsg, assistantMsg], userMsg.text);
  }

  function propose(proposalId, questionText, options = {}) {
    if (!bundle) return;
    const proposal = bundle.proposals.find((item) => item.id === proposalId);
    const userMsg = {
      id: nextId(),
      role: 'user',
      text: questionText || proposal?.title || 'Preparar proposta',
      attachments: options.files || [],
      voiceMeta: options.voiceMeta || null,
    };
    const assistantMsg = proposal
      ? {
          id: nextId(),
          role: 'assistant',
          kind: 'proposal',
          proposal,
          status: 'pending',
          autoSpeak: Boolean(options.voiceMeta || voiceMode),
        }
      : {
          id: nextId(),
          role: 'assistant',
          kind: 'text',
          text: 'Não há ajuste necessário para este pedido no cenário atual.',
          autoSpeak: Boolean(options.voiceMeta || voiceMode),
        };
    appendMessagesToActiveChat([userMsg, assistantMsg], userMsg.text);
  }

  function updateMessage(id, patch) {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id !== activeChat.id
          ? chat
          : {
              ...chat,
              messages: chat.messages.map((message) => (message.id === id ? { ...message, ...patch } : message)),
            },
      ),
    );
  }

  function confirm(message) {
    const { proposal } = message;
    const appliedFingerprint = computeScenarioFingerprint(applyScenarioPatch(scenario, proposal.patch));
    onApplyPatch(proposal.patch, `Delta: ${proposal.title}`);
    updateMessage(message.id, { status: 'applied', appliedFingerprint });
  }

  function recalc(message) {
    const fresh = bundle?.proposals.find((item) => item.id === message.proposal.id);
    if (fresh) updateMessage(message.id, { proposal: fresh, status: 'pending' });
    else updateMessage(message.id, { status: 'obsolete' });
  }

  function buildAttachmentAnalysis(files, userPrompt) {
    const names = files.map((f) => `${f.name} (${f.sizeLabel})`).join(', ');
    const { kpis } = result;
    const previewSnippet = files.find((f) => f.preview)?.preview;
    const lines = [
      `Recebi ${files.length === 1 ? 'o arquivo anexado' : `os ${files.length} arquivos anexados`}: ${names}.`,
      `No contexto atual da pasta "${activeFolder?.name}" (${kpis.totalFeatures} features, ${kpis.totalStories} histórias e ${scenario.squads.length} squads ativas), o material foi indexado localmente na sessão do chat "${activeChat?.title}".`,
    ];
    if (previewSnippet) {
      lines.push(`Trecho identificado no arquivo: "${previewSnippet.slice(0, 140)}${previewSnippet.length > 140 ? '…' : ''}".`);
    }
    if (userPrompt) {
      lines.push(`Sobre o seu pedido ("${userPrompt}"): posso cruzar os itens deste arquivo com o gargalo atual ou preparar uma proposta de balanceamento das squads.`);
    } else {
      lines.push('Você pode pedir para cruzar este documento com o escopo das squads, gerar épicos/histórias ou simular o impacto no Freezing.');
    }
    return lines.join(' ');
  }

  function submitTurn({ text, files = [], voiceMeta = null }) {
    const cleanText = text.trim();
    if (!cleanText && !files.length) return;

    const norm = normalize(cleanText);
    if (files.length && !cleanText) {
      const userMsg = {
        id: nextId(),
        role: 'user',
        text: `Analisar ${files.length === 1 ? 'arquivo enviado' : `${files.length} arquivos enviados`}`,
        attachments: files,
        voiceMeta,
      };
      const assistantMsg = {
        id: nextId(),
        role: 'assistant',
        kind: 'text',
        text: buildAttachmentAnalysis(files, ''),
        autoSpeak: Boolean(voiceMeta || voiceMode),
      };
      appendMessagesToActiveChat([userMsg, assistantMsg], files[0].name);
      return;
    }

    if (/balance|propost|ajust|resolver|otimiz/.test(norm) && bundle?.proposals.length) {
      propose(bundle.proposals[0].id, cleanText, { files, voiceMeta });
      return;
    }
    const match = KEYWORDS.find((entry) => entry.pattern.test(norm));
    if (match && !files.length) {
      ask(match.id, cleanText, { files, voiceMeta });
      return;
    }

    const replyText = files.length
      ? buildAttachmentAnalysis(files, cleanText)
      : 'Posso responder por texto ou voz sobre gargalos, profissionais necessários, entregas até o Freezing, analisar arquivos anexados neste chat ou preparar uma proposta de balanceamento.';

    const userMsg = {
      id: nextId(),
      role: 'user',
      text: cleanText,
      attachments: files,
      voiceMeta,
    };
    const assistantMsg = {
      id: nextId(),
      role: 'assistant',
      kind: 'text',
      text: replyText,
      autoSpeak: Boolean(voiceMeta || voiceMode),
    };
    appendMessagesToActiveChat([userMsg, assistantMsg], cleanText);
  }

  function onSubmit(event) {
    event.preventDefault();
    if (isListening) {
      stopListening(true);
      return;
    }
    if (!draft.trim() && !attachments.length) return;
    const currentDraft = draft;
    const currentFiles = attachments;
    setDraft('');
    setAttachments([]);
    submitTurn({ text: currentDraft, files: currentFiles });
  }

  const normalizedQuery = normalize(navQuery.trim());

  return (
    <aside
      id="copilot-panel"
      ref={panelRef}
      className={`copilot ${open ? 'is-open' : ''} ${sidebarOpen ? 'has-sidebar' : ''}`}
      aria-labelledby="copilot-title"
      hidden={!open}
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        if (event.dataTransfer?.files?.length) {
          processFiles(event.dataTransfer.files);
        }
      }}
    >
      <div className="copilot__workspace">
        {/* Menu lateral esquerdo: Logo Delta, Pastas e Chats */}
        <nav
          className={`copilot__sidebar ${sidebarOpen ? 'is-open' : 'is-collapsed'}`}
          aria-label="Pastas e histórico de chats do Delta"
          hidden={!sidebarOpen}
        >
          <div className="copilot-nav__brand">
            <span className="copilot__emblem" aria-hidden="true">
              <CopilotMark size={20} />
            </span>
            <div className="copilot-nav__brand-text">
              <div className="copilot__title-row">
                <h2 id="copilot-title">Delta</h2>
                <span className="copilot__agent-pill">Agente IA</span>
              </div>
              <p>Seu apoio em cada rotina</p>
            </div>
          </div>

          <div className="copilot-nav__top">
            <button
              type="button"
              className="btn btn--sm btn--primary copilot-nav__new-btn"
              onClick={() => handleCreateChat(activeFolder?.id)}
            >
              <Icon name="plus" size={14} />
              Novo chat
            </button>
            <button
              type="button"
              className="icon-btn copilot-nav__folder-btn"
              onClick={() => setCreatingFolder((v) => !v)}
              aria-label="Criar nova pasta"
              title="Criar nova pasta"
            >
              <Icon name="folderPlus" size={15} />
            </button>
          </div>

          {creatingFolder ? (
            <form className="copilot-nav__new-folder" onSubmit={handleCreateFolder}>
              <input
                type="text"
                className="input input--sm"
                placeholder="Nome da pasta…"
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn--sm btn--primary">
                Criar
              </button>
            </form>
          ) : null}

          <div className="copilot-nav__search">
            <Icon name="search" size={13} />
            <input
              type="search"
              placeholder="Buscar pasta ou chat…"
              value={navQuery}
              onChange={(event) => setNavQuery(event.target.value)}
              aria-label="Buscar pasta ou chat"
            />
          </div>

          <div className="copilot-nav__tree">
            <span className="copilot-nav__section-label">Pastas e Conversas</span>
            {folders.map((folder) => {
              const folderChats = chats.filter((chat) => {
                if (chat.folderId !== folder.id) return false;
                if (!normalizedQuery) return true;
                return (
                  normalize(chat.title).includes(normalizedQuery) ||
                  normalize(folder.name).includes(normalizedQuery)
                );
              });
              if (normalizedQuery && !folderChats.length && !normalize(folder.name).includes(normalizedQuery)) {
                return null;
              }
              return (
                <div key={folder.id} className="copilot-folder">
                  <div className="copilot-folder__header">
                    <button
                      type="button"
                      className="copilot-folder__toggle"
                      onClick={() => toggleFolder(folder.id)}
                      aria-expanded={folder.open}
                    >
                      <Icon
                        name="chevronRight"
                        size={12}
                        className={`copilot-folder__chevron ${folder.open ? 'is-open' : ''}`}
                      />
                      <Icon name="folder" size={14} className="copilot-folder__icon" />
                      <span className="copilot-folder__name">{folder.name}</span>
                      <span className="copilot-folder__count tabular">{folderChats.length}</span>
                    </button>
                    <button
                      type="button"
                      className="copilot-folder__add"
                      onClick={() => handleCreateChat(folder.id)}
                      aria-label={`Novo chat em ${folder.name}`}
                      title={`Novo chat em ${folder.name}`}
                    >
                      <Icon name="plus" size={12} />
                    </button>
                  </div>

                  {folder.open ? (
                    <ul className="copilot-folder__chats">
                      {folderChats.map((chat) => {
                        const isSelected = chat.id === activeChat?.id;
                        return (
                          <li key={chat.id}>
                            <div
                              role="button"
                              tabIndex={0}
                              className={`copilot-chat-item ${isSelected ? 'is-active' : ''}`}
                              onClick={() => setActiveChatId(chat.id)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  setActiveChatId(chat.id);
                                }
                              }}
                            >
                              <Icon name="chat" size={13} className="copilot-chat-item__icon" />
                              <span className="copilot-chat-item__title">{chat.title}</span>
                              {chat.messages.length > 0 ? (
                                <span className="copilot-chat-item__badge tabular">{chat.messages.length}</span>
                              ) : null}
                              {chats.length > 1 ? (
                                <button
                                  type="button"
                                  className="copilot-chat-item__delete"
                                  onClick={(event) => handleDeleteChat(event, chat.id)}
                                  aria-label={`Excluir chat ${chat.title}`}
                                  title="Excluir chat"
                                >
                                  <Icon name="trash" size={12} />
                                </button>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Coluna principal de interação com o agente */}
        <div className="copilot__main">
          <header className="copilot__head copilot__head--context">
            <button
              type="button"
              className={`icon-btn ${sidebarOpen ? 'is-active' : ''}`}
              onClick={() => setSidebarOpen((v) => !v)}
              aria-expanded={sidebarOpen}
              aria-label={sidebarOpen ? 'Recolher menu de pastas e chats' : 'Abrir menu de pastas e chats'}
              title={sidebarOpen ? 'Recolher pastas e chats' : 'Abrir pastas e chats'}
            >
              <Icon name="sidebar" size={16} />
            </button>

            <div className="copilot__context-top">
              <span className="copilot__context-label">Contexto ativo</span>
              <span className="copilot__context-path">
                Gestão de Portfólio › Jornada Guiada · {activeFolder?.name} › <strong>{activeChat?.title}</strong>
              </span>
            </div>

            <button ref={closeRef} type="button" className="icon-btn" onClick={onClose} aria-label="Fechar Delta">
              <Icon name="close" size={18} />
            </button>
          </header>

          {isListening || speakingMsgId ? (
            <div className={`copilot-voice-bar ${isListening ? 'is-listening' : ''} ${speakingMsgId ? 'is-speaking' : ''}`}>
              <div className="copilot-voice-bar__orb" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="copilot-voice-bar__info">
                <strong>
                  {isListening
                    ? `Ouvindo você… (${formatDuration(recordSeconds)})`
                    : speakingMsgId
                      ? 'Delta respondendo por voz…'
                      : 'Modo de Áudio Conversacional ativo'}
                </strong>
                <span>
                  {isListening
                    ? 'Fale sua dúvida ou comando; clique em Enviar voz para concluir.'
                    : speakingMsgId
                      ? 'Síntese de voz pt-BR em reprodução.'
                      : 'Clique em Falar para conversar por voz ou ouça as respostas automaticamente.'}
                </span>
              </div>
              <div className="copilot-voice-bar__actions">
                {isListening ? (
                  <button type="button" className="btn btn--sm btn--primary" onClick={() => stopListening(true)}>
                    <Icon name="send" size={13} />
                    Enviar voz
                  </button>
                ) : (
                  <button type="button" className="btn btn--sm btn--primary" onClick={startListening}>
                    <Icon name="mic" size={14} />
                    Falar
                  </button>
                )}
                {speakingMsgId ? (
                  <button type="button" className="btn btn--sm" onClick={stopSpeaking}>
                    <Icon name="stop" size={13} />
                    Parar voz
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`btn btn--sm ${autoSpeak ? 'is-selected' : ''}`}
                    onClick={() => setAutoSpeak((v) => !v)}
                    aria-pressed={autoSpeak}
                    title="Ativar ou desativar leitura automática das respostas em voz alta"
                  >
                    <Icon name="volume" size={14} />
                    {autoSpeak ? 'Auto-voz ON' : 'Auto-voz OFF'}
                  </button>
                )}
              </div>
            </div>
          ) : null}

          <div className="copilot__body">
            <div className="copilot__welcome">
              <p>
                Organize suas conversas em pastas, envie documentos para análise contextual, interaja por áudio conversacional ou peça simulações e propostas confirmáveis sobre o roadmap.
              </p>
            </div>

            {bundle ? (
              <div className="copilot__suggestions" aria-label="Sugestões">
                {bundle.insights.map((insight) => (
                  <button key={insight.id} type="button" className="suggestion" onClick={() => ask(insight.id)}>
                    {insight.question}
                    <Icon name="chevronRight" size={14} />
                  </button>
                ))}
                {bundle.proposals.map((proposal) => (
                  <button key={proposal.id} type="button" className="suggestion suggestion--action" onClick={() => propose(proposal.id)}>
                    <Icon name="wand" size={15} />
                    Preparar: {proposal.title}
                  </button>
                ))}
              </div>
            ) : null}

            <ol className="copilot__log" role="log" aria-live="polite" aria-label="Conversa com o Delta">
              {messages.map((message) => {
                if (message.role === 'user') {
                  return (
                    <li key={message.id} className="msg msg--user">
                      {message.voiceMeta ? (
                        <div className="msg__voice-tag">
                          <Icon name="voice" size={13} />
                          <span>Áudio conversacional · {message.voiceMeta.durationLabel}</span>
                        </div>
                      ) : null}
                      {message.attachments?.length ? (
                        <ul className="msg__attachments" aria-label="Arquivos enviados">
                          {message.attachments.map((att) => (
                            <li key={att.id} className="msg__attachment-chip">
                              <Icon name="fileText" size={13} />
                              <span className="msg__attachment-name">{att.name}</span>
                              <span className="msg__attachment-meta">{att.sizeLabel}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <div>{message.text}</div>
                    </li>
                  );
                }

                const isSpeakingThis = speakingMsgId === message.id;
                const voiceAction = (
                  <button
                    type="button"
                    className={`msg__speak-btn ${isSpeakingThis ? 'is-speaking' : ''}`}
                    onClick={() => toggleSpeakMessage(message)}
                    aria-label={isSpeakingThis ? 'Parar leitura em voz alta' : 'Ouvir resposta em voz alta'}
                    title={isSpeakingThis ? 'Parar leitura' : 'Ouvir resposta'}
                  >
                    <Icon name={isSpeakingThis ? 'stop' : 'volume'} size={13} />
                    <span>{isSpeakingThis ? 'Falando…' : 'Ouvir'}</span>
                  </button>
                );

                if (message.kind === 'insight') {
                  const { insight } = message;
                  return (
                    <li key={message.id} className="msg msg--assistant">
                      <div className="msg__head">
                        <strong className="msg__title">{insight.title}</strong>
                        {voiceAction}
                      </div>
                      {insight.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                      {insight.bullets.length ? (
                        <ul>
                          {insight.bullets.map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                }
                if (message.kind === 'proposal') {
                  const { proposal, status } = message;
                  const stale = status === 'pending' && proposal.contextFingerprint !== fingerprint;
                  const canUndoBatch = status === 'applied' && message.appliedFingerprint === fingerprint;
                  return (
                    <li key={message.id} className="msg msg--assistant">
                      <div className="proposal-card">
                        <div className="msg__head">
                          <span className="proposal-card__kicker">Proposta de ação</span>
                          {voiceAction}
                        </div>
                        <strong className="proposal-card__title">{proposal.title}</strong>
                        <p>{proposal.summary}</p>
                        <ul className="proposal-card__changes">
                          {proposal.changes.map((change) => (
                            <li key={change.label}>
                              <span>{change.label}</span>
                              <span className="tabular">
                                {change.from} → <strong>{change.to}</strong>
                              </span>
                            </li>
                          ))}
                        </ul>
                        {stale ? (
                          <div className="cp-stale" role="alert">
                            <Icon name="warning" size={15} />
                            O cenário mudou depois desta proposta. Recalcule antes de confirmar.
                          </div>
                        ) : null}
                        {status === 'pending' ? (
                          <div className="proposal-card__actions">
                            {stale ? (
                              <button type="button" className="btn btn--sm btn--primary" onClick={() => recalc(message)}>
                                Recalcular proposta
                              </button>
                            ) : (
                              <button type="button" className="btn btn--sm btn--primary" onClick={() => confirm(message)}>
                                <Icon name="check" size={15} /> Confirmar
                              </button>
                            )}
                            <button type="button" className="btn btn--sm btn--link" onClick={() => updateMessage(message.id, { status: 'discarded' })}>
                              Descartar
                            </button>
                          </div>
                        ) : null}
                        {status === 'applied' ? (
                          <div className="proposal-done" role="status">
                            <Icon name="check" size={15} /> Proposta aplicada na simulação.
                            {canUndoBatch ? (
                              <button
                                type="button"
                                className="btn btn--sm btn--link"
                                onClick={() => {
                                  onUndo();
                                  updateMessage(message.id, { status: 'undone' });
                                }}
                              >
                                Desfazer lote
                              </button>
                            ) : (
                              <span className="proposal-done__hint"> Para reverter, use Desfazer no cenário.</span>
                            )}
                          </div>
                        ) : null}
                        {status === 'undone' ? <div className="proposal-done is-cancelled">Lote desfeito. O cenário voltou ao estado anterior.</div> : null}
                        {status === 'discarded' ? <div className="proposal-done is-cancelled">Proposta descartada.</div> : null}
                        {status === 'obsolete' ? <div className="proposal-done is-cancelled">Não há mais ajuste necessário com o cenário atual.</div> : null}
                      </div>
                    </li>
                  );
                }
                return (
                  <li key={message.id} className="msg msg--assistant">
                    <div className="msg__head">
                      <strong className="msg__title">Delta</strong>
                      {voiceAction}
                    </div>
                    <p>{message.text}</p>
                  </li>
                );
              })}
              <li ref={logEndRef} aria-hidden="true" className="copilot__log-end" />
            </ol>
          </div>

          <form className={`copilot__composer ${dragOver ? 'is-dragover' : ''}`} onSubmit={onSubmit}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="visually-hidden"
              accept=".pdf,.docx,.xlsx,.pptx,.csv,.txt,.md,.json,.html,.png,.jpg,.jpeg"
              onChange={handleFileChange}
            />

            {attachments.length > 0 ? (
              <div className="copilot__attachments" aria-label="Arquivos prontos para envio">
                {attachments.map((att) => (
                  <span key={att.id} className="copilot-attachment-pill">
                    <Icon name="fileText" size={13} />
                    <span className="copilot-attachment-pill__name">{att.name}</span>
                    <span className="copilot-attachment-pill__size">{att.sizeLabel}</span>
                    <button
                      type="button"
                      className="copilot-attachment-pill__remove"
                      onClick={() => removeAttachment(att.id)}
                      aria-label={`Remover anexo ${att.name}`}
                    >
                      <Icon name="close" size={11} />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}

            <div className="copilot__composer-row">
              <div className="copilot__composer-tools">
                <button
                  type="button"
                  className="icon-btn copilot__tool-btn"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Fazer upload de arquivo na IA"
                  title="Upload de arquivo (PDF, XLSX, DOCX, CSV, JSON, MD…)"
                >
                  <Icon name="paperclip" size={16} />
                </button>
                <button
                  type="button"
                  className={`icon-btn copilot__tool-btn ${isListening ? 'is-recording' : ''}`}
                  onClick={() => (isListening ? stopListening(true) : startListening())}
                  aria-pressed={isListening}
                  aria-label={isListening ? 'Concluir gravação e enviar áudio' : 'Iniciar gravação de áudio conversacional'}
                  title={isListening ? 'Concluir e enviar áudio' : 'Falar por áudio conversacional'}
                >
                  <Icon name={isListening ? 'stop' : 'mic'} size={16} />
                </button>
              </div>

              <label htmlFor="copilot-input" className="visually-hidden">
                Mensagem para o Delta
              </label>
              <textarea
                id="copilot-input"
                rows={2}
                maxLength={2000}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) onSubmit(event);
                }}
                placeholder={
                  isListening
                    ? 'Ouvindo sua voz… fale agora ou clique no microfone para enviar.'
                    : 'Pergunte ao Delta, anexe arquivos ou use o microfone para conversar por voz…'
                }
              />

              <button
                type="submit"
                className="copilot__send"
                aria-label="Enviar mensagem"
                title="Enviar mensagem"
              >
                <Icon name="send" size={17} />
              </button>
            </div>

            <p className="copilot__legal">
              Pastas, chats, uploads e áudio processados localmente no navegador · Arraste arquivos para anexar.
            </p>
          </form>
        </div>
      </div>
    </aside>
  );
}
