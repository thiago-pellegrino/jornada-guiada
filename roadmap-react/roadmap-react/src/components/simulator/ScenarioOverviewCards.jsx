import { WEEKS, SCHEDULING_MODES, YEAR, FREEZE_DATE_LABEL, YEAR_WEEKS } from '../../data/initialRoadmapData.js';
import { fmtNumber, plural } from '../../domain/format.js';

/**
 * Cartões de síntese do cenário exibidos em "Resultados e diagnóstico":
 * Objetivo e escopo, Premissas atuais, Squads e Marcos do calendário.
 */
export default function ScenarioOverviewCards({ scenario, result }) {
  const { premises, squads } = scenario;
  const { kpis, context } = result;
  const startColumn = WEEKS.find((week) => week.id === premises.startWeekId);
  const yearWeek = YEAR_WEEKS.find((item) => item.number === premises.startYearWeek);
  const mode = SCHEDULING_MODES.find((item) => item.id === premises.schedulingMode);
  const milestones = WEEKS.filter((week) => week.milestone);

  return (
    <>
      <section className="surface" aria-labelledby="res-premises">
        <header className="surface-head">
          <h2 id="res-premises" className="surface-title">Premissas atuais</h2>
          <span className="surface-meta">Ajuste na aba Planejamento</span>
        </header>
        <dl className="kv-list">
          <div className="kv-list__row">
            <dt>Média de horas por história</dt>
            <dd className="tabular">{premises.avgHoursPerStory} h</dd>
          </div>
          <div className="kv-list__row">
            <dt>Jornada semanal por profissional</dt>
            <dd className="tabular">{premises.hoursPerPersonPerWeek} h</dd>
          </div>
          <div className="kv-list__row">
            <dt>Semana inicial do planejamento</dt>
            <dd className="tabular">
              {yearWeek ? `Semana ${yearWeek.number} · ${yearWeek.startLabel} a ${yearWeek.endLabel}` : '—'} ({startColumn?.sprintWeek})
            </dd>
          </div>
          <div className="kv-list__row">
            <dt>Semanas úteis até o Freezing / até {context.lastWeekCode}</dt>
            <dd className="tabular">
              {context.eligibleBeforeFreezeCount} / {context.eligibleCount}
            </dd>
          </div>
          <div className="kv-list__row">
            <dt>Modalidade de alocação</dt>
            <dd>{mode?.label}</dd>
          </div>
          <div className="kv-list__row">
            <dt>Capacidade total</dt>
            <dd className="tabular">
              {plural(kpis.totalPeople, 'profissional', 'profissionais')} · {fmtNumber(kpis.totalWeeklyCapacity)} h/sem
            </dd>
          </div>
        </dl>
      </section>

      <section className="surface" aria-labelledby="res-squads">
        <header className="surface-head">
          <h2 id="res-squads" className="surface-title">Squads</h2>
        </header>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Squad</th>
                <th scope="col" className="num">Pessoas</th>
                <th scope="col" className="num">h/sem</th>
                <th scope="col" className="num">Features</th>
                <th scope="col" className="num">Histórias</th>
                <th scope="col" className="num">Horas</th>
              </tr>
            </thead>
            <tbody>
              {result.squads.map((squad) => (
                <tr key={squad.squadKey}>
                  <th scope="row">
                    <span className="squad-dot" style={{ background: `var(${squad.colorToken})` }} aria-hidden="true" />
                    {squad.shortName}
                  </th>
                  <td className="num tabular">{squad.people}</td>
                  <td className="num tabular">{fmtNumber(squad.weeklyCapacityHours)}</td>
                  <td className="num tabular">{scenario.squads.find((q) => q.key === squad.squadKey)?.features.length}</td>
                  <td className="num tabular">{fmtNumber(squad.stories)}</td>
                  <td className="num tabular">{fmtNumber(squad.demandHours)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface" aria-labelledby="res-milestones">
        <header className="surface-head">
          <h2 id="res-milestones" className="surface-title">Marcos do calendário</h2>
        </header>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Marco</th>
                <th scope="col">Semana do roadmap</th>
                <th scope="col">Início</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((week) => (
                <tr key={week.id} className={week.frozen ? 'is-freeze' : undefined}>
                  <th scope="row">{week.milestone.charAt(0) + week.milestone.slice(1).toLowerCase()}</th>
                  <td className="tabular">{week.frozen ? '—' : week.sprintWeek}</td>
                  <td className="tabular">{week.dateLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface" aria-labelledby="res-objective">
        <header className="surface-head">
          <h2 id="res-objective" className="surface-title">Objetivo e escopo</h2>
        </header>
        <div className="prose">
          <p>
            O simulador apoia a gestão do portfólio (Upstream) e o roadmap do Downstream: a partir do tamanho das squads e do backlog de
            features e histórias, mostra quando cada entrega termina, quantas ficam para depois do congelamento (Freezing) e quantos
            profissionais seriam necessários para entregar tudo a tempo.
          </p>
          <ul>
            <li>
              <strong>{plural(squads.length, 'squad', 'squads')}</strong>, <strong>{plural(kpis.totalFeatures, 'feature', 'features')}</strong> e{' '}
              <strong>{plural(kpis.totalStories, 'história', 'histórias')}</strong> ({fmtNumber(kpis.totalDemandHours)} h de demanda).
            </li>
            <li>
              Calendário de {YEAR}: cobertura anual completa com o <strong>Freezing em {FREEZE_DATE_LABEL}</strong> (sem alocação nessa coluna).
            </li>
            <li>
              Os dados são <strong>simulados</strong> e ficam só neste navegador; o simulador não executa nenhuma operação nem substitui o
              planejamento oficial.
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
