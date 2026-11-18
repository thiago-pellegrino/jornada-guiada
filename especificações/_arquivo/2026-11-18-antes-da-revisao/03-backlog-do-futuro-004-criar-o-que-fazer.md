# Detalhar o que fazer por História

## Identificação

- `id` `03-backlog-do-futuro-004-criar-o-que-fazer`
- `versão` `1.0.0`
- `executor` `ia`
- `tipo de saída` `taskDefinitionPackage`

Aplicar o [contrato comum de capacidade](especificacao-plataforma-jornada-guiada.md#42-contrato-comum-de-capacidade).

## Entradas

Uma História por ID e revisão, com BDD, `REF`, evidências da solicitação, escopo e contexto técnico autorizado. Recuperar Feature e Épico quando disponíveis. Referência adaptada de `04-criar-o-que-fazer.md`.

## Procedimento

1. Extrair obrigações da História em matriz `REQ-NNN`. Deduplicar preservando vínculos a `REF`, `AC`, trechos originais e seção. Classificar tipo e natureza da obrigação. Preservar classificação original quando for diferente.
2. Decompor por entrega futura verificável de implementação, teste, configuração, documentação, decisão, mitigação ou refinamento. Separar responsabilidades quando dependências ou entregáveis se beneficiarem da divisão.
3. Usar stack e arquitetura registradas. Quando o projeto indicar Java/Spring Boot e omitir o padrão de arquitetura, tratar arquitetura hexagonal como referência candidata. Descrever operação `Criar`, `Alterar` ou `Validar`, responsabilidade e caminho fundamentado, com `null` para caminho desconhecido.
4. Determinar ordem, dependências internas e externas e paralelismo. Registrar ciclos como questão e destacar o que pode avançar.
5. Gerar um prompt autossuficiente por task com raiz, objetivo, limites, IDs `REQ` e origens, componentes, regras, BDD, entradas, saídas, dependências e testes. Para refinamento ou decisão, declarar pergunta, evidência necessária e registro esperado. Expor o prompt para consulta e exportação.

## Resultado

`data` contém `storyContext`, `requirements[]`, `tasks[]`, `coverage`, `questions[]`, `executionOrder[]` e `changes[]`. `storyContext` registra IDs da História, Feature, Épico e revisão de origem. Cada requisito tem `id`, `description`, `type`, `nature`, `origins[]` e `taskIds[]`. Cada task `TSK-NNN` tem objetivo, categoria, camada, escopo/exclusões, `requirementIds[]`, `acceptanceCriteriaIds[]`, `businessRuleRequirementIds[]`, entradas/saídas, `artifacts[]`, testes/evidências, dependências internas/externas, riscos, `completionChecklist[]` desmarcado e `executionPrompt`. `coverage` contém totais, vinculados, percentual (`null` sem requisitos), lacunas e contagem por tipo. Projetar no Markdown a matriz, tasks, prompts, conferência, ordem e histórico.

## Conferência

Os vínculos `REQ`→`TSK` e `TSK`→`REQ` são inversos. Critérios apontam à revisão da História usada. Uma task de decisão ou teste cobre o encaminhamento, e sua evidência de conclusão pertence à execução futura.

## Regeneração

Reemitir matriz, tasks e prompts da mesma História. Preservar IDs de obrigações e entregas equivalentes e indicar requisitos e testes impactados.
