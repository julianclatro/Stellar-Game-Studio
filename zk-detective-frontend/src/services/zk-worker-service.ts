// F09: ZK Worker Service — Promise-based wrapper for the ZK Web Worker.
//
// Spawns a Web Worker that loads Noir + Barretenberg WASM in isolation,
// avoiding Vite ESBuild corruption and keeping proof generation off the main thread.

import type {
  ZkWorkerRequest,
  ZkWorkerResponse,
  AccusationWorkerInputs,
} from './zk-worker-types';

export interface WorkerAccusationProof {
  proof: Uint8Array;
  publicInputs: string[];
  isCorrect: boolean;
}

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason: Error) => void;
}

class ZkWorkerService {
  private worker: Worker | null = null;
  private nextId = 0;
  private pending = new Map<number, PendingRequest>();
  private _ready = false;

  get ready(): boolean {
    return this._ready;
  }

  /**
   * Spawn the worker and initialize Noir + Barretenberg inside it.
   * Returns true if the accusation circuit loaded successfully.
   */
  async initialize(): Promise<boolean> {
    if (this._ready) return true;

    this.worker = new Worker(
      new URL('../workers/zk.worker.ts', import.meta.url),
      { type: 'module' },
    );

    this.worker.onmessage = (e: MessageEvent<ZkWorkerResponse>) => {
      this.handleMessage(e.data);
    };

    this.worker.onerror = (e: ErrorEvent) => {
      console.error('[ZkWorker] Worker error:', e.message);
      // Reject all pending requests
      for (const [id, pending] of this.pending) {
        pending.reject(new Error(`Worker error: ${e.message}`));
        this.pending.delete(id);
      }
    };

    const result = await this.send<{ accusationReady: boolean }>('init');
    this._ready = result.accusationReady;
    return this._ready;
  }

  /**
   * Generate a ZK accusation proof inside the worker.
   */
  async proveAccusation(inputs: AccusationWorkerInputs): Promise<WorkerAccusationProof> {
    if (!this._ready) {
      throw new Error('ZkWorkerService not initialized. Call initialize() first.');
    }

    const result = await this.send<{
      proof: Uint8Array;
      publicInputs: string[];
      isCorrect: boolean;
    }>('prove', { inputs });

    return {
      proof: result.proof,
      publicInputs: result.publicInputs,
      isCorrect: result.isCorrect,
    };
  }

  /**
   * Verify a proof inside the worker.
   */
  async verifyProof(proof: Uint8Array, publicInputs: string[]): Promise<boolean> {
    if (!this._ready) {
      throw new Error('ZkWorkerService not initialized. Call initialize() first.');
    }

    const result = await this.send<{ valid: boolean }>('verify', { proof, publicInputs });
    return result.valid;
  }

  /**
   * Clean up the worker and WASM resources.
   */
  async destroy(): Promise<void> {
    if (!this.worker) return;

    try {
      await this.send('destroy');
    } catch {
      // Worker may already be dead
    }

    this.worker.terminate();
    this.worker = null;
    this._ready = false;
    this.pending.clear();
  }

  // ── Internal ─────────────────────────────────────────────

  private send<T>(type: ZkWorkerRequest['type'], payload?: Record<string, any>): Promise<T> {
    const requestId = this.nextId++;

    return new Promise<T>((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });
      this.worker!.postMessage({ type, requestId, ...payload } as ZkWorkerRequest);
    });
  }

  private handleMessage(data: ZkWorkerResponse): void {
    const pending = this.pending.get(data.requestId);
    if (!pending) return;

    this.pending.delete(data.requestId);

    if (data.type === 'error') {
      pending.reject(new Error(data.message));
    } else {
      pending.resolve(data);
    }
  }
}

/** Singleton instance for the app */
export const zkWorkerService = new ZkWorkerService();
