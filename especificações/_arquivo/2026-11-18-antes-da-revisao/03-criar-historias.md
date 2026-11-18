---
name: criar-historias
version: 2.0.0
artifact_type: operational-skill-specification
domain: story-discovery-and-refinement
language: pt-BR
canonical_input: featureDiscoveryPackage
canonical_output: storyDiscoveryPackage
previous_artifact: 02-criar-features.md
---

# Criar Histórias a partir de uma Feature selecionada

> **Versão** 2.0.0  
> **Entrada** Uma Feature selecionada e seu refinamento  
> **Saída** Lista completa de Histórias refinadas em Markdown e em `storyDiscoveryPackage` (JSON)

## 1. Finalidade

Decompor uma única Feature em Histórias com resultados observáveis e refinar cada História na mesma execução. Uma História descreve quem precisa fazer ou obter algo, qual o valor dessa ação e em quais condições o resultado pode ser verificado.

O modelo de `user-story-refinement.md` está incorporado nas seções 6, 9 e 10. Cada História inclui requisitos identificados, critérios BDD, rastreabilidade do texto original e insumos para a etapa de geração de tasks técnicas.

A História é uma entrega de valor pequena o suficiente para ter aceitação própria. Histórias de habilitação ou controle também são válidas quando existe um consumidor identificável, um resultado verificável e um vínculo com a Feature. O detalhamento fica no nível de comportamento e requisitos da História. Tarefas e desenho de implementação pertencem a etapas posteriores.

## 2. Seleção e entradas

### 2.1 Identificar a Feature

- Usar `selectedFeatureId`, um ID informado na conversa ou um título que identifique inequivocamente a escolha do usuário.
- Ao ler “desta Feature”, usar a referência inequívoca no contexto. Se faltar uma escolha ou houver mais de uma correspondência, pedir apenas a identificação da Feature, mostrando os IDs e títulos disponíveis quando possível.
- Aceitar uma Feature contida em lista `PROPOSTO` ou `APROVADO`. A seleção identifica o escopo da geração. A aprovação da lista de Histórias é uma decisão sobre a revisão desse resultado.

### 2.2 Ler a Feature e o contexto do Épico

A entrada canônica é o `featureDiscoveryPackage` do `02-criar-features.md` e o `selectedFeatureId`. Também é possível usar o Markdown de saída ou a especificação da Feature já identificada na conversa.

Localizar a Feature em `features[]` pelo `id`. Ler `refinement.scopeIncluded`, `refinement.scopeExcluded`, `refinement.behaviors`, `refinement.acceptanceConditions`, `refinement.businessRules`, dados, integrações, requisitos de qualidade, dependências, fontes e questões associadas. Usar `epicContext` para entender o valor e a fronteira do Épico. A Feature selecionada delimita as Histórias. Outros itens podem esclarecer dependências.

Usar `EPC-{epicSeq}-FTR-{featureSeq}` como formato canônico de Feature quando a cadeia for conhecida. Aceitar `FTR-EPC-{epicSeq}-{featureSeq}` como entrada legada e resolver a seleção pelo ID canônico ou original. Para a mesma Feature, `FTR-EPC-003-001` na origem se torna `EPC-003-FTR-001` na saída. Guardar o ID lido em `sourceFeatureId` e manter as referências relativas à Feature do pacote de origem. Preservar IDs personalizados que não possam ser convertidos sem ambiguidade. Se houver conflito com o `epicId` informado, registrar a divergência e preservar os vínculos confirmados.

Registrar `featureId` canônico, `sourceFeatureId` original, `epicId`, `sourcePackageId` e `sourceRevision` quando disponíveis. Comparar os IDs de origem e canônico ao recuperar a série anterior, para manter sua identidade. Se uma origem estiver ausente ou inconsistente, registrar a lacuna e manter apenas os vínculos sustentados. Se a Feature estiver identificada, mas os insumos forem insuficientes para especificar qualquer História, entregar a lista vazia como `PROPOSTO` e explicar o que falta.

### 2.3 Envelope de entrada

