---
id: 00-repositorio-unico-de-artefatos
tipo: contrato
versão: 1.2.0
schemaVersion: 1.0.0
data: 2026-11-18
---

# Repositório único de artefatos

Cada projeto tem **um único espaço lógico**, compartilhado pelas três fases (Contexto, DarkLab, Backlog do Futuro). Toda capacidade lê todo o Upstream autorizado desse espaço e grava nele suas saídas. Convenções de IDs, natureza e envelope estão no [contrato comum](00-contrato-comum-das-capacidades.md).

## 1. Estrutura lógica

URIs internas usam o esquema `repo://projetos/{projectId}/...`. Os caminhos são **chaves internas** (IDs e revisões), nunca derivados do nome do arquivo enviado.

```text
projetos/{projectId}/
├── projeto.json                        # identidade e etapa do projeto (seção 8), criada no Contexto
├── fontes/
│   └── {SRC-NNN}/
│       └── r{n}/
│           ├── original.bin            # arquivo enviado (imutável)
│           ├── metadados.json          # nome original, tipo verificado, hash, tamanho, quem enviou
│           ├── extracao.json           # unidades extraídas com localizadores (páginas, abas, slides)
│           └── analise.json            # saída de 01-contexto-001 (envelope)
├── lotes/
│   └── {batchId}.json                  # versões das fontes que compõem o lote
├── contexto/
│   └── {capabilityId}/
│       └── {escopo}/r{n}/
│           ├── saida.json              # envelope da capacidade
│           └── render/                 # Markdown, SVG, Mermaid gerados pela aplicação
├── darklab/
│   └── {capabilityId}/{escopo}/r{n}/saida.json
├── backlog/
│   ├── epicos/r{n}/saida.json                                   # lista de Épicos
│   ├── features/{EPC-NNN}@r{p}/r{n}/saida.json                  # Features do Épico na revisão p do pai
│   ├── historias/{EPC-NNN-FTR-NNN}@r{p}/r{n}/saida.json
│   └── o-que-fazer/{EPC-NNN-FTR-NNN-US-NNN}@r{p}/r{n}/saida.json
├── execucoes/
│   └── {runId}/
│       ├── execucao.json               # parâmetros, solicitante, snapshot, versões de capacidade
│       ├── manifesto-turbo.json        # turboRunManifest (somente Turbo)
│       └── nos/{nodeKey}/tentativa-{k}.json
└── indice/
    └── manifesto.json                  # catálogo navegável do projeto (seção 2)
```

`{escopo}` é `projeto` (padrão), `lote-{batchId}` ou `jornada-{JRN-NNN}` quando a capacidade é executada por recorte.

## 2. Manifesto do índice

`indice/manifesto.json` é a projeção do catálogo (PostgreSQL) usada pelas capacidades para descobrir o Upstream. Uma entrada por revisão gravada:

```json
{
  "uri": "repo://projetos/prj_01/contexto/01-contexto-002-consolidar-contexto/projeto/r2/saida.json",
  "hash": "sha256:...",
  "revision": 2,
  "isCurrent": true,
  "capabilityId": "01-contexto-002-consolidar-contexto",
  "phase": "contexto",
  "kind": "contextBase",
  "schemaVersion": "1.0.0",
  "natureSummary": { "documentado": 140, "inferido": 38, "hipótese": 12, "proposta": 0 },
  "dependencies": [ { "uri": "repo://projetos/prj_01/fontes/SRC-001/r1/analise.json", "revision": 1 } ],
  "runId": "run_01",
  "generatedAt": "2026-11-18T14:30:00Z",
  "reviewState": "não revisado",
  "accessPolicy": "projeto"
}
```

- `natureSummary` conta as afirmações de `data` por natureza.
- `reviewState` (não revisado / revisado / aceito) é editorial e **não** altera disponibilidade.
- Uma capacidade recebe no `inputsSnapshot` as entradas `isCurrent: true` elegíveis no momento da execução (ou as da revisão-base, em regeneração com `same_snapshot`).

## 3. Mapeamento para Azure

