// ZK Accusation Circuit -- ZK Detective: Case Closed on Soroban
//
// Proves that an accusation matches (or doesn't match) the committed
// solution without revealing the solution to anyone.
//
// Hash function: Poseidon2 (BN254-native, Protocol 25 aligned)
// Uses the same sponge construction as Noir stdlib's internal Poseidon2::hash.
//
// Numeric ID mapping (defined in TypeScript, enforced here):
//   Suspects: victor=1, elena=2, marcus=3, isabelle=4, thomas=5,
//             priya=6, james=7, celeste=8, ren=9
//   Weapons:  poison_vial=1, kitchen_knife=2, candlestick=3,
//             letter_opener=4, garden_shears=5
//   Rooms:    bedroom=1, kitchen=2, study=3, lounge=4, garden=5

/// Poseidon2 sponge hash for exactly 4 Field elements.
/// Matches Noir stdlib Poseidon2::hash([a,b,c,d], 4) internal implementation.
fn poseidon2_hash_4(input: [Field; 4]) -> Field {
    let two_pow_64: Field = 18446744073709551616;
    let iv: Field = 4 * two_pow_64;

    // Rate=3, capacity=1. Initialize state with IV in first slot.
    let mut state: [Field; 4] = [iv, 0, 0, 0];

    // Absorb first 3 elements (fills one full rate block) -> permute
    state[0] += input[0];
    state[1] += input[1];
    state[2] += input[2];
    state = std::hash::poseidon2_permutation(state, 4);

    // Absorb remaining element + padding 1 -> permute (squeeze duplex)
    state[0] += input[3];
    state[1] += 1;
    state = std::hash::poseidon2_permutation(state, 4);

    state[0]
}

fn main(
    // Private witness -- only the prover knows these
    solution_suspect: Field,
    solution_weapon: Field,
    solution_room: Field,
    salt: Field,

    // Public inputs -- visible to verifier and on-chain
    commitment: pub Field,
    accused_suspect: pub Field,
    accused_weapon: pub Field,
    accused_room: pub Field,
) -> pub bool {
    // 1. Verify the prover knows the real solution behind the commitment
    let computed_commitment = poseidon2_hash_4([
        solution_suspect,
        solution_weapon,
        solution_room,
        salt,
    ]);
    assert(computed_commitment == commitment);

    // 2. Check if the accusation matches the real solution
    let suspect_match = accused_suspect == solution_suspect;
    let weapon_match = accused_weapon == solution_weapon;
    let room_match = accused_room == solution_room;

    suspect_match & weapon_match & room_match
}

// --- Tests -----------------------------------------------------------

#[test]
fn test_correct_accusation() {
    let suspect: Field = 1;
    let weapon: Field = 1;
    let room: Field = 1;
    let salt: Field = 42;

    let commitment = poseidon2_hash_4([suspect, weapon, room, salt]);

    let result = main(
        suspect, weapon, room, salt,
        commitment,
        1, 1, 1,
    );
    assert(result);
}

#[test]
fn test_wrong_suspect() {
    let suspect: Field = 1;
    let weapon: Field = 1;
    let room: Field = 1;
    let salt: Field = 42;

    let commitment = poseidon2_hash_4([suspect, weapon, room, salt]);

    let result = main(
        suspect, weapon, room, salt,
        commitment,
        2, 1, 1,
    );
    assert(!result);
}

#[test]
fn test_wrong_weapon() {
    let suspect: Field = 1;
    let weapon: Field = 1;
    let room: Field = 1;
    let salt: Field = 42;

    let commitment = poseidon2_hash_4([suspect, weapon, room, salt]);

    let result = main(
        suspect, weapon, room, salt,
        commitment,
        1, 3, 1,
    );
    assert(!result);
}

#[test]
fn test_wrong_room() {
    let suspect: Field = 1;
    let weapon: Field = 1;
    let room: Field = 1;
    let salt: Field = 42;

    let commitment = poseidon2_hash_4([suspect, weapon, room, salt]);

    let result = main(
        suspect, weapon, room, salt,
        commitment,
        1, 1, 5,
    );
    assert(!result);
}

#[test]
fn test_all_wrong() {
    let suspect: Field = 1;
    let weapon: Field = 1;
    let room: Field = 1;
    let salt: Field = 42;

    let commitment = poseidon2_hash_4([suspect, weapon, room, salt]);

    let result = main(
        suspect, weapon, room, salt,
        commitment,
        9, 5, 5,
    );
    assert(!result);
}

#[test]
fn test_partially_correct_suspect_only() {
    let suspect: Field = 3;
    let weapon: Field = 2;
    let room: Field = 4;
    let salt: Field = 777;

    let commitment = poseidon2_hash_4([suspect, weapon, room, salt]);

    let result = main(
        suspect, weapon, room, salt,
        commitment,
        3, 5, 1,
    );
    assert(!result);
}

#[test(should_fail)]
fn test_invalid_commitment_fails() {
    let fake_commitment: Field = 99999;

    let _ = main(
        1, 1, 1, 42,
        fake_commitment,
        1, 1, 1,
    );
}

#[test]
fn test_different_salt_different_commitment() {
    let suspect: Field = 1;
    let weapon: Field = 1;
    let room: Field = 1;

    let commitment_a = poseidon2_hash_4([suspect, weapon, room, 100]);
    let commitment_b = poseidon2_hash_4([suspect, weapon, room, 200]);

    assert(commitment_a != commitment_b);
}

#[test]
fn test_realistic_case_solution() {
    let suspect: Field = 1;
    let weapon: Field = 1;
    let room: Field = 1;
    let salt: Field = 0xDEADBEEF;

    let commitment = poseidon2_hash_4([suspect, weapon, room, salt]);

    let correct = main(suspect, weapon, room, salt, commitment, 1, 1, 1);
    assert(correct);

    let wrong = main(suspect, weapon, room, salt, commitment, 2, 2, 2);
    assert(!wrong);
}
