# Phase 0 Research: Modernização do Simulador de Roadmap e Capacity

**Feature**: `001-modernizar-simulador-roadmap`  
**Date**: 2026-11-16  
**Spec**: [spec.md](./spec.md)

---

## R1. Stack Frontend, Gráficos e Testes sem Dependências Extras

- **Decision**: Utilizar exclusivamente a stack já instalada no projeto (`react@19.3.0`, `react-dom@19.3.0`, `vite@8.3.0`, `@vitejs/plugin-react@6.1.1` sobre `Node.js v26.12.1`), fixando versões semânticas explícitas no `package.json`, renderizando ícones e o gráfico de curva em **SVG nativo controlado por React**, estilizando via **CSS Custom Properties modulares** (`tokens.css`) e executando testes automatizados de unidade/contrato com o runner nativo **`node --test`** (`node:test` + `node:assert/strict`).
- **Rationale**:
  - O `DESIGN-SYSTEM-FRONTEND.md` (§5 e §18.14) especifica ícones SVG inline (`viewBox="0 0 24 24"`, `stroke-width: 1.65`) e gráficos em SVG próprio consumindo diretamente os tokens `--chart-*`, garantindo troca instantânea entre tema claro, escuro e impressão sem reconsulta nem re-renderização pesada em canvas.
  - O runner nativo `node --test` do Node 26 permite testar exaustivamente os cálculos matemáticos, migrações e validações de importação/exportação sem instalar pacotes externos pesados.
  - Mantém o bundle final enxuto e garante tempo de resposta de recálculo inferior a `5ms` (muito abaixo da meta de `100ms` em `SC-002`).
- **Alternatives considered**:
  - *Recharts / Chart.js*: Rejeitado por adicionar peso desnecessário ao pacote, dificultar a estilização exata de impressão (`@media print`) e complicar a associação direta ao grid equivalente acessível (§18.12).
  - *Tailwind CSS / CSS-in-JS*: Rejeitado porque o Design System NextPrev já fornece a camada completa de tokens CSS prontos para uso (§15, §18.13, §19.4).

---

## R2. Organização de Diretórios e Conveniência de Execução Multi-Pasta

- **Decision**: Manter o código-fonte da aplicação Vite em `roadmap-react/roadmap-react/` (onde `node_modules` já está instalado), adicionando `vite.config.js` explícito e criando um `package.json` leve na raiz do repositório (`simulador-roadmap/package.json`) que encaminha `npm run dev`, `npm run build`, `npm run preview` e `npm test` via `--prefix roadmap-react/roadmap-react`.
- **Rationale**:
  - Preserva o *Hot Module Replacement* (HMR) do servidor Vite em execução no Windows sem risco de bloqueio de arquivos (`EPERM`) ao mover `node_modules`.
  - Elimina o erro `ENOENT` caso o desenvolvedor execute comandos `npm` diretamente na raiz `simulador-roadmap/`.
- **Alternatives considered**:
  - *Mover fisicamente `roadmap-react/roadmap-react/*` um nível acima*: Rejeitado porque no Windows invalida caminhos internos de shims em `node_modules/.bin` e falha enquanto o processo `vite` mantém descritores abertos.

---

## R3. Modelagem Matemática dos 3 Motores e Reconciliação com `SEMANAS.xlsx`

- **Decision**: Isolar todo o cálculo em um módulo puro e determinístico (`src/domain/simulationEngine.js`) que recebe o estado do cenário e devolve um snapshot completo calculado (`SimulationResult`), contemplando:
  1. **Calendário unificado (`23` colunas visíveis)**: `S05` e `S06` (Agosto, pré-planejamento; `S06` marcada com marco `ESTAMOS AQUI`), `S07` a `S24` (`18` semanas planejáveis antes do congelamento, cobrindo `SPRINT-04` a `SPRINT-12` e marco `HOMOLOGAÇÃO` em `S21`), coluna `FREEZING` (`17/12/2026`, bloqueada) e `S25`–`S26` (`2` semanas pós-Freezing, com marco `PRODUÇÃO` em `S25`/`S23` mapeado conforme planilha `SEMANAS`, totalizando **`20` semanas úteis planejáveis** a partir de `S07`).
  2. **Três modalidades de agendamento**:
     - `continuous` (*Fluxo Contínuo — C1*): aloca horas sequencialmente por Squad a partir de `startWeekIndex`; quando uma feature consome fração de uma semana, o saldo de horas remanescente naquela mesma semana fica disponível para a próxima feature da Squad.
     - `whole_weeks` (*Semanas Inteiras — C0*): cada feature ocupa `Math.ceil(effortHours / weeklyCapacity)` semanas inteiras exclusivas.
     - `manual` (*Alocação Manual*): respeita as quantidades de histórias lançadas por célula `Feature × Semana`, bloqueando `FREEZING`, calculando taxa de ocupação semanal da Squad e sinalizando sobrecarga (`allocatedHours > weeklyCapacity`). Ao entrar no modo manual pela primeira vez sem alocações prévias, inicializa a grade com a distribuição vigente para facilitar ajustes finos.
  3. **Tratamento explícito de estouro pós-`S26` (`Spillover`)**:
     - Nenhum esforço é descartado quando o cursor ultrapassa `S26`. O motor calcula `spilloverHours` e `spilloverWeeks` para cada feature e cada Squad, atribuindo status determinístico: `EMPTY`, `NO_CAPACITY`, `ON_TIME` (concluída até `S24`), `POST_FREEZE` (concluída em `S25`–`S26`) ou `OUT_OF_WINDOW` (requer semanas após `S26` ou possui saldo não alocado no modo manual).
  4. **Recomendação automática de headcount para o Freezing**:
     - Para cada Squad com demanda `totalEffortHours > 0`, `recommendedPeopleForFreeze = Math.ceil(totalEffortHours / (availableWeeksBeforeFreeze * hoursPerPerson))` no modo contínuo (ou simulação iterativa exata `p = 1..50` no modo `whole_weeks`, pois a soma dos `Math.ceil` não é linear!), garantindo que a recomendação exibida realmente entregue 100% das features até `S24` no modo ativo.
