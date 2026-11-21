import Icon from '../ui/Icon.jsx';
import { GATILHOS, MAT, PACKS, PERFIS } from '../../domain/darklabs/conteudo.js';
import { produtoPorId } from '../../domain/darklabs/simulacao.js';
import { fmtDateTime, goToTab } from '../journey/JourneyBits.jsx';
import { Aviso, Cabecalho, Faixa, Secao, Tag } from './bits.jsx';

/** Origem de um campo preenchido a partir do contexto consolidado. */
function Origem({ texto }) {
  return texto ? <small className="dlj-origem">Do contexto: {texto}</small> : null;
}

/** Vínculo da triagem com a Consolidação de contexto (002) do projeto. */
function ContextoVinculado({ loja }) {
  const situacao = loja.situacaoContexto();
  const c = loja.contextoDisponivel;
  if (situacao === 'sem-contexto') {
    return (
      <Aviso
        tom="warn"
        acoes={
          <button type="button" className="btn btn--sm" onClick={() => goToTab('contexto')}>
            Ir para a Criação de Contexto
          </button>
        }
      >
        Este projeto ainda não tem contexto consolidado. Consolide o contexto (002) na Criação de Contexto e a triagem é preenchida automaticamente com as dores, os atores e os indicadores encontrados.
      </Aviso>
    );
  }
  if (situacao === 'em-andamento') {
    return (
      <Aviso
        acoes={
          <button type="button" className="btn btn--sm" onClick={() => loja.go('jornada')}>
            Ver a jornada
          </button>
        }
      >
        Há uma consolidação de contexto nova (R{c.revisao}). Ela entra na triagem quando o ciclo atual da jornada terminar.
      </Aviso>
    );
  }
  if (situacao === 'disponivel' || situacao === 'desatualizado') {
    return (
      <Aviso
        acoes={
          <button type="button" className="btn btn--sm btn--primary" onClick={() => loja.preencherComContexto()}>
            Preencher com o contexto
          </button>
        }
      >
        A triagem atual não usa o contexto consolidado do projeto (002 · R{c.revisao}). Preencha com ele para simular a jornada a partir da etapa anterior.
      </Aviso>
    );
  }
  const abertos = c.conflitos.filter((x) => !x.resolvido).length;
  const altos = c.lacunas.filter((x) => x.impacto === 'alto').length;
  return (
    <section className="surface dlj-card--accent dlj-ctx" style={{ '--mc': 'var(--color-success-text)' }} aria-labelledby="dlj-ctx-title">
      <header className="surface-head">
        <h3 id="dlj-ctx-title" className="surface-title">
          <span className="jg-cap__step">002</span> Preenchida com a Consolidação de contexto
        </h3>
        <span className="dlj-row">
          <Tag tom="ok">R{c.revisao}</Tag>
          <span className="jg-muted">
            {fmtDateTime(c.geradoEm)}
            {c.revisaoEstado ? ` · ${c.revisaoEstado}` : ''}
          </span>
        </span>
      </header>
      {c.resumo ? <p className="dlj-ctx__resumo">{c.resumo}</p> : null}
      <div className="dlj-chips dlj-mt">
        <Tag>{c.dores.length} dor(es)</Tag>
        <Tag>{c.atores.length} ator(es)</Tag>
        <Tag>{c.indicadores.length} indicador(es)</Tag>
        <Tag>{c.sistemas.length} sistema(s)</Tag>
        <Tag>{c.regras.length} regra(s)</Tag>
        <Tag tom={altos ? 'warn' : ''}>{c.lacunas.length} lacuna(s){altos ? `, ${altos} de alto impacto` : ''}</Tag>
        <Tag tom={abertos ? 'bad' : ''}>{abertos} conflito(s) aberto(s)</Tag>
        {c.cobertura != null ? <Tag tom="info">cobertura {Math.round(c.cobertura * 100)}%</Tag> : null}
      </div>
      <p className="field-hint dlj-mt">As dores, os sistemas e os indicadores do contexto também alimentam os textos gerados pelos agentes nos motores.</p>
      <div className="dlj-row dlj-mt">
        <button type="button" className="btn btn--sm" onClick={() => loja.preencherComContexto()} disabled={loja.S.iniciada && !loja.S.concluida}>
          Recarregar do contexto
        </button>
        <button type="button" className="btn btn--sm" onClick={() => goToTab('contexto')}>
          Ver na Criação de Contexto
        </button>
      </div>
    </section>
  );
}

const PORTES = [
  ['pequeno', 'Pequeno (até R$ 100 mi/ano)'],
  ['medio', 'Médio (R$ 100 mi a 1 bi/ano)'],
  ['grande', 'Grande (acima de R$ 1 bi/ano)'],
];

const CAMPOS = [
  ['ambicao', 'Ambição', 'Ex.: aumentar a recorrência no digital'],
  ['problema', 'Problema percebido', 'Ex.: clientes não voltam a comprar'],
  ['publico', 'Público afetado', 'Ex.: clientes do programa de fidelidade'],
  ['meta', 'Indicador de sucesso', 'Ex.: taxa de recompra em 90 dias'],
  ['orcamento', 'Apetite de investimento', 'Ex.: R$ 2 a 4 mi'],
  ['stakeholders', 'Stakeholders', 'Ex.: Digital, CRM, Operações e TI'],
];

