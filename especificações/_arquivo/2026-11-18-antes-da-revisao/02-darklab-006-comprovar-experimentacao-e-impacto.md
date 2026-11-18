# Comprovar · Experimentação e impacto

## Identificação

- `id` `02-darklab-006-comprovar-experimentacao-e-impacto`
- `versão` `1.0.0`
- `executor` `ia`
- `tipo de saída` `darklabExperimentation`

Aplicar o [contrato comum de capacidade](especificacao-plataforma-jornada-guiada.md#42-contrato-comum-de-capacidade).

## Entradas

Contexto, saídas 003–005 disponíveis e, quando existentes, amostras, telemetria, dados de uso, feedback e experimentos registrados.

## Procedimento

1. Desenhar plano de experimentação e escolher técnica adequada: comparação A/B, funil, coorte, satisfação ou entrevistas.
2. Especificar hipótese, população, indicador, baseline, janela, comparador, critério e fatores de confusão. Se houver dados, medir e registrar sua origem, janela e limitações.
3. Interpretar resultados observados em adoção, eficácia, qualidade e satisfação. Vincular recomendação de ajustar, ampliar, interromper ou coletar dados a uma evidência ou condição explícita.

## Resultado

`data` contém `experiments[]`, `metrics[]`, `observations[]`, `hypothesisFindings[]` e `recommendations[]`. Sem telemetria, emitir desenho de experimento, requisitos de coleta e análise inconclusiva ou ainda prevista.

## Conferência

Uma estimativa, simulação ou meta fica identificada como tal. Não atribuir causalidade a uma comparação que não a sustenta.

## Regeneração

Reexecutar a síntese com as amostras selecionadas e revisar recomendação mostrando período e versão das métricas.
