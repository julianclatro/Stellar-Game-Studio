// F05: Accusation System — Tests
import { describe, it, expect, beforeEach } from 'vitest';
import { AccusationEngine, AccusationError } from '../accusation-engine';
import type { ClientCaseData } from '../../data/types';
import caseJson from '../../data/cases/meridian-manor.json';

const caseData = caseJson as unknown as ClientCaseData;

describe('AccusationEngine', () => {
  let engine: AccusationEngine;

  beforeEach(() => {
    engine = new AccusationEngine(caseData);
  });

  // --- Initial State ---

  describe('initial state', () => {
    it('starts in idle status', () => {
      expect(engine.getStatus()).toBe('idle');
    });

    it('starts unsolved', () => {
      expect(engine.isSolved()).toBe(false);
    });

    it('starts with zero attempts', () => {
      expect(engine.getTotalAttempts()).toBe(0);
      expect(engine.getWrongAccusationCount()).toBe(0);
    });

    it('has no last attempt', () => {
      expect(engine.getLastAttempt()).toBeUndefined();
    });
  });

  // --- Valid Choices ---

  describe('choices', () => {
    it('lists all 9 suspects', () => {
      const suspects = engine.getSuspectChoices();
      expect(suspects).toHaveLength(9);
      expect(suspects.map(s => s.id).sort()).toEqual([
        'celeste', 'elena', 'isabelle', 'james', 'marcus',
        'priya', 'ren', 'thomas', 'victor'
      ]);
    });

    it('suspects include names', () => {
      const suspects = engine.getSuspectChoices();
      const victor = suspects.find(s => s.id === 'victor');
      expect(victor!.name).toBe('Victor Ashford');
    });

    it('lists all 5 weapons', () => {
      const weapons = engine.getWeaponChoices();
      expect(weapons).toHaveLength(5);
      expect(weapons.sort()).toEqual([
        'candlestick', 'garden_shears', 'kitchen_knife',
        'letter_opener', 'poison_vial'
      ]);
    });

    it('lists all 5 rooms', () => {
      const rooms = engine.getRoomChoices();
      expect(rooms).toHaveLength(5);
      expect(rooms.map(r => r.id).sort()).toEqual([
        'bedroom', 'garden', 'kitchen', 'lounge', 'study'
      ]);
    });

    it('rooms include names', () => {
      const rooms = engine.getRoomChoices();
      const bedroom = rooms.find(r => r.id === 'bedroom');
      expect(bedroom!.name).toBe('The Bedroom');
    });
  });

  // --- Selection Flow ---

  describe('selection flow', () => {
    it('transitions to selecting on beginAccusation', () => {
      engine.beginAccusation();
      expect(engine.getStatus()).toBe('selecting');
    });

    it('can select suspect, weapon, room', () => {
      engine.beginAccusation();
      engine.selectSuspect('victor');
      engine.selectWeapon('poison_vial');
      engine.selectRoom('bedroom');

      const accusation = engine.getCurrentAccusation();
      expect(accusation.suspect).toBe('victor');
      expect(accusation.weapon).toBe('poison_vial');
      expect(accusation.room).toBe('bedroom');
    });

    it('reports incomplete when missing selections', () => {
      engine.beginAccusation();
      engine.selectSuspect('victor');
      expect(engine.isComplete()).toBe(false);

      engine.selectWeapon('poison_vial');
      expect(engine.isComplete()).toBe(false);

      engine.selectRoom('bedroom');
      expect(engine.isComplete()).toBe(true);
    });

    it('can change selections', () => {
      engine.beginAccusation();
      engine.selectSuspect('victor');
      engine.selectSuspect('elena');
      expect(engine.getCurrentAccusation().suspect).toBe('elena');
    });

    it('rejects invalid suspect', () => {
      engine.beginAccusation();
      expect(() => engine.selectSuspect('nobody')).toThrow(AccusationError);
      expect(() => engine.selectSuspect('nobody')).toThrow(/Invalid suspect/);
    });

    it('rejects invalid weapon', () => {
      engine.beginAccusation();
      expect(() => engine.selectWeapon('laser_gun')).toThrow(AccusationError);
    });

    it('rejects invalid room', () => {
      engine.beginAccusation();
      expect(() => engine.selectRoom('dungeon')).toThrow(AccusationError);
    });

    it('rejects selection when not in selecting mode', () => {
      expect(() => engine.selectSuspect('victor')).toThrow(AccusationError);
      expect(() => engine.selectSuspect('victor')).toThrow(/Not in selection mode/);
    });

    it('can cancel and return to idle', () => {
      engine.beginAccusation();
      engine.selectSuspect('victor');
      engine.cancelAccusation();
      expect(engine.getStatus()).toBe('idle');
      expect(engine.getCurrentAccusation()).toEqual({});
    });
  });

  // --- Confirmation Flow ---

  describe('confirmation', () => {
    beforeEach(() => {
      engine.beginAccusation();
      engine.selectSuspect('victor');
      engine.selectWeapon('poison_vial');
      engine.selectRoom('bedroom');
    });

    it('transitions to confirming', () => {
      const accusation = engine.confirm();
      expect(engine.getStatus()).toBe('confirming');
      expect(accusation).toEqual({
        suspect: 'victor',
        weapon: 'poison_vial',
        room: 'bedroom',
      });
    });

    it('rejects confirm when incomplete', () => {
      engine.cancelAccusation();
      engine.beginAccusation();
      engine.selectSuspect('victor');
      // missing weapon and room
      expect(() => engine.confirm()).toThrow(AccusationError);
      expect(() => engine.confirm()).toThrow(/missing weapon, room/);
    });

    it('can go back to selecting from confirming', () => {
      engine.confirm();
      engine.unconfirm();
      expect(engine.getStatus()).toBe('selecting');
      // Selections should be preserved
      expect(engine.getCurrentAccusation().suspect).toBe('victor');
    });

    it('rejects unconfirm when not confirming', () => {
      expect(() => engine.unconfirm()).toThrow(AccusationError);
    });
  });

  // --- Submission Flow ---

  describe('submission', () => {
    beforeEach(() => {
      engine.beginAccusation();
      engine.selectSuspect('victor');
      engine.selectWeapon('poison_vial');
      engine.selectRoom('bedroom');
      engine.confirm();
    });

    it('transitions to submitting', () => {
      const accusation = engine.submit();
      expect(engine.getStatus()).toBe('submitting');
      expect(accusation).toEqual({
        suspect: 'victor',
        weapon: 'poison_vial',
        room: 'bedroom',
      });
    });

    it('rejects submit when not confirmed', () => {
      engine.unconfirm();
      expect(() => engine.submit()).toThrow(AccusationError);
      expect(() => engine.submit()).toThrow(/Must confirm/);
    });
  });

  // --- Result Resolution ---

  describe('result resolution', () => {
    function makeAccusation(suspect: string, weapon: string, room: string) {
      engine.beginAccusation();
      engine.selectSuspect(suspect);
      engine.selectWeapon(weapon);
      engine.selectRoom(room);
      engine.confirm();
      engine.submit();
    }

    it('resolves correct accusation', () => {
      makeAccusation('victor', 'poison_vial', 'bedroom');
      const attempt = engine.resolveResult('correct');

      expect(attempt.result).toBe('correct');
      expect(attempt.attemptNumber).toBe(1);
      expect(engine.isSolved()).toBe(true);
      expect(engine.getStatus()).toBe('resolved');
    });

    it('resolves incorrect accusation', () => {
      makeAccusation('elena', 'kitchen_knife', 'kitchen');
      const attempt = engine.resolveResult('incorrect');

      expect(attempt.result).toBe('incorrect');
      expect(attempt.attemptNumber).toBe(1);
      expect(engine.isSolved()).toBe(false);
      expect(engine.getStatus()).toBe('idle'); // back to idle
    });

    it('tracks wrong accusation count', () => {
      makeAccusation('elena', 'kitchen_knife', 'kitchen');
      engine.resolveResult('incorrect');
      expect(engine.getWrongAccusationCount()).toBe(1);

      makeAccusation('marcus', 'candlestick', 'lounge');
      engine.resolveResult('incorrect');
      expect(engine.getWrongAccusationCount()).toBe(2);
    });

    it('tracks total attempts', () => {
      makeAccusation('elena', 'kitchen_knife', 'kitchen');
      engine.resolveResult('incorrect');

      makeAccusation('victor', 'poison_vial', 'bedroom');
      engine.resolveResult('correct');

      expect(engine.getTotalAttempts()).toBe(2);
      expect(engine.getWrongAccusationCount()).toBe(1);
    });

    it('records attempt history', () => {
      makeAccusation('elena', 'kitchen_knife', 'kitchen');
      engine.resolveResult('incorrect');

      makeAccusation('victor', 'poison_vial', 'bedroom');
      engine.resolveResult('correct');

      const attempts = engine.getAttempts();
      expect(attempts).toHaveLength(2);
      expect(attempts[0].accusation.suspect).toBe('elena');
      expect(attempts[0].result).toBe('incorrect');
      expect(attempts[1].accusation.suspect).toBe('victor');
      expect(attempts[1].result).toBe('correct');
    });

    it('returns last attempt', () => {
      makeAccusation('elena', 'kitchen_knife', 'kitchen');
      engine.resolveResult('incorrect');

      const last = engine.getLastAttempt();
      expect(last!.accusation.suspect).toBe('elena');
      expect(last!.result).toBe('incorrect');
    });

    it('prevents new accusations after solve', () => {
      makeAccusation('victor', 'poison_vial', 'bedroom');
      engine.resolveResult('correct');

      expect(() => engine.beginAccusation()).toThrow(AccusationError);
      expect(() => engine.beginAccusation()).toThrow(/already solved/);
    });

    it('rejects resolveResult when not submitting', () => {
      expect(() => engine.resolveResult('correct')).toThrow(AccusationError);
      expect(() => engine.resolveResult('correct')).toThrow(/No accusation pending/);
    });
  });

  // --- Duplicate Detection ---

  describe('duplicate detection', () => {
    function makeAndResolve(suspect: string, weapon: string, room: string) {
      engine.beginAccusation();
      engine.selectSuspect(suspect);
      engine.selectWeapon(weapon);
      engine.selectRoom(room);
      engine.confirm();
      engine.submit();
      engine.resolveResult('incorrect');
    }

    it('detects previously tried accusation', () => {
      makeAndResolve('elena', 'kitchen_knife', 'kitchen');

      expect(engine.wasAlreadyTried({
        suspect: 'elena',
        weapon: 'kitchen_knife',
        room: 'kitchen',
      })).toBe(true);
    });

    it('does not flag untried accusation', () => {
      makeAndResolve('elena', 'kitchen_knife', 'kitchen');

      expect(engine.wasAlreadyTried({
        suspect: 'victor',
        weapon: 'poison_vial',
        room: 'bedroom',
      })).toBe(false);
    });

    it('partial match is not a duplicate', () => {
      makeAndResolve('elena', 'kitchen_knife', 'kitchen');

      // Same suspect, different weapon
      expect(engine.wasAlreadyTried({
        suspect: 'elena',
        weapon: 'candlestick',
        room: 'kitchen',
      })).toBe(false);
    });
  });

  // --- Reset ---

  describe('reset', () => {
    it('clears all state', () => {
      engine.beginAccusation();
      engine.selectSuspect('victor');
      engine.selectWeapon('poison_vial');
      engine.selectRoom('bedroom');
      engine.confirm();
      engine.submit();
      engine.resolveResult('correct');

      engine.reset();

      expect(engine.getStatus()).toBe('idle');
      expect(engine.isSolved()).toBe(false);
      expect(engine.getTotalAttempts()).toBe(0);
      expect(engine.getWrongAccusationCount()).toBe(0);
      expect(engine.getCurrentAccusation()).toEqual({});
    });

    it('allows new accusations after reset', () => {
      engine.beginAccusation();
      engine.selectSuspect('victor');
      engine.selectWeapon('poison_vial');
      engine.selectRoom('bedroom');
      engine.confirm();
      engine.submit();
      engine.resolveResult('correct');

      engine.reset();
      engine.beginAccusation(); // should not throw
      expect(engine.getStatus()).toBe('selecting');
    });
  });

  // --- Full Game Flow Simulation ---

  describe('full game flow', () => {
    it('simulates investigation with wrong guesses then correct', () => {
      // First attempt: wrong suspect
      engine.beginAccusation();
      engine.selectSuspect('elena');
      engine.selectWeapon('poison_vial');
      engine.selectRoom('bedroom');
      engine.confirm();
      engine.submit();
      engine.resolveResult('incorrect');
      expect(engine.getWrongAccusationCount()).toBe(1);
      expect(engine.isSolved()).toBe(false);

      // Second attempt: wrong weapon
      engine.beginAccusation();
      engine.selectSuspect('victor');
      engine.selectWeapon('kitchen_knife');
      engine.selectRoom('bedroom');
      engine.confirm();
      engine.submit();
      engine.resolveResult('incorrect');
      expect(engine.getWrongAccusationCount()).toBe(2);

      // Third attempt: correct!
      engine.beginAccusation();
      engine.selectSuspect('victor');
      engine.selectWeapon('poison_vial');
      engine.selectRoom('bedroom');
      engine.confirm();
      engine.submit();
      engine.resolveResult('correct');
      expect(engine.isSolved()).toBe(true);
      expect(engine.getWrongAccusationCount()).toBe(2);
      expect(engine.getTotalAttempts()).toBe(3);
    });

    it('cancel and retry flow', () => {
      engine.beginAccusation();
      engine.selectSuspect('elena');
      engine.cancelAccusation();
      expect(engine.getStatus()).toBe('idle');
      expect(engine.getTotalAttempts()).toBe(0);

      // Start over
      engine.beginAccusation();
      engine.selectSuspect('victor');
      engine.selectWeapon('poison_vial');
      engine.selectRoom('bedroom');
      engine.confirm();
      engine.submit();
      engine.resolveResult('correct');
      expect(engine.isSolved()).toBe(true);
    });

    it('confirm-unconfirm-reselect flow', () => {
      engine.beginAccusation();
      engine.selectSuspect('elena');
      engine.selectWeapon('kitchen_knife');
      engine.selectRoom('kitchen');
      engine.confirm();

      // Player changes their mind
      engine.unconfirm();
      engine.selectSuspect('victor');
      engine.selectWeapon('poison_vial');
      engine.selectRoom('bedroom');
      engine.confirm();
      engine.submit();
      engine.resolveResult('correct');
      expect(engine.isSolved()).toBe(true);
    });
  });
});
