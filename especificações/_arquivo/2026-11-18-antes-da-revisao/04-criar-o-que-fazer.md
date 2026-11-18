---
name: criar-o-que-fazer
version: 1.0.0
artifact_type: operational-skill-specification
domain: technical-task-decomposition-and-traceability
language: pt-BR
canonical_input: storyDiscoveryPackage
canonical_output: taskDefinitionPackage
previous_artifact: 03-criar-historias.md
---

# Criar o que fazer a partir de uma História selecionada

> **Versão** 1.0.0  
> **Entrada** Uma História refinada, selecionada pelo usuário, e seus insumos de requisitos  
> **Saída** Lista completa de tasks em Markdown e em `taskDefinitionPackage` (JSON)

## 1. Finalidade

Transformar a História em unidades executáveis de trabalho. Descrever o que cada task deve entregar, por que ela existe, quais requisitos atende, quais artefatos espera e como verificar seu resultado. Gerar a matriz de requisitos, as tasks e os prompts de execução na mesma execução.

O modelo `task-generation.md` está incorporado neste fluxo. A entrega define o trabalho e conserva os prompts como insumos para execução posterior. Código, alterações no projeto, execução de testes e deploy pertencem à execução das tasks.

## 2. Seleção e entradas

### 2.1 Selecionar a História

- Usar `selectedStoryId`, ID de História ou título que identifique inequivocamente a escolha do usuário. A raiz é uma única História `US` por lista.
- Aceitar Histórias de listas `PROPOSTO` ou `APROVADO`. Quando a escolha estiver ausente ou ambígua, apresentar as correspondências disponíveis e pedir apenas a identificação da História.
- Preservar `storyId` e a cadeia canônica `EPC → FTR → US` quando conhecida. Resolver IDs anteriores pelo histórico e pelas referências de origem, sem renomear registros existentes durante a leitura.

### 2.2 Ler a origem

A entrada canônica é o `storyDiscoveryPackage` de `03-criar-historias.md`. Também é possível usar a História refinada em Markdown, acompanhada de seus insumos. Ler integralmente o conteúdo aplicável.

- Extrair `stories[].refinement.requirements`, `acceptanceCriteria`, `originalScope`, `traceability`, `downstreamInputs`, `dependencyIds` e `openQuestionIds`.
- Em Markdown, ler as seções disponíveis da História, com atenção à matriz de requisitos, aos cenários BDD, aos riscos e à seção 26 de insumos para tasks. Confrontar a seção 26 com o restante da História para preservar detalhes.
- Reaproveitar os IDs `REF` e `AC` e os vínculos `ORIG`, `SRC`, `QST` e `DEP` quando existirem. Registrar `sourcePackageId` e `sourceRevision` conforme a origem.
- Usar contexto adicional e anexos para identificar restrições e práticas do projeto. Manter escopo excluído como restrição. Quando fontes divergirem, registrar a questão e seus impactos. Se a História estiver identificada e a evidência não sustentar tarefas de implementação, apresentar o refinamento necessário ou a lista vazia com as lacunas identificadas.

### 2.3 Envelope de entrada

```json
{
  "selectedStoryId": "EPC-003-FTR-001-US-001",
  "storyDiscoveryPackage": null,
  "selectedStoryMarkdown": null,
  "inputText": null,
  "additionalContext": [],
  "attachments": [],
  "revisionRequest": {
    "previousPackage": null,
    "feedback": null,
    "focusTaskIds": []
  }
}
```

## 3. Estados do resultado

A revisão da lista tem dois estados. Usar `artifact.status` no JSON e **Estado do resultado** no Markdown.

| Estado | Quando usar |
|---|---|
| `PROPOSTO` | Ao entregar a primeira lista e toda regeneração, com matriz de requisitos, tasks e prompts. |
| `APROVADO` | Ao receber aprovação explícita do usuário para a revisão indicada ou para a última revisão entregue dessa História. |

