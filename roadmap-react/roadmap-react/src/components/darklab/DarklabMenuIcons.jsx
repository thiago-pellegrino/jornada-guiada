/** Ícones de traço do menu Darklab (24×24, currentColor), no mesmo estilo da biblioteca de ícones. */
const PATHS = {
  home: (
    <>
      <path d="M3.5 10.5 12 4l8.5 6.5" />
      <path d="M5.5 9v10.5h13V9" />
      <path d="M10 19.5V14h4v5.5" />
    </>
  ),
  journal: (
    <>
      <path d="M6 3.5h11.5v14H7.5A1.5 1.5 0 0 0 6 19v-15.5Z" />
      <path d="M6 19a1.5 1.5 0 0 0 1.5 1.5h10v-3" />
      <path d="M9.5 3.5v14" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="17" cy="17" r="2" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 12 18.5 5.5M16 5.5h2.5V8" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M15.5 5.2a3.5 3.5 0 0 1 0 6.6M17.5 14.4c2 .8 3.5 2.9 3.5 5.6" />
    </>
  ),
  usersGroup: (
    <>
      <circle cx="12" cy="8" r="3" />
      <path d="M6.5 19.5c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" />
      <circle cx="5" cy="10" r="2" />
      <circle cx="19" cy="10" r="2" />
      <path d="M2 18c0-1.8 1.2-3.3 3-3.8M22 18c0-1.8-1.2-3.3-3-3.8" />
    </>
  ),
  infinity: <path d="M7.5 8.5a3.5 3.5 0 1 0 0 7c2 0 3.2-1.6 4.5-3.5s2.5-3.5 4.5-3.5a3.5 3.5 0 1 1 0 7c-2 0-3.2-1.6-4.5-3.5S9.5 8.5 7.5 8.5Z" />,
  bars: (
    <>
      <path d="M4 20h16" />
      <path d="M6.5 20v-6M10.5 20V8M14.5 20v-9M18.5 20V5" />
    </>
  ),
  rocket: (
    <>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </>
  ),
  key: (
    <>
      <circle cx="7.5" cy="15.5" r="3.5" />
      <path d="m10 13 8.5-8.5M16 7l2.5 2.5M14 9l2 2" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </>
  ),
  file: (
    <>
      <path d="M6 3.5h8l4 4v13H6v-17Z" />
      <path d="M14 3.5V8h4M9 12h6M9 15.5h6" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  lock: (
    <>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  chevron: <path d="m8 10 4 4 4-4" />,
  panelLeft: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <path d="M9.5 4.5v15M15.5 10l-2 2 2 2" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  /* Ícones dos 7 motores */
  frame: (
    <>
      <path d="M4 8.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3M15.5 4h3A1.5 1.5 0 0 1 20 5.5v3M20 15.5v3a1.5 1.5 0 0 1-1.5 1.5h-3M8.5 20h-3A1.5 1.5 0 0 1 4 18.5v-3" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  signal: (
    <>
      <circle cx="12" cy="12" r="1.8" />
      <path d="M8.3 15.7a5.2 5.2 0 0 1 0-7.4M15.7 8.3a5.2 5.2 0 0 1 0 7.4" />
      <path d="M5.5 18.5a9.2 9.2 0 0 1 0-13M18.5 5.5a9.2 9.2 0 0 1 0 13" />
    </>
  ),
  penTool: (
    <>
      <path d="m12 19.5 7-7 2.5 2.5-7 7-2.5-2.5Z" />
      <path d="m17.5 13.5-1.4-7L3 3l3.5 13.1 7 1.4" />
      <path d="m3 3 7.2 7.2" />
      <circle cx="11.5" cy="11.5" r="1.8" />
    </>
  ),
  cube: (
    <>
      <path d="M20.5 16V8a1.6 1.6 0 0 0-.8-1.4l-6.9-4a1.6 1.6 0 0 0-1.6 0l-6.9 4A1.6 1.6 0 0 0 3.5 8v8a1.6 1.6 0 0 0 .8 1.4l6.9 4a1.6 1.6 0 0 0 1.6 0l6.9-4a1.6 1.6 0 0 0 .8-1.4Z" />
      <path d="M3.9 7.2 12 12l8.1-4.8M12 21.6V12" />
    </>
  ),
  flask: (
    <>
      <path d="M9 3h6M10 3v6.2L4.6 18.6A1.6 1.6 0 0 0 6 21h12a1.6 1.6 0 0 0 1.4-2.4L14 9.2V3" />
      <path d="M7.2 15h9.6" />
    </>
  ),
  telescope: (
    <>
      <path d="m4.2 14.6 12.6-7.3 1.8 3.1L6 17.7z" />
      <path d="m16.8 7.3 2-1.2 1.8 3.1-2 1.2M3 15.3l1.2-.7 1.8 3.1-1.2.7" />
      <path d="m11 15.4 3 5.1M12.5 15.2 10 20.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 5 6v5.5c0 4.2 3 7.6 7 9 4-1.4 7-4.8 7-9V6l-7-2.5Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  play: <path d="M8 5.5v13l10-6.5-10-6.5Z" />,
  refresh: (
    <>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.5 4.5v4h-4" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  history: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
      <path d="M3.5 4.5V8h3.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
};

export default function DarklabMenuIcon({ name, size = 18, className = '' }) {
  return (
    <svg
      className={`dlm-icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name] ?? PATHS.file}
    </svg>
  );
}
