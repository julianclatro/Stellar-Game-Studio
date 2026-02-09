// F04: Dialogue Engine
// Resolves suspect dialogue state based on player inventory.

import type { Suspect } from '../data/types';
import type { InventoryEngine } from './inventory-engine';

export type DialogueState = 'default' | 'clue_triggered' | 'confrontation';

/** A single dialogue option the player can trigger */
export interface DialogueOption {
  /** The dialogue state this option belongs to */
  state: DialogueState;
  /** The clue ID (for clue_triggered) or combo key (for confrontation) that triggers this */
  triggerKey: string | null;
  /** The dialogue text */
  text: string;
  /** Human-readable label for UI (e.g., "Show: Insurance Documents") */
  label: string;
}

/** Full dialogue resolution result for a suspect */
export interface DialogueResolution {
  suspect: Suspect;
  /** The highest-priority dialogue to show by default */
  currentDialogue: DialogueOption;
  /** All available dialogue options the player can trigger */
  availableOptions: DialogueOption[];
  /** Whether new (unseen) dialogue options are available */
  hasNewDialogue: boolean;
}

/** Record of which dialogue states have been seen per suspect */
export interface DialogueHistory {
  suspectId: string;
  seenDefault: boolean;
  seenClueTriggered: Set<string>;
  seenConfrontations: Set<string>;
}

export class DialogueEngine {
  private inventory: InventoryEngine;
  private history: Map<string, DialogueHistory> = new Map();

  constructor(inventory: InventoryEngine) {
    this.inventory = inventory;
  }

  /** Resolve dialogue for a suspect based on current inventory */
  resolve(suspect: Suspect): DialogueResolution {
    const options = this.getAvailableOptions(suspect);
    const current = this.getHighestPriority(options, suspect);
    const history = this.getHistory(suspect.id);

    const hasNewDialogue = options.some(opt => !this.hasSeen(history, opt));

    return {
      suspect,
      currentDialogue: current,
      availableOptions: options,
      hasNewDialogue,
    };
  }

  /** Get all dialogue options available for a suspect given current inventory */
  getAvailableOptions(suspect: Suspect): DialogueOption[] {
    const options: DialogueOption[] = [];

    // Always include default
    options.push({
      state: 'default',
      triggerKey: null,
      text: suspect.dialogue.default,
      label: 'Talk',
    });

    // Clue-triggered: check each clue_triggered key against inventory
    for (const [clueId, text] of Object.entries(suspect.dialogue.clue_triggered)) {
      if (this.inventory.hasClue(clueId)) {
        const clue = this.inventory.getClue(clueId);
        options.push({
          state: 'clue_triggered',
          triggerKey: clueId,
          text,
          label: clue ? `Show: ${clue.name}` : `Show: ${clueId}`,
        });
      }
    }

    // Confrontation: check each combo key against inventory
    for (const [comboKey, text] of Object.entries(suspect.dialogue.confrontation)) {
      if (this.inventory.hasClueCombo(comboKey)) {
        const clueNames = comboKey.split('+').map(id => {
          const clue = this.inventory.getClue(id);
          return clue ? clue.name : id;
        });
        options.push({
          state: 'confrontation',
          triggerKey: comboKey,
          text,
          label: `Confront: ${clueNames.join(' + ')}`,
        });
      }
    }

    return options;
  }

  /** Get the highest-priority dialogue option (confrontation > clue_triggered > default) */
  private getHighestPriority(options: DialogueOption[], suspect: Suspect): DialogueOption {
    const confrontation = options.find(o => o.state === 'confrontation');
    if (confrontation) return confrontation;

    const clueTriggered = options.find(o => o.state === 'clue_triggered');
    if (clueTriggered) return clueTriggered;

    return options[0]; // default is always first
  }

  /** Mark a dialogue option as seen */
  markSeen(suspectId: string, option: DialogueOption): void {
    const history = this.getOrCreateHistory(suspectId);

    if (option.state === 'default') {
      history.seenDefault = true;
    } else if (option.state === 'clue_triggered' && option.triggerKey) {
      history.seenClueTriggered.add(option.triggerKey);
    } else if (option.state === 'confrontation' && option.triggerKey) {
      history.seenConfrontations.add(option.triggerKey);
    }
  }

  /** Check if a dialogue option has been seen */
  private hasSeen(history: DialogueHistory, option: DialogueOption): boolean {
    if (option.state === 'default') return history.seenDefault;
    if (option.state === 'clue_triggered' && option.triggerKey) {
      return history.seenClueTriggered.has(option.triggerKey);
    }
    if (option.state === 'confrontation' && option.triggerKey) {
      return history.seenConfrontations.has(option.triggerKey);
    }
    return false;
  }

  /** Get the dialogue history for a suspect */
  getHistory(suspectId: string): DialogueHistory {
    return this.getOrCreateHistory(suspectId);
  }

  /** Check if a suspect has any unseen dialogue */
  hasUnseenDialogue(suspect: Suspect): boolean {
    return this.resolve(suspect).hasNewDialogue;
  }

  /** Get the number of unique dialogue states seen for a suspect */
  getSeenCount(suspectId: string): number {
    const history = this.getOrCreateHistory(suspectId);
    let count = history.seenDefault ? 1 : 0;
    count += history.seenClueTriggered.size;
    count += history.seenConfrontations.size;
    return count;
  }

  /** Get all suspects that have unseen confrontation dialogue available */
  getSuspectsWithConfrontations(suspects: Suspect[]): Suspect[] {
    return suspects.filter(suspect => {
      const options = this.getAvailableOptions(suspect);
      const history = this.getHistory(suspect.id);
      return options.some(
        o => o.state === 'confrontation' && !this.hasSeen(history, o)
      );
    });
  }

  /** Reset all dialogue history (for new game) */
  reset(): void {
    this.history.clear();
  }

  private getOrCreateHistory(suspectId: string): DialogueHistory {
    let history = this.history.get(suspectId);
    if (!history) {
      history = {
        suspectId,
        seenDefault: false,
        seenClueTriggered: new Set(),
        seenConfrontations: new Set(),
      };
      this.history.set(suspectId, history);
    }
    return history;
  }
}
