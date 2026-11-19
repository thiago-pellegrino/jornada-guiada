import { useState } from 'react';
import { JOURNEY_STEPS, stageIndex, stageLabel } from '../../domain/journey/journeyEngine.js';
import { useJourney } from '../../journey/JourneyContext.jsx';
import Icon from '../ui/Icon.jsx';
import { goToStep } from './JourneyBits.jsx';

/** Etapas das abas de planejamento depois de Épicos (liberadas com o Backlog do Futuro, sem marca de concluída). */
const ETAPAS_PLANEJAMENTO = Object.freeze([
  { id: 'cronograma-gantt', label: 'Cronograma Gantt', tab: 'planejamento', view: 'gantt', reachedAt: null, availableAt: 'backlog' },
  { id: 'cronograma', label: 'Cronograma', tab: 'planejamento', view: 'grid', reachedAt: null, availableAt: 'backlog' },
  { id: 'resultados', label: 'Resultados', tab: 'resultados', reachedAt: null, availableAt: 'backlog' },
  { id: 'dashboards', label: 'Dashboards', tab: 'curva', reachedAt: null, availableAt: 'backlog' },
  { id: 'delta-builder', label: 'Delta Builder', tab: 'builder', reachedAt: null },
]);
const ETAPAS = Object.freeze([...JOURNEY_STEPS, ...ETAPAS_PLANEJAMENTO]);
const VISIVEIS = 6;

/**
 * Barra comum das abas da Jornada Guiada: projeto selecionado (identificador de toda a
 * jornada), etapas Contexto → DarkLabs → Projeto → Backlog e papel simulado.
 */
export default function ProjectBar({ current, view = null, className = '' }) {
  const { state, project, selectProject } = useJourney();
  const [aberto, setAberto] = useState(false);
  const idx = project ? stageIndex(project.stage) : -1;
  // Até Épicos: etapas 1–6. Nas abas seguintes: só as 6 últimas (Escopo das Squads → Dashboards).
  const posAtual = ETAPAS.findIndex((e) => e.tab === current && (!e.view || !view || e.view === view));
  const inicio = posAtual >= VISIVEIS ? ETAPAS.length - VISIVEIS : 0;
  const etapas = ETAPAS.slice(inicio, inicio + VISIVEIS);

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
        {etapas.map((step, j) => {
          const i = inicio + j;
          const atingida = Boolean(project && step.reachedAt && idx >= stageIndex(step.reachedAt));
          const disponivel = !step.availableAt || Boolean(project && idx >= stageIndex(step.availableAt));
          const atual = step.tab === current && (!step.view || !view || step.view === view);
          const classes = ['jg-step', atingida && 'is-reached', atual && 'is-current', disponivel ? 'is-available' : 'is-pending', step.availableAt && 'is-planning']
            .filter(Boolean)
            .join(' ');
          return (
            <li key={step.id} className={classes}>
              <button
                type="button"
                className="jg-step__btn"
                onClick={() => goToStep(step)}
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
