import { useState } from 'react';
import { latestRevision } from '../../../domain/journey/journeyEngine.js';
import { useJourney } from '../../../journey/JourneyContext.jsx';
import DarklabMenuIcon from './DarklabMenuIcons.jsx';
import { situacaoDoMotor } from './roadmapData.js';
import { ATIVOS, IMPULSO_ETAPAS, OFERTA_ATUAL, PARCEIROS, PRATELEIRA, TIME, resumoDaProposta } from './vamosAlemData.js';

const PROPOSTA_KEY = (id) => `jornada.darklab.proposta.${id ?? 'sem-projeto'}`;

function lerProposta(projectId) {
  try {
    const v = JSON.parse(window.localStorage.getItem(PROPOSTA_KEY(projectId)) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** DarkLabs › Vamos além?: proposta de continuidade, prateleira modular e time multidisciplinar Capgemini. */
export default function DarklabVamosAlemView({ onSelect }) {
  const { catalog, project, pending, notify } = useJourney();
  const projectId = project?.projectId ?? null;
  const [proposta, setProposta] = useState(() => lerProposta(projectId));
  const [projetoAtual, setProjetoAtual] = useState(projectId);
  if (projectId !== projetoAtual) {
    setProjetoAtual(projectId);
    setProposta(lerProposta(projectId));
  }

  const nomeProjeto = project?.name ?? 'projeto atual';
  const motores = catalog.byPhase.darklab.filter((c) => c.number >= 1 && c.number <= 7);
  const situacao = Object.fromEntries(motores.map((m) => [m.number, project ? situacaoDoMotor(project, catalog, m, pending) : 'dependencia']));
  const comResultado = project ? motores.filter((m) => latestRevision(project, m.id)).length : 0;
  const atual = PRATELEIRA.find((o) => o.id === OFERTA_ATUAL);

  function salvar(lista) {
    setProposta(lista);
    try {
      window.localStorage.setItem(PROPOSTA_KEY(projectId), JSON.stringify(lista));
    } catch {
      /* ignora */
    }
  }
  const alternar = (id) => salvar(proposta.includes(id) ? proposta.filter((x) => x !== id) : [...proposta, id]);
  async function copiar() {
    const texto = resumoDaProposta({ projeto: project ? `${project.code} · ${project.name}` : null, ids: proposta });
    try {
      await navigator.clipboard.writeText(texto);
      notify?.('Resumo da proposta copiado.');
    } catch {
      notify?.('Não foi possível copiar o resumo neste navegador.');
    }
  }

  return (
    <div className="jg-page va">
      {/* Abertura */}
      <div className="va-top">
        <section className="mj-hero va-hero" aria-labelledby="va-title">
          <span className="va-hero__chevrons" aria-hidden="true">
            »
          </span>
          <p className="mj-eyebrow">Encerramento · continuidade possível</p>
          <h2 id="va-title" className="va-hero__title">
            Vamos além?
          </h2>
          <p className="va-hero__lead">
            O futuro desenhado pelo <strong>{nomeProjeto}</strong> pode avançar para execução por meio de uma proposta de continuidade. DarkLabs
            Impulso organiza sinais, soluções, parceiros e provas de conceito para ajudar a transformar oportunidades em próximos passos concretos.
          </p>
          <p className="va-disclaimer">
            <DarklabMenuIcon name="shield" size={16} />
            Apresentação propositiva: não representa contratação, compromisso de execução ou garantia de sucesso. Qualquer continuidade depende de
            alinhamento, escopo, aprovação e contratação futura.
          </p>
        </section>

        <aside className="ar-card va-applied" aria-label="Produto aplicado ao projeto atual">
          <p className="ar-eyebrow">Produto aplicado ao projeto atual</p>
          <h3 className="va-applied__title">{atual.nome}</h3>
          <p className="ar-sub">
            {atual.frase}. A nomenclatura do produto foi atualizada; o escopo, o cronograma real e os status documentados do {nomeProjeto} permanecem
            inalterados.
          </p>
          <span className="va-pill va-pill--ok">
            <span className="va-pill__dot" aria-hidden="true" /> Aplicado ao {nomeProjeto}
          </span>
          {project ? (
            <button type="button" className="va-applied__link" onClick={() => onSelect?.('jornada-7-motores')}>
              <DarklabMenuIcon name="infinity" size={14} /> {comResultado} de 7 motores com resultado neste projeto
            </button>
          ) : null}
        </aside>
      </div>

      {/* DarkLabs Impulso */}
      <section className="ar-card va-impulso" aria-labelledby="va-impulso-title">
        <div className="va-sec-head">
          <div>
            <p className="ar-eyebrow ar-eyebrow--accent">DarkLabs Impulso</p>
            <h3 id="va-impulso-title" className="va-h2">
              Da oportunidade à solução.
            </h3>
            <p className="ar-sub">
              Proposta de jornada acelerada para mapear sinais, criar pílulas de solução, aproximar parceiros e desenhar a solução ideal para o
              negócio — sustentada por especialistas Capgemini e pelo ecossistema de parceiros.
            </p>
          </div>
          <span className="va-pill">
            <span className="va-pill__dot" aria-hidden="true" /> Proposta futura · não contratada
          </span>
        </div>
        <ol className="va-steps">
          {IMPULSO_ETAPAS.map((e) => (
            <li key={e.n} className="va-step">
              <span className="va-step__n tabular">{e.n}</span>
              <DarklabMenuIcon name={e.icone} size={22} className="va-step__icon" />
              <strong>{e.titulo}</strong>
              <ul>
                {e.itens.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        <p className="va-loop">
          <DarklabMenuIcon name="refresh" size={18} />
          <span>
            <strong>Aprendizado contínuo:</strong> novos sinais retroalimentam o ciclo, as hipóteses e a solução.
          </span>
        </p>
        <div className="va-two">
          <div className="va-box">
            <p className="ar-eyebrow">Parceiros estratégicos</p>
            <h4 className="va-h4">Ecossistema global para transformar oportunidades em negócios reais.</h4>
            <ul className="va-chips">
              {PARCEIROS.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
          <div className="va-box">
            <p className="ar-eyebrow">Inteligência relacional e digital assets</p>
            <h4 className="va-h4">Base para decisões mais inteligentes.</h4>
            <ul className="va-assets">
              {ATIVOS.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Prateleira */}
      <section aria-labelledby="va-shelf-title">
        <div className="va-shelf-head">
          <div>
            <p className="ar-eyebrow ar-eyebrow--accent">Prateleira de serviços</p>
            <h3 id="va-shelf-title" className="va-h2">
              Capacidades modulares para cada próximo passo.
            </h3>
          </div>
          <p className="ar-sub">
            As ofertas podem ser combinadas conforme o problema, a maturidade e a decisão desejada. Marque as que fazem sentido para montar a proposta
            de continuidade do {nomeProjeto}.
          </p>
        </div>
        <ul className="va-shelf">
          {PRATELEIRA.map((o) => {
            const aplicada = o.id === OFERTA_ATUAL;
            const marcada = proposta.includes(o.id);
            return (
              <li key={o.id} className={`va-offer ${aplicada ? 'is-applied' : ''} ${marcada ? 'is-selected' : ''}`} style={{ '--oc': o.cor }}>
                <div className="va-offer__top">
                  <span className={`va-pill ${aplicada ? 'va-pill--ok' : ''}`}>
                    <span className="va-pill__dot" aria-hidden="true" /> {aplicada ? `Aplicado ao ${nomeProjeto}` : o.selo}
                  </span>
                  <DarklabMenuIcon name={o.icone} size={20} className="va-offer__icon" />
                </div>
                <h4 className="va-offer__name">{o.nome}</h4>
                <p className="va-offer__phrase">{o.frase}</p>
                <p className="va-offer__term">{o.prazo}</p>
                <p className="va-offer__text">{o.texto}</p>
                <p className="va-offer__motors">
                  {o.motores.map((n) => (
                    <span key={n} title={`Motor ${n}`}>
                      <span className={`mj-dot mj-dot--${situacao[n]}`} aria-hidden="true" /> M{n}
                    </span>
                  ))}
                  <em>motores que a oferta aprofunda</em>
                </p>
                <p className="va-offer__team">
                  <DarklabMenuIcon name="users" size={15} /> Viabilizada pela equipe multidisciplinar Capgemini e seus conhecimentos.
                </p>
                {aplicada ? null : (
                  <button type="button" className={`va-offer__pick ${marcada ? 'is-on' : ''}`} aria-pressed={marcada} onClick={() => alternar(o.id)}>
                    {marcada ? <DarklabMenuIcon name="check" size={14} /> : null}
                    {marcada ? 'Na proposta' : 'Incluir na proposta'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {proposta.length ? (
          <div className="va-summary" role="status">
            <DarklabMenuIcon name="file" size={18} />
            <p>
              <strong>Proposta de continuidade:</strong>{' '}
              {PRATELEIRA.filter((o) => proposta.includes(o.id))
                .map((o) => o.nome)
                .join(' + ')}
            </p>
            <button type="button" className="btn btn--sm" onClick={() => salvar([])}>
              Limpar
            </button>
            <button type="button" className="btn btn--sm btn--primary" onClick={copiar}>
              Copiar resumo
            </button>
          </div>
        ) : null}
      </section>

      {/* Time multidisciplinar */}
      <section className="va-team" aria-labelledby="va-team-title">
        <div className="va-sec-head">
          <div>
            <p className="mj-eyebrow">Capgemini · conhecimento multidisciplinar</p>
            <h3 id="va-team-title" className="va-h2 va-h2--light">
              Tecnologia ganha valor quando pessoas experientes orquestram a jornada.
            </h3>
            <p className="va-team__lead">
              Todas as ofertas da prateleira são viabilizadas por uma equipe multidisciplinar Capgemini e seus conhecimentos de estratégia, produto,
              negócio, tecnologia, experiência, dados e valor.
            </p>
          </div>
          <span className="va-pill va-pill--light">
            <span className="va-pill__dot" aria-hidden="true" /> Pessoas + conhecimento + tecnologia
          </span>
        </div>
        <ul className="va-roles">
          {TIME.map((t) => (
            <li key={t.id} className={`va-role va-role--${t.id}`}>
              <span className="va-role__icon" aria-hidden="true">
                <DarklabMenuIcon name={t.icone} size={20} />
              </span>
              <strong>{t.titulo}</strong>
              <p>{t.texto}</p>
              <ul>
                {t.itens.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
