/**
 * Formatação pt-BR compartilhada entre interface, exportação CSV e Copiloto.
 * Funções puras, sem dependência de DOM.
 */

const cache = new Map();

function formatter(min, max) {
  const key = `${min}-${max}`;
  if (!cache.has(key)) {
    cache.set(
      key,
      new Intl.NumberFormat('pt-BR', { minimumFractionDigits: min, maximumFractionDigits: max }),
    );
  }
  return cache.get(key);
}

export function fmtNumber(value, decimals = 0, minDecimals = decimals) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (!Number.isFinite(value)) return '∞';
  return formatter(minDecimals, decimals).format(value);
}

export function fmtHours(value) {
  return `${fmtNumber(value, 0)} h`;
}

export function fmtWeeks(value, decimals = 1) {
  if (!Number.isFinite(value)) return '∞';
  return fmtNumber(value, decimals, 0);
}

export function fmtPct(ratio, decimals = 1) {
  if (!Number.isFinite(ratio)) return '—';
  return `${fmtNumber(ratio * 100, decimals, decimals)}%`;
}

export function plural(count, singular, pluralForm) {
  return `${fmtNumber(count, 0)} ${count === 1 ? singular : pluralForm}`;
}
