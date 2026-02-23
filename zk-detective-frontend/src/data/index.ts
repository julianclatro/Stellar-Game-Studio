// F01: Case Data System — Public API
export type {
  Clue,
  DialogueTree,
  Suspect,
  Room,
  Solution,
  CaseData,
  ClientCaseData,
} from './types';

export {
  loadCase,
  validateCase,
  getRoom,
  getSuspect,
  getClue,
  getAllClues,
  getKeyEvidence,
  CaseValidationError,
} from './case-loader';

export {
  generateCommitment,
  commitmentToHex,
  verifyCommitment,
} from './commitment';

export {
  SUSPECT_IDS,
  WEAPON_IDS,
  ROOM_IDS,
  SUSPECT_NAMES,
  WEAPON_NAMES,
  ROOM_NAMES,
  solutionToNumeric,
  numericToSolution,
} from './id-maps';

export {
  CLUE_IDS,
  CLUE_NAMES,
  clueToNumeric,
  numericToClue,
} from './clue-ids';
