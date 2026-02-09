// F01: Case Data System — Type Definitions
// Every game feature imports from here.

/** A discoverable object in a room */
export interface Clue {
  id: string;
  name: string;
  description: string;
  is_key_evidence: boolean;
  related_suspect: string;
  icon: string;
}

/** Three-state dialogue tree for suspect interactions */
export interface DialogueTree {
  /** Shown when player has no relevant clues */
  default: string;
  /** Shown when player presents a specific clue (key = clue_id) */
  clue_triggered: Record<string, string>;
  /** Shown when player presents contradicting evidence (key = "clue1+clue2") */
  confrontation: Record<string, string>;
}

/** A person of interest in the case */
export interface Suspect {
  id: string;
  name: string;
  role: string;
  room: string;
  dialogue: DialogueTree;
}

/** A navigable location in the case */
export interface Room {
  id: string;
  name: string;
  description: string;
  connections: string[];
  clues: Clue[];
  suspects_present: string[];
}

/** The answer: who did it, with what, where */
export interface Solution {
  suspect: string;
  weapon: string;
  room: string;
}

/** Full case data (build-time only — never shipped to client) */
export interface CaseData {
  case_id: number;
  title: string;
  commitment: string;
  rooms: Room[];
  suspects: Suspect[];
  weapons: string[];
  solution: Solution;
}

/** Client-safe case data (solution stripped, only commitment hash remains) */
export interface ClientCaseData {
  case_id: number;
  title: string;
  commitment: string;
  rooms: Room[];
  suspects: Suspect[];
  weapons: string[];
}
