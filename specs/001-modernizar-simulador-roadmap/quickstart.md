# Quickstart & Validation Guide: Modernização do Simulador de Roadmap e Capacity

**Feature**: `001-modernizar-simulador-roadmap`  
**Spec**: [spec.md](./spec.md) | **Data Model**: [data-model.md](./data-model.md)  
**Contracts**: [Simulation Engine](./contracts/simulation-engine.contract.md) · [Storage & Export](./contracts/scenario-storage-export.contract.md) · [UI & Design System](./contracts/ui-design-system.contract.md)

---

## 1. Pré-requisitos

- **Node.js**: `v20+` (ambiente validado em `Node.js v26.12.1` com runner nativo `node --test`).
- **Navegador moderno**: Chrome, Edge ou Firefox atualizado.

---

## 2. Comandos de Execução, Build e Testes

Com os scripts encaminhadores configurados no `package.json` da raiz (ou executando diretamente em `roadmap-react/roadmap-react`):

```powershell
# 1. Instalar dependências (caso node_modules ainda não exista)
npm install --prefix roadmap-react\roadmap-react

# 2. Executar suíte automatizada de testes de domínio e contratos (Node test runner)
npm test --prefix roadmap-react\roadmap-react

# 3. Subir servidor de desenvolvimento (Vite HMR em http://localhost:5173)
npm run dev --prefix roadmap-react\roadmap-react

# 4. Validar build de produção
npm run build --prefix roadmap-react\roadmap-react
```

*(Após a implementação do `package.json` raiz, os mesmos comandos `npm test`, `npm run dev` e `npm run build` também funcionarão diretamente na pasta `simulador-roadmap/`).*

---

## 3. Roteiro de Validação Ponta a Ponta (Cenários de Aceite)

### Cenário 1 — Simulação Executiva e Diagnóstico de Gargalos (`User Story 1 / P1`)
1. Abra `http://localhost:5173` com o estado inicial (`56h/US`, `40h/pessoa`, `Fluxo Contínuo`, Squads `A=4, B=1, C=1, D=2` — total `29` features / `163` US conforme [data-model.md](./data-model.md)).
2. Verifique na coluna direita executiva:
   - **Squad A** aparece com status `No prazo` (`14,70` semanas requeridas frente às `18` semanas úteis antes do *Freezing*).
   - **Squads B, C e D** aparecem como deficitárias (`Fora da janela`), com **Squad B** destacada como maior gargalo (`46,20` semanas contínuas / `50` inteiras) e recomendação explícita de quantos profissionais adicionar para entregar até `17/12/2026`.
3. Arraste o controle deslizante de profissionais da **Squad B** até o número recomendado (ou digite no campo numérico ao lado):
   - **Resultado esperado**: O cartão de KPI e a linha da Squad B atualizam em `< 100ms` e o badge `150×22px` muda para `● No prazo`.
4. Alterne a premissa de jornada semanal de `40h (C1)` para `30h (C0)`:
   - **Resultado esperado**: As capacidades semanais caem proporcionalmente (`Squad A: 160h → 120h`) batendo com a aba `C0-ROADMAP` de `SEMANAS.xlsx`.

### Cenário 2 — Modalidades de Agendamento e Curva de Marcos (`User Story 2 / P2`)
1. No cartão de parâmetros, alterne entre **Fluxo Contínuo**, **Semanas Inteiras** e **Alocação Manual**.
2. Observe na **Squad A** (`4` pessoas, `160h/sem`):
   - Em *Fluxo Contínuo*: requer `14,70` semanas (conclui antes do *Freezing*).
   - Em *Semanas Inteiras*: requer `19` semanas (a última feature avança após o *Freezing*, mudando para `◐ Pós-Freezing`).
3. Inspecione o cartão **Curva de Projeção** e os **5 mini-cards de marcos** abaixo do gráfico (`S06`, `S12`, `S18`, `S21 Homologação`, `S23 Produção`):
   - Navegue pelos pontos do gráfico com `Tab` e setas `←`/`→` e alterne para a visão de tabela equivalente.

### Cenário 3 — Matriz Detalhada, Visibilidade de Estouro e Sobrecarga Manual (`User Story 3 / P3`)
1. Restaure os valores iniciais (dois cliques em **Restaurar valores iniciais**) e role até a **Matriz Detalhada do Roadmap**.
2. Filtre pela **Squad B** (ou pressione `Ctrl+K` e busque `"Catálogo"`):
   - **Resultado esperado**: Nenhuma das 8 features desaparece; as features que excedem `S26` exibem badge `Fora da janela` e a contagem exata na coluna de excedente (`+sem`), conforme [simulation-engine.contract.md](./contracts/simulation-engine.contract.md).
3. Selecione a modalidade **Alocação Manual**:
   - Digite `4` histórias em uma única semana da Squad B (`4 × 56h = 224h > 40h` de capacity): a célula e o medidor semanal da Squad sinalizam **Sobrecarga** com ícone + texto do excedente.
   - Verifique que a coluna `FREEZING (17/12/2026)` permanece bloqueada para edição.

### Cenário 4 — Temas, Copiloto, Persistência e Exportação PDF (`User Story 4 / P4`)
1. Clique no botão de **Tema** na barra superior e alterne entre **Claro**, **Escuro** e **Sistema**: verifique legibilidade, contraste e ausência de *flash* ao recarregar (`F5`).
2. Abra o painel lateral **Copiloto** no topo direito, selecione a sugestão de balanceamento para o *Freezing*, clique em **Confirmar proposta** e depois teste **Desfazer**.
3. Exporte o cenário em `.json` (reimporte-o em seguida e teste importar um arquivo inválido para validar a mensagem de recusa amigável) e exporte a planilha `.csv`.
4. Com o tema **Escuro** ativo, clique em **Exportar estudo em PDF**:
   - **Resultado esperado**: A visualização de impressão abre automaticamente em **tema claro** com cabeçalho institucional, selo `ESTUDO SIMULADO`, KPIs, diagnóstico e cronograma legíveis ([scenario-storage-export.contract.md](./contracts/scenario-storage-export.contract.md)).
