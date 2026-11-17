# NextPrev — Design System do Frontend (Portal do Gestor)

> Derivado da análise do protótipo `00 - Complementar/prototipo_v4` (versão publicada 5, exportada em 03/11/2026).
> **Atualização de 05/11/2026 (protótipo `v4/prototipo-html` após o plano de ajustes v1.1):** as alterações de layout, navegação e campos estão consolidadas na **seção 20** e referenciadas nas seções 7.6, 8.2, 9 e 16. Onde esta seção contradiz o texto original, vale a seção 20.
> **Atualização de 09/11/2026:** ficha do participante (bloco fixo, abas em grade, espaçamento de 16px), modais com participante selecionado e descritivos "Cadastrar e editar" estão na **seção 21**; ela prevalece sobre as seções 7 e 20 onde divergirem.
> **Atualização de 05/11/2026 (noite):** botões nas ações de linha, ícones do Dashboard, cartão KPI, simulação de dados, campo de texto livre, tamanho único dos selos, altura das linhas das listas e contagem do Mapa do menu estão na **seção 20.10**; ela substitui a regra de ação de linha como link de 20.7-A.
> Este documento descreve o que o protótipo **realmente implementa** (CSS efetivo após a cascata) e, quando o protótipo é inconsistente, indica a **decisão recomendada** para o frontend de produção.

---

## 1. Escopo e fontes da análise

| Fonte (em `prototipo_v4/codigo_fonte/`) | O que foi extraído |
|---|---|
| `dist/index.html` | Estrutura do shell, ordem de carregamento do CSS, landmarks, meta tags |
| `dist/style.css` | Tokens base, layout, componentes, responsividade (camada 1) |
| `dist/brand-copilot.css` | Identidade NextPrev (Montserrat), componente Copiloto (camada 2) |
| `dist/light-theme.css` | Tema claro vigente — sobrescreve camadas 1 e 2 (camada 3) |
| `dist/copilot-voice.css` | Entrada por voz do Copiloto (camada 4) |
| `dist/app.js`, `navigation.js` | Padrões de página, roteamento, estados, atalhos de teclado, persistência |
| `dist/icons.js`, `menu-icons.js` | Biblioteca de ícones e mapeamento ícone ↔ assunto (87 grupos) |
| `data/areas-base.json`, `telas.psv`, `coverage.json` | Taxonomia (áreas, grupos, telas), cores de área, cobertura |
| `README.md`, `LEIA_ME.txt` | Decisões de produto por versão (v3 marca/Copiloto, v4 tema claro/ícones, v5 voz) |

**Limites desta análise.** O protótipo é de **navegação** (916 processos, 9 áreas operacionais + 4 acessos comuns, 87 grupos, 255 agrupamentos de tela). Ele **não** contém formulários de dados, tabelas editáveis, modais de confirmação, gráficos ou fluxos de aprovação. Esses componentes são especificados na seção 14 como extensões **derivadas dos tokens existentes**, claramente marcados como *proposta* — não como algo observado.

---

## 2. Princípios de design (inferidos)

1. **Navegação primeiro.** Todo conteúdo é alcançável em até 4 níveis: Área → Grupo → Tela → Processo. Breadcrumbs, mapa do menu, busca global e favoritos sempre disponíveis.
2. **Superfície clara e silenciosa.** Fundo cinza muito claro, cartões brancos, bordas finas em vez de sombras. Cor é usada com parcimônia (seleção, links, estado).
3. **Densidade moderada, texto pequeno.** Interface de gestor, informativa; hierarquia feita por peso e tamanho, não por cor.
4. **Honestidade de estado.** Tudo que é demonstração é rotulado ("Protótipo de navegação", "Demonstração interativa"). Cobertura ≠ implementação.
5. **Assistente transversal.** O Copiloto está sempre a um clique (topo, faixa inicial, contexto de cada tela/processo) e acompanha a navegação.
6. **Acessível por padrão.** Skip link, landmarks, `aria-current`, `aria-pressed`, foco visível, `prefers-reduced-motion`, ícones decorativos.
7. **Nomes originais preservados.** Títulos e números dos processos do catálogo nunca são reescritos na UI.

---

## 3. Arquitetura de estilos e cascata

O protótipo carrega **quatro folhas em sequência**; cada uma sobrescreve a anterior:

```
style.css  →  brand-copilot.css  →  light-theme.css  →  copilot-voice.css
(base/escuro)  (marca + Copiloto)    (TEMA CLARO VIGENTE)   (voz)
```

**Consequência importante:** o valor *efetivo* de qualquer token é o da última folha que o define. Valores de `style.css` (sidebar escura `#102b3a`, `--teal:#137c76`) **não estão mais em uso** visualmente. Este documento lista apenas os valores efetivos.

**Recomendação para produção:** consolidar em uma única camada de tokens (`tokens.css`) + componentes, eliminando as sobrescritas e os `!important` (ex.: `.icon-tile{...!important}`). A seção 15 traz o arquivo de tokens consolidado.

---

## 4. Design tokens

### 4.1 Cores — neutros e texto (efetivos)

| Token (protótipo) | Valor | Uso |
|---|---|---|
| `--bg` | `#f7f7f8` | Fundo da aplicação (`body`) |
| `--surface` | `#ffffff` | Cartões, topbar, sidebar, painéis |
| `--ink` | `#303943` | Texto base (corpo) |
| `h1` (override) | `#263c4e` | Título de página |
| `.area-card h2` | `#344658` | Título de cartão de área |
| `--muted` | `#707780` | Texto secundário, descrições |
| `--nav-muted` | `#7b8189` | Texto secundário na navegação |
| `--line` | `#e3e5e8` | Bordas de cartões e divisores |
| `#e2e5e8` | — | Borda direita da sidebar |
| `#eceef0` | — | Divisores internos (brand, footer da sidebar) |
| `#e6e8eb` | — | Borda inferior da topbar |
| `#f1f3f5`, `#f0f2f5`, `#f5f6f7` | — | Fundos neutros de ícone, hover de item, chips |
| `#eef0f3` / `#edf0f4` | — | Fundo de item ativo / atual |
| `#939ba4` | — | Texto do rodapé, metadados |

### 4.2 Cores — marca e ação

| Papel | Valor | Onde aparece |
|---|---|---|
| **Primária (links, ação, seleção)** `--teal` | `#265671` | Botão primário, links "quiet", ícone ativo (nome histórico "teal"; hoje é azul-petróleo) |
| Primária — texto de destaque | `#183c56` | Item de menu ativo, `current` |
| Primária — acento de navegação | `#345c78` | Borda esquerda 3px do item ativo, ícone ativo |
| Primária — hover | `#1e3f58`, `#244b67` | Hover de item/subitem |
| **Navy de marca** | `#062b4f` | Botão "Copiloto" (topo), emblema do Copiloto, gradiente da marca |
| Navy — hover / expandido | `#10425f` / `#0d5666` | Estados do botão Copiloto |
| **Dourado de marca** | `#c2ac71`, `#d5bd7e`, `#b79a55` | Acento do Copiloto (ícone, barra lateral do callout) |
| Foco | `#56bbb2` | Anel de foco global (3px) |
| Foco no Copiloto | `#4697a8` | Anel de foco (2px) dentro do painel |
| Envio / confirmação do Copiloto | `#0a526b` → `#063957` (hover), `#0c5c6a` | Botão enviar, confirmar proposta |

> **Inconsistência a resolver:** o protótipo mistura três famílias de azul-petróleo (`#265671` tema claro, `#187e86`/`#0a526b` Copiloto, `#137c76` legado). Em produção, adotar **uma** primária (`--color-primary-600: #265671`) e uma de marca/assistente (`--color-brand-900: #062b4f`).

### 4.3 Cores — semânticas (observadas)

O protótipo tem poucas cores semânticas, todas suaves:

| Semântica | Fundo | Texto/ícone | Borda | Origem |
|---|---|---|---|---|
| Informação (`.note`) | `#f0f3f5` | `#627585` | `#dfe5e9` | `.note` |
| Sucesso (`.proposal-done`) | `#e8f3ef` | `#2c7461` | — | Copiloto — confirmação |
| Neutro/cancelado (`.proposal-done.cancelled`) | `#eef1f3` | `#738893` | — | Copiloto — descarte |
| Aviso/demonstração (`.demo-tag`, dourado) | `#f8f4e9` | `#8d7540` | `#ece2c7` | Selo "DEMONSTRAÇÃO" |
| Aviso de arquivo (`.file-notice`) | — | `#906e33` | — | Anexo |
| Favorito selecionado (`.star.selected`) | ícone preenchido `#f6edd6` | `#b18a3c` | — | Estrela |
| Status ativo (`.status-dot`) | `#8ba698` | — | — | Rodapé da sidebar |

**Ausentes no protótipo (propor, ver seção 15):** erro/perigo, aviso forte, sucesso forte, estados de validação.

### 4.4 Cores de área (taxonomia)

Definidas em `areas-base.json` como `--area-color` por área:

| Área | `id` | Cor | Ícone |
|---|---|---|---|
| Previdência | `previdencia` | `#167c77` | `users` |
| Investimentos | `investimentos` | `#367cac` | `chart` |
| Empréstimos | `emprestimos` | `#4d73aa` | `handshake` |
| Financeiro | `financeiro` | `#a07838` | `wallet` |
| Contabilidade | `contabilidade` | `#7064a3` | `book` |
| Atendimento | `atendimento` | `#b46d50` | `headset` |
| Gestão da Entidade | `gestao` | `#637763` | `building` |
| Jurídico | `juridico` | `#866b92` | `scale` |
| Governança | `governanca` | `#1c7b85` | `compass` |
| Documentos *(acesso comum)* | `documentos` | — (fallback `#66808c`) | `folder` |
| Relatórios *(acesso comum)* | `relatorios` | — (fallback `#66808c`) | `report` |
| Administração do Sistema *(acesso comum)* | `administracao` | — (fallback `#66808c`) | `settings` |

**Achado:** no tema claro vigente, `--area-color` **quase não é visível** — `light-theme.css` força `.icon-tile{background:#f1f3f5!important;color:#576f86!important}` e `.map-area h2 svg{color:#587189}`. As cores de área só continuam no CSS de `color-mix` do `style.css`, anulado pelo `!important`. A decisão de produto da v4 foi **neutralizar a cor por área**.
**Recomendação:** manter as cores de área como token disponível (badges de módulo e filtros), mas **não** usá-las em ícones de navegação, preservando a decisão visual da v4. Para **gráficos de séries**, usar a paleta validada da seção 18.9: as cores de área são próximas entre si e não passam nos testes de separação.

### 4.5 Tipografia

| Item | Valor |
|---|---|
| Família principal | **Montserrat** (Google Fonts; pesos 400, 500, 600, 650, 700) |
| Fallback | `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` |
| Base | `14px` / `line-height 1.5` |
| `font-synthesis` | `none` (não sintetiza negrito/itálico) |
| Numerais tabulares | `font-variant-numeric: tabular-nums` em números de processo e tabelas |

**Escala observada (efetiva):**

| Papel | Tamanho | Peso | Tracking | Observações |
|---|---|---|---|---|
| H1 página | 32px (29px com ícone; 28px ≤950px; 27px ≤720px) | 650 | −0.9px | Cor `#263c4e` |
| H1 "não encontrado" | 28px | 650 | — | |
| Título de destino | 22px (20px mobile) | 650 | — | `.destination h2` |
| H2 seção | 18px | 650 | −0.3px | Base |
| Título de cartão de área | 16px (14px mobile) | 650 | −0.2px | |
| Título de cartão de grupo/tela | 15px | 650 | — | |
| Subtítulo de superfície | 14px | 650 | — | `.surface-head h2` |
| Corpo | 14px | 400 | — | |
| Lede (descrição de página) | 14px (13px mobile) | 400 | — | cor `--muted`, `max-width 660px` |
| Item de menu | 12px (11px legado) | 400 / 600 ativo | — | |
| Subitem de menu | 11px (12px mobile) | 400 / 600 atual | — | |
| Descrição de cartão | 12px | 400 | — | `line-height 1.6` |
| Botão | 12px | 400 | — | |
| Metadados / rodapé | 10–11px | 400 | — | |
| Micro-rótulos | 8–9px | 600–700 | +1 a +2px, caixa alta | `eyebrow` (10px), `nav-label` (9px), `info-label` (9px), selos |

> **Risco de acessibilidade:** o protótipo usa muito texto entre **8px e 11px**, abaixo do recomendado (WCAG não fixa mínimo, mas <12px compromete legibilidade e zoom). **Recomendação para produção:** piso de **12px** para qualquer texto informativo; 10–11px apenas em rótulos em caixa alta ≥ 600. Ver escala consolidada na seção 15.

### 4.6 Espaçamento

O protótipo **não usa escala fixa**: há valores como 5, 6, 7, 9, 11, 13, 15, 17, 19, 21, 23. Os mais recorrentes:

| Contexto | Valor |
|---|---|
| Padding horizontal da área principal | 38px (25px ≤1200px; 20px ≤720px) |
| Padding vertical da área principal | 37px topo / 42px base (46px topo ≥1650px) |
| Padding de cartão | 21–23px |
| Padding de `surface` | 22px |
| Gap de grades de cartões | 15–16px (12px ≤1200px; 11px ≤720px) |
| Gap interno de ações | 8–13px |
| Altura da topbar | 77px (67px ≤720px) |
| Altura mínima de item de menu | 43px |
| Área de toque de botões de ícone | 32–34px |

**Recomendação:** adotar escala de **4px** (4, 8, 12, 16, 20, 24, 32, 40, 48) e mapear os valores acima ao mais próximo (seção 15).

### 4.7 Raio de borda

| Token | Valor | Uso |
|---|---|---|
| `--radius` | 13px | Cartões, superfícies, listas |
| — | 15px | Tile de ícone grande no cabeçalho |
| — | 12px | Callout/emblema do Copiloto |
| — | 9–10px | Ícone de grupo, itens de busca, `process-detail`, botão Copiloto |
| — | 7–8px | Botões, inputs, itens de menu, chips de sugestão |
| — | 4–6px | Chips, tags, kbd |
| — | 50% | Avatar, status-dot |

### 4.8 Elevação (sombras)

O tema claro é deliberadamente **plano**: hierarquia por borda de 1px, sombras quase invisíveis.

| Nível | Valor | Uso |
|---|---|---|
| 0 | `none` + borda `1px solid var(--line)` | Padrão |
| 1 (repouso) | `0 2px 7px #202c3803` | `--shadow` (≈1% de opacidade) |
| 2 (hover de cartão) | `0 4px 14px #21374b06` | Hover de cartões (+ `translateY(-3px)` nos cartões de área) |
| 3 (painel lateral) | `-10px 0 35px #182d410a` | Painel do Copiloto (≥1280px) |
| 3b (painel sobreposto) | `-16px 0 50px #062b4f26` | Copiloto sobreposto (<1280px) |
| 4 (toast) | `0 7px 25px #102b3a22` | Toast |
| Foco | `outline: 3px solid #56bbb2; outline-offset: 3px` | Todos os interativos |

### 4.9 Movimento

| Token | Valor |
|---|---|
| Transição de cartão | `transform .15s, border-color .15s, box-shadow .15s` |
| Transição de item de menu | `background .15s` |
| Sidebar mobile | `transform .2s` |
| Toast | `.2s`; permanece 2300ms |
| Rotação do chevron | `rotate(90deg)` ao abrir (sem transição explícita) |
| **Redução de movimento** | `@media (prefers-reduced-motion: reduce)` zera transições e `scroll-behavior` |

