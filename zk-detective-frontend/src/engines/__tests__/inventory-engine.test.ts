// F03: Inventory System — Tests
import { describe, it, expect, beforeEach } from 'vitest';
import { InventoryEngine } from '../inventory-engine';
import type { ClientCaseData, Clue } from '../../data/types';
import caseJson from '../../data/cases/meridian-manor.json';

const caseData = caseJson as unknown as ClientCaseData;

// Helper to get a clue from the case data by ID
function findClue(clueId: string): Clue {
  for (const room of caseData.rooms) {
    const clue = room.clues.find(c => c.id === clueId);
    if (clue) return clue;
  }
  throw new Error(`Test setup: clue "${clueId}" not found`);
}

// Convenience references
const perfumeBottle = findClue('perfume_bottle');
const insuranceDocs = findClue('insurance_docs');
const crumpledNote = findClue('crumpled_note');
const phoneRecords = findClue('phone_records');
const medicineBottle = findClue('medicine_bottle');
const missingKnife = findClue('missing_knife');
const wineGlass = findClue('wine_glass');
const cameraPhotos = findClue('camera_photos');
const muddyFootprints = findClue('muddy_footprints');
const smudgedFingerprints = findClue('smudged_fingerprints');
const tornLetter = findClue('torn_letter');

describe('InventoryEngine', () => {
  let inventory: InventoryEngine;

  beforeEach(() => {
    inventory = new InventoryEngine();
  });

  // --- Basic Collection ---

  describe('clue collection', () => {
    it('starts with empty inventory', () => {
      expect(inventory.getClueCount()).toBe(0);
      expect(inventory.getCollectedClues()).toHaveLength(0);
    });

    it('adds a clue to inventory on inspect', () => {
      const result = inventory.inspectClue(perfumeBottle);
      expect(result.isNew).toBe(true);
      expect(result.totalCollected).toBe(1);
      expect(result.clue.id).toBe('perfume_bottle');
      expect(inventory.getClueCount()).toBe(1);
    });

    it('collects multiple clues', () => {
      inventory.inspectClue(perfumeBottle);
      inventory.inspectClue(insuranceDocs);
      inventory.inspectClue(phoneRecords);
      expect(inventory.getClueCount()).toBe(3);
    });

    it('rejects duplicate inspection (idempotent)', () => {
      const first = inventory.inspectClue(perfumeBottle);
      const second = inventory.inspectClue(perfumeBottle);
      expect(first.isNew).toBe(true);
      expect(second.isNew).toBe(false);
      expect(second.totalCollected).toBe(1);
      expect(inventory.getClueCount()).toBe(1);
    });

    it('preserves collection order', () => {
      inventory.inspectClue(phoneRecords);
      inventory.inspectClue(perfumeBottle);
      inventory.inspectClue(insuranceDocs);

      const ids = inventory.getCollectedClueIds();
      expect(ids).toEqual(['phone_records', 'perfume_bottle', 'insurance_docs']);
    });
  });

  // --- Queries ---

  describe('clue queries', () => {
    beforeEach(() => {
      inventory.inspectClue(perfumeBottle);
      inventory.inspectClue(insuranceDocs);
      inventory.inspectClue(phoneRecords);
    });

    it('hasClue returns true for collected clues', () => {
      expect(inventory.hasClue('perfume_bottle')).toBe(true);
      expect(inventory.hasClue('insurance_docs')).toBe(true);
    });

    it('hasClue returns false for uncollected clues', () => {
      expect(inventory.hasClue('missing_knife')).toBe(false);
      expect(inventory.hasClue('nonexistent')).toBe(false);
    });

    it('getClue returns the clue object', () => {
      const clue = inventory.getClue('perfume_bottle');
      expect(clue).toBeDefined();
      expect(clue!.name).toBe('Broken Perfume Bottle');
    });

    it('getClue returns undefined for uncollected', () => {
      expect(inventory.getClue('missing_knife')).toBeUndefined();
    });

    it('getCollectedClues returns full Clue objects', () => {
      const clues = inventory.getCollectedClues();
      expect(clues).toHaveLength(3);
      expect(clues[0].name).toBe('Broken Perfume Bottle');
      expect(clues[1].name).toBe('Insurance Documents');
      expect(clues[2].name).toBe('Phone Records');
    });
  });

  // --- Key Evidence ---

  describe('key evidence', () => {
    it('filters collected clues by is_key_evidence', () => {
      // perfume_bottle: key evidence
      // smudged_fingerprints: not key evidence
      // insurance_docs: key evidence
      inventory.inspectClue(perfumeBottle);
      inventory.inspectClue(smudgedFingerprints);
      inventory.inspectClue(insuranceDocs);

      const key = inventory.getKeyEvidence();
      expect(key).toHaveLength(2);
      expect(key.map(c => c.id).sort()).toEqual(['insurance_docs', 'perfume_bottle']);
    });

    it('returns empty array when no key evidence collected', () => {
      inventory.inspectClue(smudgedFingerprints); // not key evidence
      inventory.inspectClue(wineGlass); // not key evidence
      expect(inventory.getKeyEvidence()).toHaveLength(0);
    });
  });

  // --- Suspect-related Clues ---

  describe('clues for suspect', () => {
    beforeEach(() => {
      inventory.inspectClue(perfumeBottle);     // related: victor
      inventory.inspectClue(insuranceDocs);      // related: victor
      inventory.inspectClue(phoneRecords);       // related: marcus
      inventory.inspectClue(smudgedFingerprints); // related: "" (none)
    });

    it('returns clues related to a specific suspect', () => {
      const victorClues = inventory.getCluesForSuspect('victor');
      expect(victorClues).toHaveLength(2);
      expect(victorClues.map(c => c.id).sort()).toEqual(['insurance_docs', 'perfume_bottle']);
    });

    it('returns clues for another suspect', () => {
      const marcusClues = inventory.getCluesForSuspect('marcus');
      expect(marcusClues).toHaveLength(1);
      expect(marcusClues[0].id).toBe('phone_records');
    });

    it('returns empty for suspect with no collected clues', () => {
      expect(inventory.getCluesForSuspect('elena')).toHaveLength(0);
    });

    it('returns empty for unrelated clues', () => {
      // smudged_fingerprints has related_suspect: ""
      expect(inventory.getCluesForSuspect('')).toHaveLength(1);
    });
  });

  // --- Clue Combos (for F04 Dialogue) ---

  describe('clue combos', () => {
    it('returns false when combo not satisfied', () => {
      inventory.inspectClue(perfumeBottle);
      // Combo "perfume_bottle+insurance_docs" needs both
      expect(inventory.hasClueCombo('perfume_bottle+insurance_docs')).toBe(false);
    });

    it('returns true when combo is satisfied', () => {
      inventory.inspectClue(perfumeBottle);
      inventory.inspectClue(insuranceDocs);
      expect(inventory.hasClueCombo('perfume_bottle+insurance_docs')).toBe(true);
    });

    it('handles single-clue combo', () => {
      inventory.inspectClue(perfumeBottle);
      expect(inventory.hasClueCombo('perfume_bottle')).toBe(true);
    });

    it('handles three-clue combo', () => {
      inventory.inspectClue(perfumeBottle);
      inventory.inspectClue(insuranceDocs);
      inventory.inspectClue(crumpledNote);
      expect(inventory.hasClueCombo('perfume_bottle+insurance_docs+crumpled_note')).toBe(true);
    });

    it('getSatisfiedCombos filters to available combos', () => {
      inventory.inspectClue(perfumeBottle);
      inventory.inspectClue(insuranceDocs);
      inventory.inspectClue(phoneRecords);

      const combos = inventory.getSatisfiedCombos([
        'perfume_bottle+insurance_docs',     // satisfied
        'phone_records+medicine_bottle',      // NOT satisfied (missing medicine_bottle)
        'camera_photos+muddy_footprints',     // NOT satisfied
      ]);
      expect(combos).toEqual(['perfume_bottle+insurance_docs']);
    });

    it('returns all satisfied combos', () => {
      inventory.inspectClue(perfumeBottle);
      inventory.inspectClue(insuranceDocs);
      inventory.inspectClue(phoneRecords);
      inventory.inspectClue(medicineBottle);

      const combos = inventory.getSatisfiedCombos([
        'perfume_bottle+insurance_docs',      // satisfied
        'phone_records+medicine_bottle',       // satisfied
      ]);
      expect(combos).toHaveLength(2);
    });
  });

  // --- Room Clue Partitioning ---

  describe('partitionRoomClues', () => {
    it('partitions room clues into inspected and uninspected', () => {
      const bedroomClues = caseData.rooms[0].clues; // bedroom: 3 clues
      inventory.inspectClue(perfumeBottle);

      const { inspected, uninspected } = inventory.partitionRoomClues(bedroomClues);
      expect(inspected).toHaveLength(1);
      expect(inspected[0].id).toBe('perfume_bottle');
      expect(uninspected).toHaveLength(2);
      expect(uninspected.map(c => c.id).sort()).toEqual(['smudged_fingerprints', 'torn_letter']);
    });

    it('all uninspected when nothing collected', () => {
      const bedroomClues = caseData.rooms[0].clues;
      const { inspected, uninspected } = inventory.partitionRoomClues(bedroomClues);
      expect(inspected).toHaveLength(0);
      expect(uninspected).toHaveLength(3);
    });

    it('all inspected when everything collected', () => {
      const bedroomClues = caseData.rooms[0].clues;
      for (const clue of bedroomClues) {
        inventory.inspectClue(clue);
      }
      const { inspected, uninspected } = inventory.partitionRoomClues(bedroomClues);
      expect(inspected).toHaveLength(3);
      expect(uninspected).toHaveLength(0);
    });
  });

  // --- Reset ---

  describe('reset', () => {
    it('clears all collected clues', () => {
      inventory.inspectClue(perfumeBottle);
      inventory.inspectClue(insuranceDocs);
      expect(inventory.getClueCount()).toBe(2);

      inventory.reset();
      expect(inventory.getClueCount()).toBe(0);
      expect(inventory.hasClue('perfume_bottle')).toBe(false);
      expect(inventory.getCollectedClues()).toHaveLength(0);
      expect(inventory.getCollectedClueIds()).toHaveLength(0);
    });

    it('allows re-collecting clues after reset', () => {
      inventory.inspectClue(perfumeBottle);
      inventory.reset();

      const result = inventory.inspectClue(perfumeBottle);
      expect(result.isNew).toBe(true);
      expect(inventory.getClueCount()).toBe(1);
    });
  });

  // --- Meridian Manor Full Case Integration ---

  describe('Meridian Manor case integration', () => {
    it('can collect all 11 clues', () => {
      const allClues = caseData.rooms.flatMap(r => r.clues);
      expect(allClues).toHaveLength(11);

      for (const clue of allClues) {
        inventory.inspectClue(clue);
      }
      expect(inventory.getClueCount()).toBe(11);
    });

    it('key evidence count matches case data', () => {
      const allClues = caseData.rooms.flatMap(r => r.clues);
      for (const clue of allClues) {
        inventory.inspectClue(clue);
      }
      // Key evidence: perfume_bottle, insurance_docs, crumpled_note, phone_records, camera_photos
      expect(inventory.getKeyEvidence()).toHaveLength(5);
    });

    it('can satisfy all confrontation combos', () => {
      // Collect all clues
      const allClues = caseData.rooms.flatMap(r => r.clues);
      for (const clue of allClues) {
        inventory.inspectClue(clue);
      }

      // All confrontation combos from the case data
      const allCombos: string[] = [];
      for (const suspect of caseData.suspects) {
        allCombos.push(...Object.keys(suspect.dialogue.confrontation));
      }

      const satisfied = inventory.getSatisfiedCombos(allCombos);
      expect(satisfied).toEqual(allCombos);
    });

    it('victor confrontation requires perfume_bottle + insurance_docs', () => {
      const victorCombos = Object.keys(
        caseData.suspects.find(s => s.id === 'victor')!.dialogue.confrontation
      );
      expect(victorCombos).toEqual(['perfume_bottle+insurance_docs']);

      // Without both clues
      inventory.inspectClue(perfumeBottle);
      expect(inventory.hasClueCombo('perfume_bottle+insurance_docs')).toBe(false);

      // With both clues
      inventory.inspectClue(insuranceDocs);
      expect(inventory.hasClueCombo('perfume_bottle+insurance_docs')).toBe(true);
    });

    it('marcus confrontation requires phone_records + medicine_bottle', () => {
      inventory.inspectClue(phoneRecords);
      expect(inventory.hasClueCombo('phone_records+medicine_bottle')).toBe(false);

      inventory.inspectClue(medicineBottle);
      expect(inventory.hasClueCombo('phone_records+medicine_bottle')).toBe(true);
    });

    it('thomas confrontation requires camera_photos + muddy_footprints', () => {
      inventory.inspectClue(cameraPhotos);
      inventory.inspectClue(muddyFootprints);
      expect(inventory.hasClueCombo('camera_photos+muddy_footprints')).toBe(true);
    });

    it('james confrontation requires insurance_docs + crumpled_note', () => {
      inventory.inspectClue(insuranceDocs);
      inventory.inspectClue(crumpledNote);
      expect(inventory.hasClueCombo('insurance_docs+crumpled_note')).toBe(true);
    });

    it('clues for each suspect match expectations', () => {
      const allClues = caseData.rooms.flatMap(r => r.clues);
      for (const clue of allClues) {
        inventory.inspectClue(clue);
      }

      // Victor: perfume_bottle, insurance_docs, crumpled_note, torn_letter
      expect(inventory.getCluesForSuspect('victor')).toHaveLength(4);
      // Marcus: phone_records, medicine_bottle
      expect(inventory.getCluesForSuspect('marcus')).toHaveLength(2);
      // Elena: missing_knife
      expect(inventory.getCluesForSuspect('elena')).toHaveLength(1);
      // Thomas: muddy_footprints, camera_photos
      expect(inventory.getCluesForSuspect('thomas')).toHaveLength(2);
    });
  });
});
