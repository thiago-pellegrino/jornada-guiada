---
id: 00-plano-de-adequacao-e-evolucao
tipo: plano
versão: 1.2.0
data: 2026-11-18
---

# Plano de adequação e evolução das especificações

## 1. Objetivo

Adequar as especificações da plataforma Jornada Guiada às três fases (Contexto, DarkLab, Backlog do Futuro), com um arquivo de capacidade por etapa pronto para a IA executar, um Modo Turbo por fase e um repositório único que dá a cada fase acesso a todo o Upstream. As especificações são genéricas: o caso usado como exemplo do DarkLab serve só para teste e fica em `testes/`. A versão 1.0 está preservada em `_arquivo/2026-11-18-antes-da-revisao/`.

Situação em 18/11/2026: ondas 0 a 6 executadas, exceto o teste ponta a ponta, que depende de um executor das capacidades (seção 5). O catálogo tem 28 arquivos e passa no validador sem erros.

A jornada segue o fluxo **Contexto → DarkLab → Projeto → Backlog** (decisão D9): o projeto é criado no Contexto e é o identificador principal de todas as etapas.

## 2. Diagnóstico e correções aplicadas

### 2.1 Inconsistências

| # | Inconsistência encontrada | Correção aplicada | Onde ficou |
|---|---|---|---|
| 1 | Legados usavam estados `PROPOSTO`/`APROVADO`, contrariando o RF-010. | Estados de execução separados do estado de revisão humana (não revisado / revisado / aceito), que nunca bloqueia; `PROPOSTO`→`não revisado`, `APROVADO`→`aceito`. | [contrato §5](00-contrato-comum-das-capacidades.md#5-estados); RF-010 em [especificação §3](especificacao-plataforma-jornada-guiada.md#3-requisitos-funcionais) |
| 2 | Prefixos `01`–`04` dos legados colidiam com a numeração das fases. | Legados movidos para `referencias/legado-0N-*.md`; numeração de fase com 3 dígitos e `000` = visão. | `referencias/`; [contrato §1](00-contrato-comum-das-capacidades.md#1-fases-nomes-e-numeração) |
| 3 | Adaptados diziam "adaptado de…" sem dizer o que do legado valia. | As capacidades 03-backlog-do-futuro-001 a 004 incorporam explicitamente taxonomias, fórmula de prioridade e estruturas de 21/27 seções, com mapeamento seção → campo. | [03-backlog-do-futuro-000](03-backlog-do-futuro-000-visao-e-contrato-da-fase.md) e 001–004 |
| 4 | `schemaVersion` divergente (3.0.0, 2.0.0, 1.0.0) e conflitos internos nos legados 02 e 03. | Todas as capacidades e schemas começam em `1.0.0` (SemVer). | [contrato §6](00-contrato-comum-das-capacidades.md#6-envelope-único-de-saída) |
| 5 | Dois envelopes de saída diferentes (legado `{schemaVersion, artifact,…}` × plataforma). | Envelope único `{schemaVersion, capabilityId, runId, projectId, revision, generatedAt, inputsSnapshot, summary, evidenceRefs, gaps, conflicts, coverage, data}` com JSON Schema. | [contrato §6–6.1](00-contrato-comum-das-capacidades.md#61-json-schema-do-envelope-draft-2020-12) |
| 6 | Formato de ID de Feature conflitante (`FTR-{epic}-NNN` × `EPC-003-FTR-001`). | Canônico único `EPC-NNN-FTR-NNN`; formatos alternativos proibidos. | [contrato §2.1](00-contrato-comum-das-capacidades.md#21-formato) |
| 7 | Task `{storyId}-TSK-NNN` × `TSK-NNN`. | Canônico `EPC-NNN-FTR-NNN-US-NNN-TSK-NNN`. | [contrato §2.1](00-contrato-comum-das-capacidades.md#21-formato) |
| 8 | Critérios com 2 dígitos (`AC-NN`). | `AC-NNN` (3 dígitos) em tudo. | [contrato §2.1](00-contrato-comum-das-capacidades.md#21-formato) |
| 9 | Quatro taxonomias de natureza sem correspondência. | Natureza única de 4 valores + tabela de correspondência (inclui `Ambíguo` → `inferido` com gap). | [contrato §3–3.1](00-contrato-comum-das-capacidades.md#31-correspondência-com-taxonomias-legadas) |
| 10 | Disposições: 10 códigos em inglês × 9 termos em português, perdendo `MAPPED_TO_CONTEXT`/`CONTEXT_ONLY`. | Conjunto único de 10 códigos em português com a distinção preservada. | [contrato §4](00-contrato-comum-das-capacidades.md#4-disposições) |
| 11 | `coverage`/`coverageMatrix` como objeto ou array e colisão com `data.coverage`. | `coverage` sempre objeto e só no envelope; matriz em `data.coverageMatrix`. | [contrato §6](00-contrato-comum-das-capacidades.md#6-envelope-único-de-saída) |
| 12 | Turbo do Contexto impedia dependências declaradas (jornadas consumindo hipóteses em paralelo; blueprint sem ciclo de vida). | Grafo corrigido com consolidação (002) e dependências do frontmatter alinhadas ao Turbo. | [01-contexto-011](01-contexto-011-modo-turbo.md); [especificação §4.1](especificacao-plataforma-jornada-guiada.md#41-modos-turbo) |
| 13 | Legado de Épicos proibia "definir arquitetura" enquanto Contexto e DarkLab geram arquitetura. | A proibição passa a valer só para a IA de Épicos (não decide arquitetura; consome a arquitetura do Contexto como insumo `proposta`). | [03-backlog-do-futuro-001](03-backlog-do-futuro-001-gerar-epicos.md) |
| 14 | O caso usado como referência estava implementado como 5 capacidades fixas com regras de domínio. | Na 1.1 virou perfil de protocolo; na 1.2 o perfil saiu do catálogo e o caso ficou só como teste (D1). Os motores herdaram do caso apenas a forma de apresentar resultados (estrutura comum). | [02-darklab-000 §5.5](02-darklab-000-visao-e-contrato-da-fase.md#55-estrutura-comum-da-saída-dos-motores); `testes/` |
| 15 | `turboRunManifest` com campos diferentes em três capacidades. | Schema único com `phaseOptions` (`batchId`, `levelCounts`). | [contrato §11](00-contrato-comum-das-capacidades.md#11-manifesto-do-modo-turbo-turborunmanifest) |
| 16 | Grafias variantes do nome da fase 02 e títulos divergentes do catálogo. | "DarkLab" único; títulos do catálogo iguais aos títulos dos arquivos. | todos os arquivos; [especificação §9](especificacao-plataforma-jornada-guiada.md#9-catálogo-de-capacidades) |

### 2.2 Lacunas

| Lacuna | Correção aplicada | Onde ficou |
|---|---|---|
| Sem JSON Schema formal para `data`. | Cada capacidade define schema draft 2020-12 com `$ref` aos `$defs` comuns. | cada arquivo de capacidade, seção "Saída" |
| Arquivos citados inexistentes (`03-exemplo-historia-refinada.md`, `user-story-refinement.md`, `task-generation.md`, link privado do ChatGPT). | Nenhuma capacidade nova as cita; exemplos próprios incluídos; os legados em `referencias/` receberam aviso no topo indicando que essas referências são inexistentes e devem ser ignoradas. | 03-backlog-do-futuro-003 e 004; `referencias/legado-0N-*.md` |
| API sem cancelar, comparar revisões, árvore do backlog, listar lotes, exportar, retenção. | Endpoints adicionados. | [especificação §5.1](especificacao-plataforma-jornada-guiada.md#51-api-de-referência) |
| Limites, SLO e P95 não quantificados. | Valores propostos (marcados como proposta). | [especificação §7.1](especificacao-plataforma-jornada-guiada.md#71-limites-e-slos-proposta--calibrar-com-corpus-de-teste-antes-da-implantação) |
| Prompts não definidos. | Prompt de sistema pronto em cada capacidade. | seção "Instruções para a IA" |
| Identidade entre revisões não definida. | Regra de correspondência por título normalizado + pai, `changeType`, IDs nunca reaproveitados. | [contrato §2.3](00-contrato-comum-das-capacidades.md#23-identidade-estável-entre-revisões) |
| "Recorte" indefinido. | Recorte definido (projeto, jornada, objetivo, oportunidade do M7, lista explícita). | [03-backlog-do-futuro-000](03-backlog-do-futuro-000-visao-e-contrato-da-fase.md) |
| Quem marca uma revisão como aceita. | Papel Aprovador (ou Administrador); Editor marca só `revisado` (D5). | [contrato §5.2](00-contrato-comum-das-capacidades.md#52-estado-de-revisão-humana-editorial); [especificação §2](especificacao-plataforma-jornada-guiada.md#2-papéis-e-permissões) |
| Formato do Ishikawa. | JSON fixo 6M, renderizado em SVG ou Mermaid mindmap. | [contrato §8](00-contrato-comum-das-capacidades.md#8-renderização); [01-contexto-005](01-contexto-005-gerar-diagrama-de-ishikawa.md) |
| Fórmula de prioridade do legado sem aplicação nos adaptados. | Fórmula incorporada à geração de Épicos. | [03-backlog-do-futuro-001](03-backlog-do-futuro-001-gerar-epicos.md) |
| Permissões do Administrador e de cancelar/reexecutar Turbo. | Tabela de papéis completa. | [especificação §2](especificacao-plataforma-jornada-guiada.md#2-papéis-e-permissões); [repositório §4](00-repositorio-unico-de-artefatos.md#4-acesso-por-papel) |
| Repositório compartilhado descrito só em alto nível. | Estrutura lógica, manifesto do índice, Azure, versionamento e retenção. | [00-repositorio-unico-de-artefatos.md](00-repositorio-unico-de-artefatos.md) |
| Sem etapa de consolidação entre análise por arquivo e artefatos derivados. | Nova capacidade 01-contexto-002 com gatilho "todos os artefatos processados". | [01-contexto-002](01-contexto-002-consolidar-contexto.md) |
| Motores do DarkLab sem situação do trabalho do projeto. | Blocos comuns em todo motor: atividades, entregáveis com status segundo as fontes, ecossistema e ressalva de leitura. | [02-darklab-000 §5.5](02-darklab-000-visao-e-contrato-da-fase.md#55-estrutura-comum-da-saída-dos-motores) |
| Análise de artefato sem tratamento de dado pessoal. | `personalDataFindings` com categoria e marca de dado sensível; o dado nunca é reproduzido. | [01-contexto-001](01-contexto-001-analisar-e-enriquecer-artefato.md) |
| Hipóteses sem tipo de risco. | `hypothesisType`: desejabilidade, viabilidade, praticabilidade, valor. | [01-contexto-006](01-contexto-006-analisar-hipoteses.md) |
| Arquitetura sem requisitos não funcionais organizados. | `wellArchitectedReview` com os 5 pilares do Azure Well-Architected. | [01-contexto-008](01-contexto-008-desenhar-arquitetura-de-solucao-azure.md) |
| Catálogo sem verificação automática. | `scripts/validar-catalogo.mjs` e rubrica de qualidade. | [contrato §12–13](00-contrato-comum-das-capacidades.md#12-rubrica-de-qualidade-de-uma-capacidade) |

## 3. Decisões

### 3.1 Aprovadas em 18/11/2026 (revisão 1.2)

| ID | Decisão | Resultado |
|---|---|---|
| D1 | Estrutura do DarkLab | 7 motores genéricos + Modo Turbo (008). Sem perfil de protocolo; o caso de exemplo fica fora das especificações e serve só de teste. |
| D2 | Gatilho dos oito resultados do Contexto | Etapa explícita 002 Consolidar contexto; 003–010 só depois dela. |
| D3 | Formato dos diagramas | Mermaid para jornadas, ciclo de vida, sequência e arquitetura; JSON renderizado pela aplicação para Ishikawa, blueprint e wireframes. A IA sempre entrega o JSON. |
| D4 | Fidelidade dos wireframes | Baixa fidelidade em JSON de layout, com componentes nomeados conforme o design system do portal. |
| D5 | Revisão humana | Nunca bloqueia execução nem consumo (RF-010). Novo papel Aprovador: só ele (ou o Administrador) marca `aceito`. |
| D6 | Insumos do Backlog do Futuro | Contexto obrigatório; DarkLab (M3, M4, M7) usado quando existir, com `GAP` quando faltar. |
| D7 | Tamanho dos prompts do backlog | Regras normativas completas na capacidade; limite de 200 mil tokens conferido pelo validador. |
| D8 | Idioma das chaves JSON | Chaves em inglês camelCase; valores e telas em português. |
| D9 | Fluxo da jornada e papel do projeto | **Contexto → DarkLab → Projeto → Backlog.** O projeto é criado no Contexto (`POST /projects`, `projectId` imutável e código `PRJ-NNN`) e é o identificador principal de todas as etapas. O DarkLab define o projeto na nova capacidade `02-darklab-008-consolidar-ficha-do-projeto`; o Turbo do DarkLab volta a 009 e termina na ficha. O Backlog do Futuro exige a etapa `projeto_definido`. Etapas do projeto no contrato §5.3; `projeto.json` no repositório §8; página Projetos no RF-011. |

### 3.2 Tomadas na revisão 1.1 e mantidas

1. O estado agregado `partial` existe só no manifesto Turbo; os nós usam os 6 estados do contrato.
2. `DERIVED_DIRECTLY` e "Derivado tecnicamente" mapeiam para `inferido` com `rationale` obrigatório; `FORMAL_DECISION` e `APPROVED_BASELINE` mapeiam para `documentado`.
3. A IA pode propor correspondência semântica de IDs, aceita só com mesmo pai e evidência compartilhada.
4. `capabilityId` = nome do arquivo sem extensão.
5. Limites, SLO e retenção são **propostas** a calibrar.
6. Editor cancela e retoma só as próprias execuções; Administrador, todas.
7. Reserva de números `scope.idBlocks` para todas as fases ([contrato §7.1](00-contrato-comum-das-capacidades.md#71-reserva-de-números-scopeidblocks)).
8. Registro único de prefixos no contrato §2.1.
9. Saída reaproveitada em retomada é `succeeded` com `attempts: 0`.
10. Requisitos funcionais numerados `RF-001`…`RF-010`.
11. Contexto fora do Turbo: só a 002 é obrigatória (mais 003 para 004 e 007); no Turbo, toda aresta é obrigatória.
12. DarkLab no Turbo: cadeia M1→M7 estrita.
13. Backlog: lista de Épicos é uma série única por projeto; cada item `FBK` do M7 vira candidato a Épico com disposição.
14. O modelo de arquivo mantém 11 seções após o frontmatter; a regeneração é descrita dentro de "Passo a passo" ou "Tratamento de falhas e lacunas" (contrato §9).

### 3.3 Em aberto

1. Confirmar limites e SLOs propostos (§7.1 da especificação) e o orçamento padrão por Turbo.
2. Confirmar prazos de retenção (180 dias para tentativas, 30 dias de soft delete).
3. Definir se `aceito` deve ser exigido para **exportação** (hoje não é).
4. Formato padrão de exportação (ZIP de Markdown, JSON, PDF).
5. Modelo do Azure OpenAI por capacidade (custo × qualidade).
6. Manter a cadeia estrita do Turbo do DarkLab ou permitir seguir com lacunas.
7. Validar os prefixos complementares do contrato §2.1 ou reduzir a lista.

## 4. Ondas executadas

| Onda | Entregas | Situação |
|---|---|---|
| 0 · Decisões | D1–D8 (seção 3.1) | Concluída |
| 1 · Fundação | Contrato 1.1 (papel Aprovador, rubrica §12, validação §13, sem perfil), repositório 1.1 (acesso ao Upstream §7), especificação 1.2, três arquivos 000, `scripts/validar-catalogo.mjs`, `testes/` | Concluída |
| 2 · Contexto | 001–011; acréscimos da 1.2: dados pessoais (001), tipo de hipótese (006), Well-Architected (008), seções do Turbo (011) | Concluída |
| 3 · DarkLab | Motores 1–7 com estrutura comum; Turbo renumerado para 008; perfil de protocolo retirado | Concluída |
| 4 · Backlog do Futuro | 001–005 com o conteúdo das skills legadas; perfil retirado do Turbo | Concluída |
| 5 · Fechamento | Validador sem erros; kit de teste com gabarito; arquivos retirados marcados `status: obsoleto` e `scripts/limpar-obsoletos.ps1` | Concluída, exceto o teste ponta a ponta (seção 5) |
| 6 · Projeto como identificador (especificação 1.3) | Contrato 1.2 (§5.3 etapa do projeto, código `PRJ`), repositório 1.2 (`projeto.json`, §8), especificação 1.3 (RF-001, RF-011, rotas `/projects`, página Projetos), capacidade 008 da ficha do projeto, Turbo do DarkLab 009, Backlog 000/001/005 exigindo projeto definido, Contexto 000/001/011 com a criação do projeto | Concluída |

## 5. Qualificação

- **Rubrica** ([contrato §12](00-contrato-comum-das-capacidades.md#12-rubrica-de-qualidade-de-uma-capacidade)): seis dimensões de 0 a 2; aprova com soma ≥ 10 e nenhuma dimensão 0.
- **Validador** ([contrato §13](00-contrato-comum-das-capacidades.md#13-validação-automática-do-catálogo)): `npm install` e `npm run validar:especificacoes` na raiz. Compila os schemas, valida os exemplos mínimos contra envelope + schema, confere dependências, numeração, Turbos, links, âncoras, termos de casos de teste e grafia.
- **Teste ponta a ponta**: roteiro de teste do caso em `testes/`, com os cenários do §8 da especificação mais os de projeto e conferência do DarkLab contra o gabarito extraído do HTML do caso. Pendente: precisa do corpus do caso (pasta `corpus/` do kit) e de um executor das capacidades. As saídas aprovadas irão para a pasta `esperado/` do kit.

## 6. Mapa arquivo antigo → arquivo novo

| Arquivo antigo | Arquivo novo |
|---|---|
| `especificacao-plataforma-jornada-guiada.md` (v1.0 e v1.1) | `especificacao-plataforma-jornada-guiada.md` (v1.2) |
| — | `00-contrato-comum-das-capacidades.md`, `00-repositorio-unico-de-artefatos.md`, `00-plano-de-adequacao-e-evolucao.md` |
| — | `01-contexto-000-visao-e-contrato-da-fase.md` |
| `01-contexto-001-analisar-e-enriquecer-arquivo.md` | `01-contexto-001-analisar-e-enriquecer-artefato.md` |
| — (novo) | `01-contexto-002-consolidar-contexto.md` |
| `01-contexto-002-mapear-jornadas-as-is-to-be.md` | `01-contexto-003-mapear-jornadas-as-is-e-to-be.md` |
| `01-contexto-003-mapear-ciclos-de-vida.md` | `01-contexto-004-mapear-ciclo-de-vida-das-jornadas-e-assuntos.md` |
| `01-contexto-004-gerar-ishikawa.md` | `01-contexto-005-gerar-diagrama-de-ishikawa.md` |
| `01-contexto-005-analisar-hipoteses.md` | `01-contexto-006-analisar-hipoteses.md` |
| `01-contexto-006-gerar-blueprint-to-be.md` | `01-contexto-007-gerar-blueprint-da-solucao-to-be.md` |
| `01-contexto-007-gerar-arquitetura-azure.md` | `01-contexto-008-desenhar-arquitetura-de-solucao-azure.md` |
| `01-contexto-008-gerar-sequencias-funcionais.md` | `01-contexto-009-gerar-diagramas-de-sequencia.md` |
| `01-contexto-009-propor-wireframes.md` | `01-contexto-010-propor-wireframes.md` |
| `01-contexto-010-modo-turbo.md` | `01-contexto-011-modo-turbo.md` |
| — | `02-darklab-000-visao-e-contrato-da-fase.md` |
| `02-darklab-001` a `007` (motores) | `02-darklab-001-motor-1-…` a `02-darklab-007-motor-7-…` |
| `02-darklab-008` a `012` (etapas do caso) e `02-darklab-008-aplicar-perfil-de-protocolo.md` (v1.1) | — (retirados; conteúdo em `testes/`) |
| `02-darklab-013-modo-turbo.md` e `02-darklab-008-modo-turbo.md` (v1.2, retirado) | `02-darklab-009-modo-turbo.md` |
| — (novo na 1.3) | `02-darklab-008-consolidar-ficha-do-projeto.md` |
| — | `03-backlog-do-futuro-000-visao-e-contrato-da-fase.md` |
| `03-backlog-do-futuro-001-criar-epicos.md` + `01-criar-epicos.md` | `03-backlog-do-futuro-001-gerar-epicos.md` (legado em `referencias/legado-01-criar-epicos.md`) |
| `03-backlog-do-futuro-002-criar-features.md` + `02-criar-features.md` | `03-backlog-do-futuro-002-gerar-features-do-epico.md` (legado em `referencias/legado-02-criar-features.md`) |
| `03-backlog-do-futuro-003-criar-historias.md` + `03-criar-historias.md` | `03-backlog-do-futuro-003-gerar-historias-da-feature.md` (legado em `referencias/legado-03-criar-historias.md`) |
| `03-backlog-do-futuro-004-criar-o-que-fazer.md` + `04-criar-o-que-fazer.md` | `03-backlog-do-futuro-004-detalhar-o-que-deve-ser-feito.md` (legado em `referencias/legado-04-criar-o-que-fazer.md`) |
| `03-backlog-do-futuro-005-modo-turbo.md` | `03-backlog-do-futuro-005-modo-turbo.md` (reescrito) |
| HTML do caso na raiz do repositório | gabarito do kit de teste em `testes/` |

## 7. Próximos passos

1. Rodar `scripts/limpar-obsoletos.ps1 -Aplicar` para apagar os arquivos marcados como obsoletos e o HTML duplicado da raiz.
2. Colocar o corpus do caso na pasta `corpus/` do kit em `testes/` e executar o roteiro de teste assim que houver um executor das capacidades.
3. Responder às decisões em aberto (seção 3.3).
4. Implementar no app (`roadmap-react`), seguindo a navegação Contexto → DarkLab → Projetos → Backlog do Futuro que o mosaico já tem: as quatro abas ainda têm só textos fixos. Ordem sugerida: criação e seleção de projeto (Contexto) e a página Projetos com portfólio e etapa; Fontes e artefatos e Execuções; Contexto (upload, 001, 002, cartões 003–010); DarkLab em duas faixas com o painel "Andamento no projeto" e o cartão da ficha; árvore do Backlog com ações por nó e a ponte para o simulador de capacidade.
5. Construir o backend de referência (API §5.1, repositório único, workers, Turbo) e calibrar limites e custos com o corpus de teste.
