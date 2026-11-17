import { useEffect, useState } from 'react';

/**
 * Campo numérico com rascunho local: só confirma valores válidos, mostra o erro
 * (aria-invalid) e volta ao valor confirmado ao sair do campo.
 */
export default function NumberInput({
  value,
  onCommit,
  min,
  max,
  step = 1,
  integer = true,
  allowEmptyAsZero = false,
  className = 'input',
  invalidMessage,
  title,
  ...rest
}) {
  const [draft, setDraft] = useState(value === 0 && allowEmptyAsZero ? '' : String(value));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setDraft(value === 0 && allowEmptyAsZero ? '' : String(value));
    setInvalid(false);
  }, [value, allowEmptyAsZero]);

  function handleChange(event) {
    const raw = event.target.value;
    setDraft(raw);
    if (raw.trim() === '') {
      if (allowEmptyAsZero) {
        setInvalid(false);
        onCommit(0);
      } else {
        setInvalid(true);
      }
      return;
    }
    const parsed = Number(raw.replace(',', '.'));
    const ok =
      Number.isFinite(parsed) &&
      parsed >= min &&
      parsed <= max &&
      (!integer || Number.isInteger(parsed));
    setInvalid(!ok);
    if (ok) onCommit(parsed);
  }

  return (
    <input
      type="number"
      inputMode={integer ? 'numeric' : 'decimal'}
      className={`${className} ${invalid ? 'is-invalid' : ''}`.trim()}
      min={min}
      max={max}
      step={step}
      value={draft}
      onChange={handleChange}
      onBlur={() => {
        setDraft(value === 0 && allowEmptyAsZero ? '' : String(value));
        setInvalid(false);
      }}
      aria-invalid={invalid ? 'true' : undefined}
      title={invalid ? invalidMessage || `Informe um valor entre ${min} e ${max}.` : title}
      {...rest}
    />
  );
}
