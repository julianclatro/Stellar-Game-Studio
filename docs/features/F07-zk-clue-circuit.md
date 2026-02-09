# F07: ZK Clue Circuit (Noir)

**Status:** Done
**Phase:** 1 (MVP)
**Priority:** P1 (should)
**Dependencies:** F01, F06

## Description

The Noir circuit that proves a clue response is consistent with the committed solution — the "honest game master" mechanic. When a player inspects a clue, the game provides information AND a ZK proof that the information is truthful. The game master literally cannot lie.

## Acceptance Criteria

- [x] Noir circuit compiles successfully (10 Noir tests)
- [x] Circuit takes public inputs: commitment, clue_id, clue_response_hash
- [x] Circuit takes private inputs: solution_suspect/weapon/room, salt, related_suspect, response_value
- [x] Circuit verifies commitment matches pedersen_hash(suspect, weapon, room, salt)
- [x] Circuit verifies clue response is consistent with the solution (response_value truthfulness)
- [x] Proof generation API via ClueVerifyService (Noir.js wrapper)
- [ ] Proof verification on Soroban contract (deferred — UltraHonk deps not yet public)
- [x] Unit tests for valid and tampered clue responses (4 should_fail tests)
- [x] Clue numeric ID mapping (11 clues)
- [x] TypeScript response value computation + tests (32 TS tests)

## Technical Design

### Response Encoding

Instead of encoding full clue text in the circuit (impractical), we encode the clue's **relationship to the solution**:

- `response_value = 1` if the clue's `related_suspect` is the guilty suspect (relevant)
- `response_value = 0` otherwise (different suspect or no suspect link)

Pre-committed response hashes bind each clue to its truthful response:
```
clue_response_hash = pedersen_hash([clue_numeric_id, response_value])
```

### Noir Circuit

```noir
fn main(
    // Private witness
    solution_suspect: Field, solution_weapon: Field, solution_room: Field, salt: Field,
    related_suspect: Field, response_value: Field,
    // Public inputs
    commitment: pub Field, clue_id: pub Field, clue_response_hash: pub Field,
) -> pub bool {
    // 1. Verify solution matches commitment
    assert(pedersen_hash([solution_suspect, solution_weapon, solution_room, salt]) == commitment);
    // 2. Verify response hash
    assert(pedersen_hash([clue_id, response_value]) == clue_response_hash);
    // 3. Verify response_value truthfulness
    //    response_value must be 1 iff related_suspect == solution_suspect and != 0
    ...
    // Returns whether clue is relevant to the solution
}
```

### Clue Numeric IDs (Meridian Manor)

| Clue | ID | Related Suspect | Response (Victor guilty) |
|------|----|-----------------|--------------------------|
| perfume_bottle | 1 | victor | 1 (relevant) |
| smudged_fingerprints | 2 | (none) | 0 |
| torn_letter | 3 | victor | 1 (relevant) |
| insurance_docs | 4 | victor | 1 (relevant) |
| crumpled_note | 5 | victor | 1 (relevant) |
| phone_records | 6 | marcus | 0 |
| medicine_bottle | 7 | marcus | 0 |
| wine_glass | 8 | (none) | 0 |
| missing_knife | 9 | elena | 0 |
| muddy_footprints | 10 | thomas | 0 |
| camera_photos | 11 | thomas | 0 |

## Files Created

- `circuits/clue-verify/Nargo.toml` — Noir project config
- `circuits/clue-verify/src/main.nr` — Noir circuit + 10 tests
- `zk-detective-frontend/src/data/clue-ids.ts` — Clue string/numeric ID mapping
- `zk-detective-frontend/src/services/clue-verify-service.ts` — ClueVerifyService + response value computation
- `zk-detective-frontend/src/services/__tests__/clue-verify-service.test.ts` — 32 TS tests
- `zk-detective-frontend/scripts/generate-clue-hashes.ts` — Build script for clue response hash generation
- `zk-detective-frontend/src/data/index.ts` — Updated barrel export with clue IDs
- `zk-detective-frontend/src/services/index.ts` — Updated barrel export with ClueVerifyService

## Resolved Questions

- **Encoding approach:** Pre-committed response hashes (Approach 1 — simple). Response encodes whether clue is relevant to guilty suspect.
- **Hash storage:** Pre-computed at build time via pedersen_hash, stored alongside case data.
- **Batch verification:** Not needed for MVP. One proof per clue inspection.
- **Hackathon necessity:** Yes — this is the core "honest game master" mechanic that differentiates ZK Detective.