```json
{
  "selectedFeatureId": "EPC-003-FTR-001",
  "featureDiscoveryPackage": null,
  "selectedFeatureMarkdown": null,
  "additionalContext": [],
  "attachments": [],
  "inputText": null,
  "revisionRequest": {
    "previousPackage": null,
    "feedback": null,
    "focusStoryIds": []
  }
}
```

Usar `inputText` para a solicitação original e `attachments` para referências aos arquivos de apoio. Processar esses insumos juntamente com o pacote da Feature.

`previousPackage` é a revisão anterior das Histórias da mesma Feature. `focusStoryIds` indica por onde começar uma revisão. A entrega inclui a lista inteira.

## 3. Estados do resultado

Registrar o estado da revisão em `artifact.status` no JSON e em **Estado do resultado** no Markdown.

| Estado | Aplicação |
|---|---|
| `PROPOSTO` | Estado da lista completa, já refinada, na primeira geração e em toda regeneração. |
| `APROVADO` | Estado da revisão quando o usuário expressar aprovação explícita. Aplicar à revisão indicada ou à última revisão entregue para a Feature em questão. |

A aprovação atualiza o estado da mesma revisão em Markdown e JSON e preserva suas Histórias. A aprovação explícita do usuário é a condição para essa alteração. Lacunas de cobertura, premissas e questões em aberto são informações do resultado. Os itens individuais usam o estado da lista.

## 4. Geração e refinamento na mesma execução

1. **Interpretar a Feature.** Identificar os atores, o valor, os comportamentos, as condições de aceitação e as restrições aplicáveis.
2. **Propor recortes.** Agrupar comportamentos em entregas pequenas e verificáveis. Considerar cenários principais, exceções e variações relevantes de ator, regra ou jornada.
3. **Definir fronteiras.** Consolidar duplicidades, explicitar dependências e relacionar cada recorte a elementos da Feature.
4. **Refinar todas as Histórias.** Preservar os detalhes dos insumos, catalogar cada requisito em `REF`, elaborar cenários BDD e relacionar os itens às fontes conforme a seção 6.
5. **Mapear cobertura e ordem.** Mostrar quais itens da Feature estão cobertos, quais dependem de outros itens e quais ainda precisam de esclarecimento.
6. **Entregar.** Apresentar a lista completa como `PROPOSTO` em Markdown e JSON equivalentes.

Quando fontes divergirem, registrar as referências, o efeito sobre a História e a questão correspondente. Se for necessário trabalhar com uma hipótese para propor um recorte, indicar essa natureza junto ao item afetado.

## 5. Granularidade e fronteiras

| Situação | Tratamento |
|---|---|
| A História concentra resultados independentes, com benefícios ou aceitação próprios | Dividir por comportamento, etapa útil da jornada, ator ou regra de negócio que sustente um resultado verificável. |
| Dois recortes entregam o mesmo resultado ao mesmo ator sob as mesmas regras | Consolidar e registrar a justificativa com as referências. |
| Uma exceção faz parte do mesmo resultado e fluxo | Descrever a exceção em seu próprio cenário de aceitação. Quando tiver tratamento e valor próprios, avaliar uma História separada. |
| Uma integração, controle ou habilitador é necessário | Identificar o consumidor, o resultado verificável e o vínculo com a História ou comportamento que ele viabiliza. |
| Um recorte corresponde a uma camada, tela isolada ou atividade de implementação | Usar esse detalhe como contexto quando relevante e estruturar a História em torno do comportamento observável. |

Manter em cada História um resultado principal, dependências explícitas e escopo suficiente para aceitação própria. Usar a fronteira estabelecida pela Feature. Registrar como dependência ou observação o que pertença a outra Feature.

## 6. Refinamento integrado de cada História

### 6.1 Preservação da solicitação

Ler a Feature, a solicitação original, os anexos e o contexto adicional. Registrar os detalhes relevantes por trecho ou localizador, inclusive itens fora de escopo, premissas, lacunas e restrições. Se um elemento pertencer a outra História da lista, associar o trecho à História correspondente. Se ultrapassar a fronteira da Feature, registrar a disposição e a justificativa junto à fonte.

