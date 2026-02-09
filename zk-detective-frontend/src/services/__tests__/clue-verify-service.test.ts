// F07: ZK Clue Verification Tests
import { describe, it, expect } from 'vitest';
import {
  computeResponseValue,
  computeAllResponseValues,
} from '../clue-verify-service';
import type { ClueVerifyInputs } from '../clue-verify-service';
import { CLUE_IDS, CLUE_NAMES, clueToNumeric, numericToClue } from '../../data/clue-ids';
import { SUSPECT_IDS } from '../../data/id-maps';
import type { ClientCaseData } from '../../data/types';
import caseJson from '../../data/cases/meridian-manor.json';

const caseData = caseJson as unknown as ClientCaseData;

// ============================================================================
// Clue ID Mapping
// ============================================================================

describe('Clue ID Mapping', () => {
  it('maps all 11 Meridian Manor clues to numeric IDs', () => {
    const allClues = caseData.rooms.flatMap(r => r.clues.map(c => c.id));
    expect(allClues.length).toBe(11);

    for (const clueId of allClues) {
      const numId = clueToNumeric(clueId);
      expect(numId).toBeGreaterThan(0);
      expect(numId).toBeLessThanOrEqual(11);
      expect(numericToClue(numId)).toBe(clueId);
    }
  });

  it('assigns unique IDs to all clues', () => {
    const ids = new Set(Object.values(CLUE_IDS));
    expect(ids.size).toBe(Object.keys(CLUE_IDS).length);
  });

  it('round-trips bedroom clues', () => {
    expect(clueToNumeric('perfume_bottle')).toBe(1);
    expect(clueToNumeric('smudged_fingerprints')).toBe(2);
    expect(clueToNumeric('torn_letter')).toBe(3);
    expect(numericToClue(1)).toBe('perfume_bottle');
    expect(numericToClue(2)).toBe('smudged_fingerprints');
    expect(numericToClue(3)).toBe('torn_letter');
  });

  it('round-trips study clues', () => {
    expect(clueToNumeric('insurance_docs')).toBe(4);
    expect(clueToNumeric('crumpled_note')).toBe(5);
  });

  it('round-trips lounge clues', () => {
    expect(clueToNumeric('phone_records')).toBe(6);
    expect(clueToNumeric('medicine_bottle')).toBe(7);
  });

  it('round-trips kitchen clues', () => {
    expect(clueToNumeric('wine_glass')).toBe(8);
    expect(clueToNumeric('missing_knife')).toBe(9);
  });

  it('round-trips garden clues', () => {
    expect(clueToNumeric('muddy_footprints')).toBe(10);
    expect(clueToNumeric('camera_photos')).toBe(11);
  });

  it('rejects unknown clue string', () => {
    expect(() => clueToNumeric('nonexistent_clue')).toThrow('Unknown clue: nonexistent_clue');
  });

  it('rejects unknown clue numeric ID', () => {
    expect(() => numericToClue(99)).toThrow('Unknown clue ID: 99');
  });

  it('has 11 entries total', () => {
    expect(Object.keys(CLUE_IDS).length).toBe(11);
    expect(Object.keys(CLUE_NAMES).length).toBe(11);
  });
});

// ============================================================================
// computeResponseValue
// ============================================================================

describe('computeResponseValue', () => {
  it('returns 1 for clue related to guilty suspect', () => {
    // Victor is guilty; clue related to victor
    expect(computeResponseValue('victor', 'victor')).toBe(1);
  });

  it('returns 0 for clue related to innocent suspect', () => {
    expect(computeResponseValue('marcus', 'victor')).toBe(0);
    expect(computeResponseValue('elena', 'victor')).toBe(0);
    expect(computeResponseValue('thomas', 'victor')).toBe(0);
  });

  it('returns 0 for clue with no suspect link', () => {
    expect(computeResponseValue('', 'victor')).toBe(0);
  });

  it('works for any guilty suspect', () => {
    expect(computeResponseValue('elena', 'elena')).toBe(1);
    expect(computeResponseValue('marcus', 'marcus')).toBe(1);
    expect(computeResponseValue('ren', 'ren')).toBe(1);
  });
});

// ============================================================================
// computeAllResponseValues
// ============================================================================

