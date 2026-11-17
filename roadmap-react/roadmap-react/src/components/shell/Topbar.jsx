import { useEffect, useRef, useState } from 'react';
import Icon, { CopilotMark } from '../ui/Icon.jsx';
import logo from '../../assets/logo-capgemini.png';

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', icon: 'sun' },
  { value: 'dark', label: 'Escuro', icon: 'moon' },
  { value: 'system', label: 'Sistema', icon: 'monitor' },
];

/** Botão de tema com menu de 3 opções (DS §19.2): menuitemradio, setas, Esc devolve o foco. */
function ThemeMenu({ preference, resolved, onChange }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const current = THEME_OPTIONS.find((option) => option.value === preference);

  useEffect(() => {
    if (!open) return undefined;
    const items = menuRef.current?.querySelectorAll('[role="menuitemradio"]');
    const selected = [...(items || [])].find((item) => item.getAttribute('aria-checked') === 'true');
    (selected || items?.[0])?.focus();
    const onPointer = (event) => {
      if (!menuRef.current?.contains(event.target) && !buttonRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  function onMenuKey(event) {
    const items = [...menuRef.current.querySelectorAll('[role="menuitemradio"]')];
    const index = items.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      items[(index + 1) % items.length].focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length].focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  }

  function choose(value) {
    onChange(value);
    setOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <div className="theme-menu">
      <button
        ref={buttonRef}
        type="button"
        className="icon-btn icon-btn--lg"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Tema: ${current?.label}`}
        title={`Tema: ${current?.label}`}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name={resolved === 'dark' ? 'moon' : 'sun'} size={20} />
      </button>
      {open ? (
        <ul ref={menuRef} className="menu" role="menu" aria-label="Tema da interface" onKeyDown={onMenuKey}>
          {THEME_OPTIONS.map((option) => (
            <li key={option.value} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={preference === option.value}
                className="menu__item"
                onClick={() => choose(option.value)}
              >
                <Icon name={option.icon} size={17} />
                {option.label}
                {preference === option.value ? <Icon name="check" size={15} className="menu__check" /> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Barra superior (DS §6.3): busca com Ctrl K, tema e Delta. */
export default function Topbar({
  query,
  onQueryChange,
  onSearchSubmit,
  searchRef,
  theme,
  onThemeChange,
  copilotOpen,
  onToggleCopilot,
  copilotButtonRef,
}) {
  return (
    <header className="topbar">
      <span className="topbar__brand">
        <img className="topbar__logo" src={logo} alt="Capgemini" width="972" height="225" />
      </span>

      <form
        className="topbar__search"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          onSearchSubmit();
        }}
      >
        <Icon name="search" size={18} />
        <label htmlFor="global-search" className="visually-hidden">
          Buscar feature, épico ou squad
        </label>
        <input
          id="global-search"
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Buscar feature, épico ou squad…"
          autoComplete="off"
        />
        <kbd className="kbd" aria-hidden="true">
          Ctrl K
        </kbd>
      </form>

      <div className="topbar__right">
        <ThemeMenu preference={theme.preference} resolved={theme.resolved} onChange={onThemeChange} />
        <button
          ref={copilotButtonRef}
          type="button"
          className={`copilot-toggle ${copilotOpen ? 'is-active' : ''}`}
          aria-expanded={copilotOpen}
          aria-controls="copilot-panel"
          onClick={onToggleCopilot}
        >
          <span className="copilot-toggle__mark">
            <CopilotMark size={20} />
          </span>
          <span className="copilot-toggle__text">
            <strong>Delta</strong>
            <small>Ao seu lado</small>
          </span>
        </button>
        <span className="avatar" role="img" aria-label="Ambiente demonstrativo" title="Ambiente demonstrativo">
          GP
        </span>
      </div>
    </header>
  );
}
