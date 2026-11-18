import { useRef, useState } from 'react';
import { CAP, checkEligibility, latestRevision, stageIndex } from '../../domain/journey/journeyEngine.js';
import { useJourney } from '../../journey/JourneyContext.jsx';
import Icon from '../ui/Icon.jsx';
import Badge from '../ui/Badge.jsx';
import AgentIcon from '../journey/AgentIcon.jsx';
import ProjectBar from '../journey/ProjectBar.jsx';
import CreateProjectForm from '../journey/CreateProjectForm.jsx';
import CapabilityCard from '../journey/CapabilityCard.jsx';
import TurboPanel from '../journey/TurboPanel.jsx';
import { SimulatedNote, fmtBytes, goToTab } from '../journey/JourneyBits.jsx';

const ACEITOS = '.pdf,.docx,.xlsx,.pptx,.csv,.txt,.md,.html,.htm';

/** Aba "Contexto": criação do projeto, fontes do lote, análise, consolidação e os oito resultados. */
export default function UpstreamTab() {
  const { catalog, project, can, pending, uploadFiles, runCapability, openArtifact } = useJourney();
  const [novo, setNovo] = useState(false);
  const inputRef = useRef(null);

  if (!project) {
    return (
      <div className="jg-page">
        <ProjectBar current="contexto" />
        <CreateProjectForm />
        <SimulatedNote />
      </div>
    );
  }

  const complementares = catalog.byPhase.contexto.filter((c) => c.number >= 3 && !c.isTurbo);
  const pendentes = project.sources.filter((s) => !latestRevision(project, CAP.analisar, s.id));
  const consolidado = Boolean(latestRevision(project, CAP.consolidar));

  return (
    <div className="jg-page">
      <ProjectBar current="contexto" />

      {novo ? <CreateProjectForm compact onDone={() => setNovo(false)} /> : null}

      <section className="surface" aria-labelledby="ctx-fontes">
        <header className="surface-head">
          <h2 id="ctx-fontes" className="surface-title">
            <Icon name="upload" size={15} /> 001 · Fontes do lote e análise por artefato
          </h2>
          <div className="surface-head__actions">
            {!novo ? (
              <button type="button" className="btn btn--sm btn--quiet" onClick={() => setNovo(true)}>
                <Icon name="folderPlus" size={14} /> Novo projeto
              </button>
            ) : null}
            <button type="button" className="btn btn--sm" disabled={!can('upload')} onClick={() => inputRef.current?.click()}>
              <Icon name="paperclip" size={14} /> Enviar arquivos
            </button>
            <button
              type="button"
              className="btn btn--sm btn--primary"
              disabled={!can('run') || !pendentes.length}
              onClick={() => pendentes.forEach((s) => runCapability(CAP.analisar, s.id))}
            >
              <AgentIcon size={15} /> Analisar pendentes ({pendentes.length})
            </button>
          </div>
        </header>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACEITOS}
          hidden
          onChange={(e) => {
            uploadFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <p className="jg-muted">
          Lote <span className="jg-mono">{project.batchId}</span>. Formatos aceitos: PDF, DOCX, XLSX, PPTX, CSV, TXT, MD e HTML. No
          protótipo só o nome, o tipo e o tamanho são registrados; o conteúdo não sai do seu computador.
        </p>
        {project.sources.length ? (
          <div className="table-scroll">
            <table className="jg-table">
              <thead>
                <tr>
                  <th scope="col">Fonte</th>
                  <th scope="col">Arquivo</th>
                  <th scope="col">Tamanho</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Análise</th>
                </tr>
              </thead>
              <tbody>
                {project.sources.map((s) => {
                  const rev = latestRevision(project, CAP.analisar, s.id);
                  const rodando = pending[`${CAP.analisar}::${s.id}`];
                  const elig = checkEligibility(project, catalog, CAP.analisar, s.id);
                  return (
                    <tr key={s.id}>
                      <td className="jg-mono">{s.id}</td>
                      <td>{s.name}</td>
                      <td className="tabular">{fmtBytes(s.size)}</td>
                      <td>
                        {rodando ? <Badge variant="warn">Analisando…</Badge> : rev ? <Badge variant="ok">Analisada · r{rev.revision}</Badge> : <Badge variant="neutral">Enviada</Badge>}
                      </td>
                      <td>
                        <button type="button" className="btn btn--sm" disabled={!can('run') || !elig.ok || rodando} onClick={() => runCapability(CAP.analisar, s.id)}>
                          <AgentIcon size={15} /> {rev ? 'Reanalisar' : 'Analisar'}
                        </button>
                        {rev ? (
                          <button type="button" className="btn btn--sm btn--quiet jg-ml" onClick={() => openArtifact(CAP.analisar, s.id)}>
                            <Icon name="fileText" size={14} /> Abrir
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="jg-empty__text">Nenhuma fonte ainda. Envie os documentos do projeto para começar.</p>
        )}
      </section>

      <div className="jg-grid jg-grid--2">
        <CapabilityCard capabilityId={CAP.consolidar} />
        <section className="surface jg-gate" aria-labelledby="ctx-next">
          <header className="surface-head">
            <h2 id="ctx-next" className="surface-title">
              Próxima etapa
            </h2>
          </header>
          {consolidado ? (
            <>
              <p>Contexto consolidado. O DarkLab já pode enquadrar o problema deste projeto.</p>
              <button type="button" className="btn btn--sm btn--primary" onClick={() => goToTab('darklab')}>
                Ir para o DarkLab <Icon name="chevronRight" size={14} />
              </button>
            </>
          ) : (
            <p className="jg-muted">
              Quando todas as fontes estiverem analisadas, consolide o contexto (002). A consolidação libera os oito resultados
              abaixo e o DarkLab{stageIndex(project.stage) >= 1 ? '' : ''}.
            </p>
          )}
        </section>
      </div>

      <section aria-labelledby="ctx-complementares">
        <h2 id="ctx-complementares" className="jg-section-title">
          Resultados complementares · 003 a 010
        </h2>
        <div className="jg-grid jg-grid--4">
          {complementares.map((c) => (
            <CapabilityCard key={c.id} capabilityId={c.id} compact />
          ))}
        </div>
      </section>

      <TurboPanel
        phase="contexto"
        description="Executa de ponta a ponta: 001 para cada fonte, 002 e os oito resultados na ordem das dependências. Uma falha marca como pulados só os dependentes."
        disabledReason={project.sources.length ? null : 'Envie ao menos uma fonte.'}
      />
      <SimulatedNote />
    </div>
  );
}
