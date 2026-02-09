use std::hash::pedersen_hash;

// ZK Accusation Circuit -- ZK Detective: Case Closed on Soroban
//
// Proves that an accusation matches (or doesn't match) the committed
// solution without revealing the solution to anyone.
//
// Numeric ID mapping (defined in TypeScript, enforced here):
//   Suspects: victor=1, elena=2, marcus=3, isabelle=4, thomas=5,
//             priya=6, james=7, celeste=8, ren=9
//   Weapons:  poison_vial=1, kitchen_knife=2, candlestick=3,
//             letter_opener=4, garden_shears=5
//   Rooms:    bedroom=1, kitchen=2, study=3, lounge=4, garden=5

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
    let computed_commitment = pedersen_hash([
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
    // Solution: Victor (1), poison_vial (1), bedroom (1)
    let suspect: Field = 1;
    let weapon: Field = 1;
    let room: Field = 1;
    let salt: Field = 42;

    let commitment = pedersen_hash([suspect, weapon, room, salt]);

    let result = main(
        suspect, weapon, room, salt,
        commitment,
        1, 1, 1, // correct accusation
    );
    assert(result);
}

#[test]
fn test_wrong_suspect() {
    let suspect: Field = 1;
    let weapon: Field = 1;
    let room: Field = 1;
    let salt: Field = 42;

    let commitment = pedersen_hash([suspect, weapon, room, salt]);

    let result = main(
        suspect, weapon, room, salt,
        commitment,
        2, 1, 1, // wrong suspect
    );
    assert(!result);
}

#[test]
fn test_wrong_weapon() {
    let suspect: Field = 1;
    let weapon: Field = 1;
    let room: Field = 1;
    let salt: Field = 42;

    let commitment = pedersen_hash([suspect, weapon, room, salt]);

    let result = main(
        suspect, weapon, room, salt,
        commitment,
        1, 3, 1, // wrong weapon
    );
    assert(!result);
}

#[test]
fn test_wrong_room() {
    let suspect: Field = 1;
    let weapon: Field = 1;
    let room: Field = 1;
    let salt: Field = 42;

    let commitment = pedersen_hash([suspect, weapon, room, salt]);

    let result = main(
        suspect, weapon, room, salt,
        commitment,
        1, 1, 5, // wrong room
    );
    assert(!result);
}

#[test]
fn test_all_wrong() {
    let suspect: Field = 1;
    let weapon: Field = 1;
    let room: Field = 1;
    let salt: Field = 42;

    let commitment = pedersen_hash([suspect, weapon, room, salt]);

    let result = main(
        suspect, weapon, room, salt,
        commitment,
        9, 5, 5, // all wrong
    );
    assert(!result);
}

#[test]
fn test_partially_correct_suspect_only() {
    let suspect: Field = 3;
    let weapon: Field = 2;
    let room: Field = 4;
    let salt: Field = 777;

    let commitment = pedersen_hash([suspect, weapon, room, salt]);

    let result = main(
        suspect, weapon, room, salt,
        commitment,
        3, 5, 1, // only suspect correct
    );
    assert(!result);
}

#[test(should_fail)]
fn test_invalid_commitment_fails() {
    // If someone tries to use a fake commitment, the circuit rejects
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

    let commitment_a = pedersen_hash([suspect, weapon, room, 100]);
    let commitment_b = pedersen_hash([suspect, weapon, room, 200]);

    // Same solution, different salts -> different commitments
    assert(commitment_a != commitment_b);
}

#[test]
fn test_realistic_case_solution() {
    // The Meridian Manor Incident: Victor (1), poison_vial (1), bedroom (1)
    let suspect: Field = 1;
    let weapon: Field = 1;
    let room: Field = 1;
    let salt: Field = 0xDEADBEEF;

    let commitment = pedersen_hash([suspect, weapon, room, salt]);

    // Correct accusation
    let correct = main(suspect, weapon, room, salt, commitment, 1, 1, 1);
    assert(correct);

    // Wrong accusation: Elena (2) with kitchen_knife (2) in kitchen (2)
    let wrong = main(suspect, weapon, room, salt, commitment, 2, 2, 2);
    assert(!wrong);
}
