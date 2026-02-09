// F09: ZK Proof Integration — Orchestrates proof generation via Web Worker
//
// Wraps the ZkWorkerService with app-level concerns:
// - Initializing the worker (which fetches circuit JSON internally)
// - Generating proofs with a clean interface for the game store
//
// Non-fatal: if WASM initialization fails, the game continues without ZK proofs.

import { zkWorkerService } from './zk-worker-service';
import type { WorkerAccusationProof } from './zk-worker-service';
import type { AccusationProof } from './zk-service';
import { solutionToNumeric } from '@/data/id-maps';

let zkReady = false;

/**
 * Initialize the ZK subsystem by spawning the Web Worker.
 * The worker fetches and loads the circuit JSON internally.
 * Returns true if initialization succeeded, false otherwise.
 */
export async function initializeZk(): Promise<boolean> {
  if (zkReady) return true;

  try {
    const success = await zkWorkerService.initialize();
    if (!success) {
      console.warn('[ZK] Worker initialized but circuit not found — ZK proofs disabled');
      return false;
    }
    zkReady = true;
    console.log('[ZK] Initialized successfully (Web Worker)');
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

    const result: WorkerAccusationProof = await zkWorkerService.proveAccusation({
      accusedSuspect: accused.suspect,
      accusedWeapon: accused.weapon,
      accusedRoom: accused.room,
      solutionSuspect: solution.suspect,
      solutionWeapon: solution.weapon,
      solutionRoom: solution.room,
      salt,
      commitment,
    });

    // Wrap worker result in the AccusationProof shape expected by consumers
    const proof: AccusationProof = {
      proof: {
        proof: result.proof,
        publicInputs: result.publicInputs,
      },
      isCorrect: result.isCorrect,
      publicInputs: result.publicInputs,
    };

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
