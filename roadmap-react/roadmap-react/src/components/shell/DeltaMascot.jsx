import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useJourney } from '../../journey/JourneyContext.jsx';
import { gerarComModelo, motorAtivo } from '../builder/builderEngine.js';
import MascotChat from './MascotChat.jsx';
import { EVENTO_MASCOTE } from './deltaMascotBus.js';
import { DICAS_DA_ABA, aguardandoRevisao, montarPedidoAoModelo, responderLocal, sugestoesDaAba } from './mascotChatEngine.js';

/**
 * Mascote do Delta: companheiro visual animado (personagem original: cabeça com visor, corpo em ▽
 * e bracinhos, nas cores da marca). Reage ao que acontece na página — fica parado, corre, acena,
 * pula, espera e mostra os estados de trabalho, revisão e falha — e acompanha o cursor com os olhos.
 * Tem um mini chat próprio. Não executa tarefas: responde, dá feedback visual e sugere ações, que a
 * pessoa decide se segue.
 *  - Clique: abre/fecha o mini chat. Arrastar: move a mascote (posição salva neste navegador).
 *  - Teclado: Enter abre o chat; setas movem (Shift = passo maior); Esc fecha o chat.
 */

const POS_KEY = 'jornada.delta.mascote.pos.v2';
const RECOLHIDA_KEY = 'jornada.delta.mascote.recolhida';
const DICAS_KEY = 'jornada.delta.mascote.dicas';
const VISTAS_KEY = 'jornada.delta.mascote.dicas-vistas';
const CHAT_KEY = 'jornada.delta.mascote.chat';
const W = 92;
const H = 115;
const MARGEM = 8;
const RODAPE = 36;
const OCIOSO_MS = 30000;

export const ESTADOS = Object.freeze({
  parado: { rotulo: 'Por aqui', chip: false },
  correndo: { rotulo: 'Correndo', chip: false },
  acenando: { rotulo: 'Olá!', chip: false },
  pulando: { rotulo: 'Pronto!', chip: false },
  esperando: { rotulo: 'Esperando você', chip: true },
  trabalhando: { rotulo: 'Trabalhando…', chip: true },
  revisando: { rotulo: 'Em revisão', chip: true },
  falha: { rotulo: 'Algo falhou', chip: true },
});

function ler(chave, padrao, area = 'localStorage') {
  try {
    const v = window[area].getItem(chave);
    return v === null ? padrao : JSON.parse(v);
  } catch {
    return padrao;
  }
}
function gravar(chave, valor, area = 'localStorage') {
  try {
    window[area].setItem(chave, JSON.stringify(valor));
  } catch {
    /* sem armazenamento: vale só nesta sessão */
  }
}
function limitar(pos) {
  const maxX = Math.max(MARGEM, window.innerWidth - W - MARGEM);
  const maxY = Math.max(MARGEM, window.innerHeight - H - RODAPE);
  return { x: Math.min(maxX, Math.max(MARGEM, pos.x)), y: Math.min(maxY, Math.max(MARGEM + 50, pos.y)) };
}
// Começa à esquerda do botão fixo do Delta, no canto inferior direito.
const posPadrao = () => ({ x: window.innerWidth - W - 96, y: window.innerHeight - H - 48 });
const espera = (ms) => new Promise((ok) => window.setTimeout(ok, ms));
let seq = 0;
const novoId = () => `mc-${Date.now().toString(36)}-${(seq += 1)}`;

const ESTRELA = (cx, cy, r) =>
  `M${cx} ${cy - r} C${cx + r * 0.09} ${cy - r * 0.33} ${cx + r * 0.33} ${cy - r * 0.09} ${cx + r} ${cy} C${cx + r * 0.33} ${cy + r * 0.09} ${cx + r * 0.09} ${cy + r * 0.33} ${cx} ${cy + r} C${cx - r * 0.09} ${cy + r * 0.33} ${cx - r * 0.33} ${cy + r * 0.09} ${cx - r} ${cy} C${cx - r * 0.33} ${cy - r * 0.09} ${cx - r * 0.09} ${cy - r * 0.33} ${cx} ${cy - r} Z`;
// Corpo: ▽ de cantos arredondados (ponta para baixo).
const CORPO = 'M40 74 L80 74 C88.5 74 92.5 81.5 88.6 88.4 L66.4 118.6 C63.4 122.9 56.6 122.9 53.6 118.6 L31.4 88.4 C27.5 81.5 31.5 74 40 74 Z';
// Braço: ▽ alongado, preso pelo ombro (origem 0,0) e apontando para baixo.
const BRACO = 'M-5.5 0 L5.5 0 C8.2 0 9.6 2.6 8.3 5 L2.7 22.2 C1.7 24.6 -1.7 24.6 -2.7 22.2 L-8.3 5 C-9.6 2.6 -8.2 0 -5.5 0 Z';