### 4.10 Camadas (z-index)

| Camada | z-index |
|---|---|
| Sidebar | 30 |
| Backdrop mobile (`.mobile-shade`) | 25 |
| Painel do Copiloto | 50 |
| Toast | 80 |
| Skip link | 100 |

### 4.11 Breakpoints

| Nome | Regra | Mudanças principais |
|---|---|---|
| `xl-wide` | `min-width: 1650px` | Mais respiro vertical, cartões de área mais altos |
| `desktop` | padrão | Sidebar 254px, grade de áreas 3 colunas |
| `lg` | `max-width: 1280px` / `1279px` | Copiloto vira overlay; esconde "Protótipo de navegação" |
| `md-lg` | `max-width: 1200px` | Sidebar 234px; mapa em 2 colunas |
| `md` | `max-width: 1150px` | Faixa de acessos comuns 2 col.; tabela com `min-width 690px` |
| `tablet` | `max-width: 1020px` / `950px` | Áreas em 2 col.; layout de rotina em 1 col.; oculta kbd e avatar |
| `mobile` | `max-width: 720px` | Sidebar vira drawer; grades em 1 col.; topbar 67px |
| `xs` | `max-width: 360px` | Ajustes de botão de voz |
| Altura | `max-height: 700px` | Compacta cabeçalho/rodapé do Copiloto |

> Os breakpoints do protótipo são muitos e sobrepostos (1020/1150/1200/1279/1280). **Recomendação:** consolidar em 5 (`sm 480`, `md 720`, `lg 1024`, `xl 1280`, `2xl 1650`).

### 4.12 Dimensões estruturais

| Elemento | Valor |
|---|---|
| Largura da sidebar | 254px (234px ≤1200px; 270px drawer mobile) |
| Altura da topbar | 77px (67px mobile) |
| Largura máx. do conteúdo | 1460px (centralizado) |
| Largura do painel do Copiloto | 410px (`min(410px,100vw)` mobile) |
| Largura da coluna lateral (`info-panel`) | 265px (235px ≤1200px) |
| Largura máx. da busca | 460px |
| Largura máx. do lede | 660px |

---

## 5. Iconografia

- **Biblioteca própria** (`icons.js`): ícones SVG em linha, `viewBox 24×24`, injetados por `icon(nome, classe)`.
- **Traço:** `stroke: currentColor; stroke-width: 1.65` (1.7 na sidebar, 1.5–1.6 no Copiloto), `fill: none`, `stroke-linecap/linejoin: round`.
- **Tamanho padrão:** 20px; 18px na navegação; 16–17px em subitens; 13–15px em setas/chevrons; 25px no cabeçalho de página.
- **Cor:** herdam `currentColor`; no menu `#858d96` (repouso) → `#345c78` (ativo/hover).
- **Acessibilidade:** decorativos (`aria-hidden`), sempre acompanhados de texto visível.
- **Ícones de interface:** `home, search, arrow, chevron, star, menu, info, back, check, map, report, settings, folder`.
- **Ícones de área:** `users, chart, handshake, wallet, book, headset, building, scale, compass, folder, report, settings`.
- **Ícones de assunto (87 grupos):** definidos explicitamente em `menu-icons.js` (`groupIcons[areaId][grupoId]`), ex.: `participantes→users`, `planos→file-check`, `arrecadacao→money-in`, `beneficios→hand-heart`, `atuaria→calculator`, `pagar→money-out`, `receber→money-in`, `conciliacao-bancaria→compare`.
  Os **13 grupos do Dashboard** passaram a ter ícone próprio (20.10.2); antes todos usavam o fallback `folder`.
  **Regra:** o mesmo ícone do assunto aparece no submenu, no cartão do grupo, nas telas desse grupo e no mapa do menu. Ícone nunca é escolhido por inferência de palavra-chave.
- **Marca do Copiloto:** glifo próprio (vela/ponta de seta com ponto) em viewBox 32×32, traço 1.5–1.6, cor dourada sobre fundo navy.

---

## 6. Layout base (Shell)

```
┌──────────────┬────────────────────────────────────────────┬──────────────┐
│  SIDEBAR     │  TOPBAR  (busca · ações · Copiloto · avatar)│              │
│  254px       ├────────────────────────────────────────────┤  COPILOTO    │
│  fixa        │  MAIN  (max 1460px, padding 37/38)         │  410px       │
│  brand       │   breadcrumbs → page-heading → conteúdo    │  (painel     │
│  nav         ├────────────────────────────────────────────┤   lateral)   │
│  rodapé      │  FOOTER                                    │              │
└──────────────┴────────────────────────────────────────────┴──────────────┘
```

### 6.1 Landmarks e estrutura

- `<a class="skip" href="#main">Ir para o conteúdo</a>` (visível só no foco)
- `<aside class="sidebar" aria-label="Navegação principal">` com `<nav aria-label="Áreas de trabalho">`
- `<header class="topbar">`, `<main id="main" tabindex="-1">`, `<footer class="main-footer">`
- `<aside id="copilot-panel" aria-labelledby="copilot-title" hidden>`
- Toast: `role="status" aria-live="polite"`

### 6.2 Sidebar

- Fundo `#fff`, borda direita `1px #e2e5e8`, posição fixa, rolagem apenas em `.nav-scroll`.
- **Marca:** logo `nextprev-white.png` (661×155) renderizada em tom escuro por filtro CSS; legenda "PORTAL DO GESTOR" (8px, caixa alta, tracking 1.8–2px, `#7b8490`). Separador inferior `#eceef0`.
- **Seções do menu (nesta ordem):**
  1. Itens fixos: Início, Minhas tarefas e aprovações, Favoritos
  2. Rótulo **"Áreas de trabalho"** → 9 áreas
  3. Rótulo **"Acessos comuns"** → 4 acessos
  4. Rótulo **"Conferência da proposta"** → Catálogo dos 916 processos *(específico do protótipo; não vai para produção)*
- **Acordeão:** apenas a **área ativa** expande seus grupos (`.subnav`); o chevron gira 90°.
- **Rodapé:** ponto de status, "Menu por áreas / contagem", versão (`v4`).

### 6.3 Topbar

- Esquerda (mobile): botão hambúrguer. Busca com ícone, `placeholder` "Buscar rotina, área ou número do processo…" e atalho `Ctrl K` (`<kbd>`).
- Direita: selo "Protótipo de navegação" (ponto dourado/cinza) · botão **Copiloto** (navy) · link "Mapa do menu" · avatar (iniciais, 31px).
- Com o Copiloto aberto (≥1280px), a topbar compacta: oculta o selo, o link do mapa, o avatar e o `kbd`.

### 6.4 Área principal

- `max-width: 1460px`, centralizada; cada página começa por **breadcrumbs** (quando houver) → **page-heading** (eyebrow + H1 + lede + aside opcional) → conteúdo.
- Com o Copiloto aberto (≥1280px), `.workspace` ganha `margin-right: 410px` e as grades reduzem colunas (áreas 3→2, mapa 3→2, telas 2→1).

### 6.5 Rodapé

Duas pontas: "NextPrev / Experiência do gestor" e "Cobertura do catálogo · Sem execução de operações". 10px, `#939ba4`, borda superior `--line`.

---

## 7. Biblioteca de componentes

Para cada componente: **classe(s)** do protótipo, anatomia, estados e regras.

### 7.1 Botão (`.button`)
- Base: borda `1px --line`, fundo branco, raio 7px, padding `10px 14px`, 12px, ícone 15px à direita (gap 8px).
- **Primário** (`.button.primary`): fundo e borda `--teal` (`#265671`), texto branco.
- Hover: `filter: brightness(.97)`. Desabilitado: `opacity .35` (paginação), `cursor: default`.
- **Botão de ícone** (`.icon-button`): 34×34, borda `--line`, raio 7px. Usado no hambúrguer.
- Mobile (`.title-actions .button`): texto oculto, apenas ícone (padding 8px).
- **Botão Copiloto (topo)** (`.copilot-toggle`): fundo `#062b4f`, texto branco, raio 9px, marca dourada à esquerda, subtítulo "Ao seu lado" (8px), chevron. O `light-theme.css` (carregado depois) sobrescreve o botão para fundo `#f1f4f7`, texto `#234e70` e borda `#d9e1e9`, de modo que **o estilo efetivo no protótipo v4 é o claro**; o navy só permanece no emblema do Copiloto. Em produção, definir um único estilo.

### 7.2 Link discreto (`.quiet-link`, `.open-section`)
Texto 11px na cor primária; sublinhado no hover (`.open-section:hover`). Acompanhado de seta (13px).

### 7.3 Cartão de área (`.area-card`)
- Anatomia: topo (tile de ícone 37px + seta) → H2 (16px) → descrição (12px, `max-width 270px`) → rodapé (`N grupos · N processos`, 10px).
- Padding `22px 21px 19px`; `min-height 187px`; borda `--line`; raio 13px.
- **Hover:** `translateY(-3px)`, borda `#abb9c7`, sombra nível 2.
- Grade: `repeat(3, minmax(0,1fr))` gap 15px (2 col. ≤950px; sempre 2 col. com Copiloto aberto).

### 7.4 Cartão de grupo (`.section-card`)
- Ícone do assunto (`.group-icon` 35×35, raio 9px, fundo `#f0f2f5`, ícone 20px `#5a738c`), H2 15px, descrição 12px, linha "N telas propostas · N processos →".
- Estrela de favorito absoluta (top 15px, right 14px). `min-height 140px`. Grade de 2 colunas (1 col. mobile).

### 7.5 Cartão de tela (`.screen-card`)
- Ícone do grupo, H2 15px, **pré-visualização** com até 3 processos (bullets de 3px), CTA "Ver N processos →".
- Estrela absoluta no canto. Overflow oculto. Grade de 2 colunas.

### 7.6 Superfície (`.surface`)
Contêiner branco genérico: borda `--line`, raio 13px, padding 22px. Cabeçalho `.surface-head` com título 14px e link discreto à direita. Base de "Favoritos"/"Recentes" na Home e dos grupos em "Minhas tarefas".
**Alinhamento em grade (atualizado 05/11/2026):** a regra `.surface + .surface { margin-top: 16px }` vale só para superfícies empilhadas. Dentro de `.section-grid`, `.screen-grid` e `.page-grid` o filho direto `.surface` tem `margin-top: 0`; o espaço entre cartões vem apenas do `gap` (16px). Sem isso, o cartão da coluna direita começava 16px abaixo do da esquerda. Em cada linha da grade os cartões têm o mesmo topo e a mesma altura (a grade estica as células).

### 7.7 Linha de rota compacta (`.mini-route`)
Linha com título 12px + trilha (`small` 10px `--muted`) + seta; divisor superior `#edf1f2`; hover na cor primária. Usada em favoritos recentes e processos relacionados.

### 7.8 Item de lista de rotina (`.routine-row`)
Link de largura total (padding `18px 21px`), seta à direita, estrela fora do link; hover `#f6faf9`/`#f7f9fa`; lista em contêiner com `overflow: hidden` e divisores `#e8edef`.

### 7.9 Detalhe de processo (`<details>` `.process-detail`)
- **Sumário:** número de referência (opcional, 10px tabular) · título · chevron (gira 90° aberto).
- **Aberto:** borda `#aebfce`, sumário em `#f1f4f7`, peso 550.
- **Corpo:** tags (`Processo N`, tipo de acesso), nota, lista de definição (`dl`, 150px + 1fr; 1 coluna mobile) com "Público responsável" e "Origem no catálogo", rodapé com botão do Copiloto, link "Abrir referência direta" e estrela.
- **Destaque** ao chegar por link direto: `box-shadow 0 0 0 3px #dce4ec45` + `scroll-into-view` centralizado.
- **Controle de densidade:** checkbox "mostrar número de referência" (persistido).

### 7.10 Tag / Chip / Selo
| Classe | Aparência | Uso |
|---|---|---|
| `.tag`, `.access-tag` | 9px, fundo `#eef2f5`, texto `#667b8d`, raio 4–5px | Metadados do processo |
| `.chip` | 11px, fundo `#e7efed`, raio 6px | Rótulos de grupo |
| `.result-type` | 9px caixa alta, tracking .65px, fundo `#eef2f6`, texto `#54728b` | Tipo do resultado de busca (Área/Grupo/Tela/Processo) |
| `.coverage-pill` | 11px, fundo `#f0f2f4`, borda `#dde2e7`, ícone de check | Selo "916 processos localizados" |
| `.demo-tag` | 8px caixa alta, dourado | "DEMONSTRAÇÃO INTERATIVA" |
| `.search-mark` | Destaque de termo `#e0f1eb` | Marcação de busca |
| `.badge` (+ `.ok`, `.warn`, `.bad`, `.info`) | **Tamanho único: 150 × 22 px** (ver 20.10.6), 10px/600, raio 999px, ponto de 6px à esquerda | Situação do registro em listas, fichas e dashboards |

### 7.11 Favorito (`.star`)
- Botão 32×32, ícone 17px, `aria-pressed`, `aria-label` dinâmico ("Adicionar aos/Remover dos favoritos: {nome}").
- Repouso `#9baab2`; hover fundo `#f0f3f6` + `#3d6380`; **selecionado:** ícone `#b18a3c` com preenchimento `#f6edd6`.
- Persistência em `localStorage` (`nextprev-menu-favorites`); feedback via toast.

### 7.12 Breadcrumbs (`.breadcrumbs`)
11px, `--muted`, separador chevron 12px; último item em `--ink` e sem link; `aria-label="Caminho atual"`. Formato: `Início › Área › Grupo › Tela`.

### 7.13 Cabeçalho de página (`.page-heading` + `header()`)
Eyebrow (10px, caixa alta, tracking 1.5px, 750, `#7b8791`) + H1 + lede opcional + elemento à direita (`.heading-meta`, `.coverage-pill`, estrela ou botão). Em ≤720px o ícone grande é ocultado.

### 7.14 Nota / Callout informativo (`.note`)
Fundo `#f0f3f5`, borda `#dfe5e9`, raio 9px, padding `13px 16px`, ícone `info` 17px, texto 12px. `.note-soft` (11px, `--muted`) para observações sem caixa.

### 7.15 Caixa de contagem (`.coverage-stats`)
Grade 4 colunas em uma única caixa com divisórias; número 25px/600 (`#3c627e`) + legenda 10px. Em ≤950px vira 2×2.

### 7.16 Campos de filtro (`.coverage-filters`)
- Rótulo acima (10px `--muted`), input/select altura 40px, borda `--line`, raio 7px, padding `9px 12px`, 12px.
- Foco: anel de 3px `#56bbb2`. Na linha: busca flexível + select de 240px; em ≤720px empilha.

### 7.17 Tabela (`.coverage-table`)
- Contêiner `.table-scroll` com `overflow-x:auto`, borda `--line`, raio 9px.
- Cabeçalho: fundo `#f0f2f4`, 10px/600, texto `#63788a`, `scope="col"`.
- Células: padding 14px, 11px, divisor `#e8efec`, linha em hover `#f7f9fa`. Colunas: Nº (45px, tabular), Processo (38%), Localização (32%), Acesso (tag).
- `min-width: 690px` em telas ≤1150px com rolagem horizontal.
- **Altura da linha (atualizado, 20.10.7):** a altura acompanha o conteúdo, com respiro vertical fixo; o texto nunca encosta na borda de cima nem na de baixo da linha.

