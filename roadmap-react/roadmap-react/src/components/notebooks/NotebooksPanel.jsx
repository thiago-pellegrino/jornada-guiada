import { useEffect, useMemo, useRef, useState } from 'react';
import { listNotebooks, queryNotebooks, relativeTime } from '../../domain/journey/notebooks.js';
import { useJourney } from '../../journey/JourneyContext.jsx';
import { AddReferencesDialog, NewNotebookDialog } from './NotebookDialogs.jsx';
import NotebookIcon from './NotebookIcons.jsx';

const FILTROS = [
  ['tudo', 'Tudo'],
  ['compartilhado', 'Compartilhado'],
  ['apenas-voce', 'Apenas você'],
];
const VIEW_KEY = 'jornada.notebooks.view';

/** Recorte de pasta do cartão (aba à esquerda, fundo elevado à direita). */
function FolderShape() {
  return (
    <svg className="nb-card__shape" viewBox="0 0 230 180" preserveAspectRatio="none" aria-hidden="true">
      <rect className="nb-card__back" x="0.5" y="0.5" width="229" height="179" rx="24" />
      <path
        className="nb-card__front"
        d="M0.5 24A23.5 23.5 0 0 1 24 0.5H60C70 0.5 73 7 79 16S90 32.5 102 32.5H206A23.5 23.5 0 0 1 229.5 56V156A23.5 23.5 0 0 1 206 179.5H24A23.5 23.5 0 0 1 0.5 156Z"
      />
    </svg>
  );
}

function NotebookCard({ nb, onOpen, onToggleShared, onDelete, podeEditar }) {
  const [confirmar, setConfirmar] = useState(false);
  const refs = nb.references.length;
  return (
    <li className="nb-card">
      <FolderShape />
      <button type="button" className="nb-card__hit" onClick={() => onOpen(nb)} aria-label={`Abrir o notebook ${nb.name}`} />
      <NotebookIcon name="folder" size={18} className="nb-card__folder" />
      <span className="nb-card__time">
        <NotebookIcon name={nb.shared ? 'share' : 'lock'} size={12} />
        <span className="nb-sr">{nb.shared ? 'Compartilhado · ' : 'Apenas você · '}</span>
        {relativeTime(nb.updatedAt)}
      </span>
      <p className="nb-card__name">{nb.name}</p>
      <p className="nb-card__meta">
        {refs} referência{refs === 1 ? '' : 's'}
      </p>
      {podeEditar ? (
        <span className="nb-card__tools">
          {confirmar ? (
            <>
              <button type="button" className="nb-mini nb-mini--danger" onClick={() => onDelete(nb.id)}>
                Excluir
              </button>
              <button type="button" className="nb-mini" onClick={() => setConfirmar(false)}>
                Manter
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="nb-iconbtn nb-iconbtn--sm"
                onClick={() => onToggleShared(nb.id)}
                aria-label={nb.shared ? `Tornar ${nb.name} privado` : `Compartilhar ${nb.name} com o projeto`}
                title={nb.shared ? 'Tornar privado' : 'Compartilhar com o projeto'}
              >
                <NotebookIcon name={nb.shared ? 'lock' : 'share'} size={15} />
              </button>
              <button type="button" className="nb-iconbtn nb-iconbtn--sm" onClick={() => setConfirmar(true)} aria-label={`Excluir ${nb.name}`} title="Excluir caderno">
                <NotebookIcon name="trash" size={15} />
              </button>
            </>
          )}
        </span>
      ) : null}
    </li>
  );
}

/**
 * Cadernos de anotações do Contexto: organizam referências (arquivos, links e conversas) por tema.
 * Arquivos adicionados aqui também entram nas fontes do lote do projeto.
 */
