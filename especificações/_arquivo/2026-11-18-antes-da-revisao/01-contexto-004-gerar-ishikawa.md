# Gerar diagrama de Ishikawa

## Identificação

- `id` `01-contexto-004-gerar-ishikawa`
- `versão` `1.0.0`
- `executor` `ia`
- `tipo de saída` `ishikawaAnalysis`

Aplicar o [contrato comum de capacidade](especificacao-plataforma-jornada-guiada.md#42-contrato-comum-de-capacidade).

## Entradas

Corpus de lote analisado e recorte do problema. Usar jornadas, indicadores e achados quando disponíveis.

## Procedimento

1. Definir efeito observável, população ou processo afetado, intervalo e indicador conhecido. Quando houver efeitos independentes, gerar um mapa por efeito.
2. Organizar causas candidatas em categorias coerentes com o domínio. Decompor causa em subcausas e explicitar o encadeamento proposto.
3. Para cada causa, associar evidências, contraevidências, confiança, influência esperada e forma de verificação.
4. Destacar as causas que melhor orientam investigação e registrar explicações concorrentes.

## Resultado

`data.effects[]` contém `effectId`, `statement`, `scope`, `metric`, `categories[]`, `causes[]`, `verificationPriority[]` e `diagram` com espinha central apontando para o efeito. Cada causa tem `id`, `parentCauseId`, `categoryId`, descrição e evidências. A projeção textual mantém a mesma hierarquia.

## Conferência

Uma causa provável continua hipótese até haver evidência causal suficiente. Conferir vínculos sem ciclos na árvore e coerência com o efeito.

## Regeneração

Reavaliar causas e categorias com novas evidências. Reemitir diagramas e registrar diferenças na priorização.
