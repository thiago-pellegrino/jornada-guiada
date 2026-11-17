/**
 * Selo de situação de tamanho único (DS §7.10 e §20.10.6): 150 × 22 px, ponto de estado,
 * texto truncado com reticências e title com o texto integral.
 */
export default function Badge({ variant = 'neutral', children, title, className = '' }) {
  const text = typeof children === 'string' ? children : undefined;
  return (
    <span className={`badge badge--${variant} ${className}`.trim()} title={title || text}>
      <span className="badge__text">{children}</span>
    </span>
  );
}
