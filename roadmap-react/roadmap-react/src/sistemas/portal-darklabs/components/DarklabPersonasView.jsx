import { useEffect, useMemo, useRef, useState } from 'react';
import { useJourney } from '../../../journey/JourneyContext.jsx';
import { DarklabsMark } from '../../../components/auth/LoginScreen.jsx';
import { EmptyState, goToTab } from '../../../components/journey/JourneyBits.jsx';
import DarklabMenuIcon from './DarklabMenuIcons.jsx';
import { envelopesDeExemplo, envelopesDoProjeto, layoutForca, montarGrafo, montarPersonas } from './personasData.js';

const L = 1000;
const A = 680;
const corta = (t, n) => (String(t).length > n ? `${String(t).slice(0, n - 1)}…` : String(t));
const pad3 = (n) => String(n).padStart(3, '0');
const agoraHms = () => new Date().toLocaleTimeString('pt-BR', { hour12: false });
const semMovimento = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

function Lista({ titulo, itens, vazio }) {
  return (
    <div className="ps-col">
      <p className="ps-col__title">
        {titulo} <span className="tabular">{itens.length}</span>
      </p>
      {itens.length ? (
        <ul>
          {itens.slice(0, 6).map((n) => (
            <li key={n.id}>
              <em className="tabular">{n.id}</em> {n.rotulo}
            </li>
          ))}
          {itens.length > 6 ? <li className="ps-col__more">e mais {itens.length - 6}</li> : null}
        </ul>
      ) : (
        <p className="ps-col__empty">{vazio}</p>
      )}
    </div>
  );
}

