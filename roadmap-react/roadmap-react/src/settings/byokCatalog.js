/**
 * B.Y.O.K. (Bring Your Own Key): provedores, modelos, níveis de esforço e dados de conexão.
 * Conferido nas documentações oficiais em 18/11/2026. Os níveis aceitos variam por modelo
 * e mudam com frequência: o backend deve validar na conexão (GET /models do provedor).
 */

const ESFORCO = {
  none: { label: 'Nenhum', hint: 'Sem raciocínio: resposta mais rápida' },
  minimal: { label: 'Mínimo', hint: 'Raciocínio mínimo' },
  low: { label: 'Baixo', hint: 'Mais rápido e econômico' },
  medium: { label: 'Médio', hint: 'Equilíbrio entre qualidade e custo' },
  high: { label: 'Alto', hint: 'Mais completo em tarefas difíceis' },
  xhigh: { label: 'Muito alto', hint: 'Tarefas longas e complexas' },
  max: { label: 'Máximo', hint: 'Máxima profundidade, maior custo e latência' },
};

export function effortLabel(id) {
  return ESFORCO[id]?.label ?? id;
}
export function effortHint(id) {
  return ESFORCO[id]?.hint ?? '';
}

export const BYOK_PROVIDERS = Object.freeze([
  {
    id: 'google',
    name: 'Google',
    product: 'Gemini API (Google AI Studio)',
    effortParam: 'thinking_level',
    docs: 'https://ai.google.dev/gemini-api/docs/thinking',
    keyHint: 'Crie a chave no Google AI Studio.',
    fields: [
      { id: 'apiKey', label: 'Chave de API (x-goog-api-key)', type: 'secret', required: true, placeholder: 'AIza…', pattern: /^AIza[0-9A-Za-z_-]{20,}$/ },
      { id: 'baseUrl', label: 'URL base', type: 'url', required: false, placeholder: 'https://generativelanguage.googleapis.com/v1beta', default: 'https://generativelanguage.googleapis.com/v1beta' },
      { id: 'projectId', label: 'ID do projeto Google Cloud (opcional, para cotas e faturamento)', type: 'text', required: false, placeholder: 'meu-projeto-123' },
    ],
    models: [
      { id: 'gemini-4-argon', name: 'Gemini 4 Argon', note: 'Mais capaz; raciocínio longo', efforts: ['low', 'medium', 'high'], defaultEffort: 'medium' },
      { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', note: 'Rápido para agentes e uso intenso', efforts: ['low', 'medium', 'high'], defaultEffort: 'medium' },
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (prévia)', note: 'Geração anterior Pro', efforts: ['low', 'medium', 'high'], defaultEffort: 'high' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    product: 'OpenAI API (Responses)',
    effortParam: 'reasoning.effort',
    docs: 'https://developers.openai.com/api/docs/guides/reasoning',
    keyHint: 'Crie a chave em platform.openai.com › API keys.',
    fields: [
      { id: 'apiKey', label: 'Chave de API (Authorization: Bearer)', type: 'secret', required: true, placeholder: 'sk-…', pattern: /^sk-[0-9A-Za-z_-]{20,}$/ },
      { id: 'organization', label: 'ID da organização (opcional)', type: 'text', required: false, placeholder: 'org-…' },
      { id: 'project', label: 'ID do projeto (opcional)', type: 'text', required: false, placeholder: 'proj_…' },
      { id: 'baseUrl', label: 'URL base', type: 'url', required: false, placeholder: 'https://api.openai.com/v1', default: 'https://api.openai.com/v1' },
    ],
    models: [
      { id: 'gpt-6.2-astra', name: 'GPT-6.2 Astra', note: 'Mais capaz, para os projetos mais difíceis', efforts: ['low', 'medium', 'high', 'xhigh', 'max'], defaultEffort: 'medium' },
      { id: 'gpt-6.2-sol', name: 'GPT-6.2 Sol', note: 'Equilíbrio entre capacidade e custo', efforts: ['low', 'medium', 'high'], defaultEffort: 'medium' },
      { id: 'gpt-6.1-terra', name: 'GPT-6.1 Terra', note: 'Rápido e eficiente', efforts: ['low', 'medium', 'high'], defaultEffort: 'medium' },
      { id: 'gpt-6-luna', name: 'GPT-6 Luna', note: 'Alto volume com baixo custo', efforts: ['low', 'medium', 'high'], defaultEffort: 'medium' },
    ],
  },
  {
    id: 'copilot',
    name: 'Copilot',
    product: 'Microsoft Foundry / Azure OpenAI (BYOK do Copilot)',
    effortParam: 'reasoning.effort',
    docs: 'https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/use-byok-models',
    keyHint: 'Use o endpoint e a chave do recurso no Microsoft Foundry (Azure OpenAI).',
    fields: [
      { id: 'endpoint', label: 'Endpoint do recurso', type: 'url', required: true, placeholder: 'https://SEU-RECURSO.openai.azure.com/openai/v1', pattern: /^https:\/\/[\w.-]+\.(openai\.azure\.com|services\.ai\.azure\.com|cognitiveservices\.azure\.com)(\/.*)?$/ },
      { id: 'deployment', label: 'Nome da implantação (deployment)', type: 'text', required: true, placeholder: 'gpt-astra-prod' },
      { id: 'apiVersion', label: 'Versão da API (só para endpoints sem /openai/v1)', type: 'text', required: false, placeholder: '2025-04-01-preview' },
      { id: 'apiKey', label: 'Chave de API do recurso (api-key)', type: 'secret', required: true, placeholder: '32 caracteres', pattern: /^[0-9A-Za-z]{32,}$/ },
    ],
    models: [
      { id: 'gpt-6.2-astra', name: 'GPT-6.2 Astra (implantação)', note: 'Modelo OpenAI implantado no seu recurso', efforts: ['low', 'medium', 'high', 'xhigh', 'max'], defaultEffort: 'medium' },
      { id: 'gpt-6.2-sol', name: 'GPT-6.2 Sol (implantação)', note: 'Modelo OpenAI implantado no seu recurso', efforts: ['low', 'medium', 'high'], defaultEffort: 'medium' },
      { id: 'gpt-6.1-terra', name: 'GPT-6.1 Terra (implantação)', note: 'Modelo OpenAI implantado no seu recurso', efforts: ['low', 'medium', 'high'], defaultEffort: 'medium' },
    ],
  },
  {
    id: 'claude',
    name: 'Claude',
    product: 'Claude API (Anthropic)',
    effortParam: 'output_config.effort',
    docs: 'https://platform.claude.com/docs/en/build-with-claude/effort',
    keyHint: 'Crie a chave no Claude Console › API keys.',
    fields: [
      { id: 'apiKey', label: 'Chave de API (x-api-key)', type: 'secret', required: true, placeholder: 'sk-ant-…', pattern: /^sk-ant-[0-9A-Za-z_-]{20,}$/ },
      { id: 'baseUrl', label: 'URL base', type: 'url', required: false, placeholder: 'https://api.anthropic.com', default: 'https://api.anthropic.com' },
    ],
    models: [
      { id: 'claude-opus-5-5', name: 'Claude Opus 5.5', note: 'Para desafios complexos', efforts: ['low', 'medium', 'high', 'xhigh', 'max'], defaultEffort: 'medium' },
      { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5', note: 'Equilíbrio entre qualidade e velocidade', efforts: ['low', 'medium', 'high', 'xhigh', 'max'], defaultEffort: 'high' },
      { id: 'claude-haiku-5-5', name: 'Claude Haiku 5.5', note: 'Rápido e econômico', efforts: ['low', 'medium', 'high', 'xhigh', 'max'], defaultEffort: 'medium' },
      { id: 'claude-fable-5-2', name: 'Claude Fable 5.2', note: 'Nível Mythos, com salvaguardas adicionais', efforts: ['low', 'medium', 'high', 'xhigh', 'max'], defaultEffort: 'high' },
    ],
  },
  {
    id: 'grok',
    name: 'Grok',
    product: 'xAI API',
    effortParam: 'reasoning_effort',
    docs: 'https://docs.x.ai/docs/guides/reasoning',
    keyHint: 'Crie a chave no console da xAI.',
    fields: [
      { id: 'apiKey', label: 'Chave de API (Authorization: Bearer)', type: 'secret', required: true, placeholder: 'xai-…', pattern: /^xai-[0-9A-Za-z_-]{20,}$/ },
      { id: 'baseUrl', label: 'URL base', type: 'url', required: false, placeholder: 'https://api.x.ai/v1', default: 'https://api.x.ai/v1' },
    ],
    models: [
      { id: 'grok-4.7', name: 'Grok 4.7', note: 'Raciocínio sempre ativo', efforts: ['low', 'medium', 'high', 'xhigh'], defaultEffort: 'high' },
      { id: 'grok-4.6', name: 'Grok 4.6', note: 'Agentes de longa duração e código', efforts: ['low', 'medium', 'high', 'xhigh'], defaultEffort: 'high' },
      { id: 'grok-4.5', name: 'Grok 4.5', note: 'Geração anterior', efforts: ['low', 'medium', 'high'], defaultEffort: 'high' },
    ],
  },
]);

export function getProvider(id) {
  return BYOK_PROVIDERS.find((p) => p.id === id) ?? null;
}

/** Valida os campos de um provedor. Devolve { ok, errors: { campo: mensagem } }. */
export function validateProviderConfig(provider, values = {}) {
  const errors = {};
  for (const f of provider?.fields ?? []) {
    const v = String(values[f.id] ?? '').trim();
    if (!v) {
      if (f.required) errors[f.id] = 'Obrigatório.';
      continue;
    }
    if (f.type === 'url' && !/^https:\/\/[^\s]+$/i.test(v)) errors[f.id] = 'Use um endereço https://.';
    else if (f.pattern && !f.pattern.test(v)) errors[f.id] = 'Formato não reconhecido para este provedor.';
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

/** Mostra só o começo e os 4 últimos caracteres de uma chave. */
export function maskSecret(valor) {
  const v = String(valor ?? '');
  if (v.length <= 8) return v ? '••••' : '';
  return `${v.slice(0, 4)}••••${v.slice(-4)}`;
}
