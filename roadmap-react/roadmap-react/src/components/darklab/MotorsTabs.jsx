import { useMemo, useState } from 'react';
import { CAP, checkEligibility, latestRevision, listRevisions } from '../../domain/journey/journeyEngine.js';
import { useJourney } from '../../journey/JourneyContext.jsx';
import { RunStatus, fmtDateTime } from '../journey/JourneyBits.jsx';
import DarklabMenuIcon from './DarklabMenuIcons.jsx';
import { FAIXA, MOTOR_ICON, motorNames } from './MotorsJourney.jsx';

const COLUNAS = [
  { id: 'aceito', titulo: 'Executado e aceito', dica: 'Aceito por Aprovador ou Administrador.' },
  { id: 'produzido', titulo: 'Produzido', dica: 'Resultado gerado, ainda sem revisão do time.' },
  { id: 'pendente', titulo: 'Aceite pendente', dica: 'Revisado pelo time, aguardando o aceite.' },
  { id: 'andamento', titulo: 'Em andamento', dica: 'Execução rodando agora.' },
  { id: 'dependencia', titulo: 'Dependência aberta', dica: 'Bloqueado até a etapa anterior ser concluída.' },
];

/** Coluna do workflow: a execução em curso vem primeiro; depois o estado de revisão; sem resultado, a elegibilidade. */
function colunaDe(project, catalog, pending, capId, rev) {
  if (pending?.[`${capId}::projeto`]) return 'andamento';
  if (rev) return rev.reviewState === 'aceito' ? 'aceito' : rev.reviewState === 'revisado' ? 'pendente' : 'produzido';
  return checkEligibility(project, catalog, capId).ok ? 'nao' : 'dependencia';
}

function nomeCurto(catalog, capId) {
  const cap = catalog.byId.get(capId);
  if (!cap) return capId;
  if (capId === CAP.ficha) return 'Ficha do projeto';
  const { nome } = motorNames(cap);
  return cap.number >= 1 && cap.number <= 7 ? `M${cap.number} · ${nome}` : cap.title;
}

/** Workflow de aprovações: cada motor (e a ficha) na coluna do seu estado de revisão, com as ações permitidas ao papel. */
export function ApprovalsBoard({ motores }) {
  const { catalog, project, can, setReview, openArtifact, pending } = useJourney();
  const itens = [...motores.map((m) => m.id), CAP.ficha].map((capId) => {
    const rev = latestRevision(project, capId);
    const coluna = colunaDe(project, catalog, pending, capId, rev);
    const motivo = coluna === 'dependencia' ? checkEligibility(project, catalog, capId).reason : null;
    return { capId, rev, coluna, motivo };
  });
  const naoIniciados = itens.filter((i) => i.coluna === 'nao');

  return (
    <>
    <div className="mj-board" role="list">
      {COLUNAS.map((col) => {
        const daColuna = itens.filter((i) => i.coluna === col.id);
        return (
          <section key={col.id} className={`mj-col mj-col--${col.id.replace(/\s/g, '-')}`} role="listitem" aria-label={`${col.titulo}: ${daColuna.length}`}>
            <header className="mj-col__head">
              <strong>{col.titulo}</strong>
              <span className="mj-col__count tabular">{daColuna.length}</span>
            </header>
            <p className="mj-col__hint">{col.dica}</p>
            <ul className="mj-col__list">
              {daColuna.map(({ capId, rev, coluna, motivo }) => {
                const ultimo = rev?.reviewLog?.[rev.reviewLog.length - 1];
                return (
                  <li key={capId} className="mj-card">
                    <button type="button" className="mj-card__title" onClick={() => (rev ? openArtifact(capId) : null)} disabled={!rev}>
                      {nomeCurto(catalog, capId)}
                    </button>
                    <span className="mj-card__meta">
                      {coluna === 'andamento'
                        ? 'Executando…'
                        : rev
                          ? `r${rev.revision} · gerado ${fmtDateTime(rev.generatedAt)}`
                          : motivo ?? 'Aguardando a etapa anterior.'}
                    </span>
                    {ultimo ? (
                      <span className="mj-card__meta">
                        {ultimo.reviewState} por {ultimo.role} · {fmtDateTime(ultimo.at)}
                      </span>
                    ) : null}
                    {rev && coluna !== 'andamento' ? (
                      <span className="mj-card__actions">
                        {rev.reviewState === 'não revisado' ? (
                          <button type="button" className="btn btn--sm" disabled={!can('review')} onClick={() => setReview(capId, 'projeto', rev.revision, 'revisado')}>
                            Marcar revisado
                          </button>
                        ) : null}
                        {rev.reviewState !== 'aceito' ? (
                          <button
                            type="button"
                            className="btn btn--sm btn--primary"
                            disabled={!can('accept')}
                            title={can('accept') ? undefined : 'Só Aprovador ou Administrador'}
                            onClick={() => setReview(capId, 'projeto', rev.revision, 'aceito')}
                          >
                            <DarklabMenuIcon name="check" size={14} /> Aceitar
                          </button>
                        ) : (
                          <button type="button" className="btn btn--sm btn--quiet" disabled={!can('accept')} onClick={() => setReview(capId, 'projeto', rev.revision, 'revisado')}>
                            Reabrir
                          </button>
                        )}
                      </span>
                    ) : null}
                  </li>
                );
              })}
              {!daColuna.length ? <li className="mj-col__empty">Nada aqui.</li> : null}
            </ul>
          </section>
        );
      })}
    </div>
    {naoIniciados.length ? (
      <p className="mj-board__rest">
        <strong>Prontos para executar:</strong> {naoIniciados.map((i) => nomeCurto(catalog, i.capId)).join(' · ')} — sem dependências
        abertas; gere o resultado na aba Execução.
      </p>
    ) : null}
    </>
  );
}

