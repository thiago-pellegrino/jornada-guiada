# Feature Specification: Modernização do Simulador de Roadmap e Capacity

**Feature Branch**: `001-modernizar-simulador-roadmap`  
**Created**: 2026-11-16  
**Status**: Draft  
**Input**: User description: "utilize o plano para gerar a especificação PLANO-EVOLUCAO-ROADMAP.md DESIGN-SYSTEM-FRONTEND.md"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Simulação Executiva de Capacidade e Prazos em Tempo Real (Priority: P1)

Um gestor de portfólio ou líder de engenharia acessa o simulador para avaliar se o quadro atual de profissionais das 4 Squads (Módulos A, B, C e D) é suficiente para entregar o escopo de 29 features (163 histórias) dentro do ciclo de Agosto a Dezembro de 2026, respeitando a data de congelamento (*Freezing* em `17/12/2026`). Na coluna esquerda de parâmetros, o gestor ajusta as premissas do ciclo (jornada semanal de `30h` ou `40h` por profissional, semana inicial de planejamento e média de horas por história) e altera a quantidade de profissionais de cada Squad por meio de controles deslizantes sincronizados com campos numéricos. Imediatamente, na coluna executiva à direita, os cartões de indicadores exibem o horizonte previsto de conclusão, o volume e percentual de entregas concluídas antes do *Freezing*, o diagnóstico detalhado de folga ou déficit de semanas por Squad e a recomendação automática de quantos profissionais adicionais seriam necessários para eliminar atrasos.

**Why this priority**: Entrega o valor central de tomada de decisão executiva que hoje inexiste na planilha original, permitindo identificar gargalos e dimensionar equipes instantaneamente sem contar células manualmente.

**Independent Test**: Pode ser testada de forma independente abrindo o simulador com os dados iniciais do catálogo, alterando a média de horas por história ou o número de profissionais de qualquer Squad nos controles de parâmetros e validando que os cartões de indicadores e o quadro de diagnóstico recalculam imediatamente os totais de horas, semanas necessárias, percentual entregue até o *Freezing* e sugestão de profissionais.

**Acceptance Scenarios**:

1. **Given** o cenário padrão carregado (`56h` por história, `40h` semanais por profissional e Squads A=4, B=1, C=1, D=2 pessoas), **When** o gestor visualiza o painel executivo à direita, **Then** o sistema apresenta o total de entregas viáveis até o *Freezing* (`17/12/2026`), destaca a Squad de maior atraso como gargalo do portfólio e informa quantos profissionais faltam em cada Squad deficitária para cumprir o prazo.
2. **Given** a Squad B inicialmente com `1` profissional e déficit de prazo, **When** o gestor move o controle deslizante (ou digita no campo numérico sincronizado) aumentando o time da Squad B até o número recomendado pelo diagnóstico, **Then** a capacidade semanal da Squad B é atualizada na hora e seu status passa para dentro do prazo antes do *Freezing*.
3. **Given** o seletor de jornada semanal configurado em `40h` por profissional (visão C1), **When** o gestor alterna a premissa para `30h` por profissional (visão C0), **Then** a capacidade semanal de todas as Squads e as durações em semanas de todas as 29 features são recalculadas proporcionalmente em toda a tela.

---

### User Story 2 - Comparação de Modalidades de Alocação e Curva Visual de Marcos (Priority: P2)

Um gestor de planejamento deseja comparar o impacto metodológico entre reservar semanas inteiras exclusivas por feature (visão conservadora) ou aproveitar o saldo residual de horas na mesma semana para iniciar a feature seguinte (fluxo contínuo), além de acompanhar visualmente o ritmo de entregas acumulado frente aos marcos oficiais do calendário (`Desenvolvimento`, `Posição Atual S06`, `Homologação S21`, `Freezing 17/12` e `Produção S23`). Ao alternar a modalidade no seletor segmentado abaixo dos parâmetros, o gráfico de curva de projeção e os cinco cartões de resumo de marcos na parte inferior da coluna esquerda refletem imediatamente o novo ritmo de conclusão de entregas.

