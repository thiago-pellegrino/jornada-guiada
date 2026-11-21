import Icon from '../ui/Icon.jsx';
import DarklabMenuIcon from '../darklab/DarklabMenuIcons.jsx';
import { STH, STM } from '../../domain/darklabs/conteudo.js';

/** Cor de cada motor: paleta categórica do design system (funciona nos temas claro e escuro). */
export const corMotor = (n) => `var(--chart-${n})`;

/** Ícone de cada motor, pelo verbo: enquadrar, compreender, direcionar, materializar, construir, comprovar, antecipar. */
const ICONE_MOTOR = { 1: 'frame', 2: 'signal', 3: 'compass', 4: 'penTool', 5: 'cube', 6: 'flask', 7: 'telescope' };

export function IconeMotor({ n, size = 18 }) {
  return <DarklabMenuIcon name={ICONE_MOTOR[n]} size={size} />;
}

/** Ícones dos papéis do squad e dos produtos da prateleira (biblioteca de ícones do sistema). */
export const ICONE_PAPEL = { pmo: 'tasks', product: 'compass', negocios: 'wallet', areas: 'users', valuation: 'chart' };
export const ICONE_PRODUTO = { impulso: 'sparkle', foresight: 'search', discovery: 'compass', innovation: 'wand', mvp: 'roadmap', evolution: 'reset', completa: 'layers' };

export function Cabecalho({ eyebrow, titulo, children, acoes, cor }) {
  return (
    <header className="dlj-head" style={cor ? { '--mc': cor } : undefined}>
      <div className="dlj-head__text">
        <h2 className="dlj-head__title">{titulo}</h2>
        {eyebrow ? <p className="dlj-head__sub">{eyebrow}</p> : null}
        {children ? <p className="dlj-lead">{children}</p> : null}
      </div>
      {acoes ? <div className="dlj-head__actions">{acoes}</div> : null}
    </header>
  );
}

export function Secao({ titulo, children, id }) {
  return (
    <section className="dlj-section" aria-labelledby={id}>
      <h3 id={id} className="jg-section-title">
        {titulo}
      </h3>
      {children}
    </section>
  );
}

/** Selo de situação: neutro, ok, aviso, erro ou informação. */
export function Tag({ tom = '', children, title }) {
  return (
    <span className={`dlj-tag ${tom ? `dlj-tag--${tom}` : ''}`.trim()} title={title}>
      {children}
    </span>
  );
}

const TOM_STATUS = { concluido: 'ok', andamento: 'info', disponivel: 'info', interrompido: 'bad', cancelado: 'bad' };

export function TagStatus({ status }) {
  return <Tag tom={TOM_STATUS[status] ?? ''}>{STM[status]}</Tag>;
}

export function TagHipotese({ status }) {
  return <Tag tom={STH[status][1]}>{STH[status][0]}</Tag>;
}

/** Número do motor num círculo com a cor dele; apagado quando o motor não entra no produto. */
export function ChipMotor({ n, ativo = true, title, small = false }) {
  return (
    <span className={`dlj-chip ${ativo ? '' : 'is-off'} ${small ? 'dlj-chip--sm' : ''}`.trim()} style={{ '--mc': corMotor(n) }} title={title}>
      {n}
    </span>
  );
}

export function Kpi({ valor, rotulo, tom }) {
  return (
    <div className="dlj-kpi">
      <strong className={tom ? `is-${tom}` : undefined}>{valor}</strong>
      <span>{rotulo}</span>
    </div>
  );
}

export function Barra({ pct, cor }) {
  return (
    <span className="dlj-bar" aria-hidden="true">
      <i style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: cor }} />
    </span>
  );
}

/** Régua de 1 valor (range do design system) com rótulo e valor à direita. */
export function Faixa({ label, value, min, max, step = 1, sufixo = '', onChange, disabled = false, formatar, dica, dicaNeutra = false }) {
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <label className="dlj-range">
      <span className="dlj-range__label">
        {label}
        {dica ? <small className={`dlj-origem ${dicaNeutra ? 'is-neutral' : ''}`.trim()}>{dica}</small> : null}
      </span>
      <input
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--fill': `${fill}%` }}
      />
      <b className="dlj-range__value tabular">
        {formatar ? formatar(value) : value}
        {sufixo}
      </b>
    </label>
  );
}

/** Tela ainda sem conteúdo: mesmo padrão das mensagens (texto à esquerda, ação à direita). */
export function Vazio({ titulo, texto, rotulo, onClick }) {
  return (
    <Aviso
      acoes={
        rotulo ? (
          <button type="button" className="btn btn--sm btn--primary" onClick={onClick}>
            {rotulo} <Icon name="chevronRight" size={14} />
          </button>
        ) : null
      }
    >
      <strong>{titulo}.</strong> {texto}
    </Aviso>
  );
}

export function Lista({ itens, cor }) {
  return (
    <ul className="dlj-list" style={cor ? { '--mc': cor } : undefined}>
      {itens.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ul>
  );
}

/**
 * Mensagem de alerta ou informação: texto à esquerda e ações à direita, no padrão do aviso
 * "ainda não tem contexto consolidado". Tons: info, warn, ok, bad.
 */
export function Aviso({ tom = 'info', children, acoes, className = '' }) {
  return (
    <div className={`dlj-aviso dlj-aviso--${tom} ${className}`.trim()}>
      <p className="dlj-aviso__texto">{children}</p>
      {acoes ? <div className="dlj-aviso__acoes">{acoes}</div> : null}
    </div>
  );
}
