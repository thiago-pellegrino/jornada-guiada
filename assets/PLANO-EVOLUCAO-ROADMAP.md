# Plano de Evolução e Modernização — Simulador de Roadmap & Capacity

> **Referências de base deste plano:**
> - **Protótipo atual:** `roadmap-react/roadmap-react/` (`React + Vite`, visual de planilha Excel)
> - **Modelagem de domínio:** `SEMANAS.xlsx` (abas `C0-ROADMAP`, `C1-ROADMAP` e `SEMANAS`)
> - **Design System alvo:** `DESIGN-SYSTEM-FRONTEND.md` (*NextPrev — Portal do Gestor*, seções 4 a 21)
> - **Referência visual direta:** `7f515558-e93e-4406-beca-90b410e75432.png` (*Tela "Simulador gráfico de renda futura"*)

---

## 1. Diagnóstico do Estado Atual (`As-Is`)

### 1.1 Limitações Visuais e de Experiência (UX/UI)
1. **Estética de planilha bruta:** Uso de `Arial 13px`, bordas pretas sólidas (`#111`), cabeçalhos cinza-escuro (`#737373`), células verdes saturadas (`#91d57a`) e coluna de `FREEZING` em vermelho puro (`#ff0b0b`), sem hierarquia visual executiva nem aderência aos tokens do portal.
2. **Ausência de leitura executiva (KPIs e diagnóstico):** O gestor precisa contar quadrados verdes manualmente para descobrir quando cada Squad termina, quantas features cabem antes do *Freezing* (`17/12/2026`) ou qual Squad é o gargalo do projeto.
3. **Estouro silencioso de horizonte:** O calendário possui **20 semanas úteis** planejáveis (`S07` a `S26`, descontando `S05/S06` já decorridas e `FREEZING`). Na configuração inicial (`56h/US` e `40h/pessoa`), apenas a **Squad A** conclui no prazo; as **Squads B (50 sem), C (48 sem) e D (41 sem)** (em semanas inteiras, como no protótipo) estouram o limite de Dezembro e suas últimas features simplesmente ficam em branco na tabela, parecendo ter `0` semanas alocadas.
4. **Falta de controles ergonômicos de simulação:** Os inputs numéricos estão escondidos dentro de células minúsculas (`44px`–`58px` de largura) da tabela, sem *sliders* de sensibilidade, sem comparação entre cenários e sem feedback de impacto em tempo real.

### 1.2 Dívidas Funcionais e Técnicas Identificadas
1. **Divergência entre `SEMANAS.xlsx`, `README.md` e `src/main.jsx`:**
   - **Planilha `C0-ROADMAP` vs `C1-ROADMAP`:** `C0` adota `30h/semana` por pessoa (`D5 = 30`), enquanto `C1` e o `main.jsx` adotam `40h/semana` — hoje esse parâmetro é fixo no código (`HOURS_PER_PERSON = 40`).
   - ** Marcos da aba `SEMANAS` ausentes na UI:** A planilha define marcos claros de ciclo de vida (`DEV` na S01, `ESTAMOS AQUI` na S06, `HOMOLOGAÇÃO` na S21 e `PRODUÇÃO` na S23) que não aparecem de forma semântica no protótipo React.
   - **Funcionalidades descritas no `README.md` desativadas:** Edição manual na grade semanal, cálculo de *overcapacity*, duplo clique para auto-distribuir feature e clique direito para limpar foram substituídos por uma grade estática (`readonly-grid`), deixando classes CSS órfãs em `styles.css` (`.capacity-meter`, `.week-over`, `.selected-row`).
   - **Arredondamento pessimista (`Math.ceil` exclusivo):** `buildAutomaticSchedule` reserva semanas inteiras exclusivas por feature sem aproveitar a capacidade residual da última semana na feature seguinte.
2. **Estrutura de projeto e dependências:**
   - Aninhamento duplicado de diretórios (`roadmap-react/roadmap-react/`).
   - `package.json` aponta dependências para `"latest"` sem versões travadas de referência e sem `vite.config.js` explícito.
   - Código monolítico em um único arquivo (`src/main.jsx` com dados fixos, regras de negócio e renderização acoplados) e persistência em `localStorage` sem versionamento de schema.

---

## 2. Visão da Modernização (`To-Be`)

