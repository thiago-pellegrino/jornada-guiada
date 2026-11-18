#!/usr/bin/env node
// Confere as saídas do DarkLab geradas sobre o corpus do caso de teste contra o gabarito do HTML.
// Uso: node testes/credit-on-wealth/conferir-darklab.mjs <pasta-com-as-saidas>
// A pasta deve conter o saida.json de cada motor (02-darklab-001 a 007), com qualquer nome terminado em .json.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const gabarito = JSON.parse(fs.readFileSync(path.join(aqui, 'gabarito-darklab.json'), 'utf8'));
const pasta = process.argv[2];
if (!pasta || !fs.existsSync(pasta)) {
  console.error('Informe a pasta com os saida.json dos motores.');
  process.exit(2);
}

const saidas = new Map();
for (const nome of fs.readdirSync(pasta).filter((n) => n.endsWith('.json'))) {
  try {
    const env = JSON.parse(fs.readFileSync(path.join(pasta, nome), 'utf8'));
    const m = env.capabilityId?.match(/^02-darklab-00([1-7])-/);
    if (m) saidas.set(Number(m[1]), env);
  } catch {
    console.log(`AVISO  ${nome}: não é JSON válido`);
  }
}

let falhas = 0;
const falha = (m, msg) => {
  falhas++;
  console.log(`FALHA  M${m}: ${msg}`);
};
const ok = (m, msg) => console.log(`ok     M${m}: ${msg}`);
const iniciado = (lista) => lista.some((d) => d.status !== 'pendente');

for (const g of gabarito.motores) {
  const env = saidas.get(g.motor);
  if (!env) {
    falha(g.motor, 'saída ausente');
    continue;
  }
  const d = env.data ?? {};
  const entregaveis = d.deliverables ?? [];
  const atividades = d.activities ?? [];
  const evidencias = new Set((env.evidenceRefs ?? []).map((e) => e.id));

  // 1. Situação geral do motor: iniciado ou não, como no gabarito.
  const gIniciado = iniciado(g.entregaveis);
  const sIniciado = iniciado(entregaveis);
  if (gIniciado !== sIniciado) falha(g.motor, `gabarito diz ${gIniciado ? 'iniciado' : 'não iniciado'}; saída diz ${sIniciado ? 'iniciado' : 'não iniciado'}`);
  else ok(g.motor, `situação geral confere (${gIniciado ? 'iniciado' : 'não iniciado'})`);

  // 2. Nada concluído onde o gabarito não tem nada concluído.
  const gConcluidos = g.entregaveis.filter((x) => x.status === 'concluído').length;
  const sConcluidos = entregaveis.filter((x) => x.status === 'concluído').length;
  if (gConcluidos === 0 && sConcluidos > 0) falha(g.motor, `${sConcluidos} entregável(is) "concluído" sem equivalente no gabarito: material produzido deve ficar "em aceite"`);

  // 3. Bloqueio registrado no gabarito aparece como impedido.
  if (g.entregaveis.some((x) => x.status === 'impedido') && !entregaveis.some((x) => x.status === 'impedido')) {
    falha(g.motor, 'gabarito registra entregável impedido; a saída não registra nenhum');
  }

  // 4. Status diferente de pendente sempre com evidência existente.
  for (const e of entregaveis) {
    if (e.status !== 'pendente' && !(e.evidenceIds ?? []).some((id) => evidencias.has(id))) {
      falha(g.motor, `entregável "${e.name}" com status "${e.status}" sem evidência em evidenceRefs`);
    }
  }

  // 5. Atividades registradas quando o gabarito tem trabalho feito ou em curso.
  const gTrabalho = g.atividades.filter((a) => a.status !== 'pendente').length;
  if (gTrabalho > 0 && atividades.length === 0) falha(g.motor, `gabarito tem ${gTrabalho} atividade(s) registradas; a saída não tem nenhuma`);
  else if (gTrabalho > 0) ok(g.motor, `${atividades.length} atividade(s) na saída para ${gTrabalho} no gabarito`);

  // 6. Ressalva de leitura presente.
  if (!(d.readingNote?.doesNotProve ?? []).length) falha(g.motor, 'readingNote.doesNotProve vazio');

  // 7. M5–M7 sem MVP em operação: nada documentado como resultado.
  if (g.motor >= 5 && !gIniciado) {
    const documentados = JSON.stringify(d).match(/"natureza":\s*"documentado"/g)?.length ?? 0;
    if (documentados > 0) console.log(`AVISO  M${g.motor}: ${documentados} item(ns) "documentado" num motor não iniciado; conferir se não são resultados atribuídos sem evidência`);
  }
}

console.log(falhas ? `\n${falhas} falha(s) contra o gabarito.` : '\nOK: as saídas conferem com o gabarito.');
process.exit(falhas ? 1 : 0);
