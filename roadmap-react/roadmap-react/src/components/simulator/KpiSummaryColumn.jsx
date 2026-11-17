import { fmtNumber, fmtPct, fmtWeeks } from '../../domain/format.js';
import Icon from '../ui/Icon.jsx';

function completionTone(pct) {
  if (pct >= 0.999) return { tone: 'success', icon: 'check', text: 'Todo o escopo cabe antes do Freezing' };
  if (pct >= 0.6) return { tone: 'warning', icon: 'warning', text: 'Parte do escopo fica para depois do Freezing' };
  return { tone: 'danger', icon: 'warning', text: 'Maior parte do escopo fica para depois do Freezing' };
}

/** Coluna executiva: cartões KPI (DS §18.4 / §20.10.3) com corpo preenchido por squad. */
export default function KpiSummaryColumn({ result }) {
  const { kpis, squads, context } = result;
  const bottleneck = squads.find((s) => s.squadKey === kpis.bottleneckSquadKey);
  const onTime = kpis.globalSpilloverWeeks <= 0 && kpis.featuresPostFreeze === 0 && kpis.featuresNoCapacity === 0;
  const completion = completionTone(kpis.completionPctBeforeFreeze);
  const maxWeeks = Math.max(
    context.eligibleCount,
    ...squads.filter((s) => Number.isFinite(s.requiredWeeks)).map((s) => s.requiredWeeks),
  );

  return (
    <>
      <section className="surface dsh-card kpi" aria-labelledby="kpi-end-title">
        <h2 id="kpi-end-title" className="kpi__title">Previsão de conclusão do backlog</h2>
        <p className={`kpi__value tabular ${onTime ? 'is-success' : ''}`}>{kpis.globalEndLabel}</p>
        <p className="kpi__sub">
          {bottleneck ? (
            <>
              Gargalo: <strong>{bottleneck.shortName}</strong> ·{' '}
              {Number.isFinite(bottleneck.requiredWeeks) ? `${fmtWeeks(bottleneck.requiredWeeks)} semanas necessárias` : 'sem capacidade'}
            </>
          ) : (
            'Sem escopo pendente'
          )}
        </p>
        <ul className="kpi-bars" aria-label="Semanas necessárias por squad">
          {squads.map((squad) => {
            const finite = Number.isFinite(squad.requiredWeeks);
            const width = finite && maxWeeks > 0 ? Math.min(100, (squad.requiredWeeks / maxWeeks) * 100) : 100;
            const limit = maxWeeks > 0 ? (context.eligibleBeforeFreezeCount / maxWeeks) * 100 : 0;
            return (
              <li key={squad.squadKey} className="kpi-bars__row">
                <span className="kpi-bars__label">{squad.shortName}</span>
                <span className="kpi-bars__track" style={{ '--freeze-at': `${limit}%` }}>
                  <span
                    className={`kpi-bars__fill ${finite ? '' : 'is-empty'}`}
                    style={{ width: `${width}%`, background: finite ? `var(${squad.colorToken})` : undefined }}
                  />
                </span>
                <span className="kpi-bars__value tabular">{finite ? `${fmtWeeks(squad.requiredWeeks)} sem` : '—'}</span>
              </li>
            );
          })}
        </ul>
        <p className="kpi__legend">
          <span className="legend-freeze" aria-hidden="true" /> Linha tracejada: limite de {context.eligibleBeforeFreezeCount} semanas até o Freezing.
        </p>
      </section>

      <section className="surface dsh-card kpi" aria-labelledby="kpi-freeze-title">
        <h2 id="kpi-freeze-title" className="kpi__title">Entregas até o freezing (17/12)</h2>
        <p className={`kpi__value tabular is-${completion.tone}`}>{fmtPct(kpis.completionPctBeforeFreeze)}</p>
        <p className="kpi__sub tabular">
          {fmtNumber(kpis.storiesCompletedBeforeFreeze)} de {fmtNumber(kpis.totalStories)} US ·{' '}
          <strong>
            {kpis.featuresCompletedBeforeFreeze} de {kpis.featuresWithScope}
          </strong>{' '}
          features concluídas até {context.lastBeforeFreezeCode}
        </p>
        <p className={`kpi__delta is-${completion.tone}`}>
          <Icon name={completion.icon} size={16} />
          {completion.text}
        </p>
        <dl className="kpi-split">
          <div>
            <dt>Pós-Freezing</dt>
            <dd className="tabular">{kpis.featuresPostFreeze}</dd>
          </div>
          <div>
            <dt>Fora da janela</dt>
            <dd className="tabular">{kpis.featuresOutOfWindow}</dd>
          </div>
          <div>
            <dt>Horas entregues</dt>
            <dd className="tabular">{fmtPct(kpis.hoursPctBeforeFreeze)}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
