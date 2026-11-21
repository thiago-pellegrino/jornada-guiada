import { useEffect, useState } from 'react';
import { useJourney } from '../../journey/JourneyContext.jsx';
import Icon from '../ui/Icon.jsx';
import { TELAS_OCULTAS, useDarklabs } from './darklabsStore.js';
import TelaInicio from './TelaInicio.jsx';
import TelaTriagem from './TelaTriagem.jsx';
import TelaPrateleira from './TelaPrateleira.jsx';
import TelaSquad from './TelaSquad.jsx';
import TelaJornada from './TelaJornada.jsx';
import TelaMotor from './TelaMotor.jsx';
import TelaMemoria from './TelaMemoria.jsx';
import TelaDossie from './TelaDossie.jsx';
import TelaGanhos from './TelaGanhos.jsx';
import CenariosDialog from './CenariosDialog.jsx';
import { Aviso } from './bits.jsx';

const NAV = [
  { id: 'inicio', label: 'Início', icon: 'home' },
  { id: 'triagem', label: 'Triagem', icon: 'search' },
  { id: 'prateleira', label: 'Prateleira', icon: 'layers' },
  { id: 'squad', label: 'Squad', icon: 'users' },
  { id: 'jornada', label: 'Jornada', icon: 'roadmap' },
  { id: 'memoria', label: 'Memória', icon: 'tasks' },
  { id: 'dossie', label: 'Dossiê', icon: 'report' },
  { id: 'ganhos', label: 'Ganhos', icon: 'chart' },
];

const TELAS = {
  inicio: TelaInicio,
  triagem: TelaTriagem,
  prateleira: TelaPrateleira,
  squad: TelaSquad,
  jornada: TelaJornada,
  memoria: TelaMemoria,
  dossie: TelaDossie,
  ganhos: TelaGanhos,
};

/** Etapas já cumpridas ganham o ícone de concluído na barra de navegação. */
function etapaFeita(S, id) {
  return {
    triagem: S.triado,
    prateleira: Boolean(S.produto) && S.triado,
    squad: S.iniciada,
    jornada: S.concluida,
    dossie: S.concluida,
    memoria: S.memoria.length > 0,
    ganhos: S.historico.length > 0,
  }[id];
}

/**
 * Aba DarkLabs da Jornada Guiada: triagem do desafio, prateleira de serviços, squad, os 7 motores
 * com gates de decisão, memória, dossiê e ganhos (simulação local, uma por projeto).
 */
export default function DarklabsJornada() {
  const { project, notify } = useJourney();
  const loja = useDarklabs(project?.projectId, project?.name);
  loja.notify = notify;
  const [dialogo, setDialogo] = useState(false);

  // Fluxo integrado: a cada consolidação de contexto do projeto, a triagem do DarkLabs é atualizada.
  useEffect(() => {
    loja.sincronizarContexto(project);
  }, [loja, project]);
  const { S, view, ap } = loja;

  const base = view.startsWith('motor-') ? 'jornada' : view;
  const Tela = view.startsWith('motor-') ? null : TELAS[view] ?? TelaTriagem;
  const abas = NAV.filter((n) => !TELAS_OCULTAS.has(n.id)).map((n) => ({ ...n, id: `dlj-${n.id}`, icon: etapaFeita(S, n.id) ? 'check' : n.icon }));

  return (
    <div className="dlj">
      <section className="dlj-sheet" aria-label="DarkLabs">
        <div className="dlj-nav">
          <nav className="dlj-pills" aria-label="Etapas do DarkLabs">
            {abas.map((a) => {
              const id = a.id.replace(/^dlj-/, '');
              const atual = id === base;
              return (
                <button
                  key={a.id}
                  type="button"
                  id={`tab-${a.id}`}
                  className={`dlj-pill ${atual ? 'is-selected' : ''}`}
                  aria-current={atual ? 'page' : undefined}
                  onClick={() => loja.go(id)}
                >
                  <Icon name={a.icon} size={15} />
                  {a.label}
                </button>
              );
            })}
          </nav>
          <div className="dlj-nav__actions">
            <button type="button" className="btn btn--sm" onClick={() => setDialogo(true)} disabled={ap.on}>
              Cenários e dados
            </button>
            {ap.on ? (
              <button type="button" className="btn btn--sm btn--danger" onClick={() => loja.parar()}>
                <Icon name="stop" size={14} /> Parar
              </button>
            ) : (
              <button type="button" className="btn btn--sm btn--primary" onClick={() => loja.apresentar()}>
                <Icon name="sparkle" size={14} /> Apresentação
              </button>
            )}
          </div>
        </div>

        {ap.on ? (
          <p className="dlj-apbar" role="status">
            Modo apresentação · {ap.etapa || 'preparando'}
          </p>
        ) : null}
        {!ap.on && loja.backup ? (
          <Aviso
            acoes={
              <>
                <button type="button" className="btn btn--sm btn--primary" onClick={() => loja.restaurarBackup()}>
                  Restaurar minha simulação
                </button>
                <button type="button" className="btn btn--sm" onClick={() => loja.descartarBackup()}>
                  Manter a demonstração
                </button>
              </>
            }
          >
            A apresentação usou um cenário de demonstração. A simulação que você tinha neste projeto foi guardada.
          </Aviso>
        ) : null}

        <div id={`panel-dlj-${base}`} className="dlj-panel">
          {Tela ? <Tela loja={loja} /> : <TelaMotor loja={loja} m={Number(view.split('-')[1])} />}
        </div>
      </section>

      <Aviso>
        <strong>Simulação:</strong> empresas, números, resultados e respostas dos agentes de IA são gerados para demonstração.
      </Aviso>

      {dialogo ? <CenariosDialog loja={loja} onClose={() => setDialogo(false)} /> : null}
    </div>
  );
}
