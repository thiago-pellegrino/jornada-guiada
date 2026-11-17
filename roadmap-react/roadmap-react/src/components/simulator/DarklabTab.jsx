/** Aba "Darklab": etapas de Inception, Discovery e Value (conteúdo inicial, a detalhar). */
const PHASES = [
  {
    id: 'inception',
    title: 'Inception',
    text: 'Alinhamento de visão, objetivos e restrições do produto com os stakeholders.',
  },
  {
    id: 'discovery',
    title: 'Discovery',
    text: 'Investigação de problemas, hipóteses e soluções com usuários antes de comprometer o backlog.',
  },
  {
    id: 'value',
    title: 'Value',
    text: 'Definição de valor esperado, métricas de sucesso e priorização das entregas.',
  },
];

export default function DarklabTab() {
  return (
    <div className="context-grid context-grid--3">
      {PHASES.map((phase) => (
        <section key={phase.id} className="surface" aria-labelledby={`darklab-${phase.id}`}>
          <header className="surface-head">
            <h2 id={`darklab-${phase.id}`} className="surface-title">
              {phase.title}
            </h2>
          </header>
          <div className="prose">
            <p>{phase.text}</p>
          </div>
        </section>
      ))}
    </div>
  );
}
