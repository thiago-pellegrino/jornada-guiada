import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'roadmap.fontScale.v1';

/** Escalas de fonte raiz em px (índice 2 = 14.5px é o padrão). */
export const FONT_SCALE_STEPS = Object.freeze([12.5, 13.5, 14.5, 15.5, 16.5, 18, 19.5]);
export const DEFAULT_FONT_SCALE_INDEX = 2;

function readInitialStep() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_FONT_SCALE_INDEX;
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed < FONT_SCALE_STEPS.length) {
      return parsed;
    }
  } catch {
    /* sem armazenamento */
  }
  return DEFAULT_FONT_SCALE_INDEX;
}

function applyRootFontSize(px) {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--font-root-size', `${px}px`);
}

export function useFontScale() {
  const [step, setStep] = useState(readInitialStep);
  const currentPx = FONT_SCALE_STEPS[step] ?? FONT_SCALE_STEPS[DEFAULT_FONT_SCALE_INDEX];
  const basePx = FONT_SCALE_STEPS[DEFAULT_FONT_SCALE_INDEX];
  const percent = Math.round((currentPx / basePx) * 100);

  useEffect(() => {
    applyRootFontSize(currentPx);
  }, [currentPx]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== STORAGE_KEY) return;
      const parsed = Number(event.newValue);
      if (Number.isInteger(parsed) && parsed >= 0 && parsed < FONT_SCALE_STEPS.length) {
        setStep(parsed);
      } else {
        setStep(DEFAULT_FONT_SCALE_INDEX);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persist = useCallback((next) => {
    setStep(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      /* sem armazenamento */
    }
  }, []);

  const decrease = useCallback(() => {
    if (step <= 0) return null;
    const next = step - 1;
    persist(next);
    return Math.round((FONT_SCALE_STEPS[next] / basePx) * 100);
  }, [step, basePx, persist]);

  const increase = useCallback(() => {
    if (step >= FONT_SCALE_STEPS.length - 1) return null;
    const next = step + 1;
    persist(next);
    return Math.round((FONT_SCALE_STEPS[next] / basePx) * 100);
  }, [step, basePx, persist]);

  const reset = useCallback(() => {
    persist(DEFAULT_FONT_SCALE_INDEX);
    return 100;
  }, [persist]);

  return {
    step,
    currentPx,
    percent,
    percentLabel: `${percent}%`,
    canDecrease: step > 0,
    canIncrease: step < FONT_SCALE_STEPS.length - 1,
    decrease,
    increase,
    reset,
  };
}