| Camada lógica | Serviço | Conteúdo |
|---|---|---|
| Arquivos e saídas | **Azure Blob Storage** (contêiner privado por ambiente, prefixo por `projectId`, versionamento e soft delete habilitados) | `original.bin`, `extracao.json`, `saida.json`, `render/*`, manifestos de execução |
| Metadados e transações | **Azure Database for PostgreSQL – Flexible Server** | projetos, membros e papéis, fontes e versões, lotes, snapshots, artefatos e revisões, itens e vínculos, **árvore do backlog** (tabela de adjacência com pai@revisão), execuções, nós e tentativas, auditoria, outbox |
| Busca | **Azure AI Search** (índice híbrido textual + vetorial, filtrado por `projectId`, permissões e revisão) | trechos de fontes (`EVD`), afirmações estruturadas e resumos de saídas; reconstruível a partir de Blob + PostgreSQL |

Regras:
- O blob é gravado **antes** do commit no PostgreSQL; a revisão só passa a existir no commit. Blobs sem commit são removidos por rotina de reconciliação após 24 h (proposta).
- O índice é derivado: perdê-lo não perde dados. Capacidades usam leitura direta do blob quando a indexação ainda não terminou.
- Acesso aos blobs só por URL temporária assinada (SAS de delegação de usuário, validade proposta de 15 min) emitida pela API após autorização.

## 4. Acesso por papel

| Ação | Leitor | Editor | Aprovador | Administrador |
|---|:-:|:-:|:-:|:-:|
| Consultar fontes, artefatos, revisões, evidências e árvore do backlog | ✓ | ✓ | ✓ | ✓ |
| Baixar originais e exportações | ✓ | ✓ | ✓ | ✓ |
| Enviar fontes, criar lotes | — | ✓ | ✓ | ✓ |
| Executar capacidade, regenerar | — | ✓ | ✓ | ✓ |
| Executar, cancelar, reexecutar nó e retomar Modo Turbo | — | ✓ | ✓ | ✓ |
| Cancelar execução iniciada por outra pessoa | — | — | — | ✓ |
| Marcar revisão como revisado | — | ✓ | ✓ | ✓ |
| Marcar revisão como aceito | — | — | ✓ | ✓ |
| Gerenciar membros, papéis, limites, retenção e exclusão | — | — | — | ✓ |

