/** Aba "Gestão dos Projetos": portfólio, fontes e governança dos projetos da Jornada Guiada (conteúdo inicial, a detalhar). */
const SECTIONS = [
  {
    id: 'portfolio',
    title: 'Portfólio de projetos',
    text: 'Cadastro, seleção e acompanhamento dos projetos ativos na Jornada Guiada, com visão consolidada de fases, escopo e progresso.',
  },
  {
    id: 'fontes-artefatos',
    title: 'Fontes, lotes e artefatos',
    text: 'Gestão dos documentos de origem, lotes de entrada e repositório único de artefatos gerados e revisados ao longo da jornada.',
  },
  {
    id: 'governanca',
    title: 'Governança, papéis e execuções',
    text: 'Controle de membros e permissões por projeto (Leitor, Editor, Aprovador e Administrador), histórico de revisões e execuções do Modo Turbo.',
  },
];

export default function ProjectsTab() {
  return (
    <div className="context-grid context-grid--3">
      {SECTIONS.map((item) => (
        <section key={item.id} className="surface" aria-labelledby={`projects-${item.id}`}>
          <header className="surface-head">
            <h2 id={`projects-${item.id}`} className="surface-title">
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

