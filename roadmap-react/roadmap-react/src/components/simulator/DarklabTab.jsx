import { CAP, fichaReadiness, latestRevision } from '../../domain/journey/journeyEngine.js';
import { useJourney } from '../../journey/JourneyContext.jsx';
import Icon from '../ui/Icon.jsx';
import ProjectBar from '../journey/ProjectBar.jsx';
import CapabilityCard from '../journey/CapabilityCard.jsx';
import TurboPanel from '../journey/TurboPanel.jsx';
import { EmptyState, ReadinessBadge, SimulatedNote, goToTab } from '../journey/JourneyBits.jsx';

const FAIXAS = [
  { id: 'up', titulo: 'Upstream · AS IS', pergunta: 'Qual é o problema?', motores: [1, 2] },
  { id: 'down', titulo: 'Downstream · TO BE', pergunta: 'Qual é a solução?', motores: [3, 4, 5, 6, 7] },
];

/** Aba "DarkLab": sete motores em duas faixas, ficha do projeto e Modo Turbo. */
export default function DarklabTab() {
  const { catalog, project } = useJourney();

  if (!project) {
    return (
      <div className="jg-page">
        <ProjectBar current="darklab" />
        <EmptyState title="Crie o projeto no Contexto" action={<button type="button" className="btn btn--sm btn--primary" onClick={() => goToTab('contexto')}>Ir para o Contexto</button>}>
          O DarkLab trabalha sobre o contexto consolidado de um projeto.
        </EmptyState>
      </div>
    );
  }

  const consolidado = Boolean(latestRevision(project, CAP.consolidar));
  const motores = catalog.byPhase.darklab.filter((c) => c.number >= 1 && c.number <= 7);
  const ficha = latestRevision(project, CAP.ficha);
  const prontidao = fichaReadiness(project);
  const lacunas = ficha?.envelope?.data?.readiness?.blockingGapIds ?? [];

  return (
    <div className="jg-page">
      <ProjectBar current="darklab" />
      {!consolidado ? (
        <EmptyState title="Contexto ainda não consolidado" action={<button type="button" className="btn btn--sm" onClick={() => goToTab('contexto')}>Voltar ao Contexto</button>}>
          Os motores precisam da base consolidada (01-contexto-002). Consolide o contexto do projeto {project.code} primeiro.
        </EmptyState>
      ) : null}

      {FAIXAS.map((faixa) => (
        <section key={faixa.id} className={`jg-lane jg-lane--${faixa.id}`} aria-labelledby={`lane-${faixa.id}`}>
          <header className="jg-lane__head">
            <h2 id={`lane-${faixa.id}`}>{faixa.titulo}</h2>
            <span>{faixa.pergunta}</span>
          </header>
          <div className={`jg-grid ${faixa.id === 'up' ? 'jg-grid--2' : 'jg-grid--5'}`}>
            {motores
              .filter((m) => faixa.motores.includes(m.number))
              .map((m) => (
                <CapabilityCard key={m.id} capabilityId={m.id} compact={faixa.id === 'down'} />
              ))}
          </div>
        </section>
      ))}

      <section className="jg-lane jg-lane--project" aria-labelledby="lane-projeto">
        <header className="jg-lane__head">
          <h2 id="lane-projeto">Projeto · ficha do projeto</h2>
          <span>O DarkLab define o projeto {project.code}</span>
        </header>
        <div className="jg-grid jg-grid--2">
          <CapabilityCard
            capabilityId={CAP.ficha}
            extra={
              ficha ? (
                <div className="jg-readiness">
                  <ReadinessBadge status={prontidao} />
                  {lacunas.length ? <span className="jg-muted">Lacunas bloqueantes: {lacunas.join(', ')}</span> : null}
                </div>
              ) : null
            }
          />
          <section className="surface jg-gate" aria-labelledby="dl-next">
            <header className="surface-head">
              <h2 id="dl-next" className="surface-title">
                Próxima etapa
              </h2>
            </header>
            {prontidao && prontidao !== 'insuficiente' ? (
              <>
                <p>Projeto definido. A ficha está na página Projetos e o Backlog do Futuro está liberado.</p>
                <div className="jg-cap__actions">
                  <button type="button" className="btn btn--sm" onClick={() => goToTab('projetos')}>
                    Ver ficha em Projetos
                  </button>
                  <button type="button" className="btn btn--sm btn--primary" onClick={() => goToTab('backlog-futuro')}>
                    Ir para o Backlog <Icon name="chevronRight" size={14} />
                  </button>
                </div>
              </>
            ) : prontidao === 'insuficiente' ? (
              <p>A ficha saiu insuficiente: sem o Motor 7 não há sementes do backlog. Execute o M7 e regenere a ficha.</p>
            ) : (
              <p className="jg-muted">Execute ao menos o Motor 1 e gere a ficha do projeto. O Turbo faz tudo em sequência e termina na ficha.</p>
            )}
          </section>
        </div>
      </section>

      <TurboPanel
        phase="darklab"
        description="Executa M1 → M7 em sequência, cada motor lendo os anteriores, e termina na ficha do projeto (008). A cadeia é estrita: uma falha pula os motores seguintes e a ficha."
        disabledReason={consolidado ? null : 'Consolide o contexto primeiro.'}
      />
      <SimulatedNote />
    </div>
  );
}