**Why this priority**: Resolve a distorção de capacidade ociosa gerada pelo arredondamento em semanas inteiras e oferece a leitura gráfica de tendência inspirada diretamente no modelo visual de simuladores do Portal do Gestor.

**Independent Test**: Pode ser testada alternando entre as modalidades *Fluxo Contínuo*, *Semanas Inteiras* e *Alocação Manual* para um mesmo conjunto de premissas e conferindo a mudança correspondente na curva gráfica de evolução, nos cartões de marcos intermediários e no horizonte final de término.

**Acceptance Scenarios**:

1. **Given** uma Squad cujas features possuem durações fracionadas em semanas (ex.: `1,4` semana e `0,35` semana), **When** o gestor alterna de *Semanas Inteiras* para *Fluxo Contínuo*, **Then** o sistema aproveita a capacidade restante da semana compartilhada para adiantar o início da feature subsequente, reduzindo o prazo total projetado da Squad.
2. **Given** qualquer parâmetro ou modalidade selecionada, **When** o gestor consulta o cartão de curva de projeção e os cartões de marcos logo abaixo dele, **Then** o gráfico exibe a evolução acumulada ao longo do horizonte `S05`–`S26`, destaca visualmente os marcos de *Posição Atual (`S06`)*, *Homologação (`S21`)*, *Freezing (`17/12`)* e *Produção (`S23`)* e oferece uma visão tabular equivalente acessível para conferência dos números.
3. **Given** o usuário percorrendo os pontos da curva de projeção com mouse ou teclado, **When** foca em determinada semana ou Sprint, **Then** um resumo contextual apresenta o acumulado de histórias/horas entregues versus a capacidade acumulada até aquele ponto.

---

### User Story 3 - Gestão Detalhada na Matriz de Roadmap, Estouro Explícito e Alocação Manual (Priority: P3)

Um líder de Squad ou analista de PMO utiliza a matriz detalhada de cronograma na seção inferior para filtrar entregas por Squad, código de Épico, texto livre ou situação de prazo, ajustar a quantidade de histórias (`US`) de features específicas e inspecionar em quais semanas cada entrega ocorrerá. Quando o volume de uma Squad supera as 20 semanas planejáveis do calendário (`S07` a `S26`), o sistema sinaliza explicitamente o status `Fora da janela` e exibe a quantidade exata de semanas excedentes pós-Dezembro (`+N semanas`), sem ocultar o trabalho excedente. Ao selecionar a modalidade de *Alocação Manual*, o usuário pode distribuir histórias diretamente nas células semanais, aplicar auto-distribuição ou limpeza por feature, visualizar a barra de ocupação semanal da Squad e receber alerta imediato caso aloque mais horas do que a capacidade disponível na semana.

**Why this priority**: Garante controle operacional fino no nível de feature/semana, elimina o problema crítico de truncamento silencioso pós-`S26` e resgata de forma íntegra os recursos de planejamento manual previstos para a ferramenta.

**Independent Test**: Pode ser testada filtrando uma Squad na matriz, editando a quantidade de histórias de uma feature para forçar ultrapassagem do fim de Dezembro (verificando a coluna de semanas excedentes e o selo de situação) e, em seguida, ativando a modalidade *Alocação Manual* para preencher células semanais acima do limite da Squad e tentar editar a coluna bloqueada de *Freezing*.

**Acceptance Scenarios**:

