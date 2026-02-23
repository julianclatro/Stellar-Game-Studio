// F05: Accusation System — Accusation Engine
// Manages the accusation flow: selection, validation, submission, and result tracking.

import type { ClientCaseData } from '../data/types';
import { getWeaponId } from '../data/types';

export type AccusationStatus = 'idle' | 'selecting' | 'confirming' | 'submitting' | 'resolved';
export type AccusationResult = 'correct' | 'incorrect';

export class AccusationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccusationError';
  }
}

/** A single accusation attempt */
export interface Accusation {
  suspect: string;
  weapon: string;
  room: string;
}

/** Record of a completed accusation attempt */
export interface AccusationAttempt {
  accusation: Accusation;
  result: AccusationResult;
  attemptNumber: number;
}

export class AccusationEngine {
  private caseData: ClientCaseData;
  private status: AccusationStatus = 'idle';
  private currentAccusation: Partial<Accusation> = {};
  private attempts: AccusationAttempt[] = [];
  private solved: boolean = false;

  // Valid choices derived from case data
  private validSuspects: Set<string>;
  private validWeapons: Set<string>;
  private validRooms: Set<string>;

  constructor(caseData: ClientCaseData) {
    this.caseData = caseData;
    this.validSuspects = new Set(caseData.suspects.map(s => s.id));
    this.validWeapons = new Set(caseData.weapons.map(getWeaponId));
    this.validRooms = new Set(caseData.rooms.map(r => r.id));
  }

  /** Get the current status of the accusation flow */
  getStatus(): AccusationStatus {
    return this.status;
  }

  /** Whether the case has been solved */
  isSolved(): boolean {
    return this.solved;
  }

  /** Start the accusation flow (open modal) */
  beginAccusation(): void {
    if (this.solved) {
      throw new AccusationError('Case already solved');
    }
    this.status = 'selecting';
    this.currentAccusation = {};
  }

  /** Cancel the accusation flow (close modal) */
  cancelAccusation(): void {
    this.status = 'idle';
    this.currentAccusation = {};
  }

  /** Set the accused suspect */
  selectSuspect(suspectId: string): void {
    if (this.status !== 'selecting') {
      throw new AccusationError('Not in selection mode');
    }
    if (!this.validSuspects.has(suspectId)) {
      throw new AccusationError(`Invalid suspect: "${suspectId}"`);
    }
    this.currentAccusation.suspect = suspectId;
  }

  /** Set the accused weapon */
  selectWeapon(weaponId: string): void {
    if (this.status !== 'selecting') {
      throw new AccusationError('Not in selection mode');
    }
    if (!this.validWeapons.has(weaponId)) {
      throw new AccusationError(`Invalid weapon: "${weaponId}"`);
    }
    this.currentAccusation.weapon = weaponId;
  }

  /** Set the accused room */
  selectRoom(roomId: string): void {
    if (this.status !== 'selecting') {
      throw new AccusationError('Not in selection mode');
    }
    if (!this.validRooms.has(roomId)) {
      throw new AccusationError(`Invalid room: "${roomId}"`);
    }
    this.currentAccusation.room = roomId;
  }

  /** Get the current partial accusation */
  getCurrentAccusation(): Partial<Accusation> {
    return { ...this.currentAccusation };
  }

  /** Check if all three selections have been made */
  isComplete(): boolean {
    return !!(
      this.currentAccusation.suspect &&
      this.currentAccusation.weapon &&
      this.currentAccusation.room
    );
  }

  /** Move to confirmation step. Requires all three selections. */
  confirm(): Accusation {
    if (this.status !== 'selecting') {
      throw new AccusationError('Not in selection mode');
    }
    if (!this.isComplete()) {
      const missing: string[] = [];
      if (!this.currentAccusation.suspect) missing.push('suspect');
      if (!this.currentAccusation.weapon) missing.push('weapon');
      if (!this.currentAccusation.room) missing.push('room');
      throw new AccusationError(`Incomplete accusation: missing ${missing.join(', ')}`);
    }

    this.status = 'confirming';
    return this.currentAccusation as Accusation;
  }

  /** Go back to selection from confirmation */
  unconfirm(): void {
    if (this.status !== 'confirming') {
      throw new AccusationError('Not in confirmation mode');
    }
    this.status = 'selecting';
  }

  /**
   * Submit the accusation. Returns the finalized Accusation.
   * The caller is responsible for ZK proof generation + on-chain verification.
   * Call resolveResult() after verification completes.
   */
  submit(): Accusation {
    if (this.status !== 'confirming') {
      throw new AccusationError('Must confirm before submitting');
    }

    this.status = 'submitting';
    return this.currentAccusation as Accusation;
  }

  /**
   * Record the result of the accusation (from ZK verification).
   * This should be called after the proof is verified.
   */
  resolveResult(result: AccusationResult): AccusationAttempt {
    if (this.status !== 'submitting') {
      throw new AccusationError('No accusation pending');
    }

    const attempt: AccusationAttempt = {
      accusation: { ...this.currentAccusation as Accusation },
      result,
      attemptNumber: this.attempts.length + 1,
    };

    this.attempts.push(attempt);

    if (result === 'correct') {
      this.solved = true;
      this.status = 'resolved';
    } else {
      this.status = 'idle';
      this.currentAccusation = {};
    }

    return attempt;
  }

  /** Get the number of wrong accusations */
  getWrongAccusationCount(): number {
    return this.attempts.filter(a => a.result === 'incorrect').length;
  }

  /** Get the total number of accusation attempts */
  getTotalAttempts(): number {
    return this.attempts.length;
  }

  /** Get all accusation attempts */
  getAttempts(): ReadonlyArray<AccusationAttempt> {
    return this.attempts;
  }

  /** Get the last attempt, or undefined if none */
  getLastAttempt(): AccusationAttempt | undefined {
    return this.attempts[this.attempts.length - 1];
  }

  /** Check if a specific accusation was already tried */
  wasAlreadyTried(accusation: Accusation): boolean {
    return this.attempts.some(
      a =>
        a.accusation.suspect === accusation.suspect &&
        a.accusation.weapon === accusation.weapon &&
        a.accusation.room === accusation.room
    );
  }

  /** Get valid suspect choices (id + name pairs) */
  getSuspectChoices(): Array<{ id: string; name: string }> {
    return this.caseData.suspects.map(s => ({ id: s.id, name: s.name }));
  }

  /** Get valid weapon choices */
  getWeaponChoices(): string[] {
    return this.caseData.weapons.map(getWeaponId);
  }

  /** Get valid room choices (id + name pairs) */
  getRoomChoices(): Array<{ id: string; name: string }> {
    return this.caseData.rooms.map(r => ({ id: r.id, name: r.name }));
  }

  /** Reset the engine (for new game) */
  reset(): void {
    this.status = 'idle';
    this.currentAccusation = {};
    this.attempts = [];
    this.solved = false;
  }
}
