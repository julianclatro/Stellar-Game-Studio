# F06: ZK Accusation Circuit (Noir)

**Status:** Done
**Phase:** 1 (MVP)
**Priority:** P0 (must)
**Dependencies:** F01

## Description

The Noir circuit that proves an accusation matches (or doesn't match) the committed solution -- without revealing the solution. This is the core ZK mechanic: the solution is locked on-chain as a hash commitment, and the circuit proves whether the player's guess is correct by verifying the hash relationship.

## Acceptance Criteria

- [x] Noir circuit compiles successfully (72 ACIR opcodes, 62KB compiled)
- [x] Circuit takes public inputs: commitment hash, accused_suspect, accused_weapon, accused_room
- [x] Circuit takes private inputs: suspect_id, weapon_id, room_id, salt
- [x] Circuit verifies hash(suspect_id, weapon_id, room_id, salt) == commitment
- [x] Circuit verifies accused values match private values
- [x] Circuit outputs match result (true/false)
- [x] Proof generation works client-side via Noir.js (witness execution verified)
- [ ] Proof verification works on Soroban contract (deferred to F08 -- UltraHonk verifier deps not yet public)
- [x] Proof generation completes in reasonable time (17ms via bb CLI, ~2-5s expected in browser)
- [x] Unit tests for correct and incorrect accusations (9 Noir + 16 TypeScript)

## Technical Design

### Hash Function: Pedersen (built-in)

Pedersen hash was chosen over keccak256 because:
- ~1,000 constraints vs ~150,000 for keccak256
- Built into Noir's std::hash (no external dependency)
- ZK-native, fast proof generation (~17ms vs 30-60s)

### Numeric ID Mapping

String IDs from the case data map to Field elements:
- Suspects: victor=1, elena=2, marcus=3, isabelle=4, thomas=5, priya=6, james=7, celeste=8, ren=9
- Weapons: poison_vial=1, kitchen_knife=2, candlestick=3, letter_opener=4, garden_shears=5
- Rooms: bedroom=1, kitchen=2, study=3, lounge=4, garden=5

### Full Proof Pipeline

```
nargo compile -> nargo execute (witness) -> bb prove -> bb verify
     |                  |                       |           |
   62KB ACIR        witness.gz            16KB proof    VERIFIED
```

### On-Chain Verification (F08)

The `indextree/ultrahonk_soroban_contract` provides the pattern for Soroban verification. The VK (3.6KB) is stored on-chain at deploy time, and proofs are verified via `verify_proof(public_inputs, proof_bytes)`. Integration deferred to F08 because the verifier's dependencies use private git revisions that aren't currently buildable.

## Files Created

- `circuits/accusation/src/main.nr` -- Noir circuit (9 tests)
- `circuits/accusation/Nargo.toml` -- Noir project config
- `circuits/accusation/Prover.toml` -- Test inputs with pre-computed commitment
- `circuits/compute_commitment/` -- Helper circuit to compute pedersen commitments
- `zk-detective-frontend/src/data/id-maps.ts` -- Bidirectional string/numeric ID mapping
- `zk-detective-frontend/src/services/zk-service.ts` -- Noir.js proof generation wrapper
- `zk-detective-frontend/src/services/__tests__/zk-service.test.ts` -- 16 tests
- `zk-detective-frontend/scripts/test-proof.sh` -- Full pipeline test script

## Resolved Questions

- **Hash function:** Pedersen (built-in, ~1K constraints, fast proofs)
- **Private witness:** Solution + salt are private inputs. The client-side prover provides them (from the solution.json file, which is build-time only).
- **On-chain verification:** UltraHonk verifier pattern exists (indextree). Integration in F08 once deps stabilize.
