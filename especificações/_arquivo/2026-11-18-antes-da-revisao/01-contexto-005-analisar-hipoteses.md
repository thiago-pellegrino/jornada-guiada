# Analisar hipóteses

## Identificação

- `id` `01-contexto-005-analisar-hipoteses`
- `versão` `1.0.0`
- `executor` `ia`
- `tipo de saída` `hypothesisAnalysis`

Aplicar o [contrato comum de capacidade](especificacao-plataforma-jornada-guiada.md#42-contrato-comum-de-capacidade).

## Entradas

Corpus de lote analisado. Usar causas, jornadas, dados e resultados de pesquisas ou experimentos quando disponíveis.

## Procedimento

1. Formular hipóteses falsificáveis ligando população, fator/intervenção e mudança observável.
2. Registrar evidência favorável e contrária, hipóteses concorrentes, pressupostos, impacto e confiança justificada.
3. Definir como testar: fonte de dados, método, métrica, critério de decisão, janela e riscos de viés. Distinguir valores disponíveis de parâmetros sugeridos.
4. Quando existir evidência de experimento, explicitar população, método, limitações e interpretação sustentada. Priorizar o que testar por impacto e incerteza.

## Resultado

`data.hypotheses[]` contém IDs, enunciado, contexto, vínculos, evidências pró/contra, hipótese concorrente, confiança, teste, critério e conclusão analítica. `data.learningPlan[]` liga ordem sugerida, responsáveis candidatos e dados necessários às hipóteses.

## Conferência

Conclusões se apoiam nos dados da investigação. Registrar inconclusão e lacuna quando a evidência é insuficiente.

## Regeneração

Reavaliar hipóteses com a versão-base e explicar mudanças na evidência, teste e conclusão.
