import { useId } from 'react';
import { useOptionalAuth } from '../../auth/AuthContext.jsx';

/** Ilustração padrão (pessoa genérica sobre o degradê da marca), usada quando não há foto. */
function AvatarPadrao({ size }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#215ad7" />
          <stop offset="0.55" stopColor="#5e6fe1" />
          <stop offset="1" stopColor="#a650cf" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <rect width="64" height="64" rx="32" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <rect width="64" height="64" fill={`url(#${id}-bg)`} />
        <circle cx="32" cy="25" r="11.5" fill="#f3f1ff" />
        <path d="M10 64c1.5-13 10.5-21 22-21s20.5 8 22 21Z" fill="#f3f1ff" />
        <path d="M20.5 24.5c0-7.5 5.2-12.5 11.5-12.5s11.5 5 11.5 12.5c-2.6-3.4-6.6-5.4-11.5-5.4s-8.9 2-11.5 5.4Z" fill="#2b2f6b" opacity="0.85" />
      </g>
    </svg>
  );
}

/**
 * Imagem do usuário, a mesma na barra superior e no menu do DarkLabs: a foto escolhida em
 * Configurações › Geral ou, sem foto, a ilustração padrão. `label=""` torna a imagem decorativa.
 */
export default function UserAvatar({ size = 32, className = '', label }) {
  const auth = useOptionalAuth();
  const foto = auth?.session?.avatar;
  const nome = auth?.session?.name ?? 'Usuário';
  return (
    <span
      className={`user-avatar ${className}`.trim()}
      style={{ width: size, height: size }}
      {...(label === '' ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label ?? `Foto de ${nome}` })}
    >
      {foto ? <img src={foto} alt="" width={size} height={size} /> : <AvatarPadrao size={size} />}
    </span>
  );
}

/** Reduz a imagem escolhida para um quadrado de 160 px (JPEG) para caber na sessão. */
export function prepararFoto(arquivo) {
  return new Promise((resolve, reject) => {
    if (!arquivo || !/^image\//.test(arquivo.type)) {
      reject(new Error('Escolha um arquivo de imagem.'));
      return;
    }
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Imagem inválida.'));
      img.onload = () => {
        const lado = 160;
        const canvas = document.createElement('canvas');
        canvas.width = lado;
        canvas.height = lado;
        const ctx = canvas.getContext('2d');
        const menor = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - menor) / 2, (img.height - menor) / 2, menor, menor, 0, 0, lado, lado);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });
}

/** Pede para abrir Configurações (o menu do usuário na barra superior escuta este evento). */
export function abrirConfiguracoes(secao = 'geral') {
  window.dispatchEvent(new CustomEvent('jornada:abrir-configuracoes', { detail: { secao } }));
}
