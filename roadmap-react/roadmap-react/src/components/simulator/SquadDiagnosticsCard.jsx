import { STATUS_META } from '../../domain/simulationEngine.js';
import { fmtNumber, fmtWeeks, plural } from '../../domain/format.js';
import Badge from '../ui/Badge.jsx';
import Icon from '../ui/Icon.jsx';

/** Diagnóstico por squad + balanço de horas e recomendação de headcount para o Freezing. */
export default function SquadDiagnosticsCard({ result, onOpenCopilot }) {
  const { kpis, squads, context } = result;
  const balance = kpis.balanceHoursBeforeFreeze;

  return (
    <section className="surface diag-card" aria-labelledby="diag-title">
      <h2 id="diag-title" className="diag-card__title">
        <Icon name="gauge" size={18} />
        Diagnóstico e balanceamento por squad
      </h2>
      <p className="diag-card__lede">
        Capacidade ofertada × demanda até {context.lastBeforeFreezeCode}, com o mínimo de profissionais para entregar tudo antes do Freezing.
      </p>

      <dl className="kv-list">
        <div className="kv-list__row">
          <dt>Demanda total</dt>
          <dd className="tabular">{fmtNumber(kpis.totalDemandHours)} h</dd>
        </div>
        <div className="kv-list__row">
          <dt>Capacidade até o Freezing</dt>
          <dd className="tabular">{fmtNumber(kpis.availableHoursBeforeFreeze)} h</dd>
        </div>
        <div className="kv-list__row">
          <dt>Saldo até o Freezing</dt>
          <dd className={`tabular ${balance < 0 ? 'is-danger' : 'is-success'}`}>
            {balance < 0 ? `Déficit de ${fmtNumber(-balance)} h` : `Folga de ${fmtNumber(balance)} h`}
          </dd>
        </div>
        <div className="kv-list__row">
          <dt>Profissionais adicionais sugeridos</dt>
          <dd className="tabular">{kpis.totalAdditionalPeopleNeeded > 0 ? `+${kpis.totalAdditionalPeopleNeeded}` : 'Nenhum'}</dd>
        </div>
      </dl>

      <ul className="squad-diag">
        {squads.map((squad) => {
          const meta = STATUS_META[squad.status] || STATUS_META.EMPTY;
          const delta = squad.peopleDeltaForFreeze;
          return (
            <li key={squad.squadKey} className="squad-diag__item">
              <div className="squad-diag__head">
                <span className="squad-diag__name">
                  <span className="squad-dot" style={{ background: `var(${squad.colorToken})` }} aria-hidden="true" />
                  {squad.shortName}
                </span>
                <Badge variant={meta.variant}>{meta.label}</Badge>
              </div>
              <p className="squad-diag__meta tabular">
                {plural(squad.people, 'pessoa', 'pessoas')} · {fmtNumber(squad.weeklyCapacityHours)} h/sem ·{' '}
                {Number.isFinite(squad.requiredWeeks) ? `${fmtWeeks(squad.requiredWeeks)} de ${context.eligibleBeforeFreezeCount} sem` : 'sem capacidade'}
              </p>
              <p className="squad-diag__rec">
                {squad.recommendedPeopleForFreeze === null ? (
                  <>
                    <Icon name="warning" size={14} /> Sem solução no horizonte: há mais features do que semanas.
                  </>
                ) : delta > 0 ? (
                  <>
                    <Icon name="users" size={14} /> Para o Freezing: <strong className="tabular">{squad.people} → {squad.recommendedPeopleForFreeze}</strong> (+{delta})
                  </>
                ) : squad.demandHours > 0 ? (
                  <>
                    <Icon name="check" size={14} /> Time suficiente para o Freezing
                  </>
                ) : (
                  'Sem escopo pendente'
                )}
              </p>
            </li>
          );
        })}
      </ul>

      {kpis.totalAdditionalPeopleNeeded > 0 && onOpenCopilot ? (
        <button type="button" className="btn btn--quiet diag-card__cta" onClick={onOpenCopilot}>
          <Icon name="sparkle" size={16} /> Pedir ao Delta uma proposta de balanceamento
        </button>
      ) : null}
    </section>
  );
}
