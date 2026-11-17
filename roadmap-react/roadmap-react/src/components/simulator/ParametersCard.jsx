import { useEffect, useRef, useState } from 'react';
import { LIMITS, BASE_SQUAD_KEYS, MAX_SQUADS } from '../../data/initialRoadmapData.js';
import { fmtNumber, plural } from '../../domain/format.js';
import SliderField from '../ui/SliderField.jsx';
import Icon from '../ui/Icon.jsx';

const STORAGE_KEY = 'roadmap.paramsSquads.v1';
const COLLAPSE_KEY = 'roadmap.paramsCollapsed.v1';

function readCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

function readShown(validKeys) {
  try {
    const list = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(list) ? list.filter((key) => validKeys.includes(key)) : [];
  } catch {
    return [];
  }
}

function SquadNameHeader({ squad, hpp, isNew, hasScope, onSquadNameChange }) {
  const currentName = squad.name || `Squad ${squad.key}`;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentName);
  const moduleName = squad.title.split(' - ')[0];

  useEffect(() => {
    if (!editing) setDraft(currentName);
  }, [currentName, editing]);

  function commitEdit() {
    const clean = draft.trim() || `Squad ${squad.key}`;
    setDraft(clean);
    onSquadNameChange?.(squad.key, clean);
    setEditing(false);
  }

  const inlineNote =
    isNew && !hasScope
      ? `Squad nova — informe as histórias de "${squad.features[0]?.name}" na matriz.`
      : `Em múltiplos da jornada de ${hpp} h por profissional.`;

  return (
    <span className="squad-label-group">
      <span className="squad-dot" style={{ background: `var(${squad.colorToken})` }} aria-hidden="true" />
      <span className="squad-id" hidden data-squad-key={squad.key}>
        {squad.key}
      </span>
      {editing ? (
        <input
          type="text"
          className="squad-name-input is-editing"
          value={draft}
          maxLength={40}
          autoFocus
          aria-label={`Nome da squad ${squad.key}`}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            if (next.trim()) onSquadNameChange?.(squad.key, next);
          }}
          onBlur={commitEdit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commitEdit();
            if (event.key === 'Escape') {
              setDraft(currentName);
              onSquadNameChange?.(squad.key, currentName);
              setEditing(false);
            }
          }}
        />
      ) : (
        <button
          type="button"
          className="squad-name-trigger"
          onClick={() => {
            setDraft(currentName);
            setEditing(true);
          }}
          aria-label={`Editar nome da squad ${squad.key} (atual: ${currentName})`}
          title="Clique para editar o nome da squad"
        >
          <span>{currentName}</span>
          <Icon name="edit" size={12} />
        </button>
      )}
      <span className="squad-module-tag">· {moduleName}</span>
      <span className="squad-inline-hint">{inlineNote}</span>
    </span>
  );
}

/**
 * Cartão "Parâmetros da simulação": média de horas por história e, por squad adicionada,
 * um controle deslizante das horas semanais da squad (múltiplos da jornada por profissional).
 */
