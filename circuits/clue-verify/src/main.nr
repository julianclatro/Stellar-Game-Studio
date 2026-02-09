use std::hash::pedersen_hash;

// ZK Clue Verification Circuit -- ZK Detective: Case Closed on Soroban
//
// Proves that a clue response is truthful -- the "honest game master" mechanic.
// The prover demonstrates:
//   1. They know the real solution behind the on-chain commitment
//   2. The clue response they are providing matches the pre-committed
//      response hash for this specific clue
//
// This means the game master CANNOT lie about clue content. An incorrect
// clue response would produce an invalid proof.
//
// Pre-committed response hashes are computed at build time:
//   clue_response_hash = pedersen_hash([clue_id, response_value])
//
// The response_value encodes the clue's relationship to the solution:
//   - For clues related to the guilty suspect: response_value = 1 (relevant)
//   - For clues related to other suspects: response_value = 0 (not relevant)
//   - For clues with no suspect link: response_value = 0 (neutral)
//
// This allows the circuit to verify clue truthfulness without encoding
// the full case data, by checking that the response_value correctly
// reflects whether the clue's related_suspect matches the solution.

fn main(
    // Private witness -- only the prover knows these
    solution_suspect: Field,
    solution_weapon: Field,
    solution_room: Field,
    salt: Field,
    related_suspect: Field,
    response_value: Field,

    // Public inputs -- visible to verifier
    commitment: pub Field,
    clue_id: pub Field,
    clue_response_hash: pub Field,
) -> pub bool {
    // 1. Verify the prover knows the real solution behind the commitment
    let computed_commitment = pedersen_hash([
        solution_suspect,
        solution_weapon,
        solution_room,
        salt,
    ]);
    assert(computed_commitment == commitment);

    // 2. Verify the clue response hash matches
    //    The response hash binds the clue_id to the response_value
    let computed_response_hash = pedersen_hash([clue_id, response_value]);
    assert(computed_response_hash == clue_response_hash);

    // 3. Verify the response_value is truthful
    //    If related_suspect == 0 (no suspect link), response must be 0
    //    If related_suspect == solution_suspect, response must be 1 (relevant)
    //    If related_suspect != solution_suspect and != 0, response must be 0
    let is_guilty_suspect = related_suspect == solution_suspect;
    let has_no_link = related_suspect == 0;

    // response_value must be 1 if and only if the clue points to the guilty suspect
    let expected_relevant = is_guilty_suspect & (!has_no_link);

    // Convert bool to field for comparison
    let expected_value = expected_relevant as Field;
    assert(response_value == expected_value);

    // Return whether this clue is relevant to the solution
    expected_relevant
}

// --- Tests -----------------------------------------------------------

#[test]
fn test_clue_relevant_to_guilty_suspect() {
    // Clue related to suspect 1 (guilty), response_value = 1
    let suspect: Field = 1;
    let weapon: Field = 1;
    let room: Field = 1;
    let salt: Field = 42;
    let clue_id: Field = 101;

    let commitment = pedersen_hash([suspect, weapon, room, salt]);
    let response_hash = pedersen_hash([clue_id, 1]);

    let result = main(
        suspect, weapon, room, salt,
        1,  // related_suspect = guilty suspect
        1,  // response_value = relevant
        commitment,
        clue_id,
        response_hash,
    );
    assert(result); // clue IS relevant
}

#[test]
fn test_clue_unrelated_suspect() {
    // Clue related to suspect 3 (not guilty), response_value = 0
    let suspect: Field = 1;
    let weapon: Field = 1;
    let room: Field = 1;
    let salt: Field = 42;
    let clue_id: Field = 201;

    let commitment = pedersen_hash([suspect, weapon, room, salt]);
    let response_hash = pedersen_hash([clue_id, 0]);

    let result = main(
        suspect, weapon, room, salt,
        3,  // related_suspect = not the guilty one
        0,  // response_value = not relevant
        commitment,
        clue_id,
        response_hash,
    );
    assert(!result); // clue is NOT relevant
}

#[test]
fn test_clue_no_suspect_link() {
    // Clue with no suspect link (related_suspect = 0)
    let suspect: Field = 1;
    let weapon: Field = 1;
    let room: Field = 1;
    let salt: Field = 42;
    let clue_id: Field = 301;

    let commitment = pedersen_hash([suspect, weapon, room, salt]);
    let response_hash = pedersen_hash([clue_id, 0]);

    let result = main(
        suspect, weapon, room, salt,
        0,  // no suspect link
        0,  // response_value = not relevant
        commitment,
        clue_id,
        response_hash,
    );
    assert(!result); // neutral clue
}