### 7.18 Paginação (`.pagination`)
Botão "Anterior" · "início–fim de total" · botão "Próxima", 40 itens por página, botões desabilitados nas extremidades; rola ao topo dos resultados.

### 7.19 Resultado de busca (`.search-result`)
Cartão linha: tipo (`.result-type`) + título (13px, 550) + trilha (11px) + seta. Ordenação por relevância: nome exato → contém → telas/grupos → processos. Busca ignora acentos/caixa e aceita número ("123", "processo 123", "#123").

### 7.20 Estado vazio / sem resultado (`.no-results`, `.empty`)
Cartão branco com título (H2 28px na busca / 18px), explicação em `--muted` e, quando útil, ação primária ("Explorar áreas"). Sempre sugere o próximo passo (ex.: "Tente o número do processo…").

### 7.21 Toast (`#toast`)
Fixo, inferior central (compensando a sidebar: `left: calc(50% + 127px)`), fundo `#143c42`, texto branco 12px, raio 8px, entra por `translateY` + `opacity`, some após 2.3 s. `role="status"`, `aria-live="polite"`. Mensagens curtas: "Acesso adicionado aos favoritos."

### 7.22 Faixa de acessos comuns (`.common-strip`)
4 atalhos em grade (2 col. ≤1150px), fundo `#eef0f2`, texto `#5f6e7b`, raio 8px, ícone + nome + seta; hover `#e5e9ee`.

### 7.23 Faixa de cobertura (`.coverage-banner`)
Linha com título forte + parágrafo (11px) à esquerda e botão à direita, separada por borda superior; empilha em ≤950px.

### 7.24 Mapa do menu (`.map-area`, `.map-grid`)
Cartões por área em grade 3 col. (2 ≤1200px; 1 ≤720px): título-link com ícone, contagem, e lista de grupos com ícone do assunto + contagem de processos alinhada à direita (↗ para acessos compartilhados).

### 7.25 Painel lateral de contexto (`.info-panel`)
Coluna de 265px, `position: sticky; top: 20px`, com título da área, nome do grupo, "Outras telas deste grupo", "Conferência" e "Acesso permanente". Em ≤950px vira bloco normal; com Copiloto aberto também.

### 7.26 Item de menu e subitem (`.nav-item`, `.subnav a`)
| Estado | Estilo |
|---|---|
| Repouso | texto `#515861`, ícone `#858d96`, 12px, altura mín. 43px, raio 7px |
| Hover | fundo `#f5f6f7`, texto `#1e3f58`, ícone `#345f7b` |
| **Ativo** | fundo `#eef0f3`, texto `#183c56` (600), **borda esquerda 3px `#345c78`**, ícone `#345c78`, `aria-current` |
| Subitem | 11px, ícone 16px, padding `9px 8px`, indentado com linha vertical `#e1e4e8` |
| Subitem atual | fundo `#edf0f4`, texto `#163e5d` (600) |

### 7.27 Avatar (`.avatar`)
31px, circular, fundo `#f1f2f4`, iniciais 10px/700 `#697887`. Tooltip/`aria-label` "Ambiente demonstrativo".

---

## 8. Copiloto (assistente transversal)

### 8.1 Pontos de entrada
1. **Botão no topo** (`.copilot-toggle`, `aria-expanded`, `aria-controls="copilot-panel"`).
2. **Callout na Home e na área Assistente** (`.copilot-callout`): emblema navy + título "Seu Copiloto, em cada rotina." + parágrafo + botão "Conversar com o Copiloto →".
3. **Contexto de tela/processo** (`.copilot-context-button`): "Pedir apoio ao Copiloto", pré-carregando o processo.

### 8.2 Painel (`.copilot-panel`)
- Fixo à direita, 410px, `z-index 50`, fundo branco, borda esquerda `#e0e4e8`. ≥1280px **empurra** o conteúdo (`margin-right`); abaixo disso **sobrepõe** com sombra maior.
- **Cabeçalho:** emblema 40px + "Copiloto" (19px/650) + "Seu apoio em cada rotina" + botão fechar 32×32.
- **Contexto:** faixa "VOCÊ ESTÁ EM" (8px caixa alta) + caminho atual (truncado com reticências).
- **Modos (3, `aria-pressed`):** **Como fazer** · **Consultar** · **Preparar ação**. *(Substituído em 05/11/2026: o Copiloto não tem mais abas de modo; classifica o pedido sozinho. Ver 20.5.)*
- **Área rolável:** boas-vindas + selo "DEMONSTRAÇÃO INTERATIVA", sugestões contextuais (botões com seta), mensagens (`role="log"`).
- **Compositor:** textarea (limite 2.000 caracteres), anexar documento (apenas metadados), **Falar** (microfone), nova conversa, enviar (30×30, `#0a526b`), aviso legal 8px.
- O código guarda o elemento de origem para devolver o foco ao fechar (`returnFocus`); o `Esc` global só limpa a busca/menu quando o painel **não** está aberto, o que indica que o painel trata o `Esc` por conta própria.

### 8.3 Mensagens
- **Usuário** (`.user-message`): alinhada à direita (margem esquerda 28px), fundo `#eaf3f7`, raio `11px 11px 3px 11px`, 11px.
- **Assistente** (`.assistant-message`): autor com emblema, título 13px/600, parágrafos 11px `#597382`, passos numerados, links relacionados (`.copilot-links`) com trilha, avisos de modo.

### 8.4 Proposta de ação (modo "Preparar ação")
Cartão `.proposal-card` (fundo `#f6f9fa`, borda `#d3e2e9`, raio 10px): kicker 8px, título, lista de itens, arquivo anexo, e botões **Confirmar** (`#0c5c6a`) / **Descartar** (texto). Estados finais: `proposal-done` (verde) e `proposal-done.cancelled` (cinza). Na demonstração, só altera o estado local.
**Regra de produto:** em produção a execução segue permissões, regras e alçadas parametrizadas, direta ou com aprovação; atos pessoais e o motor de empréstimos permanecem identificados.

### 8.5 Voz
Botão **Falar** (`.copilot-voice-button`, ícone 17px, fundo `#f0f4f7`) abre prévia: fluxo "falar → revisar texto → enviar". O texto é **acrescentado** ao rascunho (respeitando 2.000 caracteres) e só envia pelo comando normal. A demonstração **não** pede microfone nem captura áudio — deixar explícito na UI.

### 8.6 Anexos
Os anexos existem no **Copiloto** (botão **📎 Anexar** ao lado de “Falar”; também arrastar e soltar sobre o painel, que ganha contorno tracejado). Só PDF, até 14 arquivos, 10 MB cada e 30 MB no total. O conteúdo é lido **no navegador**, por regras locais, e **não sai do computador**; o texto fixo do painel diz isso, e o Copiloto não cria autorização além da do usuário.

**Chip de anexo (`.cp-chip`).** Uma linha por arquivo: ícone redondo de 18 px (✓ verde = lido, … cinza = lendo, ! vermelho = erro ou recusado), nome em negrito truncado, abaixo tamanho e estado, e o botão remover × (alvo mínimo de 28 px, `aria-label` com o nome do arquivo). O estado sempre vem em texto, não só em cor.

| Estado | Texto no chip |
|---|---|
| Lendo | Lendo… |
| Lido | Lido: <tipo> (N páginas, M campos) |
| PDF sem texto | PDF sem texto (escaneado): não há OCR |
| Tipo não reconhecido | Tipo não reconhecido |
| Roteiro do apresentador | Não anexar à simulação |
| Mesmo conteúdo já anexado | Já anexado |
| Outro formato, acima de 10 MB, PDF corrompido | Só PDF · Acima de 10 MB · Erro ao abrir |

**Comportamento.** A ordem dos anexos não muda o resultado (a análise usa ordem canônica por tipo e referência). Um formulário de adesão ou uma nota fiscal por envio: dois no mesmo envio geram um aviso (`.cp-alert`) pedindo um conjunto por vez. Depois do envio o foco volta ao campo de mensagem e a região de status (`#cp-voice`, `role=status`) anuncia o resumo (“6 documentos lidos · 2 divergências a decidir”). O relatório abre no começo, não no fim. Componentes da resposta (relatório, conferência, proposta, resultado) e regras completas em 20.10.8.

---

## 9. Padrões de página

| Rota | Estrutura |
|---|---|
| `#/inicio` | Cabeçalho ("Onde vamos trabalhar?") + coverage-pill → callout Copiloto → grade de 9 cartões de área → faixa de 4 acessos comuns → 2 superfícies (Favoritos, Recentes) → faixa de cobertura |
| `#/area/{area}` | Breadcrumbs → cabeçalho (eyebrow "Área de trabalho", contagem) → notas da área → grade de cartões de grupo |
| `#/area/{area}/{grupo}` | Breadcrumbs → cabeçalho (com estrela) → resumo (telas · processos · instrução) → grade de cartões de tela |
| `#/area/{area}/{grupo}/{tela}` | Breadcrumbs → cabeçalho → nota da tela → botão do Copiloto → **layout 2 colunas**: lista de `process-detail` + `info-panel` |
| `…/processo/{id}` | Mesma tela, com o processo **aberto e destacado** |
| `#/mapa` | Cabeçalho + grade de `map-area` (áreas) + seção "Acessos comuns" + nota |
| `#/cobertura` | Cabeçalho + CSV + `coverage-stats` + nota + filtros + tabela paginada |
| `#/favoritos` | Lista de `routine-row` com estrela, ou estado vazio com CTA |
| `#/tarefas` | Nota de demonstração + 3 superfícies do cadastro (Aprovações da operação, Solicitações e análises, Documentos) + seção "Demais módulos" com 3 superfícies (Para executar, Para aprovar, Para tomar ciência). Grade de 2 colunas alinhada (ver 7.6 e 20.7) |
| Busca | Substitui o conteúdo enquanto há texto; `Esc` limpa; resultados agrupados por tipo |
| 404 | Cabeçalho "Caminho não encontrado" + botão "Voltar ao início" |

**Comportamentos de navegação:**
- Roteamento por fragmento (`#/…`); links antigos numéricos redirecionam ao grupo.
- A cada navegação: rola ao topo, foca `<main>`, atualiza `document.title` (`{Item} · NextPrev`), registra "recentes" (máx. 10).
- `Ctrl/⌘ + K` foca a busca; `Esc` fecha menu mobile/limpa busca.
- Persistência local: favoritos, recentes, preferência "mostrar números de referência".

---

## 10. Estados de interação

| Estado | Regra |
|---|---|
| **Foco visível** | `outline: 3px solid #56bbb2; outline-offset: 3px` (botões, links, inputs); `summary` usa offset −3px; no Copiloto `2px #4697a8` |
| **Hover** | Mudança de fundo/borda sutil; nunca só de cor de texto sem outro indício |
| **Ativo/atual** | Borda esquerda 3px + fundo + peso 600 + `aria-current` |
| **Selecionado (toggle)** | `aria-pressed="true"` + mudança visual (estrela dourada, modo do Copiloto) |
| **Desabilitado** | `opacity .35` (paginação) |
| **Carregando** | Não implementado (conteúdo local) → ver seção 14 |
| **Vazio** | `.no-results` / `.empty` com próxima ação sugerida |
| **Feedback** | Toast 2.3 s para ações leves; `role="status"` |

---

## 11. Responsividade

- **Desktop (>1200px):** sidebar 254px fixa; áreas em 3 colunas; Copiloto como painel empurrando o conteúdo (≥1280px).
- **Intermediário (≤1200px):** sidebar 234px; paddings reduzidos; mapa em 2 colunas; coluna lateral 235px.
- **Tablet (≤950px):** áreas em 2 colunas; layout de rotina em 1 coluna; `info-panel` vira bloco; oculta `kbd`, avatar e "Assistente" duplicado; H1 28px.
- **Mobile (≤720px):** sidebar em **drawer** (transform + backdrop `#102b3a66`), botão hambúrguer (`aria-expanded` dinâmico, rótulo "Abrir/Fechar menu"); grades em 1 coluna; topbar 67px; busca sem ícone; botões de ação só com ícone; tabela com rolagem horizontal; toast centralizado (`max-width 90%`); com Copiloto aberto, `overflow:hidden` no `body`.
- **Altura baixa (≤700px):** cabeçalho, contexto, modos e compositor do Copiloto compactam.

---

## 12. Acessibilidade

**Já atendido pelo protótipo**
- Skip link, landmarks nomeados, `main` focável (`tabindex=-1`) e focado a cada navegação.
- `aria-current` (página/área/grupo atual), `aria-pressed` (favoritos, modos), `aria-expanded`/`aria-controls` (hambúrguer, Copiloto), `role="log"` (conversa), `role="status"` (toast).
- Ícones decorativos com `aria-hidden`; nomes sempre visíveis.
- `prefers-reduced-motion` respeitado.
- Foco devolvido ao elemento de origem ao fechar o painel (`returnFocus` no código).
- Tabela com `scope="col"`; rótulos de campo associados (`label` + `aria-label`).
- Busca tolerante a acentos e por número do processo.

**Lacunas a corrigir em produção**
1. **Tamanhos de fonte 8–11px** em muitos textos (ver 4.5).
2. **Contraste:** vários cinzas de apoio (`#8a9099`, `#939ba4`, `#9baab2`, `#a5b3c0` sobre branco/cinza claro) ficam **abaixo de 4,5:1**. Meta: texto ≥ 4,5:1 e componentes/ícones informativos ≥ 3:1. Revisar com ferramenta (ver seção 15 para tokens já ajustados).
3. **Alvos de toque:** botões de 28–32px (fechar voz, remover anexo); meta ≥ 44×44 em mobile (WCAG 2.5.5 AAA) / ≥ 24×24 (2.5.8 AA).
4. **Foco no painel:** não foi verificado se o Copiloto prende o foco quando sobrepõe o conteúdo (<1280px); definir se é diálogo modal ou não modal e testar com teclado.
5. **Atualização dinâmica:** anunciar mudança de página (hoje só o foco no `main` e o título).
6. **Cor como único sinal:** garantir que estado ativo/favorito tenha também forma (já há borda esquerda e preenchimento).
7. **Fonte externa:** Montserrat vem do Google Fonts; em ambiente governamental/offline, **self-host** com `font-display: swap`.

---

## 13. Conteúdo e microcopy

- **Idioma:** pt-BR (`lang="pt-BR"`); tratamento direto e neutro ("Onde vamos trabalhar?", "Monte seus caminhos mais curtos.").
- **Contagens com plural correto:** helper `countText(n, "tela proposta", "telas propostas")` — nunca "1 telas".
- **Rótulos fixos:** "Área de trabalho", "Acessos comuns", "Minhas tarefas e aprovações", "Mapa do menu", "Favoritos", "Copiloto" (substitui "assistente" na navegação), modos "Como fazer / Consultar / Preparar ação".
- **Transparência:** sempre declarar o que é demonstração e o que o ambiente **não** faz ("Sem execução de operações").
- **Sentença final de pontuação:** títulos de processo exibidos sem ponto final (`replace(/\.$/,'')`).
- **Mensagens vazias:** explicam o motivo + sugerem ação.
- **Tipos de acesso do processo:** exibidos como tag e atribuem corretamente o público responsável (atos de outros públicos e controles automáticos não são atribuídos ao gestor).

---

## 14. Componentes ausentes no protótipo (propostas)

> **Proposta — não observados no protótipo.** Derivados dos tokens da seção 15 para que as telas funcionais do ERP/CRM (formulários, tabelas de dados, fluxos) mantenham a mesma linguagem.

