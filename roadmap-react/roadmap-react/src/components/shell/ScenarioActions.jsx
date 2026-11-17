import Icon from '../ui/Icon.jsx';

/** Ações do cenário (desfazer, restaurar em dois cliques, exportar), exibidas no título do box Premissas do ciclo. */
export default function ScenarioActions({ canUndo, onUndo, resetArmed, onReset, onExportJson, onExportCsv }) {
  return (
    <div className="scenario-actions" role="toolbar" aria-label="Ações do cenário">
      <button type="button" className="btn btn--sm" onClick={onUndo} disabled={!canUndo}>
        <Icon name="undo" size={15} />
        Desfazer
      </button>
      <button type="button" className={`btn btn--sm ${resetArmed ? 'btn--danger' : ''}`} onClick={onReset}>
        <Icon name="reset" size={15} />
        {resetArmed ? 'Clique novamente para restaurar padrão' : 'Restaurar valores iniciais'}
      </button>
      <button type="button" className="btn btn--sm" onClick={onExportJson}>
        <Icon name="download" size={15} />
        Exportar JSON
      </button>
      <button type="button" className="btn btn--sm" onClick={onExportCsv}>
        <Icon name="download" size={15} />
        Exportar CSV
      </button>
    </div>
  );
}
