# Mapear ciclos de vida das jornadas e dos assuntos

## Identificação

- `id` `01-contexto-003-mapear-ciclos-de-vida`
- `versão` `1.0.0`
- `executor` `ia`
- `tipo de saída` `journeyLifecycles`

Aplicar o [contrato comum de capacidade](especificacao-plataforma-jornada-guiada.md#42-contrato-comum-de-capacidade).

## Entradas

Corpus de lote analisado. Preferir jornadas AS IS/TO BE quando disponíveis. Assunto significa objeto, demanda ou tema de negócio tratado na jornada.

## Procedimento

1. Identificar assuntos por jornada e distinguir o ciclo da jornada dos ciclos dos objetos envolvidos.
2. Descrever estados de domínio, eventos, gatilhos, responsáveis, condições, regras, transições, exceções, reabertura e conclusões. Mapear paralelismo quando sustentado.
3. Usar evidências para separar ciclos atuais de ciclos propostos. Anotar quando o nome de um estado é apenas uma hipótese de modelagem.
4. Vincular transições aos passos e referências de jornada e apresentar efeitos sobre os assuntos relacionados.

## Resultado

`data.lifecycles[]` contém `id`, `journeyId`, `subject`, `variant` (AS IS/TO BE), `states[]`, `transitions[]` e `diagram` Mermaid `stateDiagram-v2`. Transições têm origem, destino, evento, condição, efeito, responsável e evidências.

## Conferência

Checar estados e ligações válidas, início, finais e exceções conhecidas. Os estados do modelo pertencem aos objetos do negócio analisado. A execução na plataforma segue o contrato comum.

## Regeneração

Reemitir os ciclos do recorte e registrar diferenças por assunto, estado e evento.