| Componente | Diretrizes derivadas |
|---|---|
| **Campo de formulário** | Altura 40px, borda `--color-border`, raio 7px, 12–14px; rótulo acima 12px/600; ajuda 12px `--color-text-muted`; erro com borda e texto `--color-danger-600`, ícone + mensagem associada por `aria-describedby`; foco com o mesmo anel de 3px |
| **Seleção / checkbox / radio / switch** | `accent-color: var(--color-primary-600)` (como o checkbox do protótipo); alvos ≥ 24px |
| **Tabela de dados** | Estender `.coverage-table`: ordenação por coluna (`aria-sort`), seleção de linhas, cabeçalho fixo, linha densa 40px / confortável 48px, ações por linha |
| **Modal / diálogo** | Largura 480/640/880px, raio 13px, `z-index 60`, backdrop `#102b3a66`, foco preso, `Esc` fecha, título `h2` com `aria-labelledby` |
| **Confirmação destrutiva** | Botão `danger` (fundo `--color-danger-600`), texto descreve o efeito; nunca apenas "OK/Cancelar" |
| **Abas (tabs)** | Linha inferior 2px na cor primária no ativo, `role="tablist"`, setas do teclado |
| **Alertas** | Variantes info (existe), sucesso, aviso, erro — mesma anatomia de `.note` |
| **Skeleton / loading / progresso** | Skeleton cinza `#eef0f3`; spinner 16–20px; barra de progresso na cor primária; `aria-busy` |
| **Paginação / filtros avançados** | Reaproveitar `.pagination` e `.coverage-filters`; chips de filtro ativos removíveis |
| **Badge de status** | Rascunho (neutro), Em análise (aviso), Aprovado (sucesso), Rejeitado (erro), Pendente (info) — com ícone + texto |
| **Gráficos / KPI** | Especificado na **seção 18** (paleta categórica validada, cartões, filtros gerais e por gráfico, alternância gráfico/grid). A paleta **não** deriva mais das cores de área |
| **Fluxo de aprovação / alçada** | Timeline vertical com estados; cartão de proposta do Copiloto (`proposal-card`) como base para "confirmar ação" |
| **Seletor de datas / máscaras** | CPF/CNPJ/valores monetários/competência (`MM/AAAA`) com formatação e validação, essenciais ao domínio previdenciário |
| **Tema escuro** | Especificado na **seção 19** (botão na topbar, tokens e verificações). A v1 escura da prototipagem foi descartada; este tema é novo e derivado dos tokens semânticos |

---

## 15. Tokens consolidados recomendados (arquivo único)

> Valores efetivos do protótipo mantidos onde coerentes; ajustes sinalizados com **(ajuste)** — principalmente contraste e escala. Copiar para `tokens.css`.

```css
:root {
  /* ── Tipografia ───────────────────────────── */
  --font-sans: "Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --text-xs: 0.75rem;     /* 12px — piso (ajuste: protótipo usa 8–11px) */
  --text-sm: 0.8125rem;   /* 13px */
  --text-md: 0.875rem;    /* 14px — base */
  --text-lg: 1.125rem;    /* 18px — h2 */
  --text-xl: 1.375rem;    /* 22px — destaque */
  --text-2xl: 2rem;       /* 32px — h1 */
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 650;     /* peso de títulos do protótipo */
  --leading-tight: 1.2;
  --leading-base: 1.5;
  --leading-relaxed: 1.7;
  --tracking-title: -0.9px;
  --tracking-caps: 0.12em;

  /* ── Cores: neutros ───────────────────────── */
  --color-bg: #f7f7f8;
  --color-surface: #ffffff;
  --color-surface-subtle: #f1f3f5;
  --color-surface-hover: #f5f6f7;
  --color-surface-selected: #eef0f3;
  --color-border: #e3e5e8;
  --color-border-strong: #abb9c7;
  --color-text: #303943;
  --color-text-heading: #263c4e;
  --color-text-muted: #5f6872;     /* (ajuste) #707780 → contraste ≥ 4,5:1 */
  --color-text-subtle: #6b7480;    /* (ajuste) substitui #8a9099/#939ba4 */

  /* ── Cores: marca e ação ──────────────────── */
  --color-primary-600: #265671;
  --color-primary-700: #183c56;
  --color-primary-500: #345c78;
  --color-primary-50:  #eef2f6;
  --color-brand-900:   #062b4f;    /* navy: Copiloto/marca */
  --color-brand-700:   #10425f;
  --color-accent-gold: #c2ac71;    /* detalhe da marca; não usar para texto */
  --color-focus: #56bbb2;          /* anel de foco */

  /* ── Cores: semânticas ────────────────────── */
  --color-info-bg: #f0f3f5;     --color-info-text: #4f6475;     --color-info-border: #dfe5e9;
  --color-success-bg: #e8f3ef;  --color-success-text: #1f6a55;  --color-success-border: #c6e0d6;
  --color-warning-bg: #f8f4e9;  --color-warning-text: #7a5f28;  --color-warning-border: #ece2c7;
  --color-danger-bg: #fbeeee;   --color-danger-text: #a12b2b;   --color-danger-600: #b3302f; /* (novo) */
  --color-favorite: #b18a3c;

  /* ── Cores de área (somente dados/badges/gráficos) ── */
  --area-previdencia:   #167c77;
  --area-investimentos: #367cac;
  --area-emprestimos:   #4d73aa;
  --area-financeiro:    #a07838;
  --area-contabilidade: #7064a3;
  --area-atendimento:   #b46d50;
  --area-gestao:        #637763;
  --area-juridico:      #866b92;
  --area-governanca:    #1c7b85;
  --area-comum:         #66808c;

  /* ── Espaçamento (escala 4px) ─────────────── */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px; --space-12: 48px;

  /* ── Raio ─────────────────────────────────── */
  --radius-sm: 4px;  --radius-md: 7px;  --radius-lg: 10px;
  --radius-xl: 13px; --radius-full: 9999px;

  /* ── Elevação ─────────────────────────────── */
  --shadow-1: 0 2px 7px #202c3808;       /* (ajuste) protótipo ≈ 1% — quase invisível */
  --shadow-2: 0 4px 14px #21374b0f;
  --shadow-panel: -10px 0 35px #182d410a;
  --shadow-overlay: -16px 0 50px #062b4f26;
  --shadow-toast: 0 7px 25px #102b3a22;

  /* ── Movimento ────────────────────────────── */
  --motion-fast: 150ms; --motion-base: 200ms;
  --ease: cubic-bezier(.2, 0, 0, 1);

  /* ── Camadas ──────────────────────────────── */
  --z-sidebar: 30; --z-shade: 25; --z-panel: 50; --z-modal: 60; --z-toast: 80; --z-skip: 100;

  /* ── Layout ───────────────────────────────── */
  --sidebar-w: 254px; --sidebar-w-compact: 234px; --topbar-h: 77px; --topbar-h-mobile: 67px;
  --content-max: 1460px; --copilot-w: 410px; --aside-w: 265px;

  /* ── Breakpoints (referência; usar em @media) ─ */
  /* sm 480 · md 720 · lg 1024 · xl 1280 · 2xl 1650 */
}

/* Foco global */
:where(a, button, input, select, textarea, summary):focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
}
```

---

## 16. Achados e inconsistências do protótipo (para decidir antes de implementar)

| # | Achado | Impacto | Recomendação |
|---|---|---|---|
| 1 | Quatro folhas CSS com sobrescritas e `!important` | Manutenção; valores "mortos" | Consolidar em tokens + componentes (seção 3/15) |
| 2 | `--area-color` neutralizado pelo tema claro | Cor por área não aparece | Manter token só para dados/gráficos |
| 3 | Três azul-petróleo concorrentes (`#265671`, `#187e86`, `#137c76`) | Identidade diluída | Uma primária + uma cor de marca (navy) |
| 4 | Botão Copiloto: navy (brand) × claro (tema) | Ambiguidade de estilo | Escolher um (sugerido: navy como CTA do assistente) |
| 5 | Fontes 8–11px generalizadas | Legibilidade/acessibilidade | Piso de 12px |
| 6 | Contrastes de cinza baixos | Acessibilidade (WCAG AA) | Tokens `--color-text-muted/subtle` ajustados |
| 7 | Sombras ≈ 1% de opacidade | Hierarquia depende só da borda | Aceitável; subir levemente se houver sobreposição de cartões |
| 8 | Breakpoints demais (7+) | Complexidade | Consolidar em 5 |
| 9 | Espaçamentos fora de escala | Inconsistência | Escala de 4px |
| 10 | Comportamento de foco do Copiloto sobreposto não verificado | Acessibilidade de teclado | Definir e testar (modal × não modal) |
| 11 | Fonte via Google Fonts | Dependência externa/offline | Self-host |
| 12 | Muitos estados "demonstração" misturados à UI final | Risco de vazar para produção | Isolar com feature flag (`.demo-tag`, "Conferência da proposta", "Protótipo de navegação") — **tratado em 05/11/2026 pelo flag de ambiente (seção 20.1)** |
| 13 | Superfícies em grade com desalinhamento de 16px | Aparência desleixada | **Corrigido** (7.6 e 20.7) |
| 14 | Campos técnicos digitados pelo usuário (`codigoReferencia`, estado, auditoria) | Erro e confusão | **Corrigido**: campos derivados somente leitura (20.6) |
| 15 | Filtros sem caixa e ações de linha em estilos diferentes (botão com borda × link) | Inconsistência visual | **Corrigido** (20.7-A) |

---

## 17. Mapa de aplicação no frontend de produção

| Elemento do protótipo | Mantém na produção? | Observação |
|---|---|---|
| Shell (sidebar + topbar + main + footer) | **Sim** | Estrutura e dimensões |
| Navegação Área → Grupo → Tela → Processo | **Sim** | Alinhada às pastas de especificação 00–30 |
| Busca global + `Ctrl K` | **Sim** | Estender a registros reais |
| Favoritos / Recentes | **Sim** | Trocar `localStorage` por perfil do usuário |
| Minhas tarefas e aprovações | **Sim** | Alimentada por fila real |
| Mapa do menu | **Sim** | Útil para onboarding |
| Catálogo dos 916 processos | **Não (ferramenta de projeto)** | Mover para documentação/administração |
| Selos "Protótipo", "Demonstração" | **Não** | Remover ou condicionar |
| Copiloto | **Sim, com backend** | Respostas reais, permissões e alçadas; voz com reconhecimento real |
| Cores de área | **Parcial** | Somente badges e identificação de módulo; gráficos usam a paleta da seção 18.9 |
| Dashboards (módulo 31) | **Novo** | Seção 18 |

## 18. Dashboards analíticos (módulo 31 — `mfe-dsh`)

> **Seção acrescentada em 04/11/2026.** Resolve a lacuna "Gráficos / KPI" da seção 14 para o módulo Dashboards. Itens desta seção são **propostas** derivadas dos tokens da seção 15; não foram observados no protótipo v4. Requisitos funcionais correspondentes: `31 - Dashboards/plano-evolucao/02-Plano-Evolucao-Frontend-Telas-e-Correlacoes.md`, seções 4 a 7.

### 18.1 Forma recomendada e por que

Interface em **cinco camadas fixas**, na mesma ordem em todos os painéis: (1) cabeçalho da página, (2) **faixa de filtros gerais**, (3) **faixa de contexto** (snapshot, data-base, corte e qualidade), (4) abas do painel, (5) **grade de cartões**. A leitura vai do escopo (quem, quando, qual versão dos dados) para o resultado, e o gestor sempre sabe o que está vendo antes de interpretar o número.

| Decisão | Escolha | Alternativa descartada | Motivo |
|---|---|---|---|
| Onde ficam os filtros gerais | Faixa única no topo, fixa ao rolar | Painel lateral permanente | A `62` §6.4 pede uma faixa única; o lateral rouba largura dos gráficos e repete o menu |
| Filtros de cada gráfico | Popover no cabeçalho do cartão (gaveta em telas pequenas) | Controles sempre visíveis no cartão | Mantém o cartão limpo; só há 3 a 6 dimensões por indicador |
| Gráfico × grid | Controle segmentado **Gráfico \| Grid** no cartão, mais um alternador global | Botão "ver tabela" em outra tela | A tabela equivalente (RF-DSH-019) fica a um clique, no mesmo lugar e no mesmo snapshot |
| Organização do painel | Abas internas para painéis grandes (Folha 7, Empréstimos 5); rolagem contínua nos demais | Uma tela única com todos os gráficos | Evita páginas com dezenas de gráficos; as abas usam só filtros específicos |
| Cor dos dados | Paleta categórica validada, **fixa por entidade** | Cores de área do menu | As cores de área são parecidas entre si (teal e azul-petróleo); não passam nos testes de separação |
| Resumo | Fileira de KPIs (cartões) antes dos gráficos | Só gráficos | O gestor lê o número-chave primeiro e abre a composição depois |

### 18.2 Anatomia da página de painel

