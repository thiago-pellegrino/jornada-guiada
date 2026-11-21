import { useMemo, useState } from 'react';
import { useJourney } from '../../../journey/JourneyContext.jsx';
import { EmptyState, goToTab } from '../../../components/journey/JourneyBits.jsx';
import DarklabMenuIcon from './DarklabMenuIcons.jsx';
import { SITUACAO_DA_ETAPA } from './roadmapData.js';
import { dataCurta, dataLonga, diaMesCurto, montarVisaoGeral } from './visaoGeralData.js';

/** Cor de cada situação da etapa (mesmas cores da linha do tempo dos 7 motores). */
const TOM_ETAPA = { concluida: 'aceito', fechamento: 'produzido', andamento: 'andamento', impedida: 'dependencia', nao: 'nao' };
/** Na linha do tempo da visão geral: verde = execução documentada, azul = em consolidação, cinza = planejado. */
const TOM_MOTOR = { aceito: 'doc', produzido: 'doc', andamento: 'cons', dependencia: 'plan', nao: 'plan' };
/** Texto embaixo do motor quando ainda não há resultado gravado (ou no exemplo ilustrativo). */
const SITUACAO_MOTOR = { aceito: 'execução aceita', produzido: 'aguardando aceite', andamento: 'em execução', dependencia: 'dependência aberta', nao: 'não iniciado' };
const LEGENDA_MOTOR = [
  ['doc', 'execução documentada'],
  ['cons', 'em consolidação'],
  ['plan', 'planejado'],
];

function Pilula({ situacao }) {
  return (
    <span className={`vg-pill vg-pill--${TOM_ETAPA[situacao]}`}>
      <span className="vg-pill__dot" aria-hidden="true" />
      {SITUACAO_DA_ETAPA[situacao]}
    </span>
  );
}

function Kpi({ icone, valor, rotulo }) {
  return (
    <article className="vg-kpi">
      <span className="vg-kpi__ico">
        <DarklabMenuIcon name={icone} size={20} />
      </span>
      <div>
        <strong className="tabular">{valor}</strong>
        <span>{rotulo}</span>
      </div>
    </article>
  );
}

