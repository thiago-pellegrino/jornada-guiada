import { useId, useState } from 'react';
import { useJourney } from '../../journey/JourneyContext.jsx';
import Icon from '../ui/Icon.jsx';

/** Criação do projeto no Contexto (POST /projects simulado). */
export default function CreateProjectForm({ onDone, compact = false }) {
  const { can, createProject, state } = useJourney();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const id = useId();
  const permitido = can('createProject');
  const proximoCodigo = `PRJ-${String(state.projects.length + 1).padStart(3, '0')}`;

  function enviar(e) {
    e.preventDefault();
    if (!nome.trim()) return;
    if (createProject(nome.trim(), descricao.trim())) {
      setNome('');
      setDescricao('');
      onDone?.();
    }
  }

  return (
    <form className={`surface jg-create ${compact ? 'jg-create--compact' : ''}`} onSubmit={enviar} aria-labelledby={`${id}-t`}>
      <header className="surface-head">
        <h2 id={`${id}-t`} className="surface-title">
          <Icon name="folderPlus" size={15} /> Criar projeto
        </h2>
        <span className="surface-meta">O código {proximoCodigo} acompanha todas as etapas</span>
      </header>
      {!compact ? (
        <p className="jg-muted">
          Toda a jornada acontece dentro de um projeto. Ele é criado aqui, antes do primeiro upload, e o mesmo identificador
          segue para o DarkLabs, a ficha do projeto e o Backlog do Futuro.
        </p>
      ) : null}
      <div className="field-grid field-grid--2">
        <label className="field">
          <span className="field-label">Nome do projeto</span>
          <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Atendimento digital de reembolso" required disabled={!permitido} />
        </label>
        <label className="field">
          <span className="field-label">Descrição (opcional)</span>
          <input className="input" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Objetivo em uma frase" disabled={!permitido} />
        </label>
      </div>
      <div className="jg-cap__actions">
        <button type="submit" className="btn btn--primary btn--sm" disabled={!permitido || !nome.trim()}>
          <Icon name="plus" size={14} /> Criar projeto
        </button>
        {onDone ? (
          <button type="button" className="btn btn--sm btn--quiet" onClick={onDone}>
            Cancelar
          </button>
        ) : null}
        {!permitido ? <span className="jg-cap__reason">Leitor não cria projetos.</span> : null}
      </div>
    </form>
  );
}