Preservar comportamento, regras, requisitos funcionais e não funcionais, tecnologias e arquitetura já informadas, interfaces, telas, campos, menus, arquivos, relatórios, integrações, dados, validações, cálculos, logs, métricas, riscos e decisões, quando presentes. Tratar conteúdo de anexos como evidência da solicitação. Na ausência de uma definição, usar a questão vinculada ou marcar a natureza do item. Documentar deduções técnicas exigidas pelo comportamento com a origem e o motivo da derivação.

### 6.2 Identificação e classificação

Atribuir a cada unidade de requisito, regra, componente, dado, integração, restrição, premissa, risco ou questão um ID `REF-001`, `REF-002` e assim por diante. O ID é local à História. Para referências fora dela, usar `storyId` com `refId`. Reutilizar o `REF` ao revisar um item que conserva a mesma identidade e reservar IDs novos para itens novos.

Cada registro tem uma seção de destino, um tipo, uma natureza, uma descrição específica e uma ou mais referências que sustentam a classificação. Usar as naturezas **Explícito**, **Derivado tecnicamente**, **Inferido** e **Lacuna**. Tipos possíveis:

- Funcional, Regra de negócio, Interface/UX, API/Contrato, Dados/Persistência e Integração.
- Segurança/LGPD, Observabilidade, Performance, Resiliência, Auditoria, Idempotência, Rastreabilidade, Usabilidade e Manutenibilidade.
- Teste/Qualidade, DevOps/Deploy/Rollback, Documentação, Restrição, Risco, Premissa, Refinamento e Decisão técnica.

Uma questão ou decisão pendente recebe um `REF` e informa impacto e `relatedRefIds` quando houver requisito afetado. O registro pode vincular o `QST` usado na visão da lista. Valores sem evidência ficam como lacuna ou hipótese claramente indicada.

### 6.3 Critérios BDD e cenários

Gerar critérios observáveis com **Dado**, **Quando** e **Então**. Cada cenário tem ID próprio, categoria **Principal**, **Alternativo** ou **Exceção**, `requirementRefs` e referências da origem. Cobrir os fluxos descritos nos insumos. Quando o resultado de um cenário for indeterminado, manter a lacuna com o requisito correspondente e detalhar o que é verificável.

O catálogo `requirements` concentra as especificações de negócio e técnicas. Os critérios verificam resultados e referenciam as especificações que exercitam. Dados de teste, limites e tempos seguem as fontes aplicáveis.

### 6.4 Origem, rastreabilidade e insumos para tasks

Para cada trecho relevante, conservar seu texto ou descrição fiel, localizador, disposição e referências de destino. A matriz consolidada mostra ID, tipo, descrição, natureza, origem e critérios associados. Projetar essa matriz dos registros e dos vínculos BDD para evitar duplicação inconsistente.

Consolidar, por categoria, os `REF` e os critérios que uma etapa posterior pode usar para extrair tasks. Abranger requisitos, regras, critérios, componentes, dados, integrações, requisitos não funcionais e riscos ou decisões. Essa saída documenta insumos de requisitos, sem código, tasks técnicas, plano de implementação ou arquitetura de solução inventada.

## 7. Cobertura e ordem sugerida

Relacionar os comportamentos, regras, condições de aceitação e requisitos de qualidade relevantes da Feature às Histórias que os realizam. Para um elemento sem História associada, explicar se depende de outra entrega, está fora do recorte ou precisa de evidência adicional.

A ordem proposta considera dependências, valor e redução de risco. Justificar dependências e decisões de precedência. Se houver dependência circular ou ordem indefinida, registrá-la como questão. Em Markdown, apresentar a matriz de cobertura com referência à Feature, IDs das Histórias e razão ou questão vinculada.

## 8. Regeneração, IDs e histórico

