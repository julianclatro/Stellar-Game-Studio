# F11: Scoring System

**Status:** Done
**Phase:** 1 (MVP)
**Priority:** P1 (should)
**Dependencies:** F01

## Description

Client-side scoring service that mirrors the on-chain formula from F08 (Detective Contract). Provides local score preview and post-game summary display without requiring a blockchain call. The formula rewards exploration (more clues/rooms = higher score) while penalizing time and wrong accusations.

## Acceptance Criteria

- [x] Scoring formula implemented (mirrors on-chain `compute_score()` from F08)
- [x] Score calculated from: time, clues inspected, wrong accusations, rooms visited
- [x] Score breakdown available for post-game display via `generateSummary()`
- [x] Score breakdown includes all components (base, time penalty, accusation penalty, exploration bonus)
- [x] Multiple strategies viable (speedrunner, thorough, minimalist) — tested with archetypes
- [x] On-chain parity verified (5 test cases matching F08 contract formula)
- [x] Score cannot be negative (floor at 0)
- [ ] ScoreBreakdown React component (deferred to F13 — Frontend UI)

## Technical Design

### Formula (matches on-chain F08)

```
BASE_SCORE = 10000
TIME_PENALTY = min(elapsed_ledgers * 1, 5000)       // 1 per ledger, capped at 5000
ACCUSATION_PENALTY = wrong_accusations * 500
EXPLORATION_BONUS = clues_inspected * 100 + rooms_visited * 50

FINAL_SCORE = max(0, BASE_SCORE - TIME_PENALTY - ACCUSATION_PENALTY + EXPLORATION_BONUS)
```

**Note:** Original spec proposed efficiency-based scoring (fewer clues = higher score). Aligned with F08's exploration-based formula for on-chain parity and trustlessness.

### Strategy Archetypes (tested)

- **Speedrunner:** 20 ledgers, 2 clues, 2 rooms, 1 wrong → 9780
- **Thorough detective:** 600 ledgers, 11 clues, 5 rooms, 0 wrong → 10750
- **Minimalist:** 150 ledgers, 3 clues, 2 rooms, 0 wrong → 10250

All strategies produce scores > 5000 (above half base).

### Score Display

Show the player via `GameSummary`:
- Final score (number)
- Time taken (ledgers → seconds via `ledgersToSeconds()`)
- Clues found (X of Y)
- Rooms visited (X of Y)
- Wrong accusations
- Full score breakdown (base, penalties, bonuses)

### Utility Functions

- `ledgersToSeconds(ledgers)` — Converts ledger count to seconds (5s per ledger)
- `formatTime(seconds)` — Formats to "Xm Ys" or "Xs"

## Files Created

- `src/services/scoring-service.ts` — Score calculation, summary generation, utilities
- `src/services/__tests__/scoring-service.test.ts` — 36 tests
- `src/services/index.ts` — Barrel export

## Resolved Questions

- **On-chain vs off-chain:** Both. On-chain is authoritative (F08), client-side mirrors for preview.
- **PvP scoring:** Same formula. Deferred to F14.
- **Score manipulation:** On-chain formula is source of truth. Client service is display-only.