export default function ParametersCard({
  scenario,
  result,
  onAvgChange,
  onPeopleChange,
  onSquadNameChange,
  onAddSquad,
  onRemoveSquad,
}) {
  const { premises, squads } = scenario;
  const hpp = premises.hoursPerPersonPerWeek;
  const [shown, setShownState] = useStateStored(squads.map((squad) => squad.key));
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const lastAddedRef = useRef(null);
  const listRef = useRef(null);

  const hiddenBase = squads.filter((squad) => BASE_SQUAD_KEYS.includes(squad.key) && !shown.includes(squad.key));
  const visible = squads.filter((squad) => !BASE_SQUAD_KEYS.includes(squad.key) || shown.includes(squad.key));
  const atLimit = hiddenBase.length === 0 && squads.length >= MAX_SQUADS;

  function handleAdd() {
    if (hiddenBase.length > 0) {
      lastAddedRef.current = hiddenBase[0].key;
      setShownState([...shown, hiddenBase[0].key]);
    } else {
      lastAddedRef.current = 'new';
      onAddSquad();
    }
  }

  function handleRemove(squad) {
    if (BASE_SQUAD_KEYS.includes(squad.key)) setShownState(shown.filter((key) => key !== squad.key));
    else onRemoveSquad(squad.key);
  }

  function toggleCollapsed() {
    setCollapsed((value) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, value ? '0' : '1');
      } catch {
        /* sem armazenamento */
      }
      return !value;
    });
  }

  useEffect(() => {
    if (!lastAddedRef.current) return;
    const inputs = listRef.current?.querySelectorAll('.number-field__input');
    inputs?.[inputs.length - 1]?.focus();
    lastAddedRef.current = null;
  }, [visible.length]);

  return (
    <section className={`surface ${collapsed ? 'is-collapsed' : ''}`} aria-labelledby="params-title">
      <header className="surface-head">
        <h2 id="params-title" className="surface-title">Parâmetros da simulação</h2>
        <div className="surface-head__actions">
          <span className="surface-meta tabular">
            {plural(result.kpis.totalPeople, 'profissional', 'profissionais')} · {fmtNumber(result.kpis.totalWeeklyCapacity)} h/sem
          </span>
          <button
            type="button"
            className="btn btn--sm btn--collapse"
            aria-expanded={!collapsed}
            aria-controls="params-body"
            onClick={toggleCollapsed}
          >
            <Icon name="chevronDown" size={15} className={collapsed ? '' : 'is-flipped'} />
            {collapsed ? 'Expandir' : 'Recolher'}
          </button>
        </div>
      </header>

      <div id="params-body" hidden={collapsed}>
        <div className="slider-stack">
          <SliderField
            label="Média de horas por história"
            value={premises.avgHoursPerStory}
            onChange={onAvgChange}
            min={LIMITS.avgHoursPerStory.min}
            max={LIMITS.avgHoursPerStory.max}
            sliderMin={LIMITS.avgHoursPerStory.sliderMin}
            sliderMax={LIMITS.avgHoursPerStory.sliderMax}
            unit="h"
            ticks={[
              { value: 16, label: '16 h (Mínimo)' },
              { value: 56, label: '56 h (Referência)' },
              { value: 120, label: '120 h (Teto)' },
            ]}
          />
        </div>

        <div className="squad-params">
          <div className="squad-params__head">
            <h3 className="squad-params__title">Horas semanais por squad</h3>
            <button type="button" className="btn btn--sm" onClick={handleAdd} disabled={atLimit}>
              <Icon name="users" size={15} />
              {atLimit ? 'Limite de squads atingido' : 'Adicionar squad'}
            </button>
          </div>

          {visible.length === 0 ? (
            <p className="field-hint">
              Nenhuma squad na lista. Clique em Adicionar squad para ajustar as horas semanais de uma squad; ela compõe a simulação na hora
              ({plural(result.kpis.totalPeople, 'profissional', 'profissionais')} no total hoje).
            </p>
          ) : (
            <div className="slider-stack" ref={listRef}>
              {visible.map((squad) => {
                const hours = squad.people * hpp;
                const isNew = !BASE_SQUAD_KEYS.includes(squad.key);
                const hasScope = squad.features.some((feature) => feature.stories > 0);
                return (
                  <div key={squad.key} className="squad-slider">
                    <SliderField
                      label={squad.shortName}
                      labelNode={
                        <SquadNameHeader
                          squad={squad}
                          hpp={hpp}
                          isNew={isNew}
                          hasScope={hasScope}
                          onSquadNameChange={onSquadNameChange}
                        />
                      }
                      value={hours}
                      onChange={(value) => onPeopleChange(squad.key, Math.round(value / hpp))}
                      min={0}
                      max={LIMITS.people.max * hpp}
                      sliderMin={0}
                      sliderMax={LIMITS.people.sliderMax * hpp}
                      step={hpp}
                      unit="h"
                      valueText={`${fmtNumber(hours)} h/sem · ${plural(squad.people, 'pessoa', 'pessoas')}`}
                      ticks={[
                        { value: 0, label: '0 h' },
                        { value: 6 * hpp, label: `${fmtNumber(6 * hpp)} h` },
                        { value: 12 * hpp, label: `${fmtNumber(12 * hpp)} h (Teto do controle)` },
                      ]}
                    />
                    <button
                      type="button"
                      className="icon-btn squad-slider__remove"
                      onClick={() => handleRemove(squad)}
                      aria-label={isNew ? `Remover ${squad.shortName} da simulação` : `Remover ${squad.shortName} desta lista (a squad continua na simulação)`}
                      title={isNew ? 'Remover a squad da simulação' : 'Remover da lista (a squad continua na simulação)'}
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** Lista de squads do catálogo que aparecem na lista de horas (persistida no navegador). */
function useStateStored(validKeys) {
  const [shown, setShown] = useState(() => readShown(validKeys));
  const set = (next) => {
    setShown(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* sem armazenamento */
    }
  };
  return [shown, set];
}
