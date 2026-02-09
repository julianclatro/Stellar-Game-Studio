# F08: Detective Contract (Soroban)

**Status:** Done
**Phase:** 1 (MVP)
**Priority:** P0 (must)
**Dependencies:** F06

## Description

The main Soroban smart contract for ZK Detective. Manages case commitments, game sessions, accusation verification via hash checks, and player stats/leaderboard. Follows the Game Studio patterns (constructor, Game Hub integration, temporary storage with TTL).

## Acceptance Criteria

- [x] Contract compiles and builds to WASM
- [x] `__constructor(env, admin, game_hub)` stores admin and game hub address
- [x] `create_case(case_id, commitment)` stores case commitment (admin only)
- [x] `start_game(player1, player2, case_id)` creates session, calls Game Hub
- [x] `update_progress(session_id, player, clues, rooms)` tracks investigation metrics
- [x] `accuse(session_id, player, suspect, weapon, room, salt)` verifies accusation via hash
- [x] Game Hub `end_game` called on correct accusation
- [x] `abandon_game(session_id)` admin can end stuck games
- [x] `get_game(session_id)` returns current game state for UI
- [x] `get_player_stats(player)` returns player leaderboard stats
- [x] Game state uses temporary storage with 30-day TTL
- [x] Auth: both players require_auth for start_game
- [x] All error cases handled with `#[contracterror]` enum (8 error codes)
- [x] ID validation: suspect 1-9, weapon 1-5, room 1-5
- [x] Scoring formula: base - time - wrong_accusations + exploration
- [x] Unit tests cover all functions and error paths (39 tests)
- [ ] ZK proof verification (deferred -- UltraHonk Soroban deps not yet public)
- [ ] Deployed to Stellar Testnet (deferred to setup/deploy step)

## Technical Design

### Verification Approach

**Hackathon pragmatism (Option 3):** Uses keccak256 hash checks on-chain, matching the zk-seek pattern. The commitment `keccak256(suspect_id || weapon_id || room_id || salt)` is stored at case creation. Accusations are verified by recomputing the hash.

**Future:** Replace with Noir UltraHonk ZK proof verification once Soroban verifier dependencies are publicly available. The client-side ZK pipeline (F06) is already built and working.

### Storage

```rust
// Instance storage (persistent)
Admin: Address
GameHubAddress: Address

// Persistent storage
Case(case_id: u32) -> BytesN<32>          // commitment hash
PlayerStats(player: Address) -> PlayerStats  // leaderboard

// Temporary storage (30-day TTL)
Game(session_id: u32) -> GameState
```

### GameState struct

```rust
pub struct GameState {
    pub session_id: u32,
    pub case_id: u32,
    pub player1: Address,
    pub player2: Address,
    pub start_ledger: u32,
    pub solve_ledger: u32,
    pub clues_inspected: u32,
    pub rooms_visited: u32,
    pub wrong_accusations: u32,
    pub status: GameStatus,        // Active | Solved | Abandoned
    pub winner: Option<Address>,
}
```

### Scoring Formula

```
score = 10000 (base)
      - min(time_elapsed, 5000)           // -1 per ledger (~5s)
      - wrong_accusations * 500            // -500 per wrong guess
      + clues_inspected * 100              // +100 per clue
      + rooms_visited * 50                 // +50 per room
      = max(0, result)                     // floor at 0
```

### Game Hub Integration

Follows the exact pattern from AGENTS.md:
- `start_game()` -> `GameHubClient::start_game()`
- `accuse()` (correct) -> `GameHubClient::end_game()`

## Files Created/Modified

- `contracts/zk-detective/Cargo.toml` -- Contract crate config
- `contracts/zk-detective/src/lib.rs` -- Contract implementation
- `contracts/zk-detective/src/test.rs` -- 39 unit tests
- `Cargo.toml` -- Added workspace member

## API

```rust
// Admin
__constructor(env, admin, game_hub)
create_case(env, case_id, commitment) -> Result<(), Error>
abandon_game(env, session_id) -> Result<(), Error>
set_admin(env, new_admin)
set_hub(env, new_hub)
upgrade(env, new_wasm_hash)

// Game Session
start_game(env, session_id, player1, player2, p1_points, p2_points, case_id) -> Result<(), Error>
update_progress(env, session_id, player, clues_inspected, rooms_visited) -> Result<(), Error>
accuse(env, session_id, player, suspect_id, weapon_id, room_id, salt) -> Result<bool, Error>

// Queries
get_game(env, session_id) -> Result<GameState, Error>
get_case(env, case_id) -> Result<BytesN<32>, Error>
get_player_stats(env, player) -> PlayerStats
get_admin(env) -> Address
get_hub(env) -> Address
```

## Resolved Questions

- **ZK proof verification:** Deferred. Using keccak256 hash checks (like zk-seek) for hackathon. Noir UltraHonk verifier deps not yet public for Soroban.
- **Single-player:** Frontend passes player2 as any address (or contract address). No special single-player function needed -- the Game Hub just sees two players.
- **Per-player tracking:** Simplified to per-session (not per-player within session) for MVP. PvP tracking deferred to F14.
- **Scoring formula:** Implemented on-chain in `compute_score()`. Base 10000, penalties for time/wrong guesses, bonuses for exploration.
