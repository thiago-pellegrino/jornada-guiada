/**
 * Estrutura do menu lateral da aba DarkLabs. Cada item com `id` é uma tela; grupos com `children`
 * abrem e fecham. Para ligar uma tela pronta, registre o componente em DARKLAB_SCREENS (DarklabTab).
 */
export const DARKLAB_MENU = Object.freeze([
  { id: 'visao-geral', label: 'Visão geral', icon: 'home' },
  {
    id: 'darklabs',
    label: 'DarkLabs',
    icon: 'infinity',
    children: [
      { id: 'jornada-7-motores', label: 'Jornada dos 7 motores', icon: 'infinity' },
      { id: 'aprendizados-roadmap', label: 'Aprendizados e roadmap', icon: 'bars' },
      { id: 'jornada-futuro', label: 'Jornada do futuro', icon: 'rocket' },
      { id: 'vamos-alem', label: 'Vamos além?', icon: 'infinity' },
    ],
  },
  {
    id: 'diario-de-bordo',
    label: 'Diário de bordo',
    icon: 'journal',
    children: [
      { id: 'publicacoes', label: 'Todas as publicações', icon: 'sliders' },
      { id: 'radar-descobertas', label: 'Radar de descobertas', icon: 'search' },
      { id: 'notebook-hipoteses', label: 'Notebook: hipóteses e sinais', icon: 'target' },
      { id: 'personas-sinteticas', label: 'Personas sintéticas', icon: 'users' },
    ],
  },
  {
    id: 'make-human',
    label: 'Make Human',
    icon: 'users',
    children: [
      { id: 'governanca-papeis', label: 'Governança e papéis', icon: 'usersGroup' },
      { id: 'perfil-discovery', label: 'Meu perfil no discovery', icon: 'key' },
    ],
  },
  {
    section: 'Gestão do projeto',
    items: [
      { id: 'protocolo-5-etapas', label: 'Protocolo em 5 etapas', icon: 'compass' },
      { id: 'rastreabilidade', label: 'Rastreabilidade dos entregáveis', icon: 'file' },
      { id: 'atividades', label: 'Atividades consolidadas', icon: 'sliders' },
      { id: 'documentos', label: 'Documentos, evidências e conhecimento', icon: 'file' },
      { id: 'aprovacoes', label: 'Aprovações', icon: 'check', locked: true },
    ],
  },
]);

export const DEFAULT_DARKLAB_VIEW = 'visao-geral';

/** Índice plano: id → { item, group } (group = grupo ou seção a que pertence). */
export const DARKLAB_INDEX = (() => {
  const mapa = new Map();
  for (const entrada of DARKLAB_MENU) {
    if (entrada.section) entrada.items.forEach((item) => mapa.set(item.id, { item, group: { label: entrada.section } }));
    else if (entrada.children) entrada.children.forEach((item) => mapa.set(item.id, { item, group: entrada }));
    else mapa.set(entrada.id, { item: entrada, group: null });
  }
  return mapa;
})();

/** Grupo que contém a tela (para abrir o acordeão certo). */
export function groupOf(viewId) {
  return DARKLAB_MENU.find((e) => e.children?.some((c) => c.id === viewId))?.id ?? null;
}
