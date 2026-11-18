# Mapear jornadas AS IS e TO BE

## Identificação

- `id` `01-contexto-002-mapear-jornadas-as-is-to-be`
- `versão` `1.0.0`
- `executor` `ia`
- `tipo de saída` `journeyMaps`

Aplicar o [contrato comum de capacidade](especificacao-plataforma-jornada-guiada.md#42-contrato-comum-de-capacidade).

## Entradas

Corpus de lote analisado. Usar recorte de produto, ator, objetivo e canais quando especificado. Consumir hipóteses e causas disponíveis como apoio à proposta TO BE.

## Procedimento

1. Identificar jornadas, atores, objetivo, gatilho, ponto de início e término. Consolidar variações por segmento e canal.
2. Reconstituir o AS IS com etapas, responsabilidades, sistemas, regras, transferências operacionais, resultados, dores, exceções e dados documentados. Marcar trechos incompletos e divergentes.
3. Propor TO BE com uma experiência alvo, responsabilidades, caminhos alternativos, pontos de controle do domínio e resultados observáveis.
4. Mapear correspondências e mudanças entre as etapas, efeitos esperados, restrições e hipóteses de valor.

## Resultado

`data.journeys[]` contém ID de jornada, ator, objetivo e `asIs`/`toBe`, cada um com `steps[]`, `transitions[]` e diagrama `flowchart` Mermaid. Cada etapa tem ID, ação, ator, canal, dados/sistema, resultado, regra, exceção e evidências. `data.deltas[]` liga IDs AS IS/TO BE com motivo, impacto e indicador proposto.

## Conferência

Conferir entradas, saídas, ramificações e referências da matriz de mudanças. Toda proposta TO BE tem motivação; divergências do AS IS ficam visíveis.

## Regeneração

Preservar IDs de jornadas e etapas equivalentes. Atualizar matriz de mudanças e indicar vínculos afetados em ciclos, blueprint e sequências.
