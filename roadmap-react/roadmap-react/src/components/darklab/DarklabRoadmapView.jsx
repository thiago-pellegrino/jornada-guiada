import { useMemo, useState } from 'react';
import { useJourney } from '../../journey/JourneyContext.jsx';
import { EmptyState, goToTab } from '../journey/JourneyBits.jsx';
import DarklabMenuIcon from './DarklabMenuIcons.jsx';
import { MOTOR_ICON, MOTOR_STATUS } from './MotorsJourney.jsx';
import {
  CHAVE_INICIO_ROADMAP as INICIO_KEY,
  LEGENDA,
  ROTULO_CELULA,
  SITUACAO_DA_ETAPA,
  lerInicioDoRoadmap as lerInicio,
  montarRoadmap,
  segundaDa,
} from './roadmapData.js';

const ONDAS = [
  ['agora', 'Agora'],
  ['próximo', 'Próximo'],
  ['futuro', 'Futuro'],
];
const FAIXAS = {
  up: {
    chip: 'Upstream · AS IS',
    texto: 'Motores 1–2 · AS IS · “Qual é o problema?”',
  },
  down: {
    chip: 'Downstream · TO BE',
    texto: 'Motores 3–7 · TO BE · “Qual é a solução?”',
  },
};

function isoDia(d) {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

function FaixaChip({ faixa }) {
  return (
    <span className={`mj-chip mj-chip--light mj-chip--${faixa}`}>
      <span className="mj-chip__dot" aria-hidden="true" /> {FAIXAS[faixa].chip}
    </span>
  );
}

/** DarkLabs › Aprendizados e roadmap: matriz motor × janela, protocolo em 5 etapas, marcos, aprendizados e roadmap. */
export default function DarklabRoadmapView({ onSelect }) {
  const { catalog, project, pending, openArtifact } = useJourney();
  const [inicioEscolhido, setInicioEscolhido] = useState(() => (project ? lerInicio(project.projectId) : null));
  const [projetoDoInicio, setProjetoDoInicio] = useState(project?.projectId ?? null);
  // null = automático: sem nenhum motor executado, a tela abre no exemplo ilustrativo (com aviso).
  const [escolhaExemplo, setEscolhaExemplo] = useState(null);
  if (project && project.projectId !== projetoDoInicio) {
    setProjetoDoInicio(project.projectId);
    setInicioEscolhido(lerInicio(project.projectId));
    setEscolhaExemplo(null);
  }

  const real = useMemo(
    () => (project ? montarRoadmap({ project, catalog, pending, inicio: inicioEscolhido }) : null),
    [project, catalog, pending, inicioEscolhido],
  );
  const exemplo = Boolean(real?.semExecucao) && escolhaExemplo !== false;
  const r = useMemo(
    () => (exemplo && project ? montarRoadmap({ project, catalog, pending, inicio: inicioEscolhido, exemplo: true }) : real),
    [exemplo, project, catalog, pending, inicioEscolhido, real],
  );
  const setExemplo = (v) => setEscolhaExemplo(v);

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
          O roadmap cruza a execução dos 7 motores do DarkLabs com as janelas do projeto.
        </EmptyState>
      </div>
    );
  }

  function mudarInicio(valor) {
    if (!valor) return;
    const [a, m, d] = valor.split('-').map(Number);
    const data = new Date(a, m - 1, d);
    setInicioEscolhido(data);
    try {
      window.localStorage.setItem(INICIO_KEY(project.projectId), valor);
    } catch {
      /* ignora */
    }
  }
  function voltarInicioPadrao() {
    setInicioEscolhido(null);
    try {
      window.localStorage.removeItem(INICIO_KEY(project.projectId));
    } catch {
      /* ignora */
    }
  }

  const { janelas, atual, linhas, etapas, marcos, sequencia, ondas, origemRoadmap, aprendizados, lacunas } = r;
  const conta = (s) => linhas.filter((l) => l.situacao === s).length;
  const ativados = linhas.filter((l) => ['aceito', 'produzido', 'andamento'].includes(l.situacao)).length;
  const comInsumo = conta('nao');

  return (
    <div className="jg-page ar">
      {/* Abertura: o que a matriz mostra + próxima sequência crítica */}
      <div className="ar-top">
        <section className="mj-hero ar-hero" aria-labelledby="ar-title">
          <span className="ar-hero__seven" aria-hidden="true">
            7
          </span>
          <p className="mj-eyebrow">Roadmap × sete motores</p>
          <h2 id="ar-title" className="ar-hero__title">
            Ativações conectadas até a decisão — e além.
          </h2>
          <p className="mj-lead ar-hero__lead">
            A matriz mostra quando cada motor foi ativado, quando apenas recebeu insumos e quando sua execução está planejada. Verde significa
            resultado aceito ou entrega com evidência de conclusão; âmbar, resultado gerado aguardando aceite.
          </p>
          <ul className="mj-stats" aria-label="Situação dos motores">
            <li className="mj-stat mj-stat--ok">
              {ativados} motor{ativados === 1 ? '' : 'es'} ativado
              {ativados === 1 ? '' : 's'}
            </li>
            <li className="mj-stat mj-stat--warn">
              {conta('aceito')} com execução aceita · {conta('produzido')} aguardando aceite
            </li>
            <li className="mj-stat">{comInsumo} com insumo disponível</li>
            <li className="mj-stat mj-stat--strong">
              {project.code} · {project.name}
            </li>
          </ul>
        </section>

        <aside className="ar-seq" aria-label="Próxima sequência crítica">
          <p className="ar-eyebrow">Próxima sequência crítica</p>
          {sequencia.encerrado ? (
            <>
              <p className="ar-seq__dates">Janelas encerradas</p>
              <p className="ar-seq__text">Todas as janelas do ciclo já passaram. Ajuste o início para planejar um novo ciclo.</p>
            </>
          ) : (
            <>
              <p className="ar-seq__dates tabular">
                {sequencia.datas.map((d, i) => (
                  <span key={i}>
                    {i ? <span className="ar-seq__arrow"> → </span> : null}
                    {d}
                  </span>
                ))}{' '}
                {sequencia.mes}
              </p>
              <p className="ar-seq__text">
                {atual < 0 ? 'O ciclo ainda não começou. ' : ''}Fechar <strong>{sequencia.titulos[0]?.toLowerCase()}</strong>
                {sequencia.titulos[1] ? (
                  <>
                    , seguir para <strong>{sequencia.titulos[1].toLowerCase()}</strong>
                  </>
                ) : null}
                {sequencia.titulos[2] ? (
                  <>
                    {' '}
                    e preparar <strong>{sequencia.titulos[2].toLowerCase()}</strong>
                  </>
                ) : null}
                .
              </p>
            </>
          )}
          <div className="ar-seq__start">
            <label htmlFor="ar-inicio">Início da janela 1</label>
            <input id="ar-inicio" type="date" value={isoDia(r.inicio)} disabled={exemplo} onChange={(e) => mudarInicio(e.target.value)} />
            {inicioEscolhido ? (
              <button
                type="button"
                className="ar-link"
                onClick={voltarInicioPadrao}
                title={`Voltar para a semana de criação do projeto (${isoDia(segundaDa(project.createdAt))})`}
              >
                Usar a criação do projeto
              </button>
            ) : null}
          </div>
        </aside>
      </div>

      {r.semExecucao && !exemplo ? (
        <div className="ar-notice" role="status">
          <DarklabMenuIcon name="infinity" size={18} />
          <p>
            <strong>Nenhum motor foi executado neste projeto.</strong> Por isso a matriz mostra só o que está planejado. Execute os motores na Jornada
            dos 7 motores para as cores aparecerem.
          </p>
          <button type="button" className="btn btn--sm" onClick={() => setExemplo(true)}>
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
            <strong>Exemplo ilustrativo.</strong> Nenhum motor foi executado neste projeto ainda, então as cores mostram como a tela fica com motores
            em situações diferentes; não são dados do projeto.
          </p>
          <button type="button" className="btn btn--sm" onClick={() => setExemplo(false)}>
            Ver dados do projeto
          </button>
          <button type="button" className="btn btn--sm btn--primary" onClick={() => onSelect?.('jornada-7-motores')}>
            Executar os motores
          </button>
        </div>
      ) : null}

      {/* Protocolo do projeto em 5 etapas */}
      <section className="ar-card ar-protocol" aria-labelledby="ar-protocol-title">
        <div className="ar-protocol__head">
          <div>
            <p className="ar-eyebrow ar-eyebrow--accent">Protocolo · {project.name}</p>
            <h3 id="ar-protocol-title" className="ar-h3">
              Nossa jornada de transformação em 5 etapas.
            </h3>
            <p className="ar-sub">
              O protocolo do projeto organiza objetivos, atividades, entregáveis e decisões. Os sete motores do DarkLabs permanecem como capacidades
              transversais e rastreáveis: a situação de cada etapa vem dos motores ligados a ela.
            </p>
          </div>
          <span className="ar-tag">5 etapas do projeto ≠ 7 motores DarkLabs</span>
        </div>
        <ol className="ar-steps">
          {etapas.map((e) => (
            <li key={e.n} className={`ar-step ar-step--${e.situacao}`}>
              <span className="ar-step__num tabular">{e.n}</span>
              <strong className="ar-step__title">{e.titulo}</strong>
              <span className="ar-pill">
                <span className="ar-pill__dot" aria-hidden="true" /> {SITUACAO_DA_ETAPA[e.situacao]}
              </span>
              <span className="ar-step__motors">
                {e.motores.map((n) => `M${n}`).join(' · ')}
                {e.situacao === 'impedida' ? ` · ${e.lacunasAltas} lacuna${e.lacunasAltas === 1 ? '' : 's'} de impacto alto` : ''}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Faixas AS IS / TO BE e o núcleo DarkLabs */}
      <div className="ar-lanes">
        {['up', 'down'].map((f) => (
          <div key={f} className="ar-lane">
            <FaixaChip faixa={f} />
            <span>{FAIXAS[f].texto}</span>
          </div>
        ))}
        <div className="ar-core">
          <strong>DarkLabs</strong> orquestra pessoas, dados, IA e parcerias; o aprendizado contínuo retroalimenta o ciclo.
        </div>
      </div>

      <ul className="ar-legend" aria-label="Legenda da matriz">
        {LEGENDA.map(([k, v]) => (
          <li key={k}>
            <span className={`ar-swatch ar-swatch--${k}`} aria-hidden="true" /> {v}
          </li>
        ))}
      </ul>

      {/* Matriz motor × janela */}
      <div className="ar-matrix-wrap" role="region" aria-label="Matriz motor por janela" tabIndex={0}>
        <table className="ar-matrix">
          <thead>
            <tr>
              <th scope="col" className="ar-matrix__corner">
                Motor / janela
              </th>
              {janelas.map((j) => (
                <th key={j.id} scope="col" className={j.indice === atual ? 'is-now' : ''}>
                  <span className="ar-matrix__date tabular">{j.rotulo}</span>
                  <span className="ar-matrix__win">{j.titulo}</span>
                  {j.indice === atual ? <span className="ar-matrix__now">Agora</span> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.numero}>
                <th scope="row" className="ar-motor">
                  <div className="ar-motor__box">
                    <span className={`ar-motor__num ar-motor__num--${l.faixa}`}>
                      <DarklabMenuIcon name={MOTOR_ICON[l.numero]} size={15} />
                      <span className="tabular">{l.numero}</span>
                    </span>
                    <span className="ar-motor__text">
                      <strong>{l.verbo}</strong>
                      <span>{l.nome}</span>
                      <span className="ar-motor__meta">
                        <FaixaChip faixa={l.faixa} />
                        <span className={`ar-motor__status ar-motor__status--${l.situacao}`}>{MOTOR_STATUS[l.situacao]?.label}</span>
                      </span>
                    </span>
                  </div>
                </th>
                {l.celulas.map((itens, w) => (
                  <td key={w} className={w === atual ? 'is-now' : ''}>
                    {itens.length ? (
                      <div className="ar-cells">
                        {itens.map((c, k) => {
                          const conteudo = (
                            <>
                              <strong>{c.titulo}</strong>
                              <span>
                                {ROTULO_CELULA[c.status]}
                                {c.periodo ? ` · ${c.periodo}` : ''}
                              </span>
                            </>
                          );
                          return l.revisao ? (
                            <button
                              key={k}
                              type="button"
                              className={`ar-cell ar-cell--${c.status}`}
                              onClick={() => openArtifact(l.cap.id)}
                              title={`Abrir o resultado do Motor ${l.numero} (R${l.revisao})`}
                            >
                              {conteudo}
                            </button>
                          ) : (
                            <div key={k} className={`ar-cell ar-cell--${c.status}`}>
                              {conteudo}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="ar-empty" aria-label="Sem atividade nesta janela">
                        —
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Marcos das próximas janelas */}
      <section className="ar-marcos" aria-label="Próximos marcos">
        {marcos.map((m) => (
          <article key={m.janela.id} className={`ar-card ar-marco ${m.atual ? 'is-now' : ''} ${m.passado ? 'is-past' : ''}`}>
            <p className="ar-eyebrow">
              {m.data}
              {m.atual ? <span className="ar-marco__now">Agora</span> : null}
            </p>
            <h4 className="ar-marco__title">{m.janela.titulo}</h4>
            <p className="ar-marco__text">
              {m.abertos.length
                ? `${m.abertos.length} de ${m.total} entrega${m.total === 1 ? '' : 's'} em aberto: ${m.abertos
                    .slice(0, 3)
                    .map((c) => c.titulo)
                    .join('; ')}${m.abertos.length > 3 ? '…' : '.'}`
                : m.total
                  ? 'Todas as entregas desta janela estão executadas.'
                  : 'Sem entregas previstas nesta janela.'}
            </p>
            <ul className="ar-marco__chips">
              {m.motores.map((mm) => {
                const l = linhas.find((x) => x.numero === mm.numero);
                return (
                  <li key={mm.numero}>
                    <button
                      type="button"
                      className="ar-doc"
                      onClick={() => (l?.revisao ? openArtifact(l.cap.id) : onSelect?.('jornada-7-motores'))}
                      title={l?.revisao ? `Abrir o resultado R${l.revisao}` : 'Ir para a Jornada dos 7 motores'}
                    >
                      <span className={`mj-dot mj-dot--${mm.situacao}`} aria-hidden="true" />M{mm.numero} · {l?.verbo}
                      {l?.revisao ? <em className="tabular"> · R{l.revisao}</em> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </section>

      {/* Aprendizados, lacunas e roadmap */}
      <div className="ar-bottom">
        <section className="ar-card" aria-labelledby="ar-learn-title">
          <p className="ar-eyebrow ar-eyebrow--accent">Aprendizados</p>
          <h3 id="ar-learn-title" className="ar-h3">
            O que os resultados já comprovam
          </h3>
          {aprendizados.length ? (
            <ul className="ar-learn">
              {aprendizados.map((a) => (
                <li key={a.numero} className="ar-learn__item">
                  <span className="ar-learn__head">
                    <span className={`mj-dot mj-dot--${a.situacao}`} aria-hidden="true" />
                    <strong>
                      M{a.numero} · {a.nome}
                    </strong>
                  </span>
                  {a.comprova.map((t, i) => (
                    <p key={`c${i}`} className="ar-learn__ok">
                      <DarklabMenuIcon name="check" size={13} /> {t}
                    </p>
                  ))}
                  {a.naoComprova.map((t, i) => (
                    <p key={`n${i}`} className="ar-learn__no">
                      Ainda não comprova: {t}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          ) : (
            <p className="ar-sub">Nenhum motor executado ainda. Os aprendizados aparecem à medida que os resultados são gerados.</p>
          )}
          {lacunas.length ? (
            <div className="ar-gaps">
              <p className="ar-gaps__title">
                Lacunas abertas <span className="tabular">({lacunas.length})</span>
              </p>
              <ul>
                {lacunas.slice(0, 6).map((g) => (
                  <li key={`${g.motores.join('-')}-${g.id}`}>
                    <span className={`ar-impact ar-impact--${g.impacto === 'alto' ? 'alto' : 'outro'}`}>{g.impacto}</span>
                    <span>
                      {g.pergunta} <em>{g.motores.map((n) => `M${n}`).join(' · ')}</em>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="ar-card" aria-labelledby="ar-roadmap-title">
          <p className="ar-eyebrow ar-eyebrow--accent">Roadmap</p>
          <h3 id="ar-roadmap-title" className="ar-h3">
            Ondas de evolução
          </h3>
          <p className="ar-sub">{origemRoadmap ? `Fonte: ${origemRoadmap}.` : 'O roadmap aparece quando o Motor 3 ou o Motor 7 forem executados.'}</p>
          <div className="ar-waves">
            {ONDAS.map(([k, rotulo]) => (
              <div key={k} className={`ar-wave ar-wave--${k === 'próximo' ? 'proximo' : k}`}>
                <p className="ar-wave__title">
                  {rotulo} <span className="tabular">{ondas[k].length}</span>
                </p>
                {ondas[k].length ? (
                  <ul>
                    {ondas[k].map((it) => (
                      <li key={it.id}>
                        <strong>{it.titulo}</strong>
                        {it.detalhe ? <span>{it.detalhe}</span> : null}
                        <em className="tabular">
                          {it.id}
                          {it.mudanca ? ` · ${it.mudanca}` : ''}
                        </em>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="ar-wave__empty">Nada nesta onda.</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
