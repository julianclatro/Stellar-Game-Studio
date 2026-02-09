import { describe, it, expect } from 'vitest';
import {
  loadCase,
  validateCase,
  getRoom,
  getSuspect,
  getClue,
  getAllClues,
  getKeyEvidence,
  CaseValidationError,
} from '../case-loader';
import type { ClientCaseData } from '../types';
import meridianManor from '../cases/meridian-manor.json';

// Cast the imported JSON to our type
const caseData = meridianManor as ClientCaseData;

describe('Case Loader', () => {
  describe('validateCase', () => {
    it('validates the Meridian Manor case successfully', () => {
      expect(() => validateCase(caseData)).not.toThrow();
    });

    it('rejects case with missing title', () => {
      const bad = { ...caseData, title: '' };
      expect(() => validateCase(bad)).toThrow(CaseValidationError);
    });

    it('rejects case with no rooms', () => {
      const bad = { ...caseData, rooms: [] };
      expect(() => validateCase(bad)).toThrow('At least one room is required');
    });

    it('rejects case with no suspects', () => {
      const bad = { ...caseData, suspects: [] };
      expect(() => validateCase(bad)).toThrow('At least one suspect is required');
    });

    it('rejects case with no weapons', () => {
      const bad = { ...caseData, weapons: [] };
      expect(() => validateCase(bad)).toThrow('At least one weapon is required');
    });

    it('rejects non-reciprocal room connections', () => {
      const badRooms = caseData.rooms.map(r =>
        r.id === 'bedroom'
          ? { ...r, connections: ['lounge', 'study', 'nonexistent'] }
          : r
      );
      const bad = { ...caseData, rooms: badRooms };
      expect(() => validateCase(bad)).toThrow('unknown room "nonexistent"');
    });

    it('rejects suspect referencing unknown room', () => {
      const badSuspects = caseData.suspects.map(s =>
        s.id === 'victor' ? { ...s, room: 'dungeon' } : s
      );
      const bad = { ...caseData, suspects: badSuspects };
      expect(() => validateCase(bad)).toThrow('unknown room "dungeon"');
    });
  });

  describe('loadCase', () => {
    it('returns validated case data', () => {
      const loaded = loadCase(caseData);
      expect(loaded.case_id).toBe(1);
      expect(loaded.title).toBe('The Meridian Manor Incident');
    });
  });

  describe('Meridian Manor content completeness', () => {
    it('has exactly 5 rooms', () => {
      expect(caseData.rooms).toHaveLength(5);
    });

    it('has the correct room IDs', () => {
      const roomIds = caseData.rooms.map(r => r.id).sort();
      expect(roomIds).toEqual(['bedroom', 'garden', 'kitchen', 'lounge', 'study']);
    });

    it('has exactly 9 suspects', () => {
      expect(caseData.suspects).toHaveLength(9);
    });

    it('has exactly 5 weapons', () => {
      expect(caseData.weapons).toHaveLength(5);
    });

    it('every room has at least one connection', () => {
      for (const room of caseData.rooms) {
        expect(room.connections.length).toBeGreaterThan(0);
      }
    });

    it('every suspect has a default dialogue', () => {
      for (const suspect of caseData.suspects) {
        expect(suspect.dialogue.default).toBeTruthy();
      }
    });

    it('all room connections are bidirectional', () => {
      for (const room of caseData.rooms) {
        for (const connId of room.connections) {
          const target = caseData.rooms.find(r => r.id === connId)!;
          expect(target.connections).toContain(room.id);
        }
      }
    });
  });

  describe('Client safety', () => {
    it('does not contain a solution field', () => {
      expect((caseData as any).solution).toBeUndefined();
    });
  });

  describe('getRoom', () => {
    it('finds a room by ID', () => {
      const room = getRoom(caseData, 'bedroom');
      expect(room.name).toBe('The Bedroom');
    });

    it('throws for unknown room', () => {
      expect(() => getRoom(caseData, 'dungeon')).toThrow('Room "dungeon" not found');
    });
  });

  describe('getSuspect', () => {
    it('finds a suspect by ID', () => {
      const suspect = getSuspect(caseData, 'victor');
      expect(suspect.name).toBe('Victor Ashford');
      expect(suspect.role).toBe('Business Partner');
    });

    it('throws for unknown suspect', () => {
      expect(() => getSuspect(caseData, 'ghost')).toThrow('Suspect "ghost" not found');
    });
  });

  describe('getClue', () => {
    it('finds a clue across rooms', () => {
      const clue = getClue(caseData, 'insurance_docs');
      expect(clue.name).toBe('Insurance Documents');
      expect(clue.is_key_evidence).toBe(true);
    });

    it('throws for unknown clue', () => {
      expect(() => getClue(caseData, 'magic_wand')).toThrow('Clue "magic_wand" not found');
    });
  });

  describe('getAllClues', () => {
    it('returns all clues from all rooms', () => {
      const clues = getAllClues(caseData);
      // 3 (bedroom) + 2 (kitchen) + 2 (study) + 2 (lounge) + 2 (garden) = 11
      expect(clues).toHaveLength(11);
    });
  });

  describe('getKeyEvidence', () => {
    it('returns only key evidence clues', () => {
      const keyClues = getKeyEvidence(caseData);
      expect(keyClues.every(c => c.is_key_evidence)).toBe(true);
      // perfume_bottle, insurance_docs, crumpled_note, phone_records, camera_photos
      expect(keyClues).toHaveLength(5);
    });
  });
});
