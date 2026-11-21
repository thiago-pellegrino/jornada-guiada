import Icon from '../ui/Icon.jsx';
import { AREAS, GATILHOS, MOTORES, PERFIS, ROLES } from '../../domain/darklabs/conteudo.js';
import { brl, fmt } from '../../domain/darklabs/formato.js';
import { dossieEmTexto, horasTotais, metricas, prod, produtoPorId, proximoProduto, recomendacaoFinal } from '../../domain/darklabs/simulacao.js';
import { Aviso, Cabecalho, ChipMotor, Kpi, Secao, Tag, TagHipotese, TagStatus, Vazio, corMotor } from './bits.jsx';

const COR_REC = { ok: 'var(--color-success-text)', warn: 'var(--color-warning-text)', bad: 'var(--color-danger-text)' };
const DECISAO = { avancar: ['avançar', 'ok'], ajustar: ['ajustar', 'warn'], interromper: ['interromper', 'bad'] };

function baixar(nome, texto) {
  const url = URL.createObjectURL(new Blob([texto], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function TelaDossie({ loja }) {
  const { S } = loja;
  if (!S.iniciada) {
    return <Vazio titulo="Ainda não há dossiê" texto="O dossiê é montado a partir das saídas dos motores e das decisões nos gates." rotulo="Começar pela triagem" onClick={() => loja.go('triagem')} />;
  }
  const p = prod(S);
  const d = S.desafio;
  const R = recomendacaoFinal(S, ROLES);
  const M = metricas(S, ROLES);
  const nx = proximoProduto(S);
  const motores = p.motores.filter((m) => S.motores[m].saidas);
  let secao = 4;

  function copiar() {
    const t = dossieEmTexto(S, ROLES);
    navigator.clipboard?.writeText(t).then(
      () => loja.notify('Dossiê copiado como texto.'),
      () => loja.notify('Não foi possível copiar. Use "Baixar .txt".'),
    );
  }

  return (
    <div className="dlj-stack">
      <Cabecalho
        eyebrow={`${d.empresa} · ciclo ${S.ciclo} · ${p.nome}`}
        titulo="Dossiê de resultado"
        acoes={
          <>
            <button type="button" className="btn btn--sm" onClick={copiar}>
              Copiar texto
            </button>
            <button type="button" className="btn btn--sm" onClick={() => baixar(`dossie-darklabs-ciclo-${S.ciclo}.txt`, dossieEmTexto(S, ROLES))}>
              <Icon name="download" size={14} /> Baixar .txt
            </button>
          </>
        }
      />
      {!S.concluida ? (
        <Aviso
          acoes={
            <button type="button" className="btn btn--sm" onClick={() => loja.go('jornada')}>
              Voltar à jornada
            </button>
          }
        >
          Dossiê parcial: a jornada ainda está em andamento. As seções se completam conforme os motores avançam.
        </Aviso>
      ) : null}

      <section className={`surface dlj-card--accent dlj-final dlj-final--${R.cls}`} style={{ '--mc': COR_REC[R.cls] }} aria-labelledby="dlj-final">
        <p className="jg-eyebrow">Recomendação final</p>
        <h3 id="dlj-final" className="dlj-final__title">
          {R.tit}
        </h3>
        <p>{R.txt}</p>
        {S.concluida ? (
          <div className="dlj-row dlj-mt">
            <button type="button" className="btn btn--primary" onClick={() => loja.proximoCiclo(nx)}>
              Iniciar próximo ciclo: {produtoPorId(nx).nome}
            </button>
            <button type="button" className="btn" onClick={() => loja.go('ganhos')}>
              Ver painel de ganhos
            </button>
          </div>
        ) : null}
      </section>

      <div className="dlj-kpis dlj-kpis--4">
        <Kpi valor={`${M.dias} dias`} rotulo="tempo simulado acumulado" />
        <Kpi valor={brl(S.invest)} rotulo="investimento acumulado" />
        <Kpi valor={S.bc ? brl(S.bc.valor) : '—'} rotulo="valor potencial anual" />
        <Kpi valor={`${M.confd}/${M.tot}`} rotulo="hipóteses confirmadas" />
      </div>

      <Secao titulo="1. O desafio" id="dlj-d1">
        <div className="surface jg-grid jg-grid--2">
          <dl className="dlj-dl">
            <dt>Ambição</dt>
            <dd>{d.ambicao || '—'}</dd>
            <dt>Problema percebido</dt>
            <dd>{d.problema || '—'}</dd>
            <dt>Indicador de sucesso</dt>
            <dd>{d.meta || '—'}</dd>
          </dl>
          <dl className="dlj-dl">
            <dt>Perfil</dt>
            <dd className="jg-muted">{PERFIS[(Number(d.perfil) || 1) - 1]}</dd>
            <dt>Gatilho</dt>
            <dd className="jg-muted">
              {GATILHOS[d.gatilho][0]}. {GATILHOS[d.gatilho][1]}
            </dd>
            <dt>Squad e produto</dt>
            <dd className="jg-muted">
              {p.nome} · {fmt(horasTotais(S, ROLES, p))} h de especialistas · {S.areas.map((a) => AREAS[a]).join(', ')}
            </dd>
          </dl>
        </div>
      </Secao>

      <Secao titulo="2. Entregas por motor" id="dlj-d2">
        {motores.length ? (
          <div className="dlj-stack">
            {motores.map((m) => {
              const mo = MOTORES[m - 1];
              const X = S.motores[m];
              return (
                <article key={m} className="surface dlj-card--accent" style={{ '--mc': corMotor(m) }}>
                  <header className="surface-head">
                    <span className="dlj-row">
                      <ChipMotor n={m} />
                      <h4 className="surface-title">{mo.nome}</h4>
                      <Tag>{mo.verbo}</Tag>
                    </span>
                    <TagStatus status={X.status} />
                  </header>
                  <div className="jg-grid jg-grid--2">
                    {mo.saidas.map((s, i) => (
                      <div key={s}>
                        <p className="jg-eyebrow dlj-accent-text">{s}</p>
                        <pre className="dlj-pre">{X.saidas[i]}</pre>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="jg-muted">Nenhuma saída consolidada ainda.</p>
        )}
      </Secao>

      <Secao titulo="3. Hipóteses" id="dlj-d3">
        <div className="surface">
          <ul className="dlj-hyps">
            {S.hipoteses.map((h) => (
              <li key={h.id}>
                <strong>{h.id}</strong>
                <span>
                  {h.txt}
                  <small className="jg-muted">
                    {h.tipo}
                    {h.evid ? ` · evidência: ${h.evid}` : ''}
                  </small>
                </span>
                <TagHipotese status={h.status} />
              </li>
            ))}
          </ul>
        </div>
      </Secao>

      <Secao titulo="4. Decisões de governança" id="dlj-d4">
        <div className="surface">
          {S.decisoes.length ? (
            <div className="dlj-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ciclo</th>
                    <th>Motor</th>
                    <th>Decisão</th>
                    <th className="num">Confiança</th>
                    <th className="num">Dia</th>
                    <th>Justificativa</th>
                  </tr>
                </thead>
                <tbody>
                  {S.decisoes.map((x, i) => (
                    <tr key={`${x.ciclo}-${x.motor}-${i}`}>
                      <td>{x.ciclo}</td>
                      <td>
                        {x.motor}. {MOTORES[x.motor - 1].verbo}
                      </td>
                      <td>
                        <Tag tom={DECISAO[x.dec][1]}>{DECISAO[x.dec][0]}</Tag>
                      </td>
                      <td className="num">{x.conf}%</td>
                      <td className="num">{Math.round(x.dia)}</td>
                      <td className="jg-muted">{x.just}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="jg-muted">Nenhuma decisão registrada ainda.</p>
          )}
        </div>
      </Secao>

      {S.backlogFuturo.length ? (
        <Secao titulo={`${++secao}. Backlog do futuro`} id="dlj-d5">
          <div className="surface">
            <div className="dlj-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item</th>
                    <th>Prioridade</th>
                    <th>Evidência</th>
                    <th>Gatilho de revisão</th>
                  </tr>
                </thead>
                <tbody>
                  {S.backlogFuturo.map((b, i) => (
                    <tr key={b.item}>
                      <td>{i + 1}</td>
                      <td>
                        <strong>{b.item}</strong>
                      </td>
                      <td>
                        <Tag tom={b.pri === 'Alta' ? 'ok' : b.pri === 'Média' ? 'warn' : ''}>{b.pri}</Tag>
                      </td>
                      <td className="jg-muted">{b.ev}</td>
                      <td className="jg-muted">{b.gat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Secao>
      ) : null}

      <Secao titulo={`${++secao}. Capacidade deixada na organização`} id="dlj-d6">
        <div className="surface">
          <ul className="dlj-list">
            <li>{S.memoria.length} registros de aprendizado na memória, rastreáveis até o investimento.</li>
            <li>{M.ativos || 0} ativos digitais reutilizáveis catalogados.</li>
            <li>
              {M.dec} decisões de gate documentadas, {M.pctEv}% delas com confiança de 70% ou mais.
            </li>
            <li>Critérios de governança e gatilhos de revisão definidos para os próximos ciclos.</li>
          </ul>
        </div>
      </Secao>
    </div>
  );
}

