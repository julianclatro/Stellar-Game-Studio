#![no_std]

//! # ZK Detective — Case Closed on Soroban
//!
//! A competitive deduction game where ZK proofs replace the trusted admin.
//! Players investigate a crime scene, collect clues, interrogate suspects,
//! and make accusations verified against on-chain commitments.
//!
//! **Commitment scheme:** `keccak256(suspect_id || weapon_id || room_id || salt)`
//! The solution is committed on-chain at case creation. Accusations are verified
//! by recomputing the hash — no one needs to reveal the answer.
//!
//! **Future:** Replace hash checks with Noir UltraHonk ZK proof verification
//! once the Soroban verifier dependencies are publicly available.

use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, vec, Address, Bytes,
    BytesN, Env, IntoVal,
};

// ============================================================================
// Game Hub Interface
// ============================================================================

#[contractclient(name = "GameHubClient")]
pub trait GameHub {
    fn start_game(
        env: Env,
        game_id: Address,
        session_id: u32,
        player1: Address,
        player2: Address,
        player1_points: i128,
        player2_points: i128,
    );

    fn end_game(env: Env, session_id: u32, player1_won: bool);
}

// ============================================================================
// Errors
// ============================================================================

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// Game session not found or expired
    GameNotFound = 1,
    /// Case not found
    CaseNotFound = 2,
    /// Player is not part of this game session
    NotPlayer = 3,
    /// Game has already ended (solved or abandoned)
    GameAlreadyEnded = 4,
    /// Game is not in active state
    GameNotActive = 5,
    /// Case already exists with this ID
    CaseAlreadyExists = 6,
    /// Invalid suspect/weapon/room ID (must be 1-9/1-5/1-5)
    InvalidAccusationId = 7,
    /// Session already exists with this ID
    SessionAlreadyExists = 8,
}

