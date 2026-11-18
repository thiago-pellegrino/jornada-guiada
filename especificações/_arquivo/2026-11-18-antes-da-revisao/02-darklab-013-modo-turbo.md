# Modo Turbo do DarkLab

## Identificação

- `id` `02-darklab-013-modo-turbo`
- `versão` `1.0.0`
- `executor` `orquestrador`
- `tipo de saída` `turboRunManifest`

Aplicar o [contrato comum de capacidade](especificacao-plataforma-jornada-guiada.md#42-contrato-comum-de-capacidade).

## Entradas

Snapshot de Contexto e recorte do projeto. Parâmetro `profile` com `motors` como padrão ou `credit_on_wealth` para incluir o protocolo adicional.

## Procedimento

1. Agendar capacidades 02-darklab-001 a 007 na ordem dos motores. Passar a cada nó as saídas persistidas de seus predecessores disponíveis no mesmo run.
2. Se `credit_on_wealth`, executar na sequência 008–012 após as tentativas dos sete motores, reaproveitando o Contexto e os resultados disponíveis.
3. Aplicar retry técnico limitado por nó. Seguir com os resultados recuperáveis e identificar a saída ausente nos derivados que a usariam.
4. Publicar os resultados conforme persistidos e expor resumo com a cobertura do grafo, lacunas por motor e links das revisões.

## Resultado

`runId`, `snapshotId`, `profile`, `nodes[]`, `outputRefs[]`, `failures[]` e `omissions[]`. Identidade do nó por execução, capacidade e recorte. Perfil padrão tem sete nós e o perfil completo tem doze.

## Conferência

Cada saída identifica as fontes efetivamente usadas. A falta de evidência operacional em Construir, Comprovar ou Antecipar permite plano ou proposta identificados.

## Retomada

Repetir apenas nós falhos com os insumos congelados e reutilizar os concluídos. Um novo recorte ou revisão solicitada inicia nova execução.
