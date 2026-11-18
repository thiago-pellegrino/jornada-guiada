---
name: criar-features
version: 1.0.0
artifact_type: operational-skill-specification
domain: feature-discovery-and-refinement
language: pt-BR
canonical_input: epicDiscoveryPackage
canonical_output: featureDiscoveryPackage
previous_artifact: 01-criar-epicos.md
---

> **Documento legado (somente referência, não carregado pelo catálogo).** Substituído por [03-backlog-do-futuro-002-gerar-features-do-epico.md](../03-backlog-do-futuro-002-gerar-features-do-epico.md), que segue o [contrato comum](../00-contrato-comum-das-capacidades.md). Neste texto, os estados `PROPOSTO`/`APROVADO`, os formatos de ID, `schemaVersion` e as naturezas originais não valem mais; ver o contrato comum §2–§6.


# Criar Features a partir de um Épico selecionado

> **Versão** 1.0.0  
> **Entrada** Um Épico selecionado e seu contexto de negócio  
> **Saída** Lista completa de Features refinadas em Markdown e em `featureDiscoveryPackage` (JSON)

## 1. Finalidade

Decompor o Épico selecionado em Features com valor observável, delimitar o escopo de cada uma e refiná-las na mesma execução. Entregar a lista completa para uma única raiz `EPC` por execução.

Uma Feature representa uma capacidade, um comportamento de negócio, um controle ou um habilitador necessário para entregar parte do resultado do Épico. A saída descreve o que deve ser possível fazer, para quem, em quais condições e como verificar o resultado. A decomposição encerra no nível de Feature. Histórias, tarefas e decisões de implementação pertencem a etapas posteriores.

## 2. Seleção e entradas

### 2.1 Selecionar a raiz

- Usar o `selectedEpicId`, um ID informado na conversa ou um título que identifique inequivocamente a escolha do usuário, como “crie Features para o EPC-003”.
- Quando o usuário disser “este Épico”, usar o Épico inequivocamente referenciado na conversa ou no material selecionado.
- Se a escolha estiver ausente ou ambígua, pedir apenas a identificação do Épico. Quando houver um portfólio disponível, mostrar os IDs e títulos relevantes para a escolha.
- A seleção pode ocorrer em uma lista de Épicos `PROPOSTO` ou `APROVADO`. A escolha do Épico e o estado da lista de Features são decisões independentes.

### 2.2 Ler o contexto

A entrada canônica é o `epicDiscoveryPackage` do `01-criar-epicos.md`, acompanhado de `selectedEpicId`. Também é possível usar a visão em Markdown ou a especificação do Épico selecionado na conversa. Quando o contexto estiver incompleto, aproveitar as informações disponíveis, registrar o que falta e gerar as Features que as evidências sustentam.

Do pacote de origem, localizar `epics[].id`, copiar os vínculos relevantes de problema, objetivo, capacidade, jornada, indicador e fonte, e ler `epics[].refinement`. Usar `scopeBoundary`, `explicitExclusions`, `refinement.scopeIncluded` e `refinement.scopeExcluded` para delimitar a decomposição. Considerar as condições de sucesso, os indicadores, as capacidades a desenvolver, as dependências, as premissas, os riscos e as questões em aberto do Épico.

Registrar `epicId`, título, `sourcePackageId` e `sourceRevision` para que a origem possa ser identificada. Usar `null` nos metadados de origem indisponíveis. Demais Épicos podem fornecer contexto de dependência. Cada Feature gerada continua ligada à raiz selecionada.

### 2.3 Envelope de entrada

```json
{
  "selectedEpicId": "EPC-003",
  "epicDiscoveryPackage": null,
  "selectedEpicMarkdown": null,
  "additionalContext": [],
  "revisionRequest": {
    "previousPackage": null,
    "feedback": null,
    "focusFeatureIds": []
  }
}
```