export default function TelaTriagem({ loja }) {
  const { S } = loja;
  const d = S.desafio;
  const rec = S.triado && S.rec ? produtoPorId(S.rec.id) : null;
  const set = (k, v) => loja.mudar((X) => {
    X.desafio[k] = v;
  });
  const og = S.contexto ? S.origens ?? {} : {};

  return (
    <div className="dlj-stack">
      <Cabecalho eyebrow="Etapa 1 · O problema, para quem e quando acionar" titulo="Triagem do desafio">
        O desafio vem da análise de contexto da etapa anterior. Revise, ajuste o que faltar e execute a triagem para receber a recomendação da prateleira.
      </Cabecalho>

      <ContextoVinculado loja={loja} />

      <section className="surface" aria-labelledby="dlj-contexto">
        <header className="surface-head">
          <h3 id="dlj-contexto" className="surface-title">
            Contexto
          </h3>
        </header>
        <div className="dlj-form">
          <label className="field">
            <span className="field-label">Empresa</span>
            <input className="input" value={d.empresa} placeholder="Ex.: Aurora Varejo" onChange={(e) => set('empresa', e.target.value)} />
            <Origem texto={og.empresa} />
          </label>
          <label className="field">
            <span className="field-label">Setor</span>
            <select className="input" value={d.setor} onChange={(e) => set('setor', e.target.value)}>
              {Object.entries(PACKS).map(([k, p]) => (
                <option key={k} value={k}>
                  {p.nome}
                </option>
              ))}
            </select>
            <Origem texto={og.setor} />
          </label>
          <label className="field">
            <span className="field-label">Porte</span>
            <select className="input" value={d.porte} onChange={(e) => set('porte', e.target.value)}>
              {PORTES.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          {CAMPOS.map(([k, l, ph]) => (
            <label key={k} className="field">
              <span className="field-label">{l}</span>
              <input className="input" value={d[k]} placeholder={ph} onChange={(e) => set(k, e.target.value)} />
              <Origem texto={og[k]} />
            </label>
          ))}
        </div>
      </section>

      <Secao titulo="Para quem" id="dlj-perfil">
        <div className="jg-grid jg-grid--3" role="radiogroup" aria-label="Perfil do cliente">
          {PERFIS.map((p, i) => {
            const sel = Number(d.perfil) === i + 1;
            return (
              <button key={p} type="button" role="radio" aria-checked={sel} className={`surface dlj-option ${sel ? 'is-selected' : ''}`} onClick={() => set('perfil', i + 1)}>
                <span className="dlj-option__num">{i + 1}.</span>
                <span>{p}</span>
              </button>
            );
          })}
        </div>
      </Secao>

      <Secao titulo="Quando acionar" id="dlj-gatilho">
        {og.gatilho ? <p className="dlj-origem dlj-mb">Do contexto: {og.gatilho}</p> : null}
        <div className="jg-grid jg-grid--4" role="radiogroup" aria-label="Gatilho">
          {Object.entries(GATILHOS).map(([k, [t, s]]) => {
            const sel = d.gatilho === k;
            return (
              <button key={k} type="button" role="radio" aria-checked={sel} className={`surface dlj-option ${sel ? 'is-selected' : ''}`} onClick={() => set('gatilho', k)}>
                <strong className="dlj-option__title">{t}</strong>
                <span className="jg-muted">{s}</span>
              </button>
            );
          })}
        </div>
      </Secao>

      <Secao titulo="Maturidade atual" id="dlj-maturidade">
        <div className="surface">
          <p className="jg-muted dlj-mb">1 = muito baixa · 5 = muito alta</p>
          {Object.entries(MAT).map(([k, l]) => (
            <Faixa
              key={k}
              label={l}
              value={d.mat[k]}
              min={1}
              max={5}
              dica={og.mat ? (og.mat[k] ? `Do contexto: ${og.mat[k]}` : 'Sem dado no contexto: ajuste manualmente') : undefined}
              dicaNeutra={Boolean(og.mat) && !og.mat[k]}
              onChange={(v) =>
                loja.mudar((X) => {
                  X.desafio.mat[k] = v;
                })
              }
            />
          ))}
          <label className="dlj-check">
            <input type="checkbox" checked={d.longo} onChange={(e) => set('longo', e.target.checked)} />
            <span>O desafio envolve horizonte de longo prazo (3 anos ou mais) ou mudanças fortes de contexto</span>
          </label>
        </div>
      </Secao>

      <div className="dlj-row">
        <button type="button" className="btn btn--primary" onClick={() => loja.triar()}>
          Executar triagem e recomendar <Icon name="chevronRight" size={14} />
        </button>
        {rec ? (
          <span className="jg-muted">
            Última recomendação: <strong>{rec.nome}</strong>
          </span>
        ) : null}
      </div>
    </div>
  );
}
