# F09: Leaderboard

**Status:** Not Started
**Phase:** 1 (MVP)
**Priority:** P1 (should)
**Dependencies:** F08, F11

## Description

On-chain leaderboard stored in the Soroban contract. Tracks player scores per case, total cases solved, and average solve time. Displayed in the frontend as a ranked list. Players compete for the best score on the same case.

## Acceptance Criteria

- [ ] Leaderboard data stored on-chain in the detective contract
- [ ] Player address linked to their best score per case
- [ ] Total cases solved tracked per player
- [ ] Average solve time tracked per player
- [ ] Leaderboard sorted by best score (descending)
- [ ] Frontend displays top N players with rank, address (truncated), score
- [ ] Player's own rank highlighted
- [ ] Leaderboard updates after each completed game
- [ ] Accessible from lobby/home screen

## Technical Design

### On-Chain Storage

```rust
#[contracttype]
pub struct PlayerStats {
    pub best_score: i128,
    pub cases_solved: u32,
    pub total_solve_time: u32,  // sum of solve times for average calc
}
```

The leaderboard is a mapping from `Address → PlayerStats`. To get a ranked view, the frontend calls `get_leaderboard()` which returns all entries, and the client sorts them.

For efficiency, consider storing a separate "top 10" list that's maintained on writes, so the frontend can fetch just the top entries without scanning all players.

### Score Update Flow

1. Player solves case → scoring system (F11) calculates final score
2. `end_game()` in contract checks if this score beats player's `best_score`
3. If better, update `PlayerStats`
4. Increment `cases_solved` and update `total_solve_time`

## Files to Create/Modify

- `contracts/zk-detective/src/lib.rs` — Leaderboard storage + functions (part of F08)
- `src/components/Leaderboard.tsx` — Leaderboard display component
- `src/services/leaderboard-service.ts` — Fetch and format leaderboard data

## Open Questions

- How many leaderboard entries to display? Top 10? Top 50?
- Should there be separate leaderboards per case, or one global leaderboard?
- How to handle address display — truncated, or allow linked wallet names?
- Pagination for large leaderboards?
