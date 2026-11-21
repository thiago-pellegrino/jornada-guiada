import { useState } from 'react';
import { Dialog } from '../notebooks/NotebookDialogs.jsx';
import Icon from '../ui/Icon.jsx';
import { DEMOS, PACKS } from '../../domain/darklabs/conteudo.js';

/** "Cenários e dados": cenários de demonstração, exportar/importar a simulação em JSON e reiniciar. */
export default function CenariosDialog({ loja, onClose }) {
  const [json, setJson] = useState(() => JSON.stringify(loja.S));
  const [erro, setErro] = useState('');
  const [confirmar, setConfirmar] = useState(false);

  function copiar() {
    navigator.clipboard?.writeText(json).then(
      () => loja.notify('JSON copiado.'),
      () => loja.notify('Selecione o texto e copie com Ctrl+C.'),
    );
  }

  return (
    <Dialog labelledBy="dlj-cenarios-title" onClose={onClose} wide className="dlj-dialog">
      <div className="nb-dialog__head">
        <h2 id="dlj-cenarios-title" className="nb-dialog__title">
          Cenários e dados
        </h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
          <Icon name="close" size={18} />
        </button>
      </div>
      <p className="nb-dialog__text">Carregar um cenário substitui a simulação atual deste projeto.</p>
      <div className="jg-grid jg-grid--3 dlj-mt">
        {Object.entries(DEMOS).map(([k, d]) => (
          <button
            key={k}
            type="button"
            className="surface dlj-card dlj-card--click"
            onClick={() => {
              loja.carregarCenario(k);
              onClose();
            }}
          >
            <span className="dlj-tag">{PACKS[d.setor].nome}</span>
            <strong className="dlj-card__title">{d.empresa}</strong>
          </button>
        ))}
      </div>

      <h3 className="jg-section-title dlj-mt">Exportar ou importar a simulação</h3>
      <p className="field-hint">Copie o JSON para guardar ou compartilhar. Para retomar, cole um JSON e clique em importar.</p>
      <textarea
        className="input dlj-textarea dlj-json"
        rows={6}
        value={json}
        onChange={(e) => {
          setJson(e.target.value);
          setErro('');
        }}
        aria-label="JSON da simulação"
      />
      {erro ? (
        <p className="err" role="alert">
          {erro}
        </p>
      ) : null}
      <div className="nb-dialog__actions dlj-dialog__actions">
        <button type="button" className="btn btn--sm" onClick={copiar}>
          Copiar JSON
        </button>
        <button
          type="button"
          className="btn btn--sm"
          onClick={() => {
            if (loja.importar(json)) onClose();
            else setErro('JSON inválido: não é uma simulação do DarkLabs.');
          }}
        >
          Importar JSON colado
        </button>
        <span className="dlj-spacer" />
        {confirmar ? (
          <>
            <span className="jg-muted">Apagar a simulação deste projeto?</span>
            <button
              type="button"
              className="btn btn--sm btn--danger"
              onClick={() => {
                loja.reiniciar();
                onClose();
              }}
            >
              Confirmar
            </button>
            <button type="button" className="btn btn--sm" onClick={() => setConfirmar(false)}>
              Cancelar
            </button>
          </>
        ) : (
          <button type="button" className="btn btn--sm btn--danger" onClick={() => setConfirmar(true)}>
            Reiniciar tudo
          </button>
        )}
      </div>
    </Dialog>
  );
}
