import { useEffect, useRef, useState } from 'react';
import { CAP, latestRevision } from '../../domain/journey/journeyEngine.js';
import { CREATION_KINDS, chatPreview, chatTime, queryChats, relativeTime } from '../../domain/journey/notebooks.js';
import { useJourney } from '../../journey/JourneyContext.jsx';
import { goToTab } from '../journey/JourneyBits.jsx';
import { AddReferencesDialog } from './NotebookDialogs.jsx';
import NotebookIcon from './NotebookIcons.jsx';
import AgentIcon from '../journey/AgentIcon.jsx';

function MenuMais({ notebook, onRename, onDelete }) {
  const { toggleNotebookShared } = useJourney();
  const [aberto, setAberto] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!aberto) return undefined;
    const fora = (e) => !ref.current?.contains(e.target) && setAberto(false);
    const esc = (e) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', esc);
    };
  }, [aberto]);
  return (
    <div className="nbd-menu" ref={ref}>
      <button type="button" className="nb-iconbtn" aria-haspopup="menu" aria-expanded={aberto} aria-label="Mais opções" onClick={() => setAberto((v) => !v)}>
        <NotebookIcon name="more" size={20} />
      </button>
      {aberto ? (
        <div className="nbd-menu__panel" role="menu">
          <button type="button" role="menuitem" onClick={() => { setAberto(false); onRename(); }}>
            <NotebookIcon name="edit" size={16} /> Renomear
          </button>
          <button type="button" role="menuitem" onClick={() => { setAberto(false); toggleNotebookShared(notebook.id); }}>
            <NotebookIcon name={notebook.shared ? 'lock' : 'share'} size={16} /> {notebook.shared ? 'Tornar privado' : 'Compartilhar com o projeto'}
          </button>
          {confirmar ? (
            <button type="button" role="menuitem" className="is-danger" onClick={onDelete}>
              <NotebookIcon name="trash" size={16} /> Confirmar exclusão
            </button>
          ) : (
            <button type="button" role="menuitem" className="is-danger" onClick={() => setConfirmar(true)}>
              <NotebookIcon name="trash" size={16} /> Excluir notebook
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Referencias({ notebook, onAdd }) {
  const { project, can, pending, runCapability, openArtifact } = useJourney();
  if (!notebook.references.length) {
    return (
      <div className="nbd-empty">
        <p className="nbd-empty__title">Ainda não há referências</p>
        <p>Adicione documentos e links para o Delta e os agentes do Contexto trabalharem com eles.</p>
        <button type="button" className="nb-btn" onClick={onAdd} disabled={!can('upload')}>
          <NotebookIcon name="plus" size={16} /> Adicionar referências
        </button>
      </div>
    );
  }
  const pendentes = notebook.references.filter((r) => r.sourceId && !latestRevision(project, CAP.analisar, r.sourceId));
  return (
    <>
      <div className="nbd-refs__bar">
        <button type="button" className="nb-btn" onClick={onAdd} disabled={!can('upload')}>
          <NotebookIcon name="plus" size={16} /> Adicionar
        </button>
        <button
          type="button"
          className="nb-btn"
          disabled={!can('run') || !pendentes.length}
          onClick={() => pendentes.forEach((r) => runCapability(CAP.analisar, r.sourceId))}
          title="Análise por artefato (01-contexto-001)"
        >
          <AgentIcon size={15} /> Analisar pendentes ({pendentes.length})
        </button>
      </div>
      <ul className="nbd-refs">
        {notebook.references.map((r) => {
          const rev = r.sourceId ? latestRevision(project, CAP.analisar, r.sourceId) : null;
          const rodando = r.sourceId && pending[`${CAP.analisar}::${r.sourceId}`];
          return (
            <li key={r.id}>
              <NotebookIcon name={r.kind === 'link' ? 'link' : 'file'} size={16} />
              <span className="nbd-refs__body">
                <span className="nbd-refs__name" title={r.url ?? r.name}>
                  {r.name}
                </span>
                <span className="nbd-refs__meta">
                  {r.kind === 'link' ? 'link' : `${r.sourceId} · ${rodando ? 'analisando…' : rev ? `analisada · R${rev.revision}` : 'enviada'}`}
                </span>
              </span>
              {r.sourceId ? (
                rev && !rodando ? (
                  <button type="button" className="nb-iconbtn nb-iconbtn--sm" onClick={() => openArtifact(CAP.analisar, r.sourceId)} aria-label={`Abrir análise de ${r.name}`} title="Abrir análise">
                    <NotebookIcon name="file" size={15} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="nb-iconbtn nb-iconbtn--sm"
                    onClick={() => runCapability(CAP.analisar, r.sourceId)}
                    disabled={!can('run') || rodando}
                    aria-label={`Analisar ${r.name}`}
                    title="Analisar"
                  >
                    <AgentIcon size={15} />
                  </button>
                )
              ) : null}
            </li>
          );
        })}
      </ul>
    </>
  );
}

/** Histórico de chats do notebook, com busca e ordenação. */
function HistoricoDeChats({ notebook, onOpen, onDelete }) {
  const { notify } = useJourney();
  const [busca, setBusca] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [ordem, setOrdem] = useState('recentes');
  const buscaRef = useRef(null);
  useEffect(() => {
    if (buscando) buscaRef.current?.focus();
  }, [buscando]);
  const total = (notebook.chats ?? []).length;
  const lista = queryChats(notebook, { search: busca, sort: ordem });

  return (
    <section className="nbd-history" aria-labelledby={`hist-${notebook.id}`}>
      <header className="nbd-history__head">
        <h3 id={`hist-${notebook.id}`} className="nbd-subtitle">
          Histórico de chats
        </h3>
        {total ? (
          <span className="nbd-history__tools">
            {buscando ? (
              <label className="nb-search nb-search--sm">
                <NotebookIcon name="search" size={15} />
                <input
                  ref={buscaRef}
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setBusca('');
                      setBuscando(false);
                    }
                  }}
                  placeholder="Buscar nos chats"
                  aria-label="Buscar nos chats"
                />
                <button type="button" className="nb-iconbtn nb-iconbtn--sm" aria-label="Fechar busca" onClick={() => { setBusca(''); setBuscando(false); }}>
                  <NotebookIcon name="close" size={13} />
                </button>
              </label>
            ) : (
              <button type="button" className="nb-iconbtn" onClick={() => setBuscando(true)} aria-label="Buscar nos chats" title="Buscar">
                <NotebookIcon name="search" size={18} />
              </button>
            )}
            <button
              type="button"
              className="nb-iconbtn"
              onClick={() => setOrdem((o) => (o === 'recentes' ? 'antigos' : 'recentes'))}
              aria-label={ordem === 'recentes' ? 'Mostrar mais antigos primeiro' : 'Mostrar mais recentes primeiro'}
              title={ordem === 'recentes' ? 'Mais recentes primeiro' : 'Mais antigos primeiro'}
            >
              <NotebookIcon name="sort" size={18} />
            </button>
          </span>
        ) : null}
      </header>
      {total ? (
        lista.length ? (
          <ul className="nbd-chats">
            {lista.map((c) => (
              <li key={c.id} className="nbd-chatrow">
                <button type="button" className="nbd-chat" onClick={() => onOpen(c.id)}>
                  <span className="nbd-chat__text">
                    <span className="nbd-chat__title">{c.title}</span>
                    <span className="nbd-chat__preview">{chatPreview(c) || 'Não há pré-visualização disponível'}</span>
                  </span>
                  <span className="nbd-chat__time">{chatTime(c.updatedAt ?? c.createdAt)}</span>
                </button>
                <button type="button" className="nb-iconbtn nb-iconbtn--sm nbd-chatrow__del" onClick={() => onDelete(c.id)} aria-label={`Excluir conversa “${c.title}”`} title="Excluir conversa">
                  <NotebookIcon name="trash" size={14} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="nbd-history__none">Nenhuma conversa com “{busca}”.</p>
        )
      ) : (
        <div className="nbd-history__empty">
          <p>Iniciar um novo chat ou mover um existente.</p>
          <button type="button" className="nb-btn nb-btn--outline" onClick={() => notify('Mover chats do Delta para o notebook fica disponível na versão com backend.')}>
            <NotebookIcon name="search" size={16} /> Localizar chats para mover
          </button>
        </div>
      )}
    </section>
  );
}

/** Conversa aberta: mensagens e campo para continuar. */
function ConversaAberta({ notebook, chat, onDelete }) {
  const { continueChat } = useJourney();
  const [texto, setTexto] = useState('');
  const fimRef = useRef(null);
  const campoRef = useRef(null);
  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: 'nearest' });
  }, [chat.messages.length]);
  useEffect(() => {
    campoRef.current?.focus();
  }, [chat.id]);
  return (
    <section className="nbd-conv" aria-label={`Conversa: ${chat.title}`}>
      <header className="nbd-conv__head">
        <div className="nbd-conv__titles">
          <span className="nbd-crumb">{notebook.name} · Histórico de chats</span>
          <h3 className="nbd-conv__title">{chat.title}</h3>
        </div>
        <button type="button" className="nb-iconbtn" onClick={onDelete} aria-label="Excluir conversa" title="Excluir conversa">
          <NotebookIcon name="trash" size={17} />
        </button>
      </header>
      <ol className="nbd-thread">
        {chat.messages.map((m, i) => (
          <li key={i} className={`nbd-msg nbd-msg--${m.role}`}>
            <span className="nbd-msg__who">
              {m.role === 'user' ? 'Você' : 'Delta'} · {chatTime(m.at)}
            </span>
            {m.text}
          </li>
        ))}
        <li ref={fimRef} aria-hidden="true" className="nbd-thread__end" />
      </ol>
      <form
        className="nbd-ask nbd-ask--compact"
        onSubmit={(e) => {
          e.preventDefault();
          if (!texto.trim()) return;
          continueChat(notebook.id, chat.id, texto);
          setTexto('');
        }}
      >
        <NotebookIcon name="plus" size={18} />
        <input ref={campoRef} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Continuar a conversa com o Delta" aria-label="Mensagem para o Delta" />
        {texto.trim() ? (
          <button type="submit" className="nb-btn nb-btn--primary nbd-ask__send">
            Enviar
          </button>
        ) : null}
      </form>
    </section>
  );
}

/** Detalhe de um notebook do projeto: conversa com o Delta, histórico de chats, criações e referências. */
export default function NotebookDetail({ notebook, onBack }) {
  const { project, can, addToNotebook, renameNotebook, startChat, deleteChat, createNotebookArtifact, deleteNotebook, notify } = useJourney();
  const [aba, setAba] = useState('criacoes');
  const [painel, setPainel] = useState(true);
  const [mensagem, setMensagem] = useState('');
  const [chatAberto, setChatAberto] = useState(null);
  const [adicionando, setAdicionando] = useState(false);
  const [renomeando, setRenomeando] = useState(false);
  const [nome, setNome] = useState(notebook.name);
  const tituloRef = useRef(null);

  useEffect(() => {
    tituloRef.current?.focus();
  }, [notebook.id]);

  const criacoes = notebook.creations ?? [];
  const chat = (notebook.chats ?? []).find((c) => c.id === chatAberto) ?? null;
  const membros = project?.members?.length ?? 1;

  function enviar(e) {
    e.preventDefault();
    if (!mensagem.trim()) return;
    const id = startChat(notebook.id, mensagem);
    setMensagem('');
    if (id) setChatAberto(id);
  }

  function excluirChat(chatId) {
    deleteChat(notebook.id, chatId);
    if (chatAberto === chatId) setChatAberto(null);
    notify('Conversa excluída do notebook.');
  }

  return (
    <>
      <section className={`nbd ${painel ? '' : 'is-panel-closed'}`} aria-label={`Notebook ${notebook.name}`}>
        <div className="nbd-main">
          <header className="nbd-top">
            <button
              type="button"
              className="nb-iconbtn"
              onClick={chat ? () => setChatAberto(null) : onBack}
              aria-label={chat ? 'Voltar para o notebook' : 'Voltar para os notebooks'}
              title={chat ? 'Voltar para o notebook' : 'Voltar para os notebooks'}
            >
              <NotebookIcon name="back" size={22} className="nbd-back" />
            </button>
            <span className="nbd-crumb">
              {chat ? `${project.code} · Notebooks · ${notebook.name}` : `${project.code} · Notebooks`}
            </span>
            <span className="nbd-top__right">
              <button type="button" className="nbd-members" onClick={() => goToTab('projetos')} title="Membros do projeto (página Projetos)">
                <NotebookIcon name="people" size={18} /> {membros}
              </button>
              <MenuMais
                notebook={notebook}
                onRename={() => {
                  setNome(notebook.name);
                  setRenomeando(true);
                }}
                onDelete={() => {
                  deleteNotebook(notebook.id);
                  notify(`Notebook “${notebook.name}” excluído. As fontes continuam no lote do projeto.`);
                  onBack();
                }}
              />
              {!painel ? (
                <button type="button" className="nb-btn nb-btn--outline nbd-reopen" onClick={() => setPainel(true)}>
                  Criações e referências
                </button>
              ) : null}
            </span>
          </header>

          {chat ? (
            <ConversaAberta notebook={notebook} chat={chat} onDelete={() => excluirChat(chat.id)} />
          ) : (
            <>
            <div className="nbd-hero">
              <NotebookIcon name="folderFill" size={34} className="nbd-folder" />
              {renomeando ? (
                <form
                  className="nbd-rename"
                  onSubmit={(e) => {
                    e.preventDefault();
                    renameNotebook(notebook.id, nome);
                    setRenomeando(false);
                  }}
                >
                  <input autoFocus value={nome} onChange={(e) => setNome(e.target.value)} aria-label="Novo nome do notebook" onKeyDown={(e) => e.key === 'Escape' && setRenomeando(false)} />
                  <button type="submit" className="nb-btn nb-btn--primary" disabled={!nome.trim()}>
                    Salvar
                  </button>
                </form>
              ) : (
                <h2 className="nbd-title" ref={tituloRef} tabIndex={-1}>
                  {notebook.name}
                </h2>
              )}
            </div>

            <form className="nbd-ask" onSubmit={enviar}>
              <NotebookIcon name="plus" size={20} />
              <input value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Enviar uma mensagem para o Delta" aria-label="Mensagem para o Delta" />
              {mensagem.trim() ? (
                <button type="submit" className="nb-btn nb-btn--primary nbd-ask__send">
                  Enviar
                </button>
              ) : null}
            </form>

              <HistoricoDeChats notebook={notebook} onOpen={setChatAberto} onDelete={excluirChat} />
            </>
          )}
        </div>

        {painel ? (
          <aside className="nbd-side" aria-label="Criações e referências">
            <header className="nbd-side__head">
              <div className="nbd-tabs" role="tablist">
                {[
                  ['criacoes', 'Criações'],
                  ['referencias', `Referências (${notebook.references.length})`],
                ].map(([v, r]) => (
                  <button key={v} type="button" role="tab" aria-selected={aba === v} className={`nb-pill ${aba === v ? 'is-selected' : ''}`} onClick={() => setAba(v)}>
                    {r}
                  </button>
                ))}
              </div>
              <button type="button" className="nb-iconbtn" onClick={() => setPainel(false)} aria-label="Fechar painel">
                <NotebookIcon name="close" size={18} />
              </button>
            </header>
            {aba === 'criacoes' ? (
              <>
                <div className="nbd-tiles">
                  {CREATION_KINDS.map((k) => (
                    <button key={k.id} type="button" className="nbd-tile" onClick={() => createNotebookArtifact(notebook.id, k.id)} disabled={!can('run')}>
                      <NotebookIcon name={k.icon} size={20} />
                      {k.label}
                    </button>
                  ))}
                </div>
                <p className="nbd-divider">
                  <span>No seu notebook</span>
                </p>
                {criacoes.length ? (
                  <ul className="nbd-creations">
                    {criacoes.map((c) => (
                      <li key={c.id}>
                        <NotebookIcon name={CREATION_KINDS.find((k) => k.id === c.kind)?.icon ?? 'file'} size={18} />
                        <div>
                          <strong>{c.title}</strong>
                          <span>
                            {relativeTime(c.createdAt)} · {c.summary}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="nbd-empty">
                    <p className="nbd-empty__title">Ainda não há criações</p>
                    <p>Selecione um botão acima para começar a criar ou pergunte ao Delta!</p>
                  </div>
                )}
              </>
            ) : (
              <Referencias notebook={notebook} onAdd={() => setAdicionando(true)} />
            )}
          </aside>
        ) : null}
      </section>

      {adicionando ? (
        <AddReferencesDialog
          mode="add"
          notebookName={notebook.name}
          existingCount={notebook.references.length}
          onClose={() => setAdicionando(false)}
          onSubmit={(payload) => {
            addToNotebook(notebook.id, payload);
            setAdicionando(false);
          }}
        />
      ) : null}
    </>
  );
}
