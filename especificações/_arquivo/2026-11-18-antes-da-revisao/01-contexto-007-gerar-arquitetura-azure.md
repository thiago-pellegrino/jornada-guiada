# Gerar arquitetura de solução em alto nível na Azure

## Identificação

- `id` `01-contexto-007-gerar-arquitetura-azure`
- `versão` `1.0.0`
- `executor` `ia`
- `tipo de saída` `azureSolutionArchitecture`

Aplicar o [contrato comum de capacidade](especificacao-plataforma-jornada-guiada.md#42-contrato-comum-de-capacidade).

## Entradas

Corpus de lote analisado, recorte da solução e requisitos. Preferir jornadas TO BE e blueprint. Considerar integrações existentes, volume, segurança e restrições de residência, latência e operação quando documentadas. A plataforma pode fornecer catálogo Azure curado e versionado.

## Procedimento

1. Mapear capacidades, domínios, sistemas existentes, dependências externas e requisitos funcionais e de qualidade.
2. Propor topologia Azure e justificar o papel de cada serviço. Cobrir identidade, rede, computação, armazenamento, integração, observabilidade e segurança conforme aplicabilidade.
3. Representar fronteiras de confiança, fluxo principal de dados, controle de acesso, entradas e saídas, dependências e tratamento de falhas relevantes.
4. Registrar decisões de arquitetura, premissas, questões de viabilidade e pontos a confirmar em documentação oficial, como região, custo e limites.

## Resultado

`data` contém `requirements[]`, `components[]`, `integrations[]`, `dataFlows[]`, `trustBoundaries[]`, `decisions[]`, `risks[]` e `diagram` com visão de contexto/containers em Mermaid. Cada componente liga requisito, responsabilidade, serviço Azure sugerido e justificativa.

## Conferência

Os fluxos apontam para componentes existentes no modelo, com protocolo, dados e controle de acesso quando conhecidos. Distinguir legado, proposta e hipótese. Disponibilidade regional, SKUs e custos incertos ficam como verificação pendente no conteúdo.

## Regeneração

Recomparar componentes e decisões com a revisão anterior e apontar impacto nas sequências e no backlog.
