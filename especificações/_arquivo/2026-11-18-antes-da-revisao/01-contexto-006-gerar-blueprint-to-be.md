# Gerar blueprint da solução TO BE

## Identificação

- `id` `01-contexto-006-gerar-blueprint-to-be`
- `versão` `1.0.0`
- `executor` `ia`
- `tipo de saída` `serviceBlueprint`

Aplicar o [contrato comum de capacidade](especificacao-plataforma-jornada-guiada.md#42-contrato-comum-de-capacidade).

## Entradas

Corpus de lote analisado. Usar jornada TO BE, ciclo de vida e hipóteses disponíveis; quando a jornada não existir, propor e marcar o recorte mínimo dentro da saída.

## Procedimento

1. Dividir o serviço em momentos da jornada. Mapear ações do usuário, canais, evidências do serviço e pontos de contato.
2. Preencher frontstage, backstage, processos de suporte, pessoas, dados, sistemas e integrações. Identificar linhas de interação e visibilidade.
3. Mapear exceções, transferência de responsabilidade, recuperação, indicadores e dependências. Identificar capacidades a desenvolver.
4. Vincular cada coluna e linha ao passo da jornada, dores que atende e requisitos que sustenta.

## Resultado

`data.blueprints[]` contém `journeyId`, `stages[]`, `lanes[]`, `cells[]`, `interactionLines[]`, `failures[]` e `metrics[]`. Identificar eixo de tempo, IDs de etapa/camada em cada célula, ação, responsável e evidências. Projetar uma matriz com alternativa textual legível.

## Conferência

Conferir cada ponto de contato contra uma responsabilidade visível ou de suporte. Declarar propostas de integração e dados ausentes.

## Regeneração

Atualizar a matriz por etapa e indicar efeitos em arquitetura, sequências e wireframes.
