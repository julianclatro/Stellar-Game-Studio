use std::hash::pedersen_hash;

// Helper circuit: computes pedersen_hash([suspect, weapon, room, salt])
// and returns it as a public output. Used to generate commitment values
// for the accusation circuit and on-chain storage.
fn main(
    suspect: Field,
    weapon: Field,
    room: Field,
    salt: Field,
) -> pub Field {
    pedersen_hash([suspect, weapon, room, salt])
}