- Com “gere novamente”, feedback ou pedido de ajuste, ler a revisão anterior da mesma Feature e começar pelo recorte indicado. Para feedback genérico, revisar fronteiras, cenários, lacunas e cobertura.
- Preservar o ID quando ator ou consumidor, resultado e fronteira principal mantiverem a identidade da História. Reusar o padrão existente, inclusive IDs legados como `HST`. Para uma nova História, usar `{featureId}-US-{NNN}`, como `EPC-003-FTR-001-US-001`. Preservar IDs já emitidos ao regenerar, incluindo versões com `US-` no início. Atribuir novos IDs quando uma divisão ou consolidação produzir unidades de valor distintas.
- Refinar as Histórias novas ou alteradas, carregar novamente as demais e atualizar cobertura, ordem, vínculos e dependências afetados.
- Na primeira entrega, atribuir um `packageId` com prefixo `SDP`, usar `revision: 1` e `previousRevision: null`. Reaproveitar o `correlationId` de origem quando conhecido. Em regenerações, manter os identificadores da série, incrementar `revision` e registrar `previousRevision`.
- Registrar mudanças em `changes` com tipos `ADDED`, `UPDATED`, `SPLIT`, `MERGED` ou `REMOVED`, IDs de origem e destino, justificativa e fontes. Se a revisão anterior estiver indisponível, registrar o limite da comparação. Se a revisão puder ser comparada e não houver mudança material sustentada, explicar o que foi revisto e usar `changes: []`.
- Entregar a nova revisão inteira como `PROPOSTO`. Regenerar preserva o estado da revisão anterior. A troca da Feature inicia ou recupera a série referente à nova Feature.

## 9. Visão em Markdown

Abrir com identificação da Feature e do Épico, revisão da lista e **Estado do resultado**. Para cada História, usar a estrutura abaixo, mantendo a numeração e omitindo seções opcionais sem conteúdo aplicável. Ao final da lista, apresentar cobertura da Feature, ordem sugerida, questões transversais e histórico da revisão quando disponíveis.

| Seção | Conteúdo |
|---|---|
| 1. Título | Título orientado a resultado e ID da História. |
| 2. Contexto | Situação original, Feature e motivo da solicitação. |
| 3. Problema | Necessidade que a História resolve. |
| 4. Persona | Ator ou consumidor. Sinalizar inferência quando aplicável. |
| 5. História de usuário | Como [persona], quero [capacidade], para [benefício]. |
| 6. Objetivo funcional | Resultado funcional esperado. |
| 7. Escopo funcional | Comportamentos e resultados com IDs `REF`, natureza e origem. |
| 8. Fora de escopo | Exclusões, com origem e vínculo quando aplicável. |
| 9. Premissas | Premissas com IDs `REF`, natureza e origem. |
| 10. Requisitos técnicos | Restrições, tecnologias e especificações técnicas sustentadas, com IDs `REF`. |
| 11. Componentes esperados | ID, componente, tipo, responsabilidade e origem. |
| 12. Regras de negócio | Regras, validações, condições e cálculos com IDs `REF`. |
| 13. Critérios de aceite em BDD | ID do cenário, requisitos relacionados e Dado / Quando / Então. |
| 14. Cenários principais | Fluxos principais com referências aos critérios correspondentes. |
| 15. Cenários alternativos | Variações válidas com referências aos critérios correspondentes. |
| 16. Cenários de exceção | Erros, bloqueios ou falhas previstos, com referências aos critérios. |
| 17. Requisitos não funcionais | Agrupar por tipo aplicável e indicar IDs `REF` e métricas informadas. |
| 18. Dados envolvidos | ID, dado, tipo, obrigatoriedade, validação, origem, destino e observações. |
| 19. Integrações envolvidas | ID, integração, tipo, entrada, saída, responsabilidade e falhas previstas. |
| 20. Restrições | ID, descrição, tipo e origem. |
| 21. Riscos | ID, impacto, mitigação sugerida e requisitos relacionados. |
| 22. Questões em aberto | ID, questão, impacto, tipo e requisitos relacionados. |
| 23. Escopo preservado da solicitação original | Lista fiel dos elementos de origem e suas disposições. |
| 24. Rastreabilidade do texto original | Trecho ou referência, IDs de destino, seção e observação. |
| 25. Matriz consolidada de requisitos refinados | ID, tipo, descrição, natureza, origem e critérios associados. |
| 26. Insumos consolidados para geração de tasks técnicas | Referências aos requisitos, regras, critérios, componentes, dados, integrações, requisitos não funcionais, riscos e questões aplicáveis. |
| 27. Conferência final de refinamento | Contagens por grupo, resumo da cobertura dos insumos e disponibilidade da seção 26. |

