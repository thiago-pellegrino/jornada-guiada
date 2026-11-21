import { useMemo, useState } from 'react';
import { useJourney } from '../../../journey/JourneyContext.jsx';
import { DarklabsMark } from '../../../components/auth/LoginScreen.jsx';
import { EmptyState, goToTab } from '../../../components/journey/JourneyBits.jsx';
import DarklabMenuIcon from './DarklabMenuIcons.jsx';
import { TIPOS, montarDiario } from './diarioData.js';

const dataBr = (iso) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '—');
const diaMes = (iso) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const hora = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const norm = (t) =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** DarkLabs › Diário de bordo › Todas as publicações: linha do tempo de tudo o que foi registrado no projeto. */
export default function DarklabDiarioView({ onSelect }) {
  const { catalog, project, openArtifact } = useJourney();
  const [tipo, setTipo] = useState('todos');
  const [motor, setMotor] = useState('todos');
  const [busca, setBusca] = useState('');
  const [recentes, setRecentes] = useState(false);
  const [abertas, setAbertas] = useState([]);

  const d = useMemo(() => (project ? montarDiario({ project, catalog }) : null), [project, catalog]);

  if (!project || !d) {
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
          O diário de bordo registra, por data, tudo o que acontece no projeto.
        </EmptyState>
      </div>
    );
  }

  const contagem = Object.fromEntries(Object.keys(TIPOS).map((k) => [k, d.publicacoes.filter((p) => p.tipo === k).length]));
  const termo = norm(busca.trim());
  let lista = d.publicacoes.filter(
    (p) =>
      (tipo === 'todos' || p.tipo === tipo) &&
      (motor === 'todos' || p.motores.includes(Number(motor))) &&
      (!termo || norm(`${p.titulo} ${p.descricao} ${p.itens.map((i) => `${i.titulo} ${i.resumo}`).join(' ')}`).includes(termo)),
  );
  if (recentes) lista = [...lista].reverse();
  const alternar = (id) => setAbertas((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  return (
    <div className="jg-page db">
      <section className="mj-hero is-collapsed db-hero" aria-labelledby="db-title">
        <span className="mj-hero__mark" aria-hidden="true">
          <DarklabsMark tone="light" />
        </span>
        <div className="mj-hero__heading">
          <p className="mj-eyebrow">Diário de bordo operacional</p>
          <h2 id="db-title" className="mj-title">
            Da preparação à posição de {dataBr(d.indicadores.posicao)}.
          </h2>
          <p className="pr-hero__lead">
            Registros, aprendizados, hipóteses, decisões e pendências preservados por data. Classificações de etapa e motor são apresentadas como
            proposta de rastreabilidade quando não constam explicitamente na fonte.
          </p>
        </div>
        <ul className="mj-stats" aria-label="Resumo do diário">
          <li className="mj-stat mj-stat--strong">{d.publicacoes.length} publicações</li>
          <li className="mj-stat">
            {project.code} · {project.name}
          </li>
        </ul>
      </section>

      <div className="db-kpis">
        <article className="ar-card db-kpi">
          <p className="ar-eyebrow">Fontes do Contexto</p>
          <strong className="tabular">
            {d.indicadores.fontes} documento{d.indicadores.fontes === 1 ? '' : 's'}
          </strong>
          <span>{d.indicadores.ultimaFonte ? `Última entrada em ${dataBr(d.indicadores.ultimaFonte)}.` : 'Nenhuma fonte enviada ainda.'}</span>
        </article>
        <article className="ar-card db-kpi">
          <p className="ar-eyebrow">Resultados publicados</p>
          <strong className="tabular">
            {d.indicadores.revisoes} revis{d.indicadores.revisoes === 1 ? 'ão' : 'ões'} · {d.indicadores.aceitas} aceita
            {d.indicadores.aceitas === 1 ? '' : 's'}
          </strong>
          <span>Contexto, motores do DarkLabs e ficha do projeto.</span>
        </article>
        <article className="ar-card db-kpi">
          <p className="ar-eyebrow">Posição documental</p>
          <strong className="tabular">{dataBr(d.indicadores.posicao)}</strong>
          <span>Itens sem aceite posterior permanecem sem comprovação de fechamento.</span>
        </article>
      </div>

      <section className="db-moves" aria-labelledby="db-moves-title">
        <p className="ar-eyebrow ar-eyebrow--accent">Seis movimentos</p>
        <h3 id="db-moves-title" className="db-h3">
          Como o conhecimento mudou a direção do Discovery.
        </h3>
        <ol className="db-moves__grid">
          {d.movimentos.map((m) => (
            <li key={m.n} className={`db-move ${m.total ? 'has-pubs' : ''}`}>
              <span className="db-move__n tabular">{m.n}</span>
              <strong>{m.titulo}</strong>
              <span className="db-move__text">{m.texto}</span>
              <em className="tabular">
                {m.total ? `${m.total} publicaç${m.total === 1 ? 'ão' : 'ões'} · última em ${dataBr(m.ultima)}` : 'Sem publicações ainda'}
              </em>
            </li>
          ))}
        </ol>
      </section>

      <section className="db-path" aria-label="Caminho do projeto">
        <h3 className="db-path__title">Da oportunidade ampla a um pacote de decisão rastreável.</h3>
        <p>
          O discovery organiza governança e linha de base, incorpora evidências de negócio e experiência, refina a arquitetura e passa a exigir
          separação entre o que foi produzido e o que foi aceito — até preparar a decisão executiva.
        </p>
        <ol className="db-path__chips">
          {d.caminho.map((c, i) => (
            <li key={`${c}-${i}`}>
              {i ? '→ ' : ''}
              {c}
            </li>
          ))}
          <li className="is-next">→ Decision pack</li>
        </ol>
      </section>

      <section className="db-feed" aria-labelledby="db-feed-title">
        <div className="db-feed__head">
          <h3 id="db-feed-title" className="db-h3 db-h3--sm">
            Todas as publicações <span className="tabular">{lista.length}</span>
          </h3>
          <div className="db-filters">
            <div className="db-chips" role="group" aria-label="Tipo de publicação">
              <button
                type="button"
                className={`db-chip ${tipo === 'todos' ? 'is-on' : ''}`}
                aria-pressed={tipo === 'todos'}
                onClick={() => setTipo('todos')}
              >
                Todas <span className="tabular">{d.publicacoes.length}</span>
              </button>
              {Object.entries(TIPOS).map(([k, t]) =>
                contagem[k] ? (
                  <button
                    key={k}
                    type="button"
                    className={`db-chip ${tipo === k ? 'is-on' : ''}`}
                    aria-pressed={tipo === k}
                    onClick={() => setTipo(k)}
                    style={{ '--tc': t.cor }}
                  >
                    <span className="db-chip__dot" aria-hidden="true" /> {t.rotulo} <span className="tabular">{contagem[k]}</span>
                  </button>
                ) : null,
              )}
            </div>
            <select className="db-select" value={motor} onChange={(e) => setMotor(e.target.value)} aria-label="Filtrar por motor">
              <option value="todos">Todos os motores</option>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>
                  Motor {n}
                </option>
              ))}
            </select>
            <input
              className="db-search"
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar no diário"
              aria-label="Buscar no diário"
            />
            <button type="button" className="btn btn--sm" onClick={() => setRecentes((v) => !v)} aria-pressed={recentes}>
              {recentes ? 'Mais recentes primeiro' : 'Mais antigas primeiro'}
            </button>
          </div>
        </div>

        {lista.length ? (
          <ol className="db-list">
            {lista.map((p) => {
              const aberta = abertas.includes(p.id);
              const t = TIPOS[p.tipo];
              return (
                <li key={p.id} className={`db-item ${aberta ? 'is-open' : ''}`} style={{ '--tc': t.cor }}>
                  <div className="db-item__head">
                    <span className="db-item__date">
                      <strong className="tabular">{diaMes(p.at)}</strong>
                      <em className="tabular">
                        {new Date(p.at).getFullYear()} · {hora(p.at)}
                      </em>
                    </span>
                    <div className="db-item__main">
                      <p className="db-item__type">{t.rotulo}</p>
                      <h4 className="db-item__title">{p.titulo}</h4>
                      <p className="db-item__desc">{p.descricao}</p>
                    </div>
                    <div className="db-item__tags">
                      {p.etapas.map((n) => (
                        <span key={`e${n}`} className="db-tag">
                          <span className="db-tag__dot" aria-hidden="true" /> Etapa {n}
                        </span>
                      ))}
                      {p.motores.map((n) => (
                        <span key={`m${n}`} className="db-tag db-tag--motor">
                          <span className="db-tag__dot" aria-hidden="true" /> Motor {n}
                        </span>
                      ))}
                    </div>
                    {p.itens.length ? (
                      <button
                        type="button"
                        className="pr-stage__toggle db-item__toggle"
                        onClick={() => alternar(p.id)}
                        aria-expanded={aberta}
                        aria-label={aberta ? 'Recolher detalhes' : 'Ver detalhes'}
                      >
                        <DarklabMenuIcon name="chevron" size={16} />
                      </button>
                    ) : (
                      <span className="db-item__toggle" aria-hidden="true" />
                    )}
                  </div>
                  {aberta ? (
                    <ul className="db-item__body">
                      {p.itens.map((it, k) => (
                        <li key={k}>
                          <div>
                            <strong>{it.titulo}</strong>
                            {it.resumo ? <span>{it.resumo}</span> : null}
                            {it.capId ? (
                              <em>
                                {it.situacao ? `Revisão: ${it.situacao}` : ''}
                                {it.lacunas ? ` · ${it.lacunas} lacuna${it.lacunas === 1 ? '' : 's'}` : ''}
                              </em>
                            ) : null}
                          </div>
                          {it.capId ? (
                            <button
                              type="button"
                              className="btn btn--sm"
                              onClick={() => openArtifact(it.capId, it.scopeKey ?? 'projeto', it.revisao ?? null)}
                            >
                              Abrir
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="ar-sub db-empty">Nenhuma publicação com esses filtros.</p>
        )}
        {d.publicacoes.length <= 2 ? (
          <p className="ar-sub">
            O diário cresce à medida que o projeto anda: fontes, notebooks, resultados dos motores e aceites aparecem aqui por data.{' '}
            <button type="button" className="ar-link" onClick={() => onSelect?.('jornada-7-motores')}>
              Ir para a Jornada dos 7 motores
            </button>
          </p>
        ) : null}
      </section>
    </div>
  );
}
