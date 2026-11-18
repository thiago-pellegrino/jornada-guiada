# Criar e refinar Épicos

## Identificação

- `id` `03-backlog-do-futuro-001-criar-epicos`
- `versão` `1.0.0`
- `executor` `ia`
- `tipo de saída` `epicDiscoveryPackage`

Aplicar o [contrato comum de capacidade](especificacao-plataforma-jornada-guiada.md#42-contrato-comum-de-capacidade).

## Entradas

Recorte do portfólio, corpus de Contexto, saídas relevantes do DarkLab, iniciativas existentes e feedback, quando presentes. Referência adaptada de `01-criar-epicos.md`.

## Procedimento

1. Inventariar fontes, objetivos e KPIs, problemas e oportunidades, stakeholders, políticas, restrições, domínios e capacidades. Mapear value streams, jornadas, processos e eventos.
2. Descobrir unidades estratégicas de valor a partir de necessidades evidenciadas. Avaliar fronteiras por resultado, coesão e acoplamento. Consolidar duplicidades sustentadas e dividir resultados com autonomia.
3. Refinar cada Épico na mesma execução. Detalhar situação, problema, beneficiários, resultado, hipótese de valor, fronteira e exclusões, capacidade a desenvolver, indicadores e condições de sucesso, premissas, dependências, riscos, restrições, confiança e questões.
4. Projetar cobertura por objetivo, problema, capacidade, jornada e política. Dar disposição a itens relevantes: mapeado, contexto, duplicado, sobreposto, conflito, fora de escopo, adiado, dúvida ou sem resolução.
5. Propor prioridade e ondas com valor, urgência, esforço, riscos e dependências quando houver evidência. Indicar limites do ranking e métricas de cobertura. Encerrar no nível de Épico.

## Resultado

`data` contém `objectives[]`, `kpis[]`, `problems[]`, `opportunities[]`, `stakeholders[]`, `domains[]`, `capabilities[]`, `valueStreams[]`, `journeys[]`, `processes[]`, `businessEvents[]`, `policies[]`, `constraints[]`, `dependencies[]`, `risks[]`, `assumptions[]`, `questions[]`, `epics[]`, `relations[]`, `coverageMatrix`, `dispositions[]`, `overlaps[]`, `qualityAssessment[]`, `prioritization`, `roadmap[]`, `metrics` e `changes[]`. Cada Épico `EPC-NNN` tem `id`, `title`, `summary`, `expectedOutcome`, `valueHypothesis`, `scopeBoundary`, `excludedScope[]`, `linkedElementIds[]`, `sourceIds[]`, `confidence`, `priorityAssessment`, `complexityAssessment` e `refinement`. O refinamento contém os campos do passo 3 e os respectivos vínculos. A projeção Markdown inclui lista completa, cobertura, roadmap e questões.

## Conferência

Cada Épico tem vínculo com pelo menos um objetivo, problema, oportunidade, capacidade, jornada ou obrigação sustentada. Quando nenhum candidato se sustentar, entregar lista vazia com as lacunas.

## Regeneração

Começar no recorte do feedback e reavaliar lista inteira, cobertura, dependências e prioridade. Reemitir todos os Épicos refinados. Preservar IDs de resultado e fronteira equivalentes. Registrar fusões, divisões e retiradas em `changes`.
