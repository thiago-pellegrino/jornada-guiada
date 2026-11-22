# Jornada Guiada — Design System

> Gerado em 22/11/2026 a partir do código do `roadmap-react` (`src/styles`). Versão navegável com prévias: https://claude.ai/artifact/HpLG8yN1K97bRSy9YWv89M

Todos os insumos visuais da Jornada Guiada (Capgemini · DarkLabs): cores, tipografia, espaçamentos, componentes, ícones, marcas, o mascote Delta e as fotos do mosaico. Os valores saem do código do app (`roadmap-react/src/styles`: `tokens.css`, `refinements.css` e as folhas de cada módulo), então uma tela nova montada com estes tokens fica igual às que já existem.

## Princípios

- **Sóbrio e denso.** O app é uma ferramenta de trabalho: superfícies brancas (ou grafite no escuro), filetes finos e quase nenhuma sombra. A cor fica para o que importa: ação principal, etapa atual, estado.
- **Navy no claro, grafite no escuro.** No tema claro, a ação e a seleção usam o navy `color-selected-bg` (#183c56). No escuro, a interface vira grafite neutro e a seleção inverte para branco (`color-selected-bg` = #f5f5f5).
- **O degradê é a assinatura.** O azul → índigo → violeta (`brand-blue` → `brand-indigo` → `brand-violet`; na barra de abas, `tabs-c1` → `tabs-c3`) aparece só na barra de abas, no botão Entrar e no título do login. Não o espalhe por cards ou botões.
- **Uma forma de botão.** Todo botão de texto é uma pílula de 36 px contornada; o primário é a mesma pílula preenchida.
- **O Delta tem cor própria.** O agente usa o símbolo de estrelas (magenta → ciano) e o mascote (azul → violeta, ou dourado). Essas cores não entram no resto da interface.

## Conteúdo e tom

- Tudo em **português do Brasil**, frases curtas, tratamento por "você".
- Botões com verbo no infinitivo: "Criar projeto", "Salvar alterações", "Ir para Contexto". Sem ponto final em rótulos.
- Títulos em caixa normal ("Backlog do Futuro", não "BACKLOG DO FUTURO"); caixa alta só nos rótulos `eyebrow` dos KPIs.
- Avisos dizem o que falta e o que fazer: "**Falta o contexto.** Gere o contexto do projeto antes de criar o backlog do futuro."
- Termos fixos da jornada (abas, nesta ordem): Criação de Contexto, DarkLabs, Projetos, Backlog do Futuro, Épicos, Features e Histórias, Escopo das Squads, Cronograma, Resultados, Dashboards, Delta Builder. Códigos: `PRJ-001`, `EP-01`, `FT-014`; ondas `W0` a `W4`.
- Números no formato brasileiro: 1.200, 12,5%. Datas relativas nos cartões ("há 2 dias", "ontem").
- Negrito só para destacar um trecho (`<strong>`, peso 600). A barra lateral do chat do Delta não usa negrito.

## Fundamentos visuais

### Cor
- Fundo da página `color-bg`; caixas `color-surface`; áreas recuadas (KPIs, campos somente leitura, barra lateral do chat) `color-surface-subtle`.
- Texto corrido `color-text`, títulos `color-text-heading`, apoio `color-text-muted`. `color-text-subtle` só para placeholder.
- Filetes: `color-border` para caixas e tabelas; `color-border-strong` para o contorno dos botões, o cabeçalho de tabelas e os conectores do stepper; `color-border-field` para campos.
- Ação e seleção: `color-selected-bg` + `color-selected-text` (botão primário, pílula selecionada, segmento selecionado, cartão de projeto atual).
- Progresso da jornada: `color-primary-500` (etapas alcançadas) e `color-primary-700` (etapa atual, selo do código sobre `color-primary-50`).
- Estados: `color-info-*`, `color-success-*`, `color-warning-*` (o aviso bege), `color-danger-*`. Use sempre o trio bg/text/border do mesmo estado.
- Gráficos: `chart-1` a `chart-8` na ordem, `chart-other` para "Outros"; escala sequencial `chart-seq-*` (invertida no escuro). `chart-1` é também o acento `--mc` das telas DarkLabs.
- O detalhe dourado `color-accent-gold` marca a resposta do assistente (filete esquerdo de 3 px).

### Tipografia
- Uma família: **Montserrat** variável (pesos 100–900), arquivos em `fonts/`. Código e IDs em mono do sistema (`font-mono`).
- A raiz do app é **14,5 px** (`html { font-size: 14.5px }`; o usuário ajusta de 12,5 a 19,5 px). Por isso os tamanhos estão em rem: `body` 0,875rem (≈12,7 px), `body-sm` 0,8125rem, `caption` 0,75rem (piso informativo), `lg` 1,125rem, `page-title` 1,75rem.
- Pesos: 400 texto, 500 rótulos e botões, 600 seleção e destaque, 650/700 títulos e números.
- Títulos com tracking levemente negativo (-0,01em); `eyebrow` em caixa alta com +0,08em.
- Textos sobre fotos do mosaico ficam em px fixos (25,6 / 16,8 / 12 px) e não acompanham a escala.

### Espaço e forma
- Grade de 4 px: `space-1` (4) a `space-12` (48). Caixas de página com padding 24 26 26 e gap 18; caixas compactas com `card-pad` (12); caixas empilhadas a `card-gap` (8).
- Altura única de controle: `control-h` = 36 px (botões, campos, busca).
- Raios: `radius-md` 8 (campos, segmentado), `radius-lg` 10 (avisos, KPIs, balões), `radius-xl` 12 (caixas), `radius-menu` 14, `radius-field` 16 (cartão de projeto, campo de modal), `radius-folder` 20 / 24 (pasta), `radius-dialog` 22, `radius-full` (pílulas).
- Sombras quase invisíveis: `shadow-1` em caixas, `shadow-menu` em menus, `shadow-overlay` no painel do Delta. Profundidade vem de filetes, não de sombras.

### Layout
- Topbar de 50 px (marcas à esquerda; sistemas no centro: Jornada Guiada, Portal DarkLabs, EM Financial, EM Audit, EM Certification, Painel Admin; utilitários e o botão Delta à direita), mosaico de fotos recolhível, barra de abas com o degradê (40 px) e o conteúdo em caixas.
- Cada etapa abre com a barra do projeto (código, nome, etapa e stepper de até 5 etapas, em uma linha; concluídas com check).
- Rodapé fixo de 1 linha: "Capgemini / Experiência do gestor" à esquerda e "Simulação local · Sem execução de operações" à direita, 12 px `color-text-muted`.
- O login tem paleta própria e fixa (noite `#04061a`, ciano `#38d1f5`, vermelho Capgemini `#d0021b`): ver o componente Login.
- Em telas até 720 px as caixas reduzem o padding para 16 px.

### Movimento
- Transições de 150 ms (`motion-fast`) com `cubic-bezier(.2, 0, 0, 1)` para hover e seleção.
- O painel do Delta abre com uma animação curta de opacidade e deslocamento, sem `will-change` permanente (mantém a fonte nítida).

## Iconografia

- Biblioteca própria de 59 ícones (grupo **Ícones**): viewBox 24×24, traço 1,65 px, pontas e junções arredondadas, sem preenchimento. Use em 16 px nos botões e 18–20 px em botões de ícone; a cor segue o texto (`currentColor`).
- Ícone antes do texto, gap 8 px nos botões e 5–6 px em abas e pílulas. Ícone sozinho sempre com `aria-label`.
- Não misture outras bibliotecas de ícones nem emoji.

## Marcas

- **Capgemini**: colorida no tema claro, branca no escuro. **DarkLabs**: anéis abertos com ponto central, "DΛRKLΛBS" espaçado (o A sem travessão) e filete; preta no claro, branca no escuro; versão com "by capgemini" para telas de acesso. As duas aparecem juntas na topbar, separadas por um filete de 26 px.
- **Delta**: símbolo de quatro estrelas com degradê `delta-glyph-1` → `delta-glyph-4`. Na barra de abas fica branco.
- Use os arquivos do grupo **Marcas**; não redesenhe, não recolora e não deforme.

## Mascote Delta

Personagem 3D original: cabeça em pílula com visor escuro e olhos de estrela, antena com estrela, corpo em ▽ com estrela branca, bracinhos. Cores `mascot-c1/c2/c3` e `mascot-eye`; modo dourado com `mascot-gold-*`. Fica fixo no canto da tela (92 px) e muda de estado (parado, correndo, acenando, pulando, esperando, trabalhando, revisando, falha). As camadas e as imagens prontas estão no grupo **Mascote**.

## Fotos

O mosaico usa fotos de equipes em escritórios com luz quente e janelas (grupo **Mosaico**), sempre escurecidas na base para o texto branco. Uma foto por aba/etapa; não use as fotos em outros contextos nem coloque texto escuro sobre elas.

## Componentes

Há duas folhas de estilo:

- `components/app.css`: a **folha completa do app** (build do roadmap-react). As prévias de TopBar, TabsBar, HeroMosaic, ProjectBar, Login, Gantt, RoadmapMatrix e RoadmapOndas usam o markup real copiado do app com essa folha, então são idênticas às telas. Os nomes de classe citados nas regras (`btn--primary`, `dlj-aviso`, `jg-step`, `matrix`…) são os do app.
- `components/bundle.css`: recortes dos demais componentes com prefixo `ds-`, para estudar uma peça isolada sem colidir com `app.css`.

Grupos:

- **Telas**: Login
- **Navegação**: TopBar, TabsBar, ProjectBar (com stepper), NavPills
- **Mosaico**: HeroMosaic
- **Cronograma**: Gantt, RoadmapMatrix (visão Grade)
- **Backlog do Futuro**: RoadmapOndas
- **Ações**: Button, IconButton, Menu (⋯)
- **Formulários**: Field (campo, busca, campo grande, segmentado)
- **Conteúdo**: Sheet (caixa de página), Notice (aviso), DataTable, Kpi, Tags
- **Contexto**: NotebookCard (pasta), ProjectCard, CompanyPicker (modal Criar projeto)
- **Delta**: DeltaChat, DeltaMascot
- **Feedback**: Toast

Para montar uma tela nova: topbar → mosaico e barra de abas → caixa de página com título e ações → barra do projeto, se for uma etapa da jornada → conteúdo com tabelas, KPIs, cartões e avisos → um único botão primário por área.

## Acessibilidade

- Texto com contraste de pelo menos 4,5:1 nos dois temas (ver as notas dos tokens). Exceções herdadas do app, mantidas e sinalizadas: texto branco de 12 px sobre o meio do degradê das abas (4,3:1) e os selos de onda W1–W3 no claro (3,2 a 4,2:1, só em peso 600).
- Anel de foco de 2 px `color-focus` com offset de 2 px em todo elemento clicável.
- Estados nunca só por cor: a etapa atual tem contorno, a alcançada tem número preenchido, o sinalizador desligado é tracejado.

---

# Tokens

Cada token vira a variável CSS `--<nome>` (ex.: `var(--color-surface)`). O tema escuro é aplicado com `data-theme="dark"` no `<html>`.

## Cores

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `color-bg` | `#f7f7f8` | `#1f1e1d` | Fundo da página (área atrás das caixas). |
| `color-surface` | `#ffffff` | `#292929` | Fundo de caixas, cards, modais, topbar e menus. |
| `color-surface-subtle` | `#f1f3f5` | `#2e2e2e` | Fundo recuado: KPIs, campos somente leitura, barra lateral do chat do Delta, resposta do assistente. |
| `color-surface-hover` | `#f5f6f7` | `#333333` | Hover de linhas, botões contornados e itens de menu. |
| `color-surface-selected` | `#eef0f3` | `#3d3d3d` | Linha ou item selecionado; hover de pílula de navegação. |
| `color-border` | `#e3e5e8` | `#3d3d3d` | Filete padrão de caixas, tabelas e divisores. |
| `color-border-strong` | `#abb9c7` | `#6b6b6b` | Contorno de botões em pílula, cabeçalho de tabela, conectores do stepper. |
| `color-border-field` | `#c4ced8` | `#5f5f5f` | Contorno de campos de texto e seletores. |
| `color-text` | `#303943` | `#e6e6e6` | Texto corrido sobre color-surface e color-bg. |
| `color-text-heading` | `#263c4e` | `#f5f5f5` | Títulos, nomes de cards, texto dos botões contornados. |
| `color-text-muted` | `#5f6872` | `#adadad` | Subtítulos, metadados, rótulos de cabeçalho de tabela. |
| `color-text-subtle` | `#6b7480` | `#8f8f8f` | Placeholder e textos auxiliares de menor ênfase. No escuro fica em 4,5:1 sobre color-surface: o mínimo; não use sobre color-surface-subtle. |
| `color-primary-50` | `#eef2f6` | `#3a3a3a` | Fundo do selo de código do projeto (PRJ-001) e balão do usuário no chat. |
| `color-primary-500` | `#345c78` | `#c8c8c8` | Etapas alcançadas do stepper, contorno da etapa atual, base do mapa de calor. |
| `color-primary-600` | `#265671` | `#e0e0e0` | Hover do botão primário legado. |
| `color-primary-700` | `#183c56` | `#f0f0f0` | Texto do selo de código e da etapa atual. |
| `color-brand-900` | `#062b4f` | `#1f1e1d` | Navy profundo da marca; sombras de sobreposição. |
| `color-brand-700` | `#10425f` | `#2e2e2e` | Texto da pílula sobre as fotos do mosaico. |
| `color-selected-bg` | `#183c56` | `#f5f5f5` | Preenchimento do botão primário, da pílula selecionada e do segmento selecionado. |
| `color-selected-text` | `#ffffff` | `#1f1e1d` | Texto sobre color-selected-bg. |
| `color-on-primary` | `#ffffff` | `#1f1e1d` | Número dentro da bolinha da etapa alcançada (sobre color-primary-500). |
| `color-control-accent` | `#183c56` | `#d6d6d6` | Sublinhado do sistema ativo na topbar, trilho de controles deslizantes, contorno do campo de renomear. |
| `color-link` | `#265671` | `#9cc3f5` | Links de texto e botões de link. |
| `color-focus` | `#56bbb2` | `#e6e6e6` | Anel de foco (outline 2px, offset 2px). Contraste 2,2:1 no claro: reforce com o offset. |
| `color-accent-gold` | `#c2ac71` | `#d2b66f` | Filete esquerdo da resposta do assistente; detalhe dourado da marca. |
| `color-toast-bg` | `#143c42` | `#3a3a3a` | Fundo do toast de notificação (texto branco). |
| `color-info-bg` | `#f0f3f5` | `#2c3036` | Fundo de mensagem informativa e da etiqueta História. |
| `color-info-text` | `#4f6475` | `#b9c6d4` | Texto informativo sobre color-info-bg. |
| `color-info-border` | `#dfe5e9` | `#454b53` | Contorno da mensagem informativa. |
| `color-success-bg` | `#e8f3ef` | `#12302a` | Fundo de sucesso; sinalizador ligado (bf-flag). |
| `color-success-text` | `#1f6a55` | `#6fcfae` | Texto de sucesso sobre color-success-bg. |
| `color-success-border` | `#c6e0d6` | `#1f4d42` | Contorno de sucesso. |
| `color-warning-bg` | `#f8f4e9` | `#2e2812` | Fundo do aviso bege (dlj-aviso) e da etiqueta Hipótese. |
| `color-warning-text` | `#7a5f28` | `#e3c17a` | Texto do aviso sobre color-warning-bg. |
| `color-warning-border` | `#ece2c7` | `#4a4020` | Contorno do aviso bege. |
| `color-danger-bg` | `#fbeeee` | `#3a1b1d` | Fundo de erro e do botão de perigo. |
| `color-danger-text` | `#a12b2b` | `#f08a8a` | Texto de erro; item Excluir dos menus. |
| `color-danger-border` | `#f0c7c2` | `#5a2a2d` | Contorno do botão de perigo. |
| `color-danger-600` | `#b3302f` | `#c94a4a` | Ícone/realce de erro forte. |
| `color-favorite` | `#b18a3c` | `#d2b66f` | Estrela de favorito. |
| `color-favorite-bg` | `#f6edd6` | `#2e2812` | Fundo do favorito marcado. |
| `scrim` | `#102b3a66` | `#000000a6` | Véu atrás de modais e do painel do Delta. |
| `chart-1` | `#2a78d6` | `#3987e5` | Série 1 (azul). Também o acento --mc das telas DarkLabs. Ordem categórica validada: use na sequência. |
| `chart-2` | `#eb6834` | `#d95926` | Série 2 (laranja). Ordem categórica validada: use na sequência. |
| `chart-3` | `#1baf7a` | `#199e70` | Série 3 (verde). Ordem categórica validada: use na sequência. |
| `chart-4` | `#eda100` | `#c98500` | Série 4 (âmbar). Ordem categórica validada: use na sequência. |
| `chart-5` | `#e87ba4` | `#d55181` | Série 5 (rosa). Ordem categórica validada: use na sequência. |
| `chart-6` | `#008300` | `#008300` | Série 6 (verde escuro). Ordem categórica validada: use na sequência. |
| `chart-7` | `#6250d6` | `#9085e9` | Série 7 (violeta). Ordem categórica validada: use na sequência. |
| `chart-8` | `#e34948` | `#e66767` | Série 8 (vermelho). Ordem categórica validada: use na sequência. |
| `chart-other` | `#9aa3ad` | `#8793a0` | Categoria Outros. Ordem categórica validada: use na sequência. |
| `chart-seq-100` | `#cde2fb` | `#184f95` | Escala sequencial (do menor ao maior valor); invertida no escuro. |
| `chart-seq-250` | `#86b6ef` | `#256abf` | Escala sequencial (do menor ao maior valor); invertida no escuro. |
| `chart-seq-400` | `#3987e5` | `#3987e5` | Escala sequencial (do menor ao maior valor); invertida no escuro. |
| `chart-seq-500` | `#256abf` | `#6da7ec` | Escala sequencial (do menor ao maior valor); invertida no escuro. |
| `chart-seq-600` | `#184f95` | `#9ec5f4` | Escala sequencial (do menor ao maior valor); invertida no escuro. |
| `chart-seq-700` | `#0d366b` | `#cde2fb` | Escala sequencial (do menor ao maior valor); invertida no escuro. |
| `chart-div-mid` | `#f0efec` | `#383838` | Ponto neutro de escalas divergentes. |
| `chart-grid` | `#e3e5e8` | `#3d3d3d` | Linhas de grade dos gráficos. |
| `chart-axis` | `#abb9c7` | `#5f5f5f` | Eixos dos gráficos. |
| `chart-ink` | `#303943` | `#e6e6e6` | Rótulos de dados. |
| `chart-ink-muted` | `#5f6872` | `#adadad` | Rótulos secundários dos gráficos. |
| `tabs-c1` | `#215ad7` | `#292929` | Início do degradê da barra de abas (e do botão Entrar do login). |
| `tabs-c2` | `#5e6fe1` | `#252524` | Meio do degradê da barra de abas. Texto branco de 12px sobre este ponto do degradê fica em 4,3:1 (abaixo de 4,5): mantido como no app; as abas usam peso 500/650. |
| `tabs-c3` | `#a650cf` | `#1f1e1d` | Fim do degradê da barra de abas. |
| `brand-blue` | `#215ad7` | `#215ad7` | Azul da marca (início do degradê do botão Entrar e da barra de abas no claro). Fixo nos dois temas: use em capas e materiais, não em componentes. |
| `brand-indigo` | `#5e6fe1` | `#5e6fe1` | Índigo da marca (meio do degradê). Fixo nos dois temas. |
| `brand-violet` | `#a650cf` | `#a650cf` | Violeta da marca (fim do degradê). Fixo nos dois temas. |
| `tabs-switch-on` | `#1d2f8f` | `#5e6fe1` | Trilho ligado do interruptor da barra de abas. |
| `hero-tile-bg` | `#05080f` | `#05080f` | Fundo atrás das fotos do mosaico (texto branco por cima). |
| `hero-pill-bg` | `#d6e8f4` | `#d6e8f4` | Pílula de etiqueta sobre as fotos do mosaico (92% de opacidade no app); texto color-brand-700 claro, #10425f. |
| `delta-glyph-1` | `#f507e1` | `#f507e1` | Estrelas do Delta: magenta (canto inferior esquerdo do degradê). |
| `delta-glyph-2` | `#8a5af0` | `#8a5af0` | Estrelas do Delta: violeta. |
| `delta-glyph-3` | `#2aa0fe` | `#2aa0fe` | Estrelas do Delta: azul. |
| `delta-glyph-4` | `#05f5ff` | `#05f5ff` | Estrelas do Delta: ciano (canto superior direito). |
| `mascot-c1` | `#4f8dff` | `#4f8dff` | Mascote Delta: azul (topo do corpo, antena, balão do usuário no mini chat). |
| `mascot-c2` | `#5e6fe1` | `#5e6fe1` | Mascote Delta: índigo. |
| `mascot-c3` | `#a650cf` | `#a650cf` | Mascote Delta: violeta (base do corpo). |
| `mascot-eye` | `#8ff0ff` | `#8ff0ff` | Mascote Delta: brilho do visor/olhos. |
| `mascot-gold-1` | `#f0c64a` | `#f0c64a` | Modo dourado do Delta: ouro claro (substitui mascot-c1). |
| `mascot-gold-2` | `#d4a017` | `#d4a017` | Modo dourado: ouro (substitui mascot-c2). |
| `mascot-gold-3` | `#a8740a` | `#a8740a` | Modo dourado: ouro escuro (substitui mascot-c3). |
| `mascot-gold-eye` | `#fff1b8` | `#fff1b8` | Modo dourado: brilho do visor. |
| `onda-w0` | `#6b7280` | `#6b7280` | Onda W0 (cinza). Selo de onda do Backlog do Futuro: texto na cor, fundo a 12% e contorno a 45%. |
| `onda-w1` | `#1f9d6b` | `#1f9d6b` | Onda W1 (verde). Selo de onda do Backlog do Futuro: texto na cor, fundo a 12% e contorno a 45%. No claro, o texto fica em 3,4:1 sobre branco: só em selos com peso 600 ou mais. |
| `onda-w2` | `#2a7fc8` | `#2a7fc8` | Onda W2 (azul). Selo de onda do Backlog do Futuro: texto na cor, fundo a 12% e contorno a 45%. No claro, 4,2:1 sobre branco: só em selos com peso 600 ou mais. |
| `onda-w3` | `#c97f0e` | `#c97f0e` | Onda W3 (âmbar). Selo de onda do Backlog do Futuro: texto na cor, fundo a 12% e contorno a 45%. No claro, 3,2:1 sobre branco: só em selos com peso 600 ou mais. |
| `onda-w4` | `#8d3fb5` | `#8d3fb5` | Onda W4 (violeta). Selo de onda do Backlog do Futuro: texto na cor, fundo a 12% e contorno a 45%. |
| `tag-enabler` | `#4453c4` | `#4453c4` | Texto da etiqueta Enabler (fundo #5b6be0 a 14%). |
| `tag-controle` | `#7a3399` | `#7a3399` | Texto da etiqueta Controle (fundo #8d3fb5 a 14%). |
| `nb-raised` | `#eef0f3` | `#3a3a3a` | Hover de botões de ícone e fundo do cartão Criar (a 45%). |
| `nb-flap` | `#e3e6eb` | `#484848` | Aba traseira da pasta do notebook. |
| `nb-stroke` | `#c3c9d2` | `#707070` | Contorno da pasta do notebook. |
| `nb-dash` | `#b3bac4` | `#777777` | Tracejado do cartão Criar notebook/projeto. |
| `nb-folder-card` | `#ffffff` | `#242424` | Frente da pasta do notebook. |
| `nbd-folder` | `#9b6fe0` | `#9b6fe0` | Ícone de pasta no detalhe do notebook. |
| `dlm-ink` | `#1f2a37` | `#eef2f6` | Menu lateral DarkLabs: título. |
| `dlm-text` | `#2f3a47` | `#d5dce4` | Menu lateral DarkLabs: itens. |
| `dlm-muted` | `#5b6573` | `#9aa6b3` | Menu lateral DarkLabs: rótulos de seção. |
| `dlm-guide` | `#d3d8df` | `#4a4a4a` | Menu lateral DarkLabs: linha-guia da árvore. |
| `dlm-active-bg` | `#eceef2` | `#3a3a3a` | Menu lateral DarkLabs: item ativo. |
| `dlm-accent` | `#1f3a5a` | `#f5f5f5` | Menu lateral DarkLabs: marcador do item ativo. |
| `highlight` | `#5e6fe1` | `#8b97ff` | Realce de linha/coluna cruzada na matriz do Roadmap (a 14% e 30%). |

## Tipografia

Fonte: **Montserrat** variável (100–900), pacote `@fontsource-variable/montserrat`. Família sans: `"Montserrat Variable", "Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. Mono: `ui-monospace, "SFMono-Regular", "Cascadia Mono", Consolas, monospace`.

Raiz do app: **14,5 px** (`html { font-size: var(--font-root-size, 14.5px) }`), ajustável de 12,5 a 19,5 px pelos botões A− / A+.

| Grupo | Estilo | Tamanho | Linha | Peso | Tracking | Exemplo | Uso |
|---|---|---|---|---|---|---|---|
| Títulos | `page-title` | 1.75rem | 1.2 | 700 | -0.01em | Notebooks | Título de página/caixa grande (nb-title, dlj-head__title): 25,4px com raiz 14,5px. |
| Títulos | `kpi-value` | 2rem | 1.2 | 650 | -0.9px | 1.200 | h1 e valor de KPI grande (--text-2xl). |
| Títulos | `kpi-value-sm` | 1.5rem | 1.15 | 700 | — | 207 | Valor dos KPIs do Backlog do Futuro. |
| Títulos | `portal-title` | 1.75rem | 1.2 | 700 | — | Jornada do Futuro | Abertura das páginas do Portal DarkLabs: clamp(1.35rem, 2vw, 1.75rem). |
| Títulos | `section-title` | 1.25rem | 1.3 | 700 | — | Épicos por superfície | Títulos de seção do Portal. |
| Títulos | `hero-featured` | 25.6px | 1.3 | 400 | -0.01em | Jornada Guiada | Título do bloco grande do mosaico, branco sobre foto. |
| Títulos | `hero-tile` | 16.8px | 1.3 | 400 | -0.01em | Backlog & Squads | Título dos blocos menores do mosaico. |
| Títulos | `lg` | 1.125rem | 1.3 | 600 | — | Criar projeto | Título de modal e de subseção (--text-lg). |
| Títulos | `card-title` | 1rem | 1.3 | 600 | — | Crédito on Wealth | Título de card no Portal. |
| Texto | `body` | 0.875rem | 1.5 | 400 | — | O backlog nasce do contexto e dos ciclos DarkLabs. | Texto base (--text-md): 12,7px com raiz 14,5px. |
| Texto | `body-sm` | 0.8125rem | 1.5 | 400 | — | Etapa: Épicos | Texto de controles, botões, pílulas, subtítulos, células (--text-sm). |
| Texto | `label` | 0.8125rem | 1.2 | 500 | — | Novo projeto | Texto de botão contornado e pílula de navegação. |
| Texto | `surface-title` | 0.8125rem | 1.2 | 700 | 0.01em | Cronograma | Título dentro do cabeçalho de caixa (.surface-title). |
| Texto | `caption` | 0.75rem | 1.5 | 400 | — | Atualizado há 2 dias | Metadados, notas, cabeçalho de tabela (--text-xs, piso informativo). |
| Texto | `eyebrow` | 0.66rem | 1.2 | 700 | 0.08em | HISTÓRIAS | Rótulo em caixa alta dos KPIs. Use text-transform: uppercase. |
| Texto | `tab` | 12px | 1 | 500 | — | Planejamento | Abas da barra de abas (branco); ativa em 650. |
| Código | `code` | 0.75rem | 1.4 | 600 | — | EP-01 · FT-014 | Códigos de épico/feature (bf-epc). |

Variáveis do app: `--text-xs` .75rem · `--text-sm` .8125rem · `--text-md` .875rem · `--text-lg` 1.125rem · `--text-xl` 1.375rem · `--text-2xl` 2rem; pesos `--weight-regular` 400 · `--weight-medium` 500 · `--weight-semibold` 600 · `--weight-bold` 650.

## Espaçamento e medidas

| Token | Valor | Uso |
|---|---|---|
| `space-1` | `4px` | Gap ícone-texto mínimo, padding vertical de selos. |
| `space-2` | `8px` | Gap entre botões, padding de célula de tabela. |
| `space-3` | `12px` | Padding de aviso e de cabeçalho; card-pad. |
| `space-4` | `16px` | Padding horizontal de avisos; gap de cabeçalhos. |
| `space-5` | `20px` | Padding lateral da topbar. |
| `space-6` | `24px` | Padding superior das caixas grandes (.nb, .dlj-sheet: 24 26 26). |
| `space-8` | `32px` | Separação entre blocos de página. |
| `space-10` | `40px` | Respiro grande. |
| `space-12` | `48px` | Respiro de página vazia. |
| `card-pad` | `12px` | Padding interno da caixa compacta (.surface). |
| `card-gap` | `8px` | Gap entre caixas empilhadas na página. |
| `control-h` | `36px` | Altura única de botões e campos. |
| `topbar-h` | `40px` | Altura da barra de abas; a topbar tem topbar-h + 10px = 50px. |
| `sidebar-w` | `254px` | Largura da barra lateral. |
| `nb-card-w` | `190px` | Largura do cartão de pasta (altura 150px), grid auto-fill com gap 14px. |

## Raios

| Token | Valor | Uso |
|---|---|---|
| `radius-sm` | `4px` | Selo de código, cantos pequenos. |
| `radius-md` | `8px` | Campos, segmentado, botões de ícone, avisos curtos. |
| `radius-lg` | `10px` | Avisos (dlj-aviso), tabelas roláveis, KPIs, balões do chat. |
| `radius-xl` | `12px` | Caixas de página (.nb, .dlj-sheet, .surface). |
| `radius-menu` | `14px` | Painel de menu ⋯. |
| `radius-field` | `16px` | Cartão de projeto, campo grande de modal (nb-field), compositor do chat. |
| `radius-dialog` | `22px` | Modais (Criar projeto, Renomear, Excluir). |
| `radius-folder` | `20px` | Cartão Criar e pasta do notebook (24 no desenho da pasta). |
| `radius-full` | `999px` | Botões em pílula, pílulas de navegação, etapas do stepper. |

## Sombras

| Token | Valor | Uso |
|---|---|---|
| `shadow-1` | claro `0 2px 7px #202c3808` · escuro `0 2px 7px #00000040` | Caixas (.surface). |
| `shadow-2` | claro `0 4px 14px #21374b0f` · escuro `0 4px 14px #00000059` | Card em hover. |
| `shadow-panel` | claro `-10px 0 35px #182d410a` · escuro `-10px 0 35px #00000066` | Painel lateral. |
| `shadow-overlay` | claro `-16px 0 50px #062b4f26` · escuro `-16px 0 50px #00000080` | Painel do Delta sobre a página. |
| `shadow-toast` | claro `0 7px 25px #102b3a22` · escuro `0 7px 25px #102b3a22` | Toast. |
| `shadow-menu` | claro `0 8px 24px #102b3a1f` · escuro `0 8px 24px #00000080` | Menus suspensos e painel ⋯. |

## Camadas (z-index)

| Token | Valor | Uso |
|---|---|---|
| `z-sticky` | `5` | Cabeçalhos fixos de tabela. |
| `z-topbar` | `20` | Topbar. |
| `z-sidebar` | `30` | Barra lateral. |
| `z-panel` | `50` | Painel do Delta. |
| `z-modal` | `60` | Modais. |
| `z-menu` | `70` | Menus. |
| `z-toast` | `80` | Toasts. |

---

# Componentes

## Login

Tela de acesso Capgemini + DarkLabs em duas colunas: o lado institucional escuro (1,5fr) e o painel de acesso claro (mínimo 420 px).

### Lado institucional
- Fundo noturno `#04061a` com radial `#080c2a`, grade animada de 64 px (linhas brancas a 4%), células e feixes em ciano `#38d1f5` e violeta `#a24fd6`, e o texto fantasma "Make it real" desfocado a 15%.
- Logos no topo: Capgemini branca (188 px) + filete branco a 30% + marca DarkLabs branca "by capgemini" (124 px).
- Sobretítulo "CAPGEMINI + DARKLABS" em 12 px peso 700, caixa alta com +0,14em, ciano com ponto luminoso.
- Título "Make it real!" com o degradê da marca em "it real!"; subtítulo "with AI, technology and people."; texto de apoio e chips em pílula com borda branca a 22%.

### Painel de acesso
- Fundo `#f6f7fb` com brilhos radiais azul-claro `#e3f3fb` e lilás `#efe9f8`; cartão de até 430 px.
- Sobretítulo "ACESSO À PLATAFORMA" (11,5 px, 600, +0,18em, `#5b6178`); título "Bem-vindo(a)." 36 px peso 700, tracking -0,035em, tinta `#0b0f2a`.
- Campos de 52 px, raio 10 px, borda `#e3e6ef`, ícone à esquerda; foco com borda `#3a66e0` e halo de 3 px a 16%.
- "Esqueci minha senha" e "Solicitar acesso" em vermelho Capgemini `#d0021b`, 12 px peso 600.
- **Entrar**: 52 px, raio 10 px, degradê `brand-blue` → `brand-indigo` → `brand-violet`, texto branco 15 px peso 600, sombra azulada.
- "ou continue com" entre filetes; **Entrar com conta corporativa**: 50 px, branco, borda `#e3e6ef`, ponto vermelho.
- Notas finais em 10 px: escudo sobre `#eef0f6` e informação com filete superior.

A paleta do login é própria e fixa: não muda com o tema claro/escuro. Abaixo de 860 px vira uma coluna e esconde os chips e o texto de apoio.

## TopBar

Barra superior do app (50 px) com marcas, menu de sistemas e utilitários. A prévia usa o markup real do app com `app.css`.

- **Marcas**: Capgemini (colorida no claro, branca no escuro), filete de 1×26 px `color-border-strong`, marca DarkLabs.
- **Sistemas** (centro): Jornada Guiada, Portal DarkLabs, EM Financial, EM Audit, EM Certification, Painel Admin. Texto 13 px peso 600 `color-text-muted`; ativo em `color-text-heading` com sublinhado de 2 px `color-control-accent`. A escolha fica salva no navegador (`tm.sistema.v1`).
- **Utilitários** (direita): diminuir/aumentar fonte (A− / A+), favoritos, relatório, tema claro/escuro, interruptor do modo dourado do Delta, botão **Delta** (símbolo em degradê, fundo `color-surface-subtle`) e avatar redondo de 30 px.

## TabsBar

Barra de abas da Jornada Guiada, logo abaixo do mosaico. A prévia usa o markup real do app com `app.css`.

- Altura `topbar-h` (40 px), degradê `tabs-c1` → `tabs-c2` → `tabs-c3` (azul → índigo → violeta no claro; grafite #292929 → #1f1e1d no escuro).
- À esquerda: interruptor "Esconder menu ao rolar" e o botão que recolhe/expande o mosaico (ícone de mosaico + chevron), em pílulas com borda branca; um divisor vertical de 18 px.
- **Abas, em ordem**: Criação de Contexto, DarkLabs, Projetos, Backlog do Futuro | Épicos, Features e Histórias, Escopo das Squads, Cronograma | Resultados, Dashboards, Delta Builder. Divisores finos separam os grupos (Upstream, Backlog & Squads/Planejamento, Resultados).
- Cada aba: ícone 15 px + texto 12 px peso 500 em branco a 88%. Hover: branco a 14%. Ativa: fundo branco a 24%, texto branco peso 650 e sublinhado interno de 3 px branco.
- O ícone do Delta Builder é sempre branco, também no modo dourado.

## HeroMosaic

Mosaico de fotos no topo da Jornada Guiada (recolhível pela barra de abas). A prévia usa o markup real do app com `app.css`.

- Bloco grande à esquerda (metade da largura) e três blocos à direita: um largo em cima e dois embaixo. Cada bloco é um carrossel com setas, pontos (traços brancos) e troca de foto em fade.
- Grupos e títulos reais: **Jornada Guiada** (Upstream: Criação de Contexto · DarkLabs · Projetos · Backlog do Futuro), **Backlog & Squads** (Épicos, Features e Histórias · Escopo das Squads), **Planejamento** (Cronograma) e **Resultados** (Resultados e diagnóstico das squads · Dashboards · Delta Builder).
- Foto em `object-fit: cover` com escurecimento na base; texto sempre branco, título 25,6 px no bloco grande e 16,8 px nos demais, peso 400.
- Pílula de grupo no topo à esquerda (`hero-pill-bg` a 92%, texto #10425f, 12 px peso 600); marca DarkLabs branca a 50% no canto do bloco grande.
- Rodapé de cada bloco: ícone em círculo azul + subtítulo à esquerda (ex.: "Gestão de Portfólio", "4 squads · 8 profissionais") e indicador à direita (ex.: "PRJ-001 · Backlog em geração", "29 features", "50,9% até o Freezing").
- O bloco ativo ganha uma faixa inferior azul. Use só as fotos do grupo Mosaico.

## ProjectBar

Barra de identidade do projeto com o stepper das etapas, em uma única linha, no topo de cada etapa da jornada. A prévia usa o markup real do app com `app.css`.

- Selo do código (`PRJ-001`): fundo `color-primary-50`, texto `color-primary-700`, peso 650, raio `radius-sm`. Ao lado, o nome em `color-text-heading` peso 600 e "Etapa: <nome>" em 12 px `color-text-muted`. Não mostre o id longo (PRJ-001-2026-11-19-01).
- Stepper com **no máximo 5 etapas visíveis**, sem quebra de linha; a janela anda com a etapa atual.
  - Concluída: círculo de 20 px preenchido com `color-primary-500` e check branco.
  - Atual: o botão vira uma pílula com contorno `color-primary-500` e texto `color-primary-700` peso 600.
  - Pendente: círculo com contorno e número, texto a 60% de opacidade.
  - Conectores de 18 px; `color-primary-500` entre etapas concluídas.
- Botão de informação (i) em quadrado de 36 px no fim da barra.
- Caixa: fundo `color-surface`, borda `color-border`, raio `radius-xl`.

## NavPills

Pílulas de navegação entre visões de uma mesma página: filtros dos Notebooks (Tudo / Compartilhado / Apenas você), etapas do DarkLabs e visões do Backlog do Futuro.

- 34 px de altura, raio `radius-full`, sem borda, texto 13 px peso 500.
- Hover: `color-surface-selected`. Selecionada: `color-selected-bg` + `color-selected-text`, peso 600.
- Ícone opcional de 16 px antes do texto. Gap 6 px entre pílulas.

## Gantt

Cronograma detalhado por squad e feature na visão **Gantt** (aba Cronograma, que abre sempre nesta visão). A prévia usa o markup real do app com `app.css`.

### Cabeçalho da caixa
- Título "Cronograma detalhado por squad e feature" (13 px peso 700) + contador ("29 features").
- Ações em pílulas contornadas: Desfazer, Restaurar valores iniciais, Exportar JSON, Exportar CSV; o segmentado **Gantt / Grade** (selecionado em `color-selected-bg`); Expandir matriz; filtro em botão de ícone.
- Linha "Modalidade de alocação": segmentado Fluxo Contínuo (C1) / Semanas Inteiras (C0) / Alocação Manual, com a explicação ao lado em `color-text-muted`.

### Matriz
- Colunas fixas à esquerda: Feature, US, Horas, Semanas, Situação (selo "No prazo" em `color-success-*`, "Fora da janela" em `color-danger-*`).
- Linha do tempo à direita em três níveis: mês (caixa alta, 700), sprint (SP 04…) e semana (S01 + data). Cabeçalho em `color-surface-subtle`.
- **Semana atual**: coluna com contorno de 2 px `color-link`, fundo `color-link` a 15% e o rótulo "ATUAL".
- **Freezing**: coluna hachurada (`--freeze-hatch`, `color-danger-bg` a 135°) com cadeado e rótulo vermelho.
- Cada squad tem uma cor (`chart-1` azul, `chart-2` laranja, `chart-3` verde, `chart-4` âmbar…), aplicada ao ponto da squad, às barras e ao fundo suave da linha de parâmetros (cor a 4%).
- Linha da squad: blocos de capacidade semanais na cor da squad. Ao expandir, cada feature mostra **barras horizontais contínuas** na cor da squad; semanas parciais ficam mais claras (opacidade proporcional à fração).
- Parâmetros com controle deslizante (trilho `color-control-accent`, botão navy de 16 px) e campo numérico de 36 px com unidade ("56 h", "160 h").
- Códigos de épico (`EPC-001`) em selo mono com borda.

## RoadmapMatrix

A mesma matriz do cronograma na visão **Grade**: em vez de barras, cada célula mostra as semanas alocadas como número editável. A prévia usa o markup real do app com `app.css` (no tema escuro, como referência).

- Estrutura, colunas fixas, cabeçalho de mês/sprint/semana, semana atual e Freezing idênticos ao Gantt.
- Células de feature: valor em 12 px peso 600 `color-text-heading` (ex.: 2,9 · 0,4); ao passar o mouse vira um campo de 24 px com borda `color-border-field`; inválido com borda `color-danger-600`.
- Célula acima da capacidade: contorno interno de 2 px `color-danger-600`; uso excedido com fundo `color-danger-bg`.
- Linha cruzada em destaque com `highlight` (14% e 30%) ao focar uma célula.
- Alterne entre Gantt e Grade pelo segmentado do cabeçalho; a escolha não muda os dados.

## RoadmapOndas

A visão **Roadmap** do Backlog do Futuro, no formato da aba ROADMAP da planilha "Roadmap do Futuro": squads por linha e trimestres por coluna. A prévia usa o markup real do app com `app.css`, com o exemplo ilustrativo da planilha.

- Abre a caixa do Backlog do Futuro: título `page-title`, subtítulo, pílulas de navegação (Resumo, **Roadmap**, Épicos, Features, Histórias, Dicionário, Geração) e o aviso bege dizendo de onde vêm os dados, com "Ver dados do projeto" / "Ver exemplo ilustrativo".
- Faixa de diretriz: fundo `color-surface-subtle`, filete esquerdo de 3 px `color-primary-700`, ícone de bússola, texto 13 px.
- Chips de recorte do portfólio ("Backlog 2027: 11 épicos priorizados / 178 features…") em pílulas com borda `color-border`.
- Tabela principal: Tribo, Squad (nome em 700 + "Início 2027"), Produto principal, Foco principal e uma coluna por trimestre (Q1/27…), agrupadas por semestre no cabeçalho. Células de entrega com fundo `color-surface-subtle`; trimestres sem entrega mostram "—".
- Abaixo, um cartão por ano com Período, Objetivo principal, Entregas de valor, Squads mais ativas e Retorno esperado.
- Os emojis de tribo e squad vêm da própria planilha; não os use fora desta visão.

## Sheet

Caixa de página: o contêiner padrão de cada tela (Notebooks, Projetos, Portal DarkLabs, Backlog do Futuro).

- Padding 24 26 26, raio `radius-xl` (12 px), borda `color-border`, fundo `color-surface`, gap interno 18 px.
- Cabeçalho: título `page-title` (1,75rem, 700) + subtítulo 13 px `color-text-muted`; ações à direita.
- Caixas empilhadas na página ficam separadas por `card-gap`.
- Variante compacta (`surface`): padding `card-pad`, sombra `shadow-1`, cabeçalho com filete e título 13 px peso 700.

## Notice

Aviso em faixa: o bege (`dlj-aviso`) explica um pré-requisito ou o próximo passo; as variantes informam, confirmam ou alertam.

- Padding 12 16, raio `radius-lg`, texto 13 px, linha 1,5; ações à direita (botões padrão).
- **Bege (padrão)**: `color-warning-bg` / `color-warning-text` / `color-warning-border`. Ex.: "Gere o contexto antes de abrir o DarkLabs."
- **Info**, **Sucesso** e **Erro** usam os tokens semânticos correspondentes.
- Destaque com `<strong>` peso 600, nunca negrito em todo o texto.

## DataTable

Tabela de dados (`jg-table`, `bf-*`): densa, filetes horizontais, sem zebra.

- Cabeçalho 12 px peso 600 `color-text-muted`, filete inferior `color-border-strong`.
- Células com padding 8 px e filete `color-border`; hover `color-surface-hover`; linha selecionada `color-surface-selected`.
- Códigos em mono (`code`), tipos e ondas em selos (ver Tags). Paginação de 25 linhas.

## Kpi

Indicador numérico do Backlog do Futuro e dos painéis.

- Fundo `color-surface-subtle`, borda `color-border`, raio `radius-lg`, padding 12 14.
- Rótulo `eyebrow` (caixa alta, 0,66rem, 700, espaçamento .08em), valor `kpi-value-sm` (1,5rem, 700) em `color-text-heading`, nota 12 px `color-text-muted`.
- Em grade de 4 colunas com gap 8 px.

## Tags

Selos compactos: tipo do item, onda de entrega, código e sinalizador.

- Pílula, 12 px peso 600, padding 2 8.
- **Tipo**: História (`color-info-*`), Enabler (`tag-enabler` sobre #5b6be0 a 14%), Controle (`tag-controle` sobre #8d3fb5 a 14%), NFR (neutro), Hipótese (`color-warning-*`).
- **Onda** W0–W4: texto `onda-w*`, fundo da mesma cor a 12% e borda a 45%.
- **Código** (`code`): mono, borda `color-border-strong`, raio `radius-sm`.
- **Sinalizador**: tracejado quando desligado; ligado com `color-success-*`.

## Button

Botão em pílula com contorno: a forma única de todos os botões de texto do app (36 px de altura, raio radius-full).

### Variantes
- **Padrão (contornado)**: borda `color-border-strong`, fundo transparente, texto `color-text-heading`, peso 500. Hover: `color-surface-hover`.
- **Primário** (`btn--primary`): preenchido com `color-selected-bg` e texto `color-selected-text`, peso 600. Hover: `filter: brightness(.92)`. Um por área de ação (ex.: "Criar projeto", "Salvar alterações").
- **Perigo** (`btn--danger`): `color-danger-bg` / `color-danger-text` / `color-danger-border`. Só para confirmar exclusões.
- **Link** (`btn--link`): sem borda, texto `color-link`, 28 px.

### Regras
- Altura `control-h` (36 px) e padding 0 16px em todas as páginas; o tamanho "sm" não encolhe mais.
- Ícone de 16 px antes do texto, gap 8px. Rótulo em pt-BR, verbo no infinitivo: "Criar projeto", "Exportar".
- Desabilitado: opacidade .45.
- Foco: anel `color-focus` 2 px com offset 2 px.

## IconButton

Botão só com ícone (36 px, ou 28 px no tamanho sm) para ações secundárias como o menu ⋯, voltar ou fechar.

- Sem borda e sem fundo em repouso; hover com `nb-raised`.
- Tamanho sm: 28 px, raio `radius-md`, ícone em `color-text-muted`.
- Sempre com `aria-label` em pt-BR ("Mais ações", "Fechar").

## Menu

Painel do menu ⋯ dos cartões (Renomear, Excluir, Editar projeto).

- Mínimo 180 px, padding 6 px, raio `radius-menu` (14 px), borda `color-border`, sombra `shadow-menu`.
- Itens de 34 px com ícone 16 px + texto 13 px; hover `color-surface-hover`; ação destrutiva em `color-danger-text`.
- Excluir pede confirmação no próprio menu antes de agir. Fecha com Esc ou clique fora.

## Field

Campos de texto, busca em pílula, campo grande de modal e controle segmentado.

- **Input**: 36 px, borda `color-border-field`, raio `radius-md`, placeholder `color-text-subtle`; foco com anel `color-focus`.
- **Rótulo**: 12 px (`caption`), peso 600, `color-text-muted`, 4 px acima do campo.
- **Busca** (pílula): borda `color-border-strong`, raio `radius-full`, ícone de lupa à esquerda. Usada sobre listas (Notebooks, empresas).
- **Campo grande** (`field-lg`): 46 px, raio `radius-field` (16 px). Dentro de modais.
- **Segmentado**: alternância curta (ex.: Grade / Gantt). Segmento selecionado com `color-selected-bg`.

## NotebookCard

Cartão em forma de pasta que representa um contexto (notebook), com o cartão tracejado de criação ao lado.

- 190×150 px, desenhado em SVG: aba traseira `nb-flap`, frente `nb-folder-card`, contorno `nb-stroke` 1 px, raio 24 no desenho.
- Ícone de pasta 18 px no canto da aba; à direita da aba, cadeado/compartilhado + tempo relativo (12 px `color-text-muted`).
- Nome 13 px peso 500, até 3 linhas; meta na base ("12 fontes").
- Menu ⋯ no alto do corpo (top 36 px, direita 8 px): Renomear e Excluir (com confirmação).
- Criar: 190×150, tracejado 1,5 px `nb-dash`, fundo `nb-raised`, raio `radius-folder`.
- Grade auto-fill de 190 px, gap 14 px.

## ProjectCard

Cartão de projeto da caixa Projetos (acima dos Notebooks, na tela Contexto).

- 190×120 px, borda `color-border-strong`, raio `radius-field`, fundo `nb-folder-card`; hover `nb-raised`.
- Topo: código (`PRJ-001`, 12 px peso 700 sobre `nb-raised`) e o selo "ATUAL" (`color-selected-bg`, 0,62rem, caixa alta).
- Nome 13 px `color-text-heading` (2 linhas), empresa 12 px com ícone, etapa na base (0,7rem `color-text-muted`).
- Projeto atual: borda `color-selected-bg` + halo de 2 px a 22%.
- Menu ⋯ no topo direito: "Editar projeto".

## CompanyPicker

Modal "Criar projeto", primeiro passo: escolher a empresa do projeto.

- Modal: largura até 640 px, padding 28 28 24, raio `radius-dialog` (22 px), sombra 0 24px 64px -24px; título 1,45rem peso 600.
- Busca em pílula (sem acento: "energia" acha "Energia Atlântica"), grade de 2 colunas de empresas (gap 8 px).
- Empresa: avatar de 34 px com as iniciais, nome 13 px + setor 12 px, rádio de 16 px; selecionada com borda e avatar `color-selected-bg`.
- "Outra empresa" em tracejado. Rodapé: contador + Cancelar / Continuar (primário).
- Em edição o título vira "Editar projeto PRJ-001" e o botão "Salvar alterações".

## DeltaChat

Painel de chat do agente Delta (barra lateral + conversa).

- Barra lateral `color-surface-subtle`, **sem negrito**: itens, pastas, conversas e rótulos de seção em peso 400 (`weight-regular`). Item ativo com `color-surface-selected`.
- Pergunta do usuário: balão `color-primary-50`, texto `color-text-heading`, raio `radius-lg`, alinhado à direita.
- Resposta do Delta: fundo `color-surface-subtle`, borda `color-border` e filete esquerdo de 3 px `color-accent-gold`.
- Compositor em pílula arredondada (`radius-field`) com microfone e enviar.
- O painel abre com animação de opacidade/deslocamento sem `will-change` permanente (evita fonte borrada).

## DeltaMascot

O mascote do agente Delta: personagem 3D com cabeça em pílula e visor escuro, corpo em ▽ e bracinhos, nas cores da marca.

- Paleta: `mascot-c1` (azul) → `mascot-c2` (índigo) → `mascot-c3` (violeta); brilho do visor `mascot-eye`. No modo dourado (`data-delta-gold`): `mascot-gold-1..3` e `mascot-gold-eye`.
- Montado em camadas (cabeça, corpo, braço esquerdo, braço direito) do grupo Mascote/camadas, com o rosto em SVG por cima (estrelas, boca, bochechas), para os estados parado, correndo, acenando, pulando, esperando, trabalhando, revisando e falha.
- Fixo no canto, 92 px de largura, sombra elíptica no chão. Use as imagens prontas (delta.png, delta-dourado.png) em documentos e slides.
- Não redesenhe nem mude as proporções; não coloque texto sobre ele.

## Toast

Notificação curta após uma ação ("Projeto criado", "Notebook renomeado").

- Fundo `color-toast-bg`, texto branco 13 px, raio `radius-md`, sombra `shadow-toast`, ícone de check.
- Some sozinha em alguns segundos; uma de cada vez, no canto inferior.

---

# Recursos visuais

## Marcas

Capgemini (colorida, branca, transparente), DarkLabs (preta e branca, com e sem "by capgemini") e o símbolo do Delta.

- Tema claro: `capgemini-transparente.png` + `darklabs-preto.png` (tinta #1f1e1d). Tema escuro: `capgemini-branco.png` + `darklabs-branco.png`.
- Na topbar: Capgemini com 22 px de altura, filete de 1×26 px `color-border-strong`, DarkLabs com 66 px de largura.
- `delta-simbolo.svg`: degradê `delta-glyph-1` → `delta-glyph-4` (de baixo à esquerda para cima à direita). Na barra de abas o símbolo é branco.
- As marcas DarkLabs foram renderizadas do SVG do app (`DarklabsMark`, em Montserrat 500/700).

Arquivos:

- `capgemini-branco.png`
- `capgemini-transparente.png`
- `capgemini.png`
- `darklabs-branco.png`
- `darklabs-by-capgemini-branco.png`
- `darklabs-by-capgemini-preto.png`
- `darklabs-preto.png`
- `delta-simbolo.svg`

## Mascote

O Delta em 3D: `delta.png` (cores da marca) e `delta-dourado.png` (modo dourado), com fundo transparente.

`camadas/` traz as partes que o app empilha (cabeça, corpo, braço esquerdo, braço direito, cada uma com versão `-ouro`); o rosto (estrelas, boca, bochechas) é desenhado em SVG por cima, em `DeltaMascot.jsx`. Posições no viewBox 120×150: cabeça 12,14 (96×58), corpo 33,63 (54×60), braço esquerdo 28,80 (12×25), braço direito 80,80 (12×25).

Arquivos:

- `camadas/braco-d-ouro.webp`
- `camadas/braco-d.webp`
- `camadas/braco-e-ouro.webp`
- `camadas/braco-e.webp`
- `camadas/cabeca-ouro.webp`
- `camadas/cabeca.webp`
- `camadas/corpo-ouro.webp`
- `camadas/corpo.webp`
- `delta-dourado.png`
- `delta.png`

## Ícones

Os 59 ícones do app (`src/components/ui/Icon.jsx`): viewBox 24×24, traço 1,65 px arredondado, sem preenchimento. Os arquivos usam a tinta `color-text-heading` (#263c4e); no código a cor é `currentColor`, então o ícone herda a cor do texto. Nomes iguais aos do componente `<Icon name="…">`.

Arquivos:

`arrowLeft` · `calendar` · `chart` · `chat` · `check` · `chevronDown` · `chevronRight` · `close` · `collapse` · `compass` · `download` · `edit` · `eraser` · `expand` · `fileExport` · `fileText` · `filter` · `folder` · `folderPlus` · `fontDecrease` · `fontIncrease` · `gantt` · `gauge` · `grid` · `home` · `info` · `layers` · `lock` · `menu` · `mic` · `micOff` · `monitor` · `moon` · `mosaic` · `paperclip` · `plus` · `report` · `reset` · `roadmap` · `search` · `send` · `settings` · `sidebar` · `sliders` · `sparkle` · `star` · `stop` · `sun` · `table` · `tasks` · `trash` · `undo` · `upload` · `users` · `voice` · `volume` · `wallet` · `wand` · `warning`

## Mosaico

Fotos dos blocos do mosaico da Jornada Guiada (1376×768), uma por aba: contexto, DarkLabs, projetos, backlog do futuro, épicos, squads, cronograma (grade e Gantt) e resultados. Sempre com escurecimento na base e texto branco por cima.

Arquivos:

- `escopo-epicos.jpg`
- `escopo-squads.jpg`
- `jornada-backlog-futuro.jpg`
- `jornada-contexto.jpg`
- `jornada-darklab.jpg`
- `jornada-projetos.jpg`
- `planejamento-gantt.jpg`
- `planejamento-grid.jpg`
- `resultados-builder.jpg`
- `resultados-curva.jpg`
- `resultados-diagnostico.jpg`

## Ilustrações

`ciclo-darklabs.webp`: o diagrama do ciclo DarkLabs usado no Portal DarkLabs.

Arquivos:

- `ciclo-darklabs.webp`

No código do app, os arquivos ficam em `src/assets/` (logos, `hero/`, `delta/`, `darklabs/`) e os ícones em `src/components/ui/Icon.jsx`.

