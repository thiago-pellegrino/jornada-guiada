import { CAP, backlogCounts, latestRevision } from '../../domain/journey/journeyEngine.js';
import { situacaoDoMotor } from './roadmapData.js';

/**
 * Dados da tela DarkLabs › Jornada do futuro: condições de partida do ciclo de evolução, situação dos
 * motores 5, 6 e 7 e o que o Motor 7 propõe para depois (backlog do futuro, experimentos e gatilhos de
 * revisão). Duas condições dependem de confirmação humana (não há dado que as comprove); o resto vem
 * do que o projeto tem gravado.
 */

export const CONDICOES = Object.freeze([
  { id: 'decision-pack', titulo: 'Decision pack revisado pelo Aprovador', manual: false },
  { id: 'mvp-backlog', titulo: 'MVP delimitado e backlog priorizado', manual: false },
  { id: 'owners', titulo: 'Owners, orçamento e dependências confirmados', manual: true },
  { id: 'guardrails', titulo: 'Guardrails de dados, IA, risco e compliance', manual: true },
]);

/** Etapas do ciclo de evolução e o motor que orienta cada uma. */
export const CICLO = Object.freeze([
  { id: 'implantar', titulo: 'Implantar', motor: 5, texto: 'MVP e incrementos com escopo delimitado' },
  { id: 'medir', titulo: 'Medir', motor: 6, texto: 'Indicadores de adoção, eficácia e qualidade' },
  { id: 'aprender', titulo: 'Aprender', motor: 6, texto: 'Hipóteses confirmadas, rejeitadas ou inconclusivas' },
  { id: 'antecipar', titulo: 'Antecipar', motor: 7, texto: 'Cenários, backlog do futuro e gatilhos de revisão' },
]);

const dataBr = (iso) => new Date(iso).toLocaleDateString('pt-BR');

function nomeDoMotor(cap) {
  const m = /^Motor\s+\d+\s*·\s*([^—–-]+?)\s*[—–-]\s*(.+)$/.exec(cap?.title ?? '');
  return m ? { verbo: m[1].trim(), nome: m[2].trim() } : { verbo: '', nome: cap?.title ?? '' };
}

/**
 * @param {{project, catalog, pending?, confirmacoes?: Record<string, {por: string, em: string}>, agora?: Date}} p
 */
export function montarFuturo({ project, catalog, pending = {}, confirmacoes = {}, agora = new Date() }) {
  const motores = catalog.byPhase.darklab.filter((c) => c.number >= 5 && c.number <= 7).sort((a, b) => a.number - b.number);
  const capDo = (n) => motores.find((m) => m.number === n);
  const revDo = (n) => (capDo(n) ? latestRevision(project, capDo(n).id) : null);

  const ficha = latestRevision(project, CAP.ficha);
  const dadosFicha = ficha?.envelope?.data ?? {};
  const m5 = revDo(5)?.envelope?.data;
  const m7 = revDo(7)?.envelope?.data;
  const sementes = (dadosFicha.backlogSeeds ?? []).filter((s) => s.inScope).length;
  const epicos = backlogCounts(project).epics ?? 0;

  const avaliar = {
    'decision-pack': () => {
      if (!ficha) return { status: 'falta', detalhe: 'A ficha do projeto (decision pack) ainda não foi gerada.' };
      if (ficha.reviewState === 'aceito') return { status: 'ok', detalhe: `Ficha R${ficha.revision} aceita.` };
      return { status: 'pendente', detalhe: `Ficha R${ficha.revision} gerada, aguardando aceite do Aprovador.` };
    },
    'mvp-backlog': () => {
      const temMvp = Boolean(m5?.mvpDefinition);
      const temBacklog = sementes > 0 || epicos > 0;
      const partes = [
        temMvp ? 'MVP delimitado no Motor 5' : 'MVP ainda não delimitado (Motor 5)',
        epicos
          ? `${epicos} épico${epicos === 1 ? '' : 's'} no backlog`
          : sementes
            ? `${sementes} semente${sementes === 1 ? '' : 's'} de backlog na ficha`
            : 'backlog ainda sem itens',
      ];
      return { status: temMvp && temBacklog ? 'ok' : temMvp || temBacklog ? 'pendente' : 'falta', detalhe: `${partes.join(' · ')}.` };
    },
    owners: () => {
      const aprovadores = (project.members ?? []).filter((m) => m.role === 'Aprovador' || m.role === 'Administrador').length;
      const dependencias = (dadosFicha.dependencies ?? []).length;
      return {
        detalhe: `${aprovadores} pessoa${aprovadores === 1 ? '' : 's'} com papel de decisão no projeto · ${dependencias} dependência${dependencias === 1 ? '' : 's'} na ficha.`,
      };
    },
    guardrails: () => {
      const riscos = (dadosFicha.risks ?? []).length;
      return { detalhe: `${riscos} risco${riscos === 1 ? '' : 's'} registrado${riscos === 1 ? '' : 's'} na ficha.` };
    },
  };

  const condicoes = CONDICOES.map((c) => {
    const base = avaliar[c.id]();
    if (!c.manual) return { ...c, ...base };
    const conf = confirmacoes[c.id];
    return { ...c, ...base, status: conf ? 'ok' : 'manual', confirmadoPor: conf?.por ?? null, confirmadoEm: conf?.em ?? null };
  });
  const atendidas = condicoes.filter((c) => c.status === 'ok').length;

  const linhas = motores.map((cap) => {
    const rev = latestRevision(project, cap.id);
    return {
      numero: cap.number,
      ...nomeDoMotor(cap),
      situacao: situacaoDoMotor(project, catalog, cap, pending),
      revisao: rev?.revision ?? null,
      geradoEm: rev?.generatedAt ?? null,
      capId: cap.id,
    };
  });
  const comResultado = linhas.filter((l) => l.revisao);
  const ultima = comResultado
    .map((l) => l.geradoEm)
    .sort()
    .pop();
  const posicao = comResultado.length
    ? `${comResultado.length} de ${linhas.length} motores com resultado · última geração em ${dataBr(ultima)}.`
    : `Não iniciado na posição de ${dataBr(agora)}.`;

  const ciclo = CICLO.map((e) => ({ ...e, situacao: linhas.find((l) => l.numero === e.motor)?.situacao ?? 'dependencia' }));

  const PESO = { agora: 0, próximo: 1, futuro: 2 };
  const backlog = (m7?.futureBacklog ?? [])
    .slice()
    .sort((a, b) => (PESO[a.horizon] ?? 3) - (PESO[b.horizon] ?? 3) || (a.rank ?? 99) - (b.rank ?? 99))
    .map((f) => ({
      id: f.id,
      titulo: f.title,
      horizonte: f.horizon ?? 'futuro',
      resultado: f.expectedOutcome ?? '',
      valor: f.priority?.valor ?? null,
      gatilhos: f.reviewTriggerIds ?? [],
    }));
  const gatilhos = (m7?.reviewTriggers ?? []).map((t) => ({
    id: t.id,
    condicao: t.condition,
    quem: t.monitoredBy ?? null,
    afeta: t.affectsIds ?? [],
  }));
  const experimentos = (m7?.futureExperiments ?? []).map((x) => ({ id: x.id, hipotese: x.hypothesis, passo: x.backcastStep ?? null }));

  return {
    condicoes,
    atendidas,
    liberado: atendidas === condicoes.length,
    linhas,
    ciclo,
    posicao,
    temM7: Boolean(m7),
    revisaoM7: revDo(7)?.revision ?? null,
    capM7: capDo(7)?.id ?? null,
    backlog,
    gatilhos,
    experimentos,
  };
}
