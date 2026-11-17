/**
 * Biblioteca de ícones SVG inline (DS §5): viewBox 24×24, traço currentColor 1.65,
 * decorativos por padrão (aria-hidden). Sempre acompanhar de texto visível ou aria-label no controle.
 */

const PATHS = {
  home: <path d="M3 10.5 12 3l9 7.5M5.5 9v11h13V9" />,
  check: <path d="m4.5 12.5 4.5 4.5L19.5 6.5" />,
  star: <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.4-4.4" />
    </>
  ),
  chevronRight: <path d="m9 5 7 7-7 7" />,
  chevronDown: <path d="m5 9 7 7 7-7" />,
  arrowLeft: <path d="M19 12H5m6-6-6 6 6 6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />,
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  sliders: <path d="M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6" />,
  download: <path d="M12 4v11m-5-5 5 5 5-5M5 20h14" />,
  upload: <path d="M12 20V9m-5 5 5-5 5 5M5 4h14" />,
  fileExport: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 14l3 3 3-3M12 10v7" />
    </>
  ),
  undo: <path d="M9 7 4.5 11.5 9 16M5 11.5h9.5a5 5 0 0 1 0 10H12" />,
  reset: <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" />,
  warning: <path d="M12 4 2.8 19.5h18.4zM12 10v4.5M12 17.2v.3" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.8v.3" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M2.8 20a6.2 6.2 0 0 1 12.4 0M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.2a6.2 6.2 0 0 1 3.2 5.8" />
    </>
  ),
  chart: <path d="M4 4v16h16M7.5 15l3.5-4 3 2.5 5-6.5" />,
  gauge: (
    <>
      <path d="M3.5 16a8.5 8.5 0 0 1 17 0" />
      <path d="m12 16 4-5" />
      <circle cx="12" cy="16" r="1.2" />
    </>
  ),
  roadmap: <path d="M4 6h9M4 12h13M4 18h7M15 4v4M19 10v4M13 16v4" />,
  layers: <path d="m12 3 9 5-9 5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5" />,
  folder: <path d="M3.5 6.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />,
  report: (
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M9.5 16v-3M12.5 16v-5.5M15.5 16v-2" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v2.4M12 18.8v2.4M4.2 7.4l2.1 1.2M17.7 15.4l2.1 1.2M4.2 16.6l2.1-1.2M17.7 8.6l2.1-1.2" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7.5h14.5a1.5 1.5 0 0 1 1.5 1.5v9.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18.5V6a1.5 1.5 0 0 1 1.5-1.5H16" />
      <path d="M16 13.5h4" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </>
  ),
  tasks: <path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 1.8-2M4 12l1 1 1.8-2M4 18l1 1 1.8-2" />,
  sparkle: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
  send: <path d="m4 12 16-8-6 16-2.5-6.5z" />,
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  collapse: <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />,
  wand: <path d="m4 20 11-11M14 4v2.5M19.5 9.5H17M17.8 5.7l-1.8 1.8M11.5 6.5h-2M15 11v2" />,
  edit: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />,
  eraser: <path d="m7 19-3.5-3.5a1.5 1.5 0 0 1 0-2.1L13 4l7 7-8 8zM9 19h11M10 7l7 7" />,
  filter: <path d="M4 5h16l-6 7.5V19l-4 1.5v-8z" />,
  grid: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M3.5 9.5h17M3.5 15h17M9.5 3.5v17M15 3.5v17" />
    </>
  ),
  gantt: <path d="M4 5h8M7 10h9M10 15h8M5 20h5" />,
  table: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M3.5 14.5h17M10 9.5v10" />
    </>
  ),
  fontDecrease: (
    <>
      <path d="M3 19 8 6l5 13M4.9 14.2h6.2" />
      <path d="M15 11.5h6" />
    </>
  ),
  fontIncrease: (
    <>
      <path d="M3 19 8 6l5 13M4.9 14.2h6.2" />
      <path d="M15 11.5h6M18 8.5v6" />
    </>
  ),
};

export default function Icon({ name, size = 20, className = '', strokeWidth = 1.65, title }) {
  const content = PATHS[name] || PATHS.folder;
  return (
    <svg
      className={`icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {content}
    </svg>
  );
}

/** Marca do Copiloto: vela/ponta de seta com ponto (DS §5), dourada sobre navy. */
export function CopilotMark({ size = 20 }) {
  return (
    <svg
      className="icon copilot-glyph"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M16 4 7 27l9-5 9 5z" />
      <path d="M16 4v18" />
      <circle cx="16" cy="13" r="1.4" fill="currentColor" />
    </svg>
  );
}
