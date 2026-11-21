/**
 * Empresas clientes disponíveis ao criar um projeto. Nomes fictícios do protótipo: substitua pela
 * lista real (cadastro de clientes) quando houver integração.
 */
export const EMPRESAS = Object.freeze([
  { id: 'emp-aurora', name: 'Banco Aurora', sector: 'Serviços financeiros' },
  { id: 'emp-horizonte', name: 'Seguradora Horizonte', sector: 'Seguros' },
  { id: 'emp-lumen', name: 'Lumen Varejo', sector: 'Varejo' },
  { id: 'emp-atlantica', name: 'Energia Atlântica', sector: 'Energia e utilities' },
  { id: 'emp-vitalis', name: 'Rede Vitalis Saúde', sector: 'Saúde' },
  { id: 'emp-meridiano', name: 'Meridiano Telecom', sector: 'Telecomunicações' },
  { id: 'emp-cerrado', name: 'Cerrado Agro', sector: 'Agronegócio' },
  { id: 'emp-vetor', name: 'Vetor Logística', sector: 'Logística e transporte' },
]);

/** Normaliza a empresa escolhida no diálogo: uma da lista ou outra digitada pelo usuário. */
export function normalizarEmpresa(empresa) {
  if (!empresa) return null;
  const daLista = EMPRESAS.find((e) => e.id === empresa.id);
  if (daLista) return { ...daLista };
  const nome = String(empresa.name ?? '').trim();
  if (!nome) return null;
  return { id: `emp-outra-${nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`, name: nome, sector: String(empresa.sector ?? '').trim() || 'Outra empresa' };
}

/** Busca por nome ou setor, sem diferenciar acentos e maiúsculas. */
export function filtrarEmpresas(busca, lista = EMPRESAS) {
  const limpar = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const q = limpar(busca ?? '').trim();
  if (!q) return lista;
  return lista.filter((e) => limpar(`${e.name} ${e.sector}`).includes(q));
}
