/** Aba "Backlog do Futuro": horizontes de evolução, oportunidades futuras e iniciativas candidatas (conteúdo inicial, a detalhar). */
const HORIZONS = [
  {
    id: 'horizonte-1',
    title: 'Oportunidades mapeadas',
    text: 'Ideias, melhorias e demandas identificadas junto às áreas de negócio para ciclos futuros além da janela atual.',
  },
  {
    id: 'horizonte-2',
    title: 'Hipóteses e priorização',
    text: 'Critérios de impacto, esforço estimado e dependências para qualificar quais temas avançam para Discovery.',
  },
  {
    id: 'horizonte-3',
    title: 'Próximas ondas de evolução',
    text: 'Visão de médio e longo prazo do portfólio para orientar capacidade e evolução contínua das squads.',
  },
];

export default function FutureBacklogTab() {
  return (
    <div className="context-grid context-grid--3">
      {HORIZONS.map((item) => (
        <section key={item.id} className="surface" aria-labelledby={`future-backlog-${item.id}`}>
          <header className="surface-head">
            <h2 id={`future-backlog-${item.id}`} className="surface-title">
              {item.title}
            </h2>
          </header>
          <div className="prose">
            <p>{item.text}</p>
          </div>
        </section>
      ))}
    </div>
  );
}
