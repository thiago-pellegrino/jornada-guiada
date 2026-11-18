/**
 * Preferências do usuário no protótipo. O que não é segredo fica no localStorage;
 * chaves de API ficam só na memória desta aba (somem ao recarregar). Na versão com
 * backend, as chaves vão para um cofre (ex.: Azure Key Vault) e nunca voltam ao navegador.
 */
const KEY = 'jornada.settings.v1';
const segredos = new Map(); // `${providerId}.${fieldId}` → valor

export const DEFAULT_SETTINGS = Object.freeze({
  personalizacao: { instrucoes: '', tom: 'equilibrado' },
  notificacoes: { execucoes: true, revisoes: true, mencoes: true, resumoDiario: false },
  navegacao: { pesquisaWeb: true, citarFontes: true },
  byok: { ativo: null, providers: {} }, // providers[id] = { model, effort, fields: {nao-secretos}, testedAt }
});

export function loadSettings() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const s = raw ? JSON.parse(raw) : {};
    return {
      personalizacao: { ...DEFAULT_SETTINGS.personalizacao, ...s.personalizacao },
      notificacoes: { ...DEFAULT_SETTINGS.notificacoes, ...s.notificacoes },
      navegacao: { ...DEFAULT_SETTINGS.navegacao, ...s.navegacao },
      byok: { ...DEFAULT_SETTINGS.byok, ...s.byok, providers: { ...(s.byok?.providers ?? {}) } },
    };
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(settings) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* sem armazenamento: vale só nesta sessão */
  }
}

export function getSecret(providerId, fieldId) {
  return segredos.get(`${providerId}.${fieldId}`) ?? '';
}
export function setSecret(providerId, fieldId, value) {
  const k = `${providerId}.${fieldId}`;
  if (value) segredos.set(k, value);
  else segredos.delete(k);
}
export function clearSecrets(providerId) {
  [...segredos.keys()].filter((k) => k.startsWith(`${providerId}.`)).forEach((k) => segredos.delete(k));
}
