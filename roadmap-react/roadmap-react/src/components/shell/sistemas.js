/**
 * Sistemas do menu do topbar. Cada um carrega toda a estrutura de páginas abaixo do topbar;
 * a Jornada Guiada é o sistema atual. A escolha fica salva no navegador.
 */
export const SISTEMAS = Object.freeze([
  { id: 'jornada-guiada', label: 'Jornada Guiada', icon: 'compass' },
  { id: 'portal-darklabs', label: 'Portal DarkLabs', icon: 'sparkle' },
  { id: 'em-financial', label: 'EM Financial', icon: 'wallet' },
  { id: 'em-audit', label: 'EM Audit', icon: 'tasks' },
  { id: 'em-certification', label: 'EM Certification', icon: 'report' },
  { id: 'painel-admin', label: 'Painel Admin', icon: 'settings' },
]);

export const SISTEMA_PADRAO = 'jornada-guiada';

const SISTEMA_KEY = 'tm.sistema.v1';

export function sistemaPorId(id) {
  return SISTEMAS.find((s) => s.id === id) ?? SISTEMAS[0];
}

export function lerSistema() {
  try {
    const id = window.localStorage.getItem(SISTEMA_KEY);
    return SISTEMAS.some((s) => s.id === id) ? id : SISTEMA_PADRAO;
  } catch {
    return SISTEMA_PADRAO;
  }
}

export function salvarSistema(id) {
  try {
    window.localStorage.setItem(SISTEMA_KEY, id);
  } catch {
    /* sem armazenamento: vale só nesta sessão */
  }
}
