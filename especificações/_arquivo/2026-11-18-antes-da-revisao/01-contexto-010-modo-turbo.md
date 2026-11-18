# Modo Turbo do Contexto

## Identificação

- `id` `01-contexto-010-modo-turbo`
- `versão` `1.0.0`
- `executor` `orquestrador`
- `tipo de saída` `turboRunManifest`

Aplicar o [contrato comum de capacidade](especificacao-plataforma-jornada-guiada.md#42-contrato-comum-de-capacidade).

## Entradas

Lote de versões de fonte e recorte do projeto. Limites de concorrência/retry definidos na configuração da plataforma.

## Procedimento

1. Fixar as versões de fonte do lote. Executar 01-contexto-001 por fonte pendente e registrar a revisão da análise produzida ou reutilizada por fonte.
2. Quando todas as análises existirem, congelar o snapshot do lote com essas revisões e disparar 002, 004 e 005 em paralelo. Os nós simultâneos usam o corpus e os derivados já congelados, sem escolher saídas de irmãos por ordem de chegada.
3. Executar 003 e 006 após a tentativa de 002. Depois da tentativa de 006, executar 007 e 009. Depois da tentativa de 007, executar 008. Incluir derivados já produzidos e congelados para cada nó.
4. Persistir cada resultado assim que produzido. Acompanhar falhas por nó e exibir os oito tipos de resultado no resumo.

## Resultado

Manifesto técnico com `runId`, `snapshotId` quando elegível, `nodes[]`, `outputRefs[]`, `failures[]` e `omissions[]`. Cada nó registra capacidade completa, escopo, dependências, entradas consumidas, tentativa e saída por revisão.

## Conferência

Falha de origem impede expandir o lote. Falha de um derivado preferencial permite continuar com o corpus, com lacuna explicitada. Contabilizar os oito complementares uma única vez por escopo de execução.

## Retomada

Retentar as análises ou os nós falhos no mesmo snapshot. Após retentar um derivado preferencial, os produtos já gravados ficam disponíveis para regeneração explícita usando a revisão nova.
