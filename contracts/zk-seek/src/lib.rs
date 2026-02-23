#![no_std]

//! # ZK Seek — "Proof of Eyes"
//!
//! A two-player visual search game using a commit-reveal scheme.
//! Players find a hidden target in an image and commit a hash of their
//! coordinates. After both commit, they reveal. The admin then resolves
//! the game by revealing the true target (verified against a pre-committed hash).
//!
//! **ZK rationale:** Submitting coordinates publicly would reveal the answer
//! to opponents. Cryptographic commitments let players prove they found the
//! target without leaking coordinates until both have committed.

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
    GameNotFound = 1,
    SceneNotFound = 2,
    SceneInactive = 3,
    NotPlayer = 4,
    AlreadyCommitted = 5,
    NotAllCommitted = 6,
    AlreadyRevealed = 7,
    NotAllRevealed = 8,
    CommitmentMismatch = 9,
    GameAlreadyEnded = 10,
    InvalidTargetReveal = 11,
}

// ============================================================================
// Data Types
// ============================================================================

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Scene {
    pub target_commitment: BytesN<32>, // keccak256(target_x || target_y || scene_salt)
    pub tolerance: u32,                // pixel radius for valid find
    pub active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Game {
    pub scene_id: u32,
    pub player1: Address,
    pub player2: Address,
    pub player1_points: i128,
    pub player2_points: i128,
    // Commit phase
    pub player1_commitment: Option<BytesN<32>>,
    pub player2_commitment: Option<BytesN<32>>,
    pub player1_commit_ledger: Option<u32>,
    pub player2_commit_ledger: Option<u32>,
    // Reveal phase
    pub player1_x: Option<u32>,
    pub player1_y: Option<u32>,
    pub player2_x: Option<u32>,
    pub player2_y: Option<u32>,
    // Resolution
    pub winner: Option<Address>,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    GameHubAddress,
    Scene(u32),
    Game(u32),
}

// ============================================================================
// Constants
// ============================================================================

/// 30 days in ledgers (~5 seconds per ledger)
const GAME_TTL_LEDGERS: u32 = 518_400;

// ============================================================================
// Helper Functions
// ============================================================================

/// Squared Euclidean distance (no floats needed).
fn distance_squared(x1: u32, y1: u32, x2: u32, y2: u32) -> u64 {
    let dx = (x1 as i64) - (x2 as i64);
    let dy = (y1 as i64) - (y2 as i64);
    (dx * dx + dy * dy) as u64
}

/// Check if a point is within the tolerance radius of a target.
fn is_within_tolerance(px: u32, py: u32, tx: u32, ty: u32, tolerance: u32) -> bool {
    distance_squared(px, py, tx, ty) <= (tolerance as u64) * (tolerance as u64)
}

/// Compute the commitment hash: keccak256(x || y || salt || player_address)
fn compute_commitment(env: &Env, x: u32, y: u32, salt: &BytesN<32>, player: &Address) -> BytesN<32> {
    let mut data = Bytes::new(env);
    data.append(&Bytes::from_array(env, &x.to_be_bytes()));
    data.append(&Bytes::from_array(env, &y.to_be_bytes()));
    data.append(&Bytes::from_slice(env, salt.to_array().as_slice()));
    data.append(&player.to_string().to_bytes());
    let hash = env.crypto().keccak256(&data);
    BytesN::from_array(env, &hash.to_array())
}

/// Compute the scene target commitment: keccak256(target_x || target_y || scene_salt)
fn compute_target_commitment(env: &Env, x: u32, y: u32, salt: &BytesN<32>) -> BytesN<32> {
    let mut data = Bytes::new(env);
    data.append(&Bytes::from_array(env, &x.to_be_bytes()));
    data.append(&Bytes::from_array(env, &y.to_be_bytes()));
    data.append(&Bytes::from_slice(env, salt.to_array().as_slice()));
    let hash = env.crypto().keccak256(&data);
    BytesN::from_array(env, &hash.to_array())
}

// ============================================================================
// Contract
// ============================================================================

#[contract]
pub struct ZkSeekContract;

#[contractimpl]
impl ZkSeekContract {
    pub fn __constructor(env: Env, admin: Address, game_hub: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::GameHubAddress, &game_hub);
    }

    pub fn create_scene(
        env: Env,
        scene_id: u32,
        target_commitment: BytesN<32>,
        tolerance: u32,
    ) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        admin.require_auth();

        let scene = Scene {
            target_commitment,
            tolerance,
            active: true,
        };

        let key = DataKey::Scene(scene_id);
        env.storage().persistent().set(&key, &scene);
    }

    pub fn deactivate_scene(env: Env, scene_id: u32) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        admin.require_auth();

        let key = DataKey::Scene(scene_id);
        let mut scene: Scene = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::SceneNotFound)?;

        scene.active = false;
        env.storage().persistent().set(&key, &scene);

        Ok(())
    }

    pub fn start_game(
        env: Env,
        session_id: u32,
        player1: Address,
        player2: Address,
        player1_points: i128,
        player2_points: i128,
        scene_id: u32,
    ) -> Result<(), Error> {
        if player1 == player2 {
            panic!("Cannot play against yourself");
        }

        let scene_key = DataKey::Scene(scene_id);
        let scene: Scene = env
            .storage()
            .persistent()
            .get(&scene_key)
            .ok_or(Error::SceneNotFound)?;

        if !scene.active {
            return Err(Error::SceneInactive);
        }

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

        let game = Game {
            scene_id,
            player1,
            player2,
            player1_points,
            player2_points,
            player1_commitment: None,
            player2_commitment: None,
            player1_commit_ledger: None,
            player2_commit_ledger: None,
            player1_x: None,
            player1_y: None,
            player2_x: None,
            player2_y: None,
            winner: None,
        };

        let game_key = DataKey::Game(session_id);
        env.storage().temporary().set(&game_key, &game);
        env.storage()
            .temporary()
            .extend_ttl(&game_key, GAME_TTL_LEDGERS, GAME_TTL_LEDGERS);

        Ok(())
    }

    pub fn submit_commitment(
        env: Env,
        session_id: u32,
        player: Address,
        commitment: BytesN<32>,
    ) -> Result<(), Error> {
        player.require_auth();

        let key = DataKey::Game(session_id);
        let mut game: Game = env
            .storage()
            .temporary()
            .get(&key)
            .ok_or(Error::GameNotFound)?;

        if game.winner.is_some() {
            return Err(Error::GameAlreadyEnded);
        }

        let ledger_seq = env.ledger().sequence();

        if player == game.player1 {
            if game.player1_commitment.is_some() {
                return Err(Error::AlreadyCommitted);
            }
            game.player1_commitment = Some(commitment);
            game.player1_commit_ledger = Some(ledger_seq);
        } else if player == game.player2 {
            if game.player2_commitment.is_some() {
                return Err(Error::AlreadyCommitted);
            }
            game.player2_commitment = Some(commitment);
            game.player2_commit_ledger = Some(ledger_seq);
        } else {
            return Err(Error::NotPlayer);
        }

        env.storage().temporary().set(&key, &game);
        env.storage()
            .temporary()
            .extend_ttl(&key, GAME_TTL_LEDGERS, GAME_TTL_LEDGERS);

        Ok(())
    }

    pub fn reveal(
        env: Env,
        session_id: u32,
        player: Address,
        x: u32,
        y: u32,
        salt: BytesN<32>,
    ) -> Result<(), Error> {
        player.require_auth();

        let key = DataKey::Game(session_id);
        let mut game: Game = env
            .storage()
            .temporary()
            .get(&key)
            .ok_or(Error::GameNotFound)?;

        if game.winner.is_some() {
            return Err(Error::GameAlreadyEnded);
        }

        if game.player1_commitment.is_none() || game.player2_commitment.is_none() {
            return Err(Error::NotAllCommitted);
        }

        let expected = compute_commitment(&env, x, y, &salt, &player);

        if player == game.player1 {
            if game.player1_x.is_some() {
                return Err(Error::AlreadyRevealed);
            }
            if expected != *game.player1_commitment.as_ref().unwrap() {
                return Err(Error::CommitmentMismatch);
            }
            game.player1_x = Some(x);
            game.player1_y = Some(y);
        } else if player == game.player2 {
            if game.player2_x.is_some() {
                return Err(Error::AlreadyRevealed);
            }
            if expected != *game.player2_commitment.as_ref().unwrap() {
                return Err(Error::CommitmentMismatch);
            }
            game.player2_x = Some(x);
            game.player2_y = Some(y);
        } else {
            return Err(Error::NotPlayer);
        }

        env.storage().temporary().set(&key, &game);
        env.storage()
            .temporary()
            .extend_ttl(&key, GAME_TTL_LEDGERS, GAME_TTL_LEDGERS);

        Ok(())
    }

    pub fn resolve_game(
        env: Env,
        session_id: u32,
        target_x: u32,
        target_y: u32,
        scene_salt: BytesN<32>,
    ) -> Result<Address, Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        admin.require_auth();

        let key = DataKey::Game(session_id);
        let mut game: Game = env
            .storage()
            .temporary()
            .get(&key)
            .ok_or(Error::GameNotFound)?;

        if game.winner.is_some() {
            return Err(Error::GameAlreadyEnded);
        }

        if game.player1_x.is_none()
            || game.player1_y.is_none()
            || game.player2_x.is_none()
            || game.player2_y.is_none()
        {
            return Err(Error::NotAllRevealed);
        }

        let scene_key = DataKey::Scene(game.scene_id);
        let scene: Scene = env
            .storage()
            .persistent()
            .get(&scene_key)
            .ok_or(Error::SceneNotFound)?;

        let target_hash = compute_target_commitment(&env, target_x, target_y, &scene_salt);
        if target_hash != scene.target_commitment {
            return Err(Error::InvalidTargetReveal);
        }

        let p1x = game.player1_x.unwrap();
        let p1y = game.player1_y.unwrap();
        let p2x = game.player2_x.unwrap();
        let p2y = game.player2_y.unwrap();

        let dist1 = distance_squared(p1x, p1y, target_x, target_y);
        let dist2 = distance_squared(p2x, p2y, target_x, target_y);

        let p1_in = is_within_tolerance(p1x, p1y, target_x, target_y, scene.tolerance);
        let p2_in = is_within_tolerance(p2x, p2y, target_x, target_y, scene.tolerance);

        let winner = if p1_in && p2_in {
            if dist1 < dist2 {
                game.player1.clone()
            } else if dist2 < dist1 {
                game.player2.clone()
            } else {
                let l1 = game.player1_commit_ledger.unwrap();
                let l2 = game.player2_commit_ledger.unwrap();
                if l1 <= l2 {
                    game.player1.clone()
                } else {
                    game.player2.clone()
                }
            }
        } else if p1_in {
            game.player1.clone()
        } else if p2_in {
            game.player2.clone()
        } else {
            if dist1 < dist2 {
                game.player1.clone()
            } else if dist2 < dist1 {
                game.player2.clone()
            } else {
                let l1 = game.player1_commit_ledger.unwrap();
                let l2 = game.player2_commit_ledger.unwrap();
                if l1 <= l2 {
                    game.player1.clone()
                } else {
                    game.player2.clone()
                }
            }
        };

        game.winner = Some(winner.clone());
        env.storage().temporary().set(&key, &game);
        env.storage()
            .temporary()
            .extend_ttl(&key, GAME_TTL_LEDGERS, GAME_TTL_LEDGERS);

        let game_hub_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::GameHubAddress)
            .expect("GameHub address not set");
        let game_hub = GameHubClient::new(&env, &game_hub_addr);

        let player1_won = winner == game.player1;
        game_hub.end_game(&session_id, &player1_won);

        Ok(winner)
    }

    pub fn get_game(env: Env, session_id: u32) -> Result<Game, Error> {
        let key = DataKey::Game(session_id);
        env.storage()
            .temporary()
            .get(&key)
            .ok_or(Error::GameNotFound)
    }

    pub fn get_scene(env: Env, scene_id: u32) -> Result<Scene, Error> {
        let key = DataKey::Scene(scene_id);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(Error::SceneNotFound)
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set")
    }

    pub fn set_admin(env: Env, new_admin: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &new_admin);
    }

    pub fn get_hub(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::GameHubAddress)
            .expect("GameHub address not set")
    }

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

    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        admin.require_auth();

        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }
}

#[cfg(test)]
mod test;