Inspirada diretamente na imagem de referência (**Simulador gráfico de renda futura**) e nas seções **6, 7, 15, 18, 19, 20 e 21** do `DESIGN-SYSTEM-FRONTEND.md`, a tela deixa de ser apenas uma planilha HTML e passa a ser um **Simulador Executivo de Roadmap & Capacity** integrado ao **Shell NextPrev**.

### 2.1 Arquitetura Visual da Página (Mapeamento Imagem → Novo Simulador)

```text
┌──────────────┬──────────────────────────────────────────────────────────────────────┐
│  SIDEBAR     │  TOPBAR: Busca (Ctrl K) · Status Simulação · Perfil · Tema · Copiloto│
│  254px       ├──────────────────────────────────────────────────────────────────────┤
│              │  [← Voltar · Planejamento]  Início › Gestão › Portfólio › Simulador  │
│  NextPrev    │                                                                      │
│  PORTAL DO   │  GESTÃO DE PORTFÓLIO · ENGENHARIA        ☆  [Exportar estudo PDF/JSON]│
│  GESTOR      │  Simulador de roadmap e capacity                                     │
│              │  Projete entregas de Ago–Dez/2026, ajuste squads e antecipe gargalos │
│  • Início    │                                                                      │
│  • Tarefas   │  ┌───────────────────────────────────────┐ ┌───────────────────────┐ │
│  • Favoritos │  │ PREMISSAS DO CICLO    CENÁRIO SIMULADO│ │ CONCLUSÃO DO BACKLOG  │ │
│              │  │ Busca/Filtro (Squad, Épico, Feature)  │ │ S26 + 29 sem (Estouro)│ │
│  ÁREAS       │  │ [Início: S07] [Jornada: 40h] [Freeze] │ │ Squad gargalo: Squad B│ │
│  ▾ Gestão    │  └───────────────────────────────────────┘ └───────────────────────┘ │
│    Portfólio │  ┌───────────────────────────────────────┐ ┌───────────────────────┐ │
│    Simulador │  │ PARÂMETROS DE CAPACIDADE    8 PESSOAS │ │ ENTREGAS ATÉ FREEZING │ │
│              │  │ Média horas/US (slider 16h–56h–120h)  │ │ 16 de 29 features     │ │
│  ACESSOS     │  │ Headcount Squad A..D (sliders 0–10)   │ │ 83 / 163 US (50,9%)   │ │
│  • Relatórios│  │ Motor: [Contínuo C1 | Inteiro C0 | Manual] │ └───────────────────────┘ │
│  • Copiloto  │  └───────────────────────────────────────┘ ┌───────────────────────┐ │
│              │  ┌───────────────────────────────────────┐ │ ⚖ Diagnóstico Squads  │ │
│              │  │ CURVA DE ENTREGA × CAPACIDADE (SVG)   │ │ Horas demandadas vs   │ │
│              │  │ [Gráfico de queima/acúmulo S05–S26]   │ │ ofertadas + sugestão  │ │
│              │  │ [S06 Atual][S14 Out][S21 Hom][S23 Prod]│ │ automática de +devs   │ │
│              │  └───────────────────────────────────────┘ └───────────────────────┘ │
│              │  ┌─────────────────────────────────────────────────────────────────┐ │
│              │  │ CRONOGRAMA DETALHADO POR SQUAD E FEATURE     [Gantt | Tabela]   │ │
│              │  │ Filtros · Épico · Feature · US · Horas · Semanas · S05 ... S26  │ │
│              │  └─────────────────────────────────────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────────────────────────────────────┘
```

### 2.2 Correspondência Direta com a Imagem de Referência e o Design System