/** O motor registra o motivo do pulo com o estado em inglês ("failed"); a tela mostra em português. */
function traduzir(texto) {
  return String(texto ?? '')
    .replace(/\bfailed\b/g, 'falhou')
    .replace(/\bskipped\b/g, 'foi pulado')
    .replace(/\bcancelled\b/g, 'foi cancelado');
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
/** "2026-11-18T19:57…" → "18 nov" */
function dia(at) {
  const d = new Date(at);
  return Number.isNaN(d.getTime()) ? '' : `${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]}`;
}

/** Estado do motor na timeline: execução em curso, estado de revisão do último resultado ou elegibilidade. */
const SITUACAO = {
  aceito: { label: 'Executado e aceito', icon: 'check' },
  produzido: { label: 'Produzido', icon: 'file' },
  pendente: { label: 'Aceite pendente', icon: 'shield' },
  andamento: { label: 'Em andamento', icon: 'play' },
  dependencia: { label: 'Dependência aberta', icon: 'lock' },
  nao: { label: 'Não iniciado', icon: 'chevron' },
};

const WORK_STATUS = {
  pendente: 'Previsto · sujeito a consolidação e revisão humana',
  'em andamento': 'Em andamento no projeto, segundo as fontes',
  'em aceite': 'Produzido no projeto · aceite não comprovado',
  impedido: 'Impedido no projeto · bloqueio registrado',
  concluído: 'Concluído no projeto, com evidência de aceite',
};

const LENTE = {
  aplicado_sobre_evidencias: 'aplicado sobre evidências',
  parcial: 'parcial',
  sem_evidencia_suficiente: 'sem evidência suficiente',
};

/** Execuções (avulsas e do Modo Turbo) e revisões de um motor, da mais recente para a mais antiga. */
function eventosDoMotor(project, capId) {
  const lista = [];
  for (const r of project.runs) {
    if (r.kind === 'turbo') {
      const n = r.nodes?.find((x) => x.capabilityId === capId);
      if (n) lista.push({ tipo: 'execucao', at: r.startedAt, status: n.status, revision: n.outputRevision, turbo: true, detalhe: n.error?.message ?? (n.skipReason ? traduzir(n.skipReason) : null) });
    } else if (r.capabilityId === capId) {
      lista.push({ tipo: 'execucao', at: r.startedAt, status: r.status, revision: r.revision, turbo: false, detalhe: r.error?.message ?? null });
    }
  }
  for (const rev of listRevisions(project, capId)) {
    for (const log of rev.reviewLog ?? []) lista.push({ tipo: 'revisao', at: log.at, revision: rev.revision, estado: log.reviewState, papel: log.role });
  }
  return lista.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

function resumoDatas(situacao, eventos, rev, motivo, anterior) {
  const inicio = eventos.length ? dia(eventos[eventos.length - 1].at) : null;
  const aceite = rev?.reviewLog?.findLast?.((l) => l.reviewState === 'aceito');
  switch (situacao) {
    case 'aceito':
      return `${inicio} → aceito ${dia(aceite?.at ?? rev.generatedAt)}`;
    case 'pendente':
      return `${inicio} → revisado, aguardando aceite`;
    case 'produzido':
      return `${inicio} → r${rev.revision} gerado ${dia(rev.generatedAt)}`;
    case 'andamento':
      return inicio ? `${inicio} → execução em curso` : 'Execução em curso';
    case 'dependencia':
      return motivo ?? 'Aguardando a etapa anterior';
    default:
      return anterior ? `Pronto · lê ${anterior}` : 'Pronto para executar';
  }
}

/** Timeline de cada execução: um cartão por motor, com situação e período; aberto, mostra objetivo, entregáveis, atividades e o histórico. */
export function ExecutionTimeline({ motores }) {
  const { catalog, project, pending, openArtifact } = useJourney();
  const linhas = useMemo(
    () =>
      motores.map((cap) => {
        const rev = latestRevision(project, cap.id);
        const situacao = colunaDe(project, catalog, pending, cap.id, rev);
        const motivo = situacao === 'dependencia' ? checkEligibility(project, catalog, cap.id).reason : null;
        return { cap, rev, situacao, motivo, eventos: eventosDoMotor(project, cap.id) };
      }),
    [motores, project, catalog, pending],
  );
  const primeiroAberto = linhas.find((l) => l.situacao !== 'aceito')?.cap.id ?? linhas[0]?.cap.id ?? null;
  const [abertos, setAbertos] = useState(() => new Set(primeiroAberto ? [primeiroAberto] : []));
  const alternar = (id) =>
    setAbertos((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });

  return (
    <ol className="mj-acc-list" aria-label="Timeline de cada execução dos 7 motores">
      {linhas.map(({ cap, rev, situacao, motivo, eventos }, i) => {
        const { verbo, nome } = motorNames(cap);
        const faixa = FAIXA(cap.number);
        const aberto = abertos.has(cap.id);
        const anterior = i > 0 ? `M${linhas[i - 1].cap.number}` : null;
        const envelope = rev?.envelope ?? cap.example;
        const dados = envelope?.data ?? {};
        const entregaveis = dados.deliverables ?? [];
        const atividades = dados.activities ?? [];
        const lentes = dados.methodLenses ?? [];
        const insumos = (dados.inputsUsed ?? []).map((u) => u.capabilityId);
        const sit = SITUACAO[situacao];
        const painel = `mj-acc-${cap.number}`;
        return (
          <li key={cap.id} className={`mj-acc mj-acc--${situacao} ${aberto ? 'is-open' : ''}`}>
            <button type="button" className="mj-acc__head" aria-expanded={aberto} aria-controls={painel} onClick={() => alternar(cap.id)}>
              <span className="mj-acc__badge" aria-hidden="true">
                <DarklabMenuIcon name={MOTOR_ICON[cap.number]} size={18} />
              </span>
              <span className="mj-acc__title">
                <span className="mj-acc__eyebrow">
                  <span className="mj-acc__verb">{verbo}</span>
                  <span className={`mj-chip mj-chip--light mj-chip--${faixa.id}`}>
                    <span className="mj-chip__dot" aria-hidden="true" /> {faixa.label}
                  </span>
                </span>
                <strong className="mj-acc__name">
                  <span className="tabular">{cap.number}</span> · {nome}
                </strong>
                <span className="mj-acc__flow">Entrada → métodos → saída → evidência do projeto</span>
              </span>
              <span className="mj-acc__side">
                <span className="mj-acc__pill">
                  <DarklabMenuIcon name={sit.icon} size={13} /> {sit.label}
                </span>
                <span className="mj-acc__dates">{resumoDatas(situacao, eventos, rev, motivo, anterior)}</span>
              </span>
              <span className="mj-acc__chev" aria-hidden="true">
                <DarklabMenuIcon name="chevron" size={16} />
              </span>
            </button>

            {aberto ? (
              <div id={painel} className="mj-acc__body">
                {rev && situacao !== 'aceito' ? (
                  <p className="mj-acc__gate">
                    <DarklabMenuIcon name="shield" size={16} /> Aceite formal separado: o resultado gerado só vira referência do projeto depois do aceite de um
                    Aprovador ou Administrador.
                  </p>
                ) : null}
                <div className="mj-acc__grid">
                  <section className="mj-acc__box">
                    <h4>Objetivo</h4>
                    <p>{cap.objective}</p>
                    {insumos.length ? (
                      <>
                        <h5>Insumos lidos</h5>
                        <span className="mj-acc__tags">
                          {insumos.map((id) => (
                            <span key={id} className="mj-acc__tag">
                              {nomeInsumo(catalog, id)}
                            </span>
                          ))}
                        </span>
                      </>
                    ) : null}
                  </section>
                  <section className="mj-acc__box">
                    <h4>Entregáveis {rev ? 'do resultado' : 'previstos'}</h4>
                    <ul className="mj-acc__deliv">
                      {entregaveis.map((d) => (
                        <li key={d.name}>
                          <strong>{d.name}</strong>
                          <span>{WORK_STATUS[d.status] ?? d.status}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section className="mj-acc__box">
                    <h4>Principais atividades</h4>
                    {atividades.length ? (
                      <ul className="mj-acc__bullets">
                        {atividades.map((a) => (
                          <li key={a.id ?? a.title}>
                            {a.title}
                            {a.status ? <em> · {a.status}</em> : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <>
                        <p className="mj-acc__hint">Nenhuma atividade registrada nas fontes. Métodos aplicados como lentes:</p>
                        <ul className="mj-acc__bullets">
                          {lentes.map((l) => (
                            <li key={l.method}>
                              {l.method}
                              {rev ? <em> · {LENTE[l.status] ?? l.status}</em> : null}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                    {listRevisions(project, cap.id).length ? (
                      <span className="mj-acc__docs">
                        {listRevisions(project, cap.id).map((r) => (
                          <button key={r.revision} type="button" className="mj-acc__doc" onClick={() => openArtifact(cap.id, 'projeto', r.revision)}>
                            <DarklabMenuIcon name="file" size={15} /> Resultado r{r.revision} · {dia(r.generatedAt)}
                          </button>
                        ))}
                      </span>
                    ) : null}
                  </section>
                </div>

                <section className="mj-acc__hist" aria-label={`Histórico do motor ${cap.number}`}>
                  <h4>Execuções e revisões</h4>
                  {eventos.length ? (
                    <ol className="mj-acc__events">
                      {eventos.map((e, k) => (
                        <li key={`${e.tipo}-${e.at}-${k}`} className={`mj-acc__ev mj-acc__ev--${e.tipo === 'revisao' ? (e.estado === 'aceito' ? 'ok' : 'rev') : e.status}`}>
                          <span className="mj-acc__evdot" aria-hidden="true" />
                          <time>{fmtDateTime(e.at)}</time>
                          {e.tipo === 'revisao' ? (
                            <span>
                              r{e.revision} marcado como “{e.estado}” por {e.papel}
                            </span>
                          ) : (
                            <span>
                              {e.turbo ? 'Modo Turbo' : 'Execução avulsa'} <RunStatus status={e.status} />
                              {e.revision ? ` gerou r${e.revision}` : ''}
                              {e.detalhe ? ` · ${e.detalhe}` : ''}
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="mj-acc__hint">Nenhuma execução ainda. Gere o motor ou rode o Modo Turbo na aba Execução.</p>
                  )}
                </section>
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function nomeInsumo(catalog, capId) {
  const cap = catalog.byId.get(capId);
  if (!cap) return capId;
  if (cap.phase === 'darklab' && cap.number >= 1 && cap.number <= 7) return `Motor ${cap.number} · ${motorNames(cap).verbo}`;
  return `Contexto · ${cap.title}`;
}
