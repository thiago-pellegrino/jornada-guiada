import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useOptionalAuth } from '../../../auth/AuthContext.jsx';
import UserAvatar, { abrirConfiguracoes } from '../../../components/user/UserAvatar.jsx';
import { useJourney } from '../../../journey/JourneyContext.jsx';
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

/** Mantém --dlm-h igual à altura visível da área de rolagem (muda ao recolher o mosaico ou redimensionar), sem animar. */
function useAlturaDaTela(ref) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const alvo = scrollParent(el);
    const layout = el.parentElement;
    const workspace = el.closest('.workspace');
    const medir = () => {
      // Usa a altura FINAL da área rolável: enquanto o bloco de imagens recolhe/expande (transição de
      // 380 ms), a área muda a cada quadro; sem isso o menu "cresce para baixo" animado.
      let visivel = alvo ? alvo.clientHeight : window.innerHeight;
      const colapso = workspace?.querySelector('.hero-mosaic-collapse');
      if (alvo && colapso) {
        const atual = colapso.getBoundingClientRect().height;
        const cheio = colapso.querySelector('.hero-mosaic')?.getBoundingClientRect().height ?? atual;
        const recolhido = workspace.classList.contains('is-mosaic-collapsed');
        visivel += recolhido ? atual : atual - cheio;
      }
      // Espaço abaixo do layout (paddings e rodapé da página): sem descontá-lo, o menu "sobe" no fim da
      // rolagem. É medido pela posição exata do último elemento da área rolável — e não por scrollHeight,
      // que é arredondado: o arredondamento mudava a altura do menu em 1 px, que mudava a página em 1 px,
      // e o ciclo se repetia a cada quadro (o "tremor").
      // Soma só o que existe de fato abaixo do layout: irmãos seguintes e paddings de cada nível até a
      // área rolável, mais o rodapé. (A área de conteúdo estica para preencher a tela; usar a posição
      // dela contava esse esticamento como conteúdo e encolhia o menu.)
      let abaixo = 8;
      if (alvo && layout) {
        const px = (v) => parseFloat(v) || 0;
        const fimLayout = layout.getBoundingClientRect().bottom;
        let fim = fimLayout;
        let no = layout;
        while (no.parentElement && no.parentElement !== alvo) {
          const pai = no.parentElement;
          for (let irmao = no.nextElementSibling; irmao; irmao = irmao.nextElementSibling) {
            const r = irmao.getBoundingClientRect();
            if (r.height) fim = Math.max(fim, r.bottom + px(window.getComputedStyle(irmao).marginBottom));
          }
          const ep = window.getComputedStyle(pai);
          fim += px(ep.paddingBottom) + px(ep.borderBottomWidth);
          no = pai;
        }
        for (let irmao = no.nextElementSibling; irmao; irmao = irmao.nextElementSibling) {
          const ei = window.getComputedStyle(irmao);
          fim += irmao.getBoundingClientRect().height + px(ei.marginTop) + px(ei.marginBottom);
        }
        abaixo = Math.max(8, fim - fimLayout + px(window.getComputedStyle(alvo).paddingBottom));
      }
      // Altura cheia (menu fixo a 8 px do topo enquanto a página rola) só quando o conteúdo da tela
      // precisa de rolagem. Com pouco conteúdo, o menu ocupa só o espaço que sobra abaixo da barra
      // do projeto — assim a página não ganha uma barra de rolagem à toa.
      const cheia = visivel - 8 - abaixo;
      let altura = cheia;
      const conteudo = el.parentElement?.querySelector(':scope > .dlm-content');
      if (alvo && layout && conteudo) {
        const topoDoLayout = layout.getBoundingClientRect().top - alvo.getBoundingClientRect().top + alvo.scrollTop;
        const semRolar = visivel - topoDoLayout - abaixo;
        altura = Math.max(semRolar, Math.min(cheia, conteudo.getBoundingClientRect().height));
      }
      altura = Math.max(280, Math.floor(altura));
      const atual = parseFloat(el.style.getPropertyValue('--dlm-h')) || 0;
      // Só aplica mudanças reais (≥ 1 px): evita reagir ao próprio ajuste.
      if (Math.abs(altura - atual) >= 1) el.style.setProperty('--dlm-h', `${altura}px`);
    };
    medir();
    const obs = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(medir) : null;
    if (obs && alvo) obs.observe(alvo);
    if (obs && layout) obs.observe(layout);
    const conteudoObs = el.parentElement?.querySelector(':scope > .dlm-content');
    if (obs && conteudoObs) obs.observe(conteudoObs);
    // Remede no instante em que o bloco de imagens começa a recolher/expandir.
    const classe = workspace && typeof MutationObserver !== 'undefined' ? new MutationObserver(medir) : null;
    classe?.observe(workspace, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', medir);
    return () => {
      obs?.disconnect();
      classe?.disconnect();
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
