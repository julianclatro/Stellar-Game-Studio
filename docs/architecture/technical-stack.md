# Technical Stack

> Extracted from [Game Plan](../game-plan.md) — Section 8

---

## Stack Overview

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│  React/TypeScript (from Game Studio template)       │
│  WebSocket client (PvP real-time)                   │
│  Noir.js (client-side proof generation)             │
│  Stellar SDK (contract interaction)                 │
└─────────────┬─────────────────┬─────────────────────┘
              │                 │
              ▼                 ▼
┌─────────────────────┐  ┌──────────────────────────┐
│   SOROBAN CONTRACTS  │  │   WEBSOCKET SERVER       │
│   (Stellar Testnet)  │  │   (PvP coordination)     │
│                      │  │   Room state sync         │
│  • Game Hub (given)  │  │   Timer management        │
│  • ZK Detective      │  │   Opponent position       │
│  • Leaderboard       │  └──────────────────────────┘
│  • Noir Verifier     │
└──────────────────────┘
```

---

## Soroban Contracts

### Contract: `zk-detective`

```rust
// Core storage
CaseCommitment: Map<u32, BytesN<32>>     // case_id → hash(suspect, weapon, room, salt)
GameState: Map<u32, GameSession>          // session_id → game state
Leaderboard: Map<Address, PlayerStats>    // player → best scores

// Key functions
fn create_case(env, admin, case_id, commitment)        // Admin commits solution hash
fn start_game(env, player1, player2, case_id)          // Start session, call Game Hub
fn investigate(env, session_id, player, proof)          // Verify ZK proof for clue response
fn accuse(env, session_id, player, suspect, weapon, room, proof)  // Verify accusation via ZK
fn end_game(env, session_id)                            // Call Game Hub, update leaderboard
fn get_leaderboard(env)                                 // Read leaderboard
```

### Integration with Game Hub

- `start_game()` calls Game Hub's `start_game()` with both players and initial points
- `end_game()` calls Game Hub's `end_game()` with the winner
- Follows the exact pattern from AGENTS.md

---

## Modular Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      GAME ENGINE MODULES                     │
├──────────────┬──────────────┬──────────────┬─────────────────┤
│  Room Engine │  Dialogue    │  Inventory   │  Accusation     │
│              │  Engine      │  System      │  System         │
│  Navigation  │  State mgmt  │  Collect     │  Select & verify│
│  Connections │  Clue-aware  │  Track       │  ZK proof       │
│  Rendering   │  Evolution   │  Present     │  Result         │
├──────────────┴──────────────┴──────────────┴─────────────────┤
│                      SHARED SERVICES                         │
├──────────────┬──────────────┬──────────────┬─────────────────┤
│  ZK Service  │  Contract    │  WebSocket   │  Scoring        │
│              │  Service     │  Service     │  Service        │
│  Noir proofs │  Soroban     │  PvP sync    │  Calculate      │
│  Verify      │  Read/write  │  Events      │  Leaderboard    │
├──────────────┴──────────────┴──────────────┴─────────────────┤
│                      DATA LAYER                              │
├──────────────┬──────────────┬────────────────────────────────┤
│  Case Data   │  Game State  │  Player State                  │
│  (static)    │  (session)   │  (persistent)                  │
│  Rooms, clues│  Current room│  Inventory, score              │
│  Suspects    │  Timer       │  Leaderboard entry             │
│  Solution    │  Phase       │  Match history                 │
└──────────────┴──────────────┴────────────────────────────────┘
```

### Module Reusability

These modules are designed so that a **second game** (Battleship, Mastermind, etc.) reuses the shared services layer entirely:
- ZK Service: same proof generation/verification pipeline
- Contract Service: same Soroban interaction pattern
- WebSocket Service: same PvP coordination
- Scoring Service: different formula, same leaderboard infrastructure

Only the game engine modules change per game. This is the "ZK game engine" concept — detective game is the flagship, but the platform supports more.

---

## Real-Time PvP (WebSocket)

### Events

```
// Client → Server
{ type: "move", room: "kitchen" }
{ type: "inspect", clue: "perfume_bottle" }
{ type: "interrogate", suspect: "victor", show_clue: "insurance_docs" }
{ type: "accuse", suspect: "victor", weapon: "poison_vial", room: "bedroom" }

// Server → Client
{ type: "opponent_moved", room: "lounge" }
{ type: "opponent_inspected" }              // No detail — just that they inspected something
{ type: "opponent_interrogated" }           // No detail
{ type: "opponent_accused", correct: false } // Opponent got it wrong
{ type: "game_over", winner: "player1", score: 850 }
{ type: "timer_update", remaining: 180 }
```

**Key design decision:** The opponent sees THAT you did something, but not WHAT (except room movement via minimap). This creates information asymmetry without needing ZK Layer 2. The WebSocket server simply doesn't broadcast the details — only the event type.
