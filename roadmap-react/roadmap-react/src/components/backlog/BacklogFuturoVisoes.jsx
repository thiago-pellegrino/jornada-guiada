import { Fragment, useMemo, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import {
  FILTROS_VAZIOS,
  MATURIDADES,
  ORIGENS,
  TIPOS,
  catalogoDeFeatures,
  cruzamentoEpicoSuperficie,
  distribuicao,
  filtrarFeatures,
  filtrarHistorias,
  indicadores,
  matrizDeEpicos,
  porSuperficie,
} from '../../domain/backlog/backlogFuturo.js';

const POR_PAGINA = 25;
const fmtPct = (v) => `${(v * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const fmtN = (v) => v.toLocaleString('pt-BR');

function rotuloTipo(t) {
  return TIPOS[t]?.label ?? t;
}
function rotuloOrigem(o) {
  return ORIGENS[o]?.label ?? o;
}
function rotuloMaturidade(m) {
  return MATURIDADES[m] ?? m;
}

export function Onda({ id, modelo }) {
  const onda = modelo.ondas.find((o) => o.id === id);
  return (
    <span className={`bf-onda bf-onda--${String(id).toLowerCase()}`} title={onda ? `${onda.nome} · ${onda.descricao}` : undefined}>
      {id}
    </span>
  );
}

function Tipo({ tipo }) {
  return <span className={`bf-tag bf-tag--${tipo === 'HIPÓTESE' ? 'hipotese' : String(tipo).toLowerCase().replace('ó', 'o')}`}>{rotuloTipo(tipo)}</span>;
}

function Origem({ origem }) {
  return <span className={`bf-tag ${origem === 'BASE_ATUAL' ? 'bf-tag--base' : 'bf-tag--nova'}`}>{ORIGENS[origem]?.curto ?? origem}</span>;
}

function Flag({ ligado, rotulo }) {
  return (
    <span className={`bf-flag ${ligado ? 'is-on' : ''}`} title={`${rotulo}: ${ligado ? 'TRUE' : 'FALSE'}`}>
      {ligado ? <Icon name="check" size={12} /> : null}
      {rotulo}
    </span>
  );
}

function Barra({ valor, max = 1 }) {
  return (
    <span className="bf-bar" aria-hidden="true">
      <span style={{ width: `${max ? Math.max(2, (valor / max) * 100) : 0}%` }} />
    </span>
  );
}

function Paginacao({ pagina, total, onChange }) {
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  if (paginas <= 1) return null;
  return (
    <nav className="bf-pages" aria-label="Paginação">
      <button type="button" className="btn btn--sm" disabled={pagina <= 1} onClick={() => onChange(pagina - 1)}>
        Anterior
      </button>
      <span className="tabular">
        Página {pagina} de {paginas}
      </span>
      <button type="button" className="btn btn--sm" disabled={pagina >= paginas} onClick={() => onChange(pagina + 1)}>
        Próxima
      </button>
    </nav>
  );
}

function Seletor({ rotulo, valor, onChange, opcoes }) {
  return (
    <label className="bf-select">
      <span>{rotulo}</span>
      <select className="input input--sm" value={valor} onChange={(e) => onChange(e.target.value)}>
        <option value="">Todos</option>
        {opcoes.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function Busca({ valor, onChange, placeholder }) {
  return (
    <label className="bf-search">
      <Icon name="search" size={15} />
      <input type="search" value={valor} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </label>
  );
}

// ───────────────────────────── Resumo ─────────────────────────────

function Distribuicao({ titulo, itens, rotulo, total }) {
  const max = Math.max(1, ...itens.map((i) => i.quantidade));
  return (
    <div className="bf-dist">
      <h4 className="bf-dist__title">{titulo}</h4>
      <ul>
        {itens.map((i) => (
          <li key={i.valor}>
            <span className="bf-dist__label">{rotulo(i.valor)}</span>
            <Barra valor={i.quantidade} max={max} />
            <span className="bf-dist__n tabular">
              {fmtN(i.quantidade)} <em>{fmtPct(i.quantidade / total)}</em>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function VisaoResumo({ modelo, onAbrir }) {
  const k = indicadores(modelo);
  const linhas = porSuperficie(modelo);
  const maxH = Math.max(1, ...linhas.map((l) => l.historias));
  const nomeOnda = (id) => `${id} · ${modelo.ondas.find((o) => o.id === id)?.nome ?? ''}`;
  const kpis = [
    ['Histórias', k.historias, 'historias'],
    ['Features', k.features, 'features'],
    ['Épicos', k.epicos, 'epicos'],
    ['Base preservada', k.base, null, fmtPct(k.historias ? k.base / k.historias : 0)],
    ['Novas propostas', k.novas, null, fmtPct(k.historias ? k.novas / k.historias : 0)],
    ['Itens READY', k.ready, null, `${fmtN(k.authorized)} autorizados`],
  ];
  return (
    <div className="bf-stack">
      <div className="bf-kpis">
        {kpis.map(([rotulo, valor, destino, nota]) => (
          <div key={rotulo} className="bf-kpi">
            <span className="bf-kpi__label">{rotulo}</span>
            <strong className="tabular">{fmtN(valor)}</strong>
            {nota ? <span className="bf-kpi__note">{nota}</span> : null}
            {destino ? (
              <button type="button" className="bf-kpi__link" onClick={() => onAbrir(destino)}>
                Ver {rotulo.toLowerCase()} <Icon name="chevronRight" size={12} />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="bf-two">
        <section className="bf-card" aria-labelledby="bf-sup-t">
          <h3 id="bf-sup-t" className="bf-card__title">
            Por superfície
          </h3>
          <p className="bf-card__sub">Superfícies de experiência e operação (as abas da planilha), não novos épicos.</p>
          <div className="bf-table-wrap">
            <table className="jg-table bf-table">
              <thead>
                <tr>
                  <th>Superfície</th>
                  <th className="num">Features</th>
                  <th className="num">Histórias</th>
                  <th className="num">Base</th>
                  <th className="num">Novas</th>
                  <th>% das histórias</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <button type="button" className="bf-linkcell" onClick={() => onAbrir('historias', { aba: l.id })}>
                        {l.id}
                      </button>
                    </td>
                    <td className="num tabular">{l.features}</td>
                    <td className="num tabular">{l.historias}</td>
                    <td className="num tabular">{l.base}</td>
                    <td className="num tabular">{l.novas}</td>
                    <td>
                      <span className="bf-pctcell">
                        <Barra valor={l.historias} max={maxH} />
                        <span className="tabular">{fmtPct(l.pct)}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th>Total</th>
                  <th className="num tabular">{k.features}</th>
                  <th className="num tabular">{k.historias}</th>
                  <th className="num tabular">{k.base}</th>
                  <th className="num tabular">{k.novas}</th>
                  <th className="tabular">{k.historias ? '100,0%' : '—'}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className="bf-card" aria-labelledby="bf-dist-t">
          <h3 id="bf-dist-t" className="bf-card__title">
            Composição das histórias
          </h3>
          <p className="bf-card__sub">Tipo, onda, maturidade e {modelo.rotuloHorizonte.toLowerCase()} de cada história.</p>
          <div className="bf-dists">
            <Distribuicao titulo="Tipo" itens={distribuicao(modelo, 'tipo')} rotulo={rotuloTipo} total={k.historias} />
            <Distribuicao titulo="Onda" itens={distribuicao(modelo, 'wave').sort((a, b) => a.valor.localeCompare(b.valor))} rotulo={nomeOnda} total={k.historias} />
            <Distribuicao titulo="Maturidade" itens={distribuicao(modelo, 'maturidade')} rotulo={rotuloMaturidade} total={k.historias} />
            <Distribuicao titulo={modelo.rotuloHorizonte} itens={distribuicao(modelo, 'horizonte').sort((a, b) => a.valor.localeCompare(b.valor))} rotulo={(v) => v} total={k.historias} />
          </div>
        </section>
      </div>

      {modelo.regraDeLeitura ? (
        <p className="bf-rule">
          <Icon name="info" size={14} /> <span>{modelo.regraDeLeitura}</span>
        </p>
      ) : null}
    </div>
  );
}

// ───────────────────────────── Roadmap ─────────────────────────────

export function VisaoRoadmap({ modelo }) {
  const r = modelo.roadmap;
  if (!r) return <p className="bf-empty">O roadmap aparece quando houver épicos gerados.</p>;
  // Cabeçalho agrupado por semestre/horizonte: colunas consecutivas com o mesmo grupo viram uma célula.
  const grupos = [];
  r.colunas.forEach((c) => {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.grupo === c.grupo) ultimo.span += 1;
    else grupos.push({ grupo: c.grupo, span: 1 });
  });
  return (
    <div className="bf-stack">
      {r.principio ? (
        <p className="bf-principle">
          <Icon name="compass" size={16} /> <span>{r.principio}</span>
        </p>
      ) : null}
      {r.totais?.length ? (
        <div className="bf-chips">
          {r.totais.map((t) => (
            <span key={t} className="bf-chip">
              {t}
            </span>
          ))}
        </div>
      ) : null}

      <section className="bf-card" aria-labelledby="bf-rm-t">
        <h3 id="bf-rm-t" className="bf-card__title">
          {r.titulo}
        </h3>
        <div className="bf-table-wrap bf-table-wrap--x">
          <table className="jg-table bf-table bf-roadmap">
            <thead>
              <tr>
                <th colSpan={4} />
                {grupos.map((g, i) => (
                  <th key={`${g.grupo}-${i}`} colSpan={g.span} className="bf-roadmap__group">
                    {g.grupo}
                  </th>
                ))}
              </tr>
              <tr>
                <th>Tribo</th>
                <th>Squad</th>
                <th>Produto principal</th>
                <th>Foco principal</th>
                {r.colunas.map((c) => (
                  <th key={c.id} className="bf-roadmap__period">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.linhas.map((l) => (
                <tr key={`${l.tribo}-${l.squad}`}>
                  <td className="bf-roadmap__tribe">{l.tribo}</td>
                  <td className="bf-roadmap__squad">
                    <strong>{l.squad}</strong>
                    {l.inicio ? <span className="tabular">Início {l.inicio}</span> : null}
                  </td>
                  <td className="bf-roadmap__text">{l.produto}</td>
                  <td className="bf-roadmap__text">{l.foco}</td>
                  {l.celulas.map((cel, i) => (
                    <td key={r.colunas[i].id} className={`bf-roadmap__cell ${cel ? '' : 'is-empty'}`}>
                      {cel || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {r.anos.map((ano) => (
        <section key={ano.titulo} className="bf-card" aria-label={ano.titulo}>
          <h3 className="bf-card__title">{ano.titulo}</h3>
          <div className="bf-table-wrap">
            <table className="jg-table bf-table bf-quarters">
              <thead>
                <tr>
                  <th>Período</th>
                  <th>Objetivo principal</th>
                  <th>Entregas de valor</th>
                  <th>Squads mais ativas</th>
                  {ano.trimestres.some((t) => t.retorno) ? <th>Retorno esperado</th> : null}
                </tr>
              </thead>
              <tbody>
                {ano.trimestres.map((t) => (
                  <tr key={t.periodo}>
                    <td className="bf-quarters__period">{t.periodo}</td>
                    <td>{t.objetivo}</td>
                    <td className="bf-muted">{t.entregas}</td>
                    <td>{t.squads}</td>
                    {ano.trimestres.some((x) => x.retorno) ? <td className="bf-muted">{t.retorno}</td> : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {r.semestres?.length || r.leituras?.length ? (
        <div className="bf-two">
          {r.semestres?.length ? (
            <section className="bf-card" aria-label="Objetivo executivo por semestre">
              <h3 className="bf-card__title">Objetivo executivo por semestre</h3>
              <ol className="bf-semesters">
                {r.semestres.map((s) => (
                  <li key={s.periodo}>
                    <strong>{s.periodo}</strong>
                    <span>{s.objetivo}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
          {r.leituras?.length ? (
            <section className="bf-card" aria-label="Leitura executiva">
              <h3 className="bf-card__title">Leitura executiva</h3>
              {r.leituras.map((t) => (
                <p key={t.slice(0, 40)} className="bf-reading">
                  {t}
                </p>
              ))}
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ───────────────────────────── Épicos (MATRIZ EPC) ─────────────────────────────

export function VisaoEpicos({ modelo, onAbrir }) {
  const linhas = matrizDeEpicos(modelo);
  const cruz = cruzamentoEpicoSuperficie(modelo);
  const maxTotal = Math.max(1, ...linhas.map((l) => l.total));
  const ondas = modelo.ondas.filter((o) => linhas.some((l) => l.wave === o.id));
  return (
    <div className="bf-stack">
      {ondas.map((o) => {
        const doGrupo = linhas.filter((l) => l.wave === o.id);
        return (
          <section key={o.id} className="bf-card" aria-labelledby={`bf-w-${o.id}`}>
            <header className="bf-wavehead">
              <Onda id={o.id} modelo={modelo} />
              <div>
                <h3 id={`bf-w-${o.id}`} className="bf-card__title">
                  {o.nome}
                </h3>
                <p className="bf-card__sub">{o.descricao}</p>
              </div>
              <span className="bf-wavehead__n tabular">
                {doGrupo.length} épico{doGrupo.length === 1 ? '' : 's'} · {fmtN(doGrupo.reduce((s, l) => s + l.total, 0))} histórias
              </span>
            </header>
            <div className="bf-table-wrap">
              <table className="jg-table bf-table">
                <thead>
                  <tr>
                    <th>EPC_ID</th>
                    <th>Épico</th>
                    <th className="num">Features</th>
                    <th className="num">Base</th>
                    <th className="num">Novas</th>
                    <th>Total de histórias</th>
                    <th className="num">READY</th>
                    <th>Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {doGrupo.map((l) => (
                    <tr key={l.id}>
                      <td className="jg-mono">{l.id}</td>
                      <td>
                        <strong className="bf-strong">{l.nome}</strong>
                        <span className="bf-rowlinks">
                          <button type="button" className="bf-linkcell" onClick={() => onAbrir('features', { epcId: l.id })}>
                            Features
                          </button>
                          <button type="button" className="bf-linkcell" onClick={() => onAbrir('historias', { epcId: l.id })}>
                            Histórias
                          </button>
                        </span>
                      </td>
                      <td className="num tabular">{l.features}</td>
                      <td className="num tabular">{l.base}</td>
                      <td className="num tabular">{l.novas}</td>
                      <td>
                        <span className="bf-pctcell">
                          <Barra valor={l.total} max={maxTotal} />
                          <span className="tabular">{l.total}</span>
                        </span>
                      </td>
                      <td className="num tabular">{l.ready}</td>
                      <td className="bf-muted bf-obs">{l.observacao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <section className="bf-card" aria-labelledby="bf-cross-t">
        <h3 id="bf-cross-t" className="bf-card__title">
          Correlação épico × superfície
        </h3>
        <p className="bf-card__sub">Quantidade de histórias de cada épico em cada superfície. Clique numa célula para ver as histórias.</p>
        <div className="bf-table-wrap bf-table-wrap--x">
          <table className="bf-heat">
            <thead>
              <tr>
                <th>Épico</th>
                {modelo.superficies.map((s) => (
                  <th key={s.id} title={s.id}>
                    {s.nome}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.id}>
                  <th>
                    <span className="jg-mono">{l.id}</span> <span className="bf-heat__name">{l.nome}</span>
                  </th>
                  {modelo.superficies.map((s) => {
                    const v = cruz.valor(l.id, s.id);
                    return (
                      <td key={s.id}>
                        {v ? (
                          <button
                            type="button"
                            className="bf-heat__cell tabular"
                            style={{ '--a': `${Math.round(12 + (v / cruz.max) * 70)}%` }}
                            onClick={() => onAbrir('historias', { epcId: l.id, aba: s.id })}
                            aria-label={`${v} histórias de ${l.id} em ${s.nome}`}
                          >
                            {v}
                          </button>
                        ) : (
                          <span className="bf-heat__zero">·</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ───────────────────────────── Features (CATÁLOGO) ─────────────────────────────

export function VisaoFeatures({ modelo, filtros, onFiltros, onAbrir }) {
  const [pagina, setPagina] = useState(1);
  const [aberta, setAberta] = useState(null);
  const catalogo = useMemo(() => catalogoDeFeatures(modelo), [modelo]);
  const lista = useMemo(() => filtrarFeatures(catalogo, filtros), [catalogo, filtros]);
  const atual = Math.min(pagina, Math.max(1, Math.ceil(lista.length / POR_PAGINA)));
  const visiveis = lista.slice((atual - 1) * POR_PAGINA, atual * POR_PAGINA);
  const mudar = (parcial) => {
    setPagina(1);
    onFiltros({ ...filtros, ...parcial });
  };
  const algumFiltro = filtros.busca || filtros.aba || filtros.epcId;
  return (
    <div className="bf-stack">
      <div className="bf-toolbar">
        <Busca valor={filtros.busca} onChange={(v) => mudar({ busca: v })} placeholder="Buscar feature por ID, nome ou objetivo" />
        <Seletor rotulo="Superfície" valor={filtros.aba} onChange={(v) => mudar({ aba: v })} opcoes={modelo.superficies.map((s) => [s.id, s.id])} />
        <Seletor rotulo="Épico" valor={filtros.epcId} onChange={(v) => mudar({ epcId: v })} opcoes={modelo.epicos.map((e) => [e.id, `${e.id} · ${e.nome}`])} />
        {algumFiltro ? (
          <button type="button" className="btn btn--sm" onClick={() => mudar({ busca: '', aba: '', epcId: '' })}>
            Limpar filtros
          </button>
        ) : null}
      </div>
      <p className="bf-count tabular">
        {fmtN(lista.length)} de {fmtN(catalogo.length)} features
      </p>
      <div className="bf-table-wrap">
        <table className="jg-table bf-table bf-features">
          <thead>
            <tr>
              <th>FEATURE_ID</th>
              <th>Superfície</th>
              <th>Feature</th>
              <th>Épicos relacionados</th>
              <th className="num">Histórias</th>
              <th className="num">Base</th>
              <th className="num">Novas</th>
              <th>Governança</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((f) => (
              <Fragment key={f.id}>
                <tr className={aberta === f.id ? 'is-open' : ''}>
                  <td className="jg-mono">{f.id}</td>
                  <td className="bf-nowrap">{f.aba}</td>
                  <td>
                    <button type="button" className="bf-expand" aria-expanded={aberta === f.id} onClick={() => setAberta(aberta === f.id ? null : f.id)}>
                      <Icon name="chevronRight" size={13} className="bf-expand__icon" />
                      <strong className="bf-strong">{f.nome}</strong>
                    </button>
                  </td>
                  <td>
                    <span className="bf-epcs">
                      {f.epcs.map((e) => (
                        <span key={e} className="bf-epc" title={modelo.epicos.find((x) => x.id === e)?.nome}>
                          {e.replace('EPC-', '')}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="num tabular">{f.historias}</td>
                  <td className="num tabular">{f.base}</td>
                  <td className="num tabular">{f.novas}</td>
                  <td className="bf-nowrap">
                    <Flag ligado={f.historias > 0 && f.ready === f.historias} rotulo="Ready" /> <Flag ligado={f.historias > 0 && f.authorized === f.historias} rotulo="Auth" />
                  </td>
                </tr>
                {aberta === f.id ? (
                  <tr className="bf-detail">
                    <td colSpan={8}>
                      <dl className="bf-dl">
                        {f.objetivo ? (
                          <>
                            <dt>Objetivo</dt>
                            <dd>{f.objetivo}</dd>
                          </>
                        ) : null}
                        {f.descricao ? (
                          <>
                            <dt>Descrição</dt>
                            <dd>{f.descricao}</dd>
                          </>
                        ) : null}
                        {f.valor ? (
                          <>
                            <dt>Valor</dt>
                            <dd>{f.valor}</dd>
                          </>
                        ) : null}
                        <dt>Épicos</dt>
                        <dd>{f.epcs.map((e) => `${e} · ${modelo.epicos.find((x) => x.id === e)?.nome ?? ''}`).join('; ')}</dd>
                      </dl>
                      <button type="button" className="btn btn--sm btn--primary" onClick={() => onAbrir('historias', { featureId: f.id })}>
                        Ver as {f.historias} histórias <Icon name="chevronRight" size={13} />
                      </button>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
        {!lista.length ? <p className="bf-empty">Nenhuma feature com esses filtros.</p> : null}
      </div>
      <Paginacao pagina={atual} total={lista.length} onChange={setPagina} />
    </div>
  );
}

// ───────────────────────────── Histórias (ROADMAP MASTER) ─────────────────────────────

export function VisaoHistorias({ modelo, filtros, onFiltros }) {
  const [pagina, setPagina] = useState(1);
  const [aberta, setAberta] = useState(null);
  const lista = useMemo(() => filtrarHistorias(modelo.historias, filtros), [modelo, filtros]);
  const atual = Math.min(pagina, Math.max(1, Math.ceil(lista.length / POR_PAGINA)));
  const visiveis = lista.slice((atual - 1) * POR_PAGINA, atual * POR_PAGINA);
  const mudar = (parcial) => {
    setPagina(1);
    onFiltros({ ...filtros, ...parcial });
  };
  const valores = (campo) => [...new Set(modelo.historias.map((h) => h[campo]))].sort();
  const algumFiltro = Object.entries(filtros).some(([, v]) => v);
  const feature = filtros.featureId ? modelo.features.find((f) => f.id === filtros.featureId) : null;
  const epico = (id) => modelo.epicos.find((e) => e.id === id);
  return (
    <div className="bf-stack">
      <div className="bf-toolbar">
        <Busca valor={filtros.busca} onChange={(v) => mudar({ busca: v })} placeholder="Buscar por ID, ID legado, título ou descrição" />
        <Seletor rotulo="Superfície" valor={filtros.aba} onChange={(v) => mudar({ aba: v })} opcoes={modelo.superficies.map((s) => [s.id, s.id])} />
        <Seletor rotulo="Épico" valor={filtros.epcId} onChange={(v) => mudar({ epcId: v })} opcoes={modelo.epicos.map((e) => [e.id, `${e.id} · ${e.nome}`])} />
        <Seletor rotulo="Onda" valor={filtros.wave} onChange={(v) => mudar({ wave: v })} opcoes={modelo.ondas.map((o) => [o.id, `${o.id} · ${o.nome}`])} />
        <Seletor rotulo="Tipo" valor={filtros.tipo} onChange={(v) => mudar({ tipo: v })} opcoes={valores('tipo').map((t) => [t, rotuloTipo(t)])} />
        <Seletor rotulo="Origem" valor={filtros.origem} onChange={(v) => mudar({ origem: v })} opcoes={valores('origem').map((o) => [o, rotuloOrigem(o)])} />
        <Seletor rotulo="Maturidade" valor={filtros.maturidade} onChange={(v) => mudar({ maturidade: v })} opcoes={valores('maturidade').map((m) => [m, rotuloMaturidade(m)])} />
        <Seletor rotulo={modelo.rotuloHorizonte} valor={filtros.horizonte} onChange={(v) => mudar({ horizonte: v })} opcoes={valores('horizonte').map((h) => [h, h])} />
        <Seletor
          rotulo="READY"
          valor={filtros.ready}
          onChange={(v) => mudar({ ready: v })}
          opcoes={[
            ['sim', 'TRUE'],
            ['nao', 'FALSE'],
          ]}
        />
        {algumFiltro ? (
          <button type="button" className="btn btn--sm" onClick={() => mudar({ ...FILTROS_VAZIOS })}>
            Limpar filtros
          </button>
        ) : null}
      </div>
      {feature ? (
        <p className="bf-scope">
          Feature <span className="jg-mono">{feature.id}</span> · {feature.nome}
          <button type="button" className="bf-linkcell" onClick={() => mudar({ featureId: '' })}>
            Remover
          </button>
        </p>
      ) : null}
      <p className="bf-count tabular">
        {fmtN(lista.length)} de {fmtN(modelo.historias.length)} histórias
      </p>
      <div className="bf-table-wrap">
        <table className="jg-table bf-table bf-stories">
          <thead>
            <tr>
              <th>HISTORY_ID</th>
              <th>História</th>
              <th>Superfície</th>
              <th>Épico</th>
              <th>Tipo</th>
              <th>Origem</th>
              <th>Onda</th>
              <th>{modelo.rotuloHorizonte}</th>
              <th>Governança</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((h) => (
              <Fragment key={h.id}>
                <tr className={aberta === h.id ? 'is-open' : ''}>
                  <td className="jg-mono bf-nowrap">{h.id}</td>
                  <td>
                    <button type="button" className="bf-expand" aria-expanded={aberta === h.id} onClick={() => setAberta(aberta === h.id ? null : h.id)}>
                      <Icon name="chevronRight" size={13} className="bf-expand__icon" />
                      <span>
                        <strong className="bf-strong">{h.titulo}</strong>
                        <span className="bf-sub">{h.feature}</span>
                      </span>
                    </button>
                  </td>
                  <td className="bf-nowrap">{h.aba}</td>
                  <td>
                    <span className="bf-epc" title={epico(h.epcId)?.nome}>
                      {h.epcId.replace('EPC-', '')}
                    </span>
                  </td>
                  <td>
                    <Tipo tipo={h.tipo} />
                  </td>
                  <td>
                    <Origem origem={h.origem} />
                  </td>
                  <td>
                    <Onda id={h.wave} modelo={modelo} />
                  </td>
                  <td className="tabular">{h.horizonte}</td>
                  <td className="bf-nowrap">
                    <Flag ligado={h.ready} rotulo="Ready" /> <Flag ligado={h.authorized} rotulo="Auth" />
                  </td>
                </tr>
                {aberta === h.id ? (
                  <tr className="bf-detail">
                    <td colSpan={9}>
                      <dl className="bf-dl">
                        {h.objetivo ? (
                          <>
                            <dt>Objetivo</dt>
                            <dd>{h.objetivo}</dd>
                          </>
                        ) : null}
                        {h.descricao ? (
                          <>
                            <dt>Descrição</dt>
                            <dd>{h.descricao}</dd>
                          </>
                        ) : null}
                        {h.valor && h.valor !== h.objetivo ? (
                          <>
                            <dt>Valor de negócio</dt>
                            <dd>{h.valor}</dd>
                          </>
                        ) : null}
                        <dt>Épico canônico</dt>
                        <dd>
                          {h.epcId} · {epico(h.epcId)?.nome}
                        </dd>
                        <dt>Feature</dt>
                        <dd>
                          <span className="jg-mono">{h.featureId}</span> · {h.feature}
                        </dd>
                        <dt>Maturidade</dt>
                        <dd>{rotuloMaturidade(h.maturidade)}</dd>
                        {h.iniciativa ? (
                          <>
                            <dt>Iniciativa</dt>
                            <dd className="jg-mono">{h.iniciativa}</dd>
                          </>
                        ) : null}
                        {h.legacyId ? (
                          <>
                            <dt>ID legado</dt>
                            <dd className="jg-mono">{h.legacyId}</dd>
                          </>
                        ) : null}
                        <dt>Origem</dt>
                        <dd>{h.origemOriginal && h.origemOriginal !== h.origem ? `${rotuloOrigem(h.origem)} (${h.origemOriginal})` : rotuloOrigem(h.origem)}</dd>
                        {h.observacao ? (
                          <>
                            <dt>Observação</dt>
                            <dd>{h.observacao}</dd>
                          </>
                        ) : null}
                      </dl>
                      {h.tipo === 'HIPÓTESE' ? <p className="bf-note">Hipótese: oportunidade ainda não validada; não entra automaticamente no backlog executável.</p> : null}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
        {!lista.length ? <p className="bf-empty">Nenhuma história com esses filtros.</p> : null}
      </div>
      <Paginacao pagina={atual} total={lista.length} onChange={setPagina} />
    </div>
  );
}

// ───────────────────────────── Dicionário ─────────────────────────────

export function VisaoDicionario({ modelo }) {
  return (
    <div className="bf-stack">
      <section className="bf-card" aria-labelledby="bf-dic-t">
        <h3 id="bf-dic-t" className="bf-card__title">
          Dicionário e regras de leitura
        </h3>
        <p className="bf-card__sub">
          {modelo.modo === 'projeto'
            ? 'Como cada coluna da planilha é obtida do que a jornada gerou (Contexto → DarkLabs → ficha do projeto → Backlog do Futuro).'
            : 'Definições da hierarquia, identificadores, correlações e estados de governança da planilha.'}
        </p>
        <div className="bf-table-wrap">
          <table className="jg-table bf-table bf-dic">
            <thead>
              <tr>
                <th>Campo / conceito</th>
                <th>Valor</th>
                <th>Definição</th>
                <th>Regra</th>
              </tr>
            </thead>
            <tbody>
              {modelo.dicionario.map((d) => (
                <tr key={`${d.conceito}-${d.valor}`}>
                  <td>
                    <strong className="bf-strong">{d.conceito}</strong>
                  </td>
                  <td className="jg-mono">{d.valor}</td>
                  <td>{d.definicao}</td>
                  <td className="bf-muted">{d.regra}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
