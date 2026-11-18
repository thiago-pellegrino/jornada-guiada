# Propor wireframes para portais e interfaces

## Identificação

- `id` `01-contexto-009-propor-wireframes`
- `versão` `1.0.0`
- `executor` `ia`
- `tipo de saída` `wireframeProposal`

Aplicar o [contrato comum de capacidade](especificacao-plataforma-jornada-guiada.md#42-contrato-comum-de-capacidade).

## Entradas

Corpus de lote analisado. Preferir jornadas TO BE, blueprint e requisitos de canal e papel. Usar portais web, administrativos ou outros canais quando sustentados pelo contexto.

## Procedimento

1. Definir perfis, objetivos por tela, arquitetura de navegação e fluxo entre telas.
2. Descrever composição de baixa fidelidade, hierarquia, componentes, campos, conteúdo mínimo e ações primárias e secundárias.
3. Mapear estados vazios, erro, carregamento, sucesso, acesso restrito, validação e recuperação. Incluir foco, rótulos, navegação por teclado e adaptação aos tamanhos de tela pertinentes.
4. Vincular telas e ações aos passos da jornada, regras, necessidades e hipóteses a investigar em prototipação.

## Resultado

`data.portals[]` agrupa `personas[]`, `navigation[]` e `screens[]`. Cada tela tem ID, ator, finalidade, navegação, regiões/ordem de leitura, ações, campos, estados de interface, vínculo de jornada e wireframe ASCII ou grade textual. Incluir roteiro de prototipação por fluxo.

## Conferência

Cada destino e estado de interface são alcançáveis no fluxo previsto. Dados exemplificativos são sintéticos e sinalizados.

## Regeneração

Revisar telas e fluxo com feedback. Preservar IDs de telas equivalentes e emitir diferenças por tarefa, navegação e estados.
