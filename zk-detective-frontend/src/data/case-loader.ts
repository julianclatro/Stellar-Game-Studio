// F01: Case Data System — Case Loader
// Loads and validates case data, ensuring structural integrity.

import type { ClientCaseData, Room, Suspect, Clue } from './types';

export class CaseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CaseValidationError';
  }
}

/** Validate that all room connections are reciprocal and reference existing rooms */
function validateRoomConnections(rooms: Room[]): string[] {
  const errors: string[] = [];
  const roomIds = new Set(rooms.map(r => r.id));

  for (const room of rooms) {
    for (const connId of room.connections) {
      if (!roomIds.has(connId)) {
        errors.push(`Room "${room.id}" connects to unknown room "${connId}"`);
        continue;
      }
      const target = rooms.find(r => r.id === connId)!;
      if (!target.connections.includes(room.id)) {
        errors.push(`Room "${room.id}" connects to "${connId}" but "${connId}" doesn't connect back`);
      }
    }
  }
  return errors;
}

/** Validate that suspects reference valid rooms and clue references are consistent */
function validateSuspects(suspects: Suspect[], rooms: Room[]): string[] {
  const errors: string[] = [];
  const roomIds = new Set(rooms.map(r => r.id));
  const allClueIds = new Set(rooms.flatMap(r => r.clues.map(c => c.id)));
  const suspectIds = new Set(suspects.map(s => s.id));

  for (const suspect of suspects) {
    if (!roomIds.has(suspect.room)) {
      errors.push(`Suspect "${suspect.id}" references unknown room "${suspect.room}"`);
    }

    // Check that clue_triggered keys reference real clues
    for (const clueId of Object.keys(suspect.dialogue.clue_triggered)) {
      if (!allClueIds.has(clueId)) {
        errors.push(`Suspect "${suspect.id}" has dialogue for unknown clue "${clueId}"`);
      }
    }

    // Check confrontation keys (format: "clue1+clue2")
    for (const comboKey of Object.keys(suspect.dialogue.confrontation)) {
      const clueIds = comboKey.split('+');
      for (const clueId of clueIds) {
        if (!allClueIds.has(clueId)) {
          errors.push(`Suspect "${suspect.id}" confrontation references unknown clue "${clueId}" in "${comboKey}"`);
        }
      }
    }
  }

  // Check that suspects_present in rooms reference real suspects
  for (const room of rooms) {
    for (const suspectId of room.suspects_present) {
      if (!suspectIds.has(suspectId)) {
        errors.push(`Room "${room.id}" references unknown suspect "${suspectId}"`);
      }
    }
  }

  return errors;
}

/** Validate clue related_suspect references */
function validateClues(rooms: Room[], suspects: Suspect[]): string[] {
  const errors: string[] = [];
  const suspectIds = new Set(suspects.map(s => s.id));

  for (const room of rooms) {
    for (const clue of room.clues) {
      if (clue.related_suspect && !suspectIds.has(clue.related_suspect)) {
        errors.push(`Clue "${clue.id}" in room "${room.id}" references unknown suspect "${clue.related_suspect}"`);
      }
    }
  }
  return errors;
}

/** Validate the complete case data structure. Throws CaseValidationError on failure. */
export function validateCase(caseData: ClientCaseData): void {
  const errors: string[] = [];

  if (!caseData.case_id || caseData.case_id < 1) {
    errors.push('case_id must be a positive integer');
  }
  if (!caseData.title) {
    errors.push('title is required');
  }
  if (!caseData.rooms || caseData.rooms.length === 0) {
    errors.push('At least one room is required');
  }
  if (!caseData.suspects || caseData.suspects.length === 0) {
    errors.push('At least one suspect is required');
  }
  if (!caseData.weapons || caseData.weapons.length === 0) {
    errors.push('At least one weapon is required');
  }

  errors.push(...validateRoomConnections(caseData.rooms));
  errors.push(...validateSuspects(caseData.suspects, caseData.rooms));
  errors.push(...validateClues(caseData.rooms, caseData.suspects));

  if (errors.length > 0) {
    throw new CaseValidationError(
      `Case validation failed with ${errors.length} error(s):\n${errors.map(e => `  - ${e}`).join('\n')}`
    );
  }
}

/** Load and validate a case from a static import. */
export function loadCase(caseData: ClientCaseData): ClientCaseData {
  validateCase(caseData);
  return caseData;
}

// Utility helpers for downstream features

/** Get a room by ID, or throw */
export function getRoom(caseData: ClientCaseData, roomId: string): Room {
  const room = caseData.rooms.find(r => r.id === roomId);
  if (!room) throw new Error(`Room "${roomId}" not found`);
  return room;
}

/** Get a suspect by ID, or throw */
export function getSuspect(caseData: ClientCaseData, suspectId: string): Suspect {
  const suspect = caseData.suspects.find(s => s.id === suspectId);
  if (!suspect) throw new Error(`Suspect "${suspectId}" not found`);
  return suspect;
}

/** Get a clue by ID across all rooms, or throw */
export function getClue(caseData: ClientCaseData, clueId: string): Clue {
  for (const room of caseData.rooms) {
    const clue = room.clues.find(c => c.id === clueId);
    if (clue) return clue;
  }
  throw new Error(`Clue "${clueId}" not found`);
}

/** Get all clues across all rooms */
export function getAllClues(caseData: ClientCaseData): Clue[] {
  return caseData.rooms.flatMap(r => r.clues);
}

/** Get all key evidence clues */
export function getKeyEvidence(caseData: ClientCaseData): Clue[] {
  return getAllClues(caseData).filter(c => c.is_key_evidence);
}
