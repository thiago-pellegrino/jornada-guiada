import { useState } from 'react';
import Icon from '../ui/Icon.jsx';

const FAVORITES_KEY = 'roadmap.favorites.v1';
const PAGE_ID = 'simulador-roadmap';

function readFavorite() {
  try {
    const list = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) || '[]');
    return Array.isArray(list) && list.includes(PAGE_ID);
  } catch {
    return false;
  }
}

/** Cabeçalho da página (DS §7.13): eyebrow, H1, descrição, favorito, exportar PDF e abas. */
export default function PageHeader({ onExportPdf, onNotify, tabs }) {
  const [favorite, setFavorite] = useState(readFavorite);

  function toggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    try {
      const list = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) || '[]').filter((id) => id !== PAGE_ID);
      if (next) list.push(PAGE_ID);
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
    } catch {
      /* sem armazenamento */
    }
    onNotify(next ? 'Simulador adicionado aos favoritos.' : 'Simulador removido dos favoritos.');
  }

  return (
    <div className="page-top">
      <div className="page-heading">
        <div className="page-heading__text">
          <p className="eyebrow">Gestão de Portfólio · Upstream, Roadmap do Downstream</p>
          <h1>Jornada Guiada</h1>
          <p className="lede">Projete as entregas do período de sua escolha, dimensione as squads e antecipe gargalos antes do Freezing.</p>
        </div>
        <div className="page-heading__aside">
          <button
            type="button"
            className={`star ${favorite ? 'is-selected' : ''}`}
            aria-pressed={favorite}
            aria-label={favorite ? 'Remover dos favoritos: Jornada Guiada' : 'Adicionar aos favoritos: Jornada Guiada'}
            onClick={toggleFavorite}
          >
            <Icon name="star" size={18} />
          </button>
          <button type="button" className="btn" onClick={onExportPdf}>
            <Icon name="fileExport" size={17} />
            Exportar estudo em PDF
          </button>
        </div>
      </div>

      {tabs}
    </div>
  );
}
