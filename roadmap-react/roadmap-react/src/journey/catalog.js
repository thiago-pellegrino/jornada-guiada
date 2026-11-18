import { buildCatalog } from '../domain/journey/capabilityParser.js';

/**
 * Catálogo de capacidades lido no build direto de `especificações/` (raiz do repositório).
 * Alterar uma especificação e recarregar a página já muda títulos, dependências e o
 * exemplo de saída usado como resultado simulado.
 */
const arquivos = import.meta.glob('../../../../especificações/*.md', { query: '?raw', import: 'default', eager: true });

export const CATALOG = buildCatalog(arquivos);
export const CATALOG_SIZE = CATALOG.list.length;
