import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { initialsOf, useOptionalAuth } from '../../auth/AuthContext.jsx';

/** Avatar da barra superior com o usuário da sessão e a opção Sair. Sem sessão, mostra o avatar estático. */
export default function UserMenu() {
  const auth = useOptionalAuth();
  const [open, setOpen] = useState(false);
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
        {initialsOf(session.name)}
      </button>
      {open ? (
        <div className="menu user-menu__panel" role="menu" aria-label="Conta">
          <div className="user-menu__who">
            <strong>{session.name}</strong>
            <span>{session.email ?? 'Conta corporativa'}</span>
          </div>
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
    </div>
  );
}
