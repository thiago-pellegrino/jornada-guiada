import { useEffect, useMemo, useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { Aviso } from '../darklabs/bits.jsx';
import { FILTROS_VAZIOS, indicadores, modeloDoExemplo, modeloDoProjeto } from '../../domain/backlog/backlogFuturo.js';
import { VisaoDicionario, VisaoEpicos, VisaoFeatures, VisaoHistorias, VisaoResumo, VisaoRoadmap } from './BacklogFuturoVisoes.jsx';

const VISAO_KEY = 'jornada.backlog.visao';
const EXEMPLO_KEY = 'jornada.backlog.exemplo';

/** Telas no formato da planilha "Roadmap do Futuro" (uma por aba até DICIONARIO) e a geração. */
const VISOES = [
  { id: 'resumo', label: 'Resumo', icon: 'report' },
  { id: 'roadmap', label: 'Roadmap', icon: 'roadmap' },
  { id: 'epicos', label: 'Épicos', icon: 'layers' },
  { id: 'features', label: 'Features', icon: 'grid' },
  { id: 'historias', label: 'Histórias', icon: 'tasks' },
  { id: 'dicionario', label: 'Dicionário', icon: 'fileText' },
  { id: 'geracao', label: 'Geração', icon: 'sparkle' },
];

function ler(chave, padrao) {
  try {
    return window.sessionStorage.getItem(chave) ?? padrao;
  } catch {
    return padrao;
  }
}
function gravar(chave, valor) {
  try {
    window.sessionStorage.setItem(chave, valor);
  } catch {
    /* ignora */
  }
}

/** Carrega o exemplo (planilha convertida) só quando pedido: o arquivo fica num pedaço separado do build. */
function useExemplo(ativo) {
  const [bruto, setBruto] = useState(null);
  const [erro, setErro] = useState(null);
  useEffect(() => {
    if (!ativo || bruto) return undefined;
    let vivo = true;
    import('../../data/backlogFuturoExemplo.json')
      .then((m) => vivo && setBruto(m.default))
      .catch((e) => vivo && setErro(e.message));
    return () => {
      vivo = false;
    };
  }, [ativo, bruto]);
  const modelo = useMemo(() => (bruto ? modeloDoExemplo(bruto) : null), [bruto]);
  return { modelo, erro };
}

/**
 * Painel do Backlog do Futuro: o que Contexto → DarkLabs → ficha do projeto → geração produziu,
 * organizado como a planilha (Resumo, Roadmap, Épicos, Features, Histórias e Dicionário).
 * `geracao` é o conteúdo da aba Geração (capacidades, árvore e Modo Turbo).
 */
export default function BacklogFuturoPainel({ project, geracao }) {
  const [visao, setVisaoBruta] = useState(() => {
    const v = ler(VISAO_KEY, 'resumo');
    return VISOES.some((x) => x.id === v) ? v : 'resumo';
  });
  const [exemplo, setExemploBruto] = useState(() => ler(EXEMPLO_KEY, '0') === '1');
  const [filtrosHistorias, setFiltrosHistorias] = useState({ ...FILTROS_VAZIOS });
  const [filtrosFeatures, setFiltrosFeatures] = useState({ busca: '', aba: '', epcId: '' });

  const setVisao = (v) => {
    setVisaoBruta(v);
    gravar(VISAO_KEY, v);
  };
  const setExemplo = (v) => {
    setExemploBruto(v);
    gravar(EXEMPLO_KEY, v ? '1' : '0');
    setFiltrosHistorias({ ...FILTROS_VAZIOS });
    setFiltrosFeatures({ busca: '', aba: '', epcId: '' });
  };

  const doProjeto = useMemo(() => modeloDoProjeto(project), [project]);
  const { modelo: doExemplo, erro } = useExemplo(exemplo);
  const usandoExemplo = exemplo && Boolean(doExemplo);
  const modelo = usandoExemplo ? doExemplo : doProjeto;
  const vazio = doProjeto.historias.length === 0 && doProjeto.epicos.length === 0;
  const k = indicadores(modelo);

  /** Navegação cruzada: abre outra visão já filtrada (ex.: histórias de um épico). */
  const abrir = (destino, filtro = {}) => {
    if (destino === 'historias') setFiltrosHistorias({ ...FILTROS_VAZIOS, ...filtro });
    if (destino === 'features') setFiltrosFeatures({ busca: '', aba: '', epcId: '', ...filtro });
    setVisao(destino);
  };

  const ehGeracao = visao === 'geracao';

  return (
    <section className="bf-sheet" aria-labelledby="bf-title">
      <header className="bf-head">
        <div className="bf-head__text">
          <h2 id="bf-title" className="bf-head__title">
            Backlog do Futuro
          </h2>
          <p className="bf-head__sub">
            {usandoExemplo && !ehGeracao ? (
              <>
                {modelo.titulo} · {modelo.subtitulo}
              </>
            ) : (
              <>
                Projeto <strong>{project.code}</strong> · {project.name}
                {project.company?.name ? ` · ${project.company.name}` : ''} · {k.epicos} épicos, {k.features} features e {k.historias} histórias.
                Épico canônico → Feature → História, gerados a partir do Contexto, do DarkLabs e da ficha do projeto.
              </>
            )}
          </p>
        </div>
      </header>

      <nav className="dlj-pills bf-pills" aria-label="Telas do Backlog do Futuro">
        {VISOES.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`dlj-pill ${visao === v.id ? 'is-selected' : ''}`}
            aria-current={visao === v.id ? 'page' : undefined}
            onClick={() => setVisao(v.id)}
          >
            <Icon name={v.icon} size={15} /> {v.label}
          </button>
        ))}
      </nav>

      {!ehGeracao ? (
        exemplo ? (
          <Aviso
            tom="info"
            acoes={
              <button type="button" className="btn btn--sm" onClick={() => setExemplo(false)}>
                Ver dados do projeto
              </button>
            }
          >
            <strong>Exemplo ilustrativo.</strong>{' '}
            {erro
              ? `Não foi possível carregar o exemplo (${erro}).`
              : doExemplo
                ? `Dados da planilha ${doExemplo.fonte}: ${doExemplo.epicos.length} épicos, ${doExemplo.features.length} features e ${doExemplo.historias.length.toLocaleString('pt-BR')} histórias. Não são dados do projeto ${project.code}.`
                : 'Carregando a planilha de exemplo…'}
          </Aviso>
        ) : vazio ? (
          <Aviso
            tom="aviso"
            acoes={
              <>
                <button type="button" className="btn btn--sm" onClick={() => setExemplo(true)}>
                  Ver exemplo ilustrativo
                </button>
                <button type="button" className="btn btn--sm btn--primary" onClick={() => setVisao('geracao')}>
                  Gerar o backlog
                </button>
              </>
            }
          >
            <strong>Nenhum backlog gerado para {project.code}.</strong> Gere os épicos (ou rode o Modo Turbo) na Geração para preencher estas telas, ou veja
            como elas ficam com o exemplo ilustrativo.
          </Aviso>
        ) : (
          <Aviso
            tom="info"
            acoes={
              <button type="button" className="btn btn--sm" onClick={() => setExemplo(true)}>
                Ver exemplo ilustrativo
              </button>
            }
          >
            <strong>Dados do projeto {project.code}.</strong> Onda, superfície, tipo, origem, maturidade e READY são derivados do que a jornada gerou; as
            regras estão no Dicionário.
          </Aviso>
        )
      ) : null}

      {ehGeracao ? <div className="bf-geracao">{geracao}</div> : null}
      {!ehGeracao && exemplo && !doExemplo ? <p className="bf-empty">{erro ? 'Exemplo indisponível.' : 'Carregando…'}</p> : null}
      {!ehGeracao && (!exemplo || doExemplo) ? (
        <div className="bf-view" key={`${modelo.modo}-${visao}`}>
          {visao === 'resumo' ? <VisaoResumo modelo={modelo} onAbrir={abrir} /> : null}
          {visao === 'roadmap' ? <VisaoRoadmap modelo={modelo} /> : null}
          {visao === 'epicos' ? <VisaoEpicos modelo={modelo} onAbrir={abrir} /> : null}
          {visao === 'features' ? <VisaoFeatures modelo={modelo} filtros={filtrosFeatures} onFiltros={setFiltrosFeatures} onAbrir={abrir} /> : null}
          {visao === 'historias' ? <VisaoHistorias modelo={modelo} filtros={filtrosHistorias} onFiltros={setFiltrosHistorias} /> : null}
          {visao === 'dicionario' ? <VisaoDicionario modelo={modelo} /> : null}
        </div>
      ) : null}
    </section>
  );
}
