import Icon from '../ui/Icon.jsx';
import { AREAS, MOTORES, ROLES } from '../../domain/darklabs/conteudo.js';
import { brl, fmt } from '../../domain/darklabs/formato.js';
import { custo, diasMotor, horasTotais, prod } from '../../domain/darklabs/simulacao.js';
import { Aviso, Barra, Cabecalho, ChipMotor, ICONE_PAPEL, IconeMotor, Kpi, Vazio, corMotor } from './bits.jsx';

/** Resumo de investimento e esforço do squad, com a fatia de cada motor. */
export function ResumoInvestimento({ S }) {
  const p = prod(S);
  if (!p) return null;
  const total = custo(S, ROLES, p);
  const maior = Math.max(...p.motores.map((x) => diasMotor(S, x, p)));
  return (
    <>
      <div className="dlj-kpis dlj-kpis--4">
        <Kpi valor={p.dias} rotulo={`dias${p.rec ? ' por ciclo' : ''}`} />
        <Kpi valor={fmt(horasTotais(S, ROLES, p))} rotulo="horas de especialistas" />
        <Kpi valor={brl(total)} rotulo="investimento estimado" />
        <Kpi valor={p.motores.length} rotulo={`motores · ${p.motores.length} agentes de IA`} />
      </div>
      <div className="dlj-hbars">
        {p.motores.map((m) => {
          const mo = MOTORES[m - 1];
          return (
            <div key={m} className="dlj-hbar">
              <span>
                {m}. {mo.verbo}
              </span>
              <Barra pct={(diasMotor(S, m, p) / maior) * 100} cor={corMotor(m)} />
              <span className="tabular">{brl((total * diasMotor(S, m, p)) / p.dias)}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function TelaSquad({ loja }) {
  const { S } = loja;
  const p = prod(S);
  if (!p) return <Vazio titulo="Nenhum produto escolhido" texto="Escolha um produto na prateleira de serviços para montar o squad." rotulo="Ir para a prateleira" onClick={() => loja.go('prateleira')} />;
  const travado = S.iniciada && !S.concluida;
  const coresPapel = [1, 3, 4, 5, 6];

  return (
    <div className="dlj-stack">
      <Cabecalho eyebrow={`Etapa 3 · ${p.nome}`} titulo="Squad e especialidades">
        Especialistas DarkLabs orquestram humanos e agentes de IA. Ajuste a dedicação de cada papel e as especialidades envolvidas.
      </Cabecalho>
      {travado ? (
        <Aviso
          acoes={
            <button type="button" className="btn btn--sm" onClick={() => loja.go('jornada')}>
              Ir para a jornada
            </button>
          }
        >
          A jornada já está em andamento. O squad fica bloqueado até o fim do ciclo.
        </Aviso>
      ) : null}

      <div className="jg-grid jg-grid--5">
        {ROLES.map((r, k) => (
          <article key={r.id} className="surface dlj-role" style={{ '--mc': corMotor(coresPapel[k]) }}>
            <span className="dlj-ico">
              <Icon name={ICONE_PAPEL[r.id]} size={20} />
            </span>
            <h4 className="dlj-card__title">{r.nome}</h4>
            <p className="jg-muted">{r.desc}</p>
            {r.id === 'areas' ? (
              <div className="dlj-checks">
                {Object.entries(AREAS).map(([k2, l]) => (
                  <label key={k2} className="dlj-check">
                    <input
                      type="checkbox"
                      checked={S.areas.includes(k2)}
                      disabled={travado}
                      onChange={() =>
                        loja.mudar((X) => {
                          const i = X.areas.indexOf(k2);
                          if (i >= 0) X.areas.splice(i, 1);
                          else X.areas.push(k2);
                        })
                      }
                    />
                    <span>{l}</span>
                  </label>
                ))}
              </div>
            ) : (
              <ul className="dlj-list">
                {r.itens.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            )}
            <div className="dlj-role__alloc">
              <div className="dlj-row dlj-row--between">
                <span className="jg-muted">Dedicação{r.id === 'areas' ? ' por especialidade' : ''}</span>
                <strong className="tabular">{S.squad[r.id] ?? 0}%</strong>
              </div>
              <input
                type="range"
                className="range"
                min={0}
                max={100}
                step={10}
                value={S.squad[r.id] ?? 0}
                disabled={travado}
                aria-label={`Dedicação de ${r.nome}`}
                style={{ '--fill': `${S.squad[r.id] ?? 0}%` }}
                onChange={(e) =>
                  loja.mudar((X) => {
                    X.squad[r.id] = Number(e.target.value);
                  })
                }
              />
            </div>
          </article>
        ))}
      </div>

      <div className="jg-grid jg-grid--2">
        <section className="surface" aria-labelledby="dlj-invest">
          <header className="surface-head">
            <h3 id="dlj-invest" className="surface-title">
              Investimento e esforço
            </h3>
          </header>
          <ResumoInvestimento S={S} />
        </section>
        <section className="surface" aria-labelledby="dlj-agentes">
          <header className="surface-head">
            <h3 id="dlj-agentes" className="surface-title">
              Agentes de IA da jornada
            </h3>
          </header>
          <ul className="dlj-rows">
            {p.motores.map((m) => {
              const mo = MOTORES[m - 1];
              return (
                <li key={m}>
                  <ChipMotor n={m} />
                  <span className="dlj-motor-ico" style={{ '--mc': corMotor(m) }}>
                    <IconeMotor n={m} size={16} />
                  </span>
                  <strong>{mo.agente}</strong>
                  <span className="jg-muted">{mo.nome}</span>
                </li>
              );
            })}
          </ul>
          <p className="field-hint dlj-mt">Os agentes produzem análises e artefatos. Toda saída passa por validação de um especialista, e as decisões dos gates são sempre humanas.</p>
        </section>
      </div>

      <div className="dlj-row">
        {travado ? (
          <button type="button" className="btn btn--primary" onClick={() => loja.go('jornada')}>
            Ir para a jornada <Icon name="chevronRight" size={14} />
          </button>
        ) : (
          <>
            <button type="button" className="btn btn--primary" onClick={() => loja.iniciar()}>
              Iniciar {S.ciclo > 1 ? `ciclo ${S.ciclo}` : 'a jornada'} <Icon name="chevronRight" size={14} />
            </button>
            <button type="button" className="btn" onClick={() => loja.go('prateleira')}>
              Trocar produto
            </button>
          </>
        )}
      </div>
    </div>
  );
}
