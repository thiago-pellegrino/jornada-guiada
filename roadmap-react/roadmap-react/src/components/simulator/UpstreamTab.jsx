/** Aba "Upstream: Criação de Contexto" (conteúdo inicial, a detalhar). */
const STEPS = [
  {
    id: 'problema',
    title: 'Problema e oportunidade',
    text: 'Registro do problema de negócio, do público afetado e da oportunidade que justifica a iniciativa.',
  },
  {
    id: 'objetivos',
    title: 'Objetivos e restrições',
    text: 'Metas esperadas, prazos, premissas e restrições que orientam o dimensionamento das squads.',
  },
  {
    id: 'stakeholders',
    title: 'Stakeholders',
    text: 'Patrocinadores, áreas envolvidas e responsáveis pelas decisões ao longo da jornada.',
  },
];

export default function UpstreamTab() {
  return (
    <div className="context-grid context-grid--3">
      {STEPS.map((step) => (
        <section key={step.id} className="surface" aria-labelledby={`upstream-${step.id}`}>
          <header className="surface-head">
            <h2 id={`upstream-${step.id}`} className="surface-title">
              {step.title}
            </h2>
          </header>
          <div className="prose">
            <p>{step.text}</p>
          </div>
        </section>
      ))}
    </div>
  );
}