```text
┌ Cabeçalho: Dashboard › Previdência › População        [SIMULAÇÃO]  Exportar ▾ │
├ Filtros gerais (fixa) ──────────────────────────────────────────────────────────┤
│ Planos ▾  Período ▾  Data-base ▾  Competência ▾  Modo ▾  Contagem ▾  [Aplicar]  │
│ Chips: [Plano A ×] [Jan–Out/2026 ×]            Limpar específicos · Restaurar   │
├ Contexto ───────────────────────────────────────────────────────────────────────┤
│ Snapshot 04/11 18:00 · Data-base 31/10 · ● Válido      Exibir tudo como: ◉ Gráficos ○ Grids │
├ Abas: Resumo │ Proventos │ Descontos │ …                                         │
├ KPIs ───────────────────────────────────────────────────────────────────────────┤
│ [KPI 1×1] [KPI 1×1] [KPI 1×1] [KPI 1×1]                                         │
├ Grade (4 colunas) ──────────────────────────────────────────────────────────────┤
│ [Cartão de gráfico 2×1        ] [Cartão de gráfico 2×1        ]                 │
│ [Cartão de gráfico 2×2        ] [Cartão 1×1] [Cartão 1×1]                       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

| Elemento | Medida e regra |
|---|---|
| Faixa de filtros gerais | Altura 56 px (controles de 40 px); fixa abaixo da topbar (`z-index` 28, abaixo do painel do Copiloto); em ≤ 720 px vira botão **Filtros (n)** que abre gaveta |
| Faixa de contexto | 36 px; mostra snapshot, data-base, corte, modo e estado de qualidade geral |
| Grade | 4 colunas ≥ 1024 px, 2 colunas entre 720 e 1023 px, 1 coluna abaixo; espaçamento 16 px; tamanhos `1x1`, `2x1`, `2x2` (enum da `62` §6.3) |
| Largura máxima | `--content-max` (1460 px), como o restante do portal |
| Barra do Copiloto | Rodapé fixo do painel, com texto e microfone; não cobre o conteúdo (reserva 64 px) |

### 18.3 Faixa de filtros gerais

- Campos conforme `62` §6.3; cada painel mostra só os aplicáveis. Rótulo acima (12 px, 600), controle de 40 px, raio 7 px, anel de foco de 3 px (seção 7.16).
- **Aplicar** envia a consulta; mudar um filtro cancela a anterior e descarta resposta atrasada.
- Chips removíveis para cada filtro ativo. **Limpar específicos** zera só os filtros de gráfico; **Restaurar visão** volta ao estado salvo.
- Filtro vazio mostra "Todos os autorizados" (nunca em branco). Combos dependentes avisam quando limpam um valor incompatível.
- Estados: carregando (controles com `aria-busy`), erro de domínio (mensagem junto ao campo), sem permissão (campo oculto, não desabilitado).

### 18.4 Cartão de indicador (KPI)

| Parte | Regra |
|---|---|
| Título | 12 px, 600, `--color-text-muted`, máximo 2 linhas |
| Valor | 32 px (`--text-2xl`), peso 650, fonte proporcional; unidade em 14 px ao lado |
| Comparativo | Variação com **ícone + texto** ("▲ 3,2% vs. mês anterior"); verde/vermelho nunca sozinhos |
| Rodapé | Período, data-base e selo de qualidade; link **Ver composição** (abre `DSH-P18`) |
| Estados | Normal, carregando (esqueleto), sem dados, restrito (cadeado), parcial/defasado (selo de aviso), erro (com tentar de novo) |
| Corpo do cartão | O cartão do tipo "Cartão" não fica só com o número: abaixo do valor mostra a abertura por plano em barras, com legenda (ver 20.10.3) |

### 18.5 Cartão de gráfico

```text
┌ Título do indicador                      ⓘ  [Filtros (2)]  [Gráfico|Grid]  ⋯ ┐
│ Período · unidade · N                                                         │
│ ┌─────────────────────────────────────────────────────────────────────────┐   │
│ │ corpo: gráfico OU grid (mesma altura mínima, 280 px)                    │   │
│ └─────────────────────────────────────────────────────────────────────────┘   │
│ Legenda · ● Válido · Fonte: DSH-C04 · Snapshot 04/11 18:00                    │
└───────────────────────────────────────────────────────────────────────────────┘
```

- **ⓘ** abre a memória de cálculo (`DSH-P19`). **⋯** reúne Exportar (XLSX, CSV, PDF), Ver composição, Tela cheia e Copiar link.
- Borda `--color-border`, raio 10 px, fundo `--color-surface`, padding 16 px; sem sombra em repouso e `--shadow-1` ao receber foco ou estar em tela cheia.
- Selo **SIMULAÇÃO** permanente no canto quando o modo for `SIMULACAO`, no mesmo estilo do selo dourado da seção 4.3.

### 18.6 Filtros por gráfico

- Botão **Filtros (n)** (n = filtros próprios ativos) abre um popover de 360 px com **só** as dimensões da ficha do indicador, mais `top_n`, `faixas`, comparação e ordenação quando aplicáveis.
- Seção superior "Herdado do filtro geral": chips somente leitura. O filtro do gráfico só refina, nunca amplia o escopo.
- Botões **Aplicar** e **Limpar**; o cartão exibe um ponto de realce no botão enquanto houver filtro próprio.
- Em ≤ 720 px o popover vira gaveta inferior. Foco preso enquanto aberto, `Esc` fecha.

### 18.7 Alternância Gráfico ↔ Grid

- Controle segmentado de 2 opções (`role="radiogroup"`), 32 px de altura; a escolha vale só para o cartão e pode ser sobrescrita pelo alternador global. Persistência na visão salva.
- O grid usa o componente **Tabela de dados** (seção 14) com: cabeçalho fixo, ordenação por coluna (`aria-sort`), densidade 40 px, coluna numérica alinhada à direita com `tabular-nums`, unidade no cabeçalho, linha de total quando a soma faz sentido e coluna de qualidade quando houver mais de um estado.
- Colunas derivadas do tipo de gráfico: série temporal → período × séries; ponte → etapa × valor; aging → faixa × quantidade × valor; pirâmide → faixa × sexo; ranking → posição × item × valor × participação.
- Valores suprimidos (RN-DSH-034) aparecem como "•" com legenda, iguais nos dois modos. Paginação de 50 linhas (máximo 200) quando o grid vier da `API-DSH-05`.
- Alternar não refaz a consulta: o mesmo resultado alimenta gráfico e grid.

### 18.8 Catálogo de gráficos

| Tipo (fichas `62` §7) | Quando usar | Regra principal |
|---|---|---|
| Barras (45) | Comparar categorias | Horizontais quando o rótulo for longo; pontas arredondadas de 4 px na extremidade de dados |
| Linha (35) | Séries no tempo | Linha de 2 px, marcadores ≥ 8 px só nos pontos selecionados |
| Cartão/KPI (14) | Número-chave | Ver 18.4; sem gráfico se não houver série |
| Tabela (13) | Dados de referência | Usa o próprio grid |
| Ponte/waterfall (13) | Abertura → movimento → fechamento | Aumentos e reduções por ícone e rótulo, não só por cor |
| Matriz (10) / heatmap (2) | Duas dimensões | Escala sequencial de um matiz; legenda de faixas |
| Aging (10) | Faixas de atraso | Barras ordenadas por faixa (30/60/90/180+), uma só cor sequencial |
| Ranking (8) | Maiores e menores | Top N + "Outros" em cinza neutro |
| Funil (7) | Etapas de processo | Escala ordinal (ver 18.9) |
| Pirâmide (2), histograma (2), escada (1), dispersão (1), empilhadas (1) | Casos específicos | Segmentos empilhados com folga de 2 px |

Regras gerais: **nunca eixo duplo** (duas escalas viram dois gráficos ou um índice com base comum); grade e eixos discretos; no máximo 4 rótulos diretos; legenda sempre que houver 2 ou mais séries; escala começando em zero para barras; formatação pt-BR (`R$ 1,2 mi` nos eixos, valor completo no tooltip e no grid; percentuais com 2 casas).

### 18.9 Cores dos dados

As cores de área (4.4) **não** servem a gráficos de séries: várias são próximas (`#167c77` e `#1c7b85`; `#367cac` e `#4d73aa`). Para dados usar a paleta categórica abaixo, validada contra a superfície branca dos cartões (`#ffffff`).

| Slot | Matiz | Hex | Uso |
|---|---|---|---|
| `--chart-1` | azul | `#2a78d6` | 1ª série |
| `--chart-2` | laranja | `#eb6834` | 2ª série |
| `--chart-3` | verde-água | `#1baf7a` | 3ª série |
| `--chart-4` | amarelo | `#eda100` | 4ª série |
| `--chart-5` | magenta | `#e87ba4` | 5ª série |
| `--chart-6` | verde | `#008300` | 6ª série |
| `--chart-7` | violeta | `#6250d6` | 7ª série |
| `--chart-8` | vermelho | `#e34948` | 8ª série |
| `--chart-other` | cinza | `#9aa3ad` | "Outros" e dados agregados |

Resultado da validação (script de cores, superfície `#ffffff`): faixa de luminosidade, saturação mínima, separação para daltonismo (pior par adjacente ΔE 9,1) e distinção em visão normal (pior par ΔE 19,6) **passam** nas 8 cores em sequência. Apenas as **3 primeiras** passam em qualquer combinação (dispersão, mapa de calor, vários pequenos gráficos); acima disso, agrupar em "Outros" ou separar em gráficos menores. Três cores (verde-água, amarelo e magenta) ficam abaixo de 3:1 de contraste com o fundo: por isso **rótulo visível ou grid equivalente** são obrigatórios.

- A 9ª série nunca ganha cor nova.
- **A cor segue a entidade, não a posição:** um plano mantém o mesmo slot em todos os painéis; filtrar não repinta os demais.
- Sequencial (magnitude): um só matiz, do claro ao escuro — azul `#cde2fb` → `#86b6ef` → `#3987e5` → `#256abf` → `#184f95` → `#0d366b`. Ordinal (funil, faixas): começar no passo `#86b6ef`.
- Divergente (variação positiva/negativa): azul ↔ vermelho com ponto médio cinza `#f0efec`.
- No tema escuro a paleta usa passos próprios (seção 19.4), com os mesmos matizes e a mesma ordem; a rampa sequencial é invertida (baixa magnitude = escuro).
- Estados de qualidade e alertas usam as cores semânticas da seção 4.3, sempre com **ícone + texto**; nunca reutilizar para séries.

### 18.10 Estados de qualidade e de dado

| Estado | Selo | Cor semântica | Regra de exibição |
|---|---|---|---|
| `VALIDO` | ● Válido | sucesso | Sem aviso |
| `PARCIAL` | ◐ Parcial | aviso | Mostra cobertura (ex.: 2 de 3 fontes) |
| `DEFASADO` | ◷ Defasado | aviso | Mostra a última atualização |
| `SEM_DADOS` | ○ Sem dados | neutro | Estado vazio com explicação, nunca zero |
| `NAO_APLICAVEL` | — Não se aplica | neutro | Cartão recolhido |
| `RESTRITO` | 🔒 Restrito | neutro | Valor oculto; explica a permissão necessária |
| `ERRO` | ⚠ Erro | perigo | Botão **Tentar de novo** e `correlation_id` |
| Suprimido (RN-DSH-034) | • | neutro | Igual em gráfico, grid e exportação |
| `SIMULACAO` | SIMULAÇÃO | dourado | Selo fixo no painel, no cartão e na exportação |

Zero confirmado (`ZERO_CONFIRMADO`) é diferente de ausência de dado e mostra "0" com a nota "confirmado pela fonte".

### 18.11 Interação

- **Passar o mouse ou focar:** tooltip com valor, unidade, N e percentual; em linhas, cursor vertical que acompanha o eixo. Área de acerto maior que a marca.
- **Clicar ou pressionar Enter:** abre a composição no mesmo snapshot (`DSH-P18`), preservando o critério de agrupamento.
- **Teclado:** setas percorrem as marcas, `Home`/`End` vão ao primeiro e ao último ponto, `Esc` fecha tooltip e popover.
- **Atualização:** esqueleto no lugar do gráfico (sem piscar o conteúdo anterior); se a resposta atrasar mais de 10 s, mostra progresso e botão **Cancelar** (`API-DSH-04`).
- **Movimento:** transições de 150 a 200 ms, desligadas com `prefers-reduced-motion`.

### 18.12 Acessibilidade

- Cada gráfico é um `role="img"` com resumo textual e `aria-describedby` apontando para o grid equivalente (mesmo que escondido); o grid é a alternativa completa para leitor de tela.
- O significado nunca depende só da cor: legenda, rótulos diretos, ícones nos estados e textura opcional em 45° e 135° quando houver modo de contraste, impressão ou `forced-colors`.
- Foco visível em todos os controles (anel de 3 px), ordem de tab: filtros gerais → abas → cartões (título, filtros, alternador, menu) → conteúdo.
- Piso de 12 px para texto; contraste de texto ≥ 4,5:1 com os tokens da seção 15.
- O grid e a faixa de filtros precisam funcionar com zoom de 200 %, sem rolagem horizontal da página (a rolagem fica restrita ao contêiner da tabela).

### 18.13 Tokens acrescentados

```css
:root {
  /* ── Dados (gráficos) ─────────────────────── */
  --chart-1: #2a78d6; --chart-2: #eb6834; --chart-3: #1baf7a; --chart-4: #eda100;
  --chart-5: #e87ba4; --chart-6: #008300; --chart-7: #6250d6; --chart-8: #e34948;
  --chart-other: #9aa3ad;
  --chart-seq-100: #cde2fb; --chart-seq-250: #86b6ef; --chart-seq-400: #3987e5;
  --chart-seq-500: #256abf; --chart-seq-600: #184f95; --chart-seq-700: #0d366b;
  --chart-div-mid: #f0efec;
  --chart-grid: #e3e5e8;        /* = --color-border */
  --chart-axis: #abb9c7;        /* = --color-border-strong */
  --chart-ink: #303943;         /* valores e rótulos: tokens de texto, nunca a cor da série */
  --chart-ink-muted: #5f6872;

  /* ── Layout de painel ─────────────────────── */
  --filter-band-h: 56px; --context-band-h: 36px;
  --card-min-h: 280px; --card-pad: 16px; --card-gap: 16px;
  --grid-row-dense: 40px; --grid-row-comfort: 48px;
  --z-filter-band: 28;
}
```

### 18.14 Decisões em aberto

1. ~~Tema escuro~~ **Resolvido na seção 19:** botão de tema na topbar e paleta de dados com passos próprios para o escuro, validados à parte.
2. **Matiz sequencial:** o azul `#2a78d6` foi escolhido para os dados por estar validado. Usar o petróleo da marca (`#265671`) exigiria nova validação; manter o petróleo apenas no chrome do portal evita competir com a cor primária de ações.
3. **Biblioteca de gráficos:** a seção define o resultado visual, não a biblioteca; no protótipo HTML os gráficos são SVG próprio, e no `mfe-dsh` qualquer biblioteca que aceite estes tokens atende.
4. **Piso de 12 px:** o protótipo v4 usa 8 a 11 px; os dashboards adotam 12 px (achado 5 da seção 16).


## 19. Tema claro e escuro

> **Seção acrescentada em 04/11/2026.** Substitui a afirmação da seção 14 de que o tema escuro "não existe na v4". O escuro é uma **opção do usuário**; o claro continua sendo a identidade do portal e o padrão de impressão.

### 19.1 Decisão

| Item | Escolha |
|---|---|
| Opções | **Claro**, **Escuro** e **Sistema** (segue `prefers-color-scheme`) |
| Padrão | Sistema; se o navegador não informar preferência, Claro |
| Onde mudar | **Botão de tema na topbar** do shell, à esquerda do avatar (e do botão do Copiloto, se estiver visível) |
| Alcance | Todo o portal do gestor, incluindo os dashboards do módulo 31; impressão e PDF sempre em tema claro |
| Persistência | Navegador (`localStorage`, chave `theme`) agora; no perfil do usuário quando o shell tiver operação de preferências (`G-SHL-04` em `00 - Portal Admin`) |

### 19.2 Botão de tema (componente)

| Aspecto | Regra |
|---|---|
| Aparência | Botão de ícone 40 × 40 px, raio 7 px, ícone de 20 px que mostra o **tema efetivo**: sol (claro), lua (escuro); o item Sistema usa o ícone de monitor dentro do menu |
| Interação | Clique abre um menu de 3 opções (`role="menu"`, itens `menuitemradio`) com a opção atual marcada; `Enter`/`Espaço` abre, setas navegam, `Esc` fecha e devolve o foco ao botão |
| Atalho | Nenhum atalho global obrigatório; o menu fica na ordem de tab depois da busca e antes do Copiloto |
| Rótulo | `aria-label="Tema: Escuro"` (muda com a escolha) e `aria-haspopup="menu"`; ao trocar, um aviso `aria-live="polite"` informa "Tema escuro ativado" |
| Tooltip | "Tema" com o nome da opção atual |
| Mobile | Mesmo botão na topbar compacta; o menu abre como folha inferior |
| Foco | Anel de 3 px (`--color-focus`), igual aos demais controles |

### 19.3 Mecânica

1. O tema é um atributo no elemento raiz: `<html data-theme="light|dark">`, com `color-scheme` correspondente. A escolha "Sistema" resolve o valor pelo `prefers-color-scheme` e reage à mudança do sistema operacional.
2. Um script mínimo no `<head>`, antes da folha de estilos, lê `localStorage` e `prefers-color-scheme` e define `data-theme` **antes da primeira pintura**, evitando o flash de tema errado.
3. Mudar o tema em uma aba atualiza as demais pelo evento `storage`.
4. A transição é só de cores, em `--motion-fast`, e fica desligada com `prefers-reduced-motion`. Gráficos são redesenhados com os tokens novos sem refazer a consulta.
5. `<meta name="theme-color">` acompanha o fundo do tema ativo.
6. Em `forced-colors` e na impressão, os tokens do tema são ignorados em favor das cores do sistema e do tema claro.

