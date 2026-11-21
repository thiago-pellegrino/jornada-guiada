import DarklabMenuIcon from '../darklab/DarklabMenuIcons.jsx';
import { BASE, MOTORES, ROLES } from '../../domain/darklabs/conteudo.js';
import { brl, fmt } from '../../domain/darklabs/formato.js';
import { custo, diasMotor, metricas, prod } from '../../domain/darklabs/simulacao.js';
import { Barra, Cabecalho, IconeMotor, Kpi, Tag, TagHipotese, Vazio, corMotor } from './bits.jsx';

function CartaoGanho({ cor, icone, titulo, linhas }) {
  return (
    <section className="surface dlj-card--accent dlj-gain" style={{ '--mc': cor }}>
      <span className="dlj-ico">{icone}</span>
      <h3 className="dlj-card__title">{titulo}</h3>
      <div className="dlj-gain__kpis">
        {linhas.map(([v, r]) => (
          <Kpi key={r} valor={v} rotulo={r} />
        ))}
      </div>
    </section>
  );
}

const CORES_HIP = [
  ['confirmada', 'var(--color-success-text)'],
  ['inconclusiva', 'var(--chart-4)'],
  ['rejeitada', 'var(--color-danger-text)'],
  ['aberta', 'var(--color-border-strong)'],
];

export default function TelaGanhos({ loja }) {
  const { S } = loja;
  if (!S.iniciada) return <Vazio titulo="Ainda não há ganhos para medir" texto="Os indicadores aparecem conforme a jornada avança." rotulo="Começar pela triagem" onClick={() => loja.go('triagem')} />;
  const M = metricas(S, ROLES);
  const p = prod(S);
  const total = custo(S, ROLES, p);
  const H = S.hipoteses;
  const nH = H.length || 1;
  const maior = Math.max(...p.motores.map((x) => diasMotor(S, x)));

  return (
    <div className="dlj-stack">
      <Cabecalho eyebrow="Indicadores da simulação" titulo="Principais ganhos">
        O DarkLabs transforma a inovação de um processo artesanal num sistema contínuo de evolução de negócios, onde humanos definem o futuro e agentes inteligentes aceleram sua materialização.
      </Cabecalho>

      <div className="jg-grid jg-grid--4">
        <CartaoGanho
          cor={corMotor(1)}
          icone={<DarklabMenuIcon name="shield" size={20} />}
          titulo="Decisão inteligente"
          linhas={[
            [`${M.pctEv}%`, `das ${M.dec} decisões com confiança de 70% ou mais`],
            [`${M.test}/${M.tot}`, 'hipóteses testadas com evidência'],
          ]}
        />
        <CartaoGanho
          cor={corMotor(3)}
          icone={<IconeMotor n={5} size={20} />}
          titulo="Velocidade de inovação"
          linhas={[
            [`${M.dias} dias`, `contra ~${fmt(M.base)} no modelo tradicional`],
            [`${M.ganhoVel}%`, 'menos tempo até o resultado'],
            [M.primeira != null ? `dia ${M.primeira}` : '—', 'primeira decisão de gate'],
          ]}
        />
        <CartaoGanho
          cor={corMotor(5)}
          icone={<IconeMotor n={3} size={20} />}
          titulo="Produtos assertivos"
          linhas={[
            [`${M.confd}/${M.tot}`, 'hipóteses confirmadas'],
            [brl(M.custoEv), 'custo evitado com ideias descartadas cedo'],
          ]}
        />
        <CartaoGanho
          cor={corMotor(7)}
          icone={<IconeMotor n={7} size={20} />}
          titulo="Evolução contínua"
          linhas={[
            [M.ciclos, 'ciclos concluídos'],
            [M.backlog, 'itens no backlog do futuro'],
            [M.ativos, 'ativos digitais reutilizáveis'],
          ]}
        />
      </div>

      <div className="jg-grid jg-grid--2">
        <section className="surface" aria-labelledby="dlj-invm">
          <header className="surface-head">
            <h3 id="dlj-invm" className="surface-title">
              Investimento por motor · ciclo {S.ciclo}
            </h3>
          </header>
          <div className="dlj-hbars">
            {p.motores.map((m) => (
              <div key={m} className="dlj-hbar">
                <span>
                  {m}. {MOTORES[m - 1].verbo}
                </span>
                <Barra pct={(diasMotor(S, m) / maior) * 100} cor={corMotor(m)} />
                <span className="tabular">{brl((total * diasMotor(S, m)) / p.dias)}</span>
              </div>
            ))}
          </div>
          <div className="dlj-kpis dlj-kpis--3 dlj-mt">
            <Kpi valor={brl(M.invest)} rotulo="investimento acumulado" />
            <Kpi valor={brl(M.valor)} rotulo="valor potencial anual" />
            <Kpi valor={M.invest ? `${fmt(M.roi)}%` : '—'} rotulo="ROI no primeiro ano" tom={M.roi >= 0 ? 'success' : 'danger'} />
          </div>
        </section>

        <section className="surface" aria-labelledby="dlj-hipres">
          <header className="surface-head">
            <h3 id="dlj-hipres" className="surface-title">
              Hipóteses por resultado
            </h3>
          </header>
          <div className="dlj-stacked" aria-hidden="true">
            {CORES_HIP.map(([s, c]) => (
              <i key={s} style={{ width: `${(H.filter((h) => h.status === s).length / nH) * 100}%`, background: c }} />
            ))}
          </div>
          <ul className="dlj-rows">
            {H.map((h) => (
              <li key={h.id}>
                <span>
                  <strong>{h.id}</strong> {h.tipo}
                </span>
                <TagHipotese status={h.status} />
              </li>
            ))}
          </ul>
          <h4 className="dlj-card__title dlj-mt">Premissas da simulação</h4>
          <ul className="dlj-list">
            <li>Modelo tradicional {String(BASE).replace('.', ',')}× mais lento que o DarkLabs, sobre o tempo planejado do trabalho executado. Refazer métodos e ajustar gates reduz o ganho.</li>
            <li>Cada hipótese rejeitada evita cerca de 8% do investimento acumulado.</li>
            <li>Valor potencial = faturamento estimado pelo porte × ganho de 0,15% a 0,45%.</li>
            <li>Custo/hora: PMO R$ 260, Product R$ 300, Negócios R$ 320, Áreas R$ 280, Valuation R$ 330.</li>
          </ul>
        </section>
      </div>

      {S.historico.length ? (
        <section className="surface" aria-labelledby="dlj-ciclos">
          <header className="surface-head">
            <h3 id="dlj-ciclos" className="surface-title">
              Ciclos
            </h3>
          </header>
          <div className="dlj-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ciclo</th>
                  <th>Produto</th>
                  <th className="num">Dias</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {S.historico.map((h) => (
                  <tr key={h.ciclo}>
                    <td>{h.ciclo}</td>
                    <td>{h.produto}</td>
                    <td className="num">{h.dias}</td>
                    <td>
                      <Tag tom={h.status === 'concluido' ? 'ok' : 'bad'}>{h.status === 'concluido' ? 'concluído' : 'interrompido'}</Tag>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
