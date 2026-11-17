import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { fmtNumber, fmtPct } from '../../domain/format.js';

const BASE_W = 720;
const H = 250;
const PAD = { l: 52, r: 18, t: 26, b: 32 };

const MILESTONE_CARDS = [
  { weekId: 'w02', title: 'S06', caption: 'Posição atual' },
  { weekId: 'w10', title: 'S14', caption: 'Meio do ciclo' },
  { weekId: 'w17', title: 'S21', caption: 'Homologação' },
  { weekId: 'w19', title: 'S23', caption: 'Produção' },
  { weekId: 'freeze', title: '17/12', caption: 'Freezing' },
];

function niceMax(value) {
  if (value <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(value));
  const n = value / exp;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * exp;
}

function axisLabel(hours) {
  if (hours >= 1000) return `${fmtNumber(hours / 1000, 1, 0)} mil h`;
  return `${fmtNumber(hours)} h`;
}

/** Curva de entrega acumulada × capacidade (DS §18.5, §18.11, §18.12) + cartões de marcos. */
export default function ProjectionChartCard({ result }) {
  const id = useId();
  const { curve, kpis } = result;
  const freezePoint = curve.findIndex((p) => p.frozen);
  const [view, setView] = useState('chart');
  const [active, setActive] = useState(freezePoint >= 0 ? freezePoint : curve.length - 1);
  const [showTip, setShowTip] = useState(false);
  const svgRef = useRef(null);
  const chartRef = useRef(null);
  const [W, setW] = useState(BASE_W);

  // Mede o contêiner para que o texto do SVG mantenha o tamanho real (sem esticar).
  useEffect(() => {
    const node = chartRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;
    const update = () => setW(Math.max(420, Math.round(node.clientWidth)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [view]);

  const geometry = useMemo(() => {
    const n = curve.length;
    const innerW = W - PAD.l - PAD.r;
    const innerH = H - PAD.t - PAD.b;
    const last = curve[n - 1];
    const maxY = niceMax(Math.max(kpis.totalDemandHours, last.capacityCumulativeHours, last.plannedCumulativeHours) * 1.05);
    const x = (i) => PAD.l + (n > 1 ? (i * innerW) / (n - 1) : innerW / 2);
    const y = (v) => PAD.t + innerH - (Math.max(0, v) / maxY) * innerH;
    const base = y(0);
    const linePts = curve.map((p, i) => `${x(i).toFixed(1)},${y(p.plannedCumulativeHours).toFixed(1)}`);
    const capPts = curve.map((p, i) => `${x(i).toFixed(1)},${y(p.capacityCumulativeHours).toFixed(1)}`);
    const area = `M${x(0).toFixed(1)},${base.toFixed(1)} L${linePts.join(' L')} L${x(n - 1).toFixed(1)},${base.toFixed(1)} Z`;
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((r) => ({ value: maxY * r, y: y(maxY * r) }));
    const step = n > 1 ? innerW / (n - 1) : innerW;
    return { n, x, y, base, area, line: `M${linePts.join(' L')}`, cap: `M${capPts.join(' L')}`, ticks, step, demandY: y(kpis.totalDemandHours) };
  }, [curve, kpis.totalDemandHours, W]);

  const point = curve[Math.min(active, curve.length - 1)];
  const pointLabel = point.frozen ? `Freezing (${point.dateLabel})` : `${point.sprintWeek} · semana de ${point.dateLabel}`;
  const summary = `${pointLabel}: ${fmtNumber(point.plannedCumulativeHours)} horas entregues acumuladas (${fmtNumber(point.completedStoriesEquivalent, 1)} US, ${fmtPct(point.pctOfDemand)} da demanda); capacidade acumulada ${fmtNumber(point.capacityCumulativeHours)} horas.`;

  function handleKey(event) {
    const keys = { ArrowRight: 1, ArrowLeft: -1 };
    if (event.key in keys) {
      event.preventDefault();
      setActive((i) => Math.min(curve.length - 1, Math.max(0, i + keys[event.key])));
      setShowTip(true);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActive(0);
      setShowTip(true);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActive(curve.length - 1);
      setShowTip(true);
    } else if (event.key === 'Escape') {
      setShowTip(false);
    }
  }

  function handlePointer(event) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const vx = ((event.clientX - rect.left) / rect.width) * W;
    const index = Math.round((vx - PAD.l) / geometry.step);
    setActive(Math.min(curve.length - 1, Math.max(0, index)));
    setShowTip(true);
  }

  const activeX = geometry.x(active);
  const tipLeft = Math.min(82, Math.max(18, (activeX / W) * 100));

  return (
    <section className="surface" aria-labelledby={`${id}-title`}>
      <header className="surface-head">
        <h2 id={`${id}-title`} className="surface-title">Curva de entrega acumulada × capacidade (semana × horas)</h2>
        <div className="segmented segmented--sm" role="radiogroup" aria-label="Forma de exibição">
          {[
            ['chart', 'Gráfico'],
            ['table', 'Tabela de marcos'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={view === value}
              className={`segmented__btn ${view === value ? 'is-selected' : ''}`}
              onClick={() => setView(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <p id={`${id}-desc`} className="visually-hidden">
        Gráfico de linha com a entrega acumulada em horas de {curve[0].sprintWeek} a {curve[curve.length - 1].sprintWeek}, a capacidade acumulada e a demanda total de{' '}
        {fmtNumber(kpis.totalDemandHours)} horas. Até o Freezing são entregues {fmtPct(kpis.hoursPctBeforeFreeze)} das horas. Use a tabela de marcos para os valores completos.
      </p>

      {view === 'chart' ? (
        <div
          ref={chartRef}
          className="chart"
          tabIndex={0}
          role="group"
          aria-roledescription="gráfico interativo"
          aria-label="Curva de projeção. Use as setas para percorrer as semanas, Home e End para ir ao início e ao fim, Esc para fechar o detalhe."
          onKeyDown={handleKey}
          onBlur={() => setShowTip(false)}
        >
          <svg
            ref={svgRef}
            className="chart__svg"
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-desc`}
            onMouseMove={handlePointer}
            onMouseLeave={() => setShowTip(false)}
          >
            <defs>
              <pattern id={`${id}-hatch`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="6" className="chart__hatch-line" />
              </pattern>
            </defs>

            {geometry.ticks.map((tick) => (
              <g key={tick.value}>
                <line x1={PAD.l} x2={W - PAD.r} y1={tick.y} y2={tick.y} className="chart__grid" />
                <text x={PAD.l - 8} y={tick.y + 4} className="chart__axis-label" textAnchor="end">
                  {axisLabel(tick.value)}
                </text>
              </g>
            ))}

            {freezePoint >= 0 ? (
              <g>
                <rect
                  x={geometry.x(freezePoint) - geometry.step / 2}
                  y={PAD.t}
                  width={geometry.step}
                  height={geometry.base - PAD.t}
                  fill={`url(#${id}-hatch)`}
                  className="chart__freeze"
                />
                <text x={geometry.x(freezePoint)} y={PAD.t - 8} className="chart__milestone-label" textAnchor="middle">
                  Freezing
                </text>
              </g>
            ) : null}

            {curve.map((p, i) =>
              p.milestone && !p.frozen ? (
                <g key={p.weekId}>
                  <line x1={geometry.x(i)} x2={geometry.x(i)} y1={PAD.t} y2={geometry.base} className="chart__milestone" />
                  <text x={geometry.x(i)} y={PAD.t - 8} className="chart__milestone-label" textAnchor="middle">
                    {p.milestone === 'ESTAMOS AQUI' ? 'Hoje' : p.milestone === 'HOMOLOGAÇÃO' ? 'Homolog.' : 'Produção'}
                  </text>
                </g>
              ) : null,
            )}

            <path d={geometry.area} className="chart__area" />
            <path d={geometry.cap} className="chart__capacity" />
            <line x1={PAD.l} x2={W - PAD.r} y1={geometry.demandY} y2={geometry.demandY} className="chart__demand" />
            <text x={W - PAD.r} y={geometry.demandY - 6} className="chart__demand-label" textAnchor="end">
              Demanda total · {fmtNumber(kpis.totalDemandHours)} h
            </text>
            <path d={geometry.line} className="chart__line" />

            <line x1={activeX} x2={activeX} y1={PAD.t} y2={geometry.base} className="chart__guide" />
            <circle cx={activeX} cy={geometry.y(point.plannedCumulativeHours)} r="5" className="chart__dot" />

            {curve.map((p, i) =>
              i === 0 || i === curve.length - 1 || (i % 4 === 0 && !p.frozen) ? (
                <text key={p.weekId} x={geometry.x(i)} y={H - 10} className="chart__axis-label" textAnchor={i === 0 ? 'start' : i === curve.length - 1 ? 'end' : 'middle'}>
                  {p.sprintWeek}
                </text>
              ) : null,
            )}
          </svg>

          {showTip ? (
            <div className="chart__tip" style={{ left: `${tipLeft}%` }} aria-hidden="true">
              <strong>{pointLabel}</strong>
              <span className="tabular">
                Entregue: {fmtNumber(point.plannedCumulativeHours)} h · {fmtNumber(point.completedStoriesEquivalent, 1)} US
              </span>
              <span className="tabular">
                {fmtPct(point.pctOfDemand)} da demanda · capacidade {fmtNumber(point.capacityCumulativeHours)} h
              </span>
            </div>
          ) : null}
          <p className="visually-hidden" aria-live="polite">
            {showTip ? summary : ''}
          </p>

          <ul className="chart-legend" aria-hidden="true">
            <li>
              <span className="chart-legend__swatch chart-legend__swatch--line" /> Entrega acumulada
            </li>
            <li>
              <span className="chart-legend__swatch chart-legend__swatch--capacity" /> Capacidade acumulada
            </li>
            <li>
              <span className="chart-legend__swatch chart-legend__swatch--demand" /> Demanda total
            </li>
            <li>
              <span className="chart-legend__swatch chart-legend__swatch--freeze" /> Freezing
            </li>
          </ul>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="data-table" aria-describedby={`${id}-desc`}>
            <thead>
              <tr>
                <th scope="col">Semana</th>
                <th scope="col">Início</th>
                <th scope="col">Marco</th>
                <th scope="col" className="num">Entregue acumulado (h)</th>
                <th scope="col" className="num">US equivalentes</th>
                <th scope="col" className="num">% da demanda</th>
                <th scope="col" className="num">Capacidade acumulada (h)</th>
              </tr>
            </thead>
            <tbody>
              {curve.map((p) => (
                <tr key={p.weekId} className={p.frozen ? 'is-freeze' : undefined}>
                  <th scope="row">{p.sprintWeek}</th>
                  <td className="tabular">{p.dateLabel}</td>
                  <td>{p.milestone ? p.milestone.charAt(0) + p.milestone.slice(1).toLowerCase() : '—'}</td>
                  <td className="num tabular">{fmtNumber(p.plannedCumulativeHours)}</td>
                  <td className="num tabular">{fmtNumber(p.completedStoriesEquivalent, 1)}</td>
                  <td className="num tabular">{fmtPct(p.pctOfDemand)}</td>
                  <td className="num tabular">{fmtNumber(p.capacityCumulativeHours)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ul className="milestones">
        {MILESTONE_CARDS.map((card) => {
          const p = curve.find((c) => c.weekId === card.weekId);
          if (!p) return null;
          return (
            <li key={card.weekId} className={`milestone ${card.weekId === 'freeze' ? 'milestone--freeze' : ''}`}>
              <span className="milestone__title">
                {card.title} · {card.caption}
              </span>
              <strong className="milestone__value tabular">{fmtPct(p.pctOfDemand, 0)}</strong>
              <span className="milestone__sub tabular">{fmtNumber(p.completedStoriesEquivalent, 0)} US entregues</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