A seção 27 é informativa. Contar os IDs `REF` distintos, controles por seção, critérios BDD e questões. Indicar os trechos preservados e explicitar os que permanecem como lacuna, bem como que a entrega contém insumos de requisitos para a próxima etapa. Questões e lacunas acompanham o resultado em ambos os estados. Omitir subseções vazias e evitar marcadores como “N/A” e “Nenhum”.

## 10. Contrato `storyDiscoveryPackage`

O contrato integrado usa `schemaVersion: 3.0.0`. `artifact.status` representa o estado da lista. `featureContext` preserva a origem. `stories[].refinement` contém o detalhamento de cada História.

### 10.1 Envelope de saída

```json
{
  "schemaVersion": "3.0.0",
  "artifact": {
    "packageId": null,
    "version": "2.0.0",
    "status": "PROPOSTO",
    "revision": 1,
    "previousRevision": null,
    "correlationId": null,
    "language": "pt-BR"
  },
  "featureContext": {
    "featureId": "EPC-003-FTR-001",
    "sourceFeatureId": "FTR-EPC-003-001",
    "epicId": "EPC-003",
    "title": null,
    "sourcePackageId": null,
    "sourceRevision": null,
    "scopeIncluded": [],
    "scopeExcluded": [],
    "originRefs": [],
    "sourceIds": []
  },
  "sources": [],
  "questions": [],
  "stories": [],
  "coverage": [],
  "dependencies": [],
  "prioritization": [],
  "changes": [],
  "revisionSummary": null
}
```

### 10.2 Elemento de `stories`

A seguir, uma amostra mínima do registro de História. Para a projeção completa das 27 seções, ver o exemplo `03-exemplo-historia-refinada.md`. `sourceRefs[].ref` resolve para a evidência preservada em `originalScope`, para uma fonte do pacote ou para uma referência de `featureContext.originRefs`.

```json
{
  "id": "EPC-003-FTR-001-US-001",
  "featureId": "EPC-003-FTR-001",
  "epicId": "EPC-003",
  "title": "Consultar a conclusão da primeira ação de valor",
  "statement": {
    "actor": "Participante em ativação",
    "need": "Consultar se concluí a primeira ação de valor",
    "benefit": "Saber se cumpri a ação inicial da minha ativação"
  },
  "featureRefs": ["refinement.acceptanceConditions[0]"],
  "sourceIds": ["SRC-001"],
  "refinement": {
    "context": "O participante consulta seu progresso de ativação.",
    "problem": "O participante precisa confirmar se concluiu a primeira ação de valor.",
    "personaNature": "Explícito",
    "functionalObjective": "Exibir a conclusão da ação inicial válida.",
    "scopeIncluded": ["Consultar o próprio progresso."],
    "scopeExcluded": [],
    "requirements": [
      {
        "id": "REF-001",
        "section": 7,
        "type": "Funcional",
        "nature": "Explícito",
        "description": "Exibir como concluída a primeira ação válida no próprio progresso.",
        "sourceRefs": [{"ref": "ORIG-001", "locator": "Item 1 da solicitação"}],
        "relatedRefIds": [],
        "details": {}
      }
    ],
    "acceptanceCriteria": [
      {
        "id": "AC-01",
        "kind": "Principal",
        "name": "Exibir a ação válida concluída",
        "given": ["A primeira ação do participante foi concluída e reconhecida como válida."],
        "when": "O participante consulta o próprio progresso.",
        "then": ["A ação aparece como concluída."],
        "requirementRefs": ["REF-001"],
        "featureRefs": ["refinement.acceptanceConditions[0]"],
        "sourceIds": ["SRC-001"]
      }
    ],
    "originalScope": [
      {
        "id": "ORIG-001",
        "sourceId": "SRC-001",
        "locator": "Item 1 da solicitação",
        "text": "Exibir como concluída a primeira ação válida no próprio progresso.",
        "disposition": "Escopo funcional"
      }
    ],
    "traceability": [
      {"originalRef": "ORIG-001", "requirementRefs": ["REF-001"], "targetSections": [7, 13]}
    ],
    "downstreamInputs": [
      {"category": "Requisitos", "requirementRefs": ["REF-001"], "acceptanceCriteriaIds": ["AC-01"]}
    ],
    "dependencyIds": [],
    "openQuestionIds": []
  }
}
```

