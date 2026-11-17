import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildCopilotInsights,
  computeScenarioFingerprint,
  applyScenarioPatch,
} from '../../domain/simulationEngine.js';
import Icon, { CopilotMark } from '../ui/Icon.jsx';

const KEYWORDS = [
  { id: 'bottleneck', pattern: /gargal|atras|pior|lent/ },
  { id: 'headcount', pattern: /profission|pessoa|headcount|contrat|time|equipe|dev/ },
  { id: 'freeze-delivery', pattern: /freez|17\/12|congel|entreg|quanto/ },
  { id: 'mode-compare', pattern: /modo|modal|contínu|continu|inteir|compar/ },
];

function normalize(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

let messageSeq = 0;
const nextId = () => {
  messageSeq += 1;
  return `m${messageSeq}`;
};

/**
 * Painel lateral do Copiloto (DS §8 / §20.5): lê o cenário aberto, responde com números
 * calculados localmente e prepara propostas que só alteram o simulador após confirmação.
 */
export default function CopilotDrawer({ open, onClose, scenario, result, onApplyPatch, onUndo, panelRef }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const logEndRef = useRef(null);
  const closeRef = useRef(null);

  const fingerprint = useMemo(() => computeScenarioFingerprint(scenario), [scenario]);
  const bundle = useMemo(() => (open ? buildCopilotInsights(scenario, result) : null), [open, scenario, result]);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages]);

  function ask(insightId, questionText) {
    if (!bundle) return;
    const insight = bundle.insights.find((item) => item.id === insightId);
    if (!insight) return;
    setMessages((list) => [
      ...list,
      { id: nextId(), role: 'user', text: questionText || insight.question },
      { id: nextId(), role: 'assistant', kind: 'insight', insight },
    ]);
  }

  function propose(proposalId, questionText) {
    if (!bundle) return;
    const proposal = bundle.proposals.find((item) => item.id === proposalId);
    setMessages((list) => [
      ...list,
      { id: nextId(), role: 'user', text: questionText || proposal?.title || 'Preparar proposta' },
      proposal
        ? { id: nextId(), role: 'assistant', kind: 'proposal', proposal, status: 'pending' }
        : { id: nextId(), role: 'assistant', kind: 'text', text: 'Não há ajuste necessário para este pedido no cenário atual.' },
    ]);
  }

  function updateMessage(id, patch) {
    setMessages((list) => list.map((message) => (message.id === id ? { ...message, ...patch } : message)));
  }

  function confirm(message) {
    const { proposal } = message;
    const appliedFingerprint = computeScenarioFingerprint(applyScenarioPatch(scenario, proposal.patch));
    onApplyPatch(proposal.patch, `Delta: ${proposal.title}`);
    updateMessage(message.id, { status: 'applied', appliedFingerprint });
  }

  function recalc(message) {
    const fresh = bundle?.proposals.find((item) => item.id === message.proposal.id);
    if (fresh) updateMessage(message.id, { proposal: fresh, status: 'pending' });
    else updateMessage(message.id, { status: 'obsolete' });
  }

  function onSubmit(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    const norm = normalize(text);
    if (/balance|propost|ajust|resolver|otimiz/.test(norm) && bundle?.proposals.length) {
      propose(bundle.proposals[0].id, text);
      return;
    }
    const match = KEYWORDS.find((entry) => entry.pattern.test(norm));
    if (match) {
      ask(match.id, text);
      return;
    }
    setMessages((list) => [
      ...list,
      { id: nextId(), role: 'user', text },
      {
        id: nextId(),
        role: 'assistant',
        kind: 'text',
        text: 'Posso responder sobre gargalos, profissionais necessários, entregas até o Freezing e comparação entre modalidades — ou preparar uma proposta de balanceamento.',
      },
    ]);
  }

  return (
    <aside
      id="copilot-panel"
      ref={panelRef}
      className={`copilot ${open ? 'is-open' : ''}`}
      aria-labelledby="copilot-title"
      hidden={!open}
    >
      <header className="copilot__head">
        <span className="copilot__emblem" aria-hidden="true">
          <CopilotMark size={24} />
        </span>
        <div className="copilot__titles">
          <h2 id="copilot-title">Delta</h2>
          <p>Seu apoio em cada rotina</p>
        </div>
        <button ref={closeRef} type="button" className="icon-btn" onClick={onClose} aria-label="Fechar Delta">
          <Icon name="close" size={18} />
        </button>
      </header>

      <div className="copilot__context">
        <span className="copilot__context-label">Você está em</span>
        <span className="copilot__context-path">Gestão de Portfólio › Jornada Guiada</span>
      </div>

      <div className="copilot__body">
        <div className="copilot__welcome">
          <span className="demo-tag">Demonstração interativa</span>
          <p>
            Leio o cenário aberto no simulador e respondo com números calculados neste navegador. Propostas só alteram a simulação depois que você confirma.
          </p>
        </div>

        {bundle ? (
          <div className="copilot__suggestions" aria-label="Sugestões">
            {bundle.insights.map((insight) => (
              <button key={insight.id} type="button" className="suggestion" onClick={() => ask(insight.id)}>
                {insight.question}
                <Icon name="chevronRight" size={14} />
              </button>
            ))}
            {bundle.proposals.map((proposal) => (
              <button key={proposal.id} type="button" className="suggestion suggestion--action" onClick={() => propose(proposal.id)}>
                <Icon name="wand" size={15} />
                Preparar: {proposal.title}
              </button>
            ))}
          </div>
        ) : null}

        <ol className="copilot__log" role="log" aria-live="polite" aria-label="Conversa com o Delta">
          {messages.map((message) => {
            if (message.role === 'user') {
              return (
                <li key={message.id} className="msg msg--user">
                  {message.text}
                </li>
              );
            }
            if (message.kind === 'insight') {
              const { insight } = message;
              return (
                <li key={message.id} className="msg msg--assistant">
                  <strong className="msg__title">{insight.title}</strong>
                  {insight.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {insight.bullets.length ? (
                    <ul>
                      {insight.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            }
            if (message.kind === 'proposal') {
              const { proposal, status } = message;
              const stale = status === 'pending' && proposal.contextFingerprint !== fingerprint;
              const canUndoBatch = status === 'applied' && message.appliedFingerprint === fingerprint;
              return (
                <li key={message.id} className="msg msg--assistant">
                  <div className="proposal-card">
                    <span className="proposal-card__kicker">Proposta de ação</span>
                    <strong className="proposal-card__title">{proposal.title}</strong>
                    <p>{proposal.summary}</p>
                    <ul className="proposal-card__changes">
                      {proposal.changes.map((change) => (
                        <li key={change.label}>
                          <span>{change.label}</span>
                          <span className="tabular">
                            {change.from} → <strong>{change.to}</strong>
                          </span>
                        </li>
                      ))}
                    </ul>
                    {stale ? (
                      <div className="cp-stale" role="alert">
                        <Icon name="warning" size={15} />
                        O cenário mudou depois desta proposta. Recalcule antes de confirmar.
                      </div>
                    ) : null}
                    {status === 'pending' ? (
                      <div className="proposal-card__actions">
                        {stale ? (
                          <button type="button" className="btn btn--sm btn--primary" onClick={() => recalc(message)}>
                            Recalcular proposta
                          </button>
                        ) : (
                          <button type="button" className="btn btn--sm btn--primary" onClick={() => confirm(message)}>
                            <Icon name="check" size={15} /> Confirmar
                          </button>
                        )}
                        <button type="button" className="btn btn--sm btn--link" onClick={() => updateMessage(message.id, { status: 'discarded' })}>
                          Descartar
                        </button>
                      </div>
                    ) : null}
                    {status === 'applied' ? (
                      <div className="proposal-done" role="status">
                        <Icon name="check" size={15} /> Proposta aplicada na simulação.
                        {canUndoBatch ? (
                          <button
                            type="button"
                            className="btn btn--sm btn--link"
                            onClick={() => {
                              onUndo();
                              updateMessage(message.id, { status: 'undone' });
                            }}
                          >
                            Desfazer lote
                          </button>
                        ) : (
                          <span className="proposal-done__hint"> Para reverter, use Desfazer no cenário.</span>
                        )}
                      </div>
                    ) : null}
                    {status === 'undone' ? <div className="proposal-done is-cancelled">Lote desfeito. O cenário voltou ao estado anterior.</div> : null}
                    {status === 'discarded' ? <div className="proposal-done is-cancelled">Proposta descartada.</div> : null}
                    {status === 'obsolete' ? <div className="proposal-done is-cancelled">Não há mais ajuste necessário com o cenário atual.</div> : null}
                  </div>
                </li>
              );
            }
            return (
              <li key={message.id} className="msg msg--assistant">
                <p>{message.text}</p>
              </li>
            );
          })}
          <li ref={logEndRef} aria-hidden="true" className="copilot__log-end" />
        </ol>
      </div>

      <form className="copilot__composer" onSubmit={onSubmit}>
        <label htmlFor="copilot-input" className="visually-hidden">
          Mensagem para o Delta
        </label>
        <textarea
          id="copilot-input"
          rows={2}
          maxLength={2000}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) onSubmit(event);
          }}
          placeholder="Pergunte sobre gargalos, prazos ou peça uma proposta…"
        />
        <button type="submit" className="copilot__send" aria-label="Enviar mensagem">
          <Icon name="send" size={17} />
        </button>
        <p className="copilot__legal">Respostas calculadas localmente a partir do cenário. Nada é enviado a servidores.</p>
      </form>
    </aside>
  );
}
