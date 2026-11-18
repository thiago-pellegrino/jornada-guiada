import { useEffect, useState } from 'react';
import { SCHEDULING_MODES } from '../../data/initialRoadmapData.js';
import { fmtPct } from '../../domain/format.js';
import Icon from '../ui/Icon.jsx';

/** Fotos de cada opção do carrossel (src/assets/hero/<nome>.jpg|png|webp). Sem a foto, fica a arte SVG. */
const HERO_IMAGES = import.meta.glob('../../assets/hero/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' });

function heroImage(name) {
  if (!name) return null;
  const entry = Object.entries(HERO_IMAGES).find(([path]) => path.split('/').pop().replace(/\.[^.]+$/, '') === name);
  return entry ? entry[1] : null;
}

/** Arte de fundo de cada box (SVG leve, sem dependência de imagens externas). */
function TileArtwork({ variant }) {
  if (variant === 'obsidian') {
    return (
      <svg className="hero-tile__svg" viewBox="0 0 640 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <radialGradient id="hm-glow-amber" cx="32%" cy="58%" r="46%">
            <stop offset="0%" stopColor="#ffbe55" stopOpacity="0.6" />
            <stop offset="40%" stopColor="#d97724" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#020408" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="640" height="420" fill="#020408" />
        <rect width="640" height="420" fill="url(#hm-glow-amber)" />
        <rect x="170" y="240" width="70" height="180" rx="10" fill="#c9771f" fillOpacity="0.85" />
        <rect x="170" y="240" width="70" height="18" rx="9" fill="#f4b04a" fillOpacity="0.9" />
        <ellipse cx="205" cy="190" rx="16" ry="44" fill="#ffd98e" fillOpacity="0.75" />
        <ellipse cx="205" cy="184" rx="7" ry="24" fill="#ffffff" fillOpacity="0.95" />
      </svg>
    );
  }
  if (variant === 'sapphire') {
    return (
      <svg className="hero-tile__svg" viewBox="0 0 640 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <radialGradient id="hm-sapphire" cx="62%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#5d6f86" />
            <stop offset="55%" stopColor="#1c2533" />
            <stop offset="100%" stopColor="#070a10" />
          </radialGradient>
          <pattern id="hm-mesh" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="7" cy="7" r="3.2" fill="none" stroke="#c9d4e2" strokeOpacity="0.35" strokeWidth="1.2" />
          </pattern>
        </defs>
        <rect width="640" height="220" fill="url(#hm-sapphire)" />
        <ellipse cx="420" cy="40" rx="330" ry="170" fill="url(#hm-mesh)" />
      </svg>
    );
  }
  if (variant === 'architect') {
    return (
      <svg className="hero-tile__svg" viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="hm-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c9d3da" />
            <stop offset="55%" stopColor="#7d93a2" />
            <stop offset="100%" stopColor="#24333d" />
          </linearGradient>
        </defs>
        <rect width="360" height="220" fill="url(#hm-sky)" />
        <path d="M0 150 Q 80 105 150 132 T 360 118 L 360 220 L 0 220 Z" fill="#2c4a3c" />
        <path d="M0 172 Q 120 150 220 166 T 360 160 L 360 220 L 0 220 Z" fill="#17291f" />
        <rect x="18" y="148" width="150" height="6" fill="#12abdb" fillOpacity="0.85" />
      </svg>
    );
  }
  return (
    <svg className="hero-tile__svg" viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="hm-cyber" cx="70%" cy="55%" r="60%">
          <stop offset="0%" stopColor="#8fd8ff" />
          <stop offset="35%" stopColor="#1f6fd1" />
          <stop offset="100%" stopColor="#061a3d" />
        </radialGradient>
      </defs>
      <rect width="360" height="220" fill="url(#hm-cyber)" />
      <g fill="none" stroke="#bfe9ff" strokeOpacity="0.35">
        <circle cx="252" cy="120" r="34" />
        <circle cx="252" cy="120" r="60" strokeDasharray="6 8" />
        <circle cx="252" cy="120" r="88" />
      </g>
    </svg>
  );
}

/**
 * Mosaico editorial (inspirado no layout DAILY.): cada box é um grupo de abas e funciona
 * como carrossel — setas e indicadores alternam entre as abas do grupo e abrem o conteúdo.
 */
