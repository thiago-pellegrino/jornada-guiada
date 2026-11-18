# Modo Turbo do Backlog do Futuro

## Identificação

- `id` `03-backlog-do-futuro-005-modo-turbo`
- `versão` `1.0.0`
- `executor` `orquestrador`
- `tipo de saída` `turboRunManifest`

Aplicar o [contrato comum de capacidade](especificacao-plataforma-jornada-guiada.md#42-contrato-comum-de-capacidade).

## Entradas

Recorte de portfólio e snapshot com Contexto e DarkLab disponíveis. Limites de concorrência, custo e tentativas da plataforma.

## Procedimento

1. Executar 03-backlog-do-futuro-001 no escopo do portfólio congelado.
2. Para cada Épico devolvido, executar 002 com ID e revisão exatos produzidos. Para cada Feature devolvida, executar 003 nas mesmas condições. Para cada História devolvida, executar 004 com a revisão produzida pelo nó pai.
3. Enfileirar a expansão por pai. Limitar paralelismo, registrar o progresso e publicar cada pacote persistido. Uma lista vazia com justificativa encerra seu ramo.
4. Se um nó falhar, registrar o caminho afetado e continuar nos ramos independentes. Mostrar contagem por nível e vincular saídas e erros.

## Resultado

`runId`, `snapshotId`, `nodes[]`, `outputRefs[]`, `failures[]` e `omissions[]`, mais contagens de Épicos, Features, Histórias e pacotes de detalhamento. Cada nó tem capacidade, chave do pai e revisão, chaves de execução, tentativas e referência de saída.

## Conferência

Para cada pai materializado, conferir que a ação filha foi executada ou que o manifesto registra falha ou motivo. A expansão usa sempre a revisão da execução original.

## Retomada

Em retry, retomar ramos falhos ou pendentes com chave idempotente por capacidade e pai versionado. Para rever escopo após feedback, regenerar o resultado desejado ou solicitar novo Turbo.