#[test(should_fail)]
fn test_lying_about_relevant_clue() {
    // Prover claims clue is NOT relevant, but it IS (related to guilty suspect)
    let suspect: Field = 1;
    let weapon: Field = 1;
    let room: Field = 1;
    let salt: Field = 42;
    let clue_id: Field = 101;

    let commitment = pedersen_hash([suspect, weapon, room, salt]);
    // Liar computes hash with response_value=0 (claiming not relevant)
    let fake_response_hash = pedersen_hash([clue_id, 0]);

    let _ = main(
        suspect, weapon, room, salt,
        1,  // related_suspect = guilty suspect
        0,  // LYING: claiming not relevant when it is
        commitment,
        clue_id,
        fake_response_hash,
    );
}

#[test(should_fail)]
fn test_lying_about_irrelevant_clue() {
    // Prover claims clue IS relevant, but it is NOT
    let suspect: Field = 1;
    let weapon: Field = 1;
    let room: Field = 1;
    let salt: Field = 42;
    let clue_id: Field = 201;

    let commitment = pedersen_hash([suspect, weapon, room, salt]);
    let fake_response_hash = pedersen_hash([clue_id, 1]);

    let _ = main(
        suspect, weapon, room, salt,
        3,  // related_suspect = NOT the guilty suspect
        1,  // LYING: claiming relevant when it is not
        commitment,
        clue_id,
        fake_response_hash,
    );
}

#[test(should_fail)]
fn test_invalid_commitment_fails() {
    let fake_commitment: Field = 99999;
    let clue_id: Field = 101;
    let response_hash = pedersen_hash([clue_id, 1]);

    let _ = main(
        1, 1, 1, 42,
        1, 1,
        fake_commitment,
        clue_id,
        response_hash,
    );
}

#[test(should_fail)]
fn test_tampered_response_hash_fails() {
    let suspect: Field = 1;
    let weapon: Field = 1;
    let room: Field = 1;
    let salt: Field = 42;
    let clue_id: Field = 101;

    let commitment = pedersen_hash([suspect, weapon, room, salt]);
    // Response hash computed with wrong clue_id
    let tampered_hash = pedersen_hash([999, 1]);

    let _ = main(
        suspect, weapon, room, salt,
        1, 1,
        commitment,
        clue_id,
        tampered_hash,
    );
}

#[test]
fn test_different_solutions_different_commitments() {
    let commitment_a = pedersen_hash([1, 1, 1, 100]);
    let commitment_b = pedersen_hash([2, 1, 1, 100]);
    assert(commitment_a != commitment_b);
}

#[test]
fn test_realistic_meridian_manor() {
    // The Meridian Manor Incident: Victor (1), poison_vial (1), bedroom (1)
    let suspect: Field = 1;
    let weapon: Field = 1;
    let room: Field = 1;
    let salt: Field = 0xDEADBEEF;

    let commitment = pedersen_hash([suspect, weapon, room, salt]);

    // Clue: perfume_bottle (id=1) related to victor (1) -- guilty suspect
    let clue_perfume: Field = 1;
    let response_hash_perfume = pedersen_hash([clue_perfume, 1]);
    let relevant = main(
        suspect, weapon, room, salt,
        1, 1,  // related to victor, relevant
        commitment, clue_perfume, response_hash_perfume,
    );
    assert(relevant);

    // Clue: phone_records (id=5) related to marcus (3) -- not guilty
    let clue_phone: Field = 5;
    let response_hash_phone = pedersen_hash([clue_phone, 0]);
    let not_relevant = main(
        suspect, weapon, room, salt,
        3, 0,  // related to marcus, not relevant
        commitment, clue_phone, response_hash_phone,
    );
    assert(!not_relevant);
}

#[test]
fn test_all_key_evidence_clues() {
    // Verify all key evidence clues in Meridian Manor
    let suspect: Field = 1; // Victor
    let weapon: Field = 1;
    let room: Field = 1;
    let salt: Field = 777;

    let commitment = pedersen_hash([suspect, weapon, room, salt]);

    // perfume_bottle (clue 1): related to victor (1) = guilty -> relevant
    let h1 = pedersen_hash([1, 1]);
    let r1 = main(suspect, weapon, room, salt, 1, 1, commitment, 1, h1);
    assert(r1);

    // insurance_docs (clue 4): related to victor (1) = guilty -> relevant
    let h4 = pedersen_hash([4, 1]);
    let r4 = main(suspect, weapon, room, salt, 1, 1, commitment, 4, h4);
    assert(r4);

    // crumpled_note (clue 5): related to victor (1) = guilty -> relevant
    let h5 = pedersen_hash([5, 1]);
    let r5 = main(suspect, weapon, room, salt, 1, 1, commitment, 5, h5);
    assert(r5);

    // phone_records (clue 6): related to marcus (3) = not guilty -> not relevant
    let h6 = pedersen_hash([6, 0]);
    let r6 = main(suspect, weapon, room, salt, 3, 0, commitment, 6, h6);
    assert(!r6);

    // camera_photos (clue 9): related to thomas (5) = not guilty -> not relevant
    let h9 = pedersen_hash([9, 0]);
    let r9 = main(suspect, weapon, room, salt, 5, 0, commitment, 9, h9);
    assert(!r9);
}
