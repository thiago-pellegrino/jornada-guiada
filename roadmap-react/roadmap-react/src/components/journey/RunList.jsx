import { useJourney } from '../../journey/JourneyContext.jsx';
import { RunStatus, fmtDateTime } from './JourneyBits.jsx';

const FASE = { contexto: 'Contexto', darklab: 'DarkLab', 'backlog-do-futuro': 'Backlog' };

/** Histórico de execuções do projeto (capacidades e Turbos). */
export default function RunList({ limit = 12 }) {
  const { catalog, project } = useJourney();
  const runs = project?.runs.slice(0, limit) ?? [];
  if (!runs.length) return <p className="jg-muted">Nenhuma execução neste projeto ainda.</p>;
  return (
    <div className="table-scroll">
      <table className="jg-table">
        <thead>
          <tr>
            <th scope="col">Quando</th>
            <th scope="col">Fase</th>
            <th scope="col">Execução</th>
            <th scope="col">Escopo</th>
            <th scope="col">Situação</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => {
            const cap = catalog.byId.get(r.capabilityId);
            const nos = r.nodes ? `${r.nodes.filter((n) => n.status === 'succeeded').length}/${r.nodes.length} nós` : `r${r.revision}`;
            return (
              <tr key={r.runId}>
                <td className="tabular">{fmtDateTime(r.startedAt)}</td>
                <td>{FASE[r.phase] ?? r.phase}</td>
                <td>
                  {r.kind === 'turbo' ? 'Modo Turbo' : cap?.title ?? r.capabilityId}
                  <span className="jg-muted"> · {nos}</span>
                </td>
                <td className="jg-mono">{r.scopeKey ?? 'projeto'}</td>
                <td>
                  <RunStatus status={r.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