### 10.3 Referências complementares

| Campo | Estrutura e uso |
|---|---|
| `featureContext.originRefs[]` | `{ ref, summary, sourceIds }`. Usar o ID upstream quando disponível. Sem ID, usar o caminho relativo à Feature na revisão de origem, com índices começando em zero. |
| `sources[]` | `{ id, title, locator }`. Reutilizar IDs de fonte confirmados. |
| `questions[]` | `{ id, description, impact, storyIds, sourceIds }`. `storyIds` pode ficar vazio em uma questão que afete a Feature inteira. |
| `coverage[]` | `{ featureRef, storyIds, rationale, openQuestionIds }`. Usar `storyIds: []` quando a cobertura ainda não tiver sido estabelecida. |
| `dependencies[]` | `{ id, fromStoryId, target, rationale, sourceIds }`. `target` identifica a História, Feature ou outro item de que a História depende. |
| `prioritization[]` | `{ storyId, order, rationale }`. Usar `order: null` quando a evidência for insuficiente para sugerir a posição. |
| `changes[]` | `{ type, previousStoryIds, currentStoryIds, rationale, sourceIds }`. IDs anteriores referenciam a revisão de origem. |

`requirements[].section` identifica a subseção primária do catálogo, conforme a seção 9. Em `details`, registrar atributos específicos quando aplicáveis: componente e responsabilidade na seção 11; dado, tipo, obrigatoriedade, validação, origem e destino na 18; entrada, saída, responsabilidade e falhas na 19; impacto e mitigação na 21; impacto e natureza da decisão na 22. Os cenários 14 a 16 projetam `acceptanceCriteria` por `kind`. A matriz 25 e a conferência 27 são calculadas a partir do catálogo e dos critérios, sem criar registros duplicados.

`traceability` pode apontar para seções de contexto, persona ou exclusões sem requisito resultante, usando `requirementRefs: []` e indicando a disposição. `downstreamInputs` agrupa referências do catálogo e dos cenários nas categorias da seção 26. Em `questions[]`, acrescentar `requirementRefs` com objetos `{ storyId, refId }` quando os itens afetados forem conhecidos.

IDs de História são únicos no pacote. IDs de critérios são únicos dentro da História. Preservar `featureId` e `epicId` de `featureContext` em todas as Histórias, com `null` para o Épico quando desconhecido. Resolver `featureRefs`, fontes, dependências e questões nas coleções correspondentes. Caminhos posicionais são específicos da revisão da Feature e devem ser reconciliados quando a origem mudar.

## 11. Cenários de uso

| Pedido ou situação | Entrega |
|---|---|
| “Crie as Histórias da EPC-003-FTR-001” | Selecionar a Feature, gerar e refinar todas as suas Histórias e entregar a revisão `PROPOSTO`. |
| A Feature tem uma regra ainda indefinida | Entregar os cenários sustentados e registrar a questão nas Histórias afetadas. |
| “Gere novamente incluindo o fluxo alternativo descrito” | Incorporar o fluxo, atualizar cenários e cobertura e entregar a nova revisão inteira como `PROPOSTO`. |
| “Aprovo a revisão 2” | Registrar `APROVADO` em Markdown e JSON para a revisão 2. Uma regeneração futura começa em `PROPOSTO`. |

## 12. Instrução de execução

Use a Feature escolhida como raiz. Descubra as Histórias, refine todas e entregue a lista completa como `PROPOSTO`. Registre `APROVADO` quando o usuário aprovar a revisão explicitamente. Se houver pedido de regeneração, use as evidências e o feedback disponível para entregar outra revisão completa em `PROPOSTO`, com critérios de aceitação vinculados aos `REF`, questões em aberto, insumos para a próxima etapa e histórico de mudanças.
