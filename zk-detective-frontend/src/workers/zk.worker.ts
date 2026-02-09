/// <reference lib="webworker" />

// ZK Web Worker — Loads Noir + Barretenberg WASM in an isolated context.
// This avoids Vite's ESBuild pre-bundling which corrupts the 3.6MB base64 WASM
// data URLs embedded in @aztec/bb.js. Workers are bundled via Rollup instead.
//
// We use BackendType.Wasm (not WasmWorker) because we're already inside a worker —
// no need for bb.js to spawn a nested worker.

import { Noir } from '@noir-lang/noir_js';
import { Barretenberg, UltraHonkBackend, BackendType } from '@aztec/bb.js';
import type { ZkWorkerRequest, ZkWorkerResponse, AccusationWorkerInputs } from '../services/zk-worker-types';
import type { InputMap } from '@noir-lang/noir_js';

let noir: Noir | null = null;
let backend: UltraHonkBackend | null = null;
let api: Barretenberg | null = null;

function respond(msg: ZkWorkerResponse, transfer?: Transferable[]) {
  if (transfer) {
    self.postMessage(msg, transfer);
  } else {
    self.postMessage(msg);
  }
}

function mapInputsToCircuit(inputs: AccusationWorkerInputs): InputMap {
  return {
    solution_suspect: inputs.solutionSuspect.toString(),
    solution_weapon: inputs.solutionWeapon.toString(),
    solution_room: inputs.solutionRoom.toString(),
    salt: inputs.salt,
    commitment: inputs.commitment,
    accused_suspect: inputs.accusedSuspect.toString(),
    accused_weapon: inputs.accusedWeapon.toString(),
    accused_room: inputs.accusedRoom.toString(),
  };
}

self.onmessage = async (e: MessageEvent<ZkWorkerRequest>) => {
  const { type, requestId } = e.data;

  try {
    switch (type) {
      case 'init': {
        const res = await fetch('/circuits/accusation/target/accusation.json');
        if (!res.ok) {
          respond({ type: 'ready', requestId, accusationReady: false });
          return;
        }
        const circuit = await res.json();
        if (!circuit?.bytecode) {
          respond({ type: 'ready', requestId, accusationReady: false });
          return;
        }

        noir = new Noir(circuit);

        // Initialize Barretenberg with direct WASM (no nested worker)
        api = await Barretenberg.new({ backend: BackendType.Wasm });
        backend = new UltraHonkBackend(circuit.bytecode, api);

        respond({ type: 'ready', requestId, accusationReady: true });
        break;
      }

      case 'prove': {
        if (!noir || !backend) {
          respond({ type: 'error', requestId, message: 'Worker not initialized' });
          return;
        }
        const circuitInputs = mapInputsToCircuit(e.data.inputs);
        const { witness, returnValue } = await noir.execute(circuitInputs);
        const isCorrect = returnValue === true || returnValue === '0x01' || returnValue === '1';
        const proofData = await backend.generateProof(witness);

        // Transfer proof buffer for zero-copy (avoids cloning ~16KB)
        const proofBytes = proofData.proof;
        respond(
          {
            type: 'proof',
            requestId,
            proof: proofBytes,
            publicInputs: proofData.publicInputs,
            isCorrect,
          },
          [proofBytes.buffer],
        );
        break;
      }

      case 'verify': {
        if (!backend) {
          respond({ type: 'error', requestId, message: 'Worker not initialized' });
          return;
        }
        const valid = await backend.verifyProof({
          proof: e.data.proof,
          publicInputs: e.data.publicInputs,
        });
        respond({ type: 'verified', requestId, valid });
        break;
      }

      case 'destroy': {
        backend = null;
        noir = null;
        if (api) {
          await api.destroy();
          api = null;
        }
        respond({ type: 'destroyed', requestId });
        break;
      }
    }
  } catch (err: any) {
    respond({
      type: 'error',
      requestId,
      message: err?.message ?? String(err),
    });
  }
};
