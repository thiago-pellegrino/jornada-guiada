/** Ícones de traço dos cadernos de anotações (24×24, currentColor). */
const P = {
  folder: <path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-10Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  folderPlus: (
    <>
      <path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-10Z" />
      <path d="M12 11v5M9.5 13.5h5" />
    </>
  ),
  folderFill: <path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-10Z" fill="currentColor" />,
  edit: (
    <>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19.5c0-3 2.5-5.5 5.5-5.5 1.4 0 2.6.5 3.6 1.3" />
      <path d="M18 14v6M15 17h6" />
    </>
  ),
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="18.5" cy="12" r="1.2" fill="currentColor" />
    </>
  ),
  summary: (
    <>
      <path d="M6 3.5h8l4 4v13H6v-17Z" />
      <path d="M9 11h6M9 14.5h4" />
      <path d="M18.5 2.5v3M17 4h3" />
    </>
  ),
  guide: (
    <>
      <rect x="6" y="3.5" width="12" height="17" rx="2.5" />
      <path d="M9.5 17.5h5" />
    </>
  ),
  quiz: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2.5" />
      <path d="M7.5 9.5h4v4h-4zM14 10h3M14 13h3" />
    </>
  ),
  cards: (
    <>
      <path d="M5.5 4.5h13v15l-6.5-4-6.5 4v-15Z" />
      <path d="M5.5 9h13" />
    </>
  ),
  plusCircle: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  sort: <path d="M4 7h16M7 12h10M10 17h4" />,
  grid: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </>
  ),
  list: (
    <>
      <circle cx="5.5" cy="6.5" r="1.3" />
      <circle cx="5.5" cy="12" r="1.3" />
      <circle cx="5.5" cy="17.5" r="1.3" />
      <path d="M10 6.5h10M10 12h10M10 17.5h10" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  back: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M16.5 12h-9M11 8l-4 4 4 4" />
    </>
  ),
  upload: <path d="M5 4.5h14M12 20V9M7.5 13.5 12 9l4.5 4.5" />,
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  cloud: <path d="M7 18.5h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.1 4.75 4.75 0 0 0 7 18.5Z" />,
  share: (
    <>
      <circle cx="18" cy="5.5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="18.5" r="2.5" />
      <path d="m8.3 10.8 7.4-4.1M8.3 13.2l7.4 4.1" />
    </>
  ),
  lock: (
    <>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  trash: <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" />,
  file: (
    <>
      <path d="M6 3.5h8l4 4v13H6v-17Z" />
      <path d="M14 3.5V8h4" />
    </>
  ),
  chat: <path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V17.5H5A1.5 1.5 0 0 1 3.5 16V7A1.5 1.5 0 0 1 5 5.5Z" />,
};

export default function NotebookIcon({ name, size = 18, className = '' }) {
  return (
    <svg
      className={`nb-icon ${className}`.trim()}
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
      {P[name] ?? P.file}
    </svg>
  );
}
