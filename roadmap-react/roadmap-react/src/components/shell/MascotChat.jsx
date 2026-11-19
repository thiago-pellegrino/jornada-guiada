import { useEffect, useRef, useState } from 'react';

/**
 * Mini chat preso à mascote do Delta. Só apresenta: quem responde é o DeltaMascot
 * (respostas locais ou o modelo B.Y.O.K. ativo). A mascote não executa tarefas; as ações
 * das respostas apenas levam a pessoa até a página ou ao Delta completo.
 */
export default function MascotChat({
  id,
  classe,
  altura,
  mensagens,
  respondendo,
  parcial,
  sugestoes,
  motorRotulo,
  onEnviar,
  onAcao,
  onFechar,
  onLimpar,
  onAbrirDelta,
}) {
  const [rascunho, setRascunho] = useState('');
  const logRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mensagens, respondendo, parcial]);

  function enviar(e) {
    e.preventDefault();
    const t = rascunho.trim();
    if (!t || respondendo) return;
    setRascunho('');
    onEnviar(t);
  }

  const ultima = mensagens[mensagens.length - 1];
  const chips = respondendo ? [] : !mensagens.length ? sugestoes : ultima?.role === 'assistant' && ultima.sugestoes?.length ? ultima.sugestoes : [];

  return (
    <section
      id={id}
      className={`dm-chat ${classe}`}
      style={{ '--dm-chat-h': `${altura}px` }}
      role="dialog"
      aria-label="Chat com o Delta"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onFechar();
        }
      }}
    >
      <header className="dm-chat__head">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="#fff" d="M12 2 C12.9 8.2 15.8 11.1 22 12 C15.8 12.9 12.9 15.8 12 22 C11.1 15.8 8.2 12.9 2 12 C8.2 11.1 11.1 8.2 12 2 Z" />
        </svg>
        <div className="dm-chat__title">
          <strong>Delta</strong>
          <span>{motorRotulo}</span>
        </div>
        <button type="button" onClick={onAbrirDelta} aria-label="Abrir o Delta completo" title="Abrir o Delta completo">
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" />
          </svg>
        </button>
        <button type="button" onClick={onLimpar} disabled={!mensagens.length || respondendo} aria-label="Nova conversa" title="Nova conversa">
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button type="button" onClick={onFechar} aria-label="Fechar o chat" title="Fechar o chat">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>

      <ol className="dm-chat__log" ref={logRef} role="log" aria-live="polite">
        {!mensagens.length ? (
          <li className="dm-msg dm-msg--assistant">
            <p>
              Oi! Sou o Delta. Pergunte sobre esta página, o projeto ou a simulação das squads. Eu respondo e sugiro o próximo passo; quem executa é
              você.
            </p>
          </li>
        ) : null}
        {mensagens.map((m) => (
          <li key={m.id} className={`dm-msg dm-msg--${m.role} ${m.dica ? 'is-tip' : ''}`}>
            {m.aviso ? <em className="dm-msg__aviso">{m.aviso}</em> : null}
            <p>{m.texto}</p>
            {m.bullets?.length ? (
              <ul>
                {m.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
            {m.acoes?.length ? (
              <div className="dm-msg__acoes">
                {m.acoes.map((a) => (
                  <button key={a.rotulo} type="button" onClick={() => onAcao(a)}>
                    {a.rotulo}
                  </button>
                ))}
              </div>
            ) : null}
            {m.motor ? <span className="dm-msg__motor">{m.motor}</span> : null}
          </li>
        ))}
        {respondendo ? (
          <li className="dm-msg dm-msg--assistant" aria-label="Delta está respondendo">
            {parcial ? (
              <p>{parcial}</p>
            ) : (
              <span className="dm-msg__dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            )}
          </li>
        ) : null}
      </ol>

      {chips.length ? (
        <div className="dm-chat__chips">
          {chips.map((s) => (
            <button key={s} type="button" onClick={() => onEnviar(s)}>
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <form className="dm-chat__form" onSubmit={enviar}>
        <input
          ref={inputRef}
          type="text"
          value={rascunho}
          onChange={(e) => setRascunho(e.target.value)}
          placeholder="Pergunte ao Delta"
          aria-label="Mensagem para o Delta"
          maxLength={600}
          autoComplete="off"
        />
        <button type="submit" disabled={!rascunho.trim() || respondendo} aria-label="Enviar">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </form>
    </section>
  );
}
