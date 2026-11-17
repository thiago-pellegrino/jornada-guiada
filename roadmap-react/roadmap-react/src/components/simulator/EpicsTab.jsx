import { useMemo } from 'react';
import { LIMITS, featureCatalogKey } from '../../data/initialRoadmapData.js';
import { STATUS_META, aggregateFeatureStatus } from '../../domain/simulationEngine.js';
import { fmtNumber, fmtPct, plural } from '../../domain/format.js';
import Badge from '../ui/Badge.jsx';
import NumberInput from '../ui/NumberInput.jsx';

const NO_EPIC = '—';

/** Aba "Épicos, Features e Histórias": backlog agrupado por épico, consolidando features compartilhadas entre squads. */
export default function EpicsTab({ scenario, result, onStoriesChange, onFeatureTotalStoriesChange }) {
  const { premises, squads } = scenario;
  const avg = premises.avgHoursPerStory;

  const { epics, totals } = useMemo(() => {
    const byEpic = new Map();
    for (const squad of squads) {
      for (const feature of squad.features) {
        const code = feature.epic || NO_EPIC;
        if (!byEpic.has(code)) byEpic.set(code, { code, byFeature: new Map() });
        const fKey = featureCatalogKey(code, feature.name);
        const epicBucket = byEpic.get(code);
        if (!epicBucket.byFeature.has(fKey)) {
          epicBucket.byFeature.set(fKey, { key: fKey, epic: code, name: feature.name, entries: [] });
        }
        epicBucket.byFeature.get(fKey).entries.push({ feature, squad });
      }
    }
    const list = [...byEpic.values()]
      .map((epicBucket) => {
        const features = [...epicBucket.byFeature.values()].map((group) => {
          const stories = group.entries.reduce((sum, entry) => sum + Math.max(0, entry.feature.stories), 0);
          return { ...group, stories, hours: stories * avg };
        });
        const stories = features.reduce((sum, item) => sum + item.stories, 0);
        return { code: epicBucket.code, features, stories, hours: stories * avg };
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
                {epic.features.map((item) => {
                  const schedules = item.entries.map(({ feature }) => result.features[feature.id]).filter(Boolean);
                  const status = aggregateFeatureStatus(schedules);
                  const meta = STATUS_META[status] || STATUS_META.EMPTY;
                  const effortHours = schedules.reduce((sum, s) => sum + s.effortHours, 0);
                  const endLabels = schedules.map((s) => s.endLabel).filter(Boolean);
                  return (
                    <tr key={item.key}>
                      <th scope="row">{item.name}</th>
                      <td>
                        {item.entries.length === 1 ? (
                          <>
                            <span className="squad-dot" style={{ background: `var(${item.entries[0].squad.colorToken})` }} aria-hidden="true" />
                            {item.entries[0].squad.shortName}
                          </>
                        ) : (
                          <div className="epic__squad-list">
                            {item.entries.map(({ feature, squad }) => (
                              <span key={feature.id} className="epic__squad-chip">
                                <span className="squad-dot" style={{ background: `var(${squad.colorToken})` }} aria-hidden="true" />
                                {squad.shortName} <span className="epic__meta tabular">({feature.stories} US)</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="num">
                        <NumberInput
                          className="cell-input cell-input--boxed tabular"
                          value={item.stories}
                          onCommit={(value) => {
                            if (item.entries.length === 1) {
                              onStoriesChange(item.entries[0].feature.id, value);
                            } else if (onFeatureTotalStoriesChange) {
                              onFeatureTotalStoriesChange(item.epic, item.name, value);
                            }
                          }}
                          min={LIMITS.stories.min}
                          max={LIMITS.stories.max}
                          aria-label={`Histórias (US) de ${item.name}`}
                          invalidMessage="Informe de 0 a 200 histórias."
                        />
                      </td>
                      <td className="num tabular">{fmtNumber(effortHours)}</td>
                      <td>
                        <Badge variant={meta.variant} title={`${meta.label} — ${meta.description}${endLabels.length ? ` Término: ${endLabels.join(' / ')}` : ''}`}>
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
