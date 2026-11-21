import { MOTORES, ROLES } from '../../domain/darklabs/conteudo.js';
import { brl } from '../../domain/darklabs/formato.js';
import { custo, diasMotor, prod } from '../../domain/darklabs/simulacao.js';
import { Cabecalho, ChipMotor, Tag, TagHipotese, TagStatus, Vazio, corMotor } from './bits.jsx';

const TIPO = { metodo: 'método', saida: 'saída', decisao: 'decisão', hipotese: 'hipótese', sistema: 'sistema' };

const FILTROS = [
  ['todos', 'Tudo'],
  ['metodo', 'Métodos'],
  ['saida', 'Saídas'],
  ['decisao', 'Decisões'],
  ['hipotese', 'Hipóteses'],
  ['sistema', 'Sistema'],
];

export default function TelaMemoria({ loja }) {
  const { S, filtro } = loja;
  if (!S.memoria.length) {
    return <Vazio titulo="A memória está vazia" texto="Cada método executado, saída consolidada e decisão de gate fica registrado aqui." rotulo="Começar pela triagem" onClick={() => loja.go('triagem')} />;
  }
  const itens = S.memoria.filter((x) => filtro === 'todos' || x.tipo === filtro).slice().reverse();
  const p = prod(S);
  const total = p ? custo(S, ROLES, p) : 0;

  return (
    <div className="dlj-stack">
      <Cabecalho eyebrow="Rastreabilidade entre investimento, aprendizado e valor" titulo="Memória de aprendizados" />
      <div className="dlj-split">
        <section className="surface" aria-labelledby="dlj-timeline">
          <header className="surface-head">
            <h3 id="dlj-timeline" className="surface-title">
              Linha do tempo
            </h3>
            <div className="segmented segmented--sm" role="group" aria-label="Filtrar registros">
              {FILTROS.map(([k, l]) => (
                <button key={k} type="button" className={`segmented__btn ${filtro === k ? 'is-selected' : ''}`} aria-pressed={filtro === k} onClick={() => loja.setFiltro(k)}>
                  {l}
                </button>
              ))}
            </div>
          </header>
          <ol className="dlj-tl">
            {itens.length ? (
              itens.map((x, i) => {
                const mo = MOTORES[x.motor - 1];
                return (
                  <li key={`${i}-${x.dia}-${x.txt.slice(0, 20)}`} style={{ '--mc': mo ? corMotor(x.motor) : 'var(--chart-other)' }}>
                    <div className="dlj-tl__head">
                      <strong>Dia {x.dia}</strong>
                      <span>ciclo {x.ciclo}</span>
                      {mo ? (
                        <Tag>
                          Motor {x.motor} · {mo.verbo}
                        </Tag>
                      ) : null}
                      <Tag>{TIPO[x.tipo] ?? x.tipo}</Tag>
                    </div>
                    <p>{x.txt}</p>
                  </li>
                );
              })
            ) : (
              <li className="jg-muted">Nada neste filtro.</li>
            )}
          </ol>
        </section>

        <div className="dlj-stack">
          <section className="surface" aria-labelledby="dlj-hip">
            <header className="surface-head">
              <h3 id="dlj-hip" className="surface-title">
                Hipóteses
              </h3>
            </header>
            {S.hipoteses.length ? (
              <ul className="dlj-hyps">
                {S.hipoteses.map((h) => (
                  <li key={h.id}>
                    <strong>{h.id}</strong>
                    <span>
                      {h.txt}
                      <small className="jg-muted">
                        {h.tipo}
                        {h.evid ? ` · ${h.evid}` : ''}
                      </small>
                    </span>
                    <TagHipotese status={h.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="jg-muted">As hipóteses são geradas ao iniciar a jornada.</p>
            )}
          </section>

          {p && S.iniciada ? (
            <section className="surface" aria-labelledby="dlj-rastro">
              <header className="surface-head">
                <h3 id="dlj-rastro" className="surface-title">
                  Rastreabilidade do ciclo {S.ciclo}
                </h3>
              </header>
              <div className="dlj-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Motor</th>
                      <th className="num">Investimento</th>
                      <th className="num">Aprendizados</th>
                      <th className="num">Decisões</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.motores.map((m) => (
                      <tr key={m}>
                        <td>
                          <span className="dlj-row">
                            <ChipMotor n={m} small /> {MOTORES[m - 1].verbo}
                          </span>
                        </td>
                        <td className="num">{brl((total * diasMotor(S, m)) / p.dias)}</td>
                        <td className="num">{S.memoria.filter((x) => x.motor === m && (x.tipo === 'metodo' || x.tipo === 'saida')).length}</td>
                        <td className="num">{S.decisoes.filter((d) => d.motor === m && d.ciclo === S.ciclo).length}</td>
                        <td>
                          <TagStatus status={S.motores[m].status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="field-hint dlj-mt">
                Investimento acumulado em todos os ciclos: <strong>{brl(S.invest)}</strong> · valor potencial anual: <strong>{S.bc ? brl(S.bc.valor) : '—'}</strong>
              </p>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
