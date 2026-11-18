import { useEffect, useState } from 'react';
import { checkEligibility, latestRevision } from '../../domain/journey/journeyEngine.js';
import { DarklabsMark } from '../auth/LoginScreen.jsx';
import { useJourney } from '../../journey/JourneyContext.jsx';
import DarklabMenuIcon from './DarklabMenuIcons.jsx';

/** Situação de um motor, do mais avançado ao menos: aceito, aguardando aceite, em andamento, dependência aberta, não iniciado. */
export const MOTOR_STATUS = Object.freeze({
  aceito: { label: 'Execução aceita', legend: 'executado e aceito' },
  produzido: { label: 'Aguardando aceite', legend: 'produzido · aceite pendente' },
  andamento: { label: 'Em andamento', legend: 'em andamento' },
  dependencia: { label: 'Dependência aberta', legend: 'dependência aberta' },
  nao: { label: 'Não iniciado', legend: 'não iniciado' },
});

export function motorStatus(project, catalog, cap, pending) {
  if (pending?.[`${cap.id}::projeto`]) return 'andamento';
  const rev = latestRevision(project, cap.id);
  if (rev) return rev.reviewState === 'aceito' ? 'aceito' : 'produzido';
  return checkEligibility(project, catalog, cap.id).ok ? 'nao' : 'dependencia';
}

/** "Motor 3 · Direcionar — Estratégia e visão de produto" → { verbo: 'Direcionar', nome: 'Estratégia e visão de produto' } */
export function motorNames(cap) {
  const m = /^Motor\s+\d+\s*·\s*([^—–-]+?)\s*[—–-]\s*(.+)$/.exec(cap.title ?? '');
  return m ? { verbo: m[1].trim(), nome: m[2].trim() } : { verbo: '', nome: cap.title };
}

/** Ícone de cada motor, pelo verbo: enquadrar, compreender (escuta), direcionar, materializar, construir, comprovar, antecipar. */
export const MOTOR_ICON = Object.freeze({ 1: 'frame', 2: 'signal', 3: 'compass', 4: 'penTool', 5: 'cube', 6: 'flask', 7: 'telescope' });

export const FAIXA = (n) => (n <= 2 ? { id: 'up', label: 'Upstream · AS IS' } : { id: 'down', label: 'Downstream · TO BE' });

function Faixa({ lado, titulo, pergunta, detalhe, feitos, total }) {
  return (
    <div className={`mj-lane mj-lane--${lado}`}>
      <span className="mj-chip">
        <span className="mj-chip__dot" aria-hidden="true" /> {titulo}
      </span>
      <strong>{pergunta}</strong>
      <span>{detalhe}</span>
      <span className="mj-lane__count tabular">
        {feitos} de {total} aceitos
      </span>
    </div>
  );
}

const HERO_KEY = 'jornada.darklab.hero-aberto';