export default function HeroCarouselMosaic({ activeTab, matrixView, onSelectTab, onSelectMatrixView, scenario, result }) {
  const { kpis, context } = result;
  const modeLabel = SCHEDULING_MODES.find((m) => m.id === scenario.premises.schedulingMode)?.short || 'C1';

  const groups = [
    {
      id: 'jornada',
      badge: 'Jornada Guiada',
      art: 'obsidian',
      layout: 'featured',
      icon: 'compass',
      author: 'Gestão de Portfólio',
      info: `${kpis.totalFeatures} features · ${kpis.totalStories} US`,
      slides: [
        { id: 'contexto', tab: 'contexto', title: 'Upstream: Criação de Contexto', image: 'jornada-contexto' },
        { id: 'darklab', tab: 'darklab', title: 'Darklab: Inception, Discovery e Value', image: 'jornada-darklab' },
        { id: 'backlog-futuro', tab: 'backlog-futuro', title: 'Backlog do Futuro', image: 'jornada-backlog-futuro' },
      ],
    },
    {
      id: 'escopo',
      badge: 'Backlog & Squads',
      art: 'sapphire',
      layout: 'wide',
      icon: 'users',
      author: `${scenario.squads.length} squads · ${kpis.totalPeople} profissionais`,
      info: `${kpis.totalFeatures} features`,
      slides: [
        { id: 'escopo-squads', tab: 'escopo-squads', title: 'Escopo das Squads', image: 'escopo-squads', position: 'center 30%' },
        { id: 'epicos', tab: 'epicos', title: 'Épicos, Features e Histórias', image: 'escopo-epicos' },
      ],
    },
    {
      id: 'planejamento',
      badge: 'Planejamento',
      art: 'architect',
      icon: 'gantt',
      author: 'Cronograma',
      info: `Início ${context.startWeekCode} · ${modeLabel}`,
      slides: [
        { id: 'plan-gantt', tab: 'planejamento', view: 'gantt', title: 'Planejamento: cronograma em Gantt', image: 'planejamento-gantt' },
        { id: 'plan-grid', tab: 'planejamento', view: 'grid', title: 'Planejamento: grade de histórias', image: 'planejamento-grid' },
      ],
    },
    {
      id: 'resultados',
      badge: 'Resultados',
      art: 'cyber',
      icon: 'gauge',
      author: 'Diagnóstico',
      info: `${fmtPct(kpis.completionPctBeforeFreeze)} até o Freezing`,
      slides: [
        { id: 'resultados', tab: 'resultados', title: 'Resultados e diagnóstico das squads', image: 'resultados-diagnostico' },
        { id: 'curva-res', tab: 'curva', title: 'Curva de entrega do backlog', image: 'resultados-curva' },
      ],
    },
  ];

  const [indices, setIndices] = useState({ jornada: 0, escopo: 0, planejamento: 0, resultados: 0 });

  // Mantém o slide visível coerente com a aba aberta.
  useEffect(() => {
    setIndices((prev) => {
      const next = { ...prev };
      if (activeTab === 'contexto') next.jornada = 0;
      if (activeTab === 'darklab') next.jornada = 1;
      if (activeTab === 'backlog-futuro') next.jornada = 2;
      if (activeTab === 'escopo-squads') next.escopo = 0;
      if (activeTab === 'epicos') next.escopo = 1;
      if (activeTab === 'planejamento') next.planejamento = matrixView === 'grid' ? 1 : 0;
      if (activeTab === 'resultados') next.resultados = 0;
      if (activeTab === 'curva') next.resultados = 1;
      return next;
    });
  }, [activeTab, matrixView]);

  function activate(group, index) {
    const slide = group.slides[index];
    setIndices((prev) => ({ ...prev, [group.id]: index }));
    onSelectTab(slide.tab);
    if (slide.view) onSelectMatrixView?.(slide.view);
  }

  function step(event, group, delta) {
    event.stopPropagation();
    const current = indices[group.id] ?? 0;
    activate(group, (current + delta + group.slides.length) % group.slides.length);
  }

  return (
    <nav className="hero-mosaic" aria-label="Grupos de abas da Jornada Guiada">
      {groups.map((group) => {
        const index = indices[group.id] ?? 0;
        const slide = group.slides[index];
        const isCurrent = slide.tab === activeTab && (!slide.view || slide.view === matrixView);
        return (
          <article
            key={group.id}
            className={['hero-tile', group.layout ? `hero-tile--${group.layout}` : '', isCurrent ? 'is-active' : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => activate(group, index)}
          >
            <TileArtwork variant={group.art} />
            {group.slides.map((item, sIdx) => {
              const src = heroImage(item.image);
              return src ? (
                <img
                  key={item.id}
                  className={`hero-tile__photo ${sIdx === index ? 'is-visible' : ''}`}
                  src={src}
                  style={item.position ? { objectPosition: item.position } : undefined}
                  alt=""
                  aria-hidden="true"
                  loading={sIdx === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              ) : null;
            })}
            <div className="hero-tile__scrim" aria-hidden="true" />

            <span className="hero-tile__pill">{group.badge}</span>

            <button
              type="button"
              className="hero-tile__arrow hero-tile__arrow--prev"
              onClick={(event) => step(event, group, -1)}
              aria-label={`Aba anterior em ${group.badge}`}
            >
              <Icon name="chevronRight" size={18} className="is-flipped-x" />
            </button>
            <button
              type="button"
              className="hero-tile__arrow hero-tile__arrow--next"
              onClick={(event) => step(event, group, 1)}
              aria-label={`Próxima aba em ${group.badge}`}
            >
              <Icon name="chevronRight" size={18} />
            </button>

            <div className="hero-tile__body">
              <h2 className="hero-tile__title">
                <button
                  type="button"
                  className="hero-tile__trigger"
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={(event) => {
                    event.stopPropagation();
                    activate(group, index);
                  }}
                >
                  {slide.title}
                </button>
              </h2>
              <div className="hero-tile__footer">
                <span className="hero-tile__author">
                  <span className="hero-tile__avatar" aria-hidden="true">
                    <Icon name={group.icon} size={14} />
                  </span>
                  <span className="hero-tile__author-name">{group.author}</span>
                </span>
                <span className="hero-tile__info tabular">
                  {group.info} | <Icon name="layers" size={13} />
                </span>
              </div>
            </div>

            <div className="hero-tile__dots" role="tablist" aria-label={`Abas de ${group.badge}`}>
              {group.slides.map((item, sIdx) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={sIdx === index}
                  aria-label={item.title}
                  title={item.title}
                  className={`hero-tile__dot ${sIdx === index ? 'is-selected' : ''}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    activate(group, sIdx);
                  }}
                />
              ))}
            </div>
          </article>
        );
      })}
    </nav>
  );
}

