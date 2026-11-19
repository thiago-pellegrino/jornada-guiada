/**
 * Canal simples para as telas avisarem a mascote do Delta sobre o que está acontecendo.
 * A mascote só reage (animação, estado e dica); ela não executa nada por conta própria.
 *
 *   avisarMascote({ estado: 'trabalhando', ativo: true, fonte: 'builder' })   // começa um trabalho
 *   avisarMascote({ estado: 'trabalhando', ativo: false, fonte: 'builder' })  // terminou
 *   avisarMascote({ estado: 'pulando', dica: { texto: 'Tela pronta!' } })      // comemora
 *   avisarMascote({ estado: 'falha', dica: { texto: 'A geração falhou.' } })  // mostra a falha
 */
export const EVENTO_MASCOTE = 'delta:mascote';

export function avisarMascote(detalhe) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENTO_MASCOTE, { detail: detalhe }));
}