- Aprovador tem as permissões de Editor e, além delas, marca revisões como `aceito` ([contrato §5.2](00-contrato-comum-das-capacidades.md#52-estado-de-revisão-humana-editorial)).
- Permissões valem por projeto e são reavaliadas no worker antes de cada leitura.
- Fontes com acesso restrito: a saída herda a **interseção** das permissões dos insumos efetivamente usados.

## 5. Versionamento

- Toda gravação cria **nova revisão** (`r{n}`, inteiro crescente por série); nenhuma revisão é sobrescrita.
- Série = projeto + `capabilityId` + escopo (+ pai@revisão no Backlog).
- Ponteiro "atual" = revisão gravada com a maior sequência de solicitação da série (uma execução antiga que termine depois entra no histórico sem mover o ponteiro).
- Filhos ficam presos à revisão do pai que consumiram (`{pai}@r{p}`). Ao navegar a revisão atual do pai, a aplicação mostra divergência e oferece regenerar o filho.

## 6. Retenção (proposta)

| Item | Retenção padrão | Observação |
|---|---|---|
| Originais e extrações | enquanto o projeto existir | exclusão explícita pelo Administrador |
| Revisões de artefatos | enquanto o projeto existir | revisões não atuais podem ser arquivadas em camada *cool* após 90 dias |
| Tentativas de nós e logs de execução | 180 dias | metadados agregados (custos, duração) mantidos |
| Telemetria (sem payload) | 90 dias | Application Insights |
| Projeto excluído | soft delete por 30 dias, depois expurgo | propaga a blobs, catálogo, índice e derivados |

A exclusão de uma fonte marca derivados que a citam como "insumo removido"; a regeneração passa a tratá-la como ausente.

## 7. Acesso ao Upstream entre as fases

Nenhuma fase tem armazenamento próprio: Contexto, DarkLab e Backlog do Futuro leem e gravam neste mesmo espaço. Cada capacidade grava só em `{fase}/{capabilityId}/{escopo}/r{n}/` e lê qualquer prefixo do projeto que o papel do solicitante permita.

| Consumidor | `fontes/` | `contexto/` | `darklab/` | `backlog/` |
|---|---|---|---|---|
| Contexto 001 | lê a fonte analisada | grava | — | — |
| Contexto 002 | lê trechos citados | lê as 001 do lote · grava | — | — |
| Contexto 003–010 | lê trechos citados | lê a 002 e os predecessores · grava | — | — |
| DarkLab M1–M7 | lê trechos citados | lê | lê os motores anteriores · grava | — |
| DarkLab 008 · ficha do projeto | — | lê | lê M1–M7 · grava | — |
| Backlog 001 | lê | lê | lê a ficha do projeto (obrigatória) e M3, M4, M7 | grava `epicos/` |
| Backlog 002–004 | lê | lê | lê | lê o pai@revisão · grava o nível seguinte |

Regras:

1. **Leitura por snapshot.** Ao iniciar, a execução resolve cada insumo pelo manifesto do índice e congela URI, revisão e hash em `inputsSnapshot`. Uma revisão gravada depois não muda a execução em curso.
2. **Alias `atual`.** Num arquivo de capacidade, `…/{escopo}/atual/saida.json` (ou `r{n}` sem número fixo) significa "a revisão atual no momento do snapshot". O orquestrador troca o alias pelo `r{n}` real antes de chamar a IA.
3. **Base consolidada como porta de entrada.** DarkLab e Backlog leem primeiro `contexto/01-contexto-002-consolidar-contexto/` e descem às análises por fonte e aos trechos só quando precisam citar evidência.
4. **Pai@revisão no caminho.** O backlog grava `{EPC-NNN}@r{p}`; a árvore mostra quando um filho aponta para revisão antiga do pai e oferece regenerar.
5. **Permissão herdada.** Derivados herdam a restrição das fontes citadas (seção 4); reconstruir o índice não altera isso.

## 8. Projeto: identidade e etapa

O projeto é criado no Contexto e é a raiz de tudo neste repositório. `projeto.json` guarda a identidade e a etapa; ele é escrito pela aplicação, nunca pela IA, e entra no snapshot das capacidades que precisam dele (por exemplo, a ficha do projeto).

```json
{
  "projectId": "prj_01JX",
  "code": "PRJ-001",
  "name": "Adesão ao produto",
  "description": "Ampliar a adesão ao produto a partir dos documentos da área.",
  "createdAt": "2026-11-18T13:00:00Z",
  "createdBy": "usr_01AB",
  "stage": "projeto_definido",
  "stageHistory": [
    { "stage": "contexto", "at": "2026-11-18T13:00:00Z", "cause": "POST /projects" },
    { "stage": "contexto_consolidado", "at": "2026-11-18T14:20:00Z", "cause": "01-contexto-002 r1" },
    { "stage": "darklab", "at": "2026-11-18T15:00:00Z", "cause": "02-darklab-001 r1" },
    { "stage": "projeto_definido", "at": "2026-11-18T16:10:00Z", "cause": "02-darklab-008 r1" }
  ],
  "currentBatchId": "bat_01JGD7R0AA",
  "projectDefinition": { "uri": "repo://projetos/prj_01JX/darklab/02-darklab-008-consolidar-ficha-do-projeto/projeto/r1/saida.json", "revision": 1, "readiness": "pronto_com_lacunas" }
}
```

Regras:

1. `projectId` e `code` são gerados no `POST /projects` e nunca mudam. Renomear o projeto altera só `name` e fica na auditoria.
2. `stage` segue o [contrato §5.3](00-contrato-comum-das-capacidades.md#53-etapa-do-projeto); `stageHistory` registra cada avanço com a revisão que o causou.
3. `projectDefinition` aponta para a ficha do projeto atual. Épicos e demais níveis do backlog registram a revisão da ficha que consumiram, como fazem com o pai@revisão.
4. Excluir o projeto (Administrador) segue a retenção da seção 6 e propaga a todos os prefixos abaixo de `projetos/{projectId}/`.
