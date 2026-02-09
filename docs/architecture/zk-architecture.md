# ZK Architecture

> Extracted from [Game Plan](../game-plan.md) — Sections 3.1–3.4

---

## Layer 1: Honest Game Master (Core — Must Build)

This is the essential ZK mechanic for the hackathon.

### Commit Phase

At case creation, the admin commits the solution on-chain:

```
commitment = hash(suspect_id, weapon_id, room_id, salt)
```

This commitment is stored in the Soroban contract. Nobody can see the solution, but it's locked.

### Investigate Phase

When a player inspects a clue or interrogates a suspect, the game responds with information AND a ZK proof:
- "I know a solution (suspect, weapon, room, salt) such that hash(...) matches the on-chain commitment, AND the clue I'm giving you is consistent with that solution."

The Soroban contract verifies the proof. The player trusts the response without anyone revealing the solution. The game master cannot lie — an incorrect clue would produce an invalid proof.

### Accuse Phase

Player selects: **WHO** (suspect) + **WHAT** (weapon) + **WHERE** (room).
The contract hashes the accusation and verifies it against the commitment via ZK proof.

---

## Layer 2: Hidden Investigation (Future — Noted in Submission)

In PvP, if Player 2 can see Player 1's queries, they gain free information. Layer 2 uses ZK to hide *what* you investigated while proving the response is valid. This is noted as future work — it's significantly more complex but demonstrates the team understands the design space.

---

## ZK Framework: Noir

- Noir circuits compiled to generate proofs client-side (browser)
- Proof verification happens on-chain in the Soroban contract
- Noir is Rust-like, aligning with Soroban's Rust ecosystem
- Circuit complexity is manageable: hash verification + attribute lookups

---

## How It Maps to the Existing Architecture

| Current (zk-seek / Where's Waldo) | ZK Detective Equivalent |
|---|---|
| Scene with committed target coordinates | Case with committed solution (suspect, weapon, room) |
| Player commits guess coordinates | Player makes investigation choices |
| Admin resolves (reveals target) | **Replaced by ZK proof — no reveal needed** |
| Distance calculation on-chain | Clue consistency verified via ZK proof |

The key upgrade: **ZK proofs eliminate the admin resolve step entirely.** The game is trustless from start to finish.

---

## Noir Circuits

### Circuit 1: Clue Verification

```
// Proves: "This clue response is consistent with the committed solution"
// Public inputs: commitment hash, clue_id, clue_response
// Private inputs: suspect_id, weapon_id, room_id, salt, case_data
//
// Logic:
// 1. Verify hash(suspect_id, weapon_id, room_id, salt) == commitment
// 2. Verify clue_response == lookup(clue_id, case_data)
```

### Circuit 2: Accusation Verification

```
// Proves: "This accusation matches the committed solution"
// Public inputs: commitment hash, accused_suspect, accused_weapon, accused_room
// Private inputs: suspect_id, weapon_id, room_id, salt
//
// Logic:
// 1. Verify hash(suspect_id, weapon_id, room_id, salt) == commitment
// 2. Verify accused_suspect == suspect_id
// 3. Verify accused_weapon == weapon_id
// 4. Verify accused_room == room_id
// 5. Return match: true/false
```

---

## ZK Categories Covered

From the hackathon's suggested directions:

| Category | How ZK Detective Uses It |
|---|---|
| **Hidden-information games** | Solution committed privately. Clue responses proven without revealing the answer. |
| **Provable outcomes** | Accusations verified on-chain via ZK proof. Match results are auditable. |
| **Private actions / fog-of-war** | Investigation choices hidden from opponent (PvP). WebSocket broadcasts events without details. Layer 2 ZK noted as future work for full privacy. |
| **Provable randomness** | Case selection and clue distribution can use provably fair randomness (future: procedural case generation). |
| **Puzzle / strategy proofs** | Player proves they solved the case without revealing their reasoning path to the opponent. |
