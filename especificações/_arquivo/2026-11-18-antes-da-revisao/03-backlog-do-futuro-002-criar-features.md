# Criar e refinar Features por Épico

## Identificação

- `id` `03-backlog-do-futuro-002-criar-features`
- `versão` `1.0.0`
- `executor` `ia`
- `tipo de saída` `featureDiscoveryPackage`

Aplicar o [contrato comum de capacidade](especificacao-plataforma-jornada-guiada.md#42-contrato-comum-de-capacidade).

## Entradas

Um Épico por ID e revisão, com refinamento. Recuperar objetivos, capacidades, jornadas, métricas, dependências e referências de Contexto e DarkLab pertinentes à raiz. Referência adaptada de `02-criar-features.md`.

## Procedimento

1. Recuperar fronteira, resultados, beneficiários, exclusões e condições de sucesso do Épico. Se a raiz for ambígua, apresentar os IDs correspondentes para escolha.
2. Decompor em Features com resultados próprios que contribuam ao Épico. Classificar como `FUNCIONAL`, `HABILITADORA` ou `CONTROLE` e indicar consumidor ou obrigação quando aplicável.
3. Refinar cada Feature na mesma execução. Detalhar problema, valor, beneficiários, limites, comportamentos (ator, gatilho, condições, resultado observável e exceções), regras, dados, integrações, requisitos de qualidade, medição, restrições, premissas, riscos e condições de aceitação.
4. Relacionar cada elemento relevante do Épico a Features ou lacunas. Justificar dependências e sugerir ordem separada da avaliação de valor. Encerrar no nível de Feature.

## Resultado

`data` contém `epicContext`, `features[]`, `coverageMatrix[]`, `dependencies[]`, `prioritization[]`, `questions[]` e `changes[]`. `epicContext` registra `epicId`, origem, resultado, escopo e `originRefs[]`. Cada Feature inclui `id` (padrão inicial `FTR-{epicId}-{NNN}`), `epicId`, `title`, `type`, `summary`, `sourceIds[]`, `upstreamRefs[]` e `refinement` com os elementos do passo 3 e `openQuestionIds[]`. `coverageMatrix[]` usa `epicElementRef`, `featureIds[]`, motivo e questões. O Markdown apresenta a lista refinada com vínculo à revisão do Épico.

## Conferência

Cada `epicId` coincide com a raiz. Cada Feature tem contribuição observável. Métricas e posições de prioridade desconhecidas ficam `null`. Lista vazia documenta a lacuna.

## Regeneração

Usar a revisão-base da mesma raiz. Reemitir a lista inteira e manter IDs de unidades de valor equivalentes. Registrar adições, alterações, divisões, fusões e retiradas. Outro Épico abre ou recupera a série correspondente.
