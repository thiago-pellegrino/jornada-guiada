import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useOptionalAuth } from '../../auth/AuthContext.jsx';
import UserAvatar, { abrirConfiguracoes } from '../user/UserAvatar.jsx';
import { useJourney } from '../../journey/JourneyContext.jsx';
import { DARKLAB_MENU, groupOf } from './darklabMenu.js';
import DarklabMenuIcon from './DarklabMenuIcons.jsx';

/** Área que rola a página (no app, o <main>); o menu ocupa a altura visível dela. */
function scrollParent(el) {
  let node = el?.parentElement;
  while (node && node !== document.body) {
    if (/(auto|scroll)/.test(window.getComputedStyle(node).overflowY)) return node;
    node = node.parentElement;
  }
  return null;
}

/** Mantém --dlm-h igual à altura visível da área de rolagem (muda ao recolher o mosaico ou redimensionar). */
function useAlturaDaTela(ref) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const alvo = scrollParent(el);
    const layout = el.parentElement;
    const medir = () => {
      const visivel = alvo ? alvo.clientHeight : window.innerHeight;
      // Espaço abaixo do layout (paddings da página): sem descontá-lo, o menu "sobe" no fim da rolagem.
      let abaixo = 8;
      if (alvo && layout) {
        const fimDoLayout = layout.getBoundingClientRect().bottom - alvo.getBoundingClientRect().top + alvo.scrollTop;
        abaixo = Math.max(8, alvo.scrollHeight - fimDoLayout);
      }
      el.style.setProperty('--dlm-h', `${Math.max(280, visivel - 8 - abaixo)}px`);
    };
    medir();
    const obs = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(medir) : null;
    if (obs && alvo) obs.observe(alvo);
    if (obs && layout) obs.observe(layout);
    window.addEventListener('resize', medir);
    return () => {
      obs?.disconnect();
      window.removeEventListener('resize', medir);
    };
  }, [ref]);
}

function Item({ item, active, onSelect, child = false, collapsed = false }) {
  const atual = active === item.id;
  const dica = collapsed ? item.label : item.locked ? 'Acesso restrito a Aprovador e Administrador' : undefined;
  return (
    <li>
      <button
        type="button"
        className={`dlm-item ${child ? 'dlm-item--child' : ''} ${atual ? 'is-active' : ''}`}
        aria-current={atual ? 'page' : undefined}
        aria-label={collapsed ? item.label : undefined}
        onClick={() => onSelect(item.id)}
        title={dica}
      >
        <DarklabMenuIcon name={item.icon} size={child ? 17 : 18} />
        <span className="dlm-item__label">{item.label}</span>
        {item.locked ? <DarklabMenuIcon name="lock" size={15} className="dlm-item__trail" /> : null}
      </button>
    </li>
  );
}

/** Menu lateral da aba DarkLabs: identidade e status, grupos recolhíveis e gestão do projeto. */
export default function DarklabSidebar({ active, onSelect, collapsed = false, onToggleCollapsed }) {
  const auth = useOptionalAuth();
  const { project } = useJourney();
  const [aberto, setAberto] = useState(() => groupOf(active));
  const ref = useRef(null);
  useAlturaDaTela(ref);

  // Ao navegar para uma tela de outro grupo (por um link), abre o grupo dela.
  useEffect(() => {
    const g = groupOf(active);
    if (g) setAberto(g);
  }, [active]);

  const nome = auth?.session?.name ?? 'Usuário';
  const papel = project?.members?.find((m) => m.id === 'usr-001')?.role ?? 'Administrador';

  function alternarGrupo(id) {
    if (collapsed) {
      onToggleCollapsed?.();
      setAberto(id);
      return;
    }
    setAberto((atual) => (atual === id ? null : id));
  }

  return (
    <aside ref={ref} className={`dlm ${collapsed ? 'is-collapsed' : ''}`} aria-label="Menu do DarkLabs">
      <div className="dlm-panel">
        <header className="dlm-head">
          <button
            type="button"
            className="dlm-collapse"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            <DarklabMenuIcon name="panelLeft" size={18} />
          </button>
          <UserAvatar size={collapsed ? 40 : 72} className="dlm-avatar" label={collapsed ? nome : ''} />
          <div className="dlm-head__who">
            <strong>{nome}</strong>
            <span>{papel}</span>
          </div>
          <button type="button" className="dlm-edit" onClick={() => abrirConfiguracoes('geral')}>
            <DarklabMenuIcon name="pencil" size={14} /> Editar perfil
          </button>
        </header>

        <nav className="dlm-nav">
          <ul className="dlm-list">
            {DARKLAB_MENU.map((entrada) => {
              if (entrada.section) {
                return (
                  <li key={entrada.section} className="dlm-section">
                    <p className="dlm-section__title">{entrada.section}</p>
                    <ul className="dlm-list">
                      {entrada.items.map((item) => (
                        <Item key={item.id} item={item} active={active} onSelect={onSelect} collapsed={collapsed} />
                      ))}
                    </ul>
                  </li>
                );
              }
              if (!entrada.children) return <Item key={entrada.id} item={entrada} active={active} onSelect={onSelect} collapsed={collapsed} />;
              const open = !collapsed && aberto === entrada.id;
              const contemAtual = entrada.children.some((c) => c.id === active);
              return (
                <li key={entrada.id} className={`dlm-group ${open ? 'is-open' : ''}`}>
                  <button
                    type="button"
                    className={`dlm-item dlm-group__head ${contemAtual ? 'has-active' : ''}`}
                    aria-expanded={open}
                    aria-controls={`dlm-${entrada.id}`}
                    aria-label={collapsed ? entrada.label : undefined}
                    title={collapsed ? entrada.label : undefined}
                    onClick={() => alternarGrupo(entrada.id)}
                  >
                    <DarklabMenuIcon name={entrada.icon} size={18} />
                    <span className="dlm-item__label">{entrada.label}</span>
                    {contemAtual && !open ? <span className="dlm-item__pip" aria-hidden="true" /> : null}
                    <DarklabMenuIcon name="chevron" size={14} className="dlm-item__trail dlm-chevron" />
                  </button>
                  {open ? (
                    <ul id={`dlm-${entrada.id}`} className="dlm-list dlm-group__children">
                      {entrada.children.map((item) => (
                        <Item key={item.id} item={item} active={active} onSelect={onSelect} child />
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
