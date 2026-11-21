import Icon from '../ui/Icon.jsx';
import { MOTORES, PRODUTOS } from '../../domain/darklabs/conteudo.js';
import { dec1 } from '../../domain/darklabs/formato.js';
import { ROLES } from '../../domain/darklabs/conteudo.js';
import { brl, fmt } from '../../domain/darklabs/formato.js';
import { custo, horasTotais, produtoPorId } from '../../domain/darklabs/simulacao.js';
import { Aviso, Cabecalho, ChipMotor, ICONE_PRODUTO, IconeMotor, Secao, Tag, corMotor } from './bits.jsx';

/** Investimento e horas do produto com o squad padrão dele (antes de qualquer ajuste no Squad). */
function estimativa(p) {
  const S = { squad: p.roles, areas: p.areas };
  return { valor: custo(S, ROLES, p), horas: horasTotais(S, ROLES, p) };
}

function CartaoProduto({ p, selecionado, recomendado, complemento, onEscolher }) {
  const est = estimativa(p);
  const completo = p.id === 'completa';
  const classes = ['surface', 'dlj-product', completo && 'dlj-product--wide', selecionado && 'is-selected', recomendado && 'is-recommended'].filter(Boolean).join(' ');
  return (
    <article className={classes} aria-labelledby={`dlj-prod-${p.id}`}>
      <header className="dlj-product__head">
        <span className="dlj-product__ico">
          <Icon name={ICONE_PRODUTO[p.id]} size={22} />
        </span>
        <div className="dlj-product__title">
          <span className="jg-cap__step">{completo ? 'Pacote' : `#${p.n}`}</span>
          <h4 id={`dlj-prod-${p.id}`} className="dlj-card__title">
            {p.nome}
          </h4>
          <p className="dlj-product__tag">{p.tag}</p>
        </div>
        <div className="dlj-product__badges">
          {selecionado ? (
            <Tag tom="info">
              <Icon name="check" size={12} /> Selecionado
            </Tag>
          ) : null}
          {recomendado ? <Tag tom="ok">Recomendado</Tag> : complemento ? <Tag tom="warn">Complemento</Tag> : null}
        </div>
      </header>

      <div className="dlj-product__body">
        <p className="dlj-product__desc">{p.desc}</p>
        <ul className="dlj-product__motors" aria-label="Motores do produto">
          {p.motores.map((m) => {
            const mo = MOTORES[m - 1];
            return (
              <li key={m} style={{ '--mc': corMotor(m) }} title={mo.nome}>
                <IconeMotor n={m} size={14} />
                <span>
                  {m}. {mo.verbo}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <footer className="dlj-product__foot">
        <dl className="dlj-product__facts">
          <div>
            <dt>Duração</dt>
            <dd>{p.rec ? `ciclos de ${p.dias} dias` : `${p.dias} dias${p.est ? '*' : ''}`}</dd>
          </div>
          <div>
            <dt>Investimento</dt>
            <dd>{brl(est.valor)}</dd>
          </div>
          <div>
            <dt>Especialistas</dt>
            <dd>{fmt(est.horas)} h</dd>
          </div>
        </dl>
        <button type="button" className={`btn btn--sm ${selecionado ? 'btn--primary' : ''}`} onClick={onEscolher}>
          {selecionado ? 'Montar squad' : 'Escolher este produto'} <Icon name="chevronRight" size={14} />
        </button>
      </footer>
    </article>
  );
}

export default function TelaPrateleira({ loja }) {
  const { S } = loja;
  const r = S.triado ? S.rec : null;
  const rp = r ? produtoPorId(r.id) : null;

  return (
    <div className="dlj-stack">
      <Cabecalho eyebrow="Etapa 2 · Escolha do produto" titulo="Prateleira de serviços">
        Uma prateleira modular de capacidades que transforma oportunidades em produtos, MVPs e novos negócios, no ritmo que a estratégia exige.
      </Cabecalho>

      {r ? (
        <section className="surface dlj-card--accent dlj-rec" style={{ '--mc': 'var(--chart-1)' }} aria-labelledby="dlj-rec-title">
          <div className="dlj-row dlj-row--between">
            <div>
              <p className="jg-eyebrow">Recomendação da triagem</p>
              <h3 id="dlj-rec-title" className="dlj-rec__title">
                {rp.nome}
              </h3>
            </div>
            <Tag tom="info">Maturidade {dec1(r.avg)} / 5</Tag>
          </div>
          <ul className="dlj-list">
            {r.mot.map((x) => (
              <li key={x}>{x}</li>
            ))}
            {r.comp ? (
              <li>
                Complemento sugerido: <strong>{produtoPorId(r.comp).nome}</strong>, para incluir horizonte de longo prazo.
              </li>
            ) : null}
          </ul>
        </section>
      ) : (
        <Aviso
          acoes={
            <button type="button" className="btn btn--sm" onClick={() => loja.go('triagem')}>
              Ir para a triagem
            </button>
          }
        >
          Faça a triagem para receber uma recomendação, ou escolha um produto diretamente.
        </Aviso>
      )}

      <div className="dlj-shelf">
        {PRODUTOS.map((p) => (
          <CartaoProduto
            key={p.id}
            p={p}
            selecionado={S.produto === p.id}
            recomendado={Boolean(r && r.id === p.id)}
            complemento={Boolean(r && r.comp === p.id)}
            onEscolher={() => loja.escolherProduto(p.id)}
          />
        ))}
      </div>

      <Secao titulo="Produtos × motores" id="dlj-pxm">
        <div className="surface">
          <div className="dlj-table-wrap">
            <table className="data-table dlj-matrix">
              <thead>
                <tr>
                  <th>Produto</th>
                  {MOTORES.map((m) => (
                    <th key={m.n} className="cell-center">
                      <ChipMotor n={m.n} small />
                      <span className="dlj-matrix__verb">{m.verbo}</span>
                    </th>
                  ))}
                  <th className="num">Duração</th>
                </tr>
              </thead>
              <tbody>
                {PRODUTOS.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.nome}</strong>
                    </td>
                    {MOTORES.map((m) => (
                      <td key={m.n} className="cell-center">
                        {p.motores.includes(m.n) ? <span className="dlj-dot" style={{ '--mc': `var(--chart-${m.n})` }} aria-label="incluído" /> : <span className="jg-muted">·</span>}
                      </td>
                    ))}
                    <td className="num">{p.rec ? 'recorrente' : `${p.dias} d`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="field-hint dlj-mt">
            O mapeamento produto × motor e os prazos de Impulso e Foresight (*) são premissas da simulação. Investimento e horas usam o squad padrão de cada
            produto; ajuste a dedicação na etapa Squad.
          </p>
        </div>
      </Secao>
    </div>
  );
}
