# ZK Detective Feature Specs

## Phase 1-2: Core Game (Complete)

| ID | Feature | Status |
|----|---------|--------|
| F01 | Case Data System | Done |
| F02 | Room Navigation | Done |
| F03 | Inventory System | Done |
| F04 | Dialogue Engine | Done |
| F05 | Accusation System | Done |
| F06 | ZK Accusation Circuit | Done |
| F07 | ZK Clue Circuit | Done |
| F08 | Detective Contract | Done |
| F09 | ZK+Contract Integration | Done |
| F10 | Game Hub Integration | Done |
| F11 | Scoring System | Done |
| F12 | Single Player Flow | Done |
| F13 | Frontend UI | Done |
| F14 | PvP WebSocket | Done |
| F15 | Minimap | Done |
| F16 | Detective Characters | Done |

## Phase 3: Visual Overhaul

| ID | Feature | Status | Priority | Dependencies |
|----|---------|--------|----------|-------------|
| [F17](F17-audio-assets.md) | Audio Assets & Wiring | Done | P0 | F13 |
| [F18](F18-room-transitions.md) | Room Transitions & Effects | Done | P0 | F13, F17 |
| [F19](F19-dialogue-polish.md) | Dialogue Blip & Typewriter Polish | Done | P1 | F17 |
| [F20](F20-modal-restyling.md) | Adventure Modal Restyling | Done | P1 | F13 |
| [F21](F21-screen-polish.md) | Screen Polish | Done | P1 | F13, F17 |
| [F22](F22-custom-cursors.md) | Custom Cursors & Hotspots | Done | P2 | F13 |
| [F23](F23-config-fixes.md) | Config Fixes & Build Hardening | Done | P0 | — |
| [F24](F24-game-animations.md) | Clue & Accusation Animations | Done | P2 | F18 |

## Dependency Graph / Build Order

```
F23 (Config Fixes)         — no deps, unblocks reliable builds
  ↓
F17 (Audio Assets)         — depends on F13 (done)
  ↓
F18 (Room Transitions)     — depends on F17
  ↓
F20 (Modal Restyling)      — depends on F13 (done), parallel with F17-F18
F22 (Custom Cursors)       — depends on F13 (done), parallel with F17-F18
  ↓
F19 (Dialogue Polish)      — depends on F17
F21 (Screen Polish)        — depends on F17
  ↓
F24 (Animations)           — depends on F18
```

Recommended execution order: F23 → F17 → F18 → F20 → F22 → F19 → F21 → F24