/** DarkLabs › Diário de bordo › Personas sintéticas: personas e o grafo de conhecimento do projeto. */
export default function DarklabPersonasView({ onSelect }) {
  const { catalog, project } = useJourney();
  const envReais = useMemo(() => (project ? envelopesDoProjeto(project, catalog) : []), [project, catalog]);
  const grafoReal = useMemo(() => montarGrafo(envReais), [envReais]);
  const personasReais = useMemo(() => montarPersonas(grafoReal), [grafoReal]);
  const semPersonas = personasReais.length === 0;
  const [escolhaExemplo, setEscolhaExemplo] = useState(null);
  const exemplo = semPersonas && escolhaExemplo !== false;

  const grafo = useMemo(() => (exemplo ? montarGrafo(envelopesDeExemplo(catalog)) : grafoReal), [exemplo, catalog, grafoReal]);
  const personas = useMemo(() => (exemplo ? montarPersonas(grafo) : personasReais), [exemplo, grafo, personasReais]);
  const pos = useMemo(() => layoutForca(grafo, { largura: L, altura: A }), [grafo]);

  const [selecionada, setSelecionada] = useState(null);
  const persona = personas.find((p) => p.id === selecionada) ?? personas[0] ?? null;
  const viz = persona?.vizinhanca ?? new Map();

  // Varredura "ao vivo": percorre as entidades e registra no log o que pertence à persona escolhida.
  const [tocando, setTocando] = useState(() => !semMovimento());
  const [scan, setScan] = useState(0);
  const [log, setLog] = useState([]);
  const logRef = useRef(null);
  const [foco, setFoco] = useState(null);
  useEffect(() => {
    if (!tocando || !grafo.nos.length) return undefined;
    const t = window.setInterval(() => setScan((i) => (i + 1) % grafo.nos.length), 220);
    return () => window.clearInterval(t);
  }, [tocando, grafo.nos.length]);
  const atual = grafo.nos[scan % Math.max(1, grafo.nos.length)];
  useEffect(() => {
    if (!atual || !tocando) return;
    const casa = viz.has(atual.id);
    setLog((l) => [...l.slice(-60), { t: agoraHms(), n: scan + 1, id: atual.id, tipo: atual.tipo.rotulo.toLowerCase(), casa }]);
  }, [scan]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);
  useEffect(() => {
    setLog([]);
    setScan(0);
  }, [persona?.id, exemplo]);

  if (!project) {
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
          As personas sintéticas são montadas a partir dos atores, segmentos e stakeholders identificados nos resultados do projeto.
        </EmptyState>
      </div>
    );
  }

  const destacados = new Set(viz.keys());
  const focoNo = foco ? grafo.nos.find((n) => n.id === foco) : null;
  const rodape = focoNo ?? atual;

  return (
    <div className="jg-page ps">
      <section className="mj-hero is-collapsed" aria-labelledby="ps-title">
        <span className="mj-hero__mark" aria-hidden="true">
          <DarklabsMark tone="light" />
        </span>
        <div className="mj-hero__heading">
          <p className="mj-eyebrow">Diário de bordo · personas sintéticas</p>
          <h2 id="ps-title" className="mj-title">
            Quem está por trás das evidências.
          </h2>
          <p className="pr-hero__lead">
            Cada persona é a síntese do que os resultados registram sobre um ator, segmento ou stakeholder: dores, necessidades, sinais, insights e
            soluções ligados a ela no grafo de conhecimento do projeto. Não substitui pesquisa com pessoas reais.
          </p>
        </div>
        <ul className="mj-stats" aria-label="Resumo do grafo">
          <li className="mj-stat mj-stat--strong">{personas.length} personas</li>
          <li className="mj-stat">{grafo.nos.length} entidades</li>
          <li className="mj-stat">{grafo.arestas.length} ligações</li>
          <li className="mj-stat">
            {project.code} · {project.name}
          </li>
        </ul>
      </section>

      {exemplo ? (
        <div className="ar-notice ar-notice--example" role="status">
          <DarklabMenuIcon name="pencil" size={18} />
          <p>
            <strong>Exemplo ilustrativo.</strong> Este projeto ainda não tem atores, segmentos ou stakeholders nos resultados; o grafo usa os exemplos
            das especificações e não são dados do projeto.
          </p>
          <button type="button" className="btn btn--sm" onClick={() => setEscolhaExemplo(false)}>
            Ver dados do projeto
          </button>
          <button type="button" className="btn btn--sm btn--primary" onClick={() => onSelect?.('jornada-7-motores')}>
            Executar os motores
          </button>
        </div>
      ) : semPersonas ? (
        <div className="ar-notice" role="status">
          <DarklabMenuIcon name="users" size={18} />
          <p>
            <strong>Nenhuma persona ainda.</strong> Elas aparecem quando o Contexto identifica atores, o Motor 1 registra stakeholders ou o Motor 2
            define segmentos.
          </p>
          <button type="button" className="btn btn--sm" onClick={() => setEscolhaExemplo(true)}>
            Ver exemplo
          </button>
        </div>
      ) : null}

      {personas.length ? (
        <>
          <div className="ps-board">
            <div className="ps-side">
              <div className="ps-panel ps-list-panel">
                <p className="ps-panel__head">
                  <span>Personas</span>
                  <em>{exemplo ? 'exemplo' : project.code}</em>
                </p>
                <ol className="ps-list">
                  {personas.map((p, i) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className={`ps-persona ${p.id === persona?.id ? 'is-on' : ''}`}
                        onClick={() => setSelecionada(p.id)}
                        aria-pressed={p.id === persona?.id}
                      >
                        <span className="ps-persona__dot" aria-hidden="true" />
                        <span className="ps-persona__body">
                          <strong>{p.nome}</strong>
                          <span>
                            {p.tipo} · {p.conexoes} conexões
                          </span>
                        </span>
                        <em className="tabular">#{pad3(i + 1)}</em>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="ps-term" aria-label="Registro da varredura">
                <p className="ps-term__bar">
                  <span className="ps-term__icon" aria-hidden="true" /> Varredura de evidências
                  <button type="button" className="ps-term__btn" onClick={() => setTocando((v) => !v)} aria-pressed={tocando}>
                    {tocando ? 'pausar' : 'retomar'}
                  </button>
                </p>
                <ol className="ps-term__log" ref={logRef}>
                  {log.length ? (
                    log.map((l, i) => (
                      <li key={`${l.n}-${i}`} className={l.casa ? 'is-match' : ''}>
                        <span className="ps-term__t">[{l.t}]</span> #{pad3(l.n)} {l.id} <span className="ps-term__k">{l.tipo}</span>
                        <span className="ps-term__r">{l.casa ? 'match' : 'skip'}</span>
                      </li>
                    ))
                  ) : (
                    <li className="ps-term__idle">{tocando ? 'iniciando varredura…' : 'varredura pausada.'}</li>
                  )}
                </ol>
              </div>
            </div>

            <div className="ps-panel ps-graph">
              <p className="ps-panel__head">
                <span>
                  <span className="ps-live" aria-hidden="true" /> Grafo de conhecimento · {grafo.nos.length} entidades ·{' '}
                  {tocando ? 'live' : 'pausado'}
                </span>
                <span className="ps-legend">
                  <i className="is-picked" /> picked <i className="is-scanned" /> scanned
                </span>
              </p>
              <svg
                className="ps-svg"
                viewBox={`0 0 ${L} ${A}`}
                role="img"
                aria-label={`Grafo com ${grafo.nos.length} entidades e ${grafo.arestas.length} ligações`}
              >
                <g className="ps-edges">
                  {grafo.arestas.map(([a, b]) => {
                    const pa = pos[a];
                    const pb = pos[b];
                    if (!pa || !pb) return null;
                    const quente = destacados.has(a) && destacados.has(b);
                    return <line key={`${a}|${b}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} className={quente ? 'is-hot' : ''} />;
                  })}
                </g>
                <g className="ps-nodes">
                  {grafo.nos.map((n) => {
                    const p = pos[n.id];
                    if (!p) return null;
                    const ehPersona = n.tipo.grupo === 'persona';
                    const dist = viz.get(n.id);
                    const r = ehPersona ? 11 : 3.5 + Math.sqrt(n.grau) * 1.8;
                    const cls = [
                      'ps-node',
                      ehPersona ? 'is-persona' : '',
                      n.id === persona?.id ? 'is-selected' : dist !== undefined ? 'is-picked' : '',
                      atual?.id === n.id ? 'is-scanned' : '',
                      foco === n.id ? 'is-focus' : '',
                    ]
                      .filter(Boolean)
                      .join(' ');
                    const rotulo = ehPersona || dist === 1 || foco === n.id;
                    return (
                      <g
                        key={n.id}
                        className={cls}
                        transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}
                        onClick={() => (ehPersona ? setSelecionada(n.id) : setFoco((f) => (f === n.id ? null : n.id)))}
                      >
                        <title>{`${n.id} · ${n.tipo.rotulo}: ${n.rotulo}`}</title>
                        {atual?.id === n.id ? <circle r={r + 7} className="ps-node__ring" /> : null}
                        <circle r={r} />
                        {rotulo ? (
                          <text
                            x={p.x > L - 230 ? -(r + 5) : r + 5}
                            y={4}
                            textAnchor={p.x > L - 230 ? 'end' : 'start'}
                            className={n.id === persona?.id ? 'is-strong' : ''}
                          >
                            {corta(n.rotulo, ehPersona ? 30 : 34)}
                          </text>
                        ) : null}
                      </g>
                    );
                  })}
                </g>
              </svg>
              <p className="ps-foot">
                <span>
                  {exemplo ? 'especificações · exemplos' : `${project.code} · ${envReais.length} resultados lidos`} · {personas.length} personas
                </span>
                {rodape ? (
                  <span className="ps-foot__now">
                    <span className="tabular">
                      #{pad3(grafo.nos.indexOf(rodape) + 1)} / {grafo.nos.length}
                    </span>{' '}
                    <strong>{rodape.id}</strong> {corta(rodape.rotulo, 46)} <em>{focoNo ? 'selecionada' : 'scanned'}</em>
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          {persona ? (
            <section className="ar-card ps-detail" aria-labelledby="ps-detail-title">
              <div className="ps-detail__head">
                <span className="ps-detail__avatar" aria-hidden="true">
                  <DarklabMenuIcon name="users" size={22} />
                </span>
                <div>
                  <p className="ar-eyebrow ar-eyebrow--accent">
                    {persona.tipo} · {persona.id}
                  </p>
                  <h3 id="ps-detail-title" className="ps-detail__name">
                    {persona.nome}
                  </h3>
                  {persona.descricao ? <p className="ar-sub">{persona.descricao}</p> : null}
                </div>
                <ul className="ps-detail__facts">
                  <li>
                    <strong className="tabular">{persona.conexoes}</strong> conexões
                  </li>
                  <li>
                    <strong className="tabular">{persona.evidencias}</strong> evidências
                  </li>
                  <li>
                    <strong className="tabular">{persona.lacunas.length}</strong> lacunas
                  </li>
                </ul>
              </div>
              <p className="ps-detail__quote">
                <DarklabMenuIcon name="signal" size={16} /> {persona.sintese}
              </p>
              <div className="ps-detail__grid">
                <Lista titulo="Dores" itens={persona.dores} vazio="Nenhuma dor ligada." />
                <Lista titulo="Necessidades" itens={persona.necessidades} vazio="Nenhuma necessidade ligada." />
                <Lista titulo="Sinais" itens={persona.sinais} vazio="Nenhum sinal ligado." />
                <Lista titulo="Insights" itens={persona.insights} vazio="Nenhum insight ligado." />
                <Lista titulo="Soluções" itens={persona.solucoes} vazio="Nenhuma pílula de solução ligada." />
                <Lista
                  titulo="Jornadas e hipóteses"
                  itens={[...persona.jornadas, ...persona.hipoteses]}
                  vazio="Nenhuma jornada ou hipótese ligada."
                />
              </div>
              <p className="ps-detail__note">
                Origem: {persona.origem}
                {persona.natureza ? ` · natureza ${persona.natureza}` : ''}. Persona sintética: síntese das evidências ligadas no grafo; valide com
                pessoas reais antes de decidir.
              </p>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
