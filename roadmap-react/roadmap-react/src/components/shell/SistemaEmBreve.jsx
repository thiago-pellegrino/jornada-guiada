import Icon from '../ui/Icon.jsx';
import { sistemaPorId } from './sistemas.js';

/** Área abaixo do topbar para os sistemas que ainda não têm páginas nesta versão do protótipo. */
export default function SistemaEmBreve({ sistemaId, onVoltar }) {
  const sistema = sistemaPorId(sistemaId);
  return (
    <div className="content sistema-vazio">
      <section className="sistema-vazio__card" aria-labelledby="sistema-vazio-titulo">
        <span className="sistema-vazio__icon" aria-hidden="true">
          <Icon name={sistema.icon} size={28} />
        </span>
        <h1 id="sistema-vazio-titulo">{sistema.label}</h1>
        <p>Este sistema ainda não tem páginas nesta versão do protótipo. A estrutura abaixo do topbar já está pronta para receber as telas dele.</p>
        <button type="button" className="btn btn--sm btn--primary" onClick={onVoltar}>
          Ir para a Jornada Guiada <Icon name="chevronRight" size={14} />
        </button>
      </section>
    </div>
  );
}
