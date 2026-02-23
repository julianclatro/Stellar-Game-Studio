import { describe, it, expect } from 'vitest';
import { generateCommitment, commitmentToHex, verifyCommitment } from '../commitment';
import type { Solution } from '../types';

const CORRECT_SOLUTION: Solution = {
  suspect: 'victor',
  weapon: 'poison_vial',
  room: 'bedroom',
};

const SALT = 'meridian_manor_salt_v1';

describe('Commitment', () => {
  describe('generateCommitment', () => {
    it('produces a 32-byte hash', () => {
      const commitment = generateCommitment(CORRECT_SOLUTION, SALT);
      expect(commitment).toBeInstanceOf(Uint8Array);
      expect(commitment.length).toBe(32);
    });

    it('is deterministic (same input → same output)', () => {
      const a = generateCommitment(CORRECT_SOLUTION, SALT);
      const b = generateCommitment(CORRECT_SOLUTION, SALT);
      expect(a).toEqual(b);
    });

    it('different suspects produce different hashes', () => {
      const wrongSuspect: Solution = { ...CORRECT_SOLUTION, suspect: 'elena' };
      const a = generateCommitment(CORRECT_SOLUTION, SALT);
      const b = generateCommitment(wrongSuspect, SALT);
      expect(a).not.toEqual(b);
    });

    it('different weapons produce different hashes', () => {
      const wrongWeapon: Solution = { ...CORRECT_SOLUTION, weapon: 'kitchen_knife' };
      const a = generateCommitment(CORRECT_SOLUTION, SALT);
      const b = generateCommitment(wrongWeapon, SALT);
      expect(a).not.toEqual(b);
    });

    it('different rooms produce different hashes', () => {
      const wrongRoom: Solution = { ...CORRECT_SOLUTION, room: 'kitchen' };
      const a = generateCommitment(CORRECT_SOLUTION, SALT);
      const b = generateCommitment(wrongRoom, SALT);
      expect(a).not.toEqual(b);
    });

    it('different salts produce different hashes', () => {
      const a = generateCommitment(CORRECT_SOLUTION, SALT);
      const b = generateCommitment(CORRECT_SOLUTION, 'different_salt');
      expect(a).not.toEqual(b);
    });
  });

  describe('commitmentToHex', () => {
    it('returns a 0x-prefixed hex string', () => {
      const commitment = generateCommitment(CORRECT_SOLUTION, SALT);
      const hex = commitmentToHex(commitment);
      expect(hex).toMatch(/^0x[0-9a-f]{64}$/);
    });

    it('is deterministic', () => {
      const a = commitmentToHex(generateCommitment(CORRECT_SOLUTION, SALT));
      const b = commitmentToHex(generateCommitment(CORRECT_SOLUTION, SALT));
      expect(a).toBe(b);
    });
  });

  describe('verifyCommitment', () => {
    it('returns true for matching solution + salt', () => {
      const commitment = generateCommitment(CORRECT_SOLUTION, SALT);
      expect(verifyCommitment(CORRECT_SOLUTION, SALT, commitment)).toBe(true);
    });

    it('returns false for wrong suspect', () => {
      const commitment = generateCommitment(CORRECT_SOLUTION, SALT);
      const wrong: Solution = { ...CORRECT_SOLUTION, suspect: 'elena' };
      expect(verifyCommitment(wrong, SALT, commitment)).toBe(false);
    });

    it('returns false for wrong weapon', () => {
      const commitment = generateCommitment(CORRECT_SOLUTION, SALT);
      const wrong: Solution = { ...CORRECT_SOLUTION, weapon: 'kitchen_knife' };
      expect(verifyCommitment(wrong, SALT, commitment)).toBe(false);
    });

    it('returns false for wrong room', () => {
      const commitment = generateCommitment(CORRECT_SOLUTION, SALT);
      const wrong: Solution = { ...CORRECT_SOLUTION, room: 'kitchen' };
      expect(verifyCommitment(wrong, SALT, commitment)).toBe(false);
    });

    it('returns false for wrong salt', () => {
      const commitment = generateCommitment(CORRECT_SOLUTION, SALT);
      expect(verifyCommitment(CORRECT_SOLUTION, 'wrong_salt', commitment)).toBe(false);
    });
  });
});
