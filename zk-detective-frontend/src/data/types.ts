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
  /** Short biography for result screen (e.g. "Victor Ashford, the business partner") */
  biography?: string;
  /** Narrative motive for result screen */
  motive?: string;
}

/** A murder weapon option */
export interface Weapon {
  id: string;
  name: string;
  /** Narrative context label (e.g. "a poison vial disguised as a perfume bottle") */
  narrative_label: string;
}

/** A navigable location in the case */
export interface Room {
  id: string;
  name: string;
  description: string;
  connections: string[];
  clues: Clue[];
  suspects_present: string[];
  /** Short label for minimap (e.g. "BED", "KIT") */
  abbreviation?: string;
  /** Narrative context label (e.g. "the Bedroom, during the dinner party") */
  narrative_label?: string;
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
  weapons: (string | Weapon)[];
  solution: Solution;
  setting?: string;
  briefing?: string;
  epilogue?: string;
  starting_room?: string;
  room_layout?: {
    positions: Record<string, RoomPosition>;
  };
}

/** Room position for minimap/briefing SVG */
export interface RoomPosition {
  x: number;
  y: number;
}

/** Client-safe case data (solution stripped, only commitment hash remains) */
export interface ClientCaseData {
  case_id: number;
  title: string;
  commitment: string;
  rooms: Room[];
  suspects: Suspect[];
  weapons: (string | Weapon)[];

  /** Narrative fields — the story bible lives in the JSON */
  setting?: string;
  briefing?: string;
  epilogue?: string;
  starting_room?: string;
  room_layout?: {
    positions: Record<string, RoomPosition>;
  };
}

/** Derive room connection edges from case data (deduplicated, sorted pairs) */
export function deriveEdges(rooms: Room[]): [string, string][] {
  const seen = new Set<string>();
  const edges: [string, string][] = [];
  for (const room of rooms) {
    for (const conn of room.connections) {
      const key = [room.id, conn].sort().join(':');
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([room.id, conn].sort() as [string, string]);
      }
    }
  }
  return edges;
}

/** Extract the weapon ID string from a weapon entry (handles both string and Weapon object formats) */
export function getWeaponId(w: string | Weapon): string {
  return typeof w === 'string' ? w : w.id;
}

/** Get weapon as a Weapon object (handles both formats, uses id as name fallback) */
export function toWeapon(w: string | Weapon): Weapon {
  if (typeof w === 'string') return { id: w, name: w, narrative_label: w };
  return w;
}