1. **Given** uma Squad cuja demanda total exige cerca de 46 semanas frente às 20 semanas úteis disponíveis até `S26`, **When** o usuário visualiza suas features na matriz detalhada, **Then** as features que ultrapassam `S24` (antes do *Freezing*) recebem o selo `Pós-Freezing`, as features que ultrapassam `S26` recebem o selo `Fora da janela` e exibem explicitamente o excedente de semanas necessárias além do calendário.
2. **Given** a matriz no modo de *Alocação Manual*, **When** o usuário informa em uma mesma semana uma quantidade de histórias cuja soma em horas supera a capacidade semanal da Squad, **Then** o sistema sinaliza imediatamente a semana e o indicador da Squad com alerta de sobrecarga (combinando ícone, texto e destaque visual com o valor excedente em horas).
3. **Given** qualquer modalidade ativa, **When** o usuário tenta lançar histórias ou agendar entregas na coluna correspondente ao período de *Freezing* (`17/12/2026`), **Then** a célula permanece bloqueada para alocação e exibe explicação clara do congelamento de mudanças.
4. **Given** os filtros da barra superior da matriz preenchidos (por Squad, Épico ou situação de prazo), **When** o usuário aplica ou combina filtros, **Then** a listagem exibe apenas as features correspondentes com seus respectivos cabeçalhos fixos visíveis durante a rolagem horizontal e vertical, permitindo remover filtros individuais por chips ou limpar todos de uma vez.

---

### User Story 4 - Shell do Portal do Gestor, Copiloto Contextual, Temas e Exportação de Cenários (Priority: P4)

Um gestor utiliza o simulador integrado à experiência padronizada do Portal do Gestor: menu lateral navegável, barra superior com busca rápida (`Ctrl+K`), identificação clara de ambiente de simulação, alternância entre temas Claro, Escuro e Sistema, histórico local com opção de desfazer alterações e restauração segura aos valores originais em dois cliques. O usuário também pode abrir o painel lateral do Copiloto para consultar diagnósticos prontos sobre o cenário atual (ou aplicar uma proposta guiada de balanceamento com um clique) e exportar seu estudo como arquivo de cenário reimportável, planilha de dados ou relatório formatado para impressão/PDF.

**Why this priority**: Consolida a identidade institucional do Portal do Gestor, assegura governança sobre os cenários simulados (salvar, desfazer, importar e apresentar em reuniões executivas) e entrega suporte assistido na tomada de decisão.

**Independent Test**: Pode ser testada alternando o tema entre Claro e Escuro, abrindo o painel do Copiloto para aplicar e desfazer uma proposta de ajuste de capacidade, exportando e reimportando um cenário modificado e acionando a exportação para impressão/PDF.

**Acceptance Scenarios**:

1. **Given** alterações realizadas nos parâmetros ou histórias do simulador, **When** o usuário recarrega a página no navegador ou aciona o botão *Desfazer*, **Then** o estado mais recente é preservado automaticamente entre recarregamentos e cada ação desfeita reverte com precisão a alteração anterior.
2. **Given** o usuário desejando voltar à configuração original de fábrica, **When** clica uma vez em *Restaurar valores iniciais*, **Then** o botão solicita confirmação explícita em um segundo clique na própria interface antes de limpar as personalizações, evitando perda acidental sem janelas nativas intrusivas.
3. **Given** o painel do Copiloto aberto ao lado da área de trabalho, **When** o usuário seleciona uma pergunta ou sugestão contextual (ex.: equilibrar equipes para entregar tudo até o *Freezing*), **Then** o Copiloto apresenta os números fundamentados no cenário ativo e oferece um cartão de proposta que só altera o simulador mediante confirmação explícita do usuário (com opção de desfazer o lote aplicado).
4. **Given** o usuário com o tema Escuro ativado na interface, **When** aciona *Exportar estudo em PDF* (impressão), **Then** o documento gerado adota automaticamente fundo claro, alta legibilidade tabular/gráfica e selo visível informando tratar-se de estimativa de simulação.

---

### Edge Cases

