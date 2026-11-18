import { useState } from 'react';
import { JOURNEY_STEPS, stageIndex, stageLabel } from '../../domain/journey/journeyEngine.js';
import { useJourney } from '../../journey/JourneyContext.jsx';
import Icon from '../ui/Icon.jsx';
import { goToTab } from './JourneyBits.jsx';

/**
 * Barra comum das abas da Jornada Guiada: projeto selecionado (identificador de toda a
 * jornada), etapas Contexto → DarkLabs → Projeto → Backlog e papel simulado.
 */
export default function ProjectBar({ current, className = '' }) {
  const { state, project, selectProject } = useJourney();
  const [aberto, setAberto] = useState(false);
  const idx = project ? stageIndex(project.stage) : -1;

  return (
    <section className={`jg-projectbar ${className}`.trim()} aria-label="Projeto da jornada">
      <div className="jg-projectbar__identity">
        {project ? (
          <>
            <span className="jg-code tabular">{project.code}</span>
            <div className="jg-projectbar__name">
              <strong>{project.name}</strong>
              <span>
                Etapa: {stageLabel(project.stage)} · <span className="jg-mono">{project.projectId}</span>
              </span>
            </div>
          </>
        ) : (
          <div className="jg-projectbar__name">
            <strong>Nenhum projeto selecionado</strong>
            <span>O projeto é criado no Contexto e acompanha todas as etapas.</span>
          </div>
        )}
      </div>

      <ol className="jg-steps" aria-label="Etapas da jornada">
        {JOURNEY_STEPS.map((step, i) => {
          const atingida = Boolean(project && step.reachedAt && idx >= stageIndex(step.reachedAt));
          const disponivel = !step.availableAt || Boolean(project && idx >= stageIndex(step.availableAt));
          const atual = step.tab === current;
          const classes = ['jg-step', atingida && 'is-reached', atual && 'is-current', disponivel ? 'is-available' : 'is-pending', step.availableAt && 'is-planning']
            .filter(Boolean)
            .join(' ');
          return (
            <li key={step.id} className={classes}>
              <button
                type="button"
                className="jg-step__btn"
                onClick={() => goToTab(step.tab)}
                aria-current={atual ? 'step' : undefined}
                title={disponivel ? undefined : 'Liberada quando o Backlog do Futuro do projeto for gerado'}
              >
                <span className="jg-step__num" aria-hidden="true">
                  {atingida ? <Icon name="check" size={12} /> : i + 1}
                </span>
                {step.label}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="jg-projectbar__controls">
        {state.projects.length > 1 ? (
          <label className="jg-inline-field">
            <span>Projeto</span>
            <select className="input input--sm" value={project?.projectId ?? ''} onChange={(e) => selectProject(e.target.value)}>
              {state.projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.code} · {p.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <button
          type="button"
          className={`icon-btn jg-help-btn ${aberto ? 'is-active' : ''}`}
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          aria-label="Como funciona"
          title="Como funciona"
        >
          <Icon name="info" size={18} />
        </button>
      </div>
      {aberto ? (
        <p className="jg-projectbar__help">
          O projeto nasce no Contexto com o código <span className="jg-mono">PRJ-NNN</span> e o identificador interno <span className="jg-mono">PRJ-NNN-AAAA-MM-DD-SS</span> (data de criação e sequência do dia). O DarkLabs o define na ficha do projeto;
          o Backlog do Futuro só começa com o projeto na etapa <em>Projeto definido</em>. As permissões vêm do seu papel no projeto. Nesta
          versão do protótipo tudo roda no navegador: execuções são simuladas a partir dos exemplos das especificações.
        </p>
      ) : null}
    </section>
  );
}
