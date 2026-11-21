import { useMemo, useState } from 'react';
import { can } from '../../../domain/journey/journeyEngine.js';
import { useJourney } from '../../../journey/JourneyContext.jsx';
import { EmptyState, goToTab } from '../../../components/journey/JourneyBits.jsx';
import { DarklabsMark } from '../../../components/auth/LoginScreen.jsx';
import DarklabMenuIcon from './DarklabMenuIcons.jsx';
import { MOTOR_ICON, MOTOR_STATUS } from './MotorsJourney.jsx';
import { ROTULO_CELULA, SITUACAO_DA_ETAPA, lerInicioDoRoadmap, montarRoadmap } from './roadmapData.js';

const ACEITE_KEY = (id) => `jornada.darklab.protocolo-aceite.${id}`;
/** Cor de cada situação da etapa, nas mesmas cores da linha do tempo dos 7 motores. */
const TOM = { concluida: 'aceito', fechamento: 'produzido', andamento: 'andamento', impedida: 'dependencia', nao: 'nao' };

function lerAceites(projectId) {
  try {
    return JSON.parse(window.localStorage.getItem(ACEITE_KEY(projectId)) ?? '{}') ?? {};
  } catch {
    return {};
  }
}

/** DarkLabs › Protocolo em 5 etapas: etapas do projeto, situação vinda dos motores e aceite formal de cada etapa. */
export default function DarklabProtocoloView({ onSelect }) {
  const { catalog, project, pending, role, openArtifact } = useJourney();
  const projectId = project?.projectId ?? null;
  const [aceites, setAceites] = useState(() => (projectId ? lerAceites(projectId) : {}));
  const [abertas, setAbertas] = useState([]);
  const [escolhaExemplo, setEscolhaExemplo] = useState(null);
  const [projetoAtual, setProjetoAtual] = useState(projectId);
  if (projectId !== projetoAtual) {
    setProjetoAtual(projectId);
    setAceites(projectId ? lerAceites(projectId) : {});
    setAbertas([]);
    setEscolhaExemplo(null);
  }

  // Mesmas janelas da tela Aprendizados e roadmap (início escolhido lá, ou a semana de criação do projeto).
  const inicioMs = projectId ? (lerInicioDoRoadmap(projectId)?.getTime() ?? null) : null;
  const real = useMemo(
    () => (project ? montarRoadmap({ project, catalog, pending, inicio: inicioMs === null ? null : new Date(inicioMs) }) : null),
    [project, catalog, pending, inicioMs],
  );
  const exemplo = Boolean(real?.semExecucao) && escolhaExemplo !== false;
  const r = useMemo(
    () => (exemplo && project ? montarRoadmap({ project, catalog, pending, exemplo: true }) : real),
    [exemplo, project, catalog, pending, real],
  );

  if (!project || !r) {
    return (
      <div className="jg-page">
        <EmptyState
          title="Crie o projeto no Contexto"
          action={
            <button type="button" className="btn btn--sm btn--primary" onClick={() => goToTab('contexto')}>
              Ir para o Contexto
            </button>
          }
        >
          O protocolo organiza as etapas do projeto a partir dos resultados dos 7 motores do DarkLabs.
        </EmptyState>
      </div>
    );
  }

  const podeAceitar = can(role, 'accept') && !exemplo;
  const conta = (sit) => r.etapas.filter((e) => e.situacao === sit).length;
  const totalAceites = exemplo ? 0 : r.etapas.filter((e) => aceites[e.n]).length;
  function irPara(n) {
    setAbertas((a) => (a.includes(n) ? a : [...a, n]));
    requestAnimationFrame(() => document.getElementById(`pr-card-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }
  const alternarAberta = (n) => setAbertas((a) => (a.includes(n) ? a.filter((x) => x !== n) : [...a, n]));
  function alternarAceite(n) {
    if (!podeAceitar) return;
    setAceites((atual) => {
      const proximo = { ...atual };
      if (proximo[n]) delete proximo[n];
      else proximo[n] = { por: role, em: new Date().toISOString() };
      try {
        window.localStorage.setItem(ACEITE_KEY(projectId), JSON.stringify(proximo));
      } catch {
        /* ignora */
      }
      return proximo;
    });
  }

  return (
    <div className="jg-page pr">
      <section className="mj-hero is-collapsed pr-hero" aria-labelledby="pr-title">
        <span className="mj-hero__mark" aria-hidden="true">
          <DarklabsMark tone="light" />
        </span>
        <div className="mj-hero__heading">
          <p className="mj-eyebrow">Framework · protocolo do projeto</p>
          <h2 id="pr-title" className="mj-title">
            Nossa jornada de transformação em 5 etapas.
          </h2>
          <p className="pr-hero__lead">
            Do conhecimento existente ao roadmap executável: um protocolo específico para <strong>{project.name}</strong>, com entregáveis sujeitos a
            validação humana e rastreabilidade transversal pelos sete motores DarkLabs.
          </p>
        </div>
        <ul className="mj-stats" aria-label="Situação das etapas">
          <li className="mj-stat mj-stat--ok">
            {conta('concluida')} etapa{conta('concluida') === 1 ? '' : 's'} concluída{conta('concluida') === 1 ? '' : 's'}
          </li>
          <li className="mj-stat mj-stat--warn">
            {conta('fechamento')} em fechamento · {conta('andamento') + conta('impedida')} em andamento
          </li>
          <li className="mj-stat">{totalAceites} de 5 com aceite formal</li>
          <li className="mj-stat mj-stat--strong">5 etapas do projeto ≠ 7 motores DarkLabs</li>
        </ul>
      </section>

      {r.semExecucao && !exemplo ? (
        <div className="ar-notice" role="status">
          <DarklabMenuIcon name="infinity" size={18} />
          <p>
            <strong>Nenhum motor foi executado neste projeto.</strong> As etapas ficam como não iniciadas até os motores ligados a elas terem
            resultado.
          </p>
          <button type="button" className="btn btn--sm" onClick={() => setEscolhaExemplo(true)}>
            Ver exemplo de preenchimento
          </button>
          <button type="button" className="btn btn--sm btn--primary" onClick={() => onSelect?.('jornada-7-motores')}>
            Ir para a Jornada dos 7 motores
          </button>
        </div>
      ) : null}
      {exemplo ? (
        <div className="ar-notice ar-notice--example" role="status">
          <DarklabMenuIcon name="pencil" size={18} />
          <p>
            <strong>Exemplo ilustrativo.</strong> Nenhum motor foi executado neste projeto ainda, então a situação das etapas mostra como a tela fica
            com motores em situações diferentes; não são dados do projeto.
          </p>
          <button type="button" className="btn btn--sm" onClick={() => setEscolhaExemplo(false)}>
            Ver dados do projeto
          </button>
          <button type="button" className="btn btn--sm btn--primary" onClick={() => onSelect?.('jornada-7-motores')}>
            Executar os motores
          </button>
        </div>
      ) : null}

      <section className="mj-timeline pr-timeline" aria-label="Linha do tempo das 5 etapas">
        <ul className="mj-legend" aria-label="Legenda">
          {Object.entries(SITUACAO_DA_ETAPA).map(([k, v]) => (
            <li key={k}>
              <span className={`mj-dot mj-dot--${TOM[k]}`} aria-hidden="true" /> {v.toLowerCase()}
            </li>
          ))}
        </ul>
        <ol className="mj-steps">
          {r.etapas.map((e, i) => {
            const prox = r.etapas[i + 1];
            const tom = TOM[e.situacao];
            const linha = prox
              ? e.situacao === 'concluida' && prox.situacao === 'concluida'
                ? 'aceito'
                : e.situacao === 'nao'
                  ? 'nao'
                  : 'produzido'
              : null;
            return (
              <li key={e.n} className={`mj-step mj-step--${tom}`}>
                {linha ? <span className={`mj-link mj-link--${linha}`} aria-hidden="true" /> : null}
                <button
                  type="button"
                  className="mj-node pr-node"
                  onClick={() => irPara(e.n)}
                  aria-label={`Etapa ${e.n}: ${e.titulo}. ${SITUACAO_DA_ETAPA[e.situacao]}. Ver detalhes.`}
                >
                  <span className="pr-node__n tabular">{e.n}</span>
                  {!exemplo && aceites[e.n] ? (
                    <span className="mj-node__badge" aria-hidden="true">
                      <DarklabMenuIcon name="check" size={13} />
                    </span>
                  ) : null}
                </button>
                <span className="mj-step__name">{e.titulo}</span>
                <span className="mj-step__status">{SITUACAO_DA_ETAPA[e.situacao]}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <ol className="pr-list">
        {r.etapas.map((e) => {
          const aberta = abertas.includes(e.n);
          const aceite = exemplo ? null : aceites[e.n];
          const corpoId = `pr-etapa-${e.n}`;
          return (
            <li key={e.n} id={`pr-card-${e.n}`} className={`pr-stage pr-stage--n${e.n} ${aberta ? 'is-open' : ''}`}>
              <div className="pr-stage__head">
                <span className="pr-stage__num tabular">{e.n}</span>
                <div className="pr-stage__main">
                  <p className="pr-stage__eyebrow">Etapa {e.n}</p>
                  <h3 className="pr-stage__title">{e.titulo}</h3>
                  <p className="pr-stage__desc">{e.descricao}</p>
                </div>
                <div className="pr-stage__side">
                  <span className={`ar-pill pr-pill pr-pill--${e.situacao}`}>
                    <span className="ar-pill__dot" aria-hidden="true" /> {SITUACAO_DA_ETAPA[e.situacao]}
                  </span>
                  {e.dataPrazo ? (
                    <span className="pr-stage__date">
                      {e.prazo} {e.dataPrazo}
                    </span>
                  ) : null}
                  <span className={`pr-accept ${aceite ? 'is-done' : ''}`}>
                    <DarklabMenuIcon name="shield" size={16} />
                    {aceite ? 'aceite formal registrado' : 'aceite formal separado'}
                  </span>
                </div>
                <button
                  type="button"
                  className="pr-stage__toggle"
                  onClick={() => alternarAberta(e.n)}
                  aria-expanded={aberta}
                  aria-controls={corpoId}
                  aria-label={aberta ? `Recolher a etapa ${e.n}` : `Ver detalhes da etapa ${e.n}`}
                >
                  <DarklabMenuIcon name="chevron" size={16} />
                </button>
              </div>

              {aberta ? (
                <div id={corpoId} className="pr-stage__body">
                  <div className="pr-col">
                    <p className="pr-col__title">Motores que alimentam a etapa</p>
                    <ul className="pr-motors">
                      {e.motoresDaEtapa.map((m) => (
                        <li key={m.numero}>
                          <button
                            type="button"
                            className={`jf-motor jf-motor--${m.situacao}`}
                            onClick={() => (m.revisao ? openArtifact(m.capId) : onSelect?.('jornada-7-motores'))}
                            title={m.revisao ? `Abrir o resultado R${m.revisao}` : 'Ir para a Jornada dos 7 motores'}
                          >
                            <DarklabMenuIcon name={MOTOR_ICON[m.numero]} size={13} />
                            Motor {m.numero} · {m.verbo}
                            <em>{MOTOR_STATUS[m.situacao]?.label}</em>
                          </button>
                        </li>
                      ))}
                    </ul>
                    {e.perguntasAltas.length ? (
                      <>
                        <p className="pr-col__title">Lacunas de impacto alto</p>
                        <ul className="pr-gaps">
                          {e.perguntasAltas.map((q) => (
                            <li key={q}>
                              <span className="ar-impact ar-impact--alto">alto</span> {q}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                  </div>
                  <div className="pr-col">
                    <p className="pr-col__title">
                      Entregáveis <span className="tabular">{e.entregaveis.length}</span>
                    </p>
                    <ul className="pr-deliv">
                      {e.entregaveis.map((d) => (
                        <li key={`${d.motor}-${d.titulo}`}>
                          <span className={`ar-swatch ar-swatch--${d.status}`} aria-hidden="true" />
                          <span className="pr-deliv__name">{d.titulo}</span>
                          <em>
                            M{d.motor} · {d.janela} · {ROTULO_CELULA[d.status]}
                          </em>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pr-col pr-col--accept">
                    <p className="pr-col__title">Aceite formal da etapa</p>
                    <p className="ar-sub">
                      O aceite da etapa é separado do aceite de cada motor: confirma que os entregáveis da etapa foram validados pelas pessoas
                      responsáveis.
                    </p>
                    {aceite ? (
                      <p className="pr-accept__who">
                        <DarklabMenuIcon name="check" size={14} /> Registrado por {aceite.por} em {new Date(aceite.em).toLocaleDateString('pt-BR')}.
                      </p>
                    ) : null}
                    <button
                      type="button"
                      className={`btn btn--sm ${aceite ? '' : 'btn--primary'}`}
                      disabled={!podeAceitar}
                      onClick={() => alternarAceite(e.n)}
                      title={
                        exemplo
                          ? 'Indisponível no exemplo ilustrativo'
                          : podeAceitar
                            ? undefined
                            : 'Só Aprovador ou Administrador registra o aceite formal'
                      }
                    >
                      {aceite ? 'Desfazer aceite formal' : 'Registrar aceite formal'}
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
