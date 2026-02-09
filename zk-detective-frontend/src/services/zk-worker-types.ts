// Shared types for the ZK Web Worker message protocol.
// Zero runtime deps — types only. Used by both the worker and the main-thread service.

// ── Request: main thread → worker ──────────────────────────

export type ZkWorkerRequest =
  | { type: 'init'; requestId: number }
  | { type: 'prove'; requestId: number; inputs: AccusationWorkerInputs }
  | { type: 'verify'; requestId: number; proof: Uint8Array; publicInputs: string[] }
  | { type: 'destroy'; requestId: number };

// ── Response: worker → main thread ─────────────────────────

export type ZkWorkerResponse =
  | { type: 'ready'; requestId: number; accusationReady: boolean }
  | { type: 'proof'; requestId: number; proof: Uint8Array; publicInputs: string[]; isCorrect: boolean }
  | { type: 'verified'; requestId: number; valid: boolean }
  | { type: 'destroyed'; requestId: number }
  | { type: 'error'; requestId: number; message: string };

// ── Flat primitives for structured clone ───────────────────

export interface AccusationWorkerInputs {
  accusedSuspect: number;
  accusedWeapon: number;
  accusedRoom: number;
  solutionSuspect: number;
  solutionWeapon: number;
  solutionRoom: number;
  salt: string;
  commitment: string;
}
