// F09: ZK Proof Integration — Orchestrates circuit loading + proof generation
//
// Wraps the existing ZkService (F06) with app-level concerns:
// - Loading the compiled accusation circuit from a static asset
// - Computing the Pedersen commitment at init time
// - Generating proofs with a clean interface for the game store
//
// Non-fatal: if WASM initialization fails, the game continues without ZK proofs.

import { zkService } from './zk-service';
import type { AccusationProof, AccusationInputs } from './zk-service';
import { solutionToNumeric } from '@/data/id-maps';

let zkReady = false;

/**
 * Initialize the ZK subsystem by loading the compiled Noir circuit.
 * Returns true if initialization succeeded, false otherwise.
 */
export async function initializeZk(): Promise<boolean> {
  if (zkReady) return true;

  try {
    // Dynamic import of the compiled circuit JSON.
    // This file is produced by `nargo compile` in circuits/accusation/
    // and should be placed in the public/ directory or referenced
    // via a Vite asset path. Falls back gracefully if not found.
    const circuitPath = '/circuits/accusation/target/accusation.json';
    const circuitModule = await fetch(circuitPath)
      .then(res => res.ok ? res.json() : null)
      .catch(() => null);

    if (!circuitModule?.bytecode) {
      console.warn('[ZK] Circuit JSON not found — ZK proofs disabled');
      return false;
    }

    const circuitJson = circuitModule;
    await zkService.initialize(circuitJson);
    zkReady = true;
    console.log('[ZK] Initialized successfully');
    return true;
  } catch (err) {
    console.warn('[ZK] Initialization failed — ZK proofs disabled:', err);
    zkReady = false;
    return false;
  }
}

/**
 * Generate a ZK accusation proof.
 *
 * @param accusedSolution - The player's guess: { suspect, weapon, room } as string IDs
 * @param actualSolution  - The real solution: { suspect, weapon, room } as string IDs
 * @param salt            - The Pedersen salt (Field string or hex)
 * @param commitment      - The on-chain Pedersen commitment (Field string or hex)
 *
 * @returns AccusationProof if ZK is ready, null otherwise
 */
export async function generateAccusationProof(
  accusedSolution: { suspect: string; weapon: string; room: string },
  actualSolution: { suspect: string; weapon: string; room: string },
  salt: string,
  commitment: string,
): Promise<AccusationProof | null> {
  if (!zkReady) return null;

  try {
    const accused = solutionToNumeric(accusedSolution);
    const solution = solutionToNumeric(actualSolution);

    const inputs: AccusationInputs = {
      accusedSuspect: accused.suspect,
      accusedWeapon: accused.weapon,
      accusedRoom: accused.room,
      solutionSuspect: solution.suspect,
      solutionWeapon: solution.weapon,
      solutionRoom: solution.room,
      salt,
      commitment,
    };

    const proof = await zkService.proveAccusation(inputs);
    console.log(`[ZK] Proof generated — correct=${proof.isCorrect}, inputs=${proof.publicInputs.length}`);
    return proof;
  } catch (err) {
    console.warn('[ZK] Proof generation failed:', err);
    return null;
  }
}

export function isZkReady(): boolean {
  return zkReady;
}

export type { AccusationProof };