Preencher o pacote, o Markdown ou usar o material já identificado na conversa. Em uma revisão, `previousPackage` é o resultado anterior de Features para a mesma raiz. `focusFeatureIds` orienta o recorte inicial da revisão. A entrega continua sendo a lista inteira.

## 3. Estados do resultado

O estado pertence à revisão da lista, em `artifact.status` no JSON e **Estado do resultado** no Markdown.

| Estado | Aplicação |
|---|---|
| `PROPOSTO` | Toda primeira geração e toda regeneração entrega a lista completa já refinada neste estado. |
| `APROVADO` | Registrar quando o usuário aprovar explicitamente a lista. Aplicar à revisão indicada ou à última revisão entregue para o Épico em questão. |

A aprovação atualiza o estado da mesma revisão em Markdown e JSON e preserva seu conteúdo. Ela depende apenas da manifestação explícita do usuário. Dependências, premissas, questões em aberto e observações de cobertura permanecem no resultado e podem acompanhar qualquer estado.

Cada Feature e seu refinamento são partes da lista e usam o estado da revisão. Uma nova geração cria outra revisão em `PROPOSTO`. O estado da revisão anterior fica no histórico daquela revisão. A aprovação da lista de Features se refere a essa lista.

## 4. Geração e refinamento na mesma execução

1. **Ler a raiz.** Identificar o resultado do Épico, seu problema, beneficiários, critérios de sucesso, fronteiras e evidências relevantes.
2. **Descobrir unidades de valor.** Mapear capacidades a desenvolver, etapas da jornada e controles necessários. Formular Features com valor observável ou contribuição habilitadora explícita.
3. **Delimitar a lista.** Identificar lacunas, redundâncias, sobreposições e dependências. Ajustar as fronteiras no próprio trabalho de decomposição.
4. **Refinar cada Feature.** Descrever comportamentos, regras, escopo, condições de aceitação e questões de negócio, conforme a seção 6.
5. **Recomendar ordem.** Usar a contribuição ao resultado do Épico, as dependências, o risco e a urgência documentada. Explicar a ordem proposta e a incerteza onde faltar evidência.
6. **Entregar.** Apresentar a lista completa em `PROPOSTO`, em Markdown e JSON equivalentes, com cobertura, ordem sugerida e questões em aberto.

Ao usar fontes adicionais, anotar o localizador e os elementos sustentados. Se duas fontes divergirem, registrar a diferença, a premissa de trabalho quando necessária e a questão correspondente. Se os insumos não sustentarem nenhuma Feature, entregar a lista vazia em `PROPOSTO` com as lacunas concretas do Épico.

## 5. Como definir a fronteira de uma Feature

| Pergunta | Como aplicar |
|---|---|
| Qual resultado observável a Feature entrega? | Identificar beneficiário, capacidade ou comportamento e sua contribuição ao Épico. |
| Há valor ou necessidade própria para separá-la? | Dividir quando as partes tiverem resultados e decisões de prioridade independentes. Manter juntas as partes que compõem o mesmo comportamento e só geram valor em conjunto. |
| Outra Feature cobre o mesmo resultado? | Consolidar duplicidade sustentada pelas fontes. Quando a sobreposição for parcial, delimitar as responsabilidades e explicitar a relação. |
| Existe um habilitador ou controle necessário? | Descrever o resultado que ele viabiliza ou protege, identificar o consumidor ou a obrigação e registrar o vínculo com a Feature ou com o resultado do Épico. |
| O recorte pertence ao Épico selecionado? | Vincular à sua fronteira e a um objetivo, resultado, capacidade, jornada ou obrigação aplicável. Registrar temas de outros Épicos como dependências ou observações de escopo. |

Aplicar a granularidade no nível de produto ou de negócio. Uma tela, API, tabela ou tarefa de implementação só informa o contexto da Feature quando ajuda a entender a capacidade ou uma restrição comprovada.

Para decisões de divisão, consolidação ou ajuste de fronteira, registrar justificativa, fontes e IDs envolvidos. Use essa informação para revisar a proposta, com o histórico definido na seção 8.