| Elemento na Imagem (`7f515558...png`) | Equivalente no Simulador de Roadmap | Regra / Seção no `DESIGN-SYSTEM-FRONTEND.md` |
|---|---|---|
| **Shell (Sidebar + Topbar + Copiloto)** | Navegação lateral fixa (`254px`), busca `Ctrl K`, seletor de perfil, botão de tema (Sol/Lua) e botão Copiloto (`#062b4f` + dourado `#c2ac71`) | Seções **6.1–6.5**, **19.2** e **20.5** |
| **Cabeçalho (`eyebrow` + `H1` + `lede` + Exportar)** | Eyebrow `GESTÃO DE PORTFÓLIO · ROADMAP`, `H1` `32px/650` (`#263c4e`), subtítulo descritivo, favorito `☆` e botão `Exportar estudo` | Seções **4.5**, **7.1**, **7.11** e **7.13** |
| **Cartão 1: Participante (inputs base)** | **Premissas do Ciclo:** filtro rápido de Épico/Feature + 3 campos base: *Semana inicial (`S07`)*, *Horas/pessoa (`30h C0` ou `40h C1`)* e *Data de Freezing (`17/12/2026`)* | Seções **7.6** (`.surface`), **14** e **20.6** |
| **Cartão 2: Parâmetros com Sliders + Modalidade** | **Parâmetros da Simulação:** sliders sincronizados (`.slider-row`) para *Média de horas/US* e *Profissionais por Squad (A–D)* + seletor segmentado em 3 modos (*Fluxo Contínuo*, *Semanas Inteiras*, *Alocação Manual*) | Seção **20.6** (`.slider-row` acessível) e **7.1** |
| **Cartão 3: Curva SVG + 5 Cards de Marcos** | **Curva de Acúmulo de Entregas / Consumo de Horas (`S05`–`S26`):** gráfico SVG responsivo + 5 mini-cards de marcos abaixo (`S06 Atual`, `S12 Set`, `S18 Nov`, `S21 Homolog.`, `S23 Produção / Freeze`) | Seções **18.5**, **18.8** e **18.9** (`--chart-1..4`) |
| **Coluna Direita — KPI 1 (Azul-petróleo)** | **Horizonte de Conclusão / Capacidade Total:** destaque `32px/650` (`#265671`) mostrando total de horas ofertadas vs. demandadas e semana prevista de término | Seções **18.4** e **20.10.3** (`.dsh-card.kpi`) |
| **Coluna Direita — KPI 2 (Verde semântico)** | **Entregas Concluídas até o Freezing:** destaque `32px/650` (`#1f6a55` quando 100%, âmbar/vermelho se houver corte) com % de US e Features entregues até `17/12` | Seções **4.3**, **15** e **18.4** |
| **Coluna Direita — Card Analítico (`PGBL`)** | **Diagnóstico & Balanceamento por Squad:** tabela resumo por Squad (capacidade, demanda, saldo/déficit de semanas) e **recomendação automática** de quantos profissionais adicionar para zerar o atraso | Seções **7.6**, **7.14** e **20.10.6** (`.badge` `150×22px`) |
| **Novo Bloco Full-Width Inferior** | **Matriz Interativa do Roadmap (Gantt / Grade):** evolução da planilha original em `.surface` com `tabular-nums`, filtros por Squad/Épico/Status, edição de US inline, barras de Gantt semânticas e modo de alocação manual | Seções **7.17**, **14**, **18.7** e **20.10.7** |

---

## 3. Diretrizes de Design System e Tokens (`tokens.css`)