export default function NotebooksPanel({ onOpenNotebook, onNewProject }) {
  const { project, can, createNotebook, toggleNotebookShared, deleteNotebook } = useJourney();
  const [filtro, setFiltro] = useState('tudo');
  const [busca, setBusca] = useState('');
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [ordem, setOrdem] = useState('recentes');
  const [vista, setVista] = useState(() => {
    try {
      return window.localStorage.getItem(VIEW_KEY) === 'lista' ? 'lista' : 'grade';
    } catch {
      return 'grade';
    }
  });
  // fluxo: null | { step: 'nome', name } | { step: 'refs', name }
  const [fluxo, setFluxo] = useState(null);
  const buscaRef = useRef(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    try {
      window.localStorage.setItem(VIEW_KEY, vista);
    } catch {
      /* ignora */
    }
  }, [vista]);

  // Atualiza "agora" / "há N min" a cada minuto.
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 60000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (buscaAberta) buscaRef.current?.focus();
  }, [buscaAberta]);

  const lista = useMemo(() => queryNotebooks(project, { filter: filtro, search: busca, sort: ordem }), [project, filtro, busca, ordem]);
  const total = listNotebooks(project).length;
  const podeEditar = can('upload');

  const abrirNovo = () => setFluxo({ step: 'nome', name: '' });
  const fechar = () => setFluxo(null);

  return (
    <section className="nb" aria-labelledby="nb-title">
      <header className="nb-head">
        <div>
          <h2 id="nb-title" className="nb-title">
            Notebooks
          </h2>
          <p className="nb-sub">
            Projeto <strong>{project.code}</strong> · {project.name} · {total} notebook{total === 1 ? '' : 's'}. Cada notebook organiza
            as referências de um tema do projeto.
          </p>
        </div>
        <span className="nb-head__actions">
          <button type="button" className="nb-btn nb-btn--outline" onClick={onNewProject} disabled={!can('createProject')}>
            <NotebookIcon name="folderPlus" size={18} /> Novo projeto
          </button>
          <button type="button" className="nb-btn nb-btn--outline" onClick={abrirNovo} disabled={!podeEditar}>
            <NotebookIcon name="plus" size={18} /> Novo caderno de anotações
          </button>
        </span>
      </header>

      <div className="nb-toolbar">
        <div className="nb-filters" role="tablist" aria-label="Filtrar cadernos">
          {FILTROS.map(([valor, rotulo]) => (
            <button key={valor} type="button" role="tab" aria-selected={filtro === valor} className={`nb-pill ${filtro === valor ? 'is-selected' : ''}`} onClick={() => setFiltro(valor)}>
              {rotulo}
            </button>
          ))}
        </div>
        <div className="nb-tools">
          {buscaAberta ? (
            <label className="nb-search">
              <NotebookIcon name="search" size={16} />
              <input
                ref={buscaRef}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setBusca('');
                    setBuscaAberta(false);
                  }
                }}
                placeholder="Buscar cadernos"
                aria-label="Buscar cadernos"
              />
              <button
                type="button"
                className="nb-iconbtn nb-iconbtn--sm"
                aria-label="Fechar busca"
                onClick={() => {
                  setBusca('');
                  setBuscaAberta(false);
                }}
              >
                <NotebookIcon name="close" size={14} />
              </button>
            </label>
          ) : (
            <button type="button" className="nb-iconbtn" onClick={() => setBuscaAberta(true)} aria-label="Buscar cadernos" title="Buscar">
              <NotebookIcon name="search" size={19} />
            </button>
          )}
          <button
            type="button"
            className="nb-iconbtn"
            onClick={() => setOrdem((o) => (o === 'recentes' ? 'nome' : 'recentes'))}
            aria-label={`Ordenar por ${ordem === 'recentes' ? 'nome' : 'mais recentes'}`}
            title={ordem === 'recentes' ? 'Ordenado por mais recentes' : 'Ordenado por nome'}
          >
            <NotebookIcon name="sort" size={19} />
          </button>
          <div className="nb-viewtoggle" role="group" aria-label="Modo de exibição">
            <button type="button" className={`nb-viewtoggle__btn ${vista === 'grade' ? 'is-selected' : ''}`} aria-pressed={vista === 'grade'} aria-label="Grade" onClick={() => setVista('grade')}>
              <NotebookIcon name="grid" size={17} />
            </button>
            <button type="button" className={`nb-viewtoggle__btn ${vista === 'lista' ? 'is-selected' : ''}`} aria-pressed={vista === 'lista'} aria-label="Lista" onClick={() => setVista('lista')}>
              <NotebookIcon name="list" size={17} />
            </button>
          </div>
        </div>
      </div>

      {vista === 'grade' ? (
        <ul className="nb-grid">
          {filtro !== 'compartilhado' && !busca ? (
            <li>
              <button type="button" className="nb-create" onClick={abrirNovo} disabled={!podeEditar}>
                <NotebookIcon name="plusCircle" size={24} />
                Criar
              </button>
            </li>
          ) : null}
          {lista.map((nb) => (
            <NotebookCard
              key={nb.id}
              nb={nb}
              podeEditar={podeEditar}
              onOpen={(n) => onOpenNotebook(n.id)}
              onToggleShared={toggleNotebookShared}
              onDelete={deleteNotebook}
            />
          ))}
        </ul>
      ) : (
        <div className="nb-listwrap">
          {lista.length ? (
            <table className="nb-table">
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">Referências</th>
                  <th scope="col">Acesso</th>
                  <th scope="col">Atualizado</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((nb) => (
                  <tr key={nb.id}>
                    <td>
                      <button type="button" className="nb-rowlink" onClick={() => onOpenNotebook(nb.id)}>
                        <NotebookIcon name="folder" size={17} /> {nb.name}
                      </button>
                    </td>
                    <td className="tabular">{nb.references.length}</td>
                    <td>{nb.shared ? 'Compartilhado' : 'Apenas você'}</td>
                    <td>{relativeTime(nb.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      )}

      {!lista.length && (total > 0 || vista === 'lista') ? (
        <p className="nb-empty">{busca ? `Nenhum caderno com “${busca}”.` : total ? 'Nenhum caderno neste filtro.' : 'Nenhum caderno ainda.'}</p>
      ) : null}

      {fluxo?.step === 'nome' ? (
        <NewNotebookDialog initialName={fluxo.name} projectLabel={`${project.code} · ${project.name}`} onClose={fechar} onNext={(name) => setFluxo({ step: 'refs', name })} />
      ) : null}
      {fluxo?.step === 'refs' ? (
        <AddReferencesDialog
          notebookName={fluxo.name}
          onBack={() => setFluxo({ step: 'nome', name: fluxo.name })}
          onClose={fechar}
          onSubmit={(payload) => {
            const id = createNotebook(fluxo.name, payload);
            if (id) {
              fechar();
              onOpenNotebook(id);
            }
          }}
        />
      ) : null}
    </section>
  );
}