## 6. Refinamento de cada Feature

Todo item deve fornecer o detalhamento disponível nos campos abaixo. Usar `null` para informação desconhecida, `[]` para coleção sem itens e questões vinculadas para lacunas que afetam escopo, comportamento ou aceitação.

| Elemento | Conteúdo |
|---|---|
| Identidade | ID `FTR`, título orientado à capacidade, resumo, `epicId` e tipo funcional, habilitador ou controle. |
| Problema, valor e beneficiários | O recorte atendido, por que a Feature importa, atores e contribuição ao resultado do Épico. |
| Escopo e exclusões | Limites de responsabilidade, etapas ou eventos cobertos e situações tratadas fora da Feature. |
| Comportamento funcional | Gatilho, ator, condições relevantes, resultado observável e exceções conhecidas. |
| Regras e restrições | Regras documentadas, conceitos de dados, integrações de negócio e requisitos de qualidade aplicáveis. Marcar hipóteses e vincular as evidências. |
| Condições de aceitação | Resultados observáveis que permitem confirmar a Feature como um todo, incluindo cenários principais e exceções materiais quando conhecidos. |
| Medição | Indicador associado, sinal de sucesso e, quando documentados, método, linha de base e meta. |
| Dependências e riscos | O que precisa existir, quem ou qual item fornece a capacidade e qual impacto tem sobre a entrega. |
| Rastreabilidade | Vínculos com objetivos, capacidades, jornadas, indicadores, fontes e questões que sustentam a Feature. |

A aceitação descreve o comportamento no nível de Feature. Exemplo: “Ao concluir uma ação de ativação válida, o participante passa a ver essa ação como concluída no seu próprio progresso”. Registre o critério com a condição e o resultado esperados. Mantenha metas e regras sem evidência como questões ou hipóteses explícitas.

## 7. Cobertura e ordem sugerida

Correlacionar cada objetivo, capacidade, condição de sucesso ou elemento relevante da jornada no Épico a uma ou mais Features. Para elementos sem Feature associada, registrar a razão, a lacuna ou a dependência conhecida. Cada registro indica a referência ao Épico, os IDs das Features e a evidência ou quesito relacionado.

Separar no relato a contribuição ao resultado e a ordem de execução. Uma Feature de alto valor pode depender de um habilitador que precisa vir antes. Mostrar a justificativa da sequência em `prioritization`. Associar dependências a Features atuais, outros Épicos, componentes de negócio ou responsáveis conhecidos. Se a direção da dependência estiver indefinida, registrar a questão.

## 8. Regeneração, identidade e histórico

- Ao receber “gere novamente”, feedback ou um pedido de ajuste, usar a última lista de Features do mesmo Épico, quando disponível. Priorizar o recorte indicado. Com feedback genérico, revisar fronteiras, contribuição ao resultado, cobertura e refinamentos.
- Preservar IDs de Features que mantêm a mesma unidade de valor. Respeitar o padrão existente. Em uma série nova, usar `FTR-{epicId}-{NNN}`, por exemplo, `FTR-EPC-003-001`. Em alterações que criem novas unidades de valor, atribuir novos IDs e relacionar origens e destinos no histórico.
- Refinar Features novas e alteradas. Incorporar novamente as demais com seu detalhamento e atualizar cobertura, prioridade e dependências afetadas.
- Na primeira execução, atribuir um `packageId` único com prefixo `FDP` e reutilizar o `correlationId` de origem quando disponível. Nas regenerações, manter os identificadores da série, incrementar `revision` e registrar `previousRevision`. A primeira entrega usa `revision: 1` e `previousRevision: null`. Se o pacote anterior estiver indisponível, recuperar o contexto conhecido e explicar o limite da comparação.
- Registrar mudanças materiais em `changes` como `ADDED`, `UPDATED`, `SPLIT`, `MERGED` ou `REMOVED`. Incluir IDs anteriores e atuais, motivo e evidências. Quando a revisão não produzir alteração material, informar o que foi revisto no resumo e usar `changes: []`.
- Entregar a nova lista inteira em `PROPOSTO`, mesmo se a revisão anterior estiver `APROVADO`. Quando a solicitação mudar a raiz para outro Épico, iniciar ou recuperar a série correspondente ao novo Épico.

