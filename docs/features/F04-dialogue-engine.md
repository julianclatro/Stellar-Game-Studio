# F04: Dialogue Engine

**Status:** Done
**Phase:** 1 (MVP)
**Priority:** P0 (must)
**Dependencies:** F01, F03

## Description

The suspect interrogation and dialogue system. Each suspect has a 3-state dialogue tree that evolves based on which clues the player has collected. This is the core investigative mechanic -- players piece together who is lying by comparing suspect statements against physical evidence.

## Acceptance Criteria

- [x] Default dialogue shown when no relevant clues in inventory
- [x] Clue-triggered dialogue activates when player has a related clue
- [x] Confrontation dialogue triggers when clue combo is satisfied
- [x] Dialogue prioritized: confrontation > clue_triggered > default
- [x] Multiple clue-triggered options selectable by player
- [x] Dialogue state tracked per suspect (which states have been seen)
- [x] "New dialogue" indicator when unseen options are available
- [x] All 9 Meridian Manor suspects verified (dialogue trees correct)
- [x] 4 suspects have confrontation dialogue (Victor, Marcus, Thomas, James)
- [x] Investigation flow simulation test (progressive discovery)
- [x] Unit tests covering all dialogue scenarios (37 tests)
- [ ] React dialogue panel component (deferred to F13 -- Frontend UI)
- [ ] Suspect click animation (deferred to F13 -- Frontend UI)
- [ ] "Show Evidence" button UI (deferred to F13 -- Frontend UI)

## Technical Design

The dialogue engine checks the player's inventory against each suspect's `dialogue` tree:

1. **Default state:** `suspect.dialogue.default` -- always available
2. **Clue-triggered:** For each `clue_id` in `suspect.dialogue.clue_triggered`, check if that clue is in the player's inventory. If so, add as a selectable dialogue option.
3. **Confrontation:** For each `clue_combo` key in `suspect.dialogue.confrontation` (format: `"clue1+clue2"`), check if ALL clues in the combo are in inventory.

Priority for auto-display: confrontation > clue_triggered > default.
All options remain available for player selection regardless of priority.

## Files Created

- `src/engines/dialogue-engine.ts` -- DialogueEngine class
- `src/engines/__tests__/dialogue-engine.test.ts` -- 37 tests
- `src/engines/index.ts` -- Updated barrel export

## API

```typescript
class DialogueEngine {
  constructor(inventory: InventoryEngine)
  resolve(suspect: Suspect): DialogueResolution
  getAvailableOptions(suspect: Suspect): DialogueOption[]
  markSeen(suspectId: string, option: DialogueOption): void
  getHistory(suspectId: string): DialogueHistory
  hasUnseenDialogue(suspect: Suspect): boolean
  getSeenCount(suspectId: string): number
  getSuspectsWithConfrontations(suspects: Suspect[]): Suspect[]
  reset(): void
}

interface DialogueOption {
  state: 'default' | 'clue_triggered' | 'confrontation';
  triggerKey: string | null;
  text: string;
  label: string;  // e.g., "Show: Insurance Documents" or "Confront: X + Y"
}

interface DialogueResolution {
  suspect: Suspect;
  currentDialogue: DialogueOption;  // highest priority
  availableOptions: DialogueOption[];
  hasNewDialogue: boolean;
}
```

## Resolved Questions

- **Show all at once vs. choose:** Player chooses which clue to present. All options are listed.
- **Multiple clue-triggered:** Shown as selectable options with "Show: [Clue Name]" labels.
- **Dialogue history:** Tracked per suspect with `markSeen()`. Notebook UI deferred to F13.
