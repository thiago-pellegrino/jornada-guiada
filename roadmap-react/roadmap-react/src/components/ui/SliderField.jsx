import { useEffect, useId, useState } from 'react';
import { fmtNumber } from '../../domain/format.js';

/**
 * Controle deslizante acessível (DS §20.6 `.slider-row`):
 * o campo numérico é o controle canônico (teclado e leitor de tela) e o range é auxiliar;
 * os dois ficam sincronizados. Limites validados com mensagem em linguagem de negócio.
 */
export default function SliderField({
  label,
  labelNode,
  value,
  onChange,
  min,
  max,
  sliderMin = min,
  sliderMax = max,
  step = 1,
  unit = '',
  valueText,
  ticks,
  accentToken,
  hint,
  name,
}) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft(String(value));
    setError('');
  }, [value]);

  const rangeValue = Math.min(Math.max(value, sliderMin), sliderMax);
  const fill = sliderMax > sliderMin ? ((rangeValue - sliderMin) / (sliderMax - sliderMin)) * 100 : 0;

  function commitNumber(raw) {
    setDraft(raw);
    if (raw.trim() === '') {
      setError(`Informe ${label.toLowerCase()}.`);
      return;
    }
    const parsed = Number(raw.replace(',', '.'));
    if (!Number.isFinite(parsed)) {
      setError('Use apenas números.');
      return;
    }
    if (parsed < min || parsed > max) {
      setError(`Informe um valor entre ${fmtNumber(min)} e ${fmtNumber(max)}${unit ? ` ${unit}` : ''}.`);
      return;
    }
    if (step >= 1 && !Number.isInteger(parsed)) {
      setError('Informe um número inteiro.');
      return;
    }
    setError('');
    onChange(parsed);
  }

  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-err` : null].filter(Boolean).join(' ') || undefined;
  const tickList = ticks || [
    { value: sliderMin, label: `${fmtNumber(sliderMin)}${unit ? ` ${unit}` : ''} (Mínimo)` },
    { value: sliderMax, label: `${fmtNumber(sliderMax)}${unit ? ` ${unit}` : ''} (Teto)` },
  ];

  return (
    <div className={`slider-field ${error ? 'is-invalid' : ''}`}>
      <div className="slider-field__head">
        {labelNode ? (
          <div className="slider-field__label">{labelNode}</div>
        ) : (
          <label className="slider-field__label" htmlFor={`${id}-num`}>
            {accentToken ? <span className="squad-dot" style={{ background: `var(${accentToken})` }} aria-hidden="true" /> : null}
            {label}
          </label>
        )}
        <span className="slider-field__value tabular" aria-hidden="true">
          {valueText ?? `${fmtNumber(value)}${unit ? ` ${unit}` : ''}`}
        </span>
      </div>
      <div className="slider-row">
        <div className="slider-row__track">
          <input
            type="range"
            className="range"
            min={sliderMin}
            max={sliderMax}
            step={step}
            value={rangeValue}
            onChange={(event) => commitNumber(event.target.value)}
            aria-label={`${label} (controle deslizante)`}
            aria-valuetext={valueText ?? `${value}${unit ? ` ${unit}` : ''}`}
            style={{ '--fill': `${fill}%` }}
            tabIndex={-1}
          />
          <div className="slider-ticks" aria-hidden="true">
            {tickList.map((tick) => (
              <span key={`${tick.value}-${tick.label}`}>{tick.label}</span>
            ))}
          </div>
        </div>
        <div className="number-field">
          <input
            id={`${id}-num`}
            name={name}
            type="number"
            inputMode="decimal"
            className="number-field__input tabular"
            min={min}
            max={max}
            step={step}
            value={draft}
            onChange={(event) => commitNumber(event.target.value)}
            onBlur={() => {
              setDraft(String(value));
              setError('');
            }}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy}
          />
          {unit ? <span className="number-field__unit">{unit}</span> : null}
        </div>
      </div>
      {hint ? (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="err" id={`${id}-err`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
