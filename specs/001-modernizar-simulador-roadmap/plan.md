# Implementation Plan: Modernização do Simulador de Roadmap e Capacity

**Branch**: `001-modernizar-simulador-roadmap` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-modernizar-simulador-roadmap/spec.md`, design guidelines from `/DESIGN-SYSTEM-FRONTEND.md`, evolution roadmap from `/PLANO-EVOLUCAO-ROADMAP.md` and visual reference `/7f515558-e93e-4406-beca-90b410e75432.png`.

## Summary

Transformar o protótipo atual em estilo planilha (`roadmap-react/roadmap-react`) em um **Simulador Executivo de Roadmap & Capacity** totalmente aderente ao **Design System NextPrev (Portal do Gestor)** e à arquitetura visual de duas colunas + matriz detalhada da referência visual. A solução desacopla toda a inteligência matemática em um motor de domínio puro e testável (`simulationEngine.js`) que suporta três modos de agendamento (*Fluxo Contínuo C1*, *Semanas Inteiras C0* e *Alocação Manual com detecção de sobrecarga*), elimina o truncamento silencioso de entregas pós-`S26`, calcula KPIs e recomendações de *headcount* em tempo real (`< 5ms`), oferece suporte completo aos temas Claro/Escuro/Sistema, painel lateral do Copiloto com propostas confirmáveis, persistência versionada com *Undo* e exportação em `.json`, `.csv` e PDF vetorial via `@media print`.

## Technical Context

**Language/Version**: JavaScript ES2024 + JSX (`Node.js v26.12.1` no ambiente de build e testes)

**Primary Dependencies**: `react@19.3.0`, `react-dom@19.3.0`, `vite@8.3.0`, `@vitejs/plugin-react@6.1.1` (zero bibliotecas externas adicionais de gráficos ou UI; SVG e CSS Custom Properties nativos conforme Design System NextPrev)

**Storage**: `localStorage` do navegador com envelope versionado (`roadmap.sim.v2` + migração automática de `roadmap.avg` e `roadmap.squads`, além de `theme`) e serialização em arquivos locais (`.json` e `.csv`)

**Testing**: Node.js built-in test runner (`node --test` com `node:assert/strict`) para testes unitários e de contrato do motor matemático, migração e serialização + validação de build Vite (`vite build`)

**Target Platform**: Navegadores modernos desktop, tablet e mobile (`360px` a `1650px+`), 100% client-side e offline-capable após carregamento inicial

**Project Type**: Web Application (Single-Page Application interativa de simulação e planejamento)

**Performance Goals**: Recálculo completo de simulação `< 5ms` e atualização visual `< 100ms` (`60fps`) ao arrastar controles deslizantes; bundle de produção `< 100 KB` gzip

**Constraints**: Conformidade WCAG 2.1/2.2 AA nos temas Claro e Escuro (contraste texto `>= 4,5:1`, controles `>= 3:1`, piso tipográfico informativo `12px`, `tabular-nums`, operação integral por teclado, `prefers-reduced-motion`); impressão/PDF obrigatoriamente em tema claro; preservação do `node_modules` existente sem exigir download de novas dependências

**Scale/Scope**: 1 aplicação SPA composta por Shell completo do Portal do Gestor, 4 Squads (`29` features / `163` histórias base editáveis, escalável para centenas de linhas), horizonte base de `23` colunas (`S05`–`S26` + `FREEZING`) mais contabilização ilimitada de estouro pós-horizonte, ~18 módulos/componentes organizados em camadas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

> **Nota sobre `.specify/memory/constitution.md`**: O arquivo de constituição do workspace encontra-se atualmente no template inicial não preenchido (placeholders genéricos). Portanto, aplicam-se os gates de engenharia derivados dos princípios implícitos do Spec Kit e das regras mandatórias do `DESIGN-SYSTEM-FRONTEND.md`:

### Avaliação Pré-Phase 0 & Pós-Phase 1

| Gate de Qualidade e Arquitetura | Pré-Phase 0 | Pós-Phase 1 | Justificativa / Evidência no Design |
|---|---|---|---|
| **G1. Separação Pura Domínio × Interface** | PASS | PASS | `src/domain/simulationEngine.js` e `src/domain/scenarioSerializer.js` não acessam DOM/React e possuem contratos formais em `contracts/`. |
| **G2. Testabilidade Automatizada** | PASS | PASS | Cobertura determinística via `node --test` sobre fórmulas `30h`/`40h`, 3 motores, *Freezing*, *spillover* e importação/exportação. |
| **G3. Simplicidade & Zero Dependências Supérfluas (YAGNI)** | PASS | PASS | Reutiliza `React 19.3` + `Vite 8.3` já instalados, tokens CSS nativos e SVG inline sem bibliotecas pesadas. |
| **G4. Conformidade Design System & Acessibilidade (WCAG AA)** | PASS | PASS | Formalizado em `contracts/ui-design-system.contract.md` (`tokens.css` §15/18.13/19.4, `.badge` `150×22px`, `.slider-row`, `tabular-nums`, temas Claro/Escuro e `@media print`). |
| **G5. Integridade de Dados e Compatibilidade Retroativa** | PASS | PASS | Migração não-destrutiva de `roadmap.avg`/`roadmap.squads` para `roadmap.sim.v2` e eliminação total de truncamento silencioso pós-`S26`. |

*Resultado dos Gates*: **APROVADO** (zero violações).

## Project Structure

### Documentation (this feature)

```text
specs/001-modernizar-simulador-roadmap/
├── spec.md                                      # Especificação funcional e histórias P1–P4
├── plan.md                                      # Este plano técnico de implementação
├── research.md                                  # Decisões arquiteturais e reconciliação matemática (Phase 0)
├── data-model.md                                # Entidades, invariantes, estados e auditoria de dados (Phase 1)
├── quickstart.md                                # Guia executável de validação ponta a ponta (Phase 1)
├── checklists/
│   └── requirements.md                          # Checklist de qualidade da especificação (16/16 aprovados)
└── contracts/
    ├── simulation-engine.contract.md            # Contrato puro dos 3 motores, KPIs e propostas do Copiloto
    ├── scenario-storage-export.contract.md      # Contrato de localStorage v2, migração, JSON, CSV e PDF
    └── ui-design-system.contract.md             # Contrato de tokens, componentes NextPrev, teclado e A11y