### 19.4 Tokens do tema escuro

```css
:root[data-theme="dark"] {
  color-scheme: dark;

  /* Neutros */
  --color-bg: #0f1419;
  --color-surface: #161c23;
  --color-surface-subtle: #1c242c;
  --color-surface-hover: #202a33;
  --color-surface-selected: #26323d;
  --color-border: #2b3641;
  --color-border-strong: #62768a;      /* bordas de campos: ≥ 3:1 sobre a superfície */
  --color-text: #e6eaee;
  --color-text-heading: #f2f5f7;
  --color-text-muted: #a3afbb;
  --color-text-subtle: #8c99a6;

  /* Marca e ação */
  --color-primary-600: #2f6f99;        /* fundo de botão primário, texto branco */
  --color-primary-700: #265671;
  --color-primary-500: #7fb0d0;        /* links e ícones ativos */
  --color-primary-50:  #1c2a36;
  --color-brand-900:   #062b4f;
  --color-brand-700:   #10425f;
  --color-accent-gold: #d2b66f;
  --color-focus: #56bbb2;

  /* Semânticas */
  --color-info-bg: #1c2830;    --color-info-text: #9bb3c6;    --color-info-border: #2c3c48;
  --color-success-bg: #12302a; --color-success-text: #6fcfae; --color-success-border: #1f4d42;
  --color-warning-bg: #2e2812; --color-warning-text: #e3c17a; --color-warning-border: #4a4020;
  --color-danger-bg: #3a1b1d;  --color-danger-text: #f08a8a;  --color-danger-600: #c94a4a;
  --color-favorite: #d2b66f;

  /* Elevação: sombras quase invisíveis no escuro; a hierarquia vem da borda e da luminosidade */
  --shadow-1: 0 2px 7px #00000040;
  --shadow-2: 0 4px 14px #00000059;

  /* Dados (gráficos): mesmos matizes, passos do escuro (ver 19.5) */
  --chart-1: #3987e5; --chart-2: #d95926; --chart-3: #199e70; --chart-4: #c98500;
  --chart-5: #d55181; --chart-6: #008300; --chart-7: #9085e9; --chart-8: #e66767;
  --chart-other: #8793a0;
  --chart-seq-100: #184f95; --chart-seq-250: #256abf; --chart-seq-400: #3987e5;
  --chart-seq-500: #6da7ec; --chart-seq-600: #9ec5f4; --chart-seq-700: #cde2fb;  /* baixa magnitude = escuro */
  --chart-div-mid: #383835;
  --chart-grid: #2b3641;
  --chart-axis: #46586a;
  --chart-ink: #e6eaee;
  --chart-ink-muted: #a3afbb;
}

@media (prefers-color-scheme: dark) {
  :root:where(:not([data-theme="light"]):not([data-theme="dark"])) { /* "Sistema": repetir os tokens acima */ }
}
@media print { :root { color-scheme: light; } }
```

> O bloco `prefers-color-scheme` só vale quando o atributo `data-theme` ainda não foi definido (por exemplo, com JavaScript desligado); com o script do 19.3 o atributo sempre existe.

### 19.5 Verificações feitas

Razões de contraste calculadas (WCAG) sobre `--color-surface` `#161c23`, salvo indicação:

| Par | Razão | Exigência |
|---|---|---|
| Texto `#e6eaee` | 14,2 | ≥ 4,5 |
| Título `#f2f5f7` | 15,7 | ≥ 4,5 |
| Texto secundário `#a3afbb` | 7,7 | ≥ 4,5 |
| Texto discreto `#8c99a6` | 5,9 (5,4 sobre `surface-subtle`) | ≥ 4,5 |
| Link/ícone ativo `#7fb0d0` | 7,4 | ≥ 4,5 |
| Texto branco sobre botão `#2f6f99` | 5,5 | ≥ 4,5 |
| Texto de sucesso `#6fcfae` sobre `#12302a` | 7,6 | ≥ 4,5 |
| Texto de aviso `#e3c17a` sobre `#2e2812` | 8,5 | ≥ 4,5 |
| Texto de perigo `#f08a8a` sobre `#3a1b1d` | 6,4 | ≥ 4,5 |
| Anel de foco `#56bbb2` | 7,5 | ≥ 3 |

Paleta de dados no escuro, validada contra `#161c23` (script de cores, modo escuro): faixa de luminosidade, saturação mínima e contraste ≥ 3:1 das 8 cores **passam**; pior par adjacente para daltonismo ΔE 8,4 e em visão normal ΔE 19,3. A separação para daltonismo entre 6 e 8 é permitida apenas com codificação secundária, portanto **rótulo direto, folga de 2 px entre segmentos ou textura** continuam obrigatórios. Aplicam-se os mesmos limites do claro: só as 3 primeiras cores valem em qualquer combinação; acima disso, agrupar em "Outros" ou separar em gráficos menores.

Pendências de verificação (não executadas): contraste de todos os estados de hover e de seleção, de cada selo semântico dentro de tabelas e de cada tela do portal, e teste com leitor de tela.

### 19.6 Regras por componente

- **Superfícies:** cartões e tabelas usam `--color-surface` sobre `--color-bg`; a separação vem da borda, não da sombra.
- **Marca:** o logotipo usa a versão clara no escuro; a sidebar e o Copiloto mantêm o azul-marinho de marca como fundo, com `--color-text` por cima.
- **Ícones e SVG:** herdam `currentColor`; ilustrações com cor fixa precisam de variante escura.
- **Gráficos e KPIs:** só tokens; nenhuma cor literal em componentes de gráfico. Selos de qualidade usam os pares `*-bg` e `*-text` do tema.
- **Selo SIMULAÇÃO:** `--color-warning-bg`/`--color-warning-text`, com a mesma legibilidade nos dois temas.
- **Imagens e anexos:** não são invertidos; o fundo do visualizador de documentos segue o tema.

### 19.7 Decisões em aberto

1. A cor primária do botão no escuro (`#2f6f99`) é mais clara que a do claro (`#265671`) para manter o contraste; confirmar com a identidade visual.
2. O tema deve acompanhar o usuário entre dispositivos? Isso exige operação de preferências no shell (`G-SHL-04`).
3. Revisar o contraste de bordas de campos no tema claro: `--color-border-strong` `#abb9c7` fica em torno de 2:1 sobre branco, abaixo do 3:1 recomendado para componentes de interface.



---

## 20. Atualização de layout e componentes (05/11/2026)

Consolida o que mudou no protótipo `v4/prototipo-html` na execução do plano de ajustes v1.1. Tudo abaixo foi verificado no navegador (percurso de 2.431 rotas nos dois ambientes, 18 fluxos críticos, formulários de 964 páginas). Cores citadas por token quando existe; os valores `#hex` são os que o CSS usa hoje e estão listados em 20.9 como dívida de tokenização.

### 20.1 Ambientes: cliente × projeto
- **Flag** `?ambiente=projeto` ou `?ambiente=cliente`, gravado em `data-ambiente` no `<html>` por um script no `<head>` (antes do primeiro desenho, para não piscar) e lembrado em `localStorage` (`np-ambiente`). Padrão: **cliente**.
- **Classe `.proj-only`**: elemento que só aparece em modo projeto. Regra única: `html:not([data-ambiente="projeto"]) .proj-only, … .mapbar { display: none !important }`.
- **Escondido no modo cliente:** legenda da barra lateral, rodapé da barra lateral, selo de ambiente (`.env`), avatar, faixa de mapa (`.mapbar`), selos de estado nas telas do menu (especificado, lacuna, pendente), resumo de grupo, faixa do plano, notas técnicas e o destaque de cobertura da Home. O item **Cobertura** sai do menu e a rota redireciona.
- **Regra de produto:** nada de evidência, cobertura ou estado de projeto aparece para o cliente; a equipe ativa o modo projeto quando precisa. A Home deixou de afirmar "100% aderentes" e passou a dizer o estado real (navegável, dados simulados, validação integrada e homologação ainda não realizadas).

### 20.2 Menu e navegação
- **Grupo com uma só tela** (modo cliente): o grupo abre direto a tela, sem cartão intermediário.
- **Tela com uma só página:** **mantém** o cartão intermediário em todas as áreas, **exceto no Dashboard**, onde a tela abre direto a página (pedido do cliente). Em modo projeto nada é colapsado.
- **Links antigos** do Dashboard (`#/area/dashboard/...` e `#/p/DSH-…`) são traduzidos para a nova árvore por `legacyHash`; nenhum favorito ou "recente" antigo quebra (migração única dos dados locais).
- **Rotas de área e grupo** aparecem corretamente em "recentes" e "favoritos" (cabeçalho e trilha próprios).

### 20.3 Árvore do Dashboard
13 grupos e 15 telas, total de 936 processos preservado: Visão executiva · Painéis de Previdência · Folha · Empréstimos · Investimentos · Financeiro · Contábil e fiscal · Atendimento · Governança · Jurídico · Gestão · Desempenho · **Exploração e governança dos painéis**.
- O grupo de exploração leva a marca `.def-tag` ("Em definição"): `font-size 9px / 600`, texto `#8d7540`, fundo `#f8f4e9`, borda `#ece2c7`, raio 4px, `padding 0 5px`, `margin-left 4px`, sem quebra de linha. A descrição do grupo começa com "Em definição.".
- **Contagem de processos no Mapa do menu:** o número de cada grupo (`processCount`) e de cada tela (`processIds`) do Dashboard vem dos painéis que o grupo realmente hospeda (`host` da página), não da divisão original por telas. Painéis que reaproveitam um processo já usado em outro grupo (por exemplo Financeiro, Contabilidade e Fiscal, Governança, Jurídico e Gestão, que usam processos de outros painéis) mostravam "00" e passaram a mostrar o valor real. Por isso a soma dos 13 grupos (30) é maior que o total da área (20 processos distintos): o mesmo processo pode aparecer em mais de um grupo. O total do menu continua em 936 e todos os processos continuam cobertos.
- Indicadores simulados foram reconciliados (arrecadação, folha, empréstimos, investimentos, financeiro e tributário); legendas somem quando o dado é N/A, sem dados ou restrito.

### 20.4 Favoritos
- **Estrela nos cartões** de grupo e de tela: `.card.has-star { position: relative }`, `.card.has-star > .star { position: absolute; top: 10px; right: 10px; z-index: 2 }` (substitui a posição 15px/14px de 7.4).
- **Lista de favoritos** (`.fav-row`): linha flex com `gap 8px`; a rota compacta ocupa o espaço (`flex: 1`) e a estrela fica à direita. Favorito cujo destino deixou de existir ganha `.fav-gone` (opacidade 0,7), em vez de sumir sem aviso.

### 20.5 Copiloto
- **Botão do topo** (`.copilot-toggle .mark`): tile 32×32, raio 8px, fundo `--color-brand-900` (`#062b4f`), ícone dourado `--color-accent-gold` (`#c2ac71`) de 20px. Mesma regra no tema escuro. Resolve o achado 4 da seção 16 (navy como CTA do assistente).
- **Sem abas de modo.** O pedido é classificado sozinho: *onde fica*, *como fazer*, *consultar dado* ou *preparar ação*. Contexto da tela atual no cabeçalho do painel.
- **Elementos novos:** chip de caminho na resposta (`.cp-path`: 9px, `#7d939f` sobre `#f0f4f7`, raio 4px); link de rota (`.cp-link`: `#0a526b`, sublinhado); lista de caminhos (`.cp-paths`, legenda 10px); botão "Ouvir" (`.cp-listen`: 10px, `#0a526b`); opção "Ler tudo" (`.cp-readall`: 10px, `#6b7480`); contexto da proposta (`.cp-pctx`: 10px, `#557384`).
- **Proposta de ação** carrega o contexto em que foi gerada (pessoa e página). Se o contexto mudar antes da confirmação, aparece o aviso `.cp-stale` (fundo `#fbf3e4`, borda `#ecd9b3`, texto `#7a5b1d`, 10px) e a proposta não executa em outro contexto; ao voltar ao contexto original ela volta a poder ser confirmada. Depois de confirmar, o aviso some.
- **Voz (substitui 8.5):** reconhecimento real pela API de voz do navegador (`SpeechRecognition` / `webkitSpeechRecognition`), em Chrome e Edge. Botão **Falar** com `aria-pressed`; ativo vira "■ Parar" com fundo `#fbe9e7`, texto `#a3322a`, borda `#f0c7c2`. O texto reconhecido entra na caixa de mensagem para revisão e **nunca é enviado sozinho**. Sem suporte (p. ex. Firefox) ou sem permissão, o botão informa e a digitação continua. Aviso: o navegador pode enviar o áudio ao serviço de voz dele. **Leitura em voz alta** das respostas pela síntese de voz do navegador (`.cp-listen`).
- A caixa de mensagem é limpa assim que a mensagem é enviada.

### 20.6 Campos de formulário
Tipos de campo reconhecidos hoje: texto, número, valor monetário, percentual, data, **competência (mês)**, **Sim/Não**, caixa de seleção, seleção fechada, **pesquisa fechada (lookup)**, área de texto, **arquivo**, etiquetas, UF, país, usuário, CPF, CNPJ, CEP, contexto (somente leitura) e **controle deslizante**.
- **Campo derivado ou de auditoria** (`data-auto`): somente leitura, fundo de campo desabilitado, texto "Automático" e dica explicando quem preenche (p. ex. "Gerado pelo sistema ao confirmar a operação"). Não entra na validação. Vale para código de referência, situação operacional, elaborado/aprovado por, estado de processamento, número de inscrição, prazo de desistência, referência e versão do recurso, e para os resultados do motor de empréstimo.
- **Campo com valor carregado** (`fixed`): somente leitura, largura total, usado para dados anteriores (p. ex. conta bancária atual do fornecedor).
- **Controle deslizante** (`.slider-row`): grade de 2 colunas, controle `1fr` + campo numérico de 120px, `gap 12px`, `accent-color: --color-brand-700`; em ≤720px empilha. O campo numérico é o de verdade (acessível por teclado e leitor de tela); o controle é auxiliar e os dois ficam sincronizados. Limites mínimo e máximo são validados com mensagem em linguagem da área, não pelo balão nativo do navegador.
- **Arquivo** (zona de soltar): valida arquivo vazio, extensão (PDF, JPG, JPEG, PNG, CSV, TXT, XML, XLSX, JSON) e 10 MB. O erro aparece na própria zona, em vermelho, com "✗"; sucesso aparece como "✓ nome". Arquivo recusado é descartado.
- **Pesquisa fechada:** só aceita item da lista; texto digitado fora dela gera "Valor não encontrado. Escolha um item existente da lista de sugestões." Seletores dependentes (pessoa → plano → convênio → vínculo) limpam os filhos quando o pai muda.
- **Mensagens de validação:** "Campo obrigatório: informe {rótulo}." · data de nascimento futura, ano mínimo 1900, início depois do fim da vigência · percentual entre 0 e 100 · mínimo e máximo · formato (p. ex. hh:mm, apenas números e pontos) · tamanho máximo · duplicidade · "obrigatório quando…" (p. ex. motivo se inelegível). Cada campo mostra a mensagem logo abaixo dele (`.err`) e o contêiner ganha `.invalid`.
- **Rótulos:** linguagem da área, sem nome de campo técnico ("Código de Referência", "Campo", "Operação"). O título da etapa do assistente é derivado do conteúdo ou dado explicitamente (p. ex. CAD-P34: "Pessoa, plano e vínculo" · "Origem e datas da inscrição" · "Origem anterior e documento").

