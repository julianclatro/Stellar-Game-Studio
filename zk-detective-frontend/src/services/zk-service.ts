// F06: ZK Service -- Client-side proof generation using Noir.js + Barretenberg
//
// This service wraps the accusation circuit, providing a clean API for:
// 1. Generating ZK proofs that an accusation is correct/incorrect
// 2. Verifying proofs client-side (for testing)
// 3. Extracting public inputs for on-chain submission
//
// The compiled circuit is loaded as a static JSON artifact from nargo compile.

import { Noir } from '@noir-lang/noir_js';
import { type ProofData, UltraHonkBackend } from '@aztec/bb.js';

// The compiled circuit JSON -- import from the circuits build output
// After running `nargo compile` in circuits/accusation/
import type { InputMap } from '@noir-lang/noir_js';

export interface AccusationInputs {
  // The player's guess
  accusedSuspect: number;
  accusedWeapon: number;
  accusedRoom: number;
  // The committed solution (private witness -- provided by game master)
  solutionSuspect: number;
  solutionWeapon: number;
  solutionRoom: number;
  salt: string; // hex or decimal string for a Field element
  // The on-chain commitment
  commitment: string; // hex or decimal Field element
}

export interface AccusationProof {
  proof: ProofData;
  isCorrect: boolean;
  publicInputs: string[];
}

export class ZkService {
  private noir: Noir | null = null;
  private backend: UltraHonkBackend | null = null;
  private circuit: any = null;

  /**
   * Initialize the ZK service with a compiled circuit.
   * Call this once at app startup, passing the circuit JSON from nargo compile.
   */
  async initialize(circuitJson: any): Promise<void> {
    this.circuit = circuitJson;
    this.noir = new Noir(circuitJson);
    // @ts-expect-error bb.js@3.0.3 type mismatch — runtime API works with single arg
    this.backend = new UltraHonkBackend(circuitJson.bytecode);
  }

  /**
   * Generate a ZK proof for an accusation.
   *
   * The proof demonstrates that the prover knows the solution behind
   * the commitment, and whether the accusation matches that solution.
   * The actual solution remains hidden in the proof.
   */
  async proveAccusation(inputs: AccusationInputs): Promise<AccusationProof> {
    if (!this.noir || !this.backend) {
      throw new Error('ZkService not initialized. Call initialize() first.');
    }

    // Map inputs to circuit parameter names
    const circuitInputs: InputMap = {
      solution_suspect: inputs.solutionSuspect.toString(),
      solution_weapon: inputs.solutionWeapon.toString(),
      solution_room: inputs.solutionRoom.toString(),
      salt: inputs.salt,
      commitment: inputs.commitment,
      accused_suspect: inputs.accusedSuspect.toString(),
      accused_weapon: inputs.accusedWeapon.toString(),
      accused_room: inputs.accusedRoom.toString(),
    };

    // Execute the circuit to generate the witness
    const { witness, returnValue } = await this.noir.execute(circuitInputs);

    // The return value tells us if the accusation was correct
    const isCorrect = returnValue === true || returnValue === '0x01' || returnValue === '1';

    // Generate the ZK proof
    const proof = await this.backend.generateProof(witness);

    return {
      proof,
      isCorrect,
      publicInputs: proof.publicInputs,
    };
  }

  /**
   * Verify a proof client-side.
   * This is useful for testing. In production, verification happens on Soroban.
   */
  async verifyProof(proof: ProofData): Promise<boolean> {
    if (!this.backend) {
      throw new Error('ZkService not initialized. Call initialize() first.');
    }

    return this.backend.verifyProof(proof);
  }

  /**
   * Get the verification key for on-chain deployment.
   * This key is embedded in the Soroban verifier contract.
   */
  async getVerificationKey(): Promise<Uint8Array> {
    if (!this.backend) {
      throw new Error('ZkService not initialized. Call initialize() first.');
    }

    return this.backend.getVerificationKey();
  }

  /** Clean up WASM resources */
  async destroy(): Promise<void> {
    this.backend = null;
    this.noir = null;
    this.circuit = null;
  }
}

// Singleton instance for the app
export const zkService = new ZkService();
