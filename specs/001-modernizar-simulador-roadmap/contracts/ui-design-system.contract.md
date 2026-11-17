# Contract: UI, Design System NextPrev & Acessibilidade

**Reference**: `DESIGN-SYSTEM-FRONTEND.md` (Seções 4–21) + `7f515558-e93e-4406-beca-90b410e75432.png`

---

## 1. Tokens e Temas (`src/styles/tokens.css`)

- **Inicialização anti-FOUC**: Script inline no `<head>` de `index.html` resolve `data-theme="light|dark"` a partir de `localStorage.getItem('theme')` (ou `prefers-color-scheme`) antes do primeiro *paint* (§19.3).
- **Tipografia**: Família `Montserrat` (`400, 500, 600, 650, 700`); piso informativo estrito de **`12px` (`--text-xs`)**; `font-variant-numeric: tabular-nums` aplicado em todos os KPIs, inputs numéricos, badges numéricos, contagens e células da matriz (§4.5, §15).
- **Paleta Categórica Fixa por Entidade (§18.9 / §19.4)**:
  - `Squad A` → `var(--chart-1)`
  - `Squad B` → `var(--chart-2)`
  - `Squad C` → `var(--chart-3)`
  - `Squad D` → `var(--chart-4)`
  *(Filtrar uma Squad na matriz ou no gráfico nunca altera a cor atribuída às demais).*

---

## 2. Contratos de Componentes Críticos

### 2.1 `.slider-row` (`SliderField.jsx` — DS §20.6)
- Layout: `display: grid; grid-template-columns: 1fr 120px; gap: 12px` (empilha em `1fr` abaixo de `720px`).
- O `<input type="number">` é o controle canônico para teclado preciso e leitor de tela; o `<input type="range">` é sincronizado em tempo real.
- Exibe régua inferior com 3 referências textuais (`Mínimo`, `Referência/Padrão`, `Teto`), espelhando exatamente a imagem `Simulador gráfico de renda futura`.
- Validação amigável sob o controle (`.err` com `aria-describedby`), sem depender de balões nativos do navegador.

### 2.2 `.badge` (`Badge.jsx` — DS §7.10 & §20.10.6)
- **Dimensão única obrigatória**: `width: 150px; height: 22px; box-sizing: border-box; flex-shrink: 0`.
- Ponto indicador à esquerda (`::before` de `6px`, `currentColor`) + texto centralizado com `text-overflow: ellipsis`.
- Sempre define atributo `title` com o texto integral caso haja possibilidade de truncamento.
- Variantes semânticas: `.ok` (`No prazo`), `.warn` (`Pós-Freezing`), `.bad` (`Fora da janela` / `Sem capacidade` / `Sobrecarga`), `.info`/neutro (`Sem escopo`).

### 2.3 `.dsh-card.kpi` (`KpiSummaryColumn.jsx` — DS §18.4 & §20.10.3)
- Usa seletor isolado `.dsh-card.kpi` para evitar colisão de classes.
- Valor principal em `--text-2xl` (`32px`), peso `650`, `tabular-nums`, acompanhado de subtítulo comparativo com ícone + texto (nunca cor isolada) e barra/composição resumida por Squad no corpo do cartão.

### 2.4 Curva de Projeção SVG (`ProjectionChartCard.jsx` — DS §18.5, §18.11, §18.12)
- Elemento `<svg role="img" aria-labelledby="..." aria-describedby="...">`.
- Associado a uma tabela de dados equivalente dos marcos/semanas (acessível a leitores de tela e alternável via controle segmentado `Gráfico | Tabela de marcos` — §18.7).
- Pontos focáveis por teclado (`tabIndex={0}`, setas `←`/`→`, `Home`, `End`, `Esc` fecha tooltip) exibindo resumo da semana/Sprint.
- Rodapé do cartão com **5 mini-cards de marcos** (`S06 Posição Atual`, `S12 Setembro`, `S18 Novembro`, `S21 Homologação`, `S23 Produção / Freeze`), espelhando os 5 cartões inferiores da imagem de referência.

### 2.5 Confirmação em Dois Cliques para Ação Destrutiva (DS §20.10.4)
- O botão `Restaurar valores iniciais` não utiliza `window.confirm()`.
- 1º clique: altera rótulo para `"Clique novamente para restaurar padrão"`, aplica variante `.danger` e anuncia em região `aria-live="polite"`; desarma sozinho após `4000ms` ou `Esc`.
- 2º clique dentro da janela: restaura o estado inicial, empilha o estado anterior no `Undo` e dispara `Toast` confirmando a restauração.

---

## 3. Atalhos de Teclado e Landmarks (§6.1, §9, §12)

- **Skip link**: `<a class="skip-link" href="#main-content">Ir para o conteúdo principal</a>` (`z-index: 100`).
- **Landmarks**: `<aside aria-label="Navegação principal">`, `<header class="topbar">`, `<main id="main-content" tabIndex={-1}>`, `<aside id="copilot-panel" aria-labelledby="copilot-title">`, `<footer class="main-footer">`.
- **`Ctrl+K` / `Cmd+K`**: Move foco imediatamente para o campo de busca global/filtro rápido.
- **`Esc`**: Fecha popover/menu de tema aberto → fecha `CopilotDrawer` (devolvendo foco ao botão de origem `returnFocus`) → desarma botão de reset → limpa busca ativa.
- **Breakpoints consolidados (§4.11 / §16 item 8)**: `480px` (`sm`), `720px` (`md` — sidebar vira drawer, sliders empilham, 1 coluna), `1024px` (`lg` — empilha coluna lateral executiva abaixo dos parâmetros se espaço insuficiente), `1280px` (`xl` — Copiloto empurra conteúdo acima disso e sobrepõe abaixo), `1650px` (`2xl`).
