/**
 * Ícone de agente de IA (cabeça de robô com antena), no mesmo padrão da biblioteca de ícones:
 * viewBox 24×24, traço currentColor 1.65, decorativo (aria-hidden). Usado nos botões que acionam um agente.
 */
export default function AgentIcon({ size = 16, className = '' }) {
  return (
    <svg
      className={`icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="3.4" r="1.2" />
      <path d="M12 4.6V7" />
      <rect x="4.5" y="7" width="15" height="11.5" rx="3.5" />
      <path d="M2.5 11.5v3M21.5 11.5v3M9.5 15.4h5" />
      <circle cx="9" cy="11.8" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="15" cy="11.8" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}