Toda estilização legada de `src/styles.css` será substituída por uma arquitetura limpa de CSS Variables sem `!important` desnecessários (resolvendo o Achado #1 da seção 16 do Design System):

1. **Tipografia:** Fonte `Montserrat` (`400`, `500`, `600`, `650`, `700`) com piso mínimo de **`12px` (`--text-xs`)** para acessibilidade (seção 15/16) e `font-variant-numeric: tabular-nums` obrigatório em contadores de US, horas, semanas, percentuais e colunas da matriz.
2. **Superfícies e Bordas:** Fundo da aplicação `--color-bg: #f7f7f8`, cartões `--color-surface: #ffffff`, bordas finas `1px solid var(--color-border)` (`#e3e5e8`), raio `--radius-xl: 13px` em superfícies e `--radius-md: 7px` em inputs/botões, espaçamento em escala de `4px` (`gap: 16px` entre cartões alinhados pelo topo conforme seção 7.6).
3. **Cores Categóricas Validadas por Squad (Seção 18.9):**
   - **Squad A (Módulo A):** `--chart-1` (`#2a78d6` — Azul)
   - **Squad B (Módulo B):** `--chart-2` (`#eb6834` — Laranja)
   - **Squad C (Módulo C):** `--chart-3` (`#1baf7a` — Verde-água)
   - **Squad D (Módulo D):** `--chart-4` (`#eda100` — Amarelo)
   *(No tema escuro `data-theme="dark"`, os tokens alternam automaticamente para os passos validados da seção 19.4).*
4. **Semântica do Período de Freezing e Alertas:**
   - Substituir o vermelho sólido `#ff0b0b` por faixa hachurada sutil com `--color-warning-bg` / `--color-danger-bg`, texto `--color-danger-text` (`#a12b2b`) e selo padronizado `.badge` (`150×22px`, seção 20.10.6) indicando `● No prazo`, `◐ Pós-Freezing` ou `⚠ Fora da janela`.
5. **Tema Claro, Escuro e Impressão (Seção 19):**
   - Atributo `<html data-theme="light|dark">` inicializado no `<head>` sem *flash* visual, persistido em `localStorage` (`theme`) e forçado para `light` em `@media print` para exportação limpa em PDF.

---

## 4. Evolução do Motor de Simulação e Regras de Negócio

O cálculo sairá de dentro do JSX para um módulo puro e testável (`src/domain/simulationEngine.js`), resolvendo todas as lacunas funcionais:

### 4.1 Três Modos de Agendamento (Seletor de Modalidade)
1. **Fluxo Contínuo (`C1` — Recomendado como padrão moderno):**
   - Compartilha horas residuais dentro da mesma semana: se uma feature consome `1,4` semana, a feature seguinte da mesma Squad aproveita os `0,6` restantes daquela segunda semana. Elimina o desperdício artificial de capacidade.
2. **Semanas Inteiras Exclusivas (`C0` — Compatibilidade com protótipo atual):**
   - Cada feature aloca `Math.ceil(esforço / capacity)` semanas inteiras exclusivas, preservando exatamente o comportamento atual para comparação.
3. **Alocação Manual / Híbrida (Resgate do `README.md`):**
   - Permite editar diretamente quantas histórias (`US`) são trabalhadas em cada célula `Feature × Semana`, bloqueando edição na coluna `FREEZING`, exibindo barra de utilização da Squad (`.capacity-meter`) e destacando semanas com *overcapacity* (`horas alocadas > capacity semanal`).
   - Suporta ações rápidas por feature: **Auto-distribuir feature** e **Limpar alocação da feature** via botões acessíveis (e atalhos de duplo clique / menu contextual).

### 4.2 Novos Indicadores Calculados em Tempo Real
- **Demanda Total (h) vs. Capacidade Total no Horizonte (h):** global e por Squad (`20 semanas úteis × capacity semanal`).
- **Taxa de Cobertura até o Freezing (`17/12/2026` — até `S24`)** e **até o Fim do Ano (`S26`)**.
- **Semanas Excedentes (Backlog Spillover):** cálculo exato de quantas semanas além de `S26` cada Squad precisaria (em vez de truncar silenciosamente no fim do array `WEEKS`), exibindo coluna resumo de **Estouro (`+N sem`)** na matriz.
- **Sugestão Automática de Headcount:** fórmula inversa `Math.ceil(esforçoTotalSquad / (semanasAteFreezing * horasPorPessoa))` indicando quantos profissionais cada Squad precisa para entregar 100% do escopo até o Freezing.

### 4.3 Gestão de Cenários e Exportação (Inspirado na Seção 20.10.4)
- **Persistência versionada (`roadmap.sim.v2`)** com migração transparente caso existam dados legados (`roadmap.avg`, `roadmap.squads`).
- **Histórico / Desfazer (`Undo`)** das últimas alterações e restauração segura em dois cliques ("Clique novamente para restaurar padrão", sem `window.confirm()`, conforme seção 20.10.4).
- **Exportar / Importar Cenário:** download em `.json` (reimportável), `.csv` (compatível com Excel) e **Exportar estudo em PDF** (`window.print()` estilizado com folha `@media print` dedicada).
- **Painel Copiloto Contextual (Opcional / Demonstrativo):** drawer lateral (`410px`) que lê o estado atual da simulação e responde perguntas rápidas pré-calculadas (*"Qual squad está atrasando a entrega?"*, *"Quantos devs faltam para entregar tudo antes do Freezing?"*, *"Simular redução da média de US para 40h"*).

---

## 5. Nova Arquitetura de Pastas e Componentes

Consolidação do projeto eliminando o aninhamento duplicado (ou mantendo compatibilidade durante a transição) e separando responsabilidades:

```text
roadmap-react/
├── index.html                        # Carrega fonte Montserrat + script anti-FOUC de tema
├── package.json                      # React 19 + Vite 8 com scripts dev, build, preview, test
├── vite.config.js                    # Configuração explícita do plugin React
└── src/
    ├── main.jsx                      # Bootstrap React 19
    ├── App.jsx                       # Composição do Shell + estado global do Simulador
    ├── styles/
    │   ├── tokens.css                # Tokens consolidados NextPrev (Seções 15, 18.13 e 19.4)
    │   ├── shell.css                 # Sidebar, Topbar, Breadcrumbs, Drawer Copiloto
    │   ├── simulator.css             # Grid 2 colunas, Sliders, Cards KPI, Curva SVG
    │   ├── roadmap-matrix.css        # Gantt / Tabela detalhada sticky + modo impressão
    │   └── print.css                 # Regras @media print para "Exportar estudo em PDF"
    ├── data/
    │   └── initialRoadmapData.js     # Semanas (S05–S26 + marcos SEMANAS.xlsx) e Squads A–D
    ├── domain/
    │   ├── simulationEngine.js       # Motores C1 (contínuo), C0 (ceil) e Manual + KPIs
    │   └── scenarioSerializer.js     # Persistência localStorage v2 + Exportação JSON/CSV
    ├── hooks/
    │   ├── useSimulationState.js     # Estado com histórico (undo) e sincronização local
    │   └── useTheme.js               # Controle Claro / Escuro / Sistema (Seção 19)
    └── components/
        ├── shell/
        │   ├── Sidebar.jsx           # Menu lateral NextPrev com navegação e estado ativo
        │   ├── Topbar.jsx            # Busca (Ctrl+K), selo simulação, tema e botão Copiloto
        │   ├── PageHeader.jsx        # Voltar, Breadcrumbs, Eyebrow, H1, Favorito e Exportar
        │   └── CopilotDrawer.jsx     # Assistente lateral contextual com insights do cenário
        ├── simulator/
        │   ├── ScopePremisesCard.jsx # Horas/pessoa (30h/40h), semana inicial, busca rápida
        │   ├── ParametersCard.jsx    # Sliders sincronizados (US avg, Squads A-D) + Modo
        │   ├── ProjectionChartCard.jsx # Gráfico SVG (acúmulo/capacidade) + cards de marcos
        │   ├── KpiSummaryColumn.jsx  # Cartões KPI (Conclusão, Entregas até Freeze)
        │   └── SquadDiagnosticsCard.jsx # Tabela de gargalos + recomendação de headcount
        ├── matrix/
        │   ├── MatrixToolbar.jsx     # Filtros (Squad, Épico, Status), visão Gantt vs Tabela
        │   └── RoadmapMatrix.jsx     # Grade detalhada acessível com coluna de estouro (+sem)
        └── ui/
            ├── SliderField.jsx       # Controle deslizante + input numérico sincronizado (§20.6)
            ├── Badge.jsx             # Selo padronizado 150x22px com title automático (§20.10.6)
            ├── Icon.jsx              # Biblioteca de ícones SVG stroke 1.65 (§5)
            └── Toast.jsx             # Notificações acessíveis role="status" (§7.21)
```

---

## 6. Fases de Implementação (Roadmap de Execução)

### Fase 1 — Saneamento Estrutural e Fundação do Design System
- Resolver a estrutura de pastas de `roadmap-react` e adicionar `vite.config.js` + scripts padronizados.
- Implementar `tokens.css` completo com os tokens das seções **15**, **18.13** e **19.4** (temas Claro, Escuro e Sistema), carregamento tipográfico `Montserrat` e regras globais de foco (`#56bbb2`) e `prefers-reduced-motion`.
- Construir os primitivos de UI (`Icon`, `Badge` `150×22px`, `SliderField` sincronizado, `Toast`).
- **Critério de aceite:** Build limpa no Vite, alternância de tema Claro/Escuro funcionando sem *flash* e contraste WCAG AA validado nos tokens.

### Fase 2 — Motor Matemático de Simulação (`simulationEngine`)
- Extrair dados de `SEMANAS.xlsx` enriquecidos com as datas reais (`C1-ROADMAP`) e marcos de fase (`DEV`, `ESTAMOS AQUI`, `HOMOLOGAÇÃO`, `FREEZING`, `PRODUÇÃO`).
- Implementar os 3 modos de cálculo (*Fluxo Contínuo C1*, *Semanas Inteiras C0* e *Manual com Overcapacity*), cálculo de estouro pós-`S26` e recomendação automática de headcount por Squad.
- Implementar `useSimulationState` com *Undo*, migração do `localStorage` antigo e restauração em dois cliques.
- **Critério de aceite:** Cálculos batem 100% com as fórmulas das abas `C0-ROADMAP` (`30h`) e `C1-ROADMAP` (`40h`) da planilha `SEMANAS.xlsx`, expondo explicitamente o déficit de semanas das Squads B, C e D.

### Fase 3 — Shell NextPrev e Layout de Simulador em 2 Colunas
- Implementar `Sidebar`, `Topbar` (com atalho `Ctrl+K` focado na busca/filtro de features, seletor de tema e botão Copiloto) e `PageHeader`.
- Implementar a coluna esquerda de simulação (`ScopePremisesCard` + `ParametersCard` com sliders e seletor de modalidade) e a coluna direita executiva (`KpiSummaryColumn` + `SquadDiagnosticsCard`), seguindo fielmente a composição visual de `7f515558-e93e-4406-beca-90b410e75432.png`.
- **Critério de aceite:** Qualquer movimento nos sliders de horas/US ou de headcount das Squads recalcula instantaneamente os cartões KPI e o diagnóstico lateral a 60fps.

### Fase 4 — Curva Gráfica SVG e Matriz Detalhada (Gantt / Tabela)
- Construir `ProjectionChartCard`: curva SVG responsiva comparando evolução acumulada de entregas vs. teto de capacidade até o Freezing, acompanhada dos cartões de marcos na base (espelhando o gráfico inferior da imagem de referência) e `aria-describedby` acessível.
- Construir `RoadmapMatrix` + `MatrixToolbar`: grade moderna dentro de `.surface` com colunas `sticky`, `tabular-nums`, filtros combinados (Squad, Épico, Status de prazo), edição inline de `Qtd. US`, modo de alocação manual por célula semanal e sinalização visual clara para features que ultrapassam `S24 (Freezing)` ou `S26`.
- **Critério de aceite:** Zero truncamento silencioso de features pós-Dezembro; alternância fluida entre visão resumida e matriz completa; navegação integral por teclado.

### Fase 5 — Copiloto Contextual, Exportação (PDF/JSON/CSV) e Polimento A11y
- Implementar `CopilotDrawer` lateral (`410px`) com sugestões rápidas de otimização de capacidade (ex.: *"Aplicar balanceamento sugerido para entregar até 17/12"* com botão de confirmar/desfazer proposta, seguindo a seção 8.4/20.5).
- Implementar exportação de cenário (`.json`, `.csv`) e folha `@media print` para o botão **Exportar estudo em PDF**.
- Revisão completa de acessibilidade (landmarks, `aria-live`, alvos de toque, responsividade nos 5 breakpoints `480 / 720 / 1024 / 1280 / 1650px`).
- **Critério de aceite:** Auditoria de acessibilidade e responsividade aprovada em desktop, tablet e mobile, com atualização completa do `README.md`.

---

## 7. Decisões Recomendadas (Pontos de Alinhamento)

Para iniciar a codificação imediatamente sem bloqueios, o plano adota os seguintes padrões recomendados (ajustáveis conforme sua preferência):

| # | Ponto | Decisão Padrão no Plano | Alternativa |
|---|---|---|---|
| 1 | **Pasta raiz do app React** | Promover o projeto para `roadmap-react/` (eliminando a subpasta duplicada `roadmap-react/roadmap-react/`) | Manter o caminho duplo atual para não alterar scripts externos |
| 2 | **Jornada semanal padrão** | Iniciar em **`40h/pessoa`** (igual ao `main.jsx` e `C1-ROADMAP`), mas com seletor rápido `30h (C0)` / `40h (C1)` / customizado | Iniciar em `30h/pessoa` (`C0-ROADMAP`) |
| 3 | **Motor de cálculo inicial** | **Fluxo Contínuo (`C1`)** como padrão no seletor, mantendo **Semanas Inteiras (`C0`)** e **Manual** a um clique | Manter `Semanas Inteiras (C0)` como opção inicial |
| 4 | **Shell de navegação** | Incluir **Shell completo NextPrev** (Sidebar retrátil + Topbar + Copiloto) igual à imagem de referência, com botão de expandir tela cheia para a matriz | Renderizar apenas o miolo da página sem Sidebar/Topbar |

---

## 8. Como Prosseguir com Spec Kit (`/spec`)

Com este plano salvo na raiz do projeto, você pode tanto pedir a implementação direta fase a fase quanto formalizar a especificação no **Specify** recém-configurado usando:

- `/speckit-specify Modernizar o protótipo roadmap-react seguindo o PLANO-EVOLUCAO-ROADMAP.md, DESIGN-SYSTEM-FRONTEND.md e a imagem de referência na raiz`
- Seguido de `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`.
