#![cfg(test)]

use crate::{Error, ZkSeekContract, ZkSeekContractClient};
use soroban_sdk::testutils::{Address as _, Ledger as _, LedgerInfo};
use soroban_sdk::{contract, contractimpl, Address, Bytes, BytesN, Env};

// ============================================================================
// Mock GameHub
// ============================================================================

#[contract]
pub struct MockGameHub;

#[contractimpl]
impl MockGameHub {
    pub fn start_game(
        _env: Env,
        _game_id: Address,
        _session_id: u32,
        _player1: Address,
        _player2: Address,
        _player1_points: i128,
        _player2_points: i128,
    ) {
    }

    pub fn end_game(_env: Env, _session_id: u32, _player1_won: bool) {}

    pub fn add_game(_env: Env, _game_address: Address) {}
}

// ============================================================================
// Test Helpers
// ============================================================================

fn setup_test() -> (
    Env,
    ZkSeekContractClient<'static>,
    Address, // admin
    Address, // player1
    Address, // player2
) {
    let env = Env::default();
    env.mock_all_auths();

    env.ledger().set(LedgerInfo {
        timestamp: 1441065600,
        protocol_version: 25,
        sequence_number: 100,
        network_id: Default::default(),
        base_reserve: 10,
        min_temp_entry_ttl: u32::MAX / 2,
        min_persistent_entry_ttl: u32::MAX / 2,
        max_entry_ttl: u32::MAX / 2,
    });

    let hub_addr = env.register(MockGameHub, ());
    let admin = Address::generate(&env);

    let contract_id = env.register(ZkSeekContract, (&admin, &hub_addr));
    let client = ZkSeekContractClient::new(&env, &contract_id);

    let player1 = Address::generate(&env);
    let player2 = Address::generate(&env);

    (env, client, admin, player1, player2)
}

fn make_commitment(env: &Env, x: u32, y: u32, salt: &BytesN<32>, player: &Address) -> BytesN<32> {
    let mut data = Bytes::new(env);
    data.append(&Bytes::from_array(env, &x.to_be_bytes()));
    data.append(&Bytes::from_array(env, &y.to_be_bytes()));
    data.append(&Bytes::from_slice(env, salt.to_array().as_slice()));
    data.append(&player.to_string().to_bytes());
    let hash = env.crypto().keccak256(&data);
    BytesN::from_array(env, &hash.to_array())
}

fn make_target_commitment(env: &Env, x: u32, y: u32, salt: &BytesN<32>) -> BytesN<32> {
    let mut data = Bytes::new(env);
    data.append(&Bytes::from_array(env, &x.to_be_bytes()));
    data.append(&Bytes::from_array(env, &y.to_be_bytes()));
    data.append(&Bytes::from_slice(env, salt.to_array().as_slice()));
    let hash = env.crypto().keccak256(&data);
    BytesN::from_array(env, &hash.to_array())
}

fn random_salt(env: &Env) -> BytesN<32> {
    BytesN::from_array(env, &[0xAB; 32])
}

fn random_salt_2(env: &Env) -> BytesN<32> {
    BytesN::from_array(env, &[0xCD; 32])
}

fn scene_salt(env: &Env) -> BytesN<32> {
    BytesN::from_array(env, &[0xEF; 32])
}

fn set_ledger_seq(env: &Env, seq: u32) {
    env.ledger().set(LedgerInfo {
        timestamp: 1441065600,
        protocol_version: 25,
        sequence_number: seq,
        network_id: Default::default(),
        base_reserve: 10,
        min_temp_entry_ttl: u32::MAX / 2,
        min_persistent_entry_ttl: u32::MAX / 2,
        max_entry_ttl: u32::MAX / 2,
    });
}

fn assert_zk_seek_error<T, E>(
    result: &Result<Result<T, E>, Result<Error, soroban_sdk::InvokeError>>,
    expected_error: Error,
) {
    match result {
        Err(Ok(actual_error)) => {
            assert_eq!(
                *actual_error, expected_error,
                "Expected {:?} (code {}), got {:?} (code {})",
                expected_error, expected_error as u32, actual_error, *actual_error as u32
            );
        }
        Err(Err(_)) => panic!(
            "Expected {:?} (code {}), got invocation error",
            expected_error, expected_error as u32
        ),
        Ok(Err(_)) => panic!(
            "Expected {:?} (code {}), got conversion error",
            expected_error, expected_error as u32
        ),
        Ok(Ok(_)) => panic!(
            "Expected {:?} (code {}), but succeeded",
            expected_error, expected_error as u32
        ),
    }
}

