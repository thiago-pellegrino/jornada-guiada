import ProjectBar from '../journey/ProjectBar.jsx';
import { useJourney } from '../../journey/JourneyContext.jsx';
import { EmptyState, goToTab } from '../journey/JourneyBits.jsx';
import DarklabsJornada from '../darklabs/DarklabsJornada.jsx';

/**
 * Aba "DarkLabs" da Jornada Guiada: barra do projeto e a jornada do DarkLabs (triagem, prateleira,
 * squad, 7 motores com gates, memória, dossiê e ganhos). A simulação é guardada por projeto.
 * As telas anteriores do DarkLabs continuam em components/darklab e no Portal DarkLabs.
 */
export default function DarklabTab() {
  const { project } = useJourney();
  return (
    <div className="jg-page">
      <ProjectBar current="darklab" />
      {project ? (
        <DarklabsJornada key={project.projectId} />
      ) : (
        <EmptyState
          title="Nenhum projeto selecionado"
          action={
            <button type="button" className="btn btn--sm btn--primary" onClick={() => goToTab('contexto')}>
              Criar projeto no Contexto
            </button>
          }
        >
          A jornada do DarkLabs é guardada por projeto. Crie ou selecione um projeto no Contexto para começar.
        </EmptyState>
      )}
    </div>
  );
}
