import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';
const OPTIONS = ['light', 'dark', 'system'];
const THEME_COLORS = { light: '#f7f7f8', dark: '#0f1419' };

function readPreference() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return OPTIONS.includes(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

function systemTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved) {
  const root = document.documentElement;
  root.setAttribute('data-theme', resolved);
  root.style.colorScheme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLORS[resolved]);
}

/**
 * Tema Claro / Escuro / Sistema (DS §19): persistido em localStorage("theme"),
 * reage ao sistema operacional e sincroniza entre abas pelo evento `storage`.
 */
export function useTheme() {
  const [preference, setPreferenceState] = useState(readPreference);
  const [system, setSystem] = useState(systemTheme);
  const resolved = preference === 'system' ? system : preference;

  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystem(query.matches ? 'dark' : 'light');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === STORAGE_KEY) setPreferenceState(OPTIONS.includes(event.newValue) ? event.newValue : 'system');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setPreference = useCallback((next) => {
    if (!OPTIONS.includes(next)) return;
    setPreferenceState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* armazenamento indisponível: mantém só na sessão */
    }
  }, []);

  return { preference, resolved, setPreference };
}
