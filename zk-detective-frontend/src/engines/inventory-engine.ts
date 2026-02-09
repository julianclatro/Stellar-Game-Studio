// F03: Inventory System — Inventory Engine
// Manages clue collection, inspection tracking, and inventory queries.

import type { Clue } from '../data/types';

export class InventoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InventoryError';
  }
}

export interface InspectionResult {
  clue: Clue;
  isNew: boolean;
  totalCollected: number;
}

export class InventoryEngine {
  private collectedClues: Clue[] = [];
  private collectedIds: Set<string> = new Set();
  private inspectionOrder: string[] = [];

  /** Inspect a clue and add it to inventory. Returns inspection result. */
  inspectClue(clue: Clue): InspectionResult {
    const isNew = !this.collectedIds.has(clue.id);

    if (isNew) {
      this.collectedIds.add(clue.id);
      this.collectedClues.push(clue);
      this.inspectionOrder.push(clue.id);
    }

    return {
      clue,
      isNew,
      totalCollected: this.collectedClues.length,
    };
  }

  /** Check if a clue has been collected */
  hasClue(clueId: string): boolean {
    return this.collectedIds.has(clueId);
  }

  /** Get all collected clues in order of collection */
  getCollectedClues(): ReadonlyArray<Clue> {
    return this.collectedClues;
  }

  /** Get collected clue IDs in order of collection */
  getCollectedClueIds(): ReadonlyArray<string> {
    return this.inspectionOrder;
  }

  /** Get the number of collected clues */
  getClueCount(): number {
    return this.collectedClues.length;
  }

  /** Get a collected clue by ID, or undefined if not collected */
  getClue(clueId: string): Clue | undefined {
    return this.collectedClues.find(c => c.id === clueId);
  }

  /** Get all collected key evidence clues */
  getKeyEvidence(): Clue[] {
    return this.collectedClues.filter(c => c.is_key_evidence);
  }

  /** Get collected clues related to a specific suspect */
  getCluesForSuspect(suspectId: string): Clue[] {
    return this.collectedClues.filter(c => c.related_suspect === suspectId);
  }

  /**
   * Check if a clue combo is satisfied (all clues in the combo are collected).
   * Combo format: "clue1+clue2" (matching dialogue.confrontation keys).
   */
  hasClueCombo(comboKey: string): boolean {
    const clueIds = comboKey.split('+');
    return clueIds.every(id => this.collectedIds.has(id));
  }

  /**
   * Get all satisfied clue combos from a set of combo keys.
   * Used by the dialogue engine to determine available confrontations.
   */
  getSatisfiedCombos(comboKeys: string[]): string[] {
    return comboKeys.filter(key => this.hasClueCombo(key));
  }

  /**
   * Filter a room's clues into inspected and uninspected.
   * Used by rendering to show different visual states.
   */
  partitionRoomClues(roomClues: Clue[]): { inspected: Clue[]; uninspected: Clue[] } {
    const inspected: Clue[] = [];
    const uninspected: Clue[] = [];
    for (const clue of roomClues) {
      if (this.collectedIds.has(clue.id)) {
        inspected.push(clue);
      } else {
        uninspected.push(clue);
      }
    }
    return { inspected, uninspected };
  }

  /** Reset the inventory (for new game) */
  reset(): void {
    this.collectedClues = [];
    this.collectedIds = new Set();
    this.inspectionOrder = [];
  }
}