describe('computeAllResponseValues', () => {
  it('computes response values for all 11 clues', () => {
    const values = computeAllResponseValues(caseData, 'victor');
    expect(values.size).toBe(11);
  });

  it('marks victor-related clues as relevant (=1)', () => {
    const values = computeAllResponseValues(caseData, 'victor');

    // Clues related to victor
    expect(values.get('perfume_bottle')).toBe(1);   // related_suspect: "victor"
    expect(values.get('insurance_docs')).toBe(1);    // related_suspect: "victor"
    expect(values.get('crumpled_note')).toBe(1);     // related_suspect: "victor"
    expect(values.get('torn_letter')).toBe(1);       // related_suspect: "victor"
  });

  it('marks non-victor clues as not relevant (=0)', () => {
    const values = computeAllResponseValues(caseData, 'victor');

    // Clues related to other suspects
    expect(values.get('phone_records')).toBe(0);     // related_suspect: "marcus"
    expect(values.get('medicine_bottle')).toBe(0);   // related_suspect: "marcus"
    expect(values.get('missing_knife')).toBe(0);     // related_suspect: "elena"
    expect(values.get('muddy_footprints')).toBe(0);  // related_suspect: "thomas"
    expect(values.get('camera_photos')).toBe(0);     // related_suspect: "thomas"
  });

  it('marks clues with no suspect link as not relevant (=0)', () => {
    const values = computeAllResponseValues(caseData, 'victor');

    // Clues with empty related_suspect
    expect(values.get('smudged_fingerprints')).toBe(0);  // related_suspect: ""
    expect(values.get('wine_glass')).toBe(0);            // related_suspect: ""
  });

  it('changes relevance when guilty suspect changes', () => {
    // If Marcus were guilty instead
    const values = computeAllResponseValues(caseData, 'marcus');

    expect(values.get('perfume_bottle')).toBe(0);    // victor's clue = not relevant
    expect(values.get('phone_records')).toBe(1);     // marcus's clue = relevant
    expect(values.get('medicine_bottle')).toBe(1);   // marcus's clue = relevant
    expect(values.get('insurance_docs')).toBe(0);    // victor's clue = not relevant
  });

  it('if Elena is guilty, only her clues are relevant', () => {
    const values = computeAllResponseValues(caseData, 'elena');

    // Only missing_knife is related to elena
    expect(values.get('missing_knife')).toBe(1);

    // Everything else is 0
    expect(values.get('perfume_bottle')).toBe(0);
    expect(values.get('phone_records')).toBe(0);
    expect(values.get('insurance_docs')).toBe(0);
    expect(values.get('camera_photos')).toBe(0);
    expect(values.get('smudged_fingerprints')).toBe(0);
  });

  it('if Thomas is guilty, only his clues are relevant', () => {
    const values = computeAllResponseValues(caseData, 'thomas');

    expect(values.get('muddy_footprints')).toBe(1);
    expect(values.get('camera_photos')).toBe(1);

    expect(values.get('perfume_bottle')).toBe(0);
    expect(values.get('phone_records')).toBe(0);
  });
});

// ============================================================================
// Meridian Manor: Full clue-suspect mapping verification
// ============================================================================

