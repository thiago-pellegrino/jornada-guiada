import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { normalizeLink } from '../../domain/journey/notebooks.js';
import { EMPRESAS, filtrarEmpresas } from '../../domain/journey/empresas.js';
import { fmtBytes } from '../journey/JourneyBits.jsx';
import NotebookIcon from './NotebookIcons.jsx';

/** Diálogo modal simples: fecha com Esc ou clique fora e mantém o foco dentro dele. */
export function Dialog({ labelledBy, onClose, children, wide = false, className = '' }) {
  const ref = useRef(null);
  const fecharRef = useRef(onClose);
  fecharRef.current = onClose;
  useEffect(() => {
    const anterior = document.activeElement;
    const el = ref.current;
    const foco = el?.querySelector('[data-autofocus]') ?? el?.querySelector('button, input');
    foco?.focus();
    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        fecharRef.current();
        return;
      }
      if (e.key !== 'Tab' || !el) return;
      const itens = [...el.querySelectorAll('button:not(:disabled), input:not(:disabled), [tabindex="0"]')];
      if (!itens.length) return;
      const [primeiro, ultimo] = [itens[0], itens[itens.length - 1]];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      anterior?.focus?.();
    };
  }, []);

  // Portal no <body>: o painel da aba usa transform na animação de entrada, o que prenderia o overlay fixo.
  return createPortal(
    <div className="nb-overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section ref={ref} className={`nb-dialog ${wide ? 'nb-dialog--wide' : ''} ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {children}
      </section>
    </div>,
    document.body,
  );
}

/** Passo 1: nome do novo caderno. */
export function NewNotebookDialog({ initialName = '', projectLabel = '', onNext, onClose }) {
  const [nome, setNome] = useState(initialName);
  const id = useId();
  return (
    <Dialog labelledBy={`${id}-t`} onClose={onClose}>
      <header className="nb-dialog__head">
        <h2 id={`${id}-t`} className="nb-dialog__title">
          Novo caderno de anotações
        </h2>
        <button type="button" className="nb-iconbtn" onClick={onClose} aria-label="Fechar">
          <NotebookIcon name="close" size={20} />
        </button>
      </header>
      <p className="nb-dialog__text">
        Os notebooks organizam as referências do projeto em um só lugar: documentos, links e conversas que servem de base para o
        Contexto. Arquivos adicionados a um notebook também entram nas fontes do lote para análise.
      </p>
      {projectLabel ? (
        <p className="nb-dialog__project">
          <NotebookIcon name="folder" size={14} /> Pertence ao projeto <strong>{projectLabel}</strong>
        </p>
      ) : null}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (nome.trim()) onNext(nome.trim());
        }}
      >
        <label className="nb-field">
          <NotebookIcon name="folder" size={20} />
          <input
            data-autofocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do caderno de anotações (por exemplo, “Pesquisa de mercado”)"
            aria-label="Nome do caderno de anotações"
            maxLength={80}
          />
        </label>
        <div className="nb-dialog__actions">
          <button type="submit" className="nb-btn nb-btn--primary" disabled={!nome.trim()}>
            Avançar
          </button>
        </div>
      </form>
    </Dialog>
  );
}