### 20.7 Páginas
- **Formulário inline × diálogo:** arquétipo Formulário abre o formulário na própria página (`form[data-opform]` em `.surface`); Lista com diálogo abre `dialog` modal; com mais de 8 campos o diálogo usa a variante larga.
- **Assistente:** passos de até 6 campos, trilha numerada com "✓" nos concluídos, última etapa "Revisão" com todos os campos em lista de termos (campos automáticos aparecem como "—").
- **Tabelas de abas da pessoa** (endereços, contatos, documentos de identidade): filtradas pela **pessoa do cabeçalho**. Estado vazio próprio: "Esta pessoa ainda não tem registros nesta seção." As ações de linha usam o índice original do registro, então continuam corretas com filtro e busca.
- **Minhas tarefas:** ver o quadro em 9; grade de 2 colunas com cartões do mesmo topo e da mesma altura por linha; o terceiro cartão de cada bloco fica sozinho na coluna da esquerda (decisão em aberto: três colunas ou largura total).
- **Páginas-modelo de formulário** (referência para as demais páginas genéricas): pensão e cotas (BEN-P59), abono anual (FOL-P49), detalhamento contábil (INT-P88).

### 20.7-A Caixa de formulário e ação de linha (atualizado 05/11/2026, tarde)
- **Todo formulário fica em caixa:** fundo branco, borda `--color-border`, raio `--radius-xl` (13px), padding 22px. Isso vale para formulários inline e do assistente (`.surface`), diálogos e, agora, para a **barra de filtros das listas** (`.filters`: `display: flex`, `gap 14px`, `flex-wrap`, `margin-bottom 18px`, mais a caixa). Quando o filtro já está dentro de uma `.surface`, de um `.dialog` ou de um `details`, a caixa dele é removida (`background: none; border: 0; padding: 0`) para não duplicar. Verificado em 797 formulários e filtros de todas as páginas: nenhum fora de caixa, nenhum em caixa dupla.
- **Ação de linha nas listas — substituída por 20.10.1 (botões).** Texto original, mantido só como histórico: é um **botão com aparência de link** — `<button type="button" class="quiet">` com o **rótulo + seta** (`Abrir →`, `Editar →`, e o rótulo de cada ação de linha). Fonte 11px, cor `--color-primary-600`, sem fundo, sem borda, sublinhado ao passar o mouse; `gap 4px` entre texto e seta; duas ações na mesma linha ficam separadas por 16px. O rótulo é o mesmo da ação (não se renomeia).
- **"Abrir →"** usa `data-open` e abre a ficha do registro; clicar na linha inteira continua abrindo a mesma ficha. Botões de ação (`Editar`, ações de linha) **não** disparam a abertura da linha.
- ~~O antigo botão com borda (`.btn.sm`) deixa de ser usado em ações de linha~~ — revertido em 20.10.1: as ações de linha voltam a ser `.btn.sm`.

### 20.8 Dados de formulários
Os campos específicos moram em `js/data-forms.js` (camada que troca só os campos de operações existentes; não cria operação, endpoint nem página). Para o design system isso significa: **componentes de campo compartilhados + dados por página**; nada de HTML por página.

### 20.9 Dívidas e decisões em aberto
| # | Item | Recomendação |
|---|---|---|
| 1 | Cores `#hex` do Copiloto (`.cp-*`) e do `.def-tag` fora da escala de tokens | Criar tokens (`--color-info-text`, `--color-warning-bg/border/text`, `--color-danger-bg/border/text`) e trocar |
| 2 | Fontes de 9–10px (`.cp-*`, `.def-tag`) abaixo do piso de 12px recomendado em 16 | Subir para 12px junto com a revisão de legibilidade |
| 3 | Terceiro cartão sozinho em "Minhas tarefas" | Decidir entre 3 colunas, largura total ou manter |
| 4 | Foco do Copiloto sobreposto (achado 10) | Continua sem verificação formal; incluir no teste de acessibilidade |
| 5 | `.slider-row` sem rótulo visível dos limites | Mostrar mínimo e máximo sob o controle quando a regra for definida |
| 6 | Cerca de 220 páginas ainda com rótulos genéricos | Aplicar o padrão de 20.6 módulo a módulo |
| 7 | Pesquisa fechada sem lista em alguns módulos aceita qualquer texto | Ligar cada pesquisa à sua entidade real |
| 8 | `.sim-tag`, `.sim-stats` e o painel de simulação usam `#hex` fixos (por exemplo `#e3f1ea` / `#1d6b46`) | Trocar por tokens semânticos de sucesso e criar o par escuro |
| 9 | 46 campos de seleção obrigatórios, em 39 páginas, sem lista de valores na especificação | Definir as listas; até lá vale o campo de texto livre de 20.10.5 |
| 10 | Chaves de campo dos módulos 26 em diante sem acento e sem maiúsculas (`instncia`, `deciso`, `decididopor`) | Corrigir na origem; o rótulo exibido não é afetado |
| 11 | Selo de largura única (150px) corta cerca de 8% dos textos; alguns são frases longas, não situações | Encurtar rótulos ou tirar o selo das colunas de texto livre; depois reavaliar a largura |
| 12 | Nos cartões do dashboard o texto do selo já traz o símbolo (`● Válido`, `◐ 1 parcial`), então aparece junto do ponto do `.badge` | Tirar o símbolo do texto e deixar só o ponto de `.badge` |


### 20.10 Atualização de 05/11/2026 (noite)

Resumo das mudanças de layout e componentes feitas no protótipo depois de 20.9. Verificado no navegador: 939 de 941 páginas com escrita simuladas sem erro, 2.431 rotas, 18 fluxos críticos e varredura de formulários (964 páginas) sem problemas.

| Mudança | Onde está no documento |
|---|---|
| Ações de linha das listas viram botões (`.btn.sm`, "Abrir" em azul) | 20.10.1 (substitui 20.7-A) |
| Ícone próprio para cada um dos 13 grupos do Dashboard; ícone novo `gauge` | 20.10.2 e seção 5 |
| Cartão KPI com barras por plano; correção da classe `.kpi` | 20.10.3 e 18.4 |
| Simulação de dados: botão no rodapé, painel, selo "Simulado", seção "Registros desta página" | 20.10.4 |
| Seleção sem lista de valores vira texto livre | 20.10.5 |
| Selo de situação com tamanho único (150 × 22 px) | 20.10.6 e 7.10 |
| Altura das linhas das listas com respiro vertical | 20.10.7 e 7.17 |
| Contagem de processos do Mapa do menu (Dashboard) | 20.3 |
| Copiloto: anexar PDFs, chips, relatório de leitura, lote desfazível e massa da demonstração | 20.10.8 e 8.6 |

#### 20.10.1 Ação de linha nas listas: botões
Substitui o "botão com aparência de link" de 20.7-A. Todas as ações da coluna `td.act` das listas de todas as páginas (exceto Dashboard) são botões:
| Ação | Classe | Aparência |
|---|---|---|
| **Abrir** (abre a ficha do registro) | `.btn.sm.primary` com ícone `check` à esquerda | Fundo e borda `--color-primary-600`, texto branco |
| **Editar**, **Histórico** e ações de linha (Aprovar, Cancelar etc.) | `.btn.sm` | Fundo branco, borda `--color-border`, texto padrão |
- Sem seta no rótulo (o `→` de 20.7-A sai). O rótulo continua igual ao da ação.
- `.btn.sm`: padding `6px 10px`, 11px, raio 7px, largura máxima 200px com reticências.
- `td.act`: alinhada à direita, `white-space: nowrap`; duas ou mais ações na mesma linha ficam separadas por **8px** (`.btn + .btn`).
- Botão escondido por permissão usa o atributo `hidden` e a regra `.btn[hidden] { display: none }`; sem ela o `display` do botão anulava o `hidden`.
- Clicar na linha inteira continua abrindo a ficha; os botões de ação não disparam a abertura da linha.
- O "Abrir" dos wireframes das telas planejadas usa o mesmo botão (`.btn.sm.primary`).
- Não mudaram: os links de título nas tabelas de cobertura do menu, que funcionam como o nome da linha.

#### 20.10.2 Ícones do menu Dashboard
Cada um dos 13 grupos tem ícone próprio, definido em `groupIcons.dashboard` (continua valendo a regra de 5: nada de ícone por inferência de palavra).
| Grupo | Ícone | | Grupo | Ícone |
|---|---|---|---|---|
| Visão executiva | `dashboard` | | Atendimento | `headset` |
| Previdência | `users-round` | | Governança | `meeting` |
| Folha de benefícios | `receipt` | | Jurídico | `gavel` |
| Empréstimos | `percent` | | Gestão da Entidade | `building` |
| Investimentos | `pie-chart` | | Desempenho e Qualidade | `gauge` (novo) |
| Financeiro | `wallet` | | Exploração, Alertas e Simulação | `compass` |
| Contabilidade e Fiscal | `calculator` | | | |
- **Ícone novo `gauge`** (medidor): viewBox 24×24, traço herdado de `currentColor`, composto por arco de 180°, ponteiro e ponto central.
- Os 13 ícones são diferentes entre si. Os demais grupos de todas as áreas já tinham ícone próprio (nenhum usa o fallback `folder`).

#### 20.10.3 Cartão KPI do dashboard
- **Corpo preenchido:** o cartão do tipo "Cartão" (apresentações "Cartão e …" e "Cartões e …") mostra o valor no cabeçalho e, no corpo, as **barras por plano** (BD, CV, CD) com valor no rótulo da maior barra e **legenda** abaixo. Antes o corpo ficava vazio, deixando um espaço em branco do tamanho de um gráfico (ex.: DSH-FIN-01). Nas 24 páginas de painel (162 cartões) nenhum corpo ficou vazio.
- **Colisão de classe `.kpi`:** o cartão do dashboard recebe a classe `kpi` e herdava a regra genérica `.kpi` (cartão de resumo das telas de apoio), que reduzia o valor a 11px e trocava o fundo e o espaçamento. As regras genéricas passaram a `.kpi:not(.dsh-card)` (também no tema escuro). Regra: **classe genérica de componente nunca pode coincidir com a classe de tipo do cartão do dashboard**; o valor do cartão volta a 32px (`--text-2xl`) como em 18.4.

#### 20.10.4 Simulação de dados (S0 + S1)
O protótipo grava o que o usuário cadastra ou altera, só neste navegador (`localStorage`, chave `np-sim-v1`). Os dashboards não mudam.
- **Botão "Simulação (N)"** no rodapé (`#sim-btn`, link sublinhado, `margin-right 14px`), com o total de comandos. Abre o **painel lateral** (`.drawer`) com: três contadores (`.sim-stats`: comandos, registros criados, alterações e mudanças de estado; grade de 3 colunas, `gap 10px`, caixas com borda e raio 10px, número de 22px); ações (`.sim-actions`: Desfazer o último, Exportar cenário (JSON), Importar cenário, Reiniciar simulação); lista dos últimos 30 comandos (`.sim-list`, 13px, divisor 1px). **Reiniciar** pede dois cliques: no primeiro o botão passa a dizer "Clique de novo para apagar tudo"; não usa `confirm()`.
- **Selo "Simulado"** (`.tag.sim-tag`): verde-claro (`#e3f1ea` / `#1d6b46`), 600, `margin-left 6px`, na primeira coluna de todo registro criado na simulação.
- **Botão "Histórico"** (`.btn.sm`) na linha que já teve alteração: abre a linha do tempo de comandos do registro.
- **Seção "Registros desta página"** (`.surface`, `margin-top 16px`, título + contagem): aparece nas páginas de formulário e assistente, para que o cadastro recém-feito apareça ali; máximo de 6 colunas.
- **Colunas extras:** campo do formulário sem coluna equivalente na lista vira coluna extra (até 4), depois das colunas da especificação.
- **Registro com versão:** editar fecha a versão anterior (vigência até hoje) e cria a nova com o selo "atual"; a tabela mostra as duas.
- **Aviso após cada envio:** toast com o efeito e o protocolo, no formato `SIM-AAAA-NNNNNN` (por exemplo "Estado alterado em “cadCarga” · RECEBIDA → APROVADO · protocolo SIM-2026-000001"). O selo de estado da página muda na hora.
- **Busca global:** inclui "Registro simulado" entre os resultados.
- **Permissão a definir:** operação cuja permissão está como "(a definir na matriz de permissões)" fica liberada para todos os perfis até a matriz existir.

#### 20.10.5 Campo de seleção sem lista de valores
Seleção fechada cuja especificação não traz lista (`vals` vazio) deixa de gerar um `<select>` só com "Selecione…", que impedia o envio. Passa a ser **campo de texto livre** (`<input>`), com o texto de apoio "Informe o valor (lista de valores a definir na especificação)". A obrigatoriedade e a validação seguem as do campo. Dívida registrada em 20.9 (item 9).

#### 20.10.6 Selo de situação (`.badge`): tamanho único
Todos os selos de todas as páginas e módulos têm o mesmo tamanho, qualquer que seja o texto (por exemplo "Em fechamento" e "Encerrado" ficam do mesmo tamanho).
- **Largura 150px e altura 22px**, fixas (`box-sizing: border-box`, `flex-shrink: 0`): o selo não encolhe nem cresce dentro de células, listas e contêineres flexíveis. Texto centralizado, 10px / 600, `line-height 16px`, `padding 3px 9px`, `white-space: nowrap`.
- **Ponto de estado** (`::before`): círculo de 6px, `margin-right 5px`, alinhado ao centro da linha, cor `currentColor` com opacidade 0,7.
- **Texto maior que o selo** é cortado com reticências (`text-overflow: ellipsis`) e o **texto inteiro passa a ser o `title`** do selo (um observador no `app.js` preenche o `title` só nos selos cortados). Na amostra de 1.424 selos, 110 foram cortados, todos com `title`. O corte atinge valores que são frases longas (por exemplo "Demonstrativo de investimentos mensal aos participantes", 309px); o ideal é essas colunas deixarem de usar selo.
- As cores por significado não mudam (`.ok`, `.warn`, `.bad`, `.info` e o neutro); no tema escuro valem as regras de 19.6.
- Verificado: todos os selos medidos tinham 150 × 22 px, nas listas, fichas e nos cartões dos dashboards. Antes a largura ia de 43 a 309px e a altura variava entre 21 e 22px.
- **Decisão em aberto:** 150px mostra por inteiro cerca de 92% dos selos atuais (110 de 1.424 foram cortados); alargar o selo ou encurtar os rótulos reduz o corte (20.9, item 11).