A aprovação altera o estado da mesma revisão em Markdown e JSON e preserva seu conteúdo. A aprovação da lista não representa execução das tasks. Dependências, riscos, requisitos abertos, percentuais e checklists são informações de planejamento e podem acompanhar ambos os estados. As tasks usam o estado da lista.

## 4. Extração e matriz de requisitos

1. Ler intenção, persona, objetivo, escopo, exclusões, premissas, regras, cenários, dados, interface, contratos, integrações, requisitos não funcionais, restrições, riscos e decisões.
2. Consolidar duplicidades sem perder as fontes e sem agrupar obrigações com resultados distintos. Preservar requisitos técnicos necessários, com justificativa quando forem derivados.
3. Atribuir a cada obrigação levantada um ID `REQ-001`, `REQ-002` e assim por diante, estável dentro da série da História. Conservar vínculos com todos os `REF`, critérios BDD e trechos aplicáveis. Critérios com obrigação própria de teste ou validação podem ter `REQ` de Teste/Qualidade.
4. Classificar o item pelo efeito principal e pela natureza. Quando um `REF` tiver classificação mais específica, manter seu tipo e sua natureza de origem como evidência e relacioná-los à classificação técnica quando houver adaptação.
5. Gerar a matriz antes da lista de tasks, com os vínculos preenchidos após a decomposição.

**Tipos.** Funcional, Regra de negócio, Interface/UX, API/Contrato, Dados/Persistência, Integração, Segurança/LGPD, Observabilidade, Performance, Resiliência, Teste/Qualidade, DevOps/Deploy/Rollback, Documentação, Risco, Refinamento e Decisão técnica. Manter auditoria, idempotência, premissas, restrições ou categorias adicionais quando forem úteis para preservar o significado da História. Exemplos de classificação incluem contrato de API quando o requisito define mensagens e respostas, Segurança/LGPD quando limita acesso ou exposição de dados, e Resiliência quando define comportamento sob falha.

**Naturezas.** `Explícito` para o que foi especificado, `Derivado tecnicamente` para obrigação necessária com justificativa verificável, `Ambíguo` para mais de uma interpretação plausível e `Lacuna` para definição ausente. Preservar a natureza original separadamente quando diferir.

| ID | Origem | Tipo | Descrição | Natureza | Tasks relacionadas |
|---|---|---|---|---|---|
| `REQ-001` | História, seção, `REF`, `AC` ou fonte aplicável | Tipo principal | Obrigação específica e rastreável | Natureza | IDs `TSK` que tratam o requisito |

## 5. Decomposição das tasks

- Criar uma task por entrega concreta de implementação futura, teste, configuração, documentação, decisão ou refinamento. Agrupar apenas requisitos que componham essa entrega.
- Separar responsabilidades de domínio, aplicação, integração, API, interface, segurança, persistência e testes quando os entregáveis ou dependências justificarem.
- Vincular regras de negócio e critérios de aceite a ações de implementação, validação ou teste. Quando a História trouxer requisitos de dados, segurança, observabilidade, performance, resiliência, deploy ou rollback, explicitar seu tratamento na task pertinente.
- Tratar dúvidas, riscos e obrigações sem código com tasks de decisão, mitigação, validação, documentação ou refinamento. Indicar o escopo afetado e qual evidência ou definição é esperada. Manter o restante do trabalho com dependências explícitas.
- Para requisitos de interface, descrever comportamento e componentes. Para APIs ou integração, descrever contrato, validações e respostas conhecidos. Para persistência, explicitar o dado ou artefato necessário. A História e o contexto sustentam a adoção desses componentes.
- Definir ordem por dependência e opção de paralelismo quando houver independência. Distinguir uma dependência entre tasks da indisponibilidade de serviço, documentação ou decisão externa.

## 6. Arquitetura e artefatos

Usar a arquitetura e a tecnologia informadas no contexto. Para backend Java/Spring Boot sem padrão de projeto informado, usar arquitetura hexagonal como referência para sugerir camadas. Categorizar artefatos em **Domain**, **Application**, **Infrastructure**, **API**, **Frontend**, **Tests**, **DevOps** ou **Documentação** conforme a responsabilidade. Quando a arquitetura não for conhecida, declarar o papel conceitual do artefato e manter sua localização a confirmar.

