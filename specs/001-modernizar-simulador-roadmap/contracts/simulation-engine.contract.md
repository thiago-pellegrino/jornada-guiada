# Contract: Simulation Engine & Copilot Proposals (`simulationEngine`)

**Module**: `src/domain/simulationEngine.js`  
**Type**: Pure Domain Module (zero browser/DOM dependencies; Node `node:test` compatible)

---

## 1. Public Function Signatures

```js
/**
 * Executa o cálculo completo do roadmap e diagnóstico executivo.
 * Deve ser 100% pura, determinística e completar em < 5ms para 29+ features.
 *
 * @param {ScenarioState} state
 * @param {WeekSlot[]} weeks - Catálogo temporal (WEEKS)
 * @returns {SimulationResult}
 */
export function runSimulation(state, weeks) {}

/**
 * Converte a alocação calculada de um modo automático em um mapa ManualAllocationMap
 * (em unidades de US por semana, arredondadas em 2 casas decimais) para inicializar
 * ou auto-distribuir entregas no modo manual.
 *
 * @param {SimulationResult} simulationResult
 * @param {number} avgHoursPerStory
 * @returns {ManualAllocationMap}
 */
export function deriveManualAllocationsFromResult(simulationResult, avgHoursPerStory) {}

/**
 * Distribui automaticamente uma única feature no modo manual a partir de startWeekId,
 * respeitando o saldo de capacidade disponível da Squad nas semanas não congeladas.
 *
 * @param {ScenarioState} state
 * @param {string} featureId
 * @param {WeekSlot[]} weeks
 * @returns {ManualAllocationMap}
 */
export function autoDistributeSingleFeature(state, featureId, weeks) {}

/**
 * Gera diagnósticos e propostas acionáveis para o painel do Copiloto com base no
 * resultado atual da simulação.
 *
 * @param {ScenarioState} state
 * @param {SimulationResult} result
 * @returns {CopilotInsightBundle}
 */
export function buildCopilotInsights(state, result) {}
```

---

## 2. Regras Determinísticas dos Motores

### 2.1 SemanasElegíveis
- Uma semana `w` é **elegível para alocação automática** se e somente se:
  - `w.index >= startWeekIndex` (onde `startWeekIndex` é o índice de `state.premises.startWeekId`, padrão `2` = `S07`); e
  - `w.frozen !== true` (`w.id !== 'freeze'`).
- Semanas antes do *Freezing*: todas as semanas elegíveis com `w.index < freezeIndex` (no padrão `S07`..`S24` = **18 semanas**).
- Semanas após o *Freezing* dentro de 2026: semanas elegíveis com `w.index > freezeIndex` (`S25`..`S26` = **2 semanas**, totalizando **20 semanas elegíveis**).

### 2.2 Motor `continuous` (*Fluxo Contínuo — C1*)
Para cada `Squad`:
1. Se `weeklyCapacity === 0`: todas as features com `stories > 0` recebem `allocatedByWeek = {}`, `spilloverHours = effortHours`, `status = 'NO_CAPACITY'`.
2. Caso contrário, mantém ponteiro `slotIdx = 0` sobre `eligibleWeeks` e `remainingCap = weeklyCapacity`:
   - Para cada `feature` na ordem da Squad:
     - `remainingEffort = feature.stories * avgHoursPerStory`.
     - Enquanto `remainingEffort > 1e-9` e `slotIdx < eligibleWeeks.length`:
       - `consumed = Math.min(remainingEffort, remainingCap)`
       - Registra `allocatedByWeek[eligibleWeeks[slotIdx].id] = consumed`
       - `remainingEffort -= consumed`; `remainingCap -= consumed`
       - Se `remainingCap <= 1e-9`: `slotIdx += 1`; `remainingCap = weeklyCapacity`.
     - Se após esgotar `eligibleWeeks` ainda restar `remainingEffort > 1e-6`:
       - `spilloverHours = remainingEffort`
       - `spilloverWeeks = spilloverHours / weeklyCapacity`
       - `status = 'OUT_OF_WINDOW'`.

### 2.3 Motor `whole_weeks` (*Semanas Inteiras Exclusivas — C0*)
Para cada `Squad`:
1. Se `weeklyCapacity === 0`: idêntico a 2.2 (`NO_CAPACITY`).
2. Caso contrário, mantém ponteiro inteiro `slotIdx = 0` sobre `eligibleWeeks`:
   - Para cada `feature`:
     - `weeksNeeded = Math.ceil(effortHours / weeklyCapacity)`
     - Aloca até `weeksNeeded` semanas inteiras exclusivas enquanto `slotIdx < eligibleWeeks.length`.
     - Se `allocatedSlots < weeksNeeded`:
       - `missingSlots = weeksNeeded - allocatedSlots`
       - `spilloverWeeks = missingSlots`
       - `spilloverHours = Math.max(0, effortHours - allocatedSlots * weeklyCapacity)`
       - `status = 'OUT_OF_WINDOW'`.

### 2.4 Motor `manual` (*Alocação Manual*)
Para cada `Squad` e `Feature`:
1. Ignora quaisquer entradas em semanas com `frozen === true`.
2. Para cada semana não congelada `w`: `storiesInWeek = manualAllocations[feature.id]?.[w.id] || 0`, `hoursInWeek = storiesInWeek * avgHoursPerStory`.
3. Soma por semana da Squad: `squadWeekHours = sum(hoursInWeek)`. Se `squadWeekHours > weeklyCapacity + 1e-6`, marca `weeklyUsage[w.id].isOvercapacity = true` e `overHours = squadWeekHours - weeklyCapacity`.
4. Se `allocatedHoursTotal < effortHours - 1e-6`: a diferença aparece em `spilloverHours` (`unallocatedHours`) e `status = 'OUT_OF_WINDOW'`.

---

## 3. Contrato de Recomendação de Headcount (`recommendedPeopleForFreeze`)

- Para cada `Squad`:
  - Se `demandHours === 0`: `recommendedPeopleForFreeze = 0`.
  - Se `eligibleWeeksBeforeFreeze.length === 0`: `recommendedPeopleForFreeze = null` (impossível sem semanas antes do Freeze).
  - Nos modos `continuous` e `manual`:
    - `recommendedPeopleForFreeze = Math.ceil(demandHours / (eligibleWeeksBeforeFreeze.length * hoursPerPersonPerWeek))`.
  - No modo `whole_weeks`:
    - Busca o menor inteiro `p >= 1` tal que `sum(features.map(f => Math.ceil(f.effortHours / (p * hoursPerPersonPerWeek)))) <= eligibleWeeksBeforeFreeze.length`.

---

## 4. Contrato de Proposta do Copiloto (`CopilotProposal`)

```js
/**
 * Proposta gerada pelo Copiloto que exige confirmação explícita (Seção 8.4 / 20.5).
 */
{
  id: 'balance-for-freeze' | 'switch-to-continuous' | 'optimize-story-slicing',
  title: string,
  summary: string,
  contextFingerprint: string, // Hash leve do estado em que foi gerada; se mudar -> .cp-stale
  changes: Array<{ label: string, from: string, to: string }>,
  patch: Partial<ScenarioState>
}
```
- **Regra de segurança de contexto (`FR-018` / DS §20.5)**: Se `currentFingerprint !== proposal.contextFingerprint`, a proposta exibe aviso de contexto alterado (`.cp-stale`) e oferece botão *Recalcular proposta* em vez de sobrescrever cegamente edições posteriores do usuário.