#### 20.10.7 Altura das linhas das listas
Regra única para todas as tabelas de todas as páginas: **a linha tem a altura do seu conteúdo mais o respiro vertical**, e o conteúdo fica centralizado na vertical.
| Tabela | Célula | Respiro vertical | Alinhamento |
|---|---|---|---|
| Lista das páginas (`table.t`) | `td` | 13px em cima e embaixo, laterais 14px | `middle` (antes `top`) |
| Grid do dashboard (`table.dsh-grid`, inclusive a visão Grid dos cartões) | `td` | **11px em cima e embaixo** (antes 0), laterais 12px, altura mínima 40px, `line-height 1.45` | `middle` |
| Cabeçalho do grid (`th`) | `th` | altura 36px, sem quebra de linha | `middle` |
- Antes, o grid do dashboard tinha `padding: 0 12px` e altura fixa de 40px, então células com duas ou mais linhas ou com botões (por exemplo a tabela de Visões, DSH-P20) encostavam nas bordas da linha.
- A altura de 40px passa a ser mínima: linha com texto em várias linhas cresce.
- Itens de lista que não são tabela já tinham respiro e não mudaram: rota compacta (11px), resultado de busca (16px), processo em detalhe (15px). A lista de comandos da simulação (`.sim-list li`) passou de `0 0 8px` para `8px 0`.
- Verificado em metade das páginas do protótipo (502 tabelas): nenhuma tabela com menos de 6px de folga entre o conteúdo e a borda da linha.
#### 20.10.8 Copiloto com documentos anexados (leitura de PDF)
Etapas C1 a C4 do plano de simulação do Copiloto (`NextPrev_Plano_Simulacao_Copiloto_Documentos.md`, em `00 - Complementar`). O Copiloto lê e mostra; a proposta de cadastro e a gravação na simulação estão descritas abaixo; a contabilização da nota fiscal está descrita em seguida (C4).

**Anexar.** Botão `📎 Anexar` ao lado de "Falar" e soltar arquivos sobre o painel (o painel ganha contorno tracejado enquanto recebe). Só PDF; até **14 arquivos, 10 MB cada, 30 MB no total**. O mesmo conteúdo anexado duas vezes é marcado "Já anexado" e ignorado. O roteiro do apresentador é reconhecido pelo título e recusado. Anexos ficam só na memória da aba.

**Chip de anexo (`.cp-chip`).** Linha com borda 1px `#cfe0e8`, fundo `#f3f8fa`, raio 8px. Ícone redondo de 18px: ✓ verde (lido), … cinza (lendo), ! vermelho (erro ou recusado; chip com fundo `#fcf3f2`). Nome em negrito truncado; abaixo, `tamanho · estado`. Botão × com `aria-label="Remover anexo <nome>"`. A lista (`.cp-atts`) rola a partir de 150px de altura.

| Estado do chip | Texto |
|---|---|
| Lendo | Lendo… |
| Lido | Lido: <tipo> (N páginas, M campos) |
| PDF sem texto | PDF sem texto (escaneado) — não há OCR |
| Tipo não reconhecido | Tipo não reconhecido |
| Roteiro do apresentador | Não anexar à simulação |
| Outro formato / acima de 10 MB / erro | Só PDF / Acima de 10 MB / Erro ao abrir |

**Resposta de leitura.** Blocos, nesta ordem: resumo ("6 documentos lidos, 1 não aproveitado") com a frase de privacidade; **Documentos lidos** (tipo, referência impressa, arquivo, páginas, campos, avisos); **Pessoas identificadas** (por CPF); **Dados extraídos** (um bloco recolhível `.cp-det` por documento, com tabela `.cp-tab` de três colunas: *Campo* com o código F… da Matriz, *Valor lido* com o texto original quando difere, *Origem* com página e rótulo); e **O que vem a seguir** (`.cp-next`). Aviso quando o documento não traz a marca "dados fictícios".

**Conferência entre documentos (C2).** Depois de "Pessoas identificadas" (com papel e se já existe no cadastro, pelo CPF), o bloco **Conferência entre documentos** mostra quantos dados conferem e as divergências. Regras: a chave da pessoa é o CPF (mesmo CPF com outro nome é conflito, nunca outra pessoa); valores são comparados normalizados (caixa, acentos, formato); nomes impressos em caixa alta voltam a "Nome Próprio" para exibição. Cada divergência é um `fieldset.cp-dv` com **duas colunas lado a lado** (*Declarado* e *Comprovante*, cada uma com documento, referência, página e arquivo), a **proposta de correção** (valor do comprovante oficial; sem sugestão se os comprovantes divergem entre si) e três opções em rádio: *Usar o valor do comprovante*, *Manter o valor declarado*, *Informar outro valor* (campo de texto que marca a opção ao digitar). Acima dos cartões, o **alerta** `.cp-alert` (`role=alert`) cita os valores e os documentos e pede revisão antes de confirmar. O contador "N de M divergências decididas" (`aria-live=polite`) acompanha as decisões, que ficam guardadas na mensagem e sobrevivem a novos envios. Nada é corrigido sozinho. **Pendências** (`.cp-docs li.bad`): comprovante ausente, indicações que não somam 100%, plano, patrocinadora ou convênio fora dos cadastros (o Copiloto usa somente cadastros existentes).

**Proposta de cadastro e gravação (C3).** Depois da conferência, o bloco **Proposta de cadastro** (`.cp-prop`) lista os passos em 12 grupos recolhíveis (`details.cp-det.cp-grupo`, numerados: Pessoas, Documento de identidade, Contatos, Endereço, Relações pessoais, Vínculo funcional, Remuneração, Inscrição no plano, Categoria, Dependentes, Beneficiários indicados, Documentos de apoio); os dois primeiros abrem por padrão. Cada passo (`.cp-step`, borda 1px `#e3ecef`, raio 6px) tem caixa de seleção, título, link para a página e a operação de API (`CAD-P07 · Documentos de identidade · API-CAD-007`) e um detalhe "Campos" com o valor e a origem de cada campo. Etiquetas: **atualizar** (pessoa já cadastrada com dado diferente), **já existe** (passo desabilitado, `.cp-step.off`, fundo `#f6f8f9`) e **bloqueado** (`.cp-tag.bad`). A proposta é recalculada quando o usuário decide uma divergência (os títulos e valores mudam na hora) e preserva os grupos abertos. O botão **Confirmar N passos selecionados** fica desabilitado, com o motivo em `.cp-exec-why`, enquanto houver divergência sem decisão, bloqueio (plano, patrocinadora ou convênio ausente; indicações que não somam 100%; perfil sem permissão para algum passo) ou nenhum passo a gravar. Ao confirmar, os passos são gravados em **um lote** (`Cadastro pelo Copiloto: <titular>`), na ordem dos grupos, parando no primeiro erro; o resultado (`.cp-result`, fundo `#e8f3ef`, `role=status`) mostra "Lote L-… gravado na simulação", a quantidade de comandos e os botões **Abrir a ficha** (seleciona o titular e abre CAD-P03) e **Desfazer lote**. As pessoas criadas passam a aparecer em "Trocar pessoa" e nas pesquisas; enviar de novo o mesmo conjunto marca todos os passos como "já existe", sem duplicar. Nenhum benefício ou pagamento é criado. Tema escuro: superfícies e textos do tema (`--color-surface`, `--color-text-heading`), resultado em `#17302a` com texto `#8fd1bb`.

**Contabilização de nota fiscal (C4).** Com só a NFS-e anexada, o bloco passa a **Proposta de contabilização**, na ordem: **Conferências para contabilizar** (lista `.cp-docs`; cada item com ✓ verde ou ! vermelho e texto, nunca só cor, e link para CTR-P01, CTR-P10 ou CTR-P12): valores da nota, período e competência, prestador, tomador, contrato, medição aprovada, ateste, competência contábil aberta, parâmetro tributário, roteiro aprovado, contas analíticas e unidade; depois **Lançamento proposto** com a etiqueta "hipótese de teste" (`.cp-partidas`: lado, conta com código em `.cp-raw`, valor alinhado à direita), data do fato e contábil, unidade, roteiro, versão do plano de contas e a frase "não é pagamento"; depois três grupos de passos: **1. Documento fiscal** (CTR-P13, API-CTR-027), **2. Proposta de escrituração** (INT-P36, API-INT-082) e **3. Escrituração** (INT-P49, API-INT-084). O passo 3 depende do 2 e o 2 do 1: só é gravado se o anterior existe ou está marcado. As consultas à medição e ao ateste (CTR-P10/P12) e a leitura da proposta (INT-P26) aparecem como conferências e partidas, sem escrita. Pendência (ateste ausente, competência fechada, valores que não fecham, retenção diferente do parâmetro, contrato ou prestador que não conferem) aparece em `.cp-alert` e **bloqueia a escrituração**, nunca gera lançamento improvisado; a nota ainda pode ser relacionada ao contrato, e o reenvio depois de resolvida a pendência grava só o que falta. Reenviar a mesma nota (mesma referência, mesmo número e série) marca os três passos como "já existe" e mostra "A nota … já foi contabilizada (INT-P37): nada será duplicado". Perfil sem permissão em algum passo bloqueia a proposta inteira; a permissão é avaliada no **perfil do módulo de cada página** (Contratos para CTR, Integração Contábil para INT), não no do módulo aberto na tela. O título a pagar não tem operação de escrita nas especificações: a referência da nota fica no campo "Título ref" da escrituração e nenhum pagamento é criado. Anexar cadastro e nota juntos mostra a proposta de cadastro e orienta a enviar a nota separadamente. Resultado (`.cp-result`): "Lote L-… gravado", **Abrir a proposta (INT-P36)**, **Ver operação (INT-P37)** e **Desfazer lote**.

**Massa da demonstração (cenário contábil).** O botão "Carregar massa da demonstração" também cadastra, para a contabilização: contrato DEMO-SW-2026-01 (uso administrativo, unidade PGA), medição e ateste da competência 2026-10, competência aberta, roteiro aprovado ROT-DEMO-SW-01, plano de contas PC-DEMO-2026 com contas marcadas "(demonstração)" e parâmetro de retenção zero; cada um aparece como uma linha de identificador em CTR-P01, CTR-P10 e CTR-P12. O painel "Simulação" ganha a caixa **Contrato sem ateste da medição** (`.sim-opt`), que remove o ateste para demonstrar a pendência.

**Acessibilidade.** A região de status do compositor (`#cp-voice`, `role=status`) anuncia a leitura de cada arquivo e o resumo; ela fica em linha própria abaixo dos botões. Anexar e remover funcionam por teclado; o arrastar tem alternativa pelo botão.

**Lote e massa de dados.** O painel "Simulação" ganha a seção **Lotes do Copiloto** (cada lote com id `L-000001`, quantidade de comandos e botão **Desfazer lote**, atômico; recusa se um comando posterior depende de registros do lote) e o botão **Carregar/Remover massa da demonstração** (entidade, plano HCVDEMO, convênio, patrocinadora e fornecedor da demonstração; guardado em `np-demo-v1`).

**Biblioteca de leitura.** `js/vendor/pdf.min.js` e `pdf.worker.min.js` (pdf.js 3.11.174, Apache-2.0, aviso em `LICENSE-pdfjs.txt`), carregados sob demanda ao anexar o primeiro arquivo. O gate estático S1 declara `js/vendor` como exceção ao veto de `fetch`/`import()`/XHR e exige a presença dos três arquivos.

## 21. Atualização de layout: ficha do participante, abas e modais (09/11/2026)

Consolida os ajustes de layout feitos no protótipo `v4/prototipo-html` na revalidação do módulo 01 (Cadastro). Onde esta seção contradiz as anteriores, vale esta.

### 21.1 Bloco fixo do participante (`.ficha-topo`)
- **Quando aparece.** Em toda página que uma aba da ficha carrega (inclusive páginas de outros módulos que são seções da ficha) e nas páginas abertas por um contador da ficha (`?escopo=pessoa`: contas, cobranças, benefícios, empréstimos, notificações). Só existe depois que um participante foi aberto na lista; a tela de entrada (busca e lista) não mostra o bloco.
- **Composição, de cima para baixo:** cartão do participante (avatar, nome, CPF mascarado com "Revelar", nascimento, selo de nível, inscrição, plano, ações Alterar dados, Corrigir retroativamente, Unificar e Abrir solicitação); contadores (`.ficha-counters`, oito caixas); grade de seções; grade de páginas da seção.
- **Fonte única.** O bloco é desenhado por um único componente e reutilizado em todas as páginas; nenhuma página redesenha o cabeçalho.
- **Aviso de seção da ficha.** O aviso "Esta tela é uma seção da ficha… Abrir ficha" não aparece quando o participante já está selecionado e a ficha de origem diz respeito a uma pessoa (Participante, Recebimento ou contribuição, Pagamento ou fato, Título a receber, Repasse ou recebimento). Sem participante selecionado, o aviso continua.

### 21.2 Abas da ficha como grade de botões (`.ficha-topo nav.tabs`)
- **Decisão.** A rolagem horizontal das abas foi abandonada nesse bloco: a barra de rolagem cobria o sublinhado da aba ativa e a aba selecionada saía da tela ao trocar de página. As abas viram **botões de tamanho igual em grade** (`grid-template-columns: repeat(auto-fill, minmax(172px, 1fr))`, intervalo 8px), que quebram em linhas.
- **Primeiro nível (seções).** Botão de 44px de altura mínima, raio 10px, borda 1px neutra, fundo branco; ativo com fundo da cor primária escura, texto branco e peso 600.
- **Segundo nível (páginas da seção).** Botão de 36px, fonte 11,5px, fundo transparente; ativo com fundo claro da marca, borda da marca e texto da marca. Só aparece quando a seção tem mais de uma página.
- **Separação.** 20px entre as duas grades, com linha fina de 1px e 16px de respiro abaixo dela.
- **Comportamento.** Cada seção abre a própria página (a primeira página do participante na seção), nunca uma lista de cartões; a aba da página atual fica marcada nos dois níveis. Páginas abertas por contador não marcam nenhuma aba.
- **Faixa de abas comum (`.tabs`) fora do bloco.** Mantém rolagem horizontal, mas a linha de base é desenhada por fundo (1px) acima da barra de rolagem fina de 8px; o sublinhado de 2px da aba ativa não é cortado; ao carregar a página, a aba ativa é centralizada na faixa.

### 21.3 Espaçamento entre caixas da ficha
Escala única de **16px** entre cartão do participante, contadores, abas, "Posição no plano", filtro de posição histórica e cartões de dados (`#pagebody > .surface + .surface`, `.surface + .kv-cards`, `.kv-cards` com `gap: 16px`). A primeira caixa depois do bloco do participante não tem margem superior própria. Antes, algumas caixas encostavam (0 a 6px) e outras ficavam a 36px.

### 21.4 Modais de operação com participante selecionado
- **Faixa do participante.** Todo modal aberto a partir de uma página do participante começa com `.modal-part`: avatar de 34px, nome em 13px/negrito, linha secundária com CPF mascarado, inscrição e plano, e o chip "Participante selecionado" à direita. Fundo claro da marca, borda 1px, raio 10px, margem inferior 14px.
- **Campos herdados.** O campo de inscrição já vem preenchido com a inscrição do participante e a lista de opções só oferece as inscrições dele; campos de pessoa (participante, titular, assistido, mutuário, sacado, destinatário) vêm com o participante. Pessoa que entra na operação (por exemplo, o dependente a incluir) continua vazia. Modais fora de páginas do participante não mudam.

### 21.5 Descritivos dos cartões de grupo
Nos cartões de grupo e tela, o descritivo que começa com "Cadastrar" passa a dizer "Cadastrar e editar" (por exemplo, "Cadastrar e editar participante"). É só texto de apresentação: o nome original do processo no catálogo não muda.

### 21.6 Entrega do protótipo
Os arquivos de script e estilo são carregados com número de versão (`?v=AAAAMMDDx`) no `index.html`; o número deve mudar a cada entrega para o navegador não reaproveitar arquivos antigos.

---

*Gerado a partir da análise estática do código-fonte do protótipo v4. Valores de cor, tamanho e espaçamento referem-se ao CSS efetivo após a cascata `style.css → brand-copilot.css → light-theme.css → copilot-voice.css`. Nenhum teste de contraste automatizado foi executado: as indicações de contraste são avaliações estimadas e devem ser verificadas com ferramenta antes da adoção.*
