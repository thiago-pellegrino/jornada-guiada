import { useCallback, useEffect, useRef, useState } from 'react';
import ProjectBar from '../journey/ProjectBar.jsx';
import DarklabSidebar from '../darklab/DarklabSidebar.jsx';
import DarklabMotorsView from '../darklab/DarklabMotorsView.jsx';
import { DarklabOverview, DarklabPlaceholder } from '../darklab/DarklabScreens.jsx';
import { DARKLAB_INDEX, DEFAULT_DARKLAB_VIEW } from '../darklab/darklabMenu.js';

const VIEW_KEY = 'jornada.darklab.view';
const COLLAPSED_KEY = 'jornada.darklab.menu-recolhido';

/**
 * Telas do menu já implementadas. Os demais itens mostram a tela provisória até o layout chegar;
 * para ligar uma tela nova, basta registrá-la aqui pelo id do item em darklabMenu.js.
 */
const DARKLAB_SCREENS = {
  'visao-geral': DarklabOverview,
  'jornada-7-motores': DarklabMotorsView,
};

function lerVista() {
  try {
    const v = window.sessionStorage.getItem(VIEW_KEY);
    if (v && (DARKLAB_INDEX.has(v) || v === 'editar-perfil')) return v;
  } catch {
    /* sem sessionStorage: começa na visão geral */
  }
  return DEFAULT_DARKLAB_VIEW;
}

/** Aba "DarkLabs": menu lateral de funcionalidades e a tela do item selecionado. */
export default function DarklabTab() {
  const [view, setView] = useState(lerVista);
  const [recolhido, setRecolhido] = useState(() => {
    try {
      return window.localStorage.getItem(COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const alternarMenu = useCallback(() => {
    setRecolhido((v) => {
      try {
        window.localStorage.setItem(COLLAPSED_KEY, v ? '0' : '1');
      } catch {
        /* ignora */
      }
      return !v;
    });
  }, []);
  const contentRef = useRef(null);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(VIEW_KEY, view);
    } catch {
      /* ignora */
    }
  }, [view]);

  const select = useCallback((id) => {
    setView(id);
    contentRef.current?.scrollIntoView({ block: 'nearest' });
  }, []);

  const Tela = DARKLAB_SCREENS[view];

  return (
    <div className="jg-page">
      <ProjectBar current="darklab" />
      <div className={`dlm-layout ${recolhido ? 'is-collapsed' : ''}`}>
        <DarklabSidebar active={view} onSelect={select} collapsed={recolhido} onToggleCollapsed={alternarMenu} />
        <div className="dlm-content" ref={contentRef}>
          {Tela ? <Tela onSelect={select} /> : <DarklabPlaceholder viewId={view} />}
        </div>
      </div>
    </div>
  );
}
