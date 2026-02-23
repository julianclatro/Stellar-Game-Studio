// F04: Dialogue Engine — Tests
import { describe, it, expect, beforeEach } from 'vitest';
import { DialogueEngine } from '../dialogue-engine';
import { InventoryEngine } from '../inventory-engine';
import type { ClientCaseData, Clue, Suspect } from '../../data/types';
import caseJson from '../../data/cases/meridian-manor.json';

const caseData = caseJson as unknown as ClientCaseData;

function findClue(clueId: string): Clue {
  for (const room of caseData.rooms) {
    const clue = room.clues.find(c => c.id === clueId);
    if (clue) return clue;
  }
  throw new Error(`Test setup: clue "${clueId}" not found`);
}

function findSuspect(suspectId: string): Suspect {
  const suspect = caseData.suspects.find(s => s.id === suspectId);
  if (!suspect) throw new Error(`Test setup: suspect "${suspectId}" not found`);
  return suspect;
}

// Clue references
const perfumeBottle = findClue('perfume_bottle');
const insuranceDocs = findClue('insurance_docs');
const crumpledNote = findClue('crumpled_note');
const phoneRecords = findClue('phone_records');
const medicineBottle = findClue('medicine_bottle');
const missingKnife = findClue('missing_knife');
const cameraPhotos = findClue('camera_photos');
const muddyFootprints = findClue('muddy_footprints');
const tornLetter = findClue('torn_letter');

// Suspect references
const victor = findSuspect('victor');
const elena = findSuspect('elena');
const marcus = findSuspect('marcus');
const isabelle = findSuspect('isabelle');
const thomas = findSuspect('thomas');
const priya = findSuspect('priya');
const james = findSuspect('james');
const celeste = findSuspect('celeste');
const ren = findSuspect('ren');

