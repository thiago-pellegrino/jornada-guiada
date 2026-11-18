import { useOptionalAuth } from '../../auth/AuthContext.jsx';
import defaultUserPhoto from '../../assets/user-default.jpg';

/**
 * Imagem do usuário, a mesma na barra superior e no menu do DarkLabs: a foto escolhida em
 * Configurações › Geral ou, sem foto personalizada, o retrato padrão em estilo editorial.
 * `label=""` torna a imagem decorativa.
 */
export default function UserAvatar({ size = 32, className = '', label }) {
  const auth = useOptionalAuth();
  const foto = auth?.session?.avatar || defaultUserPhoto;
  const nome = auth?.session?.name ?? 'Usuário';
  return (
    <span
      className={`user-avatar ${className}`.trim()}
      style={{ width: size, height: size }}
      {...(label === '' ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label ?? `Foto de ${nome}` })}
    >
      <img src={foto} alt="" width={size} height={size} decoding="async" />
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
