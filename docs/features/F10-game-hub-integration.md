# F10: Game Hub Integration

**Status:** Done
**Phase:** 1 (MVP)
**Priority:** P0 (must)
**Dependencies:** F08

## Description

Integration with the Stellar Game Studio's Game Hub contract. Every game in the studio must call `start_game()` and `end_game()` on the Game Hub to register lifecycle events. This is a hackathon requirement -- the ZK Detective contract must follow the established pattern.

## Acceptance Criteria

- [x] Game Hub client trait defined in the detective contract
- [x] `start_game()` calls `GameHubClient::start_game()` with correct parameters
- [x] `end_game()` calls `GameHubClient::end_game()` with winner information
- [x] Game Hub address stored in instance storage (set in constructor)
- [x] Both players `require_auth_for_args` with session_id and points
- [x] Contract works with the deployed Game Hub at `CB4VZ...` (deploy script compatible)
- [x] Mock Game Hub used in tests (39 tests in F08)
- [ ] Integration tested end-to-end on testnet (deferred to deploy step)

## Implementation Notes

F10 was fully implemented as part of F08 (Detective Contract). The Game Hub integration was built directly into the contract following the exact pattern from AGENTS.md and the zk-seek reference contract.

### What was built in F08:

1. **Game Hub Client Trait** (`lib.rs:25-38`)
   ```rust
   #[contractclient(name = "GameHubClient")]
   pub trait GameHub {
       fn start_game(env, game_id, session_id, player1, player2, p1_points, p2_points);
       fn end_game(env, session_id, player1_won);
   }
   ```

2. **Constructor** (`lib.rs:170-175`) -- stores admin + game_hub in instance storage

3. **start_game** (`lib.rs:221-292`)
   - Both players `require_auth_for_args(vec![session_id, points])`
   - Calls `game_hub.start_game(&env.current_contract_address(), ...)` before storing state
   - Matches the pattern from all other Game Studio contracts

4. **accuse (correct)** (`lib.rs:375-389`)
   - On correct accusation, calls `game_hub.end_game(&session_id, &player1_won)`
   - Game Hub is called before finalizing the winner state (per AGENTS.md)

5. **Mock Game Hub in tests** (`test.rs:11-30`)
   - Full MockGameHub with `start_game`, `end_game`, `add_game`
   - Used by all 39 tests via `setup_test()` helper

### Deploy Script Compatibility

The existing `scripts/deploy.ts` discovers workspace contracts from `Cargo.toml` automatically. Since `contracts/zk-detective` was added to the workspace in F08, running:

```bash
bun run build zk-detective
bun run deploy zk-detective
bun run bindings zk-detective
```

...will build, deploy (with the existing testnet Game Hub `CB4VZ...`), and generate TypeScript bindings without any script changes.

The deploy script passes `--admin` and `--game-hub` to the constructor automatically (line 305).

## Files (no new files -- all implemented in F08)

- `contracts/zk-detective/src/lib.rs` -- Game Hub trait + integration calls
- `contracts/zk-detective/src/test.rs` -- 39 tests with Mock Game Hub
- `Cargo.toml` -- zk-detective in workspace members (picked up by scripts)

## Resolved Questions

- **Initial points:** Configurable per session -- both players pass their points to `start_game()`.
- **Single-player mode:** Frontend passes player2 as any valid address. Game Hub sees two players as normal.
- **Mock Game Hub:** Uses inline MockGameHub in test.rs (same pattern as zk-seek, number-guess, etc.).
