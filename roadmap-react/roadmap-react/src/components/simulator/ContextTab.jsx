import { SCHEDULING_MODES } from '../../data/initialRoadmapData.js';
import { STATUS_META } from '../../domain/simulationEngine.js';
import Badge from '../ui/Badge.jsx';

const LEGEND = ['ON_TIME', 'POST_FREEZE', 'OUT_OF_WINDOW', 'NO_CAPACITY', 'OVERCAPACITY', 'EMPTY'];

/** Aba "Contexto": regras de cálculo e significado das situações de prazo do simulador. */
export default function ContextTab({ result }) {
  const { context } = result;

  return (
    <div className="context-grid">
      <section className="surface" aria-labelledby="ctx-rules">
        <header className="surface-head">
          <h2 id="ctx-rules" className="surface-title">Como o cálculo funciona</h2>
        </header>
        <div className="prose">
          <ul>
            <li>
              <strong>Capacidade semanal</strong> da squad = pessoas × jornada semanal.
            </li>
            <li>
              <strong>Esforço</strong> da feature = histórias × média de horas por história; <strong>semanas</strong> = esforço ÷ capacidade.
            </li>
            {SCHEDULING_MODES.map((item) => (
              <li key={item.id}>
                <strong>{item.label}:</strong> {item.description}
              </li>
            ))}
            <li>
              A coluna do <strong>Freezing</strong> nunca recebe alocação; o que passa de {context.lastBeforeFreezeCode} termina depois do congelamento e o que
              passa de {context.lastWeekCode} aparece como excedente.
            </li>
          </ul>
        </div>
      </section>

      <section className="surface" aria-labelledby="ctx-legend">
        <header className="surface-head">
          <h2 id="ctx-legend" className="surface-title">Situações de prazo</h2>
        </header>
        <div className="prose">
          <ul className="legend-list">
            {LEGEND.map((status) => (
              <li key={status}>
                <Badge variant={STATUS_META[status].variant}>{STATUS_META[status].label}</Badge>
                <span>{STATUS_META[status].description}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
