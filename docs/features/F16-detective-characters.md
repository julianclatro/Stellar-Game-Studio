# F16: Detective Characters

**Status:** Done
**Phase:** 2 (PvP)
**Priority:** P2 (nice)
**Dependencies:** F13

## Description

Character selection screen where the player chooses between two detective characters: Kit Solano and Noor Vasari. The choice is purely cosmetic — same abilities, same access, same clues. Each detective has a distinct visual style and personality reflected in their minimap icon, color scheme, and flavor text throughout the game.

## Acceptance Criteria

- [x] Character selection screen in lobby before starting a game
- [x] Two detective options with artwork and description
- [x] Kit Solano: trench coat, messy hair, coffee cup, tagline displayed
- [x] Noor Vasari: sharp suit, glasses, notebook, tagline displayed
- [x] Selected detective's sprite shown in-game (if applicable)
- [x] Selected detective's icon shown on minimap
- [x] PvP: each player sees the other's detective choice
- [x] No mechanical difference between detectives

## Implementation Notes

### Architecture Decisions
- **Separate phase** — `character-select` phase inserted between `title` and `briefing`/`matchmaking`
- **Emoji placeholders** — coffee cup for Kit, magnifying glass for Noor (until Julian creates art assets)
- **Color identity** — Kit = gold (#d4a843), Noor = teal (#2a9d8f), used on minimap markers and UI accents
- **PvP protocol** — `detective` field added to `join` message, `opponentDetective` relayed in `matched`
- **No image files needed** — all visuals use emoji + color, no external art assets required for MVP

### Game Flow
- Solo: Title → Character Select → Briefing → Playing → Result
- PvP: Title → (enter name) → Character Select → Matchmaking → Briefing → Playing → Result

### Files Created
- `src/data/detectives.ts` — Detective type, Kit Solano + Noor Vasari definitions, color/emoji constants
- `src/components/CharacterSelect.tsx` — Full-screen selection with detective cards, back button

### Files Modified
- `src/store/game-store.ts` — `selectedDetective`, `opponentDetective` state, `selectDetective()` action, `character-select` phase
- `src/App.tsx` — Added `CharacterSelect` route for `character-select` phase
- `src/components/BriefingScreen.tsx` — Shows selected detective pill (emoji + name)
- `src/components/TopBar.tsx` — Shows detective emoji next to case title
- `src/components/MiniMap.tsx` — Markers use detective-specific colors, legend shows detective names
- `zk-detective-server/src/types.ts` — `detective` on PlayerState, join message, matched message
- `zk-detective-server/src/session.ts` — Passes detective through session creation
- `zk-detective-server/src/matchmaking.ts` — Passes detective through queue and matched notifications
- `zk-detective-server/src/index.ts` — Passes detective from join message to matchmaking
- `src/services/multiplayer-types.ts` — `detective` on join, `opponentDetective` on matched
- `src/services/multiplayer-service.ts` — `connect()` accepts detective parameter

## Open Questions (Resolved)

- **Character selection screen?** → Separate `character-select` phase, full-screen card selection
- **Character-specific flavor text?** → Deferred to future; currently cosmetic only
- **Future characters?** → Data model supports adding more entries to `DETECTIVES` record
