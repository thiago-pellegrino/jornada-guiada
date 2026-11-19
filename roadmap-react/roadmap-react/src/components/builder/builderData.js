import { latestRevision, listRevisions, stageLabel } from '../../domain/journey/journeyEngine.js';

const corta = (texto, max = 280) => {
  const t = String(texto ?? '').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
};

/** "Motor 3 · Direcionar — Estratégia e visão de produto" → { verbo: 'Direcionar', nome: 'Estratégia e visão de produto' } */
function nomesDoMotor(titulo) {
  const m = /Motor\s*\d+\s*·\s*([^—–-]+)[—–-]\s*(.+)/.exec(titulo ?? '');
  return m ? { verbo: m[1].trim(), nome: m[2].trim() } : { verbo: '', nome: titulo ?? '' };
}

function resumoDaCapacidade(project, cap) {
  const rev = project ? latestRevision(project, cap.id) : null;
  const env = rev?.envelope ?? null;
  const dados = env?.data ?? {};
  return {
    passo: cap.step,
    titulo: cap.title,
    gerado: Boolean(rev),
    revisao: rev ? `R${rev.revision}` : null,
    geradoEm: rev?.generatedAt ?? null,
    estadoDeRevisao: rev?.reviewState ?? null,
    revisoes: project ? listRevisions(project, cap.id).length : 0,
    resumo: env ? corta(env.summary, 420) : null,
    entregaveis: (dados.deliverables ?? []).slice(0, 8).map((d) => ({ nome: d.name, status: d.status })),
    lacunas: (env?.gaps ?? []).slice(0, 6).map((g) => ({ pergunta: corta(g.question, 160), impacto: g.impact ?? null })),
    evidencias: (env?.evidenceRefs ?? []).length,
    cobertura: env?.coverage?.coveragePct ?? null,
  };
}

function situacaoDoMotor(r) {
  if (!r.gerado) return 'não iniciado';
  if (r.estadoDeRevisao === 'aceito') return 'executado e aceito';
  if (r.estadoDeRevisao === 'revisado') return 'aceite pendente';
  return 'produzido';
}

/**
 * Dossiê do projeto selecionado para o Delta Builder: tudo o que a jornada já processou
 * (Contexto, DarkLabs, ficha, Backlog, execuções) e a simulação de capacidade das squads.
 * Só dados — nenhuma chave, segredo ou identificador de usuário entra aqui.
 */
export function montarDossie({ project, catalog, result, scenario, agora = new Date().toISOString() }) {
  const fases = catalog?.byPhase ?? {};
  const contexto = (fases.contexto ?? []).filter((c) => !c.isTurbo).map((c) => resumoDaCapacidade(project, c));
  const darklab = (fases.darklab ?? []).filter((c) => !c.isTurbo);
  const motores = darklab
    .filter((c) => c.number >= 1 && c.number <= 7)
    .map((c) => {
      const r = resumoDaCapacidade(project, c);
      return { numero: c.number, ...nomesDoMotor(c.title), faixa: c.number <= 2 ? 'Upstream · AS IS' : 'Downstream · TO BE', situacao: situacaoDoMotor(r), ...r };
    });
  const ficha = darklab.find((c) => c.number === 8);
  const backlog = Object.entries(fases)
    .filter(([fase]) => fase !== 'contexto' && fase !== 'darklab')
    .flatMap(([, caps]) => caps.filter((c) => !c.isTurbo).map((c) => resumoDaCapacidade(project, c)));

  const kpis = result?.kpis ?? {};
  const squads = (result?.squads ?? []).map((s) => ({
    nome: s.shortName ?? s.title,
    pessoas: s.people,
    capacidadeSemanalHoras: s.weeklyCapacityHours,
    historias: s.stories,
    demandaHoras: s.demandHours,
    semanasNecessarias: s.requiredWeeks,
    semanasAlemDoFreezing: s.weeksBeyondFreeze,
    pessoasRecomendadasParaOFreezing: s.recommendedPeopleForFreeze,
    terminoPrevisto: s.endLabel,
    situacao: s.status,
  }));
  const features = Object.values(result?.features ?? {})
    .slice(0, 60)
    .map((f) => ({ id: f.featureId, squad: f.squadKey, historias: f.stories, horas: f.effortHours, inicio: f.startWeekCode, termino: f.endLabel, situacao: f.status }));

  return {
    geradoEm: agora,
    projeto: project
      ? { codigo: project.code, nome: project.name, descricao: project.description || null, etapa: stageLabel(project.stage), identificador: project.projectId, criadoEm: project.createdAt }
      : null,
    fontes: (project?.sources ?? []).map((s) => ({ id: s.id, nome: s.name, tipo: s.type, situacao: s.status })),
    contexto,
    darklab: { motores, ficha: ficha ? resumoDaCapacidade(project, ficha) : null },
    backlog,
    execucoes: (project?.runs ?? [])
      .slice(-20)
      .map((r) => ({ tipo: r.kind === 'turbo' ? 'Modo Turbo' : 'avulsa', fase: r.phase, situacao: r.status, inicio: r.startedAt, fim: r.finishedAt ?? null })),
    simulacao: {
      modalidade: scenario?.premises?.schedulingMode ?? null,
      freezing: '17/12/2026',
      indicadores: {
        features: kpis.totalFeatures,
        historias: kpis.totalStories,
        demandaHoras: kpis.totalDemandHours,
        pessoas: kpis.totalPeople,
        capacidadeSemanalHoras: kpis.totalWeeklyCapacity,
        horasDisponiveisAteOFreezing: kpis.availableHoursBeforeFreeze,
        saldoDeHorasAteOFreezing: kpis.balanceHoursBeforeFreeze,
        featuresConcluidasAteOFreezing: kpis.featuresCompletedBeforeFreeze,
        historiasConcluidasAteOFreezing: kpis.storiesCompletedBeforeFreeze,
        percentualConcluidoAteOFreezing: kpis.completionPctBeforeFreeze,
        featuresForaDaJanela: kpis.featuresOutOfWindow,
      },
      squads,
      features,
    },
  };
}

/** Números rápidos para o painel "Dados da jornada". */
export function resumoDoDossie(d) {
  return {
    fontes: d.fontes.length,
    contexto: `${d.contexto.filter((c) => c.gerado).length}/${d.contexto.length}`,
    motores: `${d.darklab.motores.filter((m) => m.gerado).length}/${d.darklab.motores.length}`,
    ficha: d.darklab.ficha?.gerado ? d.darklab.ficha.revisao : 'não gerada',
    squads: d.simulacao.squads.length,
    features: d.simulacao.indicadores.features ?? 0,
  };
}
