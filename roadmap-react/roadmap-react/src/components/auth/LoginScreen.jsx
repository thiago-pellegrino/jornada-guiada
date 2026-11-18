import { useEffect, useId, useRef, useState } from 'react';
import logoColor from '../../assets/logo-capgemini-transparent.png';
import logoWhite from '../../assets/logo-capgemini-white.png';
import { useAuth } from '../../auth/AuthContext.jsx';

const CHIPS = ['Humanos definem o futuro', 'IA acelera a materialização', 'Evidências orientam decisões'];
const SSO_DELAY_MS = 700;

/** Células da grade que acendem (coluna, linha, atraso em s) e feixes que correm pelas linhas. */
const CELULAS = [
  [2, 8, 0], [5, 9, 1.6], [8, 7, 3.1], [3, 11, 4.4], [10, 10, 2.2], [6, 6, 5.3], [12, 8, 0.9], [1, 10, 6.1],
];
const FEIXES = [
  ['h', 7, 0, 7], ['h', 10, 2.5, 9], ['h', 13, 5, 8], ['v', 4, 1.2, 8], ['v', 9, 3.8, 10], ['v', 13, 6.4, 9],
];

/** Letras da marca, com o "A" sem travessão (Λ), como no logotipo. */
const LETRAS = ['D', 'Λ', 'R', 'K', 'L', 'Λ', 'B', 'S'];

/**
 * Marca Darklabs em SVG: dois anéis abertos com o ponto central, DARKLABS espaçado, filete e
 * "by capgemini". `tone` = light (fundo escuro) | dark (fundo claro); `compact` omite o "by capgemini".
 */
export function DarklabsMark({ tone = 'light', compact = false }) {
  const altura = compact ? 58 : 88;
  return (
    <svg
      className={`dl-mark dl-mark--${tone} ${compact ? 'dl-mark--compact' : ''}`}
      viewBox={`0 0 124 ${altura}`}
      role="img"
      aria-label="Darklabs by capgemini"
    >
      <g fill="none" stroke="currentColor" strokeWidth="4.4" strokeLinecap="round">
        <path d="M58.06 7.97A9.5 9.5 0 1 0 58.06 18.03" />
        <path d="M65.94 7.97A9.5 9.5 0 1 1 65.94 18.03" />
      </g>
      <circle cx="62" cy="13" r="2.3" fill="currentColor" />
      <g fill="currentColor" fontFamily="var(--font-sans)" fontSize="15.5" fontWeight="500" textAnchor="middle">
        {LETRAS.map((l, i) => {
          const cx = 9 + i * 15.15;
          return l === 'Λ' ? (
            <path key={i} d={`M${cx - 5.6} 46 L${cx} 34.8 L${cx + 5.6} 46`} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="miter" />
          ) : (
            <text key={i} x={cx} y="46">
              {l}
            </text>
          );
        })}
      </g>
      <line x1="14" y1="53.5" x2="110" y2="53.5" stroke="currentColor" strokeOpacity="0.32" strokeWidth="0.8" />
      <circle cx="62" cy="53.5" r="0.9" fill="currentColor" fillOpacity="0.7" />
      {!compact ? (
        <text x="62" y="82" fill="currentColor" fontFamily="var(--font-sans)" fontSize="11.5" fontWeight="700" textAnchor="middle">
          by capgemini
        </text>
      ) : null}
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function IconKey() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="3.5" />
      <path d="m10 13 8.5-8.5M16 7l2.5 2.5M14 9l2 2" />
    </svg>
  );
}

function IconEye({ off = false }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
      {off ? <path d="m4 4 16 16" /> : null}
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6L12 3Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.6v.2" />
    </svg>
  );
}

/**
 * Tela de acesso à plataforma (Capgemini + Darklabs). No protótipo a entrada é pela conta
 * corporativa (SSO simulado); o login por senha só valida o formulário.
 */
