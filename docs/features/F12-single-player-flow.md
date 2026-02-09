# F12: Single Player Flow

**Status:** Done
**Phase:** 1 (MVP)
**Priority:** P0 (must)
**Dependencies:** F02, F03, F04, F05, F08

## Description

The complete single-player game experience from start to finish. This is the hackathon priority — a player investigates a pre-written case against the clock, and their score is posted to the on-chain leaderboard. All players solve the same case and compete on efficiency and speed.

## Acceptance Criteria

- [ ] Player enters lobby, selects "Single Player"
- [ ] Case briefing screen: narrative intro, what happened, where, when
- [ ] Timer starts counting up from case briefing
- [ ] Solution commitment verified on-chain before investigation starts
- [ ] Full investigation phase: navigate rooms, inspect clues, interrogate suspects
- [ ] Accusation available at any time during investigation
- [ ] Correct accusation → resolution screen with score
- [ ] Wrong accusation → penalty applied, continue investigating
- [ ] Resolution shows full story narrative conclusion
- [ ] Score breakdown displayed
- [ ] Score posted to on-chain leaderboard
- [ ] Player can return to lobby after resolution
- [ ] Full end-to-end flow playable for judges

## Technical Design

### Game State Machine

```
LOBBY → BRIEFING → INVESTIGATION → ACCUSATION → RESOLUTION
                        ↑               |
                        └───────────────┘  (wrong accusation → back to investigation)
```

### State Management

The single-player flow manages:
- Current game phase (state machine)
- Current room
- Inventory (collected clues)
- Timer (elapsed seconds)
- Dialogue state per suspect
- Accusation history (wrong attempts)
- Score (calculated at resolution)

### Briefing Screen

Narrative introduction to "The Meridian Manor Incident":
- Setting description
- What happened (body found)
- Player's role (detective arriving at the scene)
- Timer begins

### Resolution Screen

After correct accusation:
- Reveal the full story — who did it, how, why
- Show score breakdown
- Show leaderboard position
- Option to play again or return to lobby

## Files to Create/Modify

- `src/state/game-state.ts` — Game state machine
- `src/pages/Lobby.tsx` — Mode selection
- `src/pages/Briefing.tsx` — Case introduction
- `src/pages/Investigation.tsx` — Main game screen (rooms + inventory + dialogue)
- `src/pages/Resolution.tsx` — Score + narrative conclusion
- `src/services/game-service.ts` — Orchestrates game lifecycle

## Open Questions

- How does single-player interact with Game Hub (which expects two players)?
- Should there be a practice mode without on-chain scoring?
- Time limit for single-player, or just counting up?
