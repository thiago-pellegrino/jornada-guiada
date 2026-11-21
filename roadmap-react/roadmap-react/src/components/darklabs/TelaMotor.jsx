import Icon from '../ui/Icon.jsx';
import { MOTORES, PRODUTOS, ROLES, STM } from '../../domain/darklabs/conteudo.js';
import { brl, dec1, fmt, num } from '../../domain/darklabs/formato.js';
import { ab, avaliar, confianca, custo, diasMotor, limitesConsolidacao, motorAtivo, prod } from '../../domain/darklabs/simulacao.js';
import { Aviso, Barra, Faixa, IconeMotor, Kpi, Lista, Tag, Vazio, corMotor } from './bits.jsx';

const LIMIARES = [50, 65, 80];

function Laboratorio({ loja, m }) {
  const { S } = loja;
  const E = S.exp;
  const ativo = motorAtivo(S, m);
  const a = ab(S);
  const r = avaliar(S);
  const sig = a.pv < 0.05;
  const base = E.n * 2;
  const funil = [
    ['Expostos', base],
    ['Ativaram', base * (0.4 + E.ad / 200)],
    ['Uso recorrente', (base * E.ad) / 100],
    ['Converteram', (base * E.v) / 100],
  ];
  const faixa = (k, l, min, max, step, suf) => (
    <Faixa
      label={l}
      value={E[k]}
      min={min}
      max={max}
      step={step}
      sufixo={suf}
      formatar={num}
      disabled={!ativo}
      onChange={(v) =>
        loja.mudar((X) => {
          X.exp[k] = v;
        })
      }
    />
  );
  return (
    <section className="surface dlj-card--accent" style={{ '--mc': corMotor(6) }} aria-labelledby="dlj-lab">
      <header className="surface-head">
        <h3 id="dlj-lab" className="surface-title dlj-title-ico">
          <IconeMotor n={6} size={16} /> Laboratório de experimentação
        </h3>
        <Tag tom={E.reg ? 'ok' : ''}>{E.reg ? 'Resultados registrados' : 'Simulação'}</Tag>
      </header>
      <p className="jg-muted dlj-mb">Ajuste os resultados observados no MVP. As hipóteses H1 a H4 são classificadas a partir deles.</p>
      <div className="jg-grid jg-grid--2">
        <div>
          {faixa('n', 'Amostra por grupo', 500, 20000, 500, '')}
          {faixa('c', 'Conversão do controle', 1, 30, 0.5, '%')}
          {faixa('v', 'Conversão da variante', 1, 30, 0.5, '%')}
          {faixa('csat', 'Satisfação (CSAT)', 30, 100, 1, '')}
          {faixa('ad', 'Adoção em 90 dias', 0, 80, 1, '%')}
          {faixa('ef', 'Redução de esforço operacional', 0, 50, 1, '%')}
        </div>
        <div>
          <div className="dlj-kpis dlj-kpis--3">
            <Kpi valor={`${a.lift > 0 ? '+' : ''}${dec1(a.lift)}%`} rotulo="lift da variante" tom={a.lift > 0 ? 'success' : 'danger'} />
            <Kpi valor={a.pv < 0.001 ? '< 0,001' : a.pv.toFixed(3).replace('.', ',')} rotulo="p-valor" />
            <Kpi valor={sig ? 'Sim' : 'Não'} rotulo="significativo (p < 0,05)" tom={sig ? 'success' : 'warning'} />
          </div>
          <div className="dlj-hbars">
            {funil.map(([l, v]) => (
              <div key={l} className="dlj-hbar">
                <span className="jg-muted">{l}</span>
                <Barra pct={(v / base) * 100} cor="var(--chart-seq-400)" />
                <span className="tabular">{fmt(v)}</span>
              </div>
            ))}
          </div>
          <ul className="dlj-rows dlj-mt">
            {S.hipoteses.map((h, i) => (
              <li key={h.id}>
                <span>
                  <strong>{h.id}</strong> {h.tipo} · <span className="jg-muted">{r[i].ev}</span>
                </span>
                <Tag tom={{ confirmada: 'ok', inconclusiva: 'warn', rejeitada: 'bad' }[r[i].st]}>{r[i].st}</Tag>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {ativo ? (
        <button type="button" className="btn btn--sm dlj-mt" onClick={() => loja.registrarLaboratorio()}>
          {E.reg ? 'Atualizar' : 'Registrar'} resultados e classificar hipóteses
        </button>
      ) : null}
    </section>
  );
}

function ForaDoEscopo({ loja, m }) {
  const mo = MOTORES[m - 1];
  const p = prod(loja.S);
  const em = PRODUTOS.filter((x) => x.motores.includes(m) && x.id !== 'completa')
    .map((x) => x.nome)
    .join(', ');
  return (
    <div className="dlj-stack" style={{ '--mc': corMotor(m) }}>
      <header className="dlj-mhead">
        <span className="dlj-mnum">{m}</span>
        <div>
          <p className="jg-eyebrow">{mo.verbo} · fora do escopo</p>
          <h2 className="dlj-head__title">{mo.nome}</h2>
          <p className="dlj-lead">
            Este motor não faz parte do {p.nome}. Ele é ativado em: {em} e na Jornada completa.
          </p>
        </div>
      </header>
      <div className="jg-grid jg-grid--3">
        {[
          ['Entrada', mo.entrada],
          ['Métodos', mo.metodos.map((x) => x[0])],
          ['Saída', mo.saidas],
        ].map(([t, l]) => (
          <section key={t} className="surface dlj-card--accent">
            <header className="surface-head">
              <h3 className="surface-title">{t}</h3>
            </header>
            <Lista itens={l} />
          </section>
        ))}
      </div>
      <div className="dlj-row">
        <button type="button" className="btn" onClick={() => loja.go('jornada')}>
          <Icon name="arrowLeft" size={14} /> Voltar à jornada
        </button>
      </div>
    </div>
  );
}

export default function TelaMotor({ loja, m }) {
  const { S } = loja;
  if (!S.iniciada) return <Vazio titulo="A jornada ainda não começou" texto="Faça a triagem, escolha um produto e monte o squad." rotulo="Ir para a triagem" onClick={() => loja.go('triagem')} />;
  const mo = MOTORES[m - 1];
  if (!mo) return <Vazio titulo="Motor não encontrado" rotulo="Voltar à jornada" onClick={() => loja.go('jornada')} />;
  const M = S.motores[m];
  if (M.status === 'fora') return <ForaDoEscopo loja={loja} m={m} />;

  const p = prod(S);
  const sc = p.motores;
  const ativo = motorAtivo(S, m);
  const tot = mo.metodos.length;
  const lim = limitesConsolidacao(S, m);
  const cf = confianca(S, m);
  const anterior = sc.filter((x) => x < m).pop();
  const proximo = sc.find((x) => x > m);
  const fonte =
    anterior && S.motores[anterior].status === 'concluido'
      ? `Recebido das saídas do Motor ${anterior}`
      : m === sc[0]
        ? 'Vem da triagem e dos insumos do cliente'
        : 'Aguardando o motor anterior';
  const quem = [...new Set(mo.humanos)].join(', ');
  const executando = Object.keys(loja.running).some((k) => k.startsWith(`${m}-`));
  const log = (S.log[m] || ['Aguardando execução dos métodos…']).slice(-8);
  const set = (fn) => loja.mudar((X) => fn(X.motores[m]));

  return (
    <div className="dlj-stack" style={{ '--mc': corMotor(m) }}>
      <header className="dlj-mhead">
        <span className="dlj-mnum">{m}</span>
        <div>
          <p className="jg-eyebrow dlj-accent-text">
            {mo.verbo} · {STM[M.status]}
            {M.iter ? ` · revisão ${M.iter}` : ''}
          </p>
          <h2 className="dlj-head__title">{mo.nome}</h2>
          <p className="dlj-lead">{mo.desc}</p>
        </div>
        <dl className="surface dlj-meta-list">
          <div>
            <dt>Duração prevista</dt>
            <dd>{Math.round(diasMotor(S, m))} dias</dd>
          </div>
          <div>
            <dt>Agente de IA</dt>
            <dd>{mo.agente}</dd>
          </div>
          <div>
            <dt>Investimento</dt>
            <dd>{brl((custo(S, ROLES, p) * diasMotor(S, m)) / p.dias)}</dd>
          </div>
          <div>
            <dt>Confiança</dt>
            <dd>{cf}%</dd>
          </div>
        </dl>
      </header>

      {M.status === 'bloqueado' ? (
        <Aviso
          acoes={
            <button type="button" className="btn btn--sm" onClick={() => loja.go(`motor-${anterior}`)}>
              Ir para o Motor {anterior}
            </button>
          }
        >
          Este motor é liberado quando o gate do Motor {anterior} for aprovado.
        </Aviso>
      ) : null}
      {M.status === 'interrompido' || M.status === 'cancelado' ? (
        <Aviso
          tom="bad"
          acoes={
            <button type="button" className="btn btn--sm" onClick={() => loja.go('dossie')}>
              Ver o dossiê
            </button>
          }
        >
          {M.status === 'interrompido'
            ? 'A jornada foi interrompida neste motor. Veja o dossiê para o aprendizado registrado.'
            : 'Motor cancelado porque a jornada foi interrompida antes dele.'}
        </Aviso>
      ) : null}

      <div className="dlj-mgrid">
        <section className="surface dlj-card--accent" aria-labelledby={`dlj-ent-${m}`}>
          <header className="surface-head">
            <h3 id={`dlj-ent-${m}`} className="surface-title">
              Entrada
            </h3>
            <Tag>
              {lim.entradas}/{mo.entrada.length}
            </Tag>
          </header>
          <p className="field-hint dlj-mb">{fonte}</p>
          <div className="dlj-checks">
            {mo.entrada.map((e, i) => (
              <label key={e} className="dlj-check">
                <input type="checkbox" checked={Boolean(M.entrada[i])} disabled={!ativo} onChange={() => set((X) => (X.entrada[i] = !X.entrada[i]))} />
                <span>{e}</span>
              </label>
            ))}
          </div>
          {ativo && lim.entradas < mo.entrada.length ? (
            <button
              type="button"
              className="btn btn--sm dlj-mt"
              onClick={() =>
                loja.mudar((X) => {
                  mo.entrada.forEach((_, i) => {
                    X.motores[m].entrada[i] = true;
                  });
                  (X.log[m] = X.log[m] || []).push('⇢ Insumos do cliente confirmados');
                })
              }
            >
              Confirmar todos os insumos
            </button>
          ) : null}
        </section>

        <section className="surface dlj-card--accent" aria-labelledby={`dlj-met-${m}`}>
          <header className="surface-head">
            <h3 id={`dlj-met-${m}`} className="surface-title">
              Métodos
            </h3>
            <span className="dlj-row">
              <Tag>
                {lim.feitos}/{tot} executados
              </Tag>
              {ativo && lim.feitos < tot ? (
                <button type="button" className="btn btn--sm btn--primary" disabled={executando} onClick={() => loja.executarTodos(m)}>
                  Executar todos
                </button>
              ) : null}
            </span>
          </header>
          <div className="jg-grid jg-grid--2">
            {mo.metodos.map(([nome, ia, hu], i) => {
              const r = M.metodos[i];
              const run = loja.running[`${m}-${i}`];
              return (
                <article key={nome} className={`dlj-met ${r ? 'is-done' : ''} ${run ? 'is-running' : ''}`}>
                  <div className="dlj-row dlj-row--between">
                    <h4 className="dlj-met__name">{nome}</h4>
                    {r ? (
                      <Tag tom="ok">
                        <Icon name="check" size={12} />
                        {r.iter ? ` ×${r.iter + 1}` : ''}
                      </Tag>
                    ) : null}
                  </div>
                  <p className="dlj-met__who">
                    <span>IA: {ia}</span>
                    <span>Humano: {hu}</span>
                  </p>
                  {r ? (
                    <div className="dlj-met__res">
                      {r.res}
                      <span className="field-hint">Validado por {r.quem}</span>
                    </div>
                  ) : null}
                  {ativo ? (
                    <div>
                      <button type="button" className={`btn btn--sm ${r ? '' : 'btn--primary'}`} disabled={Boolean(run)} onClick={() => loja.executarMetodo(m, i)}>
                        {run ? (
                          <>
                            <span className="dlj-spin" aria-hidden="true" /> Executando…
                          </>
                        ) : r ? (
                          'Refazer'
                        ) : (
                          'Executar'
                        )}
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
          <div className="dlj-console" aria-live="polite">
            {log.map((l, i) => (
              <div key={`${i}-${l}`} className={l.startsWith('🤖') ? 'is-agent' : l.startsWith('🧑') ? 'is-human' : ''}>
                {l}
              </div>
            ))}
          </div>
        </section>
      </div>

      {m === 6 ? <Laboratorio loja={loja} m={m} /> : null}

      <section className="surface dlj-card--accent" aria-labelledby={`dlj-sai-${m}`}>
        <header className="surface-head">
          <h3 id={`dlj-sai-${m}`} className="surface-title">
            Saída
          </h3>
          {M.saidas ? <Tag tom="ok">Consolidada · editável</Tag> : null}
        </header>
        {M.saidas ? (
          <div className="dlj-outs">
            {mo.saidas.map((s, i) => (
              <details key={s} className="dlj-out" open={i === 0}>
                <summary>{s}</summary>
                <textarea
                  className="input dlj-textarea"
                  rows={Math.min(14, Math.max(3, String(M.saidas[i]).split('\n').length + 1))}
                  value={M.saidas[i]}
                  readOnly={!(ativo || M.status === 'concluido')}
                  onChange={(e) => set((X) => (X.saidas[i] = e.target.value))}
                />
              </details>
            ))}
          </div>
        ) : (
          <>
            <Lista itens={mo.saidas} />
            {ativo ? (
              <>
                <button type="button" className="btn btn--primary dlj-mt" disabled={!lim.pode} onClick={() => loja.consolidar(m)}>
                  Consolidar saídas com IA
                </button>
                <p className="field-hint">{lim.pode ? 'Pronto para consolidar.' : `Requer ao menos ${lim.minM} métodos executados e ${lim.minE} insumos confirmados.`}</p>
              </>
            ) : null}
          </>
        )}
      </section>

      <section className="surface dlj-card--accent dlj-gate" aria-labelledby={`dlj-gate-${m}`}>
        <header className="surface-head">
          <h3 id={`dlj-gate-${m}`} className="surface-title">
            Gate de decisão
          </h3>
          <Tag tom={cf >= 70 ? 'ok' : 'warn'}>Confiança {cf}%</Tag>
        </header>
        <Barra pct={cf} cor="var(--mc)" />
        <div className="jg-grid jg-grid--2 dlj-mt">
          <ul className="dlj-crit">
            {mo.crit.map((c, i) => (
              <li key={c} className={cf >= LIMIARES[i] ? 'is-ok' : ''}>
                <span className="dlj-crit__dot">{cf >= LIMIARES[i] ? <Icon name="check" size={12} /> : null}</span>
                <span>
                  {c}
                  {m === 6 && i === 0 && !S.exp.reg ? <span className="jg-muted"> (registre o laboratório)</span> : null}
                </span>
              </li>
            ))}
          </ul>
          <div>
            {M.status === 'concluido' ? (
              <Aviso tom="ok">
                <strong>Decisão: avançar</strong> com confiança de {M.gate.conf}% no dia {Math.round(M.gate.dia)}. {M.gate.just}
              </Aviso>
            ) : M.status === 'interrompido' ? (
              <Aviso tom="bad">
                <strong>Decisão: interromper.</strong> {S.encerrada?.just}
              </Aviso>
            ) : ativo ? (
              <>
                <label className="field">
                  <span className="field-label">Justificativa da decisão (registrada na memória)</span>
                  <textarea
                    className="input dlj-textarea"
                    rows={3}
                    value={M.just}
                    placeholder="Ex.: evidências suficientes; risco principal mitigado…"
                    onChange={(e) => set((X) => (X.just = e.target.value))}
                  />
                </label>
                {M.saidas && cf < 70 ? (
                  <Aviso tom="warn" className="dlj-mt">
                    Avançar com confiança abaixo de 70% conta como decisão de baixa evidência no painel de ganhos.
                  </Aviso>
                ) : null}
                <div className="dlj-row dlj-mt">
                  <button type="button" className="btn btn--primary" disabled={!M.saidas} onClick={() => loja.decidir(m, 'avancar')}>
                    Avançar
                  </button>
                  <button type="button" className="btn" disabled={!M.saidas} onClick={() => loja.decidir(m, 'ajustar')}>
                    Ajustar
                  </button>
                  <button type="button" className="btn btn--danger" disabled={!M.saidas} onClick={() => loja.decidir(m, 'interromper')}>
                    Interromper
                  </button>
                </div>
                {M.saidas ? null : <p className="field-hint">Consolide as saídas para liberar a decisão.</p>}
              </>
            ) : (
              <p className="jg-muted">O gate fica disponível quando o motor for liberado.</p>
            )}
          </div>
        </div>
        <p className="field-hint dlj-mt">Especialistas responsáveis: {quem}.</p>
      </section>

      <div className="dlj-row dlj-row--between">
        <button type="button" className="btn" onClick={() => loja.go(anterior ? `motor-${anterior}` : 'jornada')}>
          <Icon name="arrowLeft" size={14} /> {anterior ? `Motor ${anterior}` : 'Jornada'}
        </button>
        <button type="button" className="btn" onClick={() => loja.go('jornada')}>
          Painel da jornada
        </button>
        {proximo ? (
          <button type="button" className="btn" onClick={() => loja.go(`motor-${proximo}`)}>
            Motor {proximo} <Icon name="chevronRight" size={14} />
          </button>
        ) : (
          <button type="button" className="btn" onClick={() => loja.go('dossie')}>
            Dossiê <Icon name="chevronRight" size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

