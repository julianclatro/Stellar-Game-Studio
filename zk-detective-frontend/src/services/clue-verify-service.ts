// F07: ZK Clue Verification Service
//
// Provides the "honest game master" mechanic: when a player inspects a clue,
// this service generates a ZK proof that the clue response is truthful.
//
// The circuit proves:
//   1. The prover knows the solution behind the on-chain commitment
//   2. The clue response correctly reflects whether the clue's related suspect
//      is the guilty party
//
// Response encoding:
//   - response_value = 1 if the clue's related_suspect is the guilty suspect
//   - response_value = 0 otherwise (different suspect or no suspect link)
//
// Pre-committed clue response hashes are stored in the case data so that
// anyone can verify the proof without knowing the solution.

import { Noir } from '@noir-lang/noir_js';
import type { InputMap } from '@noir-lang/noir_js';
import type { ProofData, UltraHonkBackend } from '@aztec/bb.js';
import type { Clue, ClientCaseData } from '../data/types';
import { SUSPECT_IDS } from '../data/id-maps';
import { CLUE_IDS } from '../data/clue-ids';

/** Inputs needed to generate a clue verification proof */
export interface ClueVerifyInputs {
  /** The clue being inspected */
  clueId: string;
  /** The clue's related suspect string ID (empty string if no link) */
  relatedSuspect: string;
  /** The committed solution (private witness -- provided by game master) */
  solutionSuspect: number;
  solutionWeapon: number;
  solutionRoom: number;
  salt: string;
  /** The on-chain commitment */
  commitment: string;
  /** Pre-committed response hash for this clue */
  clueResponseHash: string;
}

/** Result of a clue verification proof */
export interface ClueVerifyResult {
  /** The ZK proof */
  proof: ProofData;
  /** Whether the clue is relevant to the solution */
  isRelevant: boolean;
  /** Public inputs for on-chain verification */
  publicInputs: string[];
}

/** Pre-computed clue response hash for a single clue */
export interface ClueResponseHash {
  clueId: string;
  numericClueId: number;
  responseValue: number;
  hash: string;
}

export class ClueVerifyService {
  private noir: Noir | null = null;
  private backend: UltraHonkBackend | null = null;

  /**
   * Initialize the service with the compiled clue-verify circuit.
   * Call once at app startup.
   */
  async initialize(circuitJson: any): Promise<void> {
    this.noir = new Noir(circuitJson);
    // Backend import is dynamic because UltraHonkBackend needs browser WASM
    const { UltraHonkBackend: Backend } = await import('@aztec/bb.js');
    // @ts-expect-error bb.js@3.0.3 type mismatch — runtime API works with single arg
    this.backend = new Backend(circuitJson.bytecode);
  }

  /**
   * Execute the circuit (without proof generation) to verify clue truthfulness.
   * Useful for testing and local validation.
   */
  async execute(inputs: ClueVerifyInputs): Promise<{ isRelevant: boolean; witness: any }> {
    if (!this.noir) {
      throw new Error('ClueVerifyService not initialized. Call initialize() first.');
    }

    const circuitInputs = this.buildCircuitInputs(inputs);
    const { witness, returnValue } = await this.noir.execute(circuitInputs);
    const isRelevant = returnValue === true || returnValue === '0x01' || returnValue === '1';

    return { isRelevant, witness };
  }

  /**
   * Generate a full ZK proof for a clue inspection.
   * This proof can be verified on-chain or by other clients.
   */
  async prove(inputs: ClueVerifyInputs): Promise<ClueVerifyResult> {
    if (!this.noir || !this.backend) {
      throw new Error('ClueVerifyService not initialized. Call initialize() first.');
    }

    const circuitInputs = this.buildCircuitInputs(inputs);
    const { witness, returnValue } = await this.noir.execute(circuitInputs);
    const isRelevant = returnValue === true || returnValue === '0x01' || returnValue === '1';
    const proof = await this.backend.generateProof(witness);

    return {
      proof,
      isRelevant,
      publicInputs: proof.publicInputs,
    };
  }

  /**
   * Verify a clue proof client-side.
   */
  async verifyProof(proof: ProofData): Promise<boolean> {
    if (!this.backend) {
      throw new Error('ClueVerifyService not initialized. Call initialize() first.');
    }
    return this.backend.verifyProof(proof);
  }

  /** Clean up WASM resources */
  async destroy(): Promise<void> {
    this.backend = null;
    this.noir = null;
  }

  private buildCircuitInputs(inputs: ClueVerifyInputs): InputMap {
    const numericClueId = CLUE_IDS[inputs.clueId];
    if (numericClueId === undefined) {
      throw new Error(`Unknown clue: ${inputs.clueId}`);
    }

    // Determine related_suspect numeric ID (0 if no link)
    const relatedSuspectId = inputs.relatedSuspect
      ? (SUSPECT_IDS[inputs.relatedSuspect] ?? 0)
      : 0;

    // response_value: 1 if clue's related suspect IS the guilty suspect, 0 otherwise
    const responseValue = (relatedSuspectId !== 0 && relatedSuspectId === inputs.solutionSuspect)
      ? 1
      : 0;

    return {
      solution_suspect: inputs.solutionSuspect.toString(),
      solution_weapon: inputs.solutionWeapon.toString(),
      solution_room: inputs.solutionRoom.toString(),
      salt: inputs.salt,
      related_suspect: relatedSuspectId.toString(),
      response_value: responseValue.toString(),
      commitment: inputs.commitment,
      clue_id: numericClueId.toString(),
      clue_response_hash: inputs.clueResponseHash,
    };
  }
}

/**
 * Compute the expected response value for a clue given the solution.
 * This is used at build-time to generate clue response hashes
 * and at runtime to prepare circuit inputs.
 */
export function computeResponseValue(
  relatedSuspect: string,
  solutionSuspect: string,
): number {
  if (!relatedSuspect) return 0;
  return relatedSuspect === solutionSuspect ? 1 : 0;
}

/**
 * Compute all clue response values for a case given the solution.
 * Returns a map of clue_id -> response_value for every clue in the case.
 */
export function computeAllResponseValues(
  caseData: ClientCaseData,
  solutionSuspect: string,
): Map<string, number> {
  const result = new Map<string, number>();
  for (const room of caseData.rooms) {
    for (const clue of room.clues) {
      result.set(clue.id, computeResponseValue(clue.related_suspect, solutionSuspect));
    }
  }
  return result;
}

// Singleton instance for the app
export const clueVerifyService = new ClueVerifyService();
