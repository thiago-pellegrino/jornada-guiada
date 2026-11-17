import { useRef } from 'react';
import Icon from './Icon.jsx';

/**
 * Abas (DS §14): tablist com setas, Home/End e foco rotativo.
 * Os painéis ficam a cargo de quem usa (cada aba tem id `tab-<id>` e controla `panel-<id>`).
 */
export default function Tabs({ tabs, active, onChange, label }) {
  const refs = useRef({});

  function onKeyDown(event, index) {
    let next = null;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    if (next === null) return;
    event.preventDefault();
    onChange(tabs[next].id);
    refs.current[tabs[next].id]?.focus();
  }

  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((tab, index) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={(node) => {
              refs.current[tab.id] = node;
            }}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            className={`tabs__tab ${selected ? 'is-active' : ''}`}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {tab.icon ? <Icon name={tab.icon} size={16} /> : null}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
