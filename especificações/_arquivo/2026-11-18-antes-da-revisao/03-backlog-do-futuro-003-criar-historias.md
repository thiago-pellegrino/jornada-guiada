# Criar e refinar Histórias por Feature

## Identificação

- `id` `03-backlog-do-futuro-003-criar-historias`
- `versão` `1.0.0`
- `executor` `ia`
- `tipo de saída` `storyDiscoveryPackage`

Aplicar o [contrato comum de capacidade](especificacao-plataforma-jornada-guiada.md#42-contrato-comum-de-capacidade).

## Entradas

Uma Feature por ID e revisão, seu Épico quando disponível, solicitação original, anexos e Contexto/DarkLab pertinentes. Preservar o ID original e a correspondência com o canônico. Referência adaptada de `03-criar-historias.md`.

## Procedimento

1. Catalogar trechos relevantes como `ORIG-NNN`, com texto fiel, fonte, localizador e disposição. Preservar requisitos, interfaces, cálculos, integrações, decisões, arquitetura e exclusões informados.
2. Decompor a Feature em fatias observáveis, com persona ou consumidor, necessidade e benefício. Separar histórias por resultado verificável. Tratar elementos fora da fronteira na matriz de cobertura.
3. Refinar cada História na mesma execução. Catalogar obrigações e questões em `REF-NNN` locais à História. Classificar natureza como `Explícito`, `Derivado tecnicamente`, `Inferido` ou `Lacuna` e tipo por funcional, regra, UX, contrato, dados, integração, qualidade, segurança, operação, restrição, risco, premissa ou decisão.
4. Criar BDD principal, alternativo e de exceção, com `AC-NN`, Dado/Quando/Então e vínculos aos `REF`, Feature e fontes. Indicar critérios indeterminados e ressaltar o que se pode verificar.
5. Projetar matriz de rastreabilidade da origem aos requisitos e cenários. Agrupar insumos do detalhamento técnico. Relacionar cobertura da Feature, questões, dependências e ordem sugerida. Encerrar no nível de História.

## Resultado

`data` contém `featureContext`, `stories[]`, `coverageMatrix[]`, `dependencies[]`, `prioritization[]`, `questions[]` e `changes[]`. `featureContext` registra `featureId`, `sourceFeatureId`, `epicId`, origem, escopo e referências. Cada História contém `id` (padrão inicial `{featureId}-US-{NNN}`), `featureId`, `epicId`, `title`, `statement` com `actor`, `need` e `benefit`, `featureRefs[]`, `sourceIds[]` e `refinement`. Em `refinement`, incluir `context`, `problem`, `functionalObjective`, limites, `originalScope[]`, `requirements[]`, `acceptanceCriteria[]`, `traceability[]`, `downstreamInputs[]`, dependências e questões. Cada `REF` tem seção, descrição, tipo, natureza, `sourceRefs[]`, `relatedRefIds[]` e detalhes específicos. Cada `AC` tem tipo de cenário, Dado/Quando/Então e vínculos a requisitos e fontes. A visão Markdown abre com raízes e revisão. Projetar a estrutura numerada abaixo e omitir partes opcionais sem aplicação.

| Seções | Projeção |
|---|---|
| 1–6 | Título, contexto, problema, persona, enunciado e objetivo funcional |
| 7–12 | Escopo funcional, exclusões, premissas, requisitos técnicos, componentes e regras |
| 13–16 | Critérios BDD e cenários principais, alternativos e de exceção |
| 17–22 | Requisitos não funcionais, dados, integrações, restrições, riscos e questões |
| 23–27 | Escopo original, rastreabilidade textual, matriz de requisitos, insumos de tasks e conferência diagnóstica |

## Conferência

Cada História referencia uma única Feature selecionada. Atores inferidos ficam identificados. IDs locais `REF` e `AC` são únicos e resolvem com `storyId` em referências externas. Registro sem cobertura indica motivo, dependência ou lacuna.

## Regeneração

Reemitir todas as Histórias da Feature. Preservar IDs legados e `REF` estáveis quando identidade, resultado e fronteira forem equivalentes. Atualizar BDD, vínculos, ordem e histórico.
