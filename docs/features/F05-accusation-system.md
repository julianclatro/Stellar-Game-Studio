# F05: Accusation System

**Status:** Done
**Phase:** 1 (MVP)
**Priority:** P0 (must)
**Dependencies:** F01, F03

## Description

The accusation flow where the player makes their final deduction: WHO committed the crime, with WHAT weapon, in WHICH room. This is the climactic moment of the game. The accusation is verified against the on-chain commitment using a ZK proof -- no one needs to reveal the answer to check if the player is correct.

## Acceptance Criteria

- [x] Accusation flow state machine: idle -> selecting -> confirming -> submitting -> resolved
- [x] WHO selection: all 9 suspects with names
- [x] WHAT selection: all 5 weapons
- [x] WHERE selection: all 5 rooms with names
- [x] Invalid selections rejected (unknown IDs)
- [x] Confirmation step before submission
- [x] Cancel and retry flow
- [x] Unconfirm to go back and change selections
- [x] Wrong accusation count tracked for scoring
- [x] Multiple accusations allowed (increasing penalty tracked)
- [x] Duplicate detection (wasAlreadyTried)
- [x] Correct accusation sets solved state, prevents further accusations
- [x] Full attempt history recorded
- [x] Reset for new game
- [x] Unit tests covering all accusation scenarios (40 tests)
- [ ] React accusation modal component (deferred to F13 -- Frontend UI)
- [ ] ZK proof generation integration (deferred to F12 -- Single Player Flow)
- [ ] On-chain verification (deferred to F08 -- Detective Contract)

## Technical Design

The accusation flow is a state machine:

```
idle -> selecting -> confirming -> submitting -> resolved (correct)
                                               -> idle (incorrect, try again)
```

1. Player calls `beginAccusation()` to enter selecting mode
2. Player calls `selectSuspect()`, `selectWeapon()`, `selectRoom()`
3. Player calls `confirm()` -- validates completeness, returns accusation
4. Player can `unconfirm()` to go back, or `submit()` to proceed
5. After ZK proof verification, caller calls `resolveResult('correct' | 'incorrect')`
6. Correct: status becomes `resolved`, `isSolved()` returns true
7. Incorrect: status returns to `idle`, wrong count incremented

## Files Created

- `src/engines/accusation-engine.ts` -- AccusationEngine class
- `src/engines/__tests__/accusation-engine.test.ts` -- 40 tests
- `src/engines/index.ts` -- Updated barrel export

## API

```typescript
class AccusationEngine {
  constructor(caseData: ClientCaseData)
  getStatus(): AccusationStatus
  isSolved(): boolean
  beginAccusation(): void
  cancelAccusation(): void
  selectSuspect(suspectId: string): void
  selectWeapon(weaponId: string): void
  selectRoom(roomId: string): void
  getCurrentAccusation(): Partial<Accusation>
  isComplete(): boolean
  confirm(): Accusation
  unconfirm(): void
  submit(): Accusation
  resolveResult(result: AccusationResult): AccusationAttempt
  getWrongAccusationCount(): number
  getTotalAttempts(): number
  getAttempts(): ReadonlyArray<AccusationAttempt>
  getLastAttempt(): AccusationAttempt | undefined
  wasAlreadyTried(accusation: Accusation): boolean
  getSuspectChoices(): Array<{ id: string; name: string }>
  getWeaponChoices(): string[]
  getRoomChoices(): Array<{ id: string; name: string }>
  reset(): void
}
```

## Resolved Questions

- **Confirmation step:** Yes -- `confirm()` step before `submit()`. Player can `unconfirm()` to go back.
- **Wrong accusation info:** No hints -- just "incorrect". Revealing partial info undermines the ZK design.
- **Max accusations:** No hard limit. Wrong count tracked; scoring penalty applied by F11.
