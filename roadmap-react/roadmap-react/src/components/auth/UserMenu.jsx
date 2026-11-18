import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { useOptionalAuth } from '../../auth/AuthContext.jsx';
import SettingsDialog from '../settings/SettingsDialog.jsx';
import UserAvatar from '../user/UserAvatar.jsx';

/** Avatar da barra superior com o usuário da sessão e a opção Sair. Sem sessão, mostra o avatar estático. */
export default function UserMenu({ theme, onThemeChange, fontScale, onFontDecrease, onFontIncrease, copilotOpen, onToggleCopilot }) {
  const auth = useOptionalAuth();
  const [open, setOpen] = useState(false);
  const [configuracoes, setConfiguracoes] = useState(null); // null | seção inicial

  // Outras partes da tela (ex.: "Editar perfil" no menu do DarkLabs) pedem para abrir as configurações.
  useEffect(() => {
    const abrir = (e) => {
      setOpen(false);
      setConfiguracoes(e.detail?.secao ?? 'geral');
    };
    window.addEventListener('jornada:abrir-configuracoes', abrir);
    return () => window.removeEventListener('jornada:abrir-configuracoes', abrir);
  }, []);
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onDown(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const session = auth?.session;
  if (!session) {
    return (
      <span className="avatar" role="img" aria-label="Ambiente demonstrativo" title="Ambiente demonstrativo">
        GP
      </span>
    );
  }

  return (
    <div className="theme-menu user-menu" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className="avatar avatar--button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Conta: ${session.name}`}
        title={session.name}
        onClick={() => setOpen((v) => !v)}
      >
        <UserAvatar size={30} label="" />
      </button>
      {open ? (
        <div className="menu user-menu__panel" role="menu" aria-label="Conta">
          <div className="user-menu__who">
            <UserAvatar size={40} label="" />
            <span className="user-menu__who-text">
              <strong>{session.name}</strong>
              <span>{session.email ?? 'Conta corporativa'}</span>
            </span>
          </div>
          <button
            type="button"
            role="menuitem"
            className="menu__item"
            onClick={() => {
              setOpen(false);
              setConfiguracoes('geral');
            }}
          >
            <Icon name="settings" size={16} />
            Configurações
          </button>
          <button
            type="button"
            role="menuitem"
            className="menu__item"
            onClick={() => {
              setOpen(false);
              auth.logout();
            }}
          >
            <Icon name="arrowLeft" size={16} />
            Sair
          </button>
        </div>
      ) : null}
      {configuracoes ? (
        <SettingsDialog
          initialSection={configuracoes}
          onClose={() => setConfiguracoes(null)}
          theme={theme}
          onThemeChange={onThemeChange}
          fontScale={fontScale}
          onFontDecrease={onFontDecrease}
          onFontIncrease={onFontIncrease}
          onOpenDelta={() => {
            setConfiguracoes(null);
            if (!copilotOpen) onToggleCopilot?.();
          }}
        />
      ) : null}
    </div>
  );
}
