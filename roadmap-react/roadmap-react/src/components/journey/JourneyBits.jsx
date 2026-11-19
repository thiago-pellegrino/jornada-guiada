import Badge from '../ui/Badge.jsx';

/** Peças pequenas e utilitários de exibição da Jornada Guiada. */

export function goToTab(tab) {
  if (typeof window !== 'undefined') window.location.hash = `#${tab}`;
}

/** Vai para a aba da etapa; nas etapas do cronograma, também escolhe a visão (Gantt ou grade). */
export function goToStep(step) {
  if (typeof window === 'undefined') return;
  if (step.view) window.dispatchEvent(new CustomEvent('jornada:matrix-view', { detail: step.view }));
  goToTab(step.tab);
}

export function fmtDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function fmtBytes(n) {
  if (!n) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

const RUN_STATUS = {
  pending: { label: 'Aguardando', variant: 'neutral' },
  running: { label: 'Executando', variant: 'warn' },
  succeeded: { label: 'Concluído', variant: 'ok' },
  partial: { label: 'Parcial', variant: 'warn' },
  failed: { label: 'Falhou', variant: 'bad' },
  cancelled: { label: 'Cancelado', variant: 'neutral' },
  skipped: { label: 'Pulado', variant: 'neutral' },
};

export function RunStatus({ status }) {
  const meta = RUN_STATUS[status] ?? { label: status, variant: 'neutral' };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

const READINESS = {
  pronto_para_backlog: { label: 'Pronto para o backlog', variant: 'ok' },
  pronto_com_lacunas: { label: 'Pronto com lacunas', variant: 'warn' },
  insuficiente: { label: 'Insuficiente', variant: 'bad' },
};

export function ReadinessBadge({ status }) {
  if (!status) return <Badge variant="neutral">Sem ficha</Badge>;
  const meta = READINESS[status] ?? { label: status, variant: 'neutral' };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

const WORK_STATUS = ['pendente', 'em andamento', 'em aceite', 'concluído', 'impedido'];
const WORK_VARIANT = { pendente: 'neutral', 'em andamento': 'warn', 'em aceite': 'warn', concluído: 'ok', impedido: 'bad' };

export function DeliverableCounts({ deliverables }) {
  if (!deliverables?.length) return null;
  const contagem = Object.fromEntries(WORK_STATUS.map((s) => [s, deliverables.filter((d) => d.status === s).length]));
  return (
    <ul className="jg-counts" aria-label="Entregáveis por status">
      {WORK_STATUS.filter((s) => contagem[s]).map((s) => (
        <li key={s} className={`jg-counts__item jg-counts__item--${WORK_VARIANT[s]}`}>
          <span className="tabular">{contagem[s]}</span> {s}
        </li>
      ))}
    </ul>
  );
}

export function SimulatedNote({ children }) {
  return (
    <p className="jg-simulated">
      <strong>Protótipo:</strong>{' '}
      {children ?? 'execuções simuladas no navegador. Cada resultado é o exemplo mínimo da capacidade em especificações/, ajustado ao projeto.'}
    </p>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="jg-empty">
      <p className="jg-empty__title">{title}</p>
      {children ? <p className="jg-empty__text">{children}</p> : null}
      {action}
    </div>
  );
}
