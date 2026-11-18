# Gerar diagramas de sequência funcional

## Identificação

- `id` `01-contexto-008-gerar-sequencias-funcionais`
- `versão` `1.0.0`
- `executor` `ia`
- `tipo de saída` `functionalSequences`

Aplicar o [contrato comum de capacidade](especificacao-plataforma-jornada-guiada.md#42-contrato-comum-de-capacidade).

## Entradas

Corpus de lote analisado e jornadas do recorte. Preferir blueprint, arquitetura e regras documentadas disponíveis.

## Procedimento

1. Selecionar cenários principais e alternativos que expliquem o processamento funcional da jornada.
2. Definir participantes, responsabilidades, gatilhos, mensagens, entradas e saídas. Distinguir interações síncronas, assíncronas e humanas.
3. Modelar caminhos de regra, erros, timeout, retry e compensação quando pertinentes. Ligar cada interação ao passo e regra que a motivam.
4. Gerar sequência por cenário com alternativa textual ordenada e sinais de resultado observável.

## Resultado

`data.scenarios[]` contém ID, jornada e etapa, precondições, participantes, `messages[]`, `alternatives[]`, resultado e Mermaid `sequenceDiagram`. Mensagens têm origem, destino, ação, dados e natureza/evidências.

## Conferência

Participantes e referências resolvem na mesma visão. Diagramas devem renderizar e incluir os caminhos de exceção conhecidos.

## Regeneração

Reemitir cenários afetados e reconciliar componentes, mensagens e referências quando o upstream selecionado mudar.
