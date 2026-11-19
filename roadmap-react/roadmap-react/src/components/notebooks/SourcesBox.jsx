import { useRef } from 'react';
import { CAP, checkEligibility, latestRevision } from '../../domain/journey/journeyEngine.js';
import { notebookSources } from '../../domain/journey/notebooks.js';
import { useJourney } from '../../journey/JourneyContext.jsx';
import Icon from '../ui/Icon.jsx';
import Badge from '../ui/Badge.jsx';
import AgentIcon from '../journey/AgentIcon.jsx';
import { fmtBytes } from '../journey/JourneyBits.jsx';

const ACEITOS = '.pdf,.docx,.xlsx,.pptx,.csv,.txt,.md,.html,.htm';

/** Box 001 dentro do notebook: fontes que vieram por ele, envio de arquivos e análise por artefato. */
export default function SourcesBox({ notebook, onNewProject }) {
  const { catalog, project, can, pending, addToNotebook, runCapability, openArtifact } = useJourney();
  const inputRef = useRef(null);
  const fontes = notebookSources(project, notebook);
  const pendentes = fontes.filter((s) => !latestRevision(project, CAP.analisar, s.id));

  return (
      <section className="surface" aria-labelledby={`ctx-fontes-${notebook.id}`}>
        <header className="surface-head">
          <h2 id={`ctx-fontes-${notebook.id}`} className="surface-title">
            <Icon name="upload" size={15} /> 001 · Fontes do lote e análise por artefato
          </h2>
          <div className="surface-head__actions">
            <button type="button" className="btn btn--sm btn--quiet" onClick={onNewProject} disabled={!can('createProject')}>
              <Icon name="folderPlus" size={14} /> Novo projeto
            </button>
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
            addToNotebook(notebook.id, { files: e.target.files });
            e.target.value = '';
          }}
        />
        <p className="jg-muted">
          Fontes do notebook <strong>{notebook.name}</strong> no lote <span className="jg-mono">{project.batchId}</span>. Formatos aceitos: PDF, DOCX, XLSX, PPTX, CSV, TXT, MD e HTML. No
          protótipo só o nome, o tipo e o tamanho são registrados; o conteúdo não sai do seu computador.
        </p>
        {fontes.length ? (
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
                {fontes.map((s) => {
                  const rev = latestRevision(project, CAP.analisar, s.id);
                  const rodando = pending[`${CAP.analisar}::${s.id}`];
                  const elig = checkEligibility(project, catalog, CAP.analisar, s.id);
                  return (
                    <tr key={s.id}>
                      <td className="jg-mono">{s.id}</td>
                      <td>{s.name}</td>
                      <td className="tabular">{fmtBytes(s.size)}</td>
                      <td>
                        {rodando ? <Badge variant="warn">Analisando…</Badge> : rev ? <Badge variant="ok">Analisada · R{rev.revision}</Badge> : <Badge variant="neutral">Enviada</Badge>}
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
          <p className="jg-empty__text">Nenhum arquivo neste notebook ainda. Envie os documentos para começar a análise.</p>
        )}
      </section>
  );
}
