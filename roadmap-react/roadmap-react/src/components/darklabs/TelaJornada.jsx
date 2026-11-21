import Icon from '../ui/Icon.jsx';
import { MOTORES, ROLES } from '../../domain/darklabs/conteudo.js';
import { confianca, diasMotor, metricas, prod } from '../../domain/darklabs/simulacao.js';
import { Barra, Cabecalho, ChipMotor, IconeMotor, Kpi, TagStatus, Vazio, corMotor } from './bits.jsx';

function No({ loja, m }) {
  const mo = MOTORES[m - 1];
  const st = loja.S.motores[m]?.status ?? 'fora';
  return (
    <button type="button" className={`dlj-node is-${st}`} style={{ '--mc': corMotor(m) }} onClick={() => loja.go(`motor-${m}`)}>
      {st === 'concluido' ? (
        <span className="dlj-node__st is-ok" aria-label="concluído">
          <Icon name="check" size={13} />
        </span>
      ) : st === 'interrompido' ? (
        <span className="dlj-node__st is-bad" aria-label="interrompido">
          <Icon name="close" size={13} />
        </span>
      ) : null}
      <span className="dlj-node__ico">
        <IconeMotor n={m} size={22} />
      </span>
      <strong>{mo.verbo}</strong>
      <small>{mo.desc}</small>
    </button>
  );
}

export default function TelaJornada({ loja }) {
  const { S } = loja;
  if (!S.iniciada) {
    return <Vazio titulo="A jornada ainda não começou" texto="Faça a triagem, escolha um produto e monte o squad para começar." rotulo="Ir para a triagem" onClick={() => loja.go('triagem')} />;
  }
  const p = prod(S);
  const M = metricas(S, ROLES);
  const sc = p.motores;
  const feitos = sc.filter((m) => S.motores[m].status === 'concluido').length;
  const atual = sc.find((m) => ['disponivel', 'andamento'].includes(S.motores[m].status));
  const confs = sc.filter((m) => !['bloqueado', 'cancelado'].includes(S.motores[m].status)).map((m) => confianca(S, m));
  const media = confs.length ? Math.round(confs.reduce((a, b) => a + b, 0) / confs.length) : 0;
  const diaCiclo = Math.round(S.dia - (S.inicioCiclo || 0));

  return (
    <div className="dlj-stack">
      <Cabecalho
        eyebrow={`Ciclo ${S.ciclo} · ${p.nome}`}
        titulo="Fluxo da jornada"
        acoes={
          atual ? (
            <button type="button" className="btn btn--primary" onClick={() => loja.go(`motor-${atual}`)}>
              Continuar no Motor {atual}: {MOTORES[atual - 1].verbo} <Icon name="chevronRight" size={14} />
            </button>
          ) : (
            <button type="button" className="btn btn--primary" onClick={() => loja.go('dossie')}>
              Ver dossiê de resultado <Icon name="chevronRight" size={14} />
            </button>
          )
        }
      />

      <div className="dlj-kpis dlj-kpis--6">
        <Kpi valor={`Dia ${diaCiclo}`} rotulo={`de ${p.dias} previstos`} />
        <Kpi valor={`${feitos}/${sc.length}`} rotulo="motores concluídos" />
        <Kpi valor={`${media}%`} rotulo="confiança média" />
        <Kpi valor={`${M.test}/${M.tot}`} rotulo="hipóteses testadas" />
        <Kpi valor={M.dec} rotulo="decisões nos gates" />
        <Kpi valor={S.memoria.length} rotulo="registros na memória" />
      </div>

      <div className="dlj-flow">
        <section className="dlj-flow__box">
          <p className="dlj-flow__label">
            Qual é o problema?<small>Upstream · as is</small>
          </p>
          <div className="dlj-flow__row">
            <No loja={loja} m={1} />
            <No loja={loja} m={2} />
          </div>
        </section>
        <section className="dlj-flow__box">
          <p className="dlj-flow__label">
            Orquestra o ecossistema<small>Pessoas · dados · IA · parcerias</small>
          </p>
          <div className="dlj-core">
            <strong>
              DARK<span>LABS</span>
            </strong>
            <small>Conecta ideias, pessoas, tecnologia e ecossistema para acelerar o amanhã.</small>
          </div>
        </section>
        <section className="dlj-flow__box">
          <p className="dlj-flow__label">
            Qual é a solução?<small>Downstream · to be</small>
          </p>
          <div className="dlj-flow__row">
            {[3, 4, 5, 6, 7].map((m) => (
              <No key={m} loja={loja} m={m} />
            ))}
          </div>
        </section>
      </div>

      <section aria-labelledby="dlj-sete">
        <h3 id="dlj-sete" className="jg-section-title">
          Os 7 motores do DarkLabs <span className="jg-muted">· capacidades que impulsionam cada etapa</span>
        </h3>
        <div className="dlj-motors">
          {MOTORES.map((mo) => {
            const X = S.motores[mo.n];
            const n = Object.keys(X.metodos).length;
            const noEscopo = X.status !== 'fora';
            return (
              <button key={mo.n} type="button" className={`surface dlj-mcard ${noEscopo ? '' : 'is-out'}`} style={{ '--mc': corMotor(mo.n) }} onClick={() => loja.go(`motor-${mo.n}`)}>
                <span className="dlj-row dlj-row--between">
                  <ChipMotor n={mo.n} />
                  <TagStatus status={X.status} />
                </span>
                <strong className="dlj-mcard__name">{mo.nome}</strong>
                <span className="dlj-mcard__verb">{mo.verbo}</span>
                {noEscopo ? (
                  <>
                    <Barra pct={(n / mo.metodos.length) * 100} cor={corMotor(mo.n)} />
                    <small className="jg-muted">
                      {n}/{mo.metodos.length} métodos · {Math.round(diasMotor(S, mo.n))} dias
                    </small>
                  </>
                ) : (
                  <small className="jg-muted">Não faz parte deste produto</small>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <div className="dlj-loop">
        <Icon name="reset" size={20} />
        <div>
          <strong>Aprendizado contínuo</strong>
          <p className="jg-muted">
            Melhores soluções, mais valor, em escala. {S.memoria.length} registros nesta memória, em {S.ciclo} ciclo(s).
          </p>
        </div>
        <button type="button" className="btn btn--sm" onClick={() => loja.go('memoria')}>
          Abrir memória
        </button>
      </div>
    </div>
  );
}
