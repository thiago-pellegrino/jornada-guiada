import { useMemo, useState } from 'react';
import { can } from '../../domain/journey/journeyEngine.js';
import { useJourney } from '../../journey/JourneyContext.jsx';
import { EmptyState, goToTab } from '../journey/JourneyBits.jsx';
import DarklabMenuIcon from './DarklabMenuIcons.jsx';
import { MOTOR_ICON, MOTOR_STATUS } from './MotorsJourney.jsx';
import { montarFuturo } from './futuroData.js';

const CONF_KEY = (id) => `jornada.darklab.futuro.${id}`;
const STATUS_CONDICAO = {
  ok: 'Atendida',
  pendente: 'Em andamento',
  falta: 'Não atendida',
  manual: 'Aguardando confirmação',
};
const HORIZONTE = { agora: 'Agora', próximo: 'Próximo', futuro: 'Futuro' };

function lerConfirmacoes(projectId) {
  try {
    return JSON.parse(window.localStorage.getItem(CONF_KEY(projectId)) ?? '{}') ?? {};
  } catch {
    return {};
  }
}

/** DarkLabs › Jornada do futuro: condições de partida, ciclo de evolução (M5–M7) e o que o M7 propõe para depois. */
export default function DarklabFuturoView({ onSelect }) {
  const { catalog, project, pending, role, openArtifact } = useJourney();
  const [confirmacoes, setConfirmacoes] = useState(() => (project ? lerConfirmacoes(project.projectId) : {}));
  const [projetoAtual, setProjetoAtual] = useState(project?.projectId ?? null);
  if (project && project.projectId !== projetoAtual) {
    setProjetoAtual(project.projectId);
    setConfirmacoes(lerConfirmacoes(project.projectId));
  }

  const f = useMemo(() => (project ? montarFuturo({ project, catalog, pending, confirmacoes }) : null), [project, catalog, pending, confirmacoes]);

  if (!project || !f) {
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
          A jornada do futuro parte das decisões validadas do projeto.
        </EmptyState>
      </div>
    );
  }

  const podeConfirmar = can(role, 'accept');
  function alternar(id) {
    if (!podeConfirmar) return;
    setConfirmacoes((atual) => {
      const proximo = { ...atual };
      if (proximo[id]) delete proximo[id];
      else proximo[id] = { por: role, em: new Date().toISOString() };
      try {
        window.localStorage.setItem(CONF_KEY(project.projectId), JSON.stringify(proximo));
      } catch {
        /* ignora */
      }
      return proximo;
    });
  }

  return (
    <div className="jg-page jf">
      <header className="jf-head">
        <div>
          <p className="ar-eyebrow ar-eyebrow--accent">Jornada do futuro</p>
          <h2 className="jf-title">Do decision pack à evolução responsável.</h2>
          <p className="jf-lead">
            Uma visão de continuidade que conecta o protocolo atual, a implantação futura e os ciclos de experimentação — sem antecipar contratação,
            MVP ou resultados.
          </p>
        </div>
        <span className="jf-horizon">
          <DarklabMenuIcon name="rocket" size={15} /> Horizonte futuro
        </span>
      </header>

      <div className="jf-grid">
        {/* Condições de partida */}
        <section className="jf-start" aria-labelledby="jf-start-title">
          <p className="ar-eyebrow jf-eyebrow-dark">Condições de partida</p>
          <h3 id="jf-start-title" className="jf-h3 jf-h3--light">
            O futuro começa após decisões validadas.
          </h3>
          <p className="jf-text-light">
            A jornada posterior depende de business case aprovado, estratégia de sourcing, arquitetura de transição, responsáveis e contratação
            futura.
          </p>
          <ul className="jf-conds">
            {f.condicoes.map((c) => (
              <li key={c.id} className={`jf-cond jf-cond--${c.status}`}>
                {c.manual ? (
                  <button
                    type="button"
                    className="jf-cond__check"
                    role="checkbox"
                    aria-checked={c.status === 'ok'}
                    disabled={!podeConfirmar}
                    onClick={() => alternar(c.id)}
                    title={podeConfirmar ? (c.status === 'ok' ? 'Desfazer confirmação' : 'Confirmar') : 'Só Aprovador ou Administrador confirma'}
                  >
                    {c.status === 'ok' ? <DarklabMenuIcon name="check" size={13} /> : null}
                  </button>
                ) : (
                  <span className="jf-cond__check" aria-hidden="true">
                    {c.status === 'ok' ? <DarklabMenuIcon name="check" size={13} /> : null}
                  </span>
                )}
                <span className="jf-cond__body">
                  <strong>{c.titulo}</strong>
                  <span>
                    {c.detalhe}
                    {c.confirmadoPor ? ` Confirmado por ${c.confirmadoPor} em ${new Date(c.confirmadoEm).toLocaleDateString('pt-BR')}.` : ''}
                  </span>
                </span>
                <span className="jf-cond__status">{STATUS_CONDICAO[c.status]}</span>
              </li>
            ))}
          </ul>
          <p className="jf-gate">
            <span className={`jf-gate__dot ${f.liberado ? 'is-ok' : ''}`} aria-hidden="true" />
            {f.liberado
              ? 'Condições atendidas: o ciclo de evolução pode começar.'
              : `Aguardando as condições de partida · ${f.atendidas} de ${f.condicoes.length} atendidas.`}
            {!podeConfirmar ? ' As confirmações manuais são feitas por Aprovador ou Administrador.' : ''}
          </p>
        </section>

        {/* Ciclo de evolução */}
        <section className="ar-card jf-cycle" aria-labelledby="jf-cycle-title">
          <p className="ar-eyebrow ar-eyebrow--accent">Ciclo de evolução</p>
          <h3 id="jf-cycle-title" className="jf-h3">
            Implantar, medir, aprender e antecipar.
          </h3>
          <p className="ar-sub">
            Quando as condicionantes forem atendidas, os motores Construir, Comprovar e Antecipar podem orientar MVP, experimentação condicional e
            evolução contínua.
          </p>
          <ul className="jf-motors">
            {f.linhas.map((l) => (
              <li key={l.numero}>
                <button
                  type="button"
                  className={`jf-motor jf-motor--${l.situacao}`}
                  onClick={() => (l.revisao ? openArtifact(l.capId) : onSelect?.('jornada-7-motores'))}
                  title={l.revisao ? `Abrir o resultado R${l.revisao}` : 'Ir para a Jornada dos 7 motores'}
                >
                  <DarklabMenuIcon name={MOTOR_ICON[l.numero]} size={13} />
                  Motor {l.numero} · {l.verbo}
                  <em>{MOTOR_STATUS[l.situacao]?.label}</em>
                </button>
              </li>
            ))}
          </ul>
          <ol className="jf-loop" aria-label="Etapas do ciclo">
            {f.ciclo.map((e, i) => (
              <li key={e.id} className={`jf-loop__step jf-loop__step--${e.situacao}`}>
                <span className="jf-loop__num tabular">{i + 1}</span>
                <strong>{e.titulo}</strong>
                <span>{e.texto}</span>
                <em>M{e.motor}</em>
              </li>
            ))}
          </ol>
          <p className="jf-position">
            <DarklabMenuIcon name="infinity" size={14} /> {f.posicao}
          </p>
        </section>
      </div>

      {/* O que o Motor 7 propõe para depois */}
      <section className="ar-card" aria-labelledby="jf-next-title">
        <div className="jf-next__head">
          <div>
            <p className="ar-eyebrow ar-eyebrow--accent">Depois do decision pack</p>
            <h3 id="jf-next-title" className="jf-h3">
              Backlog do futuro, experimentos e gatilhos de revisão
            </h3>
          </div>
          {f.temM7 ? (
            <button type="button" className="btn btn--sm" onClick={() => openArtifact(f.capM7)}>
              <DarklabMenuIcon name="telescope" size={15} /> Abrir o Motor 7 · R{f.revisaoM7}
            </button>
          ) : null}
        </div>
        {f.temM7 ? (
          <div className="jf-next">
            <div>
              <p className="jf-col__title">
                Backlog do futuro <span className="tabular">{f.backlog.length}</span>
              </p>
              {f.backlog.length ? (
                <ul className="jf-list">
                  {f.backlog.map((b) => (
                    <li key={b.id}>
                      <span className={`jf-hz jf-hz--${b.horizonte === 'próximo' ? 'proximo' : b.horizonte}`}>
                        {HORIZONTE[b.horizonte] ?? b.horizonte}
                      </span>
                      <strong>{b.titulo}</strong>
                      {b.resultado ? <span>{b.resultado}</span> : null}
                      <em className="tabular">
                        {b.id}
                        {b.valor ? ` · valor ${b.valor}` : ''}
                        {b.gatilhos.length ? ` · ${b.gatilhos.join(', ')}` : ''}
                      </em>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ar-sub">Sem itens no backlog do futuro.</p>
              )}
            </div>
            <div>
              <p className="jf-col__title">
                Experimentos futuros <span className="tabular">{f.experimentos.length}</span>
              </p>
              {f.experimentos.length ? (
                <ul className="jf-list">
                  {f.experimentos.map((x) => (
                    <li key={x.id}>
                      <strong>{x.hipotese}</strong>
                      {x.passo ? <span>{x.passo}</span> : null}
                      <em className="tabular">{x.id}</em>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ar-sub">Sem experimentos futuros propostos.</p>
              )}
            </div>
            <div>
              <p className="jf-col__title">
                Gatilhos de revisão <span className="tabular">{f.gatilhos.length}</span>
              </p>
              {f.gatilhos.length ? (
                <ul className="jf-list">
                  {f.gatilhos.map((t) => (
                    <li key={t.id}>
                      <strong>{t.condicao}</strong>
                      {t.quem ? <span>Acompanhado por {t.quem}</span> : null}
                      <em className="tabular">
                        {t.id}
                        {t.afeta.length ? ` · afeta ${t.afeta.join(', ')}` : ''}
                      </em>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ar-sub">Sem gatilhos de revisão definidos.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="jf-empty">
            <p>O backlog do futuro, os experimentos e os gatilhos de revisão aparecem quando o Motor 7 · Antecipar for executado.</p>
            <button type="button" className="btn btn--sm btn--primary" onClick={() => onSelect?.('jornada-7-motores')}>
              Ir para a Jornada dos 7 motores
            </button>
          </div>
        )}
      </section>

      {/* Agentes de IA como apoio */}
      <aside className="jf-band">
        <span className="jf-band__icon" aria-hidden="true">
          <DarklabMenuIcon name="shield" size={20} />
        </span>
        <div>
          <strong>Agentes de IA como apoio, não como decisores.</strong>
          <p>
            Podem auxiliar ingestão, classificação, síntese, comparação e rastreabilidade. A validação humana permanece obrigatória em cada decisão
            definitiva.
          </p>
        </div>
      </aside>

      {/* Encerramento */}
      <section className="jf-cta" aria-labelledby="jf-cta-title">
        <span className="jf-band__icon" aria-hidden="true">
          <DarklabMenuIcon name="rocket" size={20} />
        </span>
        <div className="jf-cta__body">
          <p className="jf-cta__eyebrow">Encerramento do projeto</p>
          <h3 id="jf-cta-title" className="jf-h3 jf-h3--light">
            Vamos além?
          </h3>
          <p>Conheça o DarkLabs Impulso como proposta de continuidade e a prateleira modular Capgemini.</p>
        </div>
        <button type="button" className="jf-cta__btn" onClick={() => onSelect?.('vamos-alem')}>
          Ver proposta →
        </button>
      </section>
    </div>
  );
}