## 9. Visão em Markdown

Apresentar nesta ordem:

1. **Identificação**. Épico selecionado, pacote e revisão de origem quando conhecidos, revisão da lista e estado do resultado.
2. **Resumo do Épico**. Resultado esperado, fronteira, condições de sucesso e premissas relevantes.
3. **Lista de Features refinadas**. Um bloco por `FTR` com os elementos da seção 6.
4. **Matriz de cobertura**. Elemento do Épico, Features relacionadas, justificativa e lacunas.
5. **Ordem proposta**. Sequência, dependências e razões.
6. **Questões em aberto**. Descrição, item afetado e informação necessária.
7. **Histórico da revisão**. Alterações, IDs de origem e destino e justificativas, quando houver revisão anterior.

Usar a mesma revisão, o mesmo estado do resultado, os mesmos IDs e o mesmo conteúdo de negócio da representação JSON.

## 10. Contrato `featureDiscoveryPackage`

O contrato integrado usa `schemaVersion: 2.0.0`. O estado da lista é `artifact.status`. Cada item de `features` carrega seu refinamento em `refinement`. A origem do Épico fica em `epicContext`. Os modelos desta seção ilustram a estrutura.

### 10.1 Envelope de saída

```json
{
  "schemaVersion": "2.0.0",
  "artifact": {
    "packageId": null,
    "version": "1.0.0",
    "status": "PROPOSTO",
    "revision": 1,
    "previousRevision": null,
    "correlationId": null,
    "language": "pt-BR"
  },
  "epicContext": {
    "epicId": "EPC-003",
    "title": null,
    "sourcePackageId": null,
    "sourceRevision": null,
    "expectedOutcome": null,
    "scopeIncluded": [],
    "scopeExcluded": [],
    "successConditions": [],
    "originRefs": [],
    "sourceIds": []
  },
  "sources": [],
  "questions": [],
  "features": [],
  "coverage": [],
  "dependencies": [],
  "prioritization": [],
  "changes": [],
  "revisionSummary": null
}
```

### 10.2 Elemento de `features`

Exemplo ilustrativo para um Épico de ativação. `OBJ-002`, `CAP-003` e `JRN-001` vêm do pacote do Épico. `SRC-001` e `QST-001` representam registros no pacote da lista.

```json
{
  "id": "FTR-EPC-003-001",
  "epicId": "EPC-003",
  "title": "Acompanhar a primeira ação de valor",
  "type": "FUNCIONAL",
  "summary": "Permitir que o participante saiba se concluiu a ação inicial necessária para sua ativação.",
  "objectiveIds": ["OBJ-002"],
  "capabilityIds": ["CAP-003"],
  "journeyIds": ["JRN-001"],
  "kpiIds": [],
  "stakeholderIds": [],
  "sourceIds": ["SRC-001"],
  "refinement": {
    "problemSlice": "O participante não sabe se concluiu a ação inicial.",
    "beneficiaries": ["Participante em ativação"],
    "expectedOutcomeContribution": "Tornar visível a conclusão da primeira ação de valor.",
    "scopeIncluded": ["Acompanhar a conclusão da ação inicial do próprio participante."],
    "scopeExcluded": ["Acompanhar recorrência após a ativação."],
    "behaviors": [
      {
        "actor": "Participante",
        "trigger": "Consulta do progresso da ativação",
        "conditions": ["Participante em sua jornada de ativação."],
        "observableResult": "A conclusão da ação inicial é exibida no progresso do participante.",
        "exceptions": []
      }
    ],
    "businessRules": [],
    "dataConcepts": ["Ação de ativação", "Progresso do participante"],
    "conceptualIntegrations": [],
    "qualityRequirements": [],
    "acceptanceConditions": [
      {
        "condition": "O participante concluiu uma ação de ativação válida e consulta seu progresso.",
        "expectedResult": "A ação inicial aparece como concluída para esse participante.",
        "sourceIds": ["SRC-001"]
      }
    ],
    "measurement": [],
    "dependencyIds": [],
    "constraints": [],
    "assumptions": [],
    "risks": [],
    "openQuestionIds": ["QST-001"]
  }
}
```

