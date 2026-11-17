import { useEffect } from 'react';

/**
 * Toast de feedback leve (DS §7.21): região role="status" sempre presente,
 * mensagem some após 2,3 s.
 */
export default function Toast({ toast, onDone, duration = 2300 }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(onDone, duration);
    return () => window.clearTimeout(timer);
  }, [toast, onDone, duration]);

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toast ? (
        <div key={toast.id} className="toast">
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
