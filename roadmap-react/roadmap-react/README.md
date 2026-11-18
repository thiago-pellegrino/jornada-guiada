# Simulador de Roadmap e Capacity — NextPrev

Simulador executivo de roadmap e capacidade das squads (agosto a dezembro de 2026), seguindo o
**Design System NextPrev — Portal do Gestor** (`../../DESIGN-SYSTEM-FRONTEND.md`) e a especificação
`../../specs/001-modernizar-simulador-roadmap/`.

Construído com React 19 e Vite 8, sem bibliotecas extras: gráficos em SVG, estilos com CSS Custom
Properties e testes com o runner nativo do Node (`node --test`).

## O que dá para fazer

- **Simulação executiva em 2 colunas**: premissas do ciclo (semana inicial, jornada de 30 h ou 40 h,
  Freezing em 17/12/2026), controles deslizantes sincronizados com campos numéricos (média de horas
  por história e profissionais por squad) e indicadores recalculados na hora.
- **Indicadores**: previsão de conclusão do backlog e squad gargalo, entregas até o Freezing (US,
  features e horas), saldo de capacidade e **recomendação de profissionais** por squad para entregar
  tudo até S24.
- **Três modalidades de alocação**
  - *Fluxo Contínuo (C1)*: aproveita o saldo de horas da semana para iniciar a próxima feature.
  - *Semanas Inteiras (C0)*: cada feature reserva semanas inteiras e exclusivas (comportamento do protótipo anterior).
  - *Alocação Manual*: você distribui as histórias por semana; a matriz sinaliza **sobrecarga**,
    histórias não alocadas e bloqueia a coluna Freezing.
- **Curva de entrega acumulada × capacidade**, com marcos (S06, S14, S21 Homologação, S23 Produção,
  Freezing), navegação por teclado e tabela equivalente.
- **Matriz/Gantt** com filtros combináveis (squad, épico, situação e texto), chips removíveis, edição
  de US, coluna explícita de **excedente pós-S26** (nada é truncado) e modo foco.
- **Shell do Portal do Gestor**: menu lateral (apenas o link do simulador), busca (`Ctrl+K`), tema **Claro / Escuro / Sistema**,
  favorito e painel do **Copiloto** com respostas sobre o cenário e propostas que só são aplicadas
  depois da sua confirmação (com “Desfazer lote”).
- **Cenários**: salvamento automático no navegador, Desfazer (30 níveis), restauração em dois cliques,
  exportação do cenário em JSON, exportação da matriz em CSV (Excel pt-BR) e **Exportar estudo em PDF**
  (sempre em tema claro).

## Atalhos

| Tecla | Ação |
|---|---|
| `Ctrl+K` / `⌘K` | Foca a busca de features |
| `Esc` | Sai do modo foco → fecha o Copiloto → fecha o menu → cancela a restauração → limpa a busca |
| `←` `→` `Home` `End` | Percorrem as semanas da curva (com o gráfico focado) |
| Duplo clique / botão direito no nome da feature | Auto-distribuir / limpar (modo manual) |

## Executar

Nesta pasta (ou na raiz do repositório, que encaminha os mesmos scripts):

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # testes do motor e da persistência (node --test)
npm run build    # build de produção em dist/
```

## Jornada Guiada (protótipo sem backend)

As abas **Criação de Contexto → Darklab → Projetos → Backlog do Futuro** seguem o fluxo
Contexto → DarkLab → Projeto → Backlog sobre um único projeto (`PRJ-NNN`), criado no Contexto antes do
primeiro upload e usado como identificador em todas as etapas.

- As capacidades são lidas em tempo de build de `../../especificações/*.md` (frontmatter + exemplo mínimo
  de saída). Alterar uma especificação muda o cartão e o resultado simulado.
- Cada execução é **simulada** no navegador: o resultado é o exemplo mínimo da capacidade, ajustado ao
  projeto (ids de fonte, épico, feature e história), gravado como nova revisão com estado de revisão humana.
- Regras validadas: 002 só com todas as fontes analisadas; dependências do frontmatter; Backlog bloqueado
  sem ficha do projeto pronta (`422 projeto_nao_definido`); etapa do projeto derivada e sem regressão;
  permissões pelo papel do usuário no projeto (quem cria é Administrador).
- Identificador interno do projeto no formato `PRJ-NNN-AAAA-MM-DD-SS` (código, data de criação e sequência
  do dia); projetos salvos com o formato antigo são convertidos ao abrir.
- Modo Turbo por fase, com opção de simular falha num nó: os dependentes ficam como pulados.
- Estado em `localStorage` (`jornada.v1`); “Reiniciar protótipo”, na aba Projetos, apaga só esses dados.


```text
src/
├── data/initialRoadmapData.js      # Semanas S05–S26 + Freezing, marcos e squads (SEMANAS.xlsx)
├── domain/simulationEngine.js      # Motores C1, C0 e manual, KPIs, curva e Copiloto (puro)
├── domain/scenarioSerializer.js    # localStorage v2, migração do protótipo antigo, JSON e CSV
├── domain/format.js                # Formatação pt-BR
├── domain/journey/                 # Leitor do catálogo de especificações e motor da jornada (puros)
├── journey/                        # Catálogo (import.meta.glob) e JourneyProvider (estado + simulação)
├── components/journey/             # Barra do projeto, cartões, Turbo, visualizador de artefato
├── hooks/useSimulationState.js     # Estado, Desfazer e restauração em dois cliques
├── hooks/useTheme.js               # Tema Claro / Escuro / Sistema
├── components/shell/               # Sidebar, Topbar, PageHeader, CopilotDrawer
├── components/simulator/           # Premissas, Parâmetros, Curva, KPIs, Diagnóstico
├── components/matrix/              # Barra de filtros e matriz/Gantt
├── components/ui/                  # Icon, Badge (150×22), SliderField, NumberInput, Toast
└── styles/                         # tokens, shell, simulator, roadmap-matrix, print
tests/                              # node --test
```

## Dados e privacidade

Tudo roda no navegador. O cenário fica em `localStorage` (`roadmap.sim.v2`); dados do protótipo
anterior (`roadmap.avg`, `roadmap.squads`) são migrados automaticamente e não são apagados.
