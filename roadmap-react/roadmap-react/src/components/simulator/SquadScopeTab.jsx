import { useEffect, useMemo, useState } from 'react';
import {
  BASE_SQUAD_KEYS,
  EPICS,
  FEATURE_CATALOG,
  LIMITS,
  MAX_SQUADS,
} from '../../data/initialRoadmapData.js';
import { STATUS_META } from '../../domain/simulationEngine.js';
import { fmtNumber, plural } from '../../domain/format.js';
import Badge from '../ui/Badge.jsx';
import Icon from '../ui/Icon.jsx';
import NumberInput from '../ui/NumberInput.jsx';

const NEW_FEATURE_VALUE = '__new__';

function buildCatalogWithUsage(squads) {
  const map = new Map();
  for (const item of FEATURE_CATALOG) {
    map.set(item.catalogKey, { ...item, owners: [] });
  }
  for (const squad of squads) {
    for (const feature of squad.features) {
      const epic = feature.epic || '—';
      const key = `${epic}||${feature.name}`;
      if (!map.has(key)) {
        map.set(key, { catalogKey: key, epic, name: feature.name, defaultStories: feature.stories || 1, owners: [] });
      }
      map.get(key).owners.push({ squadKey: squad.key, shortName: squad.shortName, stories: feature.stories });
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

function SquadScopeCard({
  squad,
  diag,
  allSquads,
  catalog,
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
  const meta = STATUS_META[diag?.status] || STATUS_META.EMPTY;
  const moduleName = squad.title.split(' - ')[0];

  // Features do catálogo que ainda não estão associadas a esta squad
  const inThisSquad = useMemo(
    () => new Set(squad.features.map((f) => `${f.epic || '—'}||${f.name}`)),
    [squad.features],
  );
  const availableCatalog = useMemo(
    () => catalog.filter((item) => !inThisSquad.has(item.catalogKey)),
    [catalog, inThisSquad],
  );

  const [selectedKey, setSelectedKey] = useState(() => availableCatalog[0]?.catalogKey || NEW_FEATURE_VALUE);
  const [assocStories, setAssocStories] = useState(() => availableCatalog[0]?.defaultStories ?? 5);
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
      if (first) {
        setSelectedKey(first.catalogKey);
        setAssocStories(first.defaultStories ?? 5);
      } else {
        setSelectedKey(NEW_FEATURE_VALUE);
      }
    }
  }, [availableCatalog, selectedKey]);

  function handleSelectCatalog(value) {
    setSelectedKey(value);
    if (value !== NEW_FEATURE_VALUE) {
      const found = availableCatalog.find((item) => item.catalogKey === value);
      if (found) setAssocStories(found.defaultStories ?? 5);
    }
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
          <span className="squad-module-tag">· {moduleName}</span>
          <span className="epic__meta tabular">
            {plural(squad.features.length, 'feature', 'features')} · {plural(squadStories, 'história', 'histórias')} · {fmtNumber(squadHours)} h
          </span>
        </div>

        <div className="squad-scope__controls">
          <label className="squad-scope__people">
            <span>Profissionais</span>
            <NumberInput
              className="cell-input cell-input--boxed tabular"
              value={squad.people}
              onCommit={(value) => onPeopleChange(squad.key, value)}
              min={LIMITS.people.min}
              max={LIMITS.people.max}
              aria-label={`Profissionais de ${squad.shortName}`}
              invalidMessage="Informe de 0 a 25 profissionais."
            />
            <span className="surface-meta tabular">({fmtNumber(squad.people * hpp)} h/sem)</span>
          </label>
          <Badge variant={meta.variant}>{meta.label}</Badge>
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
        </div>
      </header>

      <form className="squad-scope__assoc" onSubmit={handleAssociateSubmit}>
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
                  ? `em ${item.owners.map((o) => `${o.shortName}: ${o.stories} US`).join(', ')}`
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
          <NumberInput
            id={`assoc-us-${squad.key}`}
            className="input input--sm tabular"
            value={assocStories}
            onCommit={setAssocStories}
            min={LIMITS.stories.min}
            max={LIMITS.stories.max}
            invalidMessage="Informe de 0 a 200 histórias."
          />
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
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Épico</th>
                <th scope="col">Feature</th>
                <th scope="col">Squad associada</th>
                <th scope="col" className="num">Histórias (US)</th>
                <th scope="col" className="num">Horas</th>
                <th scope="col">Situação</th>
                <th scope="col">Remover</th>
              </tr>
            </thead>
            <tbody>
              {squad.features.map((feature) => {
                const schedule = result.features[feature.id];
                const fMeta = STATUS_META[schedule?.status] || STATUS_META.EMPTY;
                return (
                  <tr key={feature.id}>
                    <td className="cell-center">
                      <span className="epic-tag">{feature.epic || '—'}</span>
                    </td>
                    <th scope="row">{feature.name}</th>
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
                      <NumberInput
                        className="cell-input cell-input--boxed tabular"
                        value={feature.stories}
                        onCommit={(value) => onStoriesChange(feature.id, value)}
                        min={LIMITS.stories.min}
                        max={LIMITS.stories.max}
                        aria-label={`Histórias (US) de ${feature.name} em ${squad.shortName}`}
                        invalidMessage="Informe de 0 a 200 histórias."
                      />
                    </td>
                    <td className="num tabular">{fmtNumber(schedule?.effortHours ?? feature.stories * avg)}</td>
                    <td className="cell-center">
                      <Badge variant={fMeta.variant}>{fMeta.label}</Badge>
                    </td>
                    <td className="cell-center">
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
          diag={result.squads.find((s) => s.squadKey === squad.key)}
          allSquads={squads}
          catalog={catalog}
          result={result}
          hpp={hpp}
          avg={avg}
          onSquadNameChange={onSquadNameChange}
          onPeopleChange={onPeopleChange}
          onRemoveSquad={onRemoveSquad}
          onAssociateFeature={(squadKey, payload) => {
            onAssociateFeature(squadKey, payload);
            onNotify?.(`Feature "${payload.name}" associada a ${squad.shortName} (${payload.stories} US).`);
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