#[test]
fn test_full_game_flow() {
    let (env, client, _admin, player1, player2) = setup_test();

    let target_x: u32 = 300;
    let target_y: u32 = 450;
    let s_salt = scene_salt(&env);
    let target_comm = make_target_commitment(&env, target_x, target_y, &s_salt);

    client.create_scene(&1u32, &target_comm, &50u32);

    let session_id = 42u32;
    let points: i128 = 100_0000000;
    client.start_game(&session_id, &player1, &player2, &points, &points, &1u32);

    let game = client.get_game(&session_id);
    assert_eq!(game.scene_id, 1);
    assert!(game.player1_commitment.is_none());
    assert!(game.winner.is_none());

    let salt1 = random_salt(&env);
    let comm1 = make_commitment(&env, 305, 448, &salt1, &player1);
    set_ledger_seq(&env, 110);
    client.submit_commitment(&session_id, &player1, &comm1);

    let salt2 = random_salt_2(&env);
    let comm2 = make_commitment(&env, 310, 455, &salt2, &player2);
    set_ledger_seq(&env, 120);
    client.submit_commitment(&session_id, &player2, &comm2);

    client.reveal(&session_id, &player1, &305u32, &448u32, &salt1);
    client.reveal(&session_id, &player2, &310u32, &455u32, &salt2);

    let winner = client.resolve_game(&session_id, &target_x, &target_y, &s_salt);
    assert_eq!(winner, player1);

    let final_game = client.get_game(&session_id);
    assert_eq!(final_game.winner, Some(player1));
}

#[test]
fn test_commitment_mismatch() {
    let (env, client, _admin, player1, player2) = setup_test();

    let s_salt = scene_salt(&env);
    let target_comm = make_target_commitment(&env, 300, 450, &s_salt);
    client.create_scene(&1u32, &target_comm, &50u32);

    client.start_game(&1u32, &player1, &player2, &100, &100, &1u32);

    let salt1 = random_salt(&env);
    let comm1 = make_commitment(&env, 305, 448, &salt1, &player1);
    client.submit_commitment(&1u32, &player1, &comm1);

    let salt2 = random_salt_2(&env);
    let comm2 = make_commitment(&env, 310, 455, &salt2, &player2);
    client.submit_commitment(&1u32, &player2, &comm2);

    let result = client.try_reveal(&1u32, &player1, &999u32, &999u32, &salt1);
    assert_zk_seek_error(&result, Error::CommitmentMismatch);
}

#[test]
fn test_cannot_commit_twice() {
    let (env, client, _admin, player1, player2) = setup_test();

    let s_salt = scene_salt(&env);
    let target_comm = make_target_commitment(&env, 300, 450, &s_salt);
    client.create_scene(&1u32, &target_comm, &50u32);

    client.start_game(&1u32, &player1, &player2, &100, &100, &1u32);

    let salt1 = random_salt(&env);
    let comm1 = make_commitment(&env, 305, 448, &salt1, &player1);
    client.submit_commitment(&1u32, &player1, &comm1);

    let comm1b = make_commitment(&env, 100, 100, &salt1, &player1);
    let result = client.try_submit_commitment(&1u32, &player1, &comm1b);
    assert_zk_seek_error(&result, Error::AlreadyCommitted);
}

#[test]
fn test_cannot_reveal_before_both_commit() {
    let (env, client, _admin, player1, player2) = setup_test();

    let s_salt = scene_salt(&env);
    let target_comm = make_target_commitment(&env, 300, 450, &s_salt);
    client.create_scene(&1u32, &target_comm, &50u32);

    client.start_game(&1u32, &player1, &player2, &100, &100, &1u32);

    let salt1 = random_salt(&env);
    let comm1 = make_commitment(&env, 305, 448, &salt1, &player1);
    client.submit_commitment(&1u32, &player1, &comm1);

    let result = client.try_reveal(&1u32, &player1, &305u32, &448u32, &salt1);
    assert_zk_seek_error(&result, Error::NotAllCommitted);
}

#[test]
fn test_earlier_commit_breaks_tie() {
    let (env, client, _admin, player1, player2) = setup_test();

    let s_salt = scene_salt(&env);
    let target_comm = make_target_commitment(&env, 100, 100, &s_salt);
    client.create_scene(&1u32, &target_comm, &50u32);

    client.start_game(&1u32, &player1, &player2, &100, &100, &1u32);

    let salt1 = random_salt(&env);
    let comm1 = make_commitment(&env, 110, 100, &salt1, &player1);
    set_ledger_seq(&env, 200);
    client.submit_commitment(&1u32, &player1, &comm1);

    let salt2 = random_salt_2(&env);
    let comm2 = make_commitment(&env, 110, 100, &salt2, &player2);
    set_ledger_seq(&env, 300);
    client.submit_commitment(&1u32, &player2, &comm2);

    client.reveal(&1u32, &player1, &110u32, &100u32, &salt1);
    client.reveal(&1u32, &player2, &110u32, &100u32, &salt2);

    let winner = client.resolve_game(&1u32, &100u32, &100u32, &s_salt);
    assert_eq!(winner, player1, "Earlier commit should break tie");
}

#[test]
fn test_scene_not_found() {
    let (_env, client, _admin, player1, player2) = setup_test();

    let result = client.try_start_game(&1u32, &player1, &player2, &100, &100, &999u32);
    assert_zk_seek_error(&result, Error::SceneNotFound);
}

#[test]
#[should_panic(expected = "Cannot play against yourself")]
fn test_self_play_rejected() {
    let (env, client, _admin, player1, _player2) = setup_test();

    let s_salt = scene_salt(&env);
    let target_comm = make_target_commitment(&env, 300, 450, &s_salt);
    client.create_scene(&1u32, &target_comm, &50u32);

    client.start_game(&1u32, &player1, &player1, &100, &100, &1u32);
}