- **Squad com zero profissionais (`0` pessoas):** O sistema evita qualquer erro de cálculo por divisão por zero, define capacidade semanal igual a `0h`, exibe situação `Sem capacidade` nas features da Squad (quando houver histórias > 0) e informa no diagnóstico quantos profissionais são necessários para viabilizar as entregas.
- **Feature com zero histórias (`0 US`):** A feature permanece visível no catálogo com `0h` de esforço e `0,00` semanas, sem consumir slots semanais no cronograma e marcada como sem escopo pendente.
- **Demanda muito superior ao calendário anual:** Mesmo em cenários extremos (ex.: `120h` por história e `1` pessoa por Squad), o sistema calcula integralmente o total de semanas excedentes pós-`S26` sem travamento visual e sem omitir features.
- **Transição entre alocação automática e manual:** Ao mudar de um modo automático para *Alocação Manual*, o sistema oferece inicializar a grade manual a partir da distribuição atual para que o gestor faça apenas ajustes pontuais, preservando as alocações manuais caso alterne temporariamente de visão para comparação.
- **Importação de arquivo de cenário inválido ou incompleto:** Caso o usuário tente carregar um arquivo corrompido ou incompatível, o sistema recusa a carga, exibe aviso compreensível informando o motivo da recusa e mantém intacto o cenário que estava aberto.
- **Mudança de contexto com proposta aberta no Copiloto:** Se o usuário alterar manualmente os parâmetros do simulador enquanto houver uma proposta de balanceamento pendente no painel do Copiloto, a proposta é sinalizada como desatualizada e recalculada antes da confirmação.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE apresentar o catálogo completo de planejamento contendo os 4 Módulos/Squads (`Squad A`, `Squad B`, `Squad C` e `Squad D`), seus respectivos Épicos (`EPC-001` a `EPC-011`), as 29 features iniciais (totalizando `163` histórias na base padrão) e o calendário de Agosto a Dezembro de 2026 (`S05` a `S26`, `SPRINT-04` a `SPRINT-12` e janela de `FREEZING` em `17/12/2026`).
- **FR-002**: O sistema DEVE organizar a área principal do simulador em duas colunas superiores alinhadas pelo topo (coluna esquerda para premissas, parâmetros deslizantes e curva gráfica de projeção; coluna direita para cartões de indicadores executivos e diagnóstico por Squad), seguidas por uma seção inferior de largura total contendo a matriz detalhada do roadmap (com opção de expansão em foco).
- **FR-003**: O sistema DEVE permitir configurar as premissas globais do ciclo: média de horas por história (padrão inicial `56h`, mínimo `1h`), carga horária semanal por profissional (com atalhos para `30h` conforme visão C0, `40h` conforme visão C1 ou valor personalizado) e semana inicial de planejamento (padrão `S07`, após o marco de posição atual `S06`).
- **FR-004**: O sistema DEVE disponibilizar controles deslizantes sincronizados bidirecionalmente com campos numéricos para os parâmetros de simulação (média de horas por história e quantidade de profissionais de cada Squad), validando limites mínimos e máximos com mensagens claras em linguagem de negócio.
- **FR-005**: O sistema DEVE suportar três modalidades selecionáveis de agendamento:
  1. *Fluxo Contínuo*: aloca horas sequencialmente aproveitando capacidade residual de uma mesma semana entre features consecutivas da Squad;
  2. *Semanas Inteiras*: aloca blocos inteiros e exclusivos de semanas por feature (`arredondamento para cima de esforço ÷ capacidade`);
  3. *Alocação Manual*: permite ao usuário informar diretamente a distribuição por célula `Feature × Semana`.