/**
 * Desenho da mascote (SVG), versão 2: casco branco perolado com painéis nas cores da marca (crista,
 * fones, ombreiras, faixa do peito e pontas dos braços), fones com tampa metálica, visor de vidro com
 * aro luminoso, botão de núcleo no peito com o emblema ★ e parte de baixo do ▽ em azul-marinho.
 * Mantém os mesmos grupos e pontos de articulação (ombros, cabeça, olhos, boca, emblema) usados pelas
 * animações de estado em delta.css.
 */
function Corpo() {
  const uid = useId().replace(/:/g, '');
  const g = (n) => `dm-${n}-${uid}`;
  const url = (n) => `url(#${g(n)})`;
  return (
    <svg className="dm-svg" viewBox="0 0 120 150" width={W} height={H} aria-hidden="true" focusable="false">
      <defs>
        {/* cores da marca (mudam no modo dourado) */}
        <linearGradient id={g('cabeca')} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop className="dm-stop dm-stop--1" offset="0%" />
          <stop className="dm-stop dm-stop--2" offset="100%" />
        </linearGradient>
        <linearGradient id={g('corpo')} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop className="dm-stop dm-stop--2" offset="0%" />
          <stop className="dm-stop dm-stop--3" offset="100%" />
        </linearGradient>
        {/* casco branco perolado */}
        <linearGradient id={g('casco')} x1="0.2" y1="0" x2="0.75" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#eef1f9" />
          <stop offset="100%" stopColor="#c9cfe4" />
        </linearGradient>
        {/* volume: luz de cima à esquerda, sombra fria embaixo à direita */}
        <radialGradient id={g('esfera')} cx="0.32" cy="0.22" r="0.95">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="30%" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="65%" stopColor="#1b2463" stopOpacity="0" />
          <stop offset="100%" stopColor="#1b2463" stopOpacity="0.3" />
        </radialGradient>
        <radialGradient id={g('troncoLuz')} cx="0.3" cy="0.1" r="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="30%" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="62%" stopColor="#0a0f3a" stopOpacity="0" />
          <stop offset="100%" stopColor="#0a0f3a" stopOpacity="0.45" />
        </radialGradient>
        {/* luz refletida (rebate) na borda de baixo */}
        <linearGradient id={g('rebate')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="75%" stopColor="#bfe9ff" stopOpacity="0" />
          <stop offset="100%" stopColor="#bfe9ff" stopOpacity="0.45" />
        </linearGradient>
        {/* parte de baixo do corpo: azul-marinho */}
        <linearGradient id={g('marinho')} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#24317a" />
          <stop offset="60%" stopColor="#141c52" />
          <stop offset="100%" stopColor="#0a0f33" />
        </linearGradient>
        {/* metal (tampas dos fones, aro do núcleo) */}
        <linearGradient id={g('metal')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4f7ff" />
          <stop offset="45%" stopColor="#a9b3d1" />
          <stop offset="100%" stopColor="#4b5682" />
        </linearGradient>
        <radialGradient id={g('nucleo')} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0%" stopColor="#2b3a8f" />
          <stop offset="100%" stopColor="#0a0f33" />
        </radialGradient>
        {/* cilindro (braços, pescoço) */}
        <linearGradient id={g('cilindro')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="35%" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#0a0f3a" stopOpacity="0.38" />
        </linearGradient>
        <linearGradient id={g('pescoco')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3a4489" />
          <stop offset="50%" stopColor="#1a2156" />
          <stop offset="100%" stopColor="#080b26" />
        </linearGradient>
        {/* visor de vidro */}
        <linearGradient id={g('tela')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#070b26" />
          <stop offset="55%" stopColor="#0f1745" />
          <stop offset="100%" stopColor="#1b2666" />
        </linearGradient>
        <linearGradient id={g('reflexo')} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={g('chao')} cx="0.5" cy="0.5" r="0.5">
          <stop className="dm-sombra-stop dm-sombra-stop--1" offset="0%" />
          <stop className="dm-sombra-stop dm-sombra-stop--2" offset="100%" />
        </radialGradient>
        <filter id={g('luz')} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={g('aro')} x="-20%" y="-30%" width="140%" height="160%">
          <feGaussianBlur stdDeviation="1.1" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={g('suave')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
        <filter id={g('ao')} x="-50%" y="-100%" width="200%" height="300%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
        <clipPath id={g('clipCorpo')}>
          <path d={CORPO} />
        </clipPath>
        <clipPath id={g('clipCabeca')}>
          <rect x="20" y="15" width="80" height="56" rx="26" />
        </clipPath>
        {/* em coordenadas do braço (ombro na origem) */}
        <clipPath id={g('clipBraco')}>
          <path d={BRACO} />
        </clipPath>
      </defs>

      <ellipse className="dm-sombra" cx="60" cy="143" rx="24" ry="5" fill={url('chao')} />

      <g className="dm-pulo">
        <g className="dm-flutua">
          {/* linhas de velocidade (correndo) */}
          <g className="dm-rastro dm-rastro--e">
            <path d="M4 40 H-14" />
            <path d="M8 58 H-18" />
            <path d="M16 92 H-2" />
          </g>
          <g className="dm-rastro dm-rastro--d">
            <path d="M116 40 H134" />
            <path d="M112 58 H138" />
            <path d="M104 92 H122" />
          </g>

          <g className="dm-inclina">
            {/* braços (atrás do corpo): casco branco, ponta colorida e ombreira */}
            <g transform="translate(34 81)">
              <g className="dm-braco dm-braco--e">
                <path d={BRACO} fill={url('casco')} />
                <g clipPath={url('clipBraco')}>
                  <rect x="-10" y="14.5" width="20" height="12" fill={url('cabeca')} />
                  <path d="M-10 14.5 H10" stroke="#0a0f3a" strokeOpacity="0.25" strokeWidth="0.8" />
                </g>
                <path d={BRACO} fill={url('cilindro')} />
                <ellipse cx="0" cy="2" rx="7.6" ry="5.4" fill={url('cabeca')} />
                <ellipse cx="0" cy="2" rx="7.6" ry="5.4" fill={url('esfera')} />
                <path d="M-5 0.4 L-1 0.4" className="dm-brilho-linha" />
              </g>
            </g>
            <g transform="translate(86 81) scale(-1 1)">
              <g className="dm-braco dm-braco--d">
                <path d={BRACO} fill={url('casco')} />
                <g clipPath={url('clipBraco')}>
                  <rect x="-10" y="14.5" width="20" height="12" fill={url('cabeca')} />
                  <path d="M-10 14.5 H10" stroke="#0a0f3a" strokeOpacity="0.25" strokeWidth="0.8" />
                </g>
                <path d={BRACO} fill={url('cilindro')} transform="scale(-1 1)" />
                <ellipse cx="0" cy="2" rx="7.6" ry="5.4" fill={url('cabeca')} />
                <ellipse cx="0" cy="2" rx="7.6" ry="5.4" fill={url('esfera')} transform="scale(-1 1)" />
                <path d="M1 0.4 L5 0.4" className="dm-brilho-linha" />
                {/* lupa (revisão) */}
                <g className="dm-lupa">
                  <path d="M0 21 L0 27" />
                  <circle cx="0" cy="33.5" r="6.5" />
                </g>
              </g>
            </g>

            {/* pescoço: anel escuro com friso da marca */}
            <rect x="51" y="64" width="18" height="13" rx="4" fill={url('pescoco')} />
            <rect x="51" y="70.5" width="18" height="1.6" fill={url('cabeca')} opacity="0.9" />
            <rect x="53" y="66" width="3" height="9" rx="1.5" fill="#fff" opacity="0.16" />

            {/* corpo ▽: casco branco em cima, marinho embaixo, faixa da marca e núcleo no peito */}
            <g className="dm-tronco">
              <path d={CORPO} fill={url('marinho')} />
              <g clipPath={url('clipCorpo')}>
                <path d="M20 70 H100 V97 Q60 106 20 97 Z" fill={url('casco')} />
                {/* friso entre o branco e o marinho */}
                <path d="M22 97.4 Q60 105.8 98 97.4" fill="none" stroke={url('cabeca')} strokeWidth="1.6" />
                {/* faixa da marca descendo do pescoço até o núcleo */}
                <path d="M53.5 72 H66.5 V84 Q60 88 53.5 84 Z" fill={url('cabeca')} />
                <path d="M55 74 H57 V83.5" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.1" fill="none" strokeLinecap="round" />
              </g>
              <path d={CORPO} fill={url('troncoLuz')} />
              <path d={CORPO} fill={url('rebate')} />
              <g clipPath={url('clipCorpo')}>
                {/* sombra da cabeça sobre o corpo */}
                <ellipse cx="60" cy="74" rx="26" ry="5.5" fill="#0a0f3a" opacity="0.35" filter={url('ao')} />
                {/* brilho especular */}
                <ellipse cx="44" cy="83" rx="8.5" ry="3" fill="#fff" opacity="0.8" filter={url('suave')} transform="rotate(-22 44 83)" />
                {/* reflexo no marinho */}
                <path d="M44 104 Q50 108 54 113" stroke="#9fb6ff" strokeOpacity="0.35" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              </g>
              <path className="dm-aresta" d="M43 76.5 Q60 75 77 76.5" />
              {/* núcleo: aro metálico, vidro escuro e o emblema ★ aceso */}
              <circle cx="60" cy="92.5" r="9.2" fill="#0a0f3a" opacity="0.25" filter={url('suave')} />
              <circle cx="60" cy="92" r="8.6" fill={url('metal')} />
              <circle cx="60" cy="92" r="6.4" fill={url('nucleo')} />
              <circle cx="60" cy="92" r="6.4" fill="none" stroke={url('cabeca')} strokeWidth="1.2" filter={url('aro')} />
              <path className="dm-emblema" d={ESTRELA(60, 92, 4.6)} filter={url('luz')} />
              <ellipse cx="57.5" cy="88.6" rx="2.6" ry="1.1" fill="#fff" opacity="0.55" transform="rotate(-25 57.5 88.6)" />
            </g>

            {/* cabeça */}
            <g className="dm-cabeca">
              <path className="dm-haste" d="M60 17 V11" />
              <path className="dm-antena" d={ESTRELA(60, 7, 7)} filter={url('luz')} />

              {/* casco perolado com volume */}
              <rect x="20" y="15" width="80" height="56" rx="26" fill={url('casco')} />
              <rect x="20" y="15" width="80" height="56" rx="26" fill={url('esfera')} />
              <rect x="20" y="15" width="80" height="56" rx="26" fill={url('rebate')} />
              <g clipPath={url('clipCabeca')}>
                {/* crista da marca no alto da cabeça, sob a antena */}
                <path d="M48 12 H72 V19.5 Q72 23 68.5 23 H51.5 Q48 23 48 19.5 Z" fill={url('cabeca')} />
                <path d="M50 16.5 H58" stroke="#fff" strokeOpacity="0.45" strokeWidth="1.1" strokeLinecap="round" />
                {/* sombra de contato do visor */}
                <rect x="26" y="25" width="68" height="42" rx="17" fill="#1b2463" opacity="0.18" filter={url('suave')} />
              </g>
              {/* brilho especular grande */}
              <ellipse cx="36" cy="23" rx="10" ry="3.2" fill="#fff" opacity="0.95" filter={url('suave')} transform="rotate(-18 36 23)" />
              <circle cx="46.5" cy="19.2" r="1.3" fill="#fff" opacity="0.9" />

              {/* fones: concha da marca, tampa metálica e LED */}
              <g>
                <ellipse cx="19.5" cy="44" rx="7.6" ry="12.5" fill={url('cabeca')} />
                <ellipse cx="19.5" cy="44" rx="7.6" ry="12.5" fill={url('esfera')} />
                <ellipse cx="16.2" cy="44" rx="4.4" ry="9" fill={url('metal')} />
                <ellipse cx="15.4" cy="40" rx="1.3" ry="3" fill="#fff" opacity="0.7" />
                <circle cx="16.2" cy="50.5" r="1.1" fill="var(--dm-olho)" filter={url('luz')} />
                <ellipse cx="100.5" cy="44" rx="7.6" ry="12.5" fill={url('corpo')} />
                <ellipse cx="100.5" cy="44" rx="7.6" ry="12.5" fill={url('esfera')} />
                <ellipse cx="103.8" cy="44" rx="4.4" ry="9" fill={url('metal')} />
                <ellipse cx="103" cy="40" rx="1.3" ry="3" fill="#fff" opacity="0.55" />
                <circle cx="103.8" cy="50.5" r="1.1" fill="var(--dm-olho)" filter={url('luz')} />
              </g>

              {/* visor: moldura afundada, vidro, aro luminoso e reflexo */}
              <rect x="27.5" y="23.5" width="65" height="40" rx="16" fill="#060920" opacity="0.55" />
              <rect x="29" y="25" width="62" height="37" rx="14.5" fill={url('tela')} />
              <rect x="29" y="25" width="62" height="37" rx="14.5" fill="none" stroke={url('cabeca')} strokeWidth="1.8" filter={url('aro')} />
              <path d="M33 31 C33 27.5 35.5 26.5 40 26.5 L79 26.5 C72 29 54 33 33 39 Z" fill={url('reflexo')} />
              <path d="M84 56 Q87.5 52.5 87.5 47" stroke="#fff" strokeOpacity="0.18" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              <ellipse className="dm-bochecha" cx="37.5" cy="54" rx="4.5" ry="2.5" />
              <ellipse className="dm-bochecha" cx="82.5" cy="54" rx="4.5" ry="2.5" />

              <g className="dm-olhos" filter={url('luz')}>
                <g className="dm-pisca">
                  <path className="dm-olho dm-olho--estrela" d={ESTRELA(47, 42, 7)} />
                  <path className="dm-olho dm-olho--estrela" d={ESTRELA(73, 42, 7)} />
                </g>
                <g className="dm-olho--x">
                  <path d="M42.5 37.5 L51.5 46.5 M51.5 37.5 L42.5 46.5" />
                  <path d="M68.5 37.5 L77.5 46.5 M77.5 37.5 L68.5 46.5" />
                </g>
              </g>
              <path className="dm-boca dm-boca--sorriso" d="M55 52.5 Q60 57 65 52.5" />
              <path className="dm-boca dm-boca--triste" d="M55 56 Q60 52 65 56" />
              <g className="dm-pontos">
                <circle cx="53" cy="54" r="1.8" />
                <circle cx="60" cy="54" r="1.8" />
                <circle cx="67" cy="54" r="1.8" />
              </g>
            </g>
          </g>

          <g className="dm-alerta">
            <circle cx="101" cy="14" r="8" />
            <path d="M101 9.5 V14.8 M101 17.6 V18.2" />
          </g>
        </g>
      </g>
    </svg>
  );
}

export default function DeltaMascot({ onOpen, tab, scenario, result, oculto = false }) {
  const { project, pending, catalog } = useJourney();
  const chatId = useId();
  const [pos, setPos] = useState(() => limitar(ler(POS_KEY, null) ?? posPadrao()));
  const [recolhida, setRecolhida] = useState(() => Boolean(ler(RECOLHIDA_KEY, false)));
  const [dicasLigadas, setDicasLigadas] = useState(() => ler(DICAS_KEY, true) !== false);
  const [arrastando, setArrastando] = useState(false);
  const [direcao, setDirecao] = useState('d');
  const [hover, setHover] = useState(false);
  const [ocioso, setOcioso] = useState(false);
  const [momento, setMomento] = useState({ estado: 'acenando', ate: Date.now() + 2200 }); // estado passageiro
  const [trabalhos, setTrabalhos] = useState(() => new Set()); // trabalhos avisados por outras telas
  const [dica, setDica] = useState(null);
  const [chatAberto, setChatAberto] = useState(false);
  const [mensagens, setMensagens] = useState(() => {
    const m = ler(CHAT_KEY, [], 'sessionStorage');
    return Array.isArray(m) ? m : [];
  });
  const [respondendo, setRespondendo] = useState(false);
  const [parcial, setParcial] = useState('');
  const [, forcar] = useState(0);
  const raiz = useRef(null);
  const corpoRef = useRef(null);
  const arrasto = useRef(null);
  const controleChat = useRef(null);
  const posRef = useRef(pos);
  posRef.current = pos;
  const chatRef = useRef(chatAberto);
  chatRef.current = chatAberto;

  const emExecucao = Object.keys(pending ?? {}).length > 0 || trabalhos.size > 0;
  const revisoes = useMemo(() => aguardandoRevisao(project), [project]);
  const motor = useMemo(() => {
    const m = motorAtivo();
    return m && !m.semChave ? m : null;
  }, [chatAberto]); // eslint-disable-line react-hooks/exhaustive-deps
  const motorRotulo = motor ? `${motor.provider.name} · ${motor.modelo?.name ?? motor.cfg.model}` : 'Respostas locais · sem modelo';

  const passageiro = useCallback((estado, ms) => setMomento({ estado, ate: Date.now() + ms }), []);
  // Sugestão: vira balão; com o mini chat aberto, entra na conversa.
  const mostrarDica = useCallback(
    (d, { forcar: forcarDica = false, soBalao = false } = {}) => {
      if (!d || (!dicasLigadas && !forcarDica)) return;
      if (chatRef.current) {
        if (!soBalao)
          setMensagens((m) => [
            ...m,
            { id: novoId(), role: 'assistant', dica: true, texto: d.texto, acoes: (d.acoes ?? []).filter((a) => a.tipo !== 'chat') },
          ]);
      } else setDica({ id: Date.now(), ...d });
    },
    [dicasLigadas],
  );

  useEffect(() => {
    gravar(CHAT_KEY, mensagens.slice(-40), 'sessionStorage');
  }, [mensagens]);

  // Fim do estado passageiro.
  useEffect(() => {
    if (!momento) return undefined;
    const t = window.setTimeout(
      () => {
        setMomento(null);
        forcar((n) => n + 1);
      },
      Math.max(0, momento.ate - Date.now()),
    );
    return () => window.clearTimeout(t);
  }, [momento]);

  // Dica some sozinha depois de um tempo.
  useEffect(() => {
    if (!dica) return undefined;
    const t = window.setTimeout(() => setDica(null), dica.ms ?? 12000);
    return () => window.clearTimeout(t);
  }, [dica]);

  // Mantém dentro da janela.
  useEffect(() => {
    const ajustar = () => setPos((p) => limitar(p));
    window.addEventListener('resize', ajustar);
    return () => window.removeEventListener('resize', ajustar);
  }, []);

  // Olhos (e cabeça) seguem o cursor; qualquer atividade tira do modo "esperando".
  useEffect(() => {
    let quadro = 0;
    let timer = window.setTimeout(() => setOcioso(true), OCIOSO_MS);
    const atividade = () => {
      window.clearTimeout(timer);
      setOcioso(false);
      timer = window.setTimeout(() => setOcioso(true), OCIOSO_MS);
    };
    const mover = (e) => {
      atividade();
      if (quadro) return;
      quadro = requestAnimationFrame(() => {
        quadro = 0;
        const el = corpoRef.current;
        const alvo = raiz.current;
        if (!el || !alvo) return;
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height * 0.3);
        const d = Math.hypot(dx, dy) || 1;
        const f = Math.min(1, d / 220);
        alvo.style.setProperty('--dm-ex', `${((dx / d) * 3 * f).toFixed(2)}px`);
        alvo.style.setProperty('--dm-ey', `${((dy / d) * 2.2 * f).toFixed(2)}px`);
      });
    };
    window.addEventListener('pointermove', mover, { passive: true });
    window.addEventListener('keydown', atividade);
    window.addEventListener('pointerdown', atividade);
    return () => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('keydown', atividade);
      window.removeEventListener('pointerdown', atividade);
      window.clearTimeout(timer);
      cancelAnimationFrame(quadro);
    };
  }, []);

  // Avisos das telas (Delta Builder, etc.).
  useEffect(() => {
    const ouvir = (e) => {
      const d = e.detail ?? {};
      if (d.estado === 'trabalhando') {
        setTrabalhos((s) => {
          const n = new Set(s);
          if (d.ativo === false) n.delete(d.fonte ?? 'tela');
          else n.add(d.fonte ?? 'tela');
          return n;
        });
      } else if (ESTADOS[d.estado]) {
        passageiro(d.estado, d.ms ?? (d.estado === 'falha' ? 4000 : 1400));
      }
      if (d.dica) mostrarDica(d.dica, { forcar: d.estado === 'falha' });
    };
    window.addEventListener(EVENTO_MASCOTE, ouvir);
    return () => window.removeEventListener(EVENTO_MASCOTE, ouvir);
  }, [passageiro, mostrarDica]);

  // Execução da jornada terminou: comemora e sugere revisar.
  const execAnterior = useRef(emExecucao);
  useEffect(() => {
    if (execAnterior.current && !emExecucao) {
      passageiro('pulando', 1300);
      if (Object.keys(pending ?? {}).length === 0 && revisoes > 0) {
        mostrarDica({
          texto: `Execução concluída. ${revisoes} resultado${revisoes === 1 ? '' : 's'} aguardando revisão.`,
          acoes: [{ rotulo: 'Revisar agora', tipo: 'darklab', view: 'jornada-7-motores' }],
        });
      }
    }
    execAnterior.current = emExecucao;
  }, [emExecucao]); // eslint-disable-line react-hooks/exhaustive-deps

  // Troca de aba: corre até a nova página e, uma vez por sessão, sugere o próximo passo.
  const abaAnterior = useRef(tab);
  useEffect(() => {
    if (abaAnterior.current === tab) return undefined;
    abaAnterior.current = tab;
    passageiro('correndo', 1000);
    const t = window.setTimeout(() => {
      if ((tab === 'darklab' || tab === 'contexto') && revisoes > 0) {
        passageiro('revisando', 4200);
        mostrarDica({
          texto: `${revisoes} resultado${revisoes === 1 ? '' : 's'} do projeto ${revisoes === 1 ? 'está' : 'estão'} aguardando revisão.`,
          acoes: [{ rotulo: 'Ver a jornada', tipo: 'darklab', view: 'jornada-7-motores' }],
        });
        return;
      }
      const vistas = ler(VISTAS_KEY, [], 'sessionStorage');
      if (DICAS_DA_ABA[tab] && !vistas.includes(tab)) {
        gravar(VISTAS_KEY, [...vistas, tab], 'sessionStorage');
        mostrarDica(DICAS_DA_ABA[tab]);
      }
    }, 1100);
    return () => window.clearTimeout(t);
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Esperando muito tempo: oferece ajuda (uma vez a cada período ocioso).
  useEffect(() => {
    if (ocioso && !emExecucao)
      mostrarDica(
        { texto: 'Precisa de ajuda com esta página? É só me perguntar.', acoes: [{ rotulo: 'Abrir o chat', tipo: 'chat' }], ms: 9000 },
        { soBalao: true },
      );
  }, [ocioso]); // eslint-disable-line react-hooks/exhaustive-deps

  // Interrompe a resposta em andamento ao desmontar.
  useEffect(() => () => controleChat.current?.abort(), []);

  function abrirChat() {
    setDica(null);
    setChatAberto(true);
  }
  function fecharChat() {
    setChatAberto(false);
    corpoRef.current?.focus({ preventScroll: true });
  }

  async function enviar(textoDaPessoa) {
    const t = String(textoDaPessoa ?? '').trim();
    if (!t || respondendo) return;
    const historico = mensagens;
    setMensagens((m) => [...m, { id: novoId(), role: 'user', texto: t }]);
    setRespondendo(true);
    setParcial('');
    const ctx = { texto: t, tab, scenario, result, project, catalog, pending };
    const m = motorAtivo();
    try {
      if (m && !m.semChave) {
        const ctrl = new AbortController();
        controleChat.current = ctrl;
        let acumulado = '';
        const { sistema, usuario } = montarPedidoAoModelo({ ...ctx, historico });
        await gerarComModelo(m, {
          sistema,
          usuario,
          signal: ctrl.signal,
          onTexto: (p) => {
            acumulado += p;
            setParcial(acumulado);
          },
        });
        if (!acumulado.trim()) throw new Error('O modelo não devolveu texto.');
        setMensagens((ms) => [
          ...ms,
          { id: novoId(), role: 'assistant', texto: acumulado.trim(), motor: `${m.provider.name} · ${m.modelo?.name ?? m.cfg.model}` },
        ]);
      } else {
        await espera(520);
        setMensagens((ms) => [...ms, { id: novoId(), role: 'assistant', ...responderLocal(ctx) }]);
      }
      passageiro('acenando', 1200);
    } catch (e) {
      if (e?.name !== 'AbortError') {
        // O modelo falhou: mostra a falha e responde com o que dá para responder localmente.
        passageiro('falha', 2600);
        setMensagens((ms) => [
          ...ms,
          { id: novoId(), role: 'assistant', aviso: 'O modelo não respondeu agora; esta é a resposta local.', ...responderLocal(ctx) },
        ]);
      }
    } finally {
      controleChat.current = null;
      setRespondendo(false);
      setParcial('');
    }
  }

  // Ações das dicas e das respostas: só navegam ou abrem um chat — nunca executam tarefas.
  function executarAcao(a) {
    setDica(null);
    if (a.tipo === 'chat') abrirChat();
    else if (a.tipo === 'pergunta') {
      abrirChat();
      enviar(a.rotulo);
    } else if (a.tipo === 'delta') {
      setChatAberto(false);
      onOpen?.();
    } else if (a.tipo === 'aba') window.location.hash = `#${a.aba}`;
    else if (a.tipo === 'darklab') {
      window.dispatchEvent(new CustomEvent('jornada:darklab-view', { detail: a.view }));
      window.location.hash = '#darklab';
    }
  }

  const ativo = momento && momento.ate > Date.now() ? momento.estado : null;
  let estado = 'parado';
  if (ativo === 'falha') estado = 'falha';
  else if (arrastando) estado = 'correndo';
  else if (respondendo) estado = 'trabalhando';
  else if (ativo) estado = ativo;
  else if (emExecucao) estado = 'trabalhando';
  else if (hover) estado = 'acenando';
  else if (ocioso && !chatAberto) estado = 'esperando';
  const info = ESTADOS[estado];

  function aoPressionar(e) {
    if (e.button !== 0) return;
    arrasto.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, px: posRef.current.x, py: posRef.current.y, moveu: false, ux: e.clientX };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function aoMover(e) {
    const a = arrasto.current;
    if (!a || a.id !== e.pointerId) return;
    const dx = e.clientX - a.x0;
    const dy = e.clientY - a.y0;
    if (!a.moveu && Math.hypot(dx, dy) < 5) return;
    if (!a.moveu) {
      a.moveu = true;
      setArrastando(true);
      setDica(null);
    }
    const vx = e.clientX - a.ux;
    a.ux = e.clientX;
    if (Math.abs(vx) > 1) setDirecao(vx < 0 ? 'e' : 'd');
    raiz.current?.style.setProperty('--dm-tilt', `${Math.max(-16, Math.min(16, vx * 1.6)).toFixed(1)}deg`);
    setPos(limitar({ x: a.px + dx, y: a.py + dy }));
  }
  function aoSoltar(e) {
    const a = arrasto.current;
    if (!a || a.id !== e.pointerId) return;
    arrasto.current = null;
    raiz.current?.style.setProperty('--dm-tilt', '0deg');
    if (a.moveu) {
      setArrastando(false);
      gravar(POS_KEY, posRef.current);
      passageiro('pulando', 650);
    } else if (chatRef.current) fecharChat();
    else abrirChat();
  }
  function aoTeclar(e) {
    const passo = e.shiftKey ? 64 : 16;
    const d = { ArrowLeft: [-passo, 0], ArrowRight: [passo, 0], ArrowUp: [0, -passo], ArrowDown: [0, passo] }[e.key];
    if (d) {
      e.preventDefault();
      const novo = limitar({ x: posRef.current.x + d[0], y: posRef.current.y + d[1] });
      setPos(novo);
      gravar(POS_KEY, novo);
      if (d[0]) setDirecao(d[0] < 0 ? 'e' : 'd');
      passageiro('correndo', 400);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (chatRef.current) setChatAberto(false);
      else abrirChat();
    }
  }
  function alternarRecolhida(valor) {
    setRecolhida(valor);
    gravar(RECOLHIDA_KEY, valor);
    if (valor) setChatAberto(false);
    else passageiro('acenando', 1800);
  }
  function alternarDicas() {
    const v = !dicasLigadas;
    setDicasLigadas(v);
    gravar(DICAS_KEY, v);
    if (!v) setDica(null);
    else setDica({ id: Date.now(), texto: 'Dicas ligadas. Vou sugerir próximos passos conforme você usa as páginas.', acoes: [], ms: 5000 });
  }

  if (oculto) return null;

  if (recolhida) {
    return (
      <button
        type="button"
        className="dm-mini"
        style={{ left: pos.x + W / 2 - 22, top: pos.y + H - 52 }}
        onClick={() => alternarRecolhida(false)}
        aria-label="Mostrar a mascote do Delta"
        title="Mostrar a mascote do Delta"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path className="dm-mini__star" d={ESTRELA(12, 12, 10)} />
        </svg>
      </button>
    );
  }

  // Onde cabe o balão e o mini chat: acima da mascote; sem espaço, abaixo.
  const espacoAcima = pos.y - 62;
  const espacoAbaixo = window.innerHeight - (pos.y + H) - RODAPE - 50;
  const abaixo = espacoAcima < 300 && espacoAbaixo > espacoAcima;
  const alturaChat = Math.round(Math.max(230, Math.min(470, abaixo ? espacoAbaixo : espacoAcima)));
  const lado = pos.x < window.innerWidth / 2 ? 'is-start' : 'is-end';

  return (
    <div ref={raiz} className={`dm dm--${estado} dm--para-${direcao} ${chatAberto ? 'has-chat' : ''}`} style={{ left: pos.x, top: pos.y }}>
      {chatAberto ? (
        <MascotChat
          id={chatId}
          classe={`${abaixo ? 'is-below' : ''} ${lado}`}
          altura={alturaChat}
          mensagens={mensagens}
          respondendo={respondendo}
          parcial={parcial}
          sugestoes={sugestoesDaAba(tab)}
          motorRotulo={motorRotulo}
          onEnviar={enviar}
          onAcao={executarAcao}
          onFechar={fecharChat}
          onLimpar={() => setMensagens([])}
          onAbrirDelta={() => {
            setChatAberto(false);
            onOpen?.();
          }}
        />
      ) : null}

      {dica && !arrastando && !chatAberto ? (
        <div className={`dm-balao ${pos.y < 190 ? 'is-below' : ''} ${lado}`} role="status">
          <p>{dica.texto}</p>
          {dica.acoes?.length ? (
            <div className="dm-balao__acoes">
              {dica.acoes.map((a) => (
                <button key={a.rotulo} type="button" onClick={() => executarAcao(a)}>
                  {a.rotulo}
                </button>
              ))}
            </div>
          ) : null}
          <button type="button" className="dm-balao__fechar" onClick={() => setDica(null)} aria-label="Fechar a dica">
            ×
          </button>
        </div>
      ) : null}

      <div className="dm-char" onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
        <button
          ref={corpoRef}
          type="button"
          className="dm-body"
          onPointerDown={aoPressionar}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={aoSoltar}
          onKeyDown={aoTeclar}
          aria-expanded={chatAberto}
          aria-controls={chatAberto ? chatId : undefined}
          aria-label={`Mascote do Delta: ${info.rotulo}. Enter abre o chat; setas movem a mascote.`}
          title="Delta · clique para conversar, arraste para mover"
        >
          <Corpo />
        </button>

        <span className={`dm-chip ${info.chip ? 'is-on' : ''}`} aria-live="polite">
          {info.chip ? info.rotulo : ''}
        </span>

        <div className="dm-actions" role="group" aria-label="Ações da mascote">
          <button
            type="button"
            onClick={() => (chatAberto ? fecharChat() : abrirChat())}
            aria-label={chatAberto ? 'Fechar o chat' : 'Conversar aqui'}
            title={chatAberto ? 'Fechar o chat' : 'Conversar aqui'}
          >
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
              <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={alternarDicas}
            aria-pressed={dicasLigadas}
            aria-label={dicasLigadas ? 'Desligar as dicas' : 'Ligar as dicas'}
            title={dicasLigadas ? 'Desligar as dicas' : 'Ligar as dicas'}
            className={dicasLigadas ? '' : 'is-off'}
          >
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
              <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" />
            </svg>
          </button>
          <span className="dm-actions__sep" aria-hidden="true" />
          <button type="button" onClick={() => alternarRecolhida(true)} aria-label="Recolher a mascote" title="Recolher a mascote">
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
