import { useEffect, useMemo, useState } from 'react';
import {
  BASE_SQUAD_KEYS,
  EPICS,
  FEATURE_CATALOG,
  LIMITS,
  MAX_SQUADS,
  featureCatalogKey,
  splitStoriesEvenly,
} from '../../data/initialRoadmapData.js';
import { fmtNumber, plural } from '../../domain/format.js';
import Icon from '../ui/Icon.jsx';
import NumberInput from '../ui/NumberInput.jsx';

const NEW_FEATURE_VALUE = '__new__';

function suggestedShareForNewOwner(item) {
  if (!item) return 5;
  if (!item.owners || item.owners.length === 0) return item.defaultStories ?? 5;
  const total = item.owners.reduce((sum, owner) => sum + Math.max(0, owner.stories), 0);
  const splits = splitStoriesEvenly(total, item.owners.length + 1);
  return splits[splits.length - 1] ?? 0;
}

function buildCatalogWithUsage(squads) {
  const map = new Map();
  for (const item of FEATURE_CATALOG) {
    map.set(item.catalogKey, { ...item, owners: [], totalStories: item.defaultStories ?? 0 });
  }
  for (const squad of squads) {
    for (const feature of squad.features) {
      const epic = feature.epic || '—';
      const key = featureCatalogKey(epic, feature.name);
      if (!map.has(key)) {
        map.set(key, {
          catalogKey: key,
          epic,
          name: feature.name,
          defaultStories: feature.stories || 1,
          owners: [],
          totalStories: 0,
        });
      }
      map.get(key).owners.push({
        squadKey: squad.key,
        shortName: squad.shortName,
        featureId: feature.id,
        stories: feature.stories,
      });
    }
  }
  return [...map.values()]
    .map((entry) => ({
      ...entry,
      totalStories:
        entry.owners.length > 0
          ? entry.owners.reduce((sum, owner) => sum + Math.max(0, owner.stories), 0)
          : entry.defaultStories ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

function SquadScopeCard({
  squad,
  allSquads,
  catalog,
  usageByKey,
  result,
  hpp,
  avg,
  onSquadNameChange,
  onPeopleChange,
  onRemoveSquad,
  onAssociateFeature,
  onMoveFeature,
  onStoriesChange,
  onRemoveFeature,
}) {
  const currentName = squad.name || `Squad ${squad.key}`;
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(currentName);

  const isCustomSquad = !BASE_SQUAD_KEYS.includes(squad.key);

  // Features do catálogo que ainda não estão associadas a esta squad
  const inThisSquad = useMemo(
    () => new Set(squad.features.map((f) => featureCatalogKey(f.epic, f.name))),
    [squad.features],
  );
  const availableCatalog = useMemo(
    () => catalog.filter((item) => !inThisSquad.has(item.catalogKey)),
    [catalog, inThisSquad],
  );

  const [selectedKey, setSelectedKey] = useState(() => availableCatalog[0]?.catalogKey || NEW_FEATURE_VALUE);
  const [customEpic, setCustomEpic] = useState(EPICS[0] || 'EPC-001');
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    if (!editingName) setNameDraft(currentName);
  }, [currentName, editingName]);

  // Mantém seleção válida quando o catálogo disponível muda
  useEffect(() => {
    if (selectedKey === NEW_FEATURE_VALUE) return;
    if (!availableCatalog.some((item) => item.catalogKey === selectedKey)) {
      const first = availableCatalog[0];
      setSelectedKey(first ? first.catalogKey : NEW_FEATURE_VALUE);
    }
  }, [availableCatalog, selectedKey]);

  const selectedCatalogItem = useMemo(
    () => (selectedKey === NEW_FEATURE_VALUE ? null : availableCatalog.find((item) => item.catalogKey === selectedKey) || null),
    [availableCatalog, selectedKey],
  );
      const assocStories = useMemo(() => {
        if (selectedKey !== NEW_FEATURE_VALUE) {
          return suggestedShareForNewOwner(selectedCatalogItem);
        }
      const trimmed = customName.trim();
      if (!trimmed) return 0;
      const existingCustom = usageByKey.get(featureCatalogKey(customEpic || '—', trimmed));
      return existingCustom ? suggestedShareForNewOwner(existingCustom) : 0;
    }, [selectedKey, selectedCatalogItem, customEpic, customName, usageByKey]);

  function handleSelectCatalog(value) {
    setSelectedKey(value);
  }

  function handleAssociateSubmit(event) {
    event.preventDefault();
    if (selectedKey === NEW_FEATURE_VALUE) {
      const trimmed = customName.trim();
      if (!trimmed) return;
      onAssociateFeature(squad.key, { epic: customEpic || '—', name: trimmed, stories: assocStories });
      setCustomName('');
      return;
    }
    const found = availableCatalog.find((item) => item.catalogKey === selectedKey);
    if (!found) return;
    onAssociateFeature(squad.key, { epic: found.epic, name: found.name, stories: assocStories });
  }

  function commitName() {
    const clean = nameDraft.trim() || `Squad ${squad.key}`;
    setNameDraft(clean);
    onSquadNameChange(squad.key, clean);
    setEditingName(false);
  }

  const squadStories = squad.features.reduce((sum, f) => sum + Math.max(0, f.stories), 0);
  const squadHours = squadStories * avg;

  return (
    <section className="surface squad-scope" aria-label={`Escopo de ${squad.shortName}`}>
      <header className="squad-scope__head">
        <div className="squad-scope__identity">
          <span className="squad-scope__name-slot">
            <span className="squad-dot" style={{ background: `var(${squad.colorToken})` }} aria-hidden="true" />
            <span className="squad-id" hidden data-squad-key={squad.key}>
              {squad.key}
            </span>
            {editingName ? (
              <input
                type="text"
                className="squad-name-input is-editing"
                value={nameDraft}
                maxLength={40}
                autoFocus
                aria-label={`Nome da squad ${squad.key}`}
                onChange={(event) => setNameDraft(event.target.value)}
                onBlur={commitName}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') commitName();
                  if (event.key === 'Escape') {
                    setNameDraft(currentName);
                    setEditingName(false);
                  }
                }}
              />
            ) : (
              <button
                type="button"
                className="squad-name-trigger"
                onClick={() => {
                  setNameDraft(currentName);
                  setEditingName(true);
                }}
                title="Clique para editar o nome da squad"
              >
                <span>{currentName}</span>
                <Icon name="edit" size={12} />
              </button>
            )}
          </span>
          <span className="epic__meta tabular">
            {plural(squad.features.length, 'feature', 'features')} · {plural(squadStories, 'história', 'histórias')} · {fmtNumber(squadHours)} h
          </span>
        </div>

        <div className="squad-scope__controls">
          {isCustomSquad ? (
            <button
              type="button"
              className="btn btn--sm btn--danger"
              onClick={() => onRemoveSquad(squad.key)}
              title={`Excluir ${squad.shortName} da simulação`}
            >
              <Icon name="close" size={14} /> Remover squad
            </button>
          ) : null}
          <div className="squad-scope__people">
            <label htmlFor={`squad-people-${squad.key}`}>Profissionais</label>
            <div className="input-group input-group--people">
              <NumberInput
                id={`squad-people-${squad.key}`}
                className="input input--sm tabular"
                value={squad.people}
                onCommit={(value) => onPeopleChange(squad.key, value)}
                min={LIMITS.people.min}
                max={LIMITS.people.max}
                aria-label={`Profissionais de ${squad.shortName}`}
                invalidMessage="Informe de 0 a 25 profissionais."
              />
              <span className="input-group__unit">pess.</span>
            </div>
            <span className="surface-meta squad-scope__capacity tabular">({fmtNumber(squad.people * hpp)} h/sem)</span>
          </div>
        </div>
      </header>

      <form
        className={`squad-scope__assoc ${selectedKey === NEW_FEATURE_VALUE ? 'squad-scope__assoc--custom' : ''}`}
        onSubmit={handleAssociateSubmit}
      >
        <div className="field squad-scope__assoc-feature">
          <label className="field-label" htmlFor={`assoc-select-${squad.key}`}>
            Associar feature a {squad.shortName}
          </label>
          <select
            id={`assoc-select-${squad.key}`}
            className="input input--sm"
            value={selectedKey}
            onChange={(event) => handleSelectCatalog(event.target.value)}
          >
            {availableCatalog.map((item) => {
              const ownerNote =
                item.owners.length > 0
                  ? `${item.totalStories} US · em ${item.owners.map((o) => `${o.shortName}: ${o.stories} US`).join(', ')}`
                  : `sem squad · ref. ${item.defaultStories} US`;
              return (
                <option key={item.catalogKey} value={item.catalogKey}>
                  {item.epic !== '—' ? `${item.epic} · ` : ''}
                  {item.name} ({ownerNote})
                </option>
              );
            })}
            <option value={NEW_FEATURE_VALUE}>+ Nova feature personalizada…</option>
          </select>
        </div>

        {selectedKey === NEW_FEATURE_VALUE ? (
          <>
            <div className="field squad-scope__assoc-epic">
              <label className="field-label" htmlFor={`assoc-epic-${squad.key}`}>
                Épico
              </label>
              <select
                id={`assoc-epic-${squad.key}`}
                className="input input--sm"
                value={customEpic}
                onChange={(event) => setCustomEpic(event.target.value)}
              >
                {EPICS.map((epic) => (
                  <option key={epic} value={epic}>
                    {epic}
                  </option>
                ))}
                <option value="—">Sem épico</option>
              </select>
            </div>
            <div className="field squad-scope__assoc-custom">
              <label className="field-label" htmlFor={`assoc-name-${squad.key}`}>
                Nome da nova feature
              </label>
              <input
                id={`assoc-name-${squad.key}`}
                type="text"
                className="input input--sm"
                placeholder="Ex.: Portal de autoatendimento…"
                value={customName}
                maxLength={120}
                onChange={(event) => setCustomName(event.target.value)}
              />
            </div>
          </>
        ) : null}

        <div className="field squad-scope__assoc-stories">
          <label className="field-label" htmlFor={`assoc-us-${squad.key}`}>
            Histórias (US)
          </label>
          <div className="input-group input-group--us input-group--readonly">
              <input
                id={`assoc-us-${squad.key}`}
                type="text"
                readOnly
                className="input input--sm input--readonly tabular"
                value={assocStories}
                aria-label={`Histórias (US) calculadas para associar a ${squad.shortName}`}
                title="Quantidade calculada automaticamente (pode ser ajustada na tabela abaixo após associar)"
              />
              <span className="input-group__unit">US</span>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn--sm btn--primary squad-scope__assoc-btn"
            disabled={selectedKey === NEW_FEATURE_VALUE && !customName.trim()}
          >
            <Icon name="plus" size={14} /> Associar feature
          </button>
      </form>

      {squad.features.length === 0 ? (
        <p className="squad-scope__empty">
          Nenhuma feature associada a esta squad ainda. Selecione uma feature acima e informe a quantidade de histórias para compor a simulação.
        </p>
      ) : (
        <div className="table-scroll">
          <table className="data-table squad-scope__table">
            <colgroup>
              <col className="col-scope-epic" />
              <col className="col-scope-feature" />
              <col className="col-scope-squad" />
              <col className="col-scope-stories" />
              <col className="col-scope-hours" />
              <col className="col-scope-remove" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" className="cell-epic">Épico</th>
                <th scope="col" className="th-scope-feature">Feature</th>
                <th scope="col">Squad associada</th>
                <th scope="col" className="num">Histórias (US)</th>
                <th scope="col" className="cell-hours">Horas</th>
                <th scope="col" className="cell-remove">Remover</th>
              </tr>
            </thead>
            <tbody>
              {squad.features.map((feature) => {
                const schedule = result.features[feature.id];
                const usage = usageByKey.get(featureCatalogKey(feature.epic, feature.name));
                const isShared = (usage?.owners.length ?? 0) > 1;
                const totalFeatureStories = usage?.totalStories ?? feature.stories;
                const rowMax = isShared && totalFeatureStories > 0 ? totalFeatureStories : LIMITS.stories.max;
                return (
                  <tr key={feature.id}>
                    <td className="cell-center cell-epic">
                      <span className="epic-tag">{feature.epic || '—'}</span>
                    </td>
                    <th scope="row" className="cell-feature">
                      <div className="squad-scope__feature-cell">
                        <span>{feature.name}</span>
                        {isShared ? (
                          <span className="squad-scope__split-note tabular">
                            Dividida entre {usage.owners.length} squads · {feature.stories} de {totalFeatureStories} US
                          </span>
                        ) : null}
                      </div>
                    </th>
                    <td className="squad-scope__move-cell">
                      <select
                        className="input input--sm"
                        value={squad.key}
                        aria-label={`Squad associada a ${feature.name}`}
                        onChange={(event) => onMoveFeature(feature.id, event.target.value)}
                      >
                        {allSquads.map((target) => (
                          <option key={target.key} value={target.key}>
                            {target.shortName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="squad-scope__stories-cell">
                      <div className="input-group input-group--us">
                        <NumberInput
                          className="input input--sm tabular"
                          value={feature.stories}
                          onCommit={(value) => onStoriesChange(feature.id, value)}
                          min={LIMITS.stories.min}
                          max={rowMax}
                          aria-label={`Histórias (US) de ${feature.name} em ${squad.shortName}`}
                          invalidMessage={
                            rowMax < LIMITS.stories.max
                              ? `Informe de 0 a ${rowMax} histórias (total desta feature).`
                              : 'Informe de 0 a 200 histórias.'
                          }
                        />
                        <span className="input-group__unit">US</span>
                      </div>
                    </td>
                    <td className="cell-hours tabular">{fmtNumber(schedule?.effortHours ?? feature.stories * avg)}</td>
                    <td className="cell-center cell-remove">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => onRemoveFeature(feature.id)}
                        aria-label={`Desassociar ${feature.name} de ${squad.shortName}`}
                        title="Desassociar feature desta squad"
                      >
                        <Icon name="close" size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** Aba "Escopo das Squads": criação de squads e associação de features + histórias por squad. */
export default function SquadScopeTab({
  scenario,
  result,
  onCreateSquad,
  onSquadNameChange,
  onPeopleChange,
  onRemoveSquad,
  onAssociateFeature,
  onMoveFeature,
  onStoriesChange,
  onRemoveFeature,
  onNotify,
}) {
  const { premises, squads } = scenario;
  const { kpis } = result;
  const avg = premises.avgHoursPerStory;
  const hpp = premises.hoursPerPersonPerWeek;

  const [newSquadName, setNewSquadName] = useState('');
  const [newSquadPeople, setNewSquadPeople] = useState(2);
  const atLimit = squads.length >= MAX_SQUADS;

  const catalog = useMemo(() => buildCatalogWithUsage(squads), [squads]);
  const usageByKey = useMemo(() => new Map(catalog.map((item) => [item.catalogKey, item])), [catalog]);

  function handleCreateSquad(event) {
    event.preventDefault();
    if (atLimit) return;
    const trimmed = newSquadName.trim();
    onCreateSquad({ name: trimmed, people: newSquadPeople });
    setNewSquadName('');
    onNotify?.(trimmed ? `Squad "${trimmed}" criada e integrada à simulação.` : 'Nova squad criada e integrada à simulação.');
  }

  return (
    <div className="tabpanel">
      <section className="surface" aria-labelledby="squad-scope-summary">
        <header className="surface-head">
          <h2 id="squad-scope-summary" className="surface-title">Escopo das squads</h2>
          <span className="surface-meta">Crie squads e defina as features e histórias de cada squad na simulação</span>
        </header>

        <dl className="kpi-split kpi-split--4">
          <div>
            <dt>Squads ativas</dt>
            <dd className="tabular">{squads.length}</dd>
          </div>
          <div>
            <dt>Capacidade instalada</dt>
            <dd className="tabular">
              {kpis.totalPeople} · {fmtNumber(kpis.totalWeeklyCapacity)} h/sem
            </dd>
          </div>
          <div>
            <dt>Features associadas</dt>
            <dd className="tabular">{kpis.totalFeatures}</dd>
          </div>
          <div>
            <dt>Histórias ({avg} h/US)</dt>
            <dd className="tabular">
              {fmtNumber(kpis.totalStories)} · {fmtNumber(kpis.totalDemandHours)} h
            </dd>
          </div>
        </dl>

        <form className="squad-create-bar" onSubmit={handleCreateSquad}>
          <div className="field squad-create-bar__name">
            <label className="field-label" htmlFor="new-squad-name">
              Criar nova squad
            </label>
            <input
              id="new-squad-name"
              type="text"
              className="input"
              placeholder="Nome da squad (ex.: Squad Canais, Pagamentos…)"
              value={newSquadName}
              maxLength={40}
              onChange={(event) => setNewSquadName(event.target.value)}
            />
          </div>

          <div className="field squad-create-bar__people">
            <label className="field-label" htmlFor="new-squad-people">
              Profissionais
            </label>
            <div className="input-group">
              <NumberInput
                id="new-squad-people"
                className="input tabular"
                value={newSquadPeople}
                onCommit={setNewSquadPeople}
                min={LIMITS.people.min}
                max={LIMITS.people.max}
                invalidMessage="Informe de 0 a 25 profissionais."
              />
              <span className="input-group__unit">pess.</span>
            </div>
          </div>

          <button type="submit" className="btn btn--primary squad-create-bar__btn" disabled={atLimit}>
            <Icon name="plus" size={16} />
            {atLimit ? 'Limite atingido' : 'Criar squad'}
          </button>
        </form>
      </section>

      {squads.map((squad) => (
        <SquadScopeCard
          key={squad.key}
          squad={squad}
          allSquads={squads}
          catalog={catalog}
          usageByKey={usageByKey}
          result={result}
          hpp={hpp}
          avg={avg}
          onSquadNameChange={onSquadNameChange}
          onPeopleChange={onPeopleChange}
          onRemoveSquad={onRemoveSquad}
          onAssociateFeature={(squadKey, payload) => {
            const existing = usageByKey.get(featureCatalogKey(payload.epic, payload.name));
            onAssociateFeature(squadKey, payload);
            if (existing && existing.owners.length > 0) {
              onNotify?.(
                `Feature "${payload.name}" dividida entre ${existing.owners.length + 1} squads (${squad.shortName}: ${payload.stories} de ${existing.totalStories} US).`,
              );
            } else {
              onNotify?.(`Feature "${payload.name}" associada a ${squad.shortName} (${payload.stories} US).`);
            }
          }}
          onMoveFeature={(featureId, targetKey) => {
            const target = squads.find((s) => s.key === targetKey);
            onMoveFeature(featureId, targetKey);
            if (target) onNotify?.(`Feature transferida para ${target.shortName}.`);
          }}
          onStoriesChange={onStoriesChange}
          onRemoveFeature={(featureId) => {
            onRemoveFeature(featureId);
            onNotify?.(`Feature desassociada de ${squad.shortName}.`);
          }}
        />
      ))}
    </div>
  );
}
