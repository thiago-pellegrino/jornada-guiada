import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Sessão simulada do protótipo. Na versão com backend, a entrada corporativa será o SSO
 * (OIDC) e o perfil virá da identidade autenticada; aqui só guardamos quem entrou.
 */
const STORAGE_KEY = 'jornada.auth.v1';
const AuthContext = createContext(null);

function lerSessao() {
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) continue;
      const s = JSON.parse(raw);
      if (s && typeof s.name === 'string') return s;
    } catch {
      /* armazenamento indisponível ou corrompido: segue sem sessão */
    }
  }
  return null;
}

function gravarSessao(sessao, lembrar) {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
    if (sessao) (lembrar ? window.localStorage : window.sessionStorage).setItem(STORAGE_KEY, JSON.stringify(sessao));
  } catch {
    /* sem armazenamento a sessão vale só enquanto a página estiver aberta */
  }
}

export function initialsOf(name) {
  const partes = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '?';
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

function nomeDoEmail(email) {
  const local = String(email ?? '').split('@')[0];
  if (!local) return null;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(' ');
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => lerSessao());

  const loginCorporate = useCallback(({ email = '', remember = false } = {}) => {
    const limpo = email.trim();
    const sessao = {
      name: nomeDoEmail(limpo) ?? 'Usuário corporativo',
      email: limpo || null,
      method: 'corporativo',
      at: new Date().toISOString(),
    };
    gravarSessao(sessao, remember);
    setSession(sessao);
  }, []);

  /** Atualiza o nome exibido (Configurações › Geral). Mantém onde a sessão já estava guardada. */
  const updateName = useCallback((name) => {
    const nome = String(name ?? '').trim();
    if (!nome) return;
    setSession((atual) => {
      if (!atual) return atual;
      const nova = { ...atual, name: nome };
      let lembrar = false;
      try {
        lembrar = Boolean(window.localStorage.getItem(STORAGE_KEY));
      } catch {
        /* ignora */
      }
      gravarSessao(nova, lembrar);
      return nova;
    });
  }, []);

  /** Foto do perfil (data URL pequena) ou null para voltar à imagem padrão. */
  const updateAvatar = useCallback((avatar) => {
    setSession((atual) => {
      if (!atual) return atual;
      const nova = { ...atual, avatar: avatar || null };
      let lembrar = false;
      try {
        lembrar = Boolean(window.localStorage.getItem(STORAGE_KEY));
      } catch {
        /* ignora */
      }
      gravarSessao(nova, lembrar);
      return nova;
    });
  }, []);

  const logout = useCallback(() => {
    gravarSessao(null, false);
    setSession(null);
  }, []);

  const value = useMemo(() => ({ session, loginCorporate, logout, updateName, updateAvatar }), [session, loginCorporate, logout, updateName, updateAvatar]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return ctx;
}

export function useOptionalAuth() {
  return useContext(AuthContext);
}
