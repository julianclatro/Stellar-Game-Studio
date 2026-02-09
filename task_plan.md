# ZK Detective — Task Plan

## Overview

Building **ZK Detective: Case Closed on Soroban** — a competitive deduction game where ZK proofs replace the trusted admin entirely. Evolving from the zk-seek proof-of-concept.

## Phase 1: Core Engine (Hackathon MVP)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Case Data System (F01) | ✅ done | 37 tests passing, types + loader + commitment |
| 2 | ZK Accusation Circuit (F06) | ✅ done | 9 Noir + 16 TS tests, full proof pipeline verified |
| 3 | Room Navigation (F02) | ✅ done | 46 tests, room engine state machine |
| 4 | Inventory System (F03) | ✅ done | 35 tests, inventory engine |
| 5 | Dialogue Engine (F04) | ✅ done | 37 tests, dialogue engine |
| 6 | Accusation System (F05) | ✅ done | 40 tests, accusation engine |
| 7 | Detective Contract (F08) | ✅ done | 39 Rust tests, Soroban contract with Game Hub integration |
| 8 | Game Hub Integration (F10) | ✅ done | Fully implemented in F08, deploy scripts auto-discover |
| 9 | Scoring System (F11) | ✅ done | 36 TS tests, client-side scoring mirroring on-chain formula |
| 10 | ZK Clue Circuit (F07) | ✅ done | 10 Noir + 32 TS tests, clue verification circuit + service |
| 11 | Frontend UI (F13) | pending | Integrates F02-F05 |
| 12 | Single Player Flow (F12) | pending | End-to-end integration |
| 13 | Leaderboard (F09) | pending | Depends on F08, F11 |

## Phase 2: PvP & Polish

| # | Task | Status | Notes |
|---|------|--------|-------|
| 14 | PvP WebSocket (F14) | pending | Depends on F12 |
| 15 | Minimap (F15) | pending | Depends on F14 |
| 16 | Detective Characters (F16) | pending | Depends on F13 |

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| ZK Framework | Noir | Rust-like, good tooling, client-side proofs |
| Game Master | Pre-written cases | Simplest for hackathon |
| ZK Layer | Layer 1 only | Core innovation, Layer 2 is future work |
| PvP info hiding | WebSocket filtering | Pragmatic — no ZK needed |

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| (none yet) | — | — |