/** Portal DarkLabs › Visão geral: acompanhamento do projeto selecionado. */
export default function DarklabVisaoGeralView({ onSelect }) {
  const { catalog, project, pending } = useJourney();
  const [escolhaExemplo, setEscolhaExemplo] = useState(null);
  const real = useMemo(() => (project ? montarVisaoGeral({ project, catalog, pending }) : null), [project, catalog, pending]);
  const exemplo = Boolean(real?.semExecucao) && escolhaExemplo === true;
  const v = useMemo(() => (exemplo && project ? montarVisaoGeral({ project, catalog, pending, exemplo: true }) : real), [exemplo, project, catalog, pending, real]);

  if (!project || !v) {
    return (
      <div className="jg-page">
        <EmptyState
          title="Nenhum projeto selecionado"
          action={
            <button type="button" className="btn btn--sm btn--primary" onClick={() => goToTab('contexto')}>
              Criar projeto no Contexto
            </button>
          }
        >
          A visão geral acompanha o projeto selecionado na Jornada Guiada: prazo, etapas, motores, entregáveis e documentos.
        </EmptyState>
      </div>
    );
  }

  const { prazo, indicadores: ind, foco } = v;
  const ir = (id) => onSelect?.(id);

  return (
    <div className="jg-page vg">
      <header className="vg-head">
        <div>
          <p className="vg-kicker">Seu projeto / acompanhamento</p>
          <h2 className="vg-title">{project.name}.</h2>
          <p className="vg-lead">
            {project.description
              ? project.description
              : `O DarkLabs aplicado a ${project.name} organiza contexto, motores e entregáveis numa proposta rastreável e pronta para decisão — sem confundir execução, produção e aceite.`}
          </p>
        </div>
        <span className="vg-position">
          {project.code} · {v.etapa} · Posição {dataCurta(v.posicao)}
        </span>
      </header>

      {v.semExecucao && !exemplo ? (
        <div className="ar-notice" role="status">
          <DarklabMenuIcon name="infinity" size={18} />
          <p>
            <strong>Nenhum motor foi executado neste projeto.</strong> As etapas e a linha do tempo ficam como não iniciadas até os motores terem
            resultado.
          </p>
          <button type="button" className="btn btn--sm" onClick={() => setEscolhaExemplo(true)}>
            Ver exemplo de preenchimento
          </button>
          <button type="button" className="btn btn--sm btn--primary" onClick={() => ir('jornada-7-motores')}>
            Ir para a Jornada dos 7 motores
          </button>
        </div>
      ) : null}
      {exemplo ? (
        <div className="ar-notice ar-notice--example" role="status">
          <DarklabMenuIcon name="pencil" size={18} />
          <p>
            <strong>Exemplo ilustrativo.</strong> Etapas e motores mostram como a visão geral fica com o projeto em andamento; não são dados do
            projeto.
          </p>
          <button type="button" className="btn btn--sm" onClick={() => setEscolhaExemplo(false)}>
            Ver dados do projeto
          </button>
        </div>
      ) : null}

      <section className="vg-card vg-deadline" aria-labelledby="vg-prazo">
        <div className="vg-deadline__main">
          <span className="vg-deadline__mark" aria-hidden="true">
            <DarklabMenuIcon name="infinity" size={30} />
          </span>
          <div>
            <p className="vg-eyebrow">Prazo real do projeto</p>
            <h3 id="vg-prazo" className="vg-deadline__title">
              {prazo.antes ? (
                <>
                  O ciclo começa em <em>{dataCurta(prazo.inicio)}</em>.
                </>
              ) : prazo.encerrado ? (
                <>
                  Ciclo encerrado em <em>{dataCurta(prazo.fim)}</em>.
                </>
              ) : (
                <>
                  Estamos no <em>dia útil {prazo.atual}</em> de {prazo.total} do projeto.
                </>
              )}
            </h3>
            <p className="vg-muted">
              Início da contagem: {dataCurta(prazo.inicio)} · Entrega final: {dataCurta(prazo.fim)}.
            </p>
            <p className="vg-note">
              Base: segunda a sexta, sem feriados. As datas vêm das janelas do ciclo; o início pode ser ajustado em Aprendizados e roadmap.
            </p>
          </div>
        </div>
        <div className="vg-deadline__side">
          <p className="vg-eyebrow vg-right">Data limite da entrega</p>
          <strong className="vg-deadline__date">{dataLonga(prazo.fim)}</strong>
          <span className="vg-countdown">
            {prazo.encerrado ? 'Prazo do ciclo encerrado' : `Faltam ${prazo.faltam} dias úteis para encerramento`}
          </span>
          <div className="vg-progress">
            <div className="vg-progress__label">
              <span>Progresso em dias úteis</span>
              <strong className="tabular">{prazo.pct}%</strong>
            </div>
            <span className="vg-progress__bar" role="progressbar" aria-valuenow={prazo.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso em dias úteis">
              <i style={{ width: `${prazo.pct}%` }} />
            </span>
          </div>
        </div>
      </section>

      <section className="vg-card vg-protocol" aria-labelledby="vg-protocolo">
        <div className="vg-section-head">
          <div>
            <p className="vg-kicker">Protocolo {project.name}</p>
            <h3 id="vg-protocolo" className="vg-h3">
              Nossa jornada de transformação em 5 etapas.
            </h3>
            <p className="vg-muted">
              O protocolo do projeto organiza objetivos, atividades, entregáveis e decisões. Os sete motores DarkLabs permanecem como capacidades
              transversais e rastreáveis.
            </p>
          </div>
          <span className="vg-badge-dark">5 etapas do projeto ≠ 7 motores DarkLabs</span>
        </div>
        <ol className="vg-stages">
          {v.etapas.map((e) => (
            <li key={e.n}>
              <button type="button" className={`vg-stage vg-stage--n${e.n}`} onClick={() => ir('protocolo-5-etapas')}>
                <span className="vg-stage__n tabular">{e.n}</span>
                <strong>{e.titulo}</strong>
                <Pilula situacao={e.situacao} />
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="vg-banner" aria-labelledby="vg-baseline">
        <span className="vg-banner__ico" aria-hidden="true">
          <DarklabMenuIcon name="file" size={22} />
        </span>
        <div>
          <h3 id="vg-baseline">Baseline de escopo do projeto</h3>
          <p>
            {v.entregaveis} entregáveis previstos pelos 7 motores, com rastreabilidade entre conteúdo, etapa, evidências, responsabilidade e aceite.
            <button type="button" className="vg-link-red" onClick={() => ir('rastreabilidade')}>
              Abrir rastreabilidade →
            </button>
          </p>
        </div>
      </section>

      <section className="vg-card vg-motors" aria-labelledby="vg-motores">
        <div className="vg-section-head">
          <div>
            <h3 id="vg-motores" className="vg-h3">
              Linha do tempo dos sete motores
            </h3>
            <p className="vg-muted">Execução documentada não equivale a motor formalmente aprovado.</p>
          </div>
          <ul className="vg-legend" aria-label="Legenda">
            {LEGENDA_MOTOR.map(([k, l]) => (
              <li key={k}>
                <span className={`vg-dot vg-dot--${k}`} aria-hidden="true" /> {l}
              </li>
            ))}
          </ul>
        </div>
        <ol className="vg-track">
          {v.motores.map((m, i) => {
            const tom = TOM_MOTOR[m.situacao];
            const prox = v.motores[i + 1];
            return (
              <li key={m.numero} className={`vg-motor vg-motor--${tom}`}>
                {prox ? <span className={`vg-motor__link ${tom === 'doc' && TOM_MOTOR[prox.situacao] === 'doc' ? 'is-on' : ''}`} aria-hidden="true" /> : null}
                <button type="button" className="vg-motor__node" onClick={() => ir('jornada-7-motores')} aria-label={`Motor ${m.numero}: ${m.verbo}`}>
                  <span className="tabular">{m.numero}</span>
                  {tom === 'doc' ? (
                    <span className="vg-motor__badge" aria-hidden="true">
                      <DarklabMenuIcon name="check" size={12} />
                    </span>
                  ) : null}
                </button>
                <strong className="vg-motor__verb">{m.verbo}</strong>
                <span className={`mj-chip mj-chip--light mj-chip--${m.faixa}`}>
                  <span className="mj-chip__dot" aria-hidden="true" /> {m.faixa === 'up' ? 'Upstream · AS IS' : 'Downstream · TO BE'}
                </span>
                <span className="vg-motor__when">
                  {m.revisao ? `R${m.revisao} · ${diaMesCurto(m.data)}` : SITUACAO_MOTOR[m.situacao]}
                </span>
              </li>
            );
          })}
        </ol>
        <div className="vg-lanes">
          <div className="vg-lane vg-lane--up">
            <strong>Upstream · AS IS</strong>
            <span>Motores 1–2 respondem “Qual é o problema?”</span>
          </div>
          <div className="vg-lane vg-lane--core">
            <strong>DarkLabs</strong>
            <span>orquestra o ecossistema</span>
          </div>
          <div className="vg-lane vg-lane--down">
            <strong>Downstream · TO BE</strong>
            <span>Motores 3–7 respondem “Qual é a solução?”</span>
          </div>
        </div>
        <p className="vg-loop">
          <DarklabMenuIcon name="refresh" size={13} /> Aprendizado contínuo conecta pessoas, dados, IA e parcerias e retroalimenta o ciclo.
        </p>
        <div className="vg-acting">
          <span className="vg-acting__ico" aria-hidden="true">
            <DarklabMenuIcon name="target" size={20} />
          </span>
          <div>
            <strong>Em atuação: {v.emAtuacao.titulo}.</strong>
            {v.emAtuacao.itens.length ? <span>{v.emAtuacao.itens.join(', ')}.</span> : null}
          </div>
          <button type="button" className="btn btn--sm" onClick={() => ir('jornada-7-motores')}>
            Ver jornada →
          </button>
        </div>
      </section>

      <div className="vg-kpis">
        <Kpi icone="file" valor={ind.referencias} rotulo="referências documentais" />
        <Kpi icone="sliders" valor={ind.publicacoes} rotulo="registros no diário de bordo" />
        <Kpi icone="search" valor={ind.lacunas} rotulo={`lacunas em aberto${ind.lacunasAltas ? ` · ${ind.lacunasAltas} de alto impacto` : ''}`} />
        <Kpi icone="infinity" valor={`${ind.comResultado}/7`} rotulo="motores com resultado" />
      </div>

      <div className="vg-two">
        <section className="vg-card" aria-labelledby="vg-foco">
          <div className="vg-card__head">
            <h3 id="vg-foco" className="vg-h3">
              Em foco agora
            </h3>
            <button type="button" className="btn btn--sm" onClick={() => ir('aprendizados-roadmap')}>
              Ver roadmap →
            </button>
          </div>
          <div className="vg-focus">
            <Pilula situacao={foco.situacao} />
            <h4 className="vg-focus__title">
              {foco.janela ? `${foco.janela.titulo}: ` : ''}
              {foco.etapa ? `avançar a etapa ${foco.etapa.n} · ${foco.etapa.titulo}` : 'acompanhar o ciclo'}.
            </h4>
            <p className="vg-muted">
              {foco.janela ? `Janela ${foco.janela.id} · ${foco.data}. ` : ''}
              Esta sequência concentra as dependências dos próximos gates e preserva a diferença entre material produzido e aceite formal.
            </p>
            {foco.itens.length ? (
              <ol className="vg-steps">
                {foco.itens.map((it, i) => (
                  <li key={`${it.titulo}-${i}`}>
                    <span className="vg-steps__n tabular">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <strong>{it.titulo}</strong>
                      <span>{it.detalhe}</span>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="vg-muted">Nada em aberto nesta janela.</p>
            )}
            {foco.perguntas.length ? <p className="vg-note">Lacuna de alto impacto: {foco.perguntas[0]}</p> : null}
          </div>
        </section>

        <section className="vg-card" aria-labelledby="vg-docs">
          <div className="vg-card__head">
            <h3 id="vg-docs" className="vg-h3">
              Últimos documentos da posição
            </h3>
            <button type="button" className="btn btn--sm" onClick={() => ir('publicacoes')}>
              Ver todos →
            </button>
          </div>
          {v.documentos.length ? (
            <ul className="vg-docs">
              {v.documentos.map((d) => (
                <li key={d.id}>
                  <button type="button" className="vg-doc" onClick={() => goToTab('contexto')}>
                    <span className="vg-doc__ico" aria-hidden="true">
                      <DarklabMenuIcon name="file" size={18} />
                    </span>
                    <span className="vg-doc__text">
                      <strong>
                        {d.nome} · {diaMesCurto(d.data)}
                      </strong>
                      <span>
                        {d.id} · {d.situacao ?? 'enviada'} · abrir no Contexto
                      </span>
                    </span>
                    <span className="vg-doc__go" aria-hidden="true">
                      ↗
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="vg-muted">Nenhuma fonte enviada ao Contexto ainda.</p>
          )}
          {v.totalDocumentos > v.documentos.length ? <p className="vg-note">+ {v.totalDocumentos - v.documentos.length} documento(s) no Contexto.</p> : null}
        </section>
      </div>

      <section className="vg-closing" aria-labelledby="vg-alem">
        <span className="vg-closing__ico" aria-hidden="true">
          <DarklabMenuIcon name="rocket" size={22} />
        </span>
        <div>
          <p className="vg-closing__kicker">Encerramento do projeto</p>
          <h3 id="vg-alem">Vamos além?</h3>
          <p>Conheça o DarkLabs Impulso como proposta de continuidade e a prateleira modular Capgemini.</p>
        </div>
        <button type="button" className="btn vg-closing__btn" onClick={() => ir('vamos-alem')}>
          Ver proposta →
        </button>
      </section>
    </div>
  );
}