- **FR-006**: O sistema DEVE bloquear qualquer consumo de capacidade ou edição manual na coluna de *Freezing* (`17/12/2026`) e nas semanas históricas anteriores ao início do planejamento (`S05`–`S06`, salvo consulta visual), deslocando entregas pendentes para as semanas válidas subsequentes.
- **FR-007**: O sistema DEVE exibir em tempo real cartões executivos de indicadores contendo, no mínimo: (a) previsão de conclusão global e Squad gargalo; (b) quantidade e percentual de features e histórias concluídas até o *Freezing* (`17/12/2026`); e (c) balanço total de horas demandadas versus horas ofertadas no horizonte.
- **FR-008**: O sistema DEVE apresentar um quadro de diagnóstico por Squad detalhando capacidade semanal, esforço total demandado, semanas necessárias versus semanas úteis disponíveis, situação padronizada de prazo e recomendação automática do número de profissionais necessários para concluir 100% do backlog da Squad antes do *Freezing*.
- **FR-009**: O sistema DEVE exibir um gráfico de curva de projeção ao longo das semanas `S05`–`S26` acompanhado de cartões de resumo nos marcos principais do projeto (`Posição Atual S06`, `Meio de Ciclo`, `Homologação S21`, `Freezing 17/12` e `Produção S23`), oferecendo alternância ou associação direta aos dados tabulares equivalentes.
- **FR-010**: O sistema DEVE sinalizar explicitamente na matriz detalhada todas as features que ultrapassem o *Freezing* (`Pós-Freezing`) ou o fim do calendário `S26` (`Fora da janela`), exibindo a contagem exata de semanas excedentes pós-horizonte sem ocultar nenhuma feature do backlog.
- **FR-011**: O sistema DEVE permitir editar a quantidade de histórias (`Qtd. US`) de cada feature diretamente na matriz e, quando na modalidade de *Alocação Manual*, sinalizar visualmente e textualmente qualquer semana cuja soma de horas alocadas exceda a capacidade semanal da Squad (*sobrecarga*), além de oferecer ações rápidas para auto-distribuir ou limpar uma feature específica.
- **FR-012**: O sistema DEVE oferecer barra de busca e filtros combináveis (por Squad, Épico, situação de prazo e termo textual no nome da feature, acionável também por atalho `Ctrl+K`), exibindo chips removíveis para cada filtro ativo e opção de limpar filtros.
- **FR-013**: O sistema DEVE incorporar a moldura padrão de navegação do Portal do Gestor (barra lateral retrátil, barra superior de ações, trilha de navegação *breadcrumbs*, cabeçalho padronizado com botão de favorito, aviso transparente de dados simulados e rodapé institucional).
- **FR-014**: O sistema DEVE disponibilizar alternância entre os temas **Claro**, **Escuro** e **Sistema**, aplicando cores semânticas e paleta categórica distinta e validada para cada Squad, garantindo que nenhum estado dependa exclusivamente de cor (sempre acompanhado de rótulo textual ou ícone).
- **FR-015**: O sistema DEVE persistir automaticamente no navegador do usuário todas as alterações do cenário ativo e a preferência de tema, migrando sem perda eventuais dados já salvos pelo protótipo anterior.
- **FR-016**: O sistema DEVE manter histórico de alterações recentes na sessão permitindo **Desfazer** ações passo a passo e **Restaurar valores iniciais** mediante confirmação segura em dois cliques no próprio botão.
- **FR-017**: O sistema DEVE permitir exportar o cenário atual para arquivo portátil (reimportável posteriormente no simulador), exportar a grade calculada em formato de planilha e gerar versão limpa para impressão/**Exportar estudo em PDF** sempre em tema claro.
- **FR-018**: O sistema DEVE disponibilizar o painel lateral do **Copiloto** contextualizado com os dados do simulador, capaz de responder consultas rápidas sobre gargalos/prazos do cenário ativo e propor ajustes de balanceamento que só são aplicados após confirmação explícita do usuário.

### Key Entities

- **Ciclo de Planejamento (Horizonte)**: Representa a linha do tempo de 22 semanas (`S05` a `S26`) mais a janela de `FREEZING`, agrupadas por meses (Agosto a Dezembro), Sprints (`SPRINT-04` a `SPRINT-12`) e marcos operacionais (`Desenvolvimento`, `Estamos Aqui`, `Homologação`, `Freezing` e `Produção`), junto às premissas globais de jornada e tamanho médio de história.
- **Squad (Módulo)**: Equipe responsável por um domínio funcional (`Squads A, B, C e D`), caracterizada por nome, identificador visual categórico próprio, número de profissionais alocados, capacidade semanal em horas, demanda acumulada e indicadores de saldo/recomendação de equipe.
- **Feature (Item de Backlog)**: Entrega de negócio associada a uma `Squad` e a um `Épico` (`EPC-001` a `EPC-011`), contendo código identificador, título, quantidade de histórias estimadas, esforço total em horas, duração requerida em semanas, situação de enquadramento no prazo e eventual excedente pós-horizonte.
- **Alocação Semanal**: Registro de planejamento que vincula uma `Feature` a uma `Semana` específica com o volume de histórias/horas previstas, originado pelo cálculo automático da modalidade ativa ou pela entrada manual do gestor.
- **Cenário de Simulação**: Conjunto completo e autocontido de premissas globais, dimensionamento de Squads, estimativas de histórias, modalidade selecionada, alocações manuais e pilha de histórico de edições, passível de persistência local, exportação e reimportação.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Gestores identificam corretamente qual Squad é o gargalo do roadmap, quantas entregas ficam de fora até o *Freezing* (`17/12/2026`) e quantos profissionais adicionais são necessários em menos de **15 segundos** de leitura da tela inicial.
- **SC-002**: **100%** das interações em controles deslizantes, campos numéricos e seletores de modalidade atualizam os indicadores executivos, o gráfico de curva e a matriz de cronograma em menos de **100 milissegundos**, sem travamentos perceptíveis.
- **SC-003**: **100%** das 29 features e 163 histórias têm seus cálculos de horas e semanas reconciliados com exatidão matemática frente às fórmulas de referência (`30h` e `40h` semanais por pessoa), com **zero** casos de omissão silenciosa de entregas que ultrapassem a semana `S26`.
- **SC-004**: Um usuário conclui o fluxo completo de simular um novo dimensionamento de equipes para atingir 100% de entrega antes do *Freezing* e exportar o estudo resultante em menos de **2 minutos** na primeira tentativa.
- **SC-005**: A interface cumpre **100%** das metas de legibilidade e acessibilidade visual nos temas Claro e Escuro: contraste mínimo de **4,5:1** para textos informativos, **3:1** para controles e marcas gráficas, tamanho mínimo de fonte informativa de **12px**, alinhamento numérico tabular e navegação integral por teclado com foco visível.
- **SC-006**: O layout adapta-se sem perda funcional nem rolagem horizontal indevida da página inteira (restringindo rolagem horizontal apenas ao contêiner interno da matriz) desde telas móveis de **360px** até monitores amplos acima de **1650px**, bem como sob zoom de **200%**.
- **SC-007**: **100%** dos relatórios gerados pela ação *Exportar estudo em PDF* são renderizados em superfície clara de alto contraste, exibindo premissas, KPIs, diagnóstico por Squad e identificação explícita de cenário simulado.

## Assumptions

- **Operação local autônoma (sem dependência de servidor externo):** Como se trata da evolução de um simulador interativo de estudo e planejamento, assume-se que toda simulação, persistência de cenários, análise do Copiloto contextual e exportação ocorrem integralmente no ambiente local do navegador do usuário, sem exigir autenticação corporativa ou banco de dados remoto nesta entrega.
- **Premissas iniciais padrão:** O cenário inicial carrega `56h` por história, jornada semanal de `40h` por profissional (com opção imediata de alternar para `30h` ou outro valor), início de alocação na semana `S07` e modalidade padrão *Fluxo Contínuo*, preservando a um clique a modalidade *Semanas Inteiras* para comparação direta com o protótipo anterior.
- **Escopo fixo do calendário base 2026 com extensão lógica de estouro:** Assume-se que as colunas visuais da grade cobrem o horizonte oficial de Agosto a Dezembro de 2026 (`S05` a `S26` + `FREEZING`), enquanto qualquer trabalho que ultrapasse `S26` é consolidado e exibido em coluna e indicadores dedicados de excedente pós-horizonte (`+N semanas`).
- **Moldura completa do Portal do Gestor com modo foco para a matriz:** Assume-se a inclusão da estrutura completa do Portal do Gestor (menu lateral, barra superior e painel retrátil do Copiloto) para fidelidade total ao Design System e à imagem de referência, oferecendo também um controle de recolhimento/expansão para maximizar a largura útil durante a análise da matriz de 23 colunas.
