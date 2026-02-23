#![cfg(test)]

use crate::{Error, GameStatus, ZkDetectiveContract, ZkDetectiveContractClient};
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
    ZkDetectiveContractClient<'static>,
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

    let contract_id = env.register(ZkDetectiveContract, (&admin, &hub_addr));
    let client = ZkDetectiveContractClient::new(&env, &contract_id);

    let player1 = Address::generate(&env);
    let player2 = Address::generate(&env);

    (env, client, admin, player1, player2)
}

/// Compute commitment matching the contract's keccak256(suspect || weapon || room || salt)
fn make_commitment(
    env: &Env,
    suspect_id: u32,
    weapon_id: u32,
    room_id: u32,
    salt: &BytesN<32>,
) -> BytesN<32> {
    let mut data = Bytes::new(env);
    data.append(&Bytes::from_array(env, &suspect_id.to_be_bytes()));
    data.append(&Bytes::from_array(env, &weapon_id.to_be_bytes()));
    data.append(&Bytes::from_array(env, &room_id.to_be_bytes()));
    data.append(&Bytes::from_slice(env, salt.to_array().as_slice()));
    let hash = env.crypto().keccak256(&data);
    BytesN::from_array(env, &hash.to_array())
}

fn case_salt(env: &Env) -> BytesN<32> {
    BytesN::from_array(env, &[0xAB; 32])
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

fn assert_detective_error<T, E>(
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

/// Setup a test with a case already created.
/// Solution: suspect=1 (victor), weapon=1 (poison_vial), room=1 (bedroom)
fn setup_with_case() -> (
    Env,
    ZkDetectiveContractClient<'static>,
    Address,
    Address,
    Address,
    BytesN<32>,
) {
    let (env, client, admin, player1, player2) = setup_test();
    let salt = case_salt(&env);
    let commitment = make_commitment(&env, 1, 1, 1, &salt);
    client.create_case(&1u32, &commitment);
    (env, client, admin, player1, player2, salt)
}

/// Setup a test with case + active game session.
fn setup_with_game() -> (
    Env,
    ZkDetectiveContractClient<'static>,
    Address,
    Address,
    Address,
    BytesN<32>,
) {
    let (env, client, admin, player1, player2, salt) = setup_with_case();
    let points: i128 = 100_0000000;
    client.start_game(&1u32, &player1, &player2, &points, &points, &1u32);
    (env, client, admin, player1, player2, salt)
}

// ============================================================================
// Constructor Tests
// ============================================================================

#[test]
fn test_constructor_sets_admin() {
    let (_env, client, admin, _p1, _p2) = setup_test();
    assert_eq!(client.get_admin(), admin);
}

#[test]
fn test_constructor_sets_hub() {
    let (env, client, _admin, _p1, _p2) = setup_test();
    // Hub address should be set (we can't check the exact value easily,
    // but get_hub should not panic)
    let _hub = client.get_hub();
}

// ============================================================================
// Case Management Tests
// ============================================================================

#[test]
fn test_create_case() {
    let (env, client, _admin, _p1, _p2) = setup_test();
    let salt = case_salt(&env);
    let commitment = make_commitment(&env, 1, 1, 1, &salt);
    client.create_case(&1u32, &commitment);

    let stored = client.get_case(&1u32);
    assert_eq!(stored, commitment);
}

#[test]
fn test_create_multiple_cases() {
    let (env, client, _admin, _p1, _p2) = setup_test();
    let salt = case_salt(&env);

    let comm1 = make_commitment(&env, 1, 1, 1, &salt);
    let comm2 = make_commitment(&env, 2, 3, 4, &salt);

    client.create_case(&1u32, &comm1);
    client.create_case(&2u32, &comm2);

    assert_eq!(client.get_case(&1u32), comm1);
    assert_eq!(client.get_case(&2u32), comm2);
}

#[test]
fn test_create_case_duplicate_rejected() {
    let (env, client, _admin, _p1, _p2) = setup_test();
    let salt = case_salt(&env);
    let commitment = make_commitment(&env, 1, 1, 1, &salt);

    client.create_case(&1u32, &commitment);

    let result = client.try_create_case(&1u32, &commitment);
    assert_detective_error(&result, Error::CaseAlreadyExists);
}

#[test]
fn test_get_case_not_found() {
    let (_env, client, _admin, _p1, _p2) = setup_test();
    let result = client.try_get_case(&999u32);
    assert_detective_error(&result, Error::CaseNotFound);
}

// ============================================================================
// Start Game Tests
// ============================================================================

#[test]
fn test_start_game() {
    let (_env, client, _admin, player1, player2, _salt) = setup_with_case();
    let points: i128 = 100_0000000;

    client.start_game(&1u32, &player1, &player2, &points, &points, &1u32);

    let game = client.get_game(&1u32);
    assert_eq!(game.session_id, 1);
    assert_eq!(game.case_id, 1);
    assert_eq!(game.player1, player1);
    assert_eq!(game.player2, player2);
    assert_eq!(game.start_ledger, 100);
    assert_eq!(game.status, GameStatus::Active);
    assert_eq!(game.wrong_accusations, 0);
    assert_eq!(game.clues_inspected, 0);
    assert_eq!(game.rooms_visited, 0);
    assert!(game.winner.is_none());
}

#[test]
fn test_start_game_case_not_found() {
    let (_env, client, _admin, player1, player2) = setup_test();
    let result = client.try_start_game(&1u32, &player1, &player2, &100, &100, &999u32);
    assert_detective_error(&result, Error::CaseNotFound);
}

#[test]
fn test_start_game_duplicate_session() {
    let (_env, client, _admin, player1, player2, _salt) = setup_with_case();
    let points: i128 = 100;

    client.start_game(&1u32, &player1, &player2, &points, &points, &1u32);

    let result = client.try_start_game(&1u32, &player1, &player2, &points, &points, &1u32);
    assert_detective_error(&result, Error::SessionAlreadyExists);
}

// ============================================================================
// Update Progress Tests
// ============================================================================

#[test]
fn test_update_progress() {
    let (_env, client, _admin, player1, _player2, _salt) = setup_with_game();

    client.update_progress(&1u32, &player1, &5u32, &3u32);

    let game = client.get_game(&1u32);
    assert_eq!(game.clues_inspected, 5);
    assert_eq!(game.rooms_visited, 3);
}

#[test]
fn test_update_progress_not_player() {
    let (env, client, _admin, _player1, _player2, _salt) = setup_with_game();

    let outsider = Address::generate(&env);
    let result = client.try_update_progress(&1u32, &outsider, &5u32, &3u32);
    assert_detective_error(&result, Error::NotPlayer);
}

#[test]
fn test_update_progress_game_not_active() {
    let (_env, client, _admin, player1, _player2, salt) = setup_with_game();

    // Solve the game first
    client.accuse(&1u32, &player1, &1u32, &1u32, &1u32, &salt);

    let result = client.try_update_progress(&1u32, &player1, &5u32, &3u32);
    assert_detective_error(&result, Error::GameNotActive);
}

// ============================================================================
// Accusation Tests
// ============================================================================

#[test]
fn test_correct_accusation() {
    let (_env, client, _admin, player1, _player2, salt) = setup_with_game();

    // Correct: suspect=1, weapon=1, room=1
    let result = client.accuse(&1u32, &player1, &1u32, &1u32, &1u32, &salt);
    assert!(result);

    let game = client.get_game(&1u32);
    assert_eq!(game.status, GameStatus::Solved);
    assert_eq!(game.winner, Some(player1));
    assert_eq!(game.wrong_accusations, 0);
}

#[test]
fn test_wrong_accusation() {
    let (env, client, _admin, player1, _player2, _salt) = setup_with_game();

    // Wrong accusation with a different salt (will produce different hash)
    let wrong_salt = BytesN::from_array(&env, &[0xFF; 32]);
    let result = client.accuse(&1u32, &player1, &2u32, &3u32, &4u32, &wrong_salt);
    assert!(!result);

    let game = client.get_game(&1u32);
    assert_eq!(game.status, GameStatus::Active);
    assert_eq!(game.wrong_accusations, 1);
    assert!(game.winner.is_none());
}

#[test]
fn test_multiple_wrong_accusations() {
    let (env, client, _admin, player1, _player2, _salt) = setup_with_game();

    let wrong_salt = BytesN::from_array(&env, &[0xFF; 32]);

    // Three wrong accusations
    client.accuse(&1u32, &player1, &2u32, &1u32, &1u32, &wrong_salt);
    client.accuse(&1u32, &player1, &1u32, &2u32, &1u32, &wrong_salt);
    client.accuse(&1u32, &player1, &1u32, &1u32, &2u32, &wrong_salt);

    let game = client.get_game(&1u32);
    assert_eq!(game.wrong_accusations, 3);
    assert_eq!(game.status, GameStatus::Active);
}

#[test]
fn test_correct_after_wrong() {
    let (env, client, _admin, player1, _player2, salt) = setup_with_game();

    let wrong_salt = BytesN::from_array(&env, &[0xFF; 32]);
    client.accuse(&1u32, &player1, &9u32, &5u32, &5u32, &wrong_salt);

    // Now correct
    let result = client.accuse(&1u32, &player1, &1u32, &1u32, &1u32, &salt);
    assert!(result);

    let game = client.get_game(&1u32);
    assert_eq!(game.status, GameStatus::Solved);
    assert_eq!(game.wrong_accusations, 1);
}

#[test]
fn test_accuse_not_player() {
    let (env, client, _admin, _player1, _player2, salt) = setup_with_game();

    let outsider = Address::generate(&env);
    let result = client.try_accuse(&1u32, &outsider, &1u32, &1u32, &1u32, &salt);
    assert_detective_error(&result, Error::NotPlayer);
}

#[test]
fn test_accuse_game_already_solved() {
    let (_env, client, _admin, player1, player2, salt) = setup_with_game();

    // Player 1 solves it
    client.accuse(&1u32, &player1, &1u32, &1u32, &1u32, &salt);

    // Player 2 tries to accuse — game already ended
    let result = client.try_accuse(&1u32, &player2, &1u32, &1u32, &1u32, &salt);
    assert_detective_error(&result, Error::GameNotActive);
}

#[test]
fn test_accuse_invalid_suspect_zero() {
    let (_env, client, _admin, player1, _player2, salt) = setup_with_game();

    let result = client.try_accuse(&1u32, &player1, &0u32, &1u32, &1u32, &salt);
    assert_detective_error(&result, Error::InvalidAccusationId);
}

#[test]
fn test_accuse_invalid_suspect_too_high() {
    let (_env, client, _admin, player1, _player2, salt) = setup_with_game();

    let result = client.try_accuse(&1u32, &player1, &10u32, &1u32, &1u32, &salt);
    assert_detective_error(&result, Error::InvalidAccusationId);
}

#[test]
fn test_accuse_invalid_weapon_zero() {
    let (_env, client, _admin, player1, _player2, salt) = setup_with_game();

    let result = client.try_accuse(&1u32, &player1, &1u32, &0u32, &1u32, &salt);
    assert_detective_error(&result, Error::InvalidAccusationId);
}

#[test]
fn test_accuse_invalid_weapon_too_high() {
    let (_env, client, _admin, player1, _player2, salt) = setup_with_game();

    let result = client.try_accuse(&1u32, &player1, &1u32, &6u32, &1u32, &salt);
    assert_detective_error(&result, Error::InvalidAccusationId);
}

#[test]
fn test_accuse_invalid_room_zero() {
    let (_env, client, _admin, player1, _player2, salt) = setup_with_game();

    let result = client.try_accuse(&1u32, &player1, &1u32, &1u32, &0u32, &salt);
    assert_detective_error(&result, Error::InvalidAccusationId);
}

#[test]
fn test_accuse_invalid_room_too_high() {
    let (_env, client, _admin, player1, _player2, salt) = setup_with_game();

    let result = client.try_accuse(&1u32, &player1, &1u32, &1u32, &6u32, &salt);
    assert_detective_error(&result, Error::InvalidAccusationId);
}

#[test]
fn test_accuse_game_not_found() {
    let (env, client, _admin, player1, _player2) = setup_test();
    let salt = case_salt(&env);
    let result = client.try_accuse(&999u32, &player1, &1u32, &1u32, &1u32, &salt);
    assert_detective_error(&result, Error::GameNotFound);
}

// ============================================================================
// Abandon Game Tests
// ============================================================================

#[test]
fn test_abandon_game() {
    let (_env, client, _admin, _player1, _player2, _salt) = setup_with_game();

    client.abandon_game(&1u32);

    let game = client.get_game(&1u32);
    assert_eq!(game.status, GameStatus::Abandoned);
    assert!(game.winner.is_none());
}

#[test]
fn test_abandon_already_ended() {
    let (_env, client, _admin, player1, _player2, salt) = setup_with_game();

    // Solve it first
    client.accuse(&1u32, &player1, &1u32, &1u32, &1u32, &salt);

    let result = client.try_abandon_game(&1u32);
    assert_detective_error(&result, Error::GameAlreadyEnded);
}

#[test]
fn test_accuse_after_abandon() {
    let (_env, client, _admin, player1, _player2, salt) = setup_with_game();

    client.abandon_game(&1u32);

    let result = client.try_accuse(&1u32, &player1, &1u32, &1u32, &1u32, &salt);
    assert_detective_error(&result, Error::GameNotActive);
}

// ============================================================================
// Player Stats / Leaderboard Tests
// ============================================================================

#[test]
fn test_player_stats_default() {
    let (_env, client, _admin, player1, _player2) = setup_test();

    let stats = client.get_player_stats(&player1);
    assert_eq!(stats.best_score, 0);
    assert_eq!(stats.cases_solved, 0);
    assert_eq!(stats.total_games, 0);
}

#[test]
fn test_player_stats_after_solve() {
    let (_env, client, _admin, player1, _player2, salt) = setup_with_game();

    client.accuse(&1u32, &player1, &1u32, &1u32, &1u32, &salt);

    let stats = client.get_player_stats(&player1);
    assert_eq!(stats.cases_solved, 1);
    assert_eq!(stats.total_games, 1);
    assert!(stats.best_score > 0);
}

#[test]
fn test_player_stats_score_with_wrong_accusations() {
    let (env, client, _admin, player1, _player2, salt) = setup_with_game();

    // Two wrong accusations first
    let wrong_salt = BytesN::from_array(&env, &[0xFF; 32]);
    client.accuse(&1u32, &player1, &2u32, &1u32, &1u32, &wrong_salt);
    client.accuse(&1u32, &player1, &3u32, &1u32, &1u32, &wrong_salt);

    // Then solve
    client.accuse(&1u32, &player1, &1u32, &1u32, &1u32, &salt);

    let stats_with_wrongs = client.get_player_stats(&player1);

    // Score should be less than a clean solve (penalty of 500*2 = 1000)
    // Base 10000 - 0 time penalty - 1000 accusation penalty = ~9000 range
    assert!(stats_with_wrongs.best_score < 10000);
}

#[test]
fn test_player_stats_score_with_time() {
    let (_env, client, _admin, player1, player2, salt) = setup_with_case();

    // Start game at ledger 100
    let points: i128 = 100;
    client.start_game(&1u32, &player1, &player2, &points, &points, &1u32);

    // Advance ledger by 1000 before solving
    set_ledger_seq(&_env, 1100);
    client.accuse(&1u32, &player1, &1u32, &1u32, &1u32, &salt);

    let stats = client.get_player_stats(&player1);
    // Base 10000 - 1000 time penalty = ~9000 range
    assert!(stats.best_score < 10000);
    assert!(stats.best_score > 0);
}

#[test]
fn test_player_stats_exploration_bonus() {
    let (_env, client, _admin, player1, _player2, salt) = setup_with_game();

    // Update progress before solving
    client.update_progress(&1u32, &player1, &8u32, &4u32);

    client.accuse(&1u32, &player1, &1u32, &1u32, &1u32, &salt);

    let stats = client.get_player_stats(&player1);
    // Base 10000 + (8*100 + 4*50) exploration bonus = 11000
    // Should be > base because of exploration
    assert!(stats.best_score > 10000);
}

#[test]
fn test_player_stats_best_score_updates() {
    let (env, client, admin, player1, player2, _salt) = setup_with_case();

    let salt = case_salt(&env);

    // First game: solve with 2 wrong accusations
    let points: i128 = 100;
    client.start_game(&1u32, &player1, &player2, &points, &points, &1u32);
    let wrong_salt = BytesN::from_array(&env, &[0xFF; 32]);
    client.accuse(&1u32, &player1, &2u32, &1u32, &1u32, &wrong_salt);
    client.accuse(&1u32, &player1, &3u32, &1u32, &1u32, &wrong_salt);
    client.accuse(&1u32, &player1, &1u32, &1u32, &1u32, &salt);

    let first_score = client.get_player_stats(&player1).best_score;

    // Second game: clean solve
    client.start_game(&2u32, &player1, &player2, &points, &points, &1u32);
    client.accuse(&2u32, &player1, &1u32, &1u32, &1u32, &salt);

    let second_score = client.get_player_stats(&player1).best_score;
    let stats = client.get_player_stats(&player1);

    assert!(second_score > first_score, "Clean solve should have higher score");
    assert_eq!(stats.cases_solved, 2);
    assert_eq!(stats.total_games, 2);
}

// ============================================================================
// Admin Tests
// ============================================================================

#[test]
fn test_set_admin() {
    let (env, client, admin, _p1, _p2) = setup_test();
    let new_admin = Address::generate(&env);

    client.set_admin(&new_admin);
    assert_eq!(client.get_admin(), new_admin);
}

#[test]
fn test_set_hub() {
    let (env, client, _admin, _p1, _p2) = setup_test();
    let new_hub = Address::generate(&env);

    client.set_hub(&new_hub);
    assert_eq!(client.get_hub(), new_hub);
}

// ============================================================================
// Full Game Flow Tests
// ============================================================================

#[test]
fn test_full_game_flow() {
    let (env, client, _admin, player1, player2) = setup_test();

    // 1. Create case: victor (1), poison_vial (1), bedroom (1)
    let salt = case_salt(&env);
    let commitment = make_commitment(&env, 1, 1, 1, &salt);
    client.create_case(&1u32, &commitment);

    // 2. Start game
    let points: i128 = 100_0000000;
    client.start_game(&1u32, &player1, &player2, &points, &points, &1u32);

    // 3. Player investigates
    client.update_progress(&1u32, &player1, &6u32, &4u32);

    // 4. Wrong accusation: elena (2), kitchen_knife (2), kitchen (2)
    let wrong_salt = BytesN::from_array(&env, &[0xFF; 32]);
    let wrong = client.accuse(&1u32, &player1, &2u32, &2u32, &2u32, &wrong_salt);
    assert!(!wrong);

    // 5. Correct accusation
    set_ledger_seq(&env, 200);
    let correct = client.accuse(&1u32, &player1, &1u32, &1u32, &1u32, &salt);
    assert!(correct);

    // 6. Verify final state
    let game = client.get_game(&1u32);
    assert_eq!(game.status, GameStatus::Solved);
    assert_eq!(game.winner, Some(player1.clone()));
    assert_eq!(game.wrong_accusations, 1);
    assert_eq!(game.clues_inspected, 6);
    assert_eq!(game.rooms_visited, 4);
    assert_eq!(game.solve_ledger, 200);

    // 7. Verify player stats
    let stats = client.get_player_stats(&player1);
    assert_eq!(stats.cases_solved, 1);
    assert!(stats.best_score > 0);
}

#[test]
fn test_player2_can_solve() {
    let (_env, client, _admin, _player1, player2, salt) = setup_with_game();

    let result = client.accuse(&1u32, &player2, &1u32, &1u32, &1u32, &salt);
    assert!(result);

    let game = client.get_game(&1u32);
    assert_eq!(game.winner, Some(player2.clone()));
    assert_eq!(game.status, GameStatus::Solved);
}

#[test]
fn test_commitment_integrity() {
    let (env, client, _admin, _p1, _p2) = setup_test();

    // Different solutions produce different commitments
    let salt = case_salt(&env);
    let comm_a = make_commitment(&env, 1, 1, 1, &salt);
    let comm_b = make_commitment(&env, 2, 1, 1, &salt);
    let comm_c = make_commitment(&env, 1, 2, 1, &salt);
    let comm_d = make_commitment(&env, 1, 1, 2, &salt);

    assert_ne!(comm_a, comm_b, "Different suspect should produce different hash");
    assert_ne!(comm_a, comm_c, "Different weapon should produce different hash");
    assert_ne!(comm_a, comm_d, "Different room should produce different hash");

    // Same inputs produce same commitment
    let comm_a2 = make_commitment(&env, 1, 1, 1, &salt);
    assert_eq!(comm_a, comm_a2, "Same inputs should produce same hash");
}

// ============================================================================
// ZK Verifier Admin Tests
// ============================================================================

#[test]
fn test_set_verifier() {
    let (env, client, _admin, _p1, _p2) = setup_test();
    let verifier = Address::generate(&env);
    client.set_verifier(&verifier);
    // No panic means success; stored in instance storage
}

#[test]
fn test_set_poseidon_commitment() {
    let (env, client, _admin, _p1, _p2) = setup_test();
    let commitment = BytesN::from_array(&env, &[0x42; 32]);
    client.set_poseidon_commitment(&1u32, &commitment);

    let stored = client.get_poseidon_commitment(&1u32);
    assert_eq!(stored, commitment);
}

#[test]
fn test_get_poseidon_commitment_not_set() {
    let (_env, client, _admin, _p1, _p2) = setup_test();
    let result = client.try_get_poseidon_commitment(&999u32);
    assert_detective_error(&result, Error::PoseidonCommitmentNotSet);
}

// ============================================================================
// accuse_zk Tests
// ============================================================================

#[test]
fn test_accuse_zk_verifier_not_set() {
    let (env, client, _admin, player1, _player2, _salt) = setup_with_game();

    // Without setting verifier, accuse_zk should fail
    let proof = Bytes::from_slice(&env, &[0u8; 32]);
    let inputs = Bytes::from_slice(&env, &[0u8; 32]);

    let result = client.try_accuse_zk(&1u32, &player1, &true, &proof, &inputs);
    assert_detective_error(&result, Error::VerifierNotSet);
}

#[test]
fn test_accuse_zk_not_player() {
    let (env, client, _admin, _player1, _player2, _salt) = setup_with_game();

    let verifier = Address::generate(&env);
    client.set_verifier(&verifier);

    let outsider = Address::generate(&env);
    let proof = Bytes::from_slice(&env, &[0u8; 32]);
    let inputs = Bytes::from_slice(&env, &[0u8; 32]);

    let result = client.try_accuse_zk(&1u32, &outsider, &true, &proof, &inputs);
    assert_detective_error(&result, Error::NotPlayer);
}

#[test]
fn test_accuse_zk_game_not_active() {
    let (_env, client, _admin, player1, _player2, salt) = setup_with_game();

    // Solve via legacy path first
    client.accuse(&1u32, &player1, &1u32, &1u32, &1u32, &salt);

    let verifier = Address::generate(&_env);
    client.set_verifier(&verifier);

    let proof = Bytes::from_slice(&_env, &[0u8; 32]);
    let inputs = Bytes::from_slice(&_env, &[0u8; 32]);

    let result = client.try_accuse_zk(&1u32, &player1, &true, &proof, &inputs);
    assert_detective_error(&result, Error::GameNotActive);
}

#[test]
fn test_legacy_accuse_still_works_with_verifier_set() {
    let (env, client, _admin, player1, _player2, salt) = setup_with_game();

    // Set a verifier address
    let verifier = Address::generate(&env);
    client.set_verifier(&verifier);

    // Legacy accuse should still work independently
    let result = client.accuse(&1u32, &player1, &1u32, &1u32, &1u32, &salt);
    assert!(result);

    let game = client.get_game(&1u32);
    assert_eq!(game.status, GameStatus::Solved);
}