```

### Source Code (repository root)

```text
package.json                                     # Scripts raiz de conveniência (--prefix roadmap-react/roadmap-react)
roadmap-react/
└── roadmap-react/
    ├── index.html                               # Meta tags pt-BR, fonte Montserrat e script anti-FOUC de tema
    ├── package.json                             # Dependências fixadas (React 19.3, Vite 8.3) + script "test"
    ├── vite.config.js                           # Configuração explícita do @vitejs/plugin-react
    ├── src/
    │   ├── main.jsx                             # Ponto de entrada React 19
    │   ├── App.jsx                              # Orquestração do Shell NextPrev, Simulador, Matriz e Copiloto
    │   ├── data/
    │   │   └── initialRoadmapData.js            # Catálogo WEEKS (datas + marcos SEMANAS.xlsx) e INITIAL_SQUADS
    │   ├── domain/
    │   │   ├── simulationEngine.js              # Motores continuous (C1), whole_weeks (C0), manual + insights Copiloto
    │   │   └── scenarioSerializer.js            # Migração localStorage v2, validação JSON e gerador CSV
    │   ├── hooks/
    │   │   ├── useSimulationState.js            # Estado central com pilha Undo (30 níveis) e persistência automática
    │   │   └── useTheme.js                      # Gerenciamento Claro / Escuro / Sistema + sync entre abas
    │   ├── components/
    │   │   ├── shell/
    │   │   │   ├── Sidebar.jsx                  # Navegação lateral NextPrev (254px fixa / drawer mobile)
    │   │   │   ├── Topbar.jsx                   # Busca global (Ctrl+K), status simulação, menu Tema e botão Copiloto
    │   │   │   ├── PageHeader.jsx               # Voltar, Breadcrumbs, Eyebrow, H1, Favorito e menu Exportar/PDF
    │   │   │   └── CopilotDrawer.jsx            # Painel lateral (410px) com diagnósticos e propostas confirmáveis
    │   │   ├── simulator/
    │   │   │   ├── ScopePremisesCard.jsx        # Busca rápida, início (S07), jornada (30h/40h/custom) e info Freeze
    │   │   │   ├── ParametersCard.jsx           # Sliders sincronizados (h/US e Squads A–D) + seletor de modalidade
    │   │   │   ├── ProjectionChartCard.jsx      # Curva SVG acessível + toggle Tabela equivalente + 5 cards de marcos
    │   │   │   ├── KpiSummaryColumn.jsx         # Cartões .dsh-card.kpi (Conclusão/Gargalo e Entregas até Freezing)
    │   │   │   └── SquadDiagnosticsCard.jsx     # Quadro por Squad com badges 150x22px e recomendação de headcount
    │   │   ├── matrix/
    │   │   │   ├── MatrixToolbar.jsx            # Filtros combináveis (Squad, Épico, Situação), chips, modo Foco e Undo/Reset
    │   │   │   └── RoadmapMatrix.jsx            # Matriz/Gantt sticky com coluna +Sem pós-S26 e células manuais/overcapacity
    │   │   └── ui/
    │   │       ├── SliderField.jsx              # Componente .slider-row acessível (range + number sincronizados)
    │   │       ├── Badge.jsx                    # Selo padronizado 150x22px com ponto de estado e title automático
    │   │       ├── Icon.jsx                     # Biblioteca de ícones SVG inline stroke 1.65 (viewBox 24x24)
    │   │       └── Toast.jsx                    # Região de feedback temporizado role="status" aria-live="polite"
    │   └── styles/
    │       ├── tokens.css                       # Tokens consolidados NextPrev (Claro §15/18.13 + Escuro §19.4)
    │       ├── shell.css                        # Layout Shell, Sidebar, Topbar, CopilotDrawer e responsividade
    │       ├── simulator.css                    # Grid 2 colunas, superfícies, sliders, KPIs e curva gráfica
    │       ├── roadmap-matrix.css               # Grade/Gantt sticky, barras por Squad (--chart-1..4) e sobrecarga
    │       └── print.css                        # Folha @media print forçando tema claro para Exportar estudo em PDF
    └── tests/
        ├── simulationEngine.test.js             # Testes unitários dos 3 motores, Freezing, spillover, 30h/40h e headcount
        └── scenarioSerializer.test.js           # Testes de migração legada, exportação/validação JSON e geração CSV
```

**Structure Decision**: Mantém a raiz da aplicação Vite em `roadmap-react/roadmap-react/` (preservando o `node_modules` já instalado e o servidor de desenvolvimento HMR ativo sem conflitos de bloqueio de arquivos no Windows), adicionando um `package.json` leve na raiz do repositório para permitir rodar `npm run dev`, `npm run build` e `npm test` de qualquer nível de pasta, e organizando `src/` nas camadas `data/`, `domain/`, `hooks/`, `components/` e `styles/` acompanhadas de `tests/`.

## Complexity Tracking

*Nenhuma violação de constituição ou complexidade acidental identificada — tabela não aplicável.*