- **Rationale**:
  - Nota crucial de engenharia: no modo `whole_weeks` (`C0`), usar apenas `Math.ceil(somaEsforço / (semanas * horasPessoa))` pode subestimar em 1 profissional por causa dos arredondamentos individuais de cada feature! Testar iterativamente `people = 1..N` com o próprio motor ativo garante **exatidão de 100%** tanto em `C1` quanto em `C0` (`SC-003`).
- **Alternatives considered**:
  - *Fórmula linear única para recomendação de headcount em todos os modos*: Rejeitada porque falharia quando a soma dos arredondamentos `Math.ceil` por feature superasse `18` semanas antes do *Freezing*.

---

## R4. Aplicação Fiel do Design System NextPrev e Acessibilidade WCAG AA

- **Decision**: Implementar o conjunto consolidado de tokens do `DESIGN-SYSTEM-FRONTEND.md` (§15, §18.13 e §19.4) em `src/styles/tokens.css`, estruturando a interface no **Shell NextPrev** (Sidebar retrátil `254px`, Topbar `77px`, `PageHeader`, layout superior de simulação em 2 colunas alinhadas pelo topo com `gap: 16px`, seção inferior de matriz com modo foco/expansão e `CopilotDrawer` lateral de `410px`).
- **Rationale**:
  - Reproduz exatamente a ergonomia visual da imagem de referência (`Simulador gráfico de renda futura`) adaptada ao domínio de Roadmap & Capacity.
  - Cumpre piso mínimo de `12px` (`--text-xs`), `tabular-nums`, contraste ≥ `4,5:1` em textos e ≥ `3:1` em controles nos temas Claro e Escuro, `.badge` padronizado em `150×22px` com `title` automático quando truncado (§20.10.6), `.slider-row` com `<input type="range">` + `<input type="number">` sincronizados (§20.6) e `prefers-reduced-motion`.
- **Alternatives considered**:
  - *Estilizar apenas a tabela sem o Shell e sem os cartões superiores de simulação*: Rejeitado por não atender a referência visual nem os requisitos executivos `FR-002`, `FR-007`–`FR-009` e `FR-013`.

---

## R5. Persistência Local Versionada, Histórico (`Undo`) e Exportação (JSON, CSV, PDF)

- **Decision**:
  - Persistir o cenário ativo em `localStorage` sob `roadmap.sim.v2`, migrando automaticamente na inicialização caso `roadmap.sim.v2` não exista mas `roadmap.avg` ou `roadmap.squads` estejam presentes.
  - Manter buffer de histórico em sessão (`max 30` entradas) para `Desfazer` imediato e confirmação em dois cliques no botão `Restaurar valores iniciais` (com timeout de 4 segundos para desarme automático).
  - Exportar e importar cenários em `.json` validado por schema (`schemaVersion: "2.0"`), exportar tabela calculada em `.csv` (`UTF-8 com BOM` + `;`) e gerar **Exportar estudo em PDF** via `window.print()` com folha `print.css` que força `color-scheme: light` e formata o relatório executivo em páginas A4 paisagem/retrato limpas.
- **Rationale**:
  - Segue estritamente os padrões de simulação da seção 20.10.4 e de impressão em tema claro da seção 19.3 do Design System, mantendo texto vetorial nítido no PDF sem bibliotecas externas.
- **Alternatives considered**:
  - *Captura de imagem da tela para PDF (`html2canvas`)*: Rejeitado por gerar arquivos pesados, perder nitidez tipográfica, cortar áreas com rolagem e falhar no modo escuro.
