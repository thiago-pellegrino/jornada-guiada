import { CAP, fichaReadiness, latestRevision, stageLabel } from '../../domain/journey/journeyEngine.js';
import { useJourney } from '../../journey/JourneyContext.jsx';
import { ReadinessBadge, goToTab } from '../journey/JourneyBits.jsx';
import { DARKLAB_INDEX } from './darklabMenu.js';
import DarklabMenuIcon from './DarklabMenuIcons.jsx';

function Cabecalho({ viewId }) {
  const entrada = DARKLAB_INDEX.get(viewId);
  const titulo = entrada?.item.label ?? (viewId === 'editar-perfil' ? 'Editar perfil' : viewId);
  return (
    <header className="dlv-head">
      <p className="dlv-crumb">
        DarkLabs{entrada?.group ? ` › ${entrada.group.label}` : ''}
      </p>
      <h2 className="dlv-title">
        {entrada ? <DarklabMenuIcon name={entrada.item.icon} size={22} /> : null}
        {titulo}
      </h2>
    </header>
  );
}

/** Tela provisória de um item do menu, até o layout definitivo ser enviado. */
export function DarklabPlaceholder({ viewId }) {
  const entrada = DARKLAB_INDEX.get(viewId);
  return (
    <div className="dlv">
      <Cabecalho viewId={viewId} />
      <section className="dlv-placeholder" role="status">
        <DarklabMenuIcon name={entrada?.item.icon ?? 'pencil'} size={34} />
        <p className="dlv-placeholder__title">Tela em definição</p>
        <p className="dlv-placeholder__text">
          A navegação até aqui já funciona. O conteúdo de “{entrada?.item.label ?? 'Editar perfil'}” será montado a partir do layout
          desta tela.
        </p>
        {entrada?.item.locked ? (
          <p className="dlv-placeholder__note">
            <DarklabMenuIcon name="lock" size={15} /> Acesso restrito a Aprovador e Administrador.
          </p>
        ) : null}
      </section>
    </div>
  );
}

/** Visão geral do DarkLabs com o andamento real do projeto selecionado. */
export function DarklabOverview({ onSelect }) {
  const { catalog, project } = useJourney();
  if (!project) {
    return (
      <div className="dlv">
        <Cabecalho viewId="visao-geral" />
        <section className="dlv-placeholder">
          <DarklabMenuIcon name="home" size={34} />
          <p className="dlv-placeholder__title">Nenhum projeto selecionado</p>
          <p className="dlv-placeholder__text">O DarkLabs trabalha sobre o contexto consolidado de um projeto.</p>
          <button type="button" className="btn btn--primary" onClick={() => goToTab('contexto')}>
            Criar projeto no Contexto
          </button>
        </section>
      </div>
    );
  }
  const motores = catalog.byPhase.darklab.filter((c) => c.number >= 1 && c.number <= 7);
  const feitos = motores.filter((m) => latestRevision(project, m.id)).length;
  const consolidado = Boolean(latestRevision(project, CAP.consolidar));
  const prontidao = fichaReadiness(project);
  return (
    <div className="dlv">
      <Cabecalho viewId="visao-geral" />
      <div className="dlv-kpis">
        <article className="dlv-kpi">
          <span>Projeto</span>
          <strong className="tabular">{project.code}</strong>
          <em>{project.name}</em>
        </article>
        <article className="dlv-kpi">
          <span>Etapa</span>
          <strong>{stageLabel(project.stage)}</strong>
          <em>{consolidado ? 'Contexto consolidado' : 'Contexto ainda não consolidado'}</em>
        </article>
        <article className="dlv-kpi">
          <span>Motores executados</span>
          <strong className="tabular">
            {feitos} de {motores.length}
          </strong>
          <em>M1 a M7</em>
        </article>
        <article className="dlv-kpi">
          <span>Ficha do projeto</span>
          <strong>
            <ReadinessBadge status={prontidao} />
          </strong>
          <em>02-darklab-008</em>
        </article>
      </div>
      <div className="dlv-actions">
        <button type="button" className="btn btn--primary" onClick={() => onSelect('jornada-7-motores')}>
          <DarklabMenuIcon name="infinity" size={16} /> Abrir a Jornada dos 7 motores
        </button>
      </div>
    </div>
  );
}
