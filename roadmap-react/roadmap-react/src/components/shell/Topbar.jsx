import { useEffect, useRef, useState } from 'react';
import Icon, { CopilotMark } from '../ui/Icon.jsx';
import logo from '../../assets/logo-capgemini-transparent.png';
import logoBranco from '../../assets/logo-capgemini-white.png';
import { DarklabsMark } from '../auth/LoginScreen.jsx';
import UserMenu from '../auth/UserMenu.jsx';
import { SISTEMAS } from './sistemas.js';

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
        className="topbar-util-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Tema: ${current?.label}`}
        title={`Tema: ${current?.label}`}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name={resolved === 'dark' ? 'moon' : 'sun'} size={16} />
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

/** Barra superior (50px): logo Capgemini à esquerda; tamanho da fonte, favorito, PDF, tema, Delta e avatar à direita. */
export default function Topbar({
  theme,
  onThemeChange,
  fontScale,
  onFontDecrease,
  onFontIncrease,
  copilotOpen,
  onToggleCopilot,
  copilotButtonRef,
  onExportPdf,
  onNotify,
  sistema,
  onSistemaChange,
}) {
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
    onNotify?.(next ? 'Simulador adicionado aos favoritos.' : 'Simulador removido dos favoritos.');
  }

  // Switch das estrelas do Delta: desligado = degradê atual; ligado = dourado. Vale para todos os
  // ícones do Delta (topbar, janela do chat e botão flutuante) e fica salvo no navegador.
  const [deltaDourado, setDeltaDourado] = useState(() => {
    try {
      return window.localStorage.getItem('jornada.delta.dourado') === '1';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    document.documentElement.toggleAttribute('data-delta-gold', deltaDourado);
    try {
      window.localStorage.setItem('jornada.delta.dourado', deltaDourado ? '1' : '0');
    } catch {
      /* sem armazenamento: vale só nesta sessão */
    }
  }, [deltaDourado]);

  return (
    <header className="topbar">
      <span className="topbar__brand">
        <img className="topbar__logo topbar__logo--claro" src={logo} alt="Capgemini" width="972" height="225" />
        <img className="topbar__logo topbar__logo--escuro" src={logoBranco} alt="Capgemini" width="972" height="225" />
        <span className="topbar__brand-sep" aria-hidden="true" />
        <span className="topbar__darklabs">
          <DarklabsMark tone="dark" compact />
        </span>
      </span>

      {onSistemaChange ? (
        <nav className="topbar__systems" aria-label="Sistemas">
          {SISTEMAS.map((item) => {
            const ativo = item.id === sistema;
            return (
              <button
                key={item.id}
                type="button"
                className={`topbar-system ${ativo ? 'is-active' : ''}`}
                aria-current={ativo ? 'page' : undefined}
                onClick={() => onSistemaChange(item.id)}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      ) : null}

      <div className="topbar__right">
        {fontScale ? (
          <div className="font-scale-group" role="group" aria-label="Tamanho da fonte">
            <button
              type="button"
              className="topbar-util-btn"
              onClick={onFontDecrease}
              disabled={!fontScale.canDecrease}
              aria-label={`Diminuir fonte (atual ${fontScale.percentLabel})`}
              title={`Diminuir fonte (${fontScale.percentLabel})`}
            >
              <Icon name="fontDecrease" size={16} />
            </button>
            <button
              type="button"
              className="topbar-util-btn"
              onClick={onFontIncrease}
              disabled={!fontScale.canIncrease}
              aria-label={`Aumentar fonte (atual ${fontScale.percentLabel})`}
              title={`Aumentar fonte (${fontScale.percentLabel})`}
            >
              <Icon name="fontIncrease" size={16} />
            </button>
          </div>
        ) : null}
        <button
          type="button"
          className={`topbar-util-btn ${favorite ? 'is-selected' : ''}`}
          aria-pressed={favorite}
          aria-label={favorite ? 'Remover dos favoritos: Jornada Guiada' : 'Adicionar aos favoritos: Jornada Guiada'}
          title={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          onClick={toggleFavorite}
        >
          <Icon name="star" size={16} />
        </button>
        <button
          type="button"
          className="topbar-util-btn"
          onClick={onExportPdf}
          aria-label="Exportar estudo em PDF"
          title="Exportar estudo em PDF"
        >
          <Icon name="fileExport" size={16} />
        </button>
        <ThemeMenu preference={theme.preference} resolved={theme.resolved} onChange={onThemeChange} />
        <button
          type="button"
          role="switch"
          aria-checked={deltaDourado}
          className={`delta-switch ${deltaDourado ? 'is-on' : ''}`}
          onClick={() => setDeltaDourado((v) => !v)}
          aria-label="Estrelas do Delta douradas"
          title={deltaDourado ? 'Estrelas do Delta: douradas' : 'Estrelas do Delta: degradê'}
        >
          <span className="delta-switch__track" aria-hidden="true">
            <span className="delta-switch__thumb" />
          </span>
        </button>
        <button
          ref={copilotButtonRef}
          type="button"
          className={`copilot-toggle ${copilotOpen ? 'is-active' : ''}`}
          aria-expanded={copilotOpen}
          aria-controls="copilot-panel"
          onClick={onToggleCopilot}
        >
          <span className="copilot-toggle__mark">
            <CopilotMark size={14} />
          </span>
          <span className="copilot-toggle__text">
            <strong>Delta</strong>
          </span>
        </button>
        <UserMenu
          theme={theme}
          onThemeChange={onThemeChange}
          fontScale={fontScale}
          onFontDecrease={onFontDecrease}
          onFontIncrease={onFontIncrease}
          copilotOpen={copilotOpen}
          onToggleCopilot={onToggleCopilot}
        />
      </div>
    </header>
  );
}
