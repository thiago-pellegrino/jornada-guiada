import Icon from '../ui/Icon.jsx';

/** Cartão "Premissas do ciclo": busca rápida de feature, épico ou squad. */
export default function ScopePremisesCard({ query, onQueryChange, searchInputRef }) {
  return (
    <section className="surface" aria-labelledby="premises-title">
      <header className="surface-head">
        <h2 id="premises-title" className="surface-title">Premissas do ciclo</h2>
      </header>

      <div className="field">
        <label className="field-label" htmlFor="feature-search">
          Buscar feature ou épico
        </label>
        <div className="search-field">
          <Icon name="search" size={17} />
          <input
            id="feature-search"
            ref={searchInputRef}
            type="search"
            className="input"
            placeholder="Feature, épico ou squad…"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            autoComplete="off"
          />
        </div>
      </div>
    </section>
  );
}