// ============================================================================
// Data Types
// ============================================================================

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum GameStatus {
    Active,
    Solved,
    Abandoned,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GameState {
    pub session_id: u32,
    pub case_id: u32,
    pub player1: Address,
    pub player2: Address,
    pub start_ledger: u32,
    pub solve_ledger: u32,
    pub clues_inspected: u32,
    pub rooms_visited: u32,
    pub wrong_accusations: u32,
    pub status: GameStatus,
    pub winner: Option<Address>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PlayerStats {
    pub best_score: i128,
    pub cases_solved: u32,
    pub total_games: u32,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    GameHubAddress,
    Case(u32),
    Game(u32),
    PlayerStats(Address),
}

// ============================================================================
// Constants
// ============================================================================

/// 30 days in ledgers (~5 seconds per ledger)
const GAME_TTL_LEDGERS: u32 = 518_400;

/// Max suspects (1-9), weapons (1-5), rooms (1-5)
const MAX_SUSPECT_ID: u32 = 9;
const MAX_WEAPON_ID: u32 = 5;
const MAX_ROOM_ID: u32 = 5;

// ============================================================================
// Helper Functions
// ============================================================================

/// Compute the case commitment: keccak256(suspect_id || weapon_id || room_id || salt)
/// Matches the TypeScript commitment.ts pattern from F01.
fn compute_commitment(
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

/// Validate accusation IDs are within valid ranges.
fn validate_accusation_ids(suspect_id: u32, weapon_id: u32, room_id: u32) -> Result<(), Error> {
    if suspect_id == 0 || suspect_id > MAX_SUSPECT_ID {
        return Err(Error::InvalidAccusationId);
    }
    if weapon_id == 0 || weapon_id > MAX_WEAPON_ID {
        return Err(Error::InvalidAccusationId);
    }
    if room_id == 0 || room_id > MAX_ROOM_ID {
        return Err(Error::InvalidAccusationId);
    }
    Ok(())
}

// ============================================================================
// Contract
// ============================================================================

#[contract]
pub struct ZkDetectiveContract;

#[contractimpl]
impl ZkDetectiveContract {
    /// Initialize the contract with admin and Game Hub addresses.
    pub fn __constructor(env: Env, admin: Address, game_hub: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::GameHubAddress, &game_hub);
    }

    // ========================================================================
    // Case Management (Admin)
    // ========================================================================

    /// Register a new case with its solution commitment hash.
    /// The commitment is `keccak256(suspect_id || weapon_id || room_id || salt)`.
    /// Admin only.
    pub fn create_case(
        env: Env,
        case_id: u32,
        commitment: BytesN<32>,
    ) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        admin.require_auth();

        let key = DataKey::Case(case_id);
        if env.storage().persistent().has(&key) {
            return Err(Error::CaseAlreadyExists);
        }

        env.storage().persistent().set(&key, &commitment);

        Ok(())
    }

    /// Get the commitment hash for a case.
    pub fn get_case(env: Env, case_id: u32) -> Result<BytesN<32>, Error> {
        let key = DataKey::Case(case_id);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(Error::CaseNotFound)
    }

    // ========================================================================
    // Game Session Lifecycle
    // ========================================================================

    /// Start a new game session. Calls Game Hub `start_game`.
    /// Both players must authorize their point stakes.
    pub fn start_game(
        env: Env,
        session_id: u32,
        player1: Address,
        player2: Address,
        player1_points: i128,
        player2_points: i128,
        case_id: u32,
    ) -> Result<(), Error> {
        // Validate case exists
        let case_key = DataKey::Case(case_id);
        if !env.storage().persistent().has(&case_key) {
            return Err(Error::CaseNotFound);
        }

        // Prevent duplicate session
        let game_key = DataKey::Game(session_id);
        if env.storage().temporary().has(&game_key) {
            return Err(Error::SessionAlreadyExists);
        }

        // Both players authorize
        player1.require_auth_for_args(vec![
            &env,
            session_id.into_val(&env),
            player1_points.into_val(&env),
        ]);
        player2.require_auth_for_args(vec![
            &env,
            session_id.into_val(&env),
            player2_points.into_val(&env),
        ]);

        // Call Game Hub
        let game_hub_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::GameHubAddress)
            .expect("GameHub address not set");
        let game_hub = GameHubClient::new(&env, &game_hub_addr);

        game_hub.start_game(
            &env.current_contract_address(),
            &session_id,
            &player1,
            &player2,
            &player1_points,
            &player2_points,
        );

        // Create game state
        let game = GameState {
            session_id,
            case_id,
            player1,
            player2,
            start_ledger: env.ledger().sequence(),
            solve_ledger: 0,
            clues_inspected: 0,
            rooms_visited: 0,
            wrong_accusations: 0,
            status: GameStatus::Active,
            winner: None,
        };

        env.storage().temporary().set(&game_key, &game);
        env.storage()
            .temporary()
            .extend_ttl(&game_key, GAME_TTL_LEDGERS, GAME_TTL_LEDGERS);

        Ok(())
    }

    /// Record investigation progress (clues inspected, rooms visited).
    /// Called by the frontend to track scoring metrics.
    pub fn update_progress(
        env: Env,
        session_id: u32,
        player: Address,
        clues_inspected: u32,
        rooms_visited: u32,
    ) -> Result<(), Error> {
        player.require_auth();

        let key = DataKey::Game(session_id);
        let mut game: GameState = env
            .storage()
            .temporary()
            .get(&key)
            .ok_or(Error::GameNotFound)?;

        if game.status != GameStatus::Active {
            return Err(Error::GameNotActive);
        }

        if player != game.player1 && player != game.player2 {
            return Err(Error::NotPlayer);
        }

        game.clues_inspected = clues_inspected;
        game.rooms_visited = rooms_visited;

        env.storage().temporary().set(&key, &game);
        env.storage()
            .temporary()
            .extend_ttl(&key, GAME_TTL_LEDGERS, GAME_TTL_LEDGERS);

        Ok(())
    }

    /// Submit an accusation. Verified by recomputing the commitment hash.
    /// Returns true if the accusation is correct (game ends), false otherwise
    /// (wrong_accusations incremented).
    pub fn accuse(
        env: Env,
        session_id: u32,
        player: Address,
        suspect_id: u32,
        weapon_id: u32,
        room_id: u32,
        salt: BytesN<32>,
    ) -> Result<bool, Error> {
        player.require_auth();

        validate_accusation_ids(suspect_id, weapon_id, room_id)?;

        let key = DataKey::Game(session_id);
        let mut game: GameState = env
            .storage()
            .temporary()
            .get(&key)
            .ok_or(Error::GameNotFound)?;

        if game.status != GameStatus::Active {
            return Err(Error::GameNotActive);
        }

        if player != game.player1 && player != game.player2 {
            return Err(Error::NotPlayer);
        }

        // Get the case commitment
        let case_key = DataKey::Case(game.case_id);
        let commitment: BytesN<32> = env
            .storage()
            .persistent()
            .get(&case_key)
            .ok_or(Error::CaseNotFound)?;

        // Compute the accusation hash and compare
        let accusation_hash = compute_commitment(&env, suspect_id, weapon_id, room_id, &salt);

        let is_correct = accusation_hash == commitment;

        if is_correct {
            game.status = GameStatus::Solved;
            game.winner = Some(player.clone());
            game.solve_ledger = env.ledger().sequence();

            // Call Game Hub end_game
            let game_hub_addr: Address = env
                .storage()
                .instance()
                .get(&DataKey::GameHubAddress)
                .expect("GameHub address not set");
            let game_hub = GameHubClient::new(&env, &game_hub_addr);

            let player1_won = player == game.player1;
            game_hub.end_game(&session_id, &player1_won);

            // Update player stats
            Self::update_player_stats(&env, &player, &game);
        } else {
            game.wrong_accusations += 1;
        }

        env.storage().temporary().set(&key, &game);
        env.storage()
            .temporary()
            .extend_ttl(&key, GAME_TTL_LEDGERS, GAME_TTL_LEDGERS);

        Ok(is_correct)
    }

    /// Abandon a game session (timeout, player quits). Admin only.
    pub fn abandon_game(env: Env, session_id: u32) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        admin.require_auth();

        let key = DataKey::Game(session_id);
        let mut game: GameState = env
            .storage()
            .temporary()
            .get(&key)
            .ok_or(Error::GameNotFound)?;

        if game.status != GameStatus::Active {
            return Err(Error::GameAlreadyEnded);
        }

        game.status = GameStatus::Abandoned;

        env.storage().temporary().set(&key, &game);
        env.storage()
            .temporary()
            .extend_ttl(&key, GAME_TTL_LEDGERS, GAME_TTL_LEDGERS);

        Ok(())
    }

    // ========================================================================
    // Queries
    // ========================================================================

    /// Get the current game state.
    pub fn get_game(env: Env, session_id: u32) -> Result<GameState, Error> {
        let key = DataKey::Game(session_id);
        env.storage()
            .temporary()
            .get(&key)
            .ok_or(Error::GameNotFound)
    }

    /// Get player stats from the leaderboard.
    pub fn get_player_stats(env: Env, player: Address) -> PlayerStats {
        let key = DataKey::PlayerStats(player);
        env.storage().persistent().get(&key).unwrap_or(PlayerStats {
            best_score: 0,
            cases_solved: 0,
            total_games: 0,
        })
    }

    /// Get admin address.
    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set")
    }

    /// Set a new admin. Current admin only.
    pub fn set_admin(env: Env, new_admin: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &new_admin);
    }

    /// Get Game Hub address.
    pub fn get_hub(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::GameHubAddress)
            .expect("GameHub address not set")
    }

    /// Set a new Game Hub address. Admin only.
    pub fn set_hub(env: Env, new_hub: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        admin.require_auth();

        env.storage()
            .instance()
            .set(&DataKey::GameHubAddress, &new_hub);
    }

    /// Upgrade contract WASM. Admin only.
    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        admin.require_auth();

        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }

    // ========================================================================
    // Internal Helpers
    // ========================================================================

    /// Compute score for a solved game.
    /// Formula: base_score - time_penalty - accusation_penalty + exploration_bonus
    fn compute_score(game: &GameState) -> i128 {
        let base_score: i128 = 10000;

        // Time penalty: -1 per ledger elapsed (~5s each)
        let time_elapsed = game.solve_ledger.saturating_sub(game.start_ledger);
        let time_penalty = (time_elapsed as i128).min(5000);

        // Wrong accusations: -500 per wrong attempt
        let accusation_penalty = (game.wrong_accusations as i128) * 500;

        // Exploration bonus: +100 per clue, +50 per room
        let exploration_bonus =
            (game.clues_inspected as i128) * 100 + (game.rooms_visited as i128) * 50;

        (base_score - time_penalty - accusation_penalty + exploration_bonus).max(0)
    }

    /// Update player stats after solving a case.
    fn update_player_stats(env: &Env, player: &Address, game: &GameState) {
        let key = DataKey::PlayerStats(player.clone());

        let mut stats: PlayerStats =
            env.storage()
                .persistent()
                .get(&key)
                .unwrap_or(PlayerStats {
                    best_score: 0,
                    cases_solved: 0,
                    total_games: 0,
                });

        let score = Self::compute_score(game);

        stats.cases_solved += 1;
        stats.total_games += 1;
        if score > stats.best_score {
            stats.best_score = score;
        }

        env.storage().persistent().set(&key, &stats);
    }
}

#[cfg(test)]
mod test;
