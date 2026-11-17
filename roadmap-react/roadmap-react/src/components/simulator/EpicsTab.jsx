import { useMemo } from 'react';
import { LIMITS } from '../../data/initialRoadmapData.js';
import { STATUS_META } from '../../domain/simulationEngine.js';
import { fmtNumber, fmtPct, plural } from '../../domain/format.js';
import Badge from '../ui/Badge.jsx';
import NumberInput from '../ui/NumberInput.jsx';

const NO_EPIC = '—';

/** Aba "Épicos, Features e Histórias": backlog agrupado por épico, com as histórias editáveis. */
export default function EpicsTab({ scenario, result, onStoriesChange }) {
  const { premises, squads } = scenario;
  const avg = premises.avgHoursPerStory;

  const { epics, totals } = useMemo(() => {
    const byEpic = new Map();
    for (const squad of squads) {
      for (const feature of squad.features) {
        const code = feature.epic || NO_EPIC;
        if (!byEpic.has(code)) byEpic.set(code, { code, features: [] });
        byEpic.get(code).features.push({ feature, squad });
      }
    }
    const list = [...byEpic.values()]
      .map((epic) => {
        const stories = epic.features.reduce((sum, item) => sum + Math.max(0, item.feature.stories), 0);
        return { ...epic, stories, hours: stories * avg };
      })
      .sort((a, b) => (a.code === NO_EPIC ? 1 : b.code === NO_EPIC ? -1 : a.code.localeCompare(b.code)));
    return {
      epics: list,
      totals: {
        epics: list.filter((epic) => epic.code !== NO_EPIC).length,
        features: list.reduce((sum, epic) => sum + epic.features.length, 0),
        stories: list.reduce((sum, epic) => sum + epic.stories, 0),
        hours: list.reduce((sum, epic) => sum + epic.hours, 0),
      },
    };
  }, [squads, avg]);

  return (
    <div className="tabpanel">
      <section className="surface" aria-labelledby="epics-summary">
        <header className="surface-head">
          <h2 id="epics-summary" className="surface-title">Épicos, features e histórias</h2>
          <span className="surface-meta">Edite as histórias aqui ou no cronograma</span>
        </header>
        <dl className="kpi-split kpi-split--4">
          <div>
            <dt>Épicos</dt>
            <dd className="tabular">{totals.epics}</dd>
          </div>
          <div>
            <dt>Features</dt>
            <dd className="tabular">{totals.features}</dd>
          </div>
          <div>
            <dt>Histórias</dt>
            <dd className="tabular">{fmtNumber(totals.stories)}</dd>
          </div>
          <div>
            <dt>Horas ({avg} h por história)</dt>
            <dd className="tabular">{fmtNumber(totals.hours)}</dd>
          </div>
        </dl>
      </section>

      {epics.map((epic) => (
        <details key={epic.code} className="surface epic" open>
          <summary className="epic__summary">
            <span className="epic__code">{epic.code === NO_EPIC ? 'Sem épico' : epic.code}</span>
            <span className="epic__meta tabular">
              {plural(epic.features.length, 'feature', 'features')} · {plural(epic.stories, 'história', 'histórias')} · {fmtNumber(epic.hours)} h
            </span>
            <span className="epic__share tabular">{fmtPct(totals.stories > 0 ? epic.stories / totals.stories : 0, 0)} das histórias</span>
          </summary>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  <th scope="col">Squad</th>
                  <th scope="col" className="num">Histórias</th>
                  <th scope="col" className="num">Horas</th>
                  <th scope="col">Situação</th>
                </tr>
              </thead>
              <tbody>
                {epic.features.map(({ feature, squad }) => {
                  const schedule = result.features[feature.id];
                  const meta = STATUS_META[schedule?.status] || STATUS_META.EMPTY;
                  return (
                    <tr key={feature.id}>
                      <th scope="row">{feature.name}</th>
                      <td>
                        <span className="squad-dot" style={{ background: `var(${squad.colorToken})` }} aria-hidden="true" />
                        {squad.shortName}
                      </td>
                      <td className="num">
                        <NumberInput
                          className="cell-input cell-input--boxed tabular"
                          value={feature.stories}
                          onCommit={(value) => onStoriesChange(feature.id, value)}
                          min={LIMITS.stories.min}
                          max={LIMITS.stories.max}
                          aria-label={`Histórias (US) de ${feature.name}`}
                          invalidMessage="Informe de 0 a 200 histórias."
                        />
                      </td>
                      <td className="num tabular">{fmtNumber(schedule?.effortHours ?? 0)}</td>
                      <td>
                        <Badge variant={meta.variant} title={`${meta.label} — ${meta.description} Término: ${schedule?.endLabel}`}>
                          {meta.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      ))}
    </div>
  );
}
