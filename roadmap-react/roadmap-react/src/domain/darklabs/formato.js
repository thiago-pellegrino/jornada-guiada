/** Formatação pt-BR usada nos textos e indicadores da simulação do DarkLabs. */
export const fmt = (n) => Math.round(n).toLocaleString('pt-BR');

/** Número com até 1 casa decimal, no formato brasileiro (10,6). */
export const num = (n) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 });

export const pct = (n) => `${Math.round(n)}%`;

/** Valores em reais abreviados: R$ 3,1 mi, R$ 620 mil, R$ 1,2 bi. */
export function brl(n) {
  n = Math.round(n || 0);
  if (Math.abs(n) >= 1e9) return `R$ ${(n / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} bi`;
  if (Math.abs(n) >= 1e6) return `R$ ${(n / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
  if (Math.abs(n) >= 1e3) return `R$ ${(n / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`;
  return `R$ ${n}`;
}

/** Primeira letra minúscula (para encaixar a frase no meio de outra). */
export const lc = (s) => String(s || '').replace(/^./, (ch) => ch.toLowerCase());

/** p-valor no formato do dossiê: "< 0,001" ou "= 0,023". */
export const pvalor = (p) => (p < 0.001 ? '< 0,001' : `= ${p.toFixed(3).replace('.', ',')}`);

export const dec1 = (x) => x.toFixed(1).replace('.', ',');