describe('DialogueEngine', () => {
  let inventory: InventoryEngine;
  let dialogue: DialogueEngine;

  beforeEach(() => {
    inventory = new InventoryEngine();
    dialogue = new DialogueEngine(inventory);
  });

  // --- Default Dialogue ---

  describe('default dialogue', () => {
    it('returns default dialogue when inventory is empty', () => {
      const result = dialogue.resolve(victor);
      expect(result.currentDialogue.state).toBe('default');
      expect(result.currentDialogue.text).toBe(victor.dialogue.default);
      expect(result.currentDialogue.label).toBe('Talk');
    });

    it('always includes default in available options', () => {
      const result = dialogue.resolve(victor);
      expect(result.availableOptions).toHaveLength(1);
      expect(result.availableOptions[0].state).toBe('default');
    });

    it('returns default when inventory has irrelevant clues', () => {
      // Victor's dialogue responds to insurance_docs, crumpled_note, torn_letter
      // Missing knife is not relevant to Victor
      inventory.inspectClue(missingKnife);
      const result = dialogue.resolve(victor);
      expect(result.currentDialogue.state).toBe('default');
    });
  });

  // --- Clue-Triggered Dialogue ---

  describe('clue-triggered dialogue', () => {
    it('unlocks clue-triggered dialogue when relevant clue is collected', () => {
      inventory.inspectClue(insuranceDocs);
      const result = dialogue.resolve(victor);

      const triggered = result.availableOptions.filter(o => o.state === 'clue_triggered');
      expect(triggered).toHaveLength(1);
      expect(triggered[0].triggerKey).toBe('insurance_docs');
      expect(triggered[0].text).toBe(victor.dialogue.clue_triggered['insurance_docs']);
    });

    it('unlocks multiple clue-triggered options', () => {
      inventory.inspectClue(insuranceDocs);
      inventory.inspectClue(crumpledNote);
      inventory.inspectClue(tornLetter);
      const result = dialogue.resolve(victor);

      const triggered = result.availableOptions.filter(o => o.state === 'clue_triggered');
      expect(triggered).toHaveLength(3);
      expect(triggered.map(t => t.triggerKey).sort()).toEqual([
        'crumpled_note', 'insurance_docs', 'torn_letter'
      ]);
    });

    it('labels include clue name', () => {
      inventory.inspectClue(insuranceDocs);
      const result = dialogue.resolve(victor);

      const triggered = result.availableOptions.find(o => o.state === 'clue_triggered');
      expect(triggered!.label).toBe('Show: Insurance Documents');
    });

    it('prioritizes clue-triggered over default', () => {
      inventory.inspectClue(insuranceDocs);
      const result = dialogue.resolve(victor);
      expect(result.currentDialogue.state).toBe('clue_triggered');
    });
  });

  // --- Confrontation Dialogue ---

  describe('confrontation dialogue', () => {
    it('unlocks confrontation when clue combo is satisfied', () => {
      inventory.inspectClue(perfumeBottle);
      inventory.inspectClue(insuranceDocs);
      const result = dialogue.resolve(victor);

      const confrontation = result.availableOptions.filter(o => o.state === 'confrontation');
      expect(confrontation).toHaveLength(1);
      expect(confrontation[0].triggerKey).toBe('perfume_bottle+insurance_docs');
      expect(confrontation[0].text).toContain('You don\'t understand the pressure');
    });

    it('does not unlock confrontation with only one combo clue', () => {
      inventory.inspectClue(perfumeBottle);
      // Missing insurance_docs
      const result = dialogue.resolve(victor);

      const confrontation = result.availableOptions.filter(o => o.state === 'confrontation');
      expect(confrontation).toHaveLength(0);
    });

    it('prioritizes confrontation over clue-triggered', () => {
      inventory.inspectClue(perfumeBottle);
      inventory.inspectClue(insuranceDocs);
      const result = dialogue.resolve(victor);
      expect(result.currentDialogue.state).toBe('confrontation');
    });

    it('confrontation label includes both clue names', () => {
      inventory.inspectClue(perfumeBottle);
      inventory.inspectClue(insuranceDocs);
      const result = dialogue.resolve(victor);

      const confrontation = result.availableOptions.find(o => o.state === 'confrontation');
      expect(confrontation!.label).toContain('Broken Perfume Bottle');
      expect(confrontation!.label).toContain('Insurance Documents');
      expect(confrontation!.label).toMatch(/^Confront:/);
    });
  });

  // --- Priority Ordering ---

  describe('priority ordering', () => {
    it('default < clue_triggered < confrontation', () => {
      // Step 1: default only
      let result = dialogue.resolve(victor);
      expect(result.currentDialogue.state).toBe('default');

      // Step 2: add insurance_docs -> clue_triggered
      inventory.inspectClue(insuranceDocs);
      result = dialogue.resolve(victor);
      expect(result.currentDialogue.state).toBe('clue_triggered');

      // Step 3: add perfume_bottle -> confrontation
      inventory.inspectClue(perfumeBottle);
      result = dialogue.resolve(victor);
      expect(result.currentDialogue.state).toBe('confrontation');
    });

    it('all options remain available regardless of priority', () => {
      inventory.inspectClue(perfumeBottle);
      inventory.inspectClue(insuranceDocs);
      inventory.inspectClue(crumpledNote);
      inventory.inspectClue(tornLetter);

      const result = dialogue.resolve(victor);
      // default + 3 clue_triggered + 1 confrontation = 5
      expect(result.availableOptions).toHaveLength(5);
      expect(result.availableOptions.filter(o => o.state === 'default')).toHaveLength(1);
      expect(result.availableOptions.filter(o => o.state === 'clue_triggered')).toHaveLength(3);
      expect(result.availableOptions.filter(o => o.state === 'confrontation')).toHaveLength(1);
    });
  });

  // --- Dialogue History ---

  describe('dialogue history', () => {
    it('starts with no seen dialogue', () => {
      const history = dialogue.getHistory('victor');
      expect(history.seenDefault).toBe(false);
      expect(history.seenClueTriggered.size).toBe(0);
      expect(history.seenConfrontations.size).toBe(0);
    });

    it('marks default as seen', () => {
      const result = dialogue.resolve(victor);
      dialogue.markSeen('victor', result.currentDialogue);
      const history = dialogue.getHistory('victor');
      expect(history.seenDefault).toBe(true);
    });

    it('marks clue-triggered as seen', () => {
      inventory.inspectClue(insuranceDocs);
      const result = dialogue.resolve(victor);
      const triggered = result.availableOptions.find(o => o.state === 'clue_triggered')!;
      dialogue.markSeen('victor', triggered);

      const history = dialogue.getHistory('victor');
      expect(history.seenClueTriggered.has('insurance_docs')).toBe(true);
    });

    it('marks confrontation as seen', () => {
      inventory.inspectClue(perfumeBottle);
      inventory.inspectClue(insuranceDocs);
      const result = dialogue.resolve(victor);
      const confront = result.availableOptions.find(o => o.state === 'confrontation')!;
      dialogue.markSeen('victor', confront);

      const history = dialogue.getHistory('victor');
      expect(history.seenConfrontations.has('perfume_bottle+insurance_docs')).toBe(true);
    });

    it('tracks seen count', () => {
      expect(dialogue.getSeenCount('victor')).toBe(0);

      const defaultOpt = dialogue.resolve(victor).currentDialogue;
      dialogue.markSeen('victor', defaultOpt);
      expect(dialogue.getSeenCount('victor')).toBe(1);

      inventory.inspectClue(insuranceDocs);
      const triggered = dialogue.resolve(victor).availableOptions
        .find(o => o.state === 'clue_triggered')!;
      dialogue.markSeen('victor', triggered);
      expect(dialogue.getSeenCount('victor')).toBe(2);
    });

    it('hasNewDialogue detects unseen options', () => {
      // Initially, default is unseen
      expect(dialogue.hasUnseenDialogue(victor)).toBe(true);

      // Mark default as seen
      const defaultOpt = dialogue.resolve(victor).currentDialogue;
      dialogue.markSeen('victor', defaultOpt);
      expect(dialogue.hasUnseenDialogue(victor)).toBe(false);

      // Add a clue -> new unseen option appears
      inventory.inspectClue(insuranceDocs);
      expect(dialogue.hasUnseenDialogue(victor)).toBe(true);
    });
  });

  // --- getSuspectsWithConfrontations ---

  describe('getSuspectsWithConfrontations', () => {
    it('returns empty when no confrontations available', () => {
      const result = dialogue.getSuspectsWithConfrontations(caseData.suspects);
      expect(result).toHaveLength(0);
    });

    it('returns suspects with available confrontations', () => {
      inventory.inspectClue(perfumeBottle);
      inventory.inspectClue(insuranceDocs);

      const result = dialogue.getSuspectsWithConfrontations(caseData.suspects);
      expect(result.map(s => s.id)).toContain('victor');
    });

    it('excludes suspects whose confrontations are already seen', () => {
      inventory.inspectClue(perfumeBottle);
      inventory.inspectClue(insuranceDocs);

      // Mark Victor's confrontation as seen
      const victorResult = dialogue.resolve(victor);
      const confront = victorResult.availableOptions.find(o => o.state === 'confrontation')!;
      dialogue.markSeen('victor', confront);

      const result = dialogue.getSuspectsWithConfrontations(caseData.suspects);
      expect(result.map(s => s.id)).not.toContain('victor');
    });
  });

  // --- Reset ---

  describe('reset', () => {
    it('clears all dialogue history', () => {
      const defaultOpt = dialogue.resolve(victor).currentDialogue;
      dialogue.markSeen('victor', defaultOpt);
      expect(dialogue.getSeenCount('victor')).toBe(1);

      dialogue.reset();
      expect(dialogue.getSeenCount('victor')).toBe(0);
    });
  });

  // --- Meridian Manor: All 9 Suspects ---

  describe('Meridian Manor suspects', () => {
    it('Victor: 3 clue_triggered + 1 confrontation', () => {
      inventory.inspectClue(insuranceDocs);
      inventory.inspectClue(crumpledNote);
      inventory.inspectClue(tornLetter);
      inventory.inspectClue(perfumeBottle);

      const result = dialogue.resolve(victor);
      expect(result.availableOptions.filter(o => o.state === 'clue_triggered')).toHaveLength(3);
      expect(result.availableOptions.filter(o => o.state === 'confrontation')).toHaveLength(1);
    });

    it('Elena: 2 clue_triggered + 0 confrontation', () => {
      inventory.inspectClue(missingKnife);
      inventory.inspectClue(findClue('wine_glass'));

      const result = dialogue.resolve(elena);
      expect(result.availableOptions.filter(o => o.state === 'clue_triggered')).toHaveLength(2);
      expect(result.availableOptions.filter(o => o.state === 'confrontation')).toHaveLength(0);
    });

    it('Marcus: 2 clue_triggered + 1 confrontation', () => {
      inventory.inspectClue(phoneRecords);
      inventory.inspectClue(medicineBottle);

      const result = dialogue.resolve(marcus);
      expect(result.availableOptions.filter(o => o.state === 'clue_triggered')).toHaveLength(2);
      expect(result.availableOptions.filter(o => o.state === 'confrontation')).toHaveLength(1);
      expect(result.currentDialogue.text).toContain('I saw Victor coming from the bedroom');
    });

    it('Isabelle: 2 clue_triggered + 0 confrontation', () => {
      inventory.inspectClue(perfumeBottle);
      inventory.inspectClue(findClue('smudged_fingerprints'));

      const result = dialogue.resolve(isabelle);
      expect(result.availableOptions.filter(o => o.state === 'clue_triggered')).toHaveLength(2);
      expect(result.availableOptions.filter(o => o.state === 'confrontation')).toHaveLength(0);
    });

    it('Thomas: 2 clue_triggered + 1 confrontation', () => {
      inventory.inspectClue(cameraPhotos);
      inventory.inspectClue(muddyFootprints);

      const result = dialogue.resolve(thomas);
      expect(result.availableOptions.filter(o => o.state === 'clue_triggered')).toHaveLength(2);
      expect(result.availableOptions.filter(o => o.state === 'confrontation')).toHaveLength(1);
      expect(result.currentDialogue.text).toContain('sneaking a cigarette');
    });

    it('Priya: 1 clue_triggered + 0 confrontation', () => {
      inventory.inspectClue(insuranceDocs);

      const result = dialogue.resolve(priya);
      expect(result.availableOptions.filter(o => o.state === 'clue_triggered')).toHaveLength(1);
      expect(result.availableOptions.filter(o => o.state === 'confrontation')).toHaveLength(0);
    });

    it('James: 2 clue_triggered + 1 confrontation', () => {
      inventory.inspectClue(insuranceDocs);
      inventory.inspectClue(crumpledNote);

      const result = dialogue.resolve(james);
      expect(result.availableOptions.filter(o => o.state === 'clue_triggered')).toHaveLength(2);
      expect(result.availableOptions.filter(o => o.state === 'confrontation')).toHaveLength(1);
      expect(result.currentDialogue.text).toContain('smelling of something chemical');
    });

    it('Celeste: 2 clue_triggered + 0 confrontation', () => {
      inventory.inspectClue(medicineBottle);
      inventory.inspectClue(tornLetter);

      const result = dialogue.resolve(celeste);
      expect(result.availableOptions.filter(o => o.state === 'clue_triggered')).toHaveLength(2);
      expect(result.availableOptions.filter(o => o.state === 'confrontation')).toHaveLength(0);
    });

    it('Ren: 2 clue_triggered + 0 confrontation', () => {
      inventory.inspectClue(cameraPhotos);
      inventory.inspectClue(muddyFootprints);

      const result = dialogue.resolve(ren);
      expect(result.availableOptions.filter(o => o.state === 'clue_triggered')).toHaveLength(2);
      expect(result.availableOptions.filter(o => o.state === 'confrontation')).toHaveLength(0);
    });

    it('suspects with confrontation are Victor, Marcus, Thomas, James', () => {
      // Collect all clues to unlock all confrontations
      for (const room of caseData.rooms) {
        for (const clue of room.clues) {
          inventory.inspectClue(clue);
        }
      }

      const withConfrontation = caseData.suspects.filter(s =>
        Object.keys(s.dialogue.confrontation).length > 0
      );
      expect(withConfrontation.map(s => s.id).sort()).toEqual([
        'james', 'marcus', 'thomas', 'victor'
      ]);

      // All confrontations should be available
      for (const suspect of withConfrontation) {
        const result = dialogue.resolve(suspect);
        expect(result.availableOptions.filter(o => o.state === 'confrontation').length)
          .toBeGreaterThan(0);
      }
    });

    it('suspects without confrontation are Elena, Isabelle, Priya, Celeste, Ren', () => {
      const withoutConfrontation = caseData.suspects.filter(s =>
        Object.keys(s.dialogue.confrontation).length === 0
      );
      expect(withoutConfrontation.map(s => s.id).sort()).toEqual([
        'celeste', 'elena', 'isabelle', 'priya', 'ren'
      ]);
    });
  });

  // --- Investigation Flow Simulation ---

  describe('investigation flow', () => {
    it('simulates a realistic investigation progression', () => {
      // Step 1: Talk to Victor with no clues -> default
      let result = dialogue.resolve(victor);
      expect(result.currentDialogue.state).toBe('default');
      dialogue.markSeen('victor', result.currentDialogue);

      // Step 2: Find insurance docs in the study
      inventory.inspectClue(insuranceDocs);

      // Step 3: Show insurance docs to Victor -> clue_triggered
      result = dialogue.resolve(victor);
      expect(result.currentDialogue.state).toBe('clue_triggered');
      expect(result.hasNewDialogue).toBe(true);

      const triggered = result.availableOptions.find(
        o => o.state === 'clue_triggered' && o.triggerKey === 'insurance_docs'
      )!;
      dialogue.markSeen('victor', triggered);

      // Step 4: Find perfume bottle in the bedroom
      inventory.inspectClue(perfumeBottle);

      // Step 5: Confront Victor with perfume_bottle + insurance_docs
      result = dialogue.resolve(victor);
      expect(result.currentDialogue.state).toBe('confrontation');
      expect(result.hasNewDialogue).toBe(true);
      expect(result.currentDialogue.text).toContain('pressure I was under');
    });

    it('shows Marcus as key witness when phone records are found', () => {
      inventory.inspectClue(phoneRecords);
      const result = dialogue.resolve(marcus);
      expect(result.currentDialogue.state).toBe('clue_triggered');
      expect(result.currentDialogue.text).toContain('Two minutes');
    });

    it('James reveals Victor left the study', () => {
      inventory.inspectClue(insuranceDocs);
      const result = dialogue.resolve(james);
      const triggered = result.availableOptions.find(
        o => o.triggerKey === 'insurance_docs'
      )!;
      expect(triggered.text).toContain('stepped out');
    });
  });
});
