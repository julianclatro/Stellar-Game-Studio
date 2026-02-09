# F03: Inventory System

**Status:** Done
**Phase:** 1 (MVP)
**Priority:** P0 (must)
**Dependencies:** F01, F02

## Description

The clue collection and inventory management system. When a player inspects a clue object in a room, the clue is added to their inventory. The inventory is displayed as a persistent sidebar/panel showing all collected clues with icons and descriptions. Clues in the inventory can be "shown" to suspects during interrogation to unlock new dialogue.

## Acceptance Criteria

- [x] Clue inspection adds to inventory (idempotent -- no duplicates)
- [x] Clue added to inventory with full Clue object (name, icon, description)
- [x] Inventory preserves collection order
- [x] Inventory persists across room transitions (engine is room-independent)
- [x] Clue count tracked for scoring purposes
- [x] Key evidence filtering (is_key_evidence flag)
- [x] Suspect-related clue queries (for dialogue integration)
- [x] Clue combo checking for confrontation dialogues ("clue1+clue2")
- [x] Room clue partitioning (inspected vs uninspected -- for visual feedback)
- [x] Reset for new game
- [x] Unit tests covering all inventory scenarios (35 tests)
- [ ] React inventory UI component (deferred to F13 -- Frontend UI)
- [ ] Inspection animation (deferred to F13 -- Frontend UI)
- [ ] ZK clue verification (deferred to F07 -- ZK Clue Circuit)

## Technical Design

Inventory is a simple array of `Clue` objects managed by `InventoryEngine`. When a clue is inspected:
1. Check if clue ID is already in `collectedIds` set
2. If new: add to `collectedClues` array and `inspectionOrder`
3. Return `InspectionResult` with `isNew` flag and total count

The engine provides APIs that downstream features consume:
- **F04 (Dialogue):** `hasClue()`, `hasClueCombo()`, `getSatisfiedCombos()`, `getCluesForSuspect()`
- **F05 (Accusation):** `getClueCount()` (for scoring)
- **F11 (Scoring):** `getClueCount()`, `getKeyEvidence()`
- **F13 (UI):** `partitionRoomClues()`, `getCollectedClues()`

## Files Created

- `src/engines/inventory-engine.ts` -- InventoryEngine class
- `src/engines/__tests__/inventory-engine.test.ts` -- 35 tests
- `src/engines/index.ts` -- Updated barrel export

## API

```typescript
class InventoryEngine {
  inspectClue(clue: Clue): InspectionResult
  hasClue(clueId: string): boolean
  getCollectedClues(): ReadonlyArray<Clue>
  getCollectedClueIds(): ReadonlyArray<string>
  getClueCount(): number
  getClue(clueId: string): Clue | undefined
  getKeyEvidence(): Clue[]
  getCluesForSuspect(suspectId: string): Clue[]
  hasClueCombo(comboKey: string): boolean
  getSatisfiedCombos(comboKeys: string[]): string[]
  partitionRoomClues(roomClues: Clue[]): { inspected: Clue[]; uninspected: Clue[] }
  reset(): void
}

interface InspectionResult {
  clue: Clue;
  isNew: boolean;
  totalCollected: number;
}
```

## Resolved Questions

- **Sidebar vs. collapsible:** Deferred to F13 (Frontend UI). Engine provides the data.
- **Categorized vs. flat list:** Engine provides both `getCollectedClues()` (flat) and `getKeyEvidence()` (filtered). UI can categorize.
- **ZK proof on inspect:** Deferred to F07 (ZK Clue Circuit). The inventory engine is pure state management.
