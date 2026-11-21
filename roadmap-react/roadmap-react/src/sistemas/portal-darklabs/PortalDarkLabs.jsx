import { useCallback, useEffect, useState } from 'react';
import DarklabSidebar from './components/DarklabSidebar.jsx';
import DarklabMotorsView from './components/DarklabMotorsView.jsx';
import DarklabRoadmapView from './components/DarklabRoadmapView.jsx';
import DarklabFuturoView from './components/DarklabFuturoView.jsx';
import DarklabVamosAlemView from './components/DarklabVamosAlemView.jsx';
import DarklabProtocoloView from './components/DarklabProtocoloView.jsx';
import DarklabDiarioView from './components/DarklabDiarioView.jsx';
import DarklabPersonasView from './components/DarklabPersonasView.jsx';
import DarklabVisaoGeralView from './components/DarklabVisaoGeralView.jsx';
import { DarklabPlaceholder } from './components/DarklabScreens.jsx';
import { DARKLAB_INDEX, DEFAULT_DARKLAB_VIEW } from './components/darklabMenu.js';

const VIEW_KEY = 'portal-darklabs.view';
const COLLAPSED_KEY = 'portal-darklabs.menu-recolhido';

/**
 * Telas do menu já implementadas. Os demais itens mostram a tela provisória até o layout chegar;
 * para ligar uma tela nova, basta registrá-la aqui pelo id do item em darklabMenu.js.
 */
const DARKLAB_SCREENS = {
  'visao-geral': DarklabVisaoGeralView,
  'jornada-7-motores': DarklabMotorsView,
  'aprendizados-roadmap': DarklabRoadmapView,
  'jornada-futuro': DarklabFuturoView,
  'vamos-alem': DarklabVamosAlemView,
  'protocolo-5-etapas': DarklabProtocoloView,
  publicacoes: DarklabDiarioView,
  'personas-sinteticas': DarklabPersonasView,
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

/**
 * Portal DarkLabs (menu de sistemas do topbar): o mesmo conteúdo da aba DarkLabs da Jornada Guiada,
 * com cópia própria das telas em ./components e sem a barra do projeto. Menu lateral de funcionalidades e a tela do item selecionado.
 */
export default function PortalDarkLabs() {
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

  // Outras partes do sistema (ex.: dicas da mascote do Delta) podem abrir um item do menu.
  useEffect(() => {
    const abrir = (e) => {
      if (DARKLAB_INDEX.has(e.detail)) setView(e.detail);
    };
    window.addEventListener('jornada:darklab-view', abrir);
    return () => window.removeEventListener('jornada:darklab-view', abrir);
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(VIEW_KEY, view);
    } catch {
      /* ignora */
    }
  }, [view]);

  // Trocar de item do menu não rola a página: ela fica onde o usuário estava.
  const select = useCallback((id) => {
    setView(id);
  }, []);

  const Tela = DARKLAB_SCREENS[view];

  return (
    <div className="jg-page">
      <div className={`dlm-layout ${recolhido ? 'is-collapsed' : ''}`}>
        <DarklabSidebar active={view} onSelect={select} collapsed={recolhido} onToggleCollapsed={alternarMenu} />
        <div className="dlm-content">
          {Tela ? <Tela onSelect={select} /> : <DarklabPlaceholder viewId={view} />}
        </div>
      </div>
    </div>
  );
}
