import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { BYOK_PROVIDERS, getProvider, maskSecret, validateProviderConfig } from '../src/settings/byokCatalog.js';

describe('catálogo B.Y.O.K.', () => {
  test('tem os cinco provedores, cada modelo com esforço padrão dentro da lista', () => {
    assert.deepEqual(BYOK_PROVIDERS.map((p) => p.id), ['google', 'openai', 'copilot', 'claude', 'grok']);
    for (const p of BYOK_PROVIDERS) {
      assert.ok(p.models.length >= 3, p.id);
      assert.ok(p.fields.some((f) => f.type === 'secret' && f.required), `${p.id} exige chave`);
      for (const m of p.models) assert.ok(m.efforts.includes(m.defaultEffort), `${p.id}/${m.id}`);
    }
  });

  test('valida formato da chave e campos obrigatórios', () => {
    const claude = getProvider('claude');
    assert.equal(validateProviderConfig(claude, { apiKey: 'sk-ant-api03-abcdefghijklmnopqrstuvwxyz' }).ok, true);
    assert.equal(validateProviderConfig(claude, { apiKey: 'sk-errada' }).errors.apiKey, 'Formato não reconhecido para este provedor.');
    const copilot = getProvider('copilot');
    const r = validateProviderConfig(copilot, { endpoint: 'http://x.openai.azure.com', apiKey: '' });
    assert.equal(r.errors.endpoint, 'Use um endereço https://.');
    assert.equal(r.errors.deployment, 'Obrigatório.');
    assert.equal(r.errors.apiKey, 'Obrigatório.');
    assert.equal(maskSecret('xai-1234567890abcdef'), 'xai-••••cdef');
  });
});