Identificar cada artefato pela operação `Criar`, `Alterar` ou `Validar`, nome, responsabilidade e caminho sugerido quando fundamentado. Referenciar nomes e caminhos reais quando disponíveis. No JSON, usar `null` para caminho desconhecido. Tecnologias, endpoints, entidades, configurações, limites e padrões ausentes podem ser registrados como lacunas ou sugestões justificadas.

## 7. Formato de cada task

### Task [ID] — [título orientado ao entregável]

| Elemento | Conteúdo |
|---|---|
| Requisitos atendidos | IDs `REQ` e resumo de cada obrigação. |
| Origem | História, seção e referências `REF`, `AC` ou outras fontes aplicáveis. |
| Objetivo, categoria e camada | Resultado da task e responsabilidade de negócio ou técnica. |
| Escopo e exclusões | Entregável concreto, limites e exclusões relevantes. |
| Regras e requisitos por tipo | Regras, critérios BDD, requisitos funcionais, não funcionais, de interface, dados e integração aplicáveis. |
| Entradas e saídas | Dados, estados, artefatos, decisões ou eventos relevantes. |
| Arquivos, componentes ou artefatos | Operação, artefato, caminho fundamentado quando conhecido e responsabilidade. |
| Testes ou evidências esperadas | Cenários, resultados ou evidência documental que permitirão verificar a task. |
| Dependências e riscos | Tasks precedentes, fontes, serviços, premissas e decisões que condicionam a entrega. |
| Checklist de conclusão | Itens verificáveis de execução futura, incluindo requisitos, artefatos, regras, testes e evidências aplicáveis. |
| Prompt de execução | Texto autossuficiente conforme a seção 8. |

Usar categorias como Backend, Frontend, API, Dados, Integração, Segurança, Observabilidade, Testes, DevOps, Documentação, Refinamento ou Decisão técnica. Omitir campos opcionais vazios na visão Markdown.

## 8. Prompt de execução por task

Gerar um prompt específico, correspondente ao texto guardado em `tasks[].executionPrompt`. Ele deve identificar a História e a task, incluir objetivo e escopo, enumerar os `REQ` atendidos e suas origens e explicar quais arquivos, componentes ou evidências se espera criar, alterar ou validar. Incluir regras, condições de aceitação, entradas, saídas, limites, dependências e testes que se aplicam àquela task.

O prompt deve orientar a preservação da arquitetura e das regras existentes, o uso das tecnologias definidas no contexto e a rastreabilidade entre requisitos e evidências. Para uma task de decisão ou refinamento, descrever a pergunta, as pessoas ou evidências necessárias, a decisão esperada e onde registrá-la. Os resultados esperados são verificáveis. Quando um detalhe faltar, registrar a questão em vez de dar ao executor uma resposta inventada.

O checklist acompanha cada task como instrumento para sua futura conclusão. Os itens aparecem desmarcados na geração da lista.

## 9. Regeneração, ordem e histórico

- Ao receber “gere novamente” ou feedback, usar a última revisão para a mesma História. Começar pelas tasks ou requisitos citados. Com feedback genérico, rever escopo, responsabilidades, cobertura e dependências.
- Preservar IDs de requisitos e tasks com identidade mantida. Para novas tasks, usar `{storyId}-TSK-{NNN}`, como `EPC-003-FTR-001-US-001-TSK-001`. Respeitar IDs legados já emitidos.
- Preservar `packageId` da série, incrementar `revision` e guardar `previousRevision`. Na primeira entrega, gerar um identificador com prefixo `TDP`, usar `revision: 1` e `previousRevision: null`, e reaproveitar `correlationId` quando conhecido.
- Registrar mudanças materiais `ADDED`, `UPDATED`, `SPLIT`, `MERGED` ou `REMOVED` com as referências de origem e destino. Quando a revisão não puder ser comparada ou nenhuma mudança material for sustentada, informar isso no resumo.
- Entregar outra lista completa como `PROPOSTO`, com matriz, prompts e dependências atualizados. A revisão anterior conserva seu estado.

