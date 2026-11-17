# Contract: Persistência Local, Importação e Exportação (`scenarioSerializer`)

**Module**: `src/domain/scenarioSerializer.js`  
**Type**: Storage & File Serialization Contract

---

## 1. Chaves de `localStorage`

| Chave | Formato | Propósito |
|---|---|---|
| `roadmap.sim.v2` | JSON (`ScenarioEnvelopeV2`) | Estado principal do cenário ativo no simulador modernizado. |
| `theme` | `'light' \| 'dark' \| 'system'` | Preferência de tema do Portal do Gestor (conforme DS §19.1). |
| `roadmap.favorites.v1` | `string[]` | Rotas/visões favoritadas na estrela do cabeçalho/menu (§7.11). |
| `roadmap.avg` *(legado)* | `string` numérico | Lido apenas na migração inicial caso `roadmap.sim.v2` não exista (nunca sobrescrito destrutivamente). |
| `roadmap.squads` *(legado)* | JSON `Squad[]` | Lido apenas na migração inicial caso `roadmap.sim.v2` não exista. |

---

## 2. Schema JSON de Persistência e Exportação (`ScenarioEnvelopeV2`)

Arquivo exportado como: `simulador-roadmap-cenario-YYYYMMDD-HHMM.json`

```json
{
  "schemaVersion": "2.0",
  "exportedAt": "2026-11-16T19:45:00.000Z",
  "app": "nextprev-roadmap-simulator",
  "premises": {
    "avgHoursPerStory": 56,
    "hoursPerPersonPerWeek": 40,
    "startWeekId": "w03",
    "schedulingMode": "continuous"
  },
  "squads": [
    {
      "key": "A",
      "title": "Módulo A - SQUAD A",
      "people": 4,
      "features": [
        {
          "id": "A-1",
          "epic": "EPC-001",
          "name": "A1 - Cadastro e ativação de conta",
          "stories": 11
        }
      ]
    }
  ],
  "manualAllocations": {}
}
```

### Regras de Validação na Importação (`validateAndParseScenarioJson`)
A função de importação DEVE retornar `{ ok: true, state }` ou `{ ok: false, errorCode, messagePtBr }`:
- `INVALID_JSON`: Arquivo vazio ou sintaxe JSON inválida → *"Arquivo inválido: não foi possível ler o formato do cenário."*
- `UNSUPPORTED_SCHEMA`: `schemaVersion` ausente ou incompatível → *"Versão de cenário não reconhecida. Exporte um arquivo gerado por este simulador."*
- `INVALID_PREMISES`: `avgHoursPerStory < 1 || > 240`, `hoursPerPersonPerWeek < 1 || > 60` ou `schedulingMode` desconhecido → *"Premissas fora dos limites permitidos no arquivo importado."*
- `INVALID_SQUADS`: Lista `squads` ausente, vazia ou com quantidades negativas de `people`/`stories` → *"Estrutura de Squads ou Features inválida no arquivo importado."*
- Entradas em `manualAllocations` apontando para `'freeze'` são sanitizadas/descartadas silenciosamente durante a normalização.

---

## 3. Contrato de Exportação Planilha (`.csv`)

Arquivo exportado como: `simulador-roadmap-matriz-YYYYMMDD-HHMM.csv`
- **Codificação**: `UTF-8` com BOM (`\uFEFF`) para abertura direta acentuada no Microsoft Excel em Windows.
- **Separador de campos**: `;` (ponto e vírgula — padrão `pt-BR`), números decimais formatados com vírgula (`pt-BR`).
- **Colunas obrigatórias**:
  `Squad;Épico;Código/Feature;Qtd. US;Esforço (h);Capacity Squad (h/sem);Semanas Estimadas;Situação;Excedente Pós-S26 (sem);S05;S06;S07;...;S24;FREEZING;S25;S26`

---

## 4. Contrato de Impressão / Exportação em PDF (`Exportar estudo em PDF`)

Acionado pelo botão primário/secundário do cabeçalho (`window.print()` com folha `src/styles/print.css`):
1. **Tema claro obrigatório (§19.1 / §19.3)**: Independentemente de `data-theme="dark"` estar ativo na tela, `@media print` força fundo `#ffffff`, texto `#303943`, bordas `#d0d5dd` e paleta de dados do tema claro.
2. **Elementos ocultos na impressão**: `Sidebar`, `Topbar`, `CopilotDrawer`, barra de filtros interativos, botões de ação/desfazer e toasts.
3. **Elementos obrigatórios no documento impresso (`SC-007`)**:
   - Cabeçalho institucional do estudo com data/hora de geração, premissas ativas (`h/US`, `h/pessoa`, modalidade) e selo explícito **`ESTUDO SIMULADO — DADOS DE PLANEJAMENTO`**.
   - Linha de KPIs executivos + Quadro de Diagnóstico e Recomendação por Squad.
   - Curva gráfica SVG + Cartões de marcos (`S06`, `S21`, `Freezing`, `S23`).
   - Tabela consolidada de Features com status e semanas previstas sem corte lateral (`@page { size: landscape; margin: 10mm; }`).
