# Construir · MVP e validação

## Identificação

- `id` `02-darklab-005-construir-mvp-e-validacao`
- `versão` `1.0.0`
- `executor` `ia`
- `tipo de saída` `darklabMvpPlan`

Aplicar o [contrato comum de capacidade](especificacao-plataforma-jornada-guiada.md#42-contrato-comum-de-capacidade).

## Entradas

Corpus do Contexto e saídas 003–004 disponíveis, hipóteses críticas, escopo candidato, requisitos de qualidade e evidências reais de PoC/MVP quando presentes.

## Procedimento

1. Definir o menor recorte de MVP que testa valor, seus limites e critérios funcionais e técnicos.
2. Indicar PoC apenas para incertezas que a justifiquem. Desenhar incrementos, instrumentação, testes de usabilidade, sinais de qualidade e condições reais de validação.
3. Separar o plano e a evidência de ativos existentes. Relacionar o que cada incremento mede, riscos e dependências.

## Resultado

`data` contém `mvpScope`, `pocRecommendation`, `increments[]`, `instrumentation[]`, `validationPlan`, `qualityEvidence[]` e `knownAssets[]`. Sem dados de execução, preencher o plano e as lacunas de evidência.

## Conferência

Protótipo de referência recebe categoria própria. Alegações de construção, teste executado ou implantação dependem de fonte identificada.

## Regeneração

Reavaliar recorte, instrumentação e plano conforme hipóteses, evidências e alterações de escopo.