/** Passo 2 (ou caderno existente): referências e chats a adicionar. */
export function AddReferencesDialog({ notebookName, existingCount = 0, mode = 'create', onBack, onSubmit, onClose }) {
  const [aba, setAba] = useState('referencias');
  const [arquivos, setArquivos] = useState([]);
  const [links, setLinks] = useState([]);
  const [linkAberto, setLinkAberto] = useState(false);
  const [linkTexto, setLinkTexto] = useState('');
  const [aviso, setAviso] = useState(null);
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef(null);
  const id = useId();

  function addArquivos(lista) {
    const novos = [...(lista ?? [])];
    if (!novos.length) return;
    setArquivos((atual) => [...atual, ...novos.filter((f) => !atual.some((a) => a.name === f.name && a.size === f.size))]);
    setAviso(null);
  }

  function addLink() {
    const url = normalizeLink(linkTexto);
    if (!url) {
      setAviso('Informe um endereço válido, por exemplo https://site.com/pagina.');
      return;
    }
    setLinks((atual) => (atual.includes(url) ? atual : [...atual, url]));
    setLinkTexto('');
    setAviso(null);
  }

  const total = arquivos.length + links.length;
  const podeEnviar = mode === 'create' || total > 0;

  return (
    <Dialog labelledBy={`${id}-t`} onClose={onClose} wide>
      <header className="nb-dialog__head nb-dialog__head--back">
        {onBack ? (
          <button type="button" className="nb-iconbtn nb-iconbtn--back" onClick={onBack} aria-label="Voltar">
            <NotebookIcon name="back" size={26} />
          </button>
        ) : null}
        <h2 id={`${id}-t`} className="nb-dialog__title">
          Adicionar a {notebookName}
        </h2>
        {!onBack ? (
          <button type="button" className="nb-iconbtn nb-push" onClick={onClose} aria-label="Fechar">
            <NotebookIcon name="close" size={20} />
          </button>
        ) : null}
      </header>

      <div className="nb-seg" role="tablist" aria-label="Tipo de conteúdo">
        {[
          ['referencias', 'Referências'],
          ['chats', 'Chats do Delta'],
        ].map(([valor, rotulo]) => (
          <button
            key={valor}
            type="button"
            role="tab"
            aria-selected={aba === valor}
            className={`nb-seg__btn ${aba === valor ? 'is-selected' : ''}`}
            onClick={() => setAba(valor)}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {aba === 'referencias' ? (
        <div
          className={`nb-drop ${arrastando ? 'is-dragging' : ''} ${total ? 'has-items' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastando(false);
            addArquivos(e.dataTransfer.files);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            accept=".pdf,.docx,.xlsx,.pptx,.csv,.txt,.md,.html,.htm"
            onChange={(e) => {
              addArquivos(e.target.files);
              e.target.value = '';
            }}
          />
          <p className="nb-drop__hint">{arrastando ? 'Solte os arquivos aqui' : 'Clique para enviar ou arraste arquivos até aqui'}</p>
          <div className="nb-drop__actions">
            <button type="button" className="nb-chip" onClick={() => inputRef.current?.click()}>
              <NotebookIcon name="upload" size={18} /> Carregar
            </button>
            <button type="button" className={`nb-chip ${linkAberto ? 'is-on' : ''}`} onClick={() => setLinkAberto((v) => !v)} aria-expanded={linkAberto}>
              <NotebookIcon name="link" size={18} /> Adicionar links
            </button>
            <button type="button" className="nb-chip" onClick={() => setAviso('A conexão com o OneDrive fica disponível na versão com backend.')}>
              <NotebookIcon name="cloud" size={18} /> OneDrive
            </button>
          </div>
          {linkAberto ? (
            <form
              className="nb-linkform"
              onSubmit={(e) => {
                e.preventDefault();
                addLink();
              }}
            >
              <input
                autoFocus
                value={linkTexto}
                onChange={(e) => setLinkTexto(e.target.value)}
                placeholder="Cole o endereço (https://…)"
                aria-label="Endereço do link"
              />
              <button type="submit" className="nb-btn" disabled={!linkTexto.trim()}>
                Adicionar
              </button>
            </form>
          ) : null}
          <p className="nb-drop__notice" role="status" aria-live="polite">
            {aviso}
          </p>
          {total ? (
            <ul className="nb-refs" aria-label="Referências a adicionar">
              {arquivos.map((f) => (
                <li key={`f-${f.name}-${f.size}`}>
                  <NotebookIcon name="file" size={16} />
                  <span className="nb-refs__name">{f.name}</span>
                  <span className="nb-refs__meta">{fmtBytes(f.size)}</span>
                  <button type="button" className="nb-iconbtn nb-iconbtn--sm" aria-label={`Remover ${f.name}`} onClick={() => setArquivos((a) => a.filter((x) => x !== f))}>
                    <NotebookIcon name="close" size={14} />
                  </button>
                </li>
              ))}
              {links.map((url) => (
                <li key={`l-${url}`}>
                  <NotebookIcon name="link" size={16} />
                  <span className="nb-refs__name">{url}</span>
                  <span className="nb-refs__meta">link</span>
                  <button type="button" className="nb-iconbtn nb-iconbtn--sm" aria-label={`Remover ${url}`} onClick={() => setLinks((l) => l.filter((x) => x !== url))}>
                    <NotebookIcon name="close" size={14} />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <div className="nb-drop nb-drop--empty">
          <NotebookIcon name="chat" size={28} />
          <p className="nb-drop__hint">Nenhuma conversa com o Delta para adicionar ainda.</p>
          <p className="nb-drop__notice">As conversas salvas no Delta aparecerão aqui para virar referência do caderno.</p>
        </div>
      )}

      <footer className="nb-dialog__actions nb-dialog__actions--split">
        <span className="nb-dialog__count">
          {mode === 'add' && existingCount ? `${existingCount} referência(s) no caderno · ` : ''}
          {total ? `${total} para adicionar` : mode === 'create' ? 'Você pode adicionar referências depois' : 'Nada selecionado'}
        </span>
        <span className="nb-dialog__buttons">
          <button type="button" className="nb-btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="nb-btn nb-btn--primary" disabled={!podeEnviar} onClick={() => onSubmit({ files: arquivos, links })}>
            {mode === 'create' ? 'Criar' : 'Adicionar'}
          </button>
        </span>
      </footer>
    </Dialog>
  );
}

/** Novo projeto, no mesmo formato do diálogo de novo caderno. */
/**
 * Novo projeto em dois passos: primeiro a empresa dona do projeto (lista ou outra digitada),
 * depois nome e descrição. `onCreate(nome, descricao, empresa)`.
 * Com `inicial` (um projeto), vira "Editar projeto": abre nos dados já preenchidos (ou na empresa,
 * se o projeto ainda não tem uma) e salva pelo mesmo `onCreate`.
 */
export function NewProjectDialog({ nextCode = 'PRJ-NNN', onCreate, onClose, inicial = null }) {
  const editando = Boolean(inicial);
  const empresaInicial = inicial?.company ?? null;
  const daLista = empresaInicial ? EMPRESAS.find((e) => e.id === empresaInicial.id) : null;
  const [passo, setPasso] = useState(editando && empresaInicial ? 'dados' : 'empresa');
  const [empresaId, setEmpresaId] = useState(daLista ? daLista.id : empresaInicial ? 'outra' : null);
  const [outra, setOutra] = useState(empresaInicial && !daLista ? empresaInicial.name : '');
  const [busca, setBusca] = useState('');
  const [nome, setNome] = useState(inicial?.name ?? '');
  const [descricao, setDescricao] = useState(inicial?.description ?? '');
  const id = useId();
  const lista = filtrarEmpresas(busca);
  const empresa = empresaId === 'outra' ? (outra.trim() ? { id: 'outra', name: outra.trim(), sector: 'Outra empresa' } : null) : EMPRESAS.find((e) => e.id === empresaId) ?? null;

  if (passo === 'empresa') {
    return (
      <Dialog key="empresa" labelledBy={`${id}-t`} onClose={onClose} className="nb-dialog--empresa">
        <header className="nb-dialog__head">
          <h2 id={`${id}-t`} className="nb-dialog__title">
            {editando ? `Editar projeto ${nextCode} · empresa` : 'Novo projeto · empresa'}
          </h2>
          <button type="button" className="nb-iconbtn" onClick={onClose} aria-label="Fechar">
            <NotebookIcon name="close" size={20} />
          </button>
        </header>
        <p className="nb-dialog__text">
          {editando ? 'Selecione a empresa do projeto' : 'Selecione de qual empresa é o projeto'} <strong>{nextCode}</strong>. A empresa acompanha o
          projeto em todas as etapas da jornada.
        </p>
        <label className="nb-field">
          <NotebookIcon name="search" size={20} />
          <input data-autofocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar empresa por nome ou setor" aria-label="Buscar empresa" />
        </label>
        <div className="nb-empresas" role="radiogroup" aria-label="Empresa do projeto">
          {lista.map((e) => (
            <button
              key={e.id}
              type="button"
              role="radio"
              aria-checked={empresaId === e.id}
              className={`nb-empresa ${empresaId === e.id ? 'is-selected' : ''}`}
              onClick={() => setEmpresaId(e.id)}
              onDoubleClick={() => {
                setEmpresaId(e.id);
                setPasso('dados');
              }}
            >
              <span className="nb-empresa__avatar" aria-hidden="true">
                {e.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')}
              </span>
              <span className="nb-empresa__text">
                <strong>{e.name}</strong>
                <span>{e.sector}</span>
              </span>
              <span className="nb-empresa__radio" aria-hidden="true" />
            </button>
          ))}
          <button
            type="button"
            role="radio"
            aria-checked={empresaId === 'outra'}
            className={`nb-empresa nb-empresa--outra ${empresaId === 'outra' ? 'is-selected' : ''}`}
            onClick={() => setEmpresaId('outra')}
          >
            <span className="nb-empresa__avatar" aria-hidden="true">
              <NotebookIcon name="plus" size={16} />
            </span>
            <span className="nb-empresa__text">
              <strong>Outra empresa</strong>
              <span>Informe o nome da empresa</span>
            </span>
            <span className="nb-empresa__radio" aria-hidden="true" />
          </button>
        </div>
        {lista.length === 0 ? <p className="nb-dialog__count">Nenhuma empresa encontrada para “{busca}”. Use “Outra empresa”.</p> : null}
        {empresaId === 'outra' ? (
          <label className="nb-field">
            <NotebookIcon name="edit" size={20} />
            <input autoFocus value={outra} onChange={(e) => setOutra(e.target.value)} placeholder="Nome da empresa" aria-label="Nome da outra empresa" maxLength={80} />
          </label>
        ) : null}
        <div className="nb-dialog__actions">
          <button type="button" className="nb-btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="nb-btn nb-btn--primary" disabled={!empresa} onClick={() => setPasso('dados')}>
            Continuar
          </button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog key="dados" labelledBy={`${id}-t`} onClose={onClose}>
      <header className="nb-dialog__head nb-dialog__head--back">
        <button type="button" className="nb-iconbtn" onClick={() => setPasso('empresa')} aria-label="Voltar para a escolha da empresa">
          <NotebookIcon name="back" size={20} />
        </button>
        <h2 id={`${id}-t`} className="nb-dialog__title">
          {editando ? `Editar projeto ${nextCode}` : 'Novo projeto'}
        </h2>
      </header>
      <p className="nb-dialog__project">
        <NotebookIcon name="folder" size={14} /> Empresa: <strong>{empresa?.name}</strong> · {empresa?.sector}
        <button type="button" className="nb-linkbtn" onClick={() => setPasso('empresa')}>
          Trocar
        </button>
      </p>
      <p className="nb-dialog__text">
        {editando ? (
          <>
            Altere o nome, a descrição ou a empresa. O código <strong>{nextCode}</strong>, os notebooks e tudo o que a jornada já gerou
            continuam ligados ao projeto.
          </>
        ) : (
          <>
            Toda a jornada acontece dentro de um projeto. O código <strong>{nextCode}</strong> acompanha o Contexto, o DarkLabs, a ficha
            do projeto e o Backlog do Futuro. Cada projeto pode ter vários notebooks.
          </>
        )}
      </p>
      <form
        className="nb-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (nome.trim() && empresa) onCreate(nome.trim(), descricao.trim(), empresa);
        }}
      >
        <label className="nb-field">
          <NotebookIcon name="folderPlus" size={20} />
          <input data-autofocus value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do projeto (por exemplo, “Atendimento digital de reembolso”)" aria-label="Nome do projeto" maxLength={80} />
        </label>
        <label className="nb-field">
          <NotebookIcon name="edit" size={20} />
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição em uma frase (opcional)" aria-label="Descrição do projeto" maxLength={160} />
        </label>
        <div className="nb-dialog__actions">
          <button type="button" className="nb-btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="nb-btn nb-btn--primary" disabled={!nome.trim()}>
            {editando ? 'Salvar alterações' : 'Criar projeto'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