### 10.3 Referências e elementos complementares

| Coleção ou campo | Estrutura e relação |
|---|---|
| `epicContext.originRefs[]` | `{ type, id, summary }`. Registra referências herdadas do Épico, por exemplo objetivos, capacidades, jornadas, indicadores e atores. Para uma condição sem ID, registrar sua posição ou texto em `coverage[].epicElementRef`. |
| `sources[]` | `{ id, title, locator }`. Reutilizar identificadores do contexto de origem quando puderem ser confirmados. |
| `questions[]` | `{ id, description, impact, featureIds, sourceIds }`. IDs em `refinement.openQuestionIds` remetem a esta coleção. |
| `coverage[]` | `{ epicElementRef, featureIds, rationale, openQuestionIds }`. Usar `featureIds: []` quando o elemento estiver sem cobertura conhecida e explicitar a razão. |
| `dependencies[]` | `{ id, fromFeatureId, target, rationale, sourceIds }`. O destino pode ser uma Feature, outro Épico ou uma referência externa identificável. |
| `prioritization[]` | `{ featureId, order, rationale }`. Usar `null` em `order` quando não houver evidência para sugerir uma posição. |
| `changes[]` | `{ type, previousFeatureIds, currentFeatureIds, rationale, sourceIds }`. IDs históricos referenciam a revisão de origem. |

Usar como `type` de Feature `FUNCIONAL`, `HABILITADORA` ou `CONTROLE`, conforme sua contribuição principal. Em regras e requisitos de qualidade, registrar a descrição e a fonte ou a natureza de hipótese. Em `measurement`, usar objetos com `kpiId`, `successSignal`, `unit`, `method`, `baseline` e `target`, preenchidos conforme a evidência.

Todo `features[].epicId` deve coincidir com `epicContext.epicId`. IDs de Features são únicos no pacote. As referências herdadas remetem ao contexto registrado do Épico. Os demais IDs resolvem para os registros correspondentes ou, quando históricos, para a revisão anterior.

## 11. Cenários de uso

| Situação | Resultado esperado |
|---|---|
| “Crie as Features do EPC-003” | Ler o Épico escolhido e entregar a lista completa já refinada como `PROPOSTO`. |
| Há dois Épicos com o mesmo título e nenhum ID foi indicado | Pedir apenas qual ID deve ser usado. |
| O Épico selecionado tem uma questão em aberto sobre sua meta | Gerar as Features sustentadas, deixar a meta desconhecida como `null` e vincular a questão aos itens afetados. |
| “Gere novamente, separe ativação de acompanhamento” | Rever a fronteira com as evidências disponíveis, refinar os recortes resultantes, registrar o histórico e entregar toda a nova revisão como `PROPOSTO`. |
| “Aprovo a revisão 2” | Registrar `APROVADO` para a revisão 2 em Markdown e JSON. Se houver uma regeneração posterior, a nova revisão começa em `PROPOSTO`. |

## 12. Instrução de execução

Use o Épico indicado pelo usuário como raiz. Descubra as Features, refine todas na mesma execução e entregue a lista completa como `PROPOSTO`. Se houver aprovação explícita, registre `APROVADO` para a revisão correspondente. Se houver pedido de nova versão, use o feedback disponível e entregue outra revisão completa como `PROPOSTO`, com as Features refinadas, as questões e o histórico das alterações.
