import { useEffect, useId, useRef, useState } from 'react';
import { BYOK_PROVIDERS, effortHint, effortLabel, getProvider, maskSecret, validateProviderConfig } from '../../settings/byokCatalog.js';
import { clearSecrets, getSecret, setSecret } from '../../settings/settingsStore.js';

function estadoInicial(provider, salvo) {
  const modelo = provider.models.find((m) => m.id === salvo?.model) ?? provider.models[0];
  const valores = {};
  for (const f of provider.fields) {
    valores[f.id] = f.type === 'secret' ? getSecret(provider.id, f.id) : (salvo?.fields?.[f.id] ?? f.default ?? '');
  }
  return {
    model: modelo.id,
    effort: modelo.efforts.includes(salvo?.effort) ? salvo.effort : modelo.defaultEffort,
    valores,
  };
}

function configurado(provider, salvo) {
  if (!salvo) return false;
  return provider.fields.filter((f) => f.required).every((f) => (f.type === 'secret' ? getSecret(provider.id, f.id) : salvo.fields?.[f.id]));
}

/** B.Y.O.K.: escolha do provedor, do modelo e do esforço, e os dados de conexão com a chave do usuário. */
export default function ByokPane({ settings, onChange }) {
  const byok = settings.byok;
  const [providerId, setProviderId] = useState(byok.ativo ?? BYOK_PROVIDERS[0].id);
  const provider = getProvider(providerId);
  const salvo = byok.providers[providerId];
  const [form, setForm] = useState(() => estadoInicial(provider, salvo));
  const [erros, setErros] = useState({});
  const [mostrar, setMostrar] = useState({});
  const [teste, setTeste] = useState(null); // { estado: 'testando'|'ok'|'erro', texto }
  const [confirmarRemocao, setConfirmarRemocao] = useState(false);
  const timer = useRef(null);
  const id = useId();

  useEffect(() => {
    setForm(estadoInicial(provider, byok.providers[providerId]));
    setErros({});
    setTeste(null);
    setMostrar({});
    setConfirmarRemocao(false);
    // Recarrega ao trocar de provedor; o restante vem do próprio formulário.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const modelo = provider.models.find((m) => m.id === form.model) ?? provider.models[0];
  const ativo = byok.ativo ? getProvider(byok.ativo) : null;
  const ativoCfg = ativo ? byok.providers[ativo.id] : null;
  const ativoModelo = ativo?.models.find((m) => m.id === ativoCfg?.model);

  function atualizarCampo(fieldId, valor) {
    setForm((f) => ({ ...f, valores: { ...f.valores, [fieldId]: valor } }));
    setErros((e) => ({ ...e, [fieldId]: undefined }));
    setTeste(null);
  }

  function escolherModelo(m) {
    setForm((f) => ({ ...f, model: m.id, effort: m.efforts.includes(f.effort) ? f.effort : m.defaultEffort }));
  }

  function persistir(extra = {}) {
    const naoSecretos = {};
    for (const f of provider.fields) {
      if (f.type === 'secret') setSecret(provider.id, f.id, String(form.valores[f.id] ?? '').trim());
      else naoSecretos[f.id] = String(form.valores[f.id] ?? '').trim();
    }
    onChange({
      ...settings,
      byok: {
        ...byok,
        ...extra,
        providers: { ...byok.providers, [provider.id]: { model: form.model, effort: form.effort, fields: naoSecretos, savedAt: new Date().toISOString(), testedAt: teste?.estado === 'ok' ? new Date().toISOString() : byok.providers[provider.id]?.testedAt ?? null } },
      },
    });
  }

  function salvar(usarComoPadrao = false) {
    const { ok, errors } = validateProviderConfig(provider, form.valores);
    setErros(errors);
    if (!ok) {
      setTeste({ estado: 'erro', texto: 'Revise os campos destacados antes de salvar.' });
      return;
    }
    persistir(usarComoPadrao ? { ativo: provider.id } : {});
    setTeste({ estado: 'ok', texto: usarComoPadrao ? `${provider.name} · ${modelo.name} agora é o modelo do Delta e dos agentes.` : 'Configuração salva.' });
  }

  function testar() {
    const { ok, errors } = validateProviderConfig(provider, form.valores);
    setErros(errors);
    if (!ok) {
      setTeste({ estado: 'erro', texto: 'Revise os campos destacados.' });
      return;
    }
    setTeste({ estado: 'testando', texto: `Testando ${provider.name}…` });
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => setTeste({ estado: 'ok', texto: `Formato válido para ${modelo.id} (simulado). O teste real de conexão é feito pelo backend, sem expor a chave no navegador.` }),
      650,
    );
  }

  function remover() {
    clearSecrets(provider.id);
    const { [provider.id]: _removido, ...resto } = byok.providers;
    onChange({ ...settings, byok: { ...byok, ativo: byok.ativo === provider.id ? null : byok.ativo, providers: resto } });
    setForm(estadoInicial(provider, null));
    setConfirmarRemocao(false);
    setTeste({ estado: 'ok', texto: `Configuração de ${provider.name} removida.` });
  }

  return (
    <div className="st-pane">
      <h3 className="st-section">B.Y.O.K. · Bring your own key</h3>
      <p className="st-text">
        Use a sua própria chave de API para que o Delta e os agentes da jornada rodem no modelo de IA que você preferir. Escolha o
        provedor, o modelo e o nível de esforço (quanto o modelo raciocina antes de responder).
      </p>

      <div className={`st-active ${ativo ? 'is-on' : ''}`} role="status">
        <span className="st-active__dot" aria-hidden="true" />
        {ativo ? (
          <span>
            Em uso: <strong>{ativo.name}</strong> · {ativoModelo?.name ?? ativoCfg?.model} · esforço {effortLabel(ativoCfg?.effort)}
          </span>
        ) : (
          <span>Em uso: modelo padrão da plataforma. Salve um provedor e clique em “Usar como padrão”.</span>
        )}
        {ativo ? (
          <button type="button" className="st-link" onClick={() => onChange({ ...settings, byok: { ...byok, ativo: null } })}>
            Voltar ao padrão
          </button>
        ) : null}
      </div>

      <fieldset className="st-fieldset">
        <legend className="st-label">Provedor</legend>
        <div className="st-providers" role="radiogroup" aria-label="Provedor">
          {BYOK_PROVIDERS.map((p) => {
            const ok = configurado(p, byok.providers[p.id]);
            return (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={providerId === p.id}
                className={`st-provider ${providerId === p.id ? 'is-selected' : ''}`}
                onClick={() => setProviderId(p.id)}
              >
                <span className="st-provider__name">{p.name}</span>
                <span className={`st-provider__status ${ok ? 'is-ok' : ''}`}>{byok.ativo === p.id ? 'Em uso' : ok ? 'Configurado' : 'Não configurado'}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <p className="st-product">
        {provider.product} · parâmetro de esforço <code>{provider.effortParam}</code> ·{' '}
        <a href={provider.docs} target="_blank" rel="noreferrer">
          documentação
        </a>
      </p>

      <fieldset className="st-fieldset">
        <legend className="st-label">Modelo</legend>
        <div className="st-models" role="radiogroup" aria-label="Modelo">
          {provider.models.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={form.model === m.id} className={`st-model ${form.model === m.id ? 'is-selected' : ''}`} onClick={() => escolherModelo(m)}>
              <span className="st-model__radio" aria-hidden="true" />
              <span className="st-model__body">
                <span className="st-model__name">{m.name}</span>
                <code className="st-model__id">{m.id}</code>
                <span className="st-model__note">{m.note}</span>
              </span>
              <span className="st-model__efforts">{m.efforts.map(effortLabel).join(' · ')}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="st-fieldset">
        <legend className="st-label">Esforço</legend>
        <div className="st-efforts" role="radiogroup" aria-label="Nível de esforço">
          {modelo.efforts.map((e) => (
            <button key={e} type="button" role="radio" aria-checked={form.effort === e} className={`st-effort ${form.effort === e ? 'is-selected' : ''}`} onClick={() => setForm((f) => ({ ...f, effort: e }))} title={effortHint(e)}>
              {effortLabel(e)}
              {e === modelo.defaultEffort ? <span className="st-effort__default">padrão</span> : null}
            </button>
          ))}
        </div>
        <p className="st-hint">
          {effortHint(form.effort)} · enviado como <code>{provider.effortParam}: "{form.effort}"</code>
        </p>
      </fieldset>

      <fieldset className="st-fieldset">
        <legend className="st-label">Dados de conexão</legend>
        <p className="st-hint">{provider.keyHint}</p>
        <div className="st-fields">
          {provider.fields.map((f) => {
            const fid = `${id}-${provider.id}-${f.id}`;
            const secreto = f.type === 'secret';
            return (
              <div key={f.id} className={`st-field ${erros[f.id] ? 'has-error' : ''}`}>
                <label htmlFor={fid}>
                  {f.label}
                  {f.required ? <span className="st-req"> *</span> : null}
                </label>
                <div className="st-input">
                  <input
                    id={fid}
                    type={secreto && !mostrar[f.id] ? 'password' : 'text'}
                    value={form.valores[f.id] ?? ''}
                    onChange={(e) => atualizarCampo(f.id, e.target.value)}
                    placeholder={f.placeholder}
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={Boolean(erros[f.id])}
                    aria-describedby={erros[f.id] ? `${fid}-err` : undefined}
                  />
                  {secreto ? (
                    <button type="button" className="st-link" onClick={() => setMostrar((m) => ({ ...m, [f.id]: !m[f.id] }))} aria-pressed={Boolean(mostrar[f.id])}>
                      {mostrar[f.id] ? 'Ocultar' : 'Mostrar'}
                    </button>
                  ) : null}
                </div>
                {erros[f.id] ? (
                  <span id={`${fid}-err`} className="st-error">
                    {erros[f.id]}
                  </span>
                ) : secreto && getSecret(provider.id, f.id) ? (
                  <span className="st-hint">Salva nesta sessão: {maskSecret(getSecret(provider.id, f.id))}</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </fieldset>

      <div className="st-actions">
        <button type="button" className="st-btn" onClick={testar} disabled={teste?.estado === 'testando'}>
          Testar conexão
        </button>
        <button type="button" className="st-btn" onClick={() => salvar(false)}>
          Salvar
        </button>
        <button type="button" className="st-btn st-btn--primary" onClick={() => salvar(true)}>
          Usar como padrão
        </button>
        {salvo ? (
          confirmarRemocao ? (
            <span className="st-confirm">
              Remover {provider.name}?
              <button type="button" className="st-btn st-btn--danger" onClick={remover}>
                Remover
              </button>
              <button type="button" className="st-link" onClick={() => setConfirmarRemocao(false)}>
                Cancelar
              </button>
            </span>
          ) : (
            <button type="button" className="st-link st-link--danger" onClick={() => setConfirmarRemocao(true)}>
              Remover configuração
            </button>
          )
        ) : null}
      </div>
      <p className={`st-result ${teste ? `st-result--${teste.estado}` : ''}`} role="status" aria-live="polite">
        {teste?.texto}
      </p>

      <p className="st-note">
        Segurança: neste protótipo a chave fica só na memória desta aba e some ao recarregar a página. Na versão com backend, ela é
        enviada uma única vez para o cofre de segredos da plataforma e nunca volta ao navegador; as chamadas aos modelos partem do
        servidor.
      </p>
    </div>
  );
}
