# ZK Detective — Research Findings

## Noir / ZK

- Noir compiles circuits for client-side proof generation (browser via Noir.js)
- Pedersen and Poseidon hashes are native to Noir — efficient in circuits
- Circuit complexity for this game is manageable: hash verification + attribute lookups
- Proof verification on Soroban needs investigation — custom verifier or precompile?

## Soroban / Stellar

- soroban-sdk v25.0.2 (workspace dependency)
- Game Hub contract pattern: `start_game()` + `end_game()` lifecycle
- Temporary storage with 518,400 ledger TTL (30 days)
- `env.crypto().keccak256()` available for hashing
- BytesN<32> for 32-byte hashes
- WASM target: `wasm32-unknown-unknown`

## Existing zk-seek Contract

- Commit-reveal scheme with keccak256
- Scene target commitment: `keccak256(target_x || target_y || scene_salt)`
- Successfully built and tested (27 tests passing)
- Good reference for the detective contract pattern

## Architecture Decisions

- Case data stored off-chain (JSON), solution commitment on-chain
- WebSocket for PvP (no ZK needed for info hiding — server filters event details)
- Hidden scoring formula prevents gaming the system
- Three-state dialogue system: default → clue-triggered → confrontation

## Open Research

- [ ] Noir proof verification on Soroban — is there a precompile or do we need custom verification?
- [ ] Noir.js browser compatibility and proof generation performance
- [ ] Best hash function for Noir ↔ Soroban compatibility (Pedersen vs. Poseidon vs. keccak256)
- [ ] How to handle single-player with Game Hub (expects two players)
