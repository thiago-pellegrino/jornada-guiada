import { stageLabel } from '../../../domain/journey/journeyEngine.js';
import { lerInicioDoRoadmap, montarRoadmap } from './roadmapData.js';
import { montarDiario } from './diarioData.js';

/**
 * Portal DarkLabs › Visão geral: acompanhamento do projeto num só lugar, montado só com o que está
 * gravado — prazo do ciclo em dias úteis (janelas do roadmap), situação das 5 etapas e dos 7 motores,
 * baseline de entregáveis, foco da janela atual, indicadores e últimos documentos enviados.
 */

const DIA = 86400000;
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const meiaNoite = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const doisDig = (n) => String(n).padStart(2, '0');

export const dataCurta = (d) => (d ? `${doisDig(d.getDate())}/${doisDig(d.getMonth() + 1)}/${d.getFullYear()}` : '—');
export const dataLonga = (d) => (d ? `${doisDig(d.getDate())} ${MESES[d.getMonth()].toUpperCase()} ${d.getFullYear()}` : '—');
export const diaMesCurto = (d) => (d ? `${doisDig(d.getDate())}/${doisDig(d.getMonth() + 1)}` : '—');

/** Dias úteis (segunda a sexta, sem feriados) de `inicio` até `fim`, inclusive. */
export function diasUteis(inicio, fim) {
  const a = meiaNoite(inicio).getTime();
  const b = meiaNoite(fim).getTime();
  if (b < a) return 0;
  let n = 0;
  for (let t = a; t <= b; t += DIA) {
    const dow = new Date(t).getDay();
    if (dow !== 0 && dow !== 6) n += 1;
  }
  return n;
}

/** Prazo do ciclo: dia útil atual, total, faltantes e progresso. */
export function prazoDoCiclo(inicio, fim, agora = new Date()) {
  const total = diasUteis(inicio, fim);
  const hoje = meiaNoite(new Date(agora));
  const atual = hoje < meiaNoite(inicio) ? 0 : diasUteis(inicio, hoje > fim ? fim : hoje);
  return {
    inicio,
    fim,
    total,
    atual,
    faltam: Math.max(0, total - atual),
    pct: total ? Math.round((atual / total) * 100) : 0,
    antes: hoje < meiaNoite(inicio),
    encerrado: hoje > meiaNoite(fim),
  };
}

const comResultado = (s) => s === 'aceito' || s === 'produzido';

export function montarVisaoGeral({ project, catalog, pending = {}, agora = new Date(), exemplo = false }) {
  const inicio = lerInicioDoRoadmap(project.projectId);
  const r = montarRoadmap({ project, catalog, pending, inicio, agora, exemplo });
  const diario = montarDiario({ project, catalog });

  const prazo = prazoDoCiclo(r.janelas[0].inicio, r.janelas[r.janelas.length - 1].fim, agora);

  // Motores: situação, faixa e data do último resultado.
  const motores = r.linhas.map((l) => ({
    numero: l.numero,
    verbo: l.verbo || `Motor ${l.numero}`,
    nome: l.nome,
    faixa: l.faixa,
    situacao: l.situacao,
    revisao: l.revisao,
    data: l.geradoEm ? new Date(l.geradoEm) : null,
    entregaveis: l.celulas.flat().filter((c) => c.tipo === 'entregavel').map((c) => c.titulo),
  }));

  // Em atuação: motores com execução em andamento ou resultado aguardando aceite; sem eles, o próximo a iniciar.
  const ativos = motores.filter((m) => m.situacao === 'andamento' || m.situacao === 'produzido');
  const proximo = motores.find((m) => !comResultado(m.situacao) && m.situacao !== 'andamento');
  const emAtuacao = ativos.length
    ? {
        titulo:
          ativos.length <= 3
            ? `consolidar ${ativos.map((m) => m.verbo).join(' + ')}`
            : `consolidar ${ativos.slice(0, 2).map((m) => m.verbo).join(' + ')} e mais ${ativos.length - 2} motores`,
        itens: ativos.flatMap((m) => m.entregaveis).slice(0, 4),
      }
    : proximo
      ? { titulo: `iniciar ${proximo.verbo}`, itens: proximo.entregaveis.slice(0, 4) }
      : { titulo: 'ciclo dos 7 motores concluído', itens: [] };

  // Foco agora: o que falta entregar na janela atual (ou na primeira, antes do início).
  const marco = r.marcos.find((m) => m.atual) ?? r.marcos[0];
  const etapaAtual = r.etapas.find((e) => e.situacao !== 'concluida') ?? r.etapas[r.etapas.length - 1];
  const foco = {
    janela: marco?.janela ?? null,
    data: marco?.data ?? '',
    situacao: etapaAtual?.situacao ?? 'nao',
    etapa: etapaAtual,
    itens: (marco?.abertos ?? []).slice(0, 3).map((c) => ({
      titulo: c.titulo,
      detalhe: `Motor ${c.motor} · ${motores.find((m) => m.numero === c.motor)?.verbo ?? ''}${c.periodo ? ` · ${c.periodo}` : ''}`,
    })),
    perguntas: etapaAtual?.perguntasAltas ?? [],
  };

  const fontes = [...(project.sources ?? [])].sort((a, b) => String(b.uploadedAt).localeCompare(String(a.uploadedAt)));
  const referencias = fontes.length + (project.notebooks ?? []).reduce((t, nb) => t + (nb.references ?? []).length, 0);
  const posicao = diario.indicadores.posicao ? new Date(diario.indicadores.posicao) : new Date(agora);

  return {
    r,
    exemplo: r.exemplo,
    semExecucao: r.semExecucao,
    prazo,
    posicao,
    etapa: stageLabel(project.stage),
    etapas: r.etapas,
    motores,
    emAtuacao,
    foco,
    entregaveis: motores.reduce((t, m) => t + m.entregaveis.length, 0),
    indicadores: {
      referencias,
      publicacoes: diario.publicacoes.length,
      lacunas: r.lacunas.length,
      lacunasAltas: r.lacunas.filter((g) => g.impacto === 'alto').length,
      comResultado: motores.filter((m) => comResultado(m.situacao)).length,
    },
    documentos: fontes.slice(0, 4).map((s) => ({ id: s.id, nome: s.name, data: s.uploadedAt ? new Date(s.uploadedAt) : null, situacao: s.status })),
    totalDocumentos: fontes.length,
  };
}
