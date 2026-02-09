# Feature Index

> ZK Detective: Case Closed on Soroban — Feature Tracker

## Status Legend

| Symbol | Status |
|--------|--------|
| ⬜ | Not Started |
| 🔨 | In Progress |
| ✅ | Done |

## Phase 1: Core Engine (Hackathon MVP)

| ID | Feature | Status | Priority | Dependencies |
|----|---------|--------|----------|-------------|
| [F01](F01-case-data-system.md) | Case Data System | ✅ | P0 | — |
| [F02](F02-room-navigation.md) | Room Navigation | ✅ | P0 | F01 |
| [F03](F03-inventory-system.md) | Inventory System | ✅ | P0 | F01, F02 |
| [F04](F04-dialogue-engine.md) | Dialogue Engine | ✅ | P0 | F01, F03 |
| [F05](F05-accusation-system.md) | Accusation System | ✅ | P0 | F01, F03 |
| [F06](F06-zk-accusation-circuit.md) | ZK Accusation Circuit | ✅ | P0 | F01 |
| [F07](F07-zk-clue-circuit.md) | ZK Clue Circuit | ✅ | P1 | F01, F06 |
| [F08](F08-detective-contract.md) | Detective Contract | ✅ | P0 | F06 |
| [F09](F09-leaderboard.md) | ZK+Contract Integration | ✅ | P1 | F08, F11 |
| [F10](F10-game-hub-integration.md) | Game Hub Integration | ✅ | P0 | F08 |
| [F11](F11-scoring-system.md) | Scoring System | ✅ | P1 | F01 |
| [F12](F12-single-player-flow.md) | Single Player Flow | ✅ | P0 | F02-F05, F08 |
| [F13](F13-frontend-ui.md) | Frontend UI | ✅ | P0 | F02-F05 |

## Phase 2: PvP & Polish

| ID | Feature | Status | Priority | Dependencies |
|----|---------|--------|----------|-------------|
| [F14](F14-pvp-websocket.md) | PvP WebSocket | ✅ | P1 | F12 |
| [F15](F15-minimap.md) | Minimap | ✅ | P2 | F14 |
| [F16](F16-detective-characters.md) | Detective Characters | ✅ | P2 | F13 |

## Dependency Graph

```
F01 (Case Data) ─────────────────────────────────────────┐
  ├── F02 (Room Nav) ──┐                                  │
  │     └── F03 (Inventory) ──┐                           │
  │           ├── F04 (Dialogue)──┐                       │
  │           └── F05 (Accusation)┤                       │
  │                               ├── F12 (Single Player) │
  │                               ├── F13 (Frontend UI)   │
  │                               │     └── F16 (Characters)
  ├── F06 (ZK Accusation) ──┐    │                        │
  │     └── F07 (ZK Clue)   │    │                        │
  │                          │    │                        │
  │     F08 (Contract) ─────┘────┘                        │
  │       ├── F10 (Game Hub)                              │
  │       └── F09 (Leaderboard) ← F11 (Scoring) ─────────┘
  │
  └── F11 (Scoring)
                    F12 → F14 (PvP WebSocket) → F15 (Minimap)
```

## Build Order (Recommended)

1. **F01** — Case Data System (foundation — everything depends on this)
2. **F06** — ZK Accusation Circuit (can be built in parallel with frontend)
3. **F02** — Room Navigation
4. **F03** — Inventory System
5. **F04** — Dialogue Engine
6. **F05** — Accusation System
7. **F08** — Detective Contract
8. **F10** — Game Hub Integration
9. **F11** — Scoring System
10. **F07** — ZK Clue Circuit
11. **F13** — Frontend UI (integrates F02-F05)
12. **F12** — Single Player Flow (end-to-end)
13. **F09** — Leaderboard
14. **F14** — PvP WebSocket
15. **F15** — Minimap
16. **F16** — Detective Characters