## 10. Visão em Markdown e conferência de cobertura

1. **Identificação.** Épico, Feature, História, revisão da origem, revisão da lista e estado.
2. **Matriz de requisitos extraídos.** Incluir `REQ`, `REF`, critérios BDD, origem, tipo, natureza e tasks relacionadas.
3. **Tasks técnicas geradas.** Um bloco por task conforme as seções 7 e 8.
4. **Conferência de cobertura.** Total de requisitos, total vinculados a tasks, cobertura percentual, lacunas, resumo por tipo e lista de tasks. Uma cobertura por refinamento, decisão ou teste indica encaminhamento planejado. A existência do vínculo não comprova implementação ou validação executada.
5. **Ordem de execução e histórico.** Dependências, paralelismo, questões e alterações de revisão.

Almejar cobertura planejada de todos os requisitos. Quando uma exigência admitir tratamento na raiz, incluir a task correspondente. Quando persistir uma lacuna, explicitá-la no relatório com a referência e seu impacto. Exibir a cobertura como diagnóstico. Usar `null` no percentual quando a matriz estiver vazia. Markdown e JSON registram a mesma revisão, os mesmos IDs e as mesmas dependências.

## 11. Contrato `taskDefinitionPackage`

### 11.1 Envelope

```json
{
  "schemaVersion": "1.0.0",
  "artifact": {
    "packageId": null,
    "version": "1.0.0",
    "status": "PROPOSTO",
    "revision": 1,
    "previousRevision": null,
    "correlationId": null,
    "language": "pt-BR"
  },
  "storyContext": {
    "storyId": "EPC-003-FTR-001-US-001",
    "featureId": "EPC-003-FTR-001",
    "epicId": "EPC-003",
    "title": null,
    "sourcePackageId": null,
    "sourceRevision": null
  },
  "requirements": [],
  "tasks": [],
  "coverage": {
    "totalRequirements": 0,
    "linkedRequirements": 0,
    "coveragePercent": null,
    "unlinkedRequirementIds": [],
    "byType": []
  },
  "changes": [],
  "revisionSummary": null
}
```

### 11.2 Elementos da matriz e das tasks

| Campo | Estrutura e relação |
|---|---|
| `requirements[]` | `{ id, type, description, nature, origins, taskIds }`. Em `origins[]`, registrar `{ storyId, section, refId, acceptanceId, sourceIds, originalRefs, sourceNature }`. |
| `tasks[]` | `{ id, title, storyId, category, layer, objective, scopeIncluded, scopeExcluded, requirementIds, acceptanceCriteriaIds, businessRuleRequirementIds, inputs, outputs, artifacts, tests, dependencyTaskIds, externalDependencies, risks, completionChecklist, executionPrompt }`. |
| `tasks[].artifacts[]` | `{ operation, name, suggestedPath, responsibility }`. |
| `tasks[].completionChecklist[]` | `{ description, done }`. Iniciar com `done: false`. |
| `coverage.byType[]` | `{ type, total, linked }`. Contar requisitos pelo tipo principal e por ID distinto. |
| `changes[]` | `{ type, previousTaskIds, currentTaskIds, requirementIds, rationale }`. |

`tasks[].requirementIds` e `requirements[].taskIds` são projeções inversas do mesmo vínculo. Os critérios BDD e as origens referenciam a revisão de História indicada em `storyContext`. Dependências internas apontam para IDs de tasks da mesma revisão. Registrar referências externas separadamente. Para valores ausentes, usar `null` em campos singulares e `[]` em coleções.

## 12. Instrução de execução

Parta da História selecionada. Extraia e classifique os requisitos, gere tasks com entregáveis e prompts próprios e registre a cobertura. Entregue a lista em `PROPOSTO`, com rastreabilidade da História aos requisitos e às tasks. Registre `APROVADO` apenas diante de aprovação explícita da revisão. Em uma regeneração, volte a entregar o conjunto completo em `PROPOSTO`.
