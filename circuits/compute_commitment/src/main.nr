// Helper circuit: computes Poseidon2 hash of [suspect, weapon, room, salt]
// and returns it as a public output. Used to generate commitment values
// for the accusation circuit and on-chain storage.

/// Poseidon2 sponge hash for exactly 4 Field elements.
/// Matches Noir stdlib Poseidon2::hash([a,b,c,d], 4) internal implementation.
fn poseidon2_hash_4(input: [Field; 4]) -> Field {
    let two_pow_64: Field = 18446744073709551616;
    let iv: Field = 4 * two_pow_64;

    let mut state: [Field; 4] = [iv, 0, 0, 0];

    state[0] += input[0];
    state[1] += input[1];
    state[2] += input[2];
    state = std::hash::poseidon2_permutation(state, 4);

    state[0] += input[3];
    state[1] += 1;
    state = std::hash::poseidon2_permutation(state, 4);

    state[0]
}

fn main(
    suspect: Field,
    weapon: Field,
    room: Field,
    salt: Field,
) -> pub Field {
    poseidon2_hash_4([suspect, weapon, room, salt])
}
