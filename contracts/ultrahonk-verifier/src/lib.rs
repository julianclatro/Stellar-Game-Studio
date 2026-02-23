#![no_std]

//! UltraHonk Verifier Contract for Soroban (Protocol 25)
//!
//! Thin wrapper around the vendored `ultrahonk_soroban_verifier` library.
//! Stores a verification key at construction time, then accepts proof + public
//! inputs and verifies using BN254 host functions (g1_mul, g1_add, pairing_check).

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Bytes, Env};
use ultrahonk_soroban_verifier::UltraHonkVerifier;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VerifierError {
    /// Verification key could not be parsed
    InvalidVk = 1,
    /// Proof verification failed (invalid proof or mismatched inputs)
    VerificationFailed = 2,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Vk,
}

#[contract]
pub struct UltraHonkVerifierContract;

#[contractimpl]
impl UltraHonkVerifierContract {
    /// Initialize the verifier with a serialized verification key.
    /// Called once at deployment via constructor.
    pub fn __constructor(env: Env, vk_bytes: Bytes) {
        env.storage().instance().set(&DataKey::Vk, &vk_bytes);
    }

    /// Verify an UltraHonk proof against the stored verification key.
    ///
    /// - `public_inputs`: 32-byte aligned concatenation of public input fields
    /// - `proof_bytes`: serialized UltraHonk proof
    ///
    /// Returns Ok(()) on successful verification, VerifierError on failure.
    pub fn verify_proof(
        env: Env,
        public_inputs: Bytes,
        proof_bytes: Bytes,
    ) -> Result<(), VerifierError> {
        let vk_bytes: Bytes = env
            .storage()
            .instance()
            .get(&DataKey::Vk)
            .expect("VK not set");

        let verifier =
            UltraHonkVerifier::new(&env, &vk_bytes).map_err(|_| VerifierError::InvalidVk)?;

        verifier
            .verify(&proof_bytes, &public_inputs)
            .map_err(|_| VerifierError::VerificationFailed)?;

        Ok(())
    }
}
