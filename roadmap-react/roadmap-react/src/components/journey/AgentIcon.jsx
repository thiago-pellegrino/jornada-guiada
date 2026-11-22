/**
 * Ícone de agente de IA: o robô do Delta (cabeça arredondada, antena, orelhas e olhos em pílula),
 * no padrão da biblioteca de ícones: viewBox 24×24, traço currentColor 1.65, decorativo (aria-hidden).
 * Usado nos botões que acionam um agente (Gerar, Analisar, Executar).
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
      <circle cx="12" cy="3.7" r="1.4" />
      <path d="M12 5.6v3" />
      <rect x="3.8" y="8.6" width="16.4" height="13.1" rx="3.7" />
      <path d="M1.6 13.5v3.3M22.4 13.5v3.3" />
      <rect x="8.05" y="12.95" width="2.4" height="4.4" rx="1.2" fill="currentColor" stroke="none" />
      <rect x="13.55" y="12.95" width="2.4" height="4.4" rx="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