export default function LoginScreen() {
  const { loginCorporate } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [lembrar, setLembrar] = useState(false);
  const [conectando, setConectando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const timer = useRef(null);
  const id = useId();

  useEffect(() => () => clearTimeout(timer.current), []);

  function entrarComSenha(e) {
    e.preventDefault();
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setAviso({ tipo: 'erro', texto: 'Informe um e-mail corporativo válido.' });
      return;
    }
    if (!senha) {
      setAviso({ tipo: 'erro', texto: 'Informe sua senha.' });
      return;
    }
    setAviso({ tipo: 'info', texto: 'Neste protótipo o acesso é feito pela conta corporativa. Use “Entrar com conta corporativa”.' });
  }

  function entrarCorporativo() {
    if (conectando) return;
    setAviso(null);
    setConectando(true);
    timer.current = setTimeout(() => loginCorporate({ email, remember: lembrar }), SSO_DELAY_MS);
  }

  function emBreve(e) {
    e.preventDefault();
    setAviso({ tipo: 'info', texto: 'Disponível na versão com backend. Por enquanto, entre com a conta corporativa.' });
  }

  return (
    <div className="login">
      <section className="login__brand" aria-label="Capgemini e Darklabs">
        <div className="login__backdrop" aria-hidden="true">
          <div className="login__gridwrap">
            <div className="login__grid" />
            <div className="login__grid login__grid--glow" />
            {CELULAS.map(([x, y, d], i) => (
              <span key={`c${i}`} className="login__cell" style={{ '--x': x, '--y': y, '--d': `${d}s` }} />
            ))}
            {FEIXES.map(([eixo, linha, d, dur], i) => (
              <span key={`b${i}`} className={`login__beam login__beam--${eixo}`} style={{ '--n': linha, '--d': `${d}s`, '--t': `${dur}s` }} />
            ))}
          </div>
          <div className="login__bokeh" />
          <p className="login__ghost">
            Make it
            <br />
            with AI, tech
            <br />
            and people.
          </p>
        </div>

        <header className="login__logos">
          <img className="login__logo login__logo--light" src={logoWhite} alt="Capgemini" width="972" height="225" />
          <span className="login__divider" aria-hidden="true" />
          <DarklabsMark tone="light" />
        </header>

        <div className="login__pitch">
          <p className="login__eyebrow">
            <span className="login__eyebrow-dot" aria-hidden="true" /> Capgemini + Darklabs
          </p>
          <h1 className="login__headline">
            Make <span className="login__headline-grad">it real!</span>
          </h1>
          <p className="login__subhead">with AI, technology and people.</p>
          <p className="login__lead">
            Uma porta institucional para conectar foresight, inovação e execução. Após o acesso, cada cliente entra em sua
            experiência white-label com identidade, contexto e permissões próprias.
          </p>
          <ul className="login__chips">
            {CHIPS.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>

        <footer className="login__foot">Capgemini · Darklabs · Ambiente demonstrativo protegido</footer>
      </section>

      <main className="login__panel">
        <div className="login__card">
          <div className="login__card-logos">
            <img className="login__logo login__logo--color" src={logoColor} alt="Capgemini" width="972" height="225" />
            <span className="login__divider login__divider--dark" aria-hidden="true" />
            <DarklabsMark tone="dark" compact />
          </div>

          <p className="login__kicker">Acesso à plataforma</p>
          <h2 className="login__title">Bem-vindo(a).</h2>
          <p className="login__hint">Entre para acessar o workspace white-label do seu projeto.</p>

          <form className="login__form" onSubmit={entrarComSenha} noValidate>
            <label className="login__label" htmlFor={`${id}-email`}>
              E-mail corporativo
            </label>
            <div className="login__field">
              <IconMail />
              <input
                id={`${id}-email`}
                type="email"
                autoComplete="username"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <label className="login__label" htmlFor={`${id}-senha`}>
              Senha
            </label>
            <div className="login__field">
              <IconKey />
              <input
                id={`${id}-senha`}
                type={verSenha ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              <button
                type="button"
                className="login__eye"
                onClick={() => setVerSenha((v) => !v)}
                aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={verSenha}
              >
                <IconEye off={verSenha} />
              </button>
            </div>

            <div className="login__row">
              <label className="login__check">
                <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} />
                Lembrar meu acesso
              </label>
              <a href="#esqueci" className="login__link" onClick={emBreve}>
                Esqueci minha senha
              </a>
            </div>

            <button type="submit" className="login__primary">
              Entrar
            </button>
          </form>

          <p className="login__or">
            <span>ou continue com</span>
          </p>

          <button type="button" className="login__sso" onClick={entrarCorporativo} disabled={conectando} aria-busy={conectando}>
            <span className={`login__sso-dot ${conectando ? 'is-busy' : ''}`} aria-hidden="true" />
            {conectando ? 'Conectando ao provedor corporativo…' : 'Entrar com conta corporativa'}
          </button>

          <div className="login__status" role="status" aria-live="polite">
            {aviso ? <p className={`login__notice login__notice--${aviso.tipo}`}>{aviso.texto}</p> : null}
          </div>

          <p className="login__request">
            Precisa de acesso?{' '}
            <a href="#solicitar" className="login__link" onClick={emBreve}>
              Solicitar acesso
            </a>
          </p>

          <p className="login__note login__note--shield">
            <IconShield />
            <span>Perfil e permissões dependem da identidade autenticada. O seletor da interface não eleva privilégios.</span>
          </p>
          <p className="login__note login__note--info">
            <IconInfo />
            <span>
              A entrada é institucional Capgemini + Darklabs. O ambiente de cada cliente mantém sua identidade white-label após o
              login.
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