describe('Meridian Manor clue-suspect mapping', () => {
  it('has correct related_suspect for all clues', () => {
    const clueMap = new Map<string, string>();
    for (const room of caseData.rooms) {
      for (const clue of room.clues) {
        clueMap.set(clue.id, clue.related_suspect);
      }
    }

    // Bedroom
    expect(clueMap.get('perfume_bottle')).toBe('victor');
    expect(clueMap.get('smudged_fingerprints')).toBe('');
    expect(clueMap.get('torn_letter')).toBe('victor');

    // Study
    expect(clueMap.get('insurance_docs')).toBe('victor');
    expect(clueMap.get('crumpled_note')).toBe('victor');

    // Lounge
    expect(clueMap.get('phone_records')).toBe('marcus');
    expect(clueMap.get('medicine_bottle')).toBe('marcus');

    // Kitchen
    expect(clueMap.get('wine_glass')).toBe('');
    expect(clueMap.get('missing_knife')).toBe('elena');

    // Garden
    expect(clueMap.get('muddy_footprints')).toBe('thomas');
    expect(clueMap.get('camera_photos')).toBe('thomas');
  });

  it('has key evidence correctly flagged', () => {
    const keyEvidence: string[] = [];
    for (const room of caseData.rooms) {
      for (const clue of room.clues) {
        if (clue.is_key_evidence) keyEvidence.push(clue.id);
      }
    }

    expect(keyEvidence).toEqual(
      expect.arrayContaining([
        'perfume_bottle',
        'insurance_docs',
        'crumpled_note',
        'phone_records',
        'camera_photos',
      ])
    );
    expect(keyEvidence.length).toBe(5);
  });

  it('all clues have valid numeric IDs', () => {
    for (const room of caseData.rooms) {
      for (const clue of room.clues) {
        const numId = CLUE_IDS[clue.id];
        expect(numId).toBeDefined();
        expect(numId).toBeGreaterThan(0);
      }
    }
  });

  it('all related_suspect values map to valid suspect IDs or empty', () => {
    for (const room of caseData.rooms) {
      for (const clue of room.clues) {
        if (clue.related_suspect) {
          expect(SUSPECT_IDS[clue.related_suspect]).toBeDefined();
        }
      }
    }
  });
});

// ============================================================================
// Circuit input preparation (unit tests for buildCircuitInputs logic)
// ============================================================================

describe('circuit input preparation', () => {
  it('correctly maps guilty-suspect clue to response_value 1', () => {
    // Victor (1) is guilty, clue related to victor
    const responseValue = computeResponseValue('victor', 'victor');
    expect(responseValue).toBe(1);

    // Verify the numeric IDs are consistent
    const suspectId = SUSPECT_IDS['victor'];
    expect(suspectId).toBe(1);
    const clueId = CLUE_IDS['perfume_bottle'];
    expect(clueId).toBe(1);
  });

  it('correctly maps innocent-suspect clue to response_value 0', () => {
    const responseValue = computeResponseValue('marcus', 'victor');
    expect(responseValue).toBe(0);

    const suspectId = SUSPECT_IDS['marcus'];
    expect(suspectId).toBe(3);
  });

  it('correctly maps no-link clue to response_value 0', () => {
    const responseValue = computeResponseValue('', 'victor');
    expect(responseValue).toBe(0);
  });

  it('all Meridian Manor clues produce valid circuit values', () => {
    for (const room of caseData.rooms) {
      for (const clue of room.clues) {
        const numClueId = CLUE_IDS[clue.id];
        expect(numClueId).toBeDefined();

        const relatedSuspectId = clue.related_suspect
          ? (SUSPECT_IDS[clue.related_suspect] ?? 0)
          : 0;

        // related_suspect should be 0 or a valid suspect number
        expect(relatedSuspectId).toBeGreaterThanOrEqual(0);
        expect(relatedSuspectId).toBeLessThanOrEqual(9);

        const responseValue = computeResponseValue(clue.related_suspect, 'victor');
        expect(responseValue === 0 || responseValue === 1).toBe(true);
      }
    }
  });
});

// ============================================================================
// Response value properties
// ============================================================================

describe('response value properties', () => {
  it('is always 0 or 1', () => {
    const suspects = ['victor', 'elena', 'marcus', 'isabelle', 'thomas', 'priya', 'james', 'celeste', 'ren'];
    for (const guilty of suspects) {
      for (const related of ['', ...suspects]) {
        const val = computeResponseValue(related, guilty);
        expect(val === 0 || val === 1).toBe(true);
      }
    }
  });

  it('exactly one suspect produces response_value 1 for non-empty related', () => {
    const suspects = ['victor', 'elena', 'marcus', 'isabelle', 'thomas', 'priya', 'james', 'celeste', 'ren'];
    for (const related of suspects) {
      let count = 0;
      for (const guilty of suspects) {
        if (computeResponseValue(related, guilty) === 1) count++;
      }
      expect(count).toBe(1); // only when related == guilty
    }
  });

  it('empty related always produces 0', () => {
    const suspects = ['victor', 'elena', 'marcus', 'isabelle', 'thomas', 'priya', 'james', 'celeste', 'ren'];
    for (const guilty of suspects) {
      expect(computeResponseValue('', guilty)).toBe(0);
    }
  });
});