/** Cabeçalho da jornada dos 7 motores com os números do projeto e o mapa AS IS → TO BE. Começa recolhido. */
export function MotorsHero({ motores, status }) {
  const { project } = useJourney();
  const [aberto, setAberto] = useState(() => {
    try {
      return window.sessionStorage.getItem(HERO_KEY) === '1';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      window.sessionStorage.setItem(HERO_KEY, aberto ? '1' : '0');
    } catch {
      /* ignora */
    }
  }, [aberto]);

  const conta = (s) => motores.filter((m) => status[m.id] === s).length;
  const aceitos = conta('aceito');
  const aguardando = conta('produzido');
  const andamento = conta('andamento');
  const naoIniciados = conta('nao') + conta('dependencia');
  const datas = motores.map((m) => latestRevision(project, m.id)?.generatedAt).filter(Boolean).sort();
  const corte = datas.length ? new Date(datas[datas.length - 1]) : new Date();
  const up = motores.filter((m) => m.number <= 2);
  const down = motores.filter((m) => m.number >= 3);
  const corpoId = 'mj-hero-corpo';

  return (
    <section className={`mj-hero ${aberto ? 'is-open' : 'is-collapsed'}`} aria-labelledby="mj-hero-title">
      <span className="mj-hero__mark" aria-hidden="true">
        <DarklabsMark tone="light" />
      </span>
      <div className="mj-hero__top">
        <div className="mj-hero__heading">
          <p className="mj-eyebrow">Linha do tempo × 7 motores</p>
          <h2 id="mj-hero-title" className="mj-title">
            Do enquadramento à evolução contínua.
          </h2>
        </div>
      </div>
      <ul className="mj-stats" aria-label="Situação dos motores">
        <li className="mj-stat mj-stat--ok">
          {aceitos} motor{aceitos === 1 ? '' : 'es'} com execução aceita
        </li>
        <li className="mj-stat mj-stat--warn">
          {aguardando} aguardando aceite{andamento ? ` · ${andamento} em andamento` : ''}
        </li>
        <li className="mj-stat">
          {naoIniciados} ainda não iniciado{naoIniciados === 1 ? '' : 's'}
        </li>
        <li className="mj-stat mj-stat--strong">corte · {corte.toLocaleDateString('pt-BR')}</li>
      </ul>
      {aberto ? (
        <div id={corpoId} className="mj-hero__body">
          <p className="mj-lead">
            Visão cruzada de entradas, saídas e execução dos sete motores do projeto <strong>{project.code}</strong> · {project.name}.
            O verde marca somente motores com resultado aceito; resultados aguardando aceite, execuções em andamento e motores não
            iniciados aparecem separados.
          </p>
          <div className="mj-map">
            <Faixa lado="up" titulo="Upstream · AS IS" pergunta="Qual é o problema?" detalhe="Motores 1–2 · Enquadrar e Compreender" feitos={up.filter((m) => status[m.id] === 'aceito').length} total={up.length} />
            <div className="mj-core">
              <strong>DarkLabs</strong>
              <span>Pessoas · dados · IA · parcerias</span>
            </div>
            <Faixa lado="down" titulo="Downstream · TO BE" pergunta="Qual é a solução?" detalhe="Motores 3–7 · Direcionar a Antecipar" feitos={down.filter((m) => status[m.id] === 'aceito').length} total={down.length} />
          </div>
          <p className="mj-loop">
            <DarklabMenuIcon name="infinity" size={14} /> Aprendizados e novas evidências retroalimentam continuamente o AS IS e o TO BE.
          </p>
        </div>
      ) : null}
      <button
        type="button"
        className="mj-hero__collapse"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls={corpoId}
        aria-label={aberto ? 'Recolher o banner' : 'Expandir o banner com o mapa AS IS → TO BE'}
        title={aberto ? 'Recolher' : 'Ver mapa AS IS → TO BE'}
      >
        <DarklabMenuIcon name="chevron" size={18} />
      </button>
    </section>
  );
}

/** Linha do tempo M1 → M7: clicar num motor abre o resultado (se houver) ou leva ao cartão dele. */
export function MotorsTimeline({ motores, status }) {
  const { openArtifact } = useJourney();
  return (
    <section className="mj-timeline" aria-label="Linha do tempo dos 7 motores">
      <ul className="mj-legend" aria-label="Legenda">
        {Object.entries(MOTOR_STATUS).map(([k, v]) => (
          <li key={k}>
            <span className={`mj-dot mj-dot--${k}`} aria-hidden="true" /> {v.legend}
          </li>
        ))}
      </ul>
      <ol className="mj-steps">
        {motores.map((m, i) => {
          const s = status[m.id];
          const prox = motores[i + 1];
          const linha = prox ? (s === 'aceito' && status[prox.id] === 'aceito' ? 'aceito' : s === 'aceito' || s === 'produzido' ? 'produzido' : 'nao') : null;
          const { nome } = motorNames(m);
          const faixa = FAIXA(m.number);
          const temResultado = s === 'aceito' || s === 'produzido';
          return (
            <li key={m.id} className={`mj-step mj-step--${s}`}>
              {linha ? <span className={`mj-link mj-link--${linha}`} aria-hidden="true" /> : null}
              <button
                type="button"
                className="mj-node"
                onClick={() => (temResultado ? openArtifact(m.id) : document.getElementById(`motor-card-${m.number}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))}
                aria-label={`Motor ${m.number}: ${nome}. ${MOTOR_STATUS[s].label}.${temResultado ? ' Abrir resultado.' : ' Ir para o cartão.'}`}
              >
                <DarklabMenuIcon name={MOTOR_ICON[m.number]} size={24} className="mj-node__icon" />
                {s === 'aceito' ? (
                  <span className="mj-node__badge" aria-hidden="true">
                    <DarklabMenuIcon name="check" size={13} />
                  </span>
                ) : null}
              </button>
              <span className="mj-step__name">
                <span className="mj-step__num tabular">{m.number}</span> · {nome}
              </span>
              <span className={`mj-chip mj-chip--light mj-chip--${faixa.id}`}>
                <span className="mj-chip__dot" aria-hidden="true" /> {faixa.label}
              </span>
              <span className="mj-step__status">{MOTOR_STATUS[s].label}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
