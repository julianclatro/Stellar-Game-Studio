// Services — Public API

// F07: Clue Verification
export {
  ClueVerifyService,
  clueVerifyService,
  computeResponseValue,
  computeAllResponseValues,
} from './clue-verify-service';

export type {
  ClueVerifyInputs,
  ClueVerifyResult,
  ClueResponseHash,
} from './clue-verify-service';

// F11: Scoring System
export {
  computeScore,
  generateSummary,
  ledgersToSeconds,
  formatTime,
} from './scoring-service';

export type {
  GameMetrics,
  ScoreBreakdown,
  GameSummary,
} from './scoring-service';

// F06: ZK Proof Service (direct — used by vitest tests)
export { ZkService, zkService } from './zk-service';
export type { AccusationInputs, AccusationProof } from './zk-service';

// ZK Worker Service (browser — Web Worker wrapper)
export { zkWorkerService } from './zk-worker-service';
export type { WorkerAccusationProof } from './zk-worker-service';
export type { AccusationWorkerInputs } from './zk-worker-types';

// F09: Contract + Wallet + ZK Integration
export { contractService } from './contract-service';
export type { AccuseResult, OnChainGameState } from './contract-service';
export { player1Wallet, player2Wallet, adminWallet, isWalletAvailable } from './wallet-service';
export type { WalletSigner } from './wallet-service';
export { initializeZk, generateAccusationProof, isZkReady } from './zk-integration';
