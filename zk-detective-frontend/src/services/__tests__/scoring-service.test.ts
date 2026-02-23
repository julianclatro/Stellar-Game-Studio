// F11: Scoring System Tests
import {
  computeScore,
  generateSummary,
  ledgersToSeconds,
  formatTime,
} from '../scoring-service';
import type { GameMetrics, ScoreBreakdown } from '../scoring-service';
import type { ClientCaseData } from '../../data/types';
import caseJson from '../../data/cases/meridian-manor.json';

// ============================================================================
// Test Data
// ============================================================================

const caseData = caseJson as unknown as ClientCaseData;

function makeMetrics(overrides: Partial<GameMetrics> = {}): GameMetrics {
  return {
    startLedger: 100,
    solveLedger: 100, // instant solve by default
    cluesInspected: 0,
    roomsVisited: 0,
    wrongAccusations: 0,
    ...overrides,
  };
}

// ============================================================================
// computeScore — base cases
// ============================================================================

describe('computeScore', () => {
  it('returns base score for instant clean solve', () => {
    const result = computeScore(makeMetrics());
    expect(result.finalScore).toBe(10000);
    expect(result.baseScore).toBe(10000);
    expect(result.timePenalty).toBe(0);
    expect(result.accusationPenalty).toBe(0);
    expect(result.explorationBonus).toBe(0);
  });

  it('returns all score components', () => {
    const result = computeScore(makeMetrics());
    expect(result).toHaveProperty('baseScore');
    expect(result).toHaveProperty('timePenalty');
    expect(result).toHaveProperty('accusationPenalty');
    expect(result).toHaveProperty('explorationBonus');
    expect(result).toHaveProperty('finalScore');
  });

  // ========================================================================
  // Time penalty
  // ========================================================================

  it('applies time penalty of 1 per ledger', () => {
    const result = computeScore(makeMetrics({ solveLedger: 200 }));
    expect(result.timePenalty).toBe(-100);
    expect(result.finalScore).toBe(9900);
  });

  it('applies larger time penalty', () => {
    const result = computeScore(makeMetrics({ solveLedger: 1100 }));
    expect(result.timePenalty).toBe(-1000);
    expect(result.finalScore).toBe(9000);
  });

  it('caps time penalty at 5000', () => {
    const result = computeScore(makeMetrics({ solveLedger: 10100 }));
    expect(result.timePenalty).toBe(-5000);
    expect(result.finalScore).toBe(5000);
  });

  it('handles zero time elapsed', () => {
    const result = computeScore(makeMetrics({ startLedger: 500, solveLedger: 500 }));
    expect(result.timePenalty).toBe(0);
    expect(result.finalScore).toBe(10000);
  });

  // ========================================================================
  // Wrong accusations
  // ========================================================================

  it('applies penalty of 500 per wrong accusation', () => {
    const result = computeScore(makeMetrics({ wrongAccusations: 1 }));
    expect(result.accusationPenalty).toBe(-500);
    expect(result.finalScore).toBe(9500);
  });

  it('applies penalty for multiple wrong accusations', () => {
    const result = computeScore(makeMetrics({ wrongAccusations: 3 }));
    expect(result.accusationPenalty).toBe(-1500);
    expect(result.finalScore).toBe(8500);
  });

  it('handles many wrong accusations', () => {
    const result = computeScore(makeMetrics({ wrongAccusations: 10 }));
    expect(result.accusationPenalty).toBe(-5000);
    expect(result.finalScore).toBe(5000);
  });

  // ========================================================================
  // Exploration bonus
  // ========================================================================

  it('adds 100 per clue inspected', () => {
    const result = computeScore(makeMetrics({ cluesInspected: 5 }));
    expect(result.explorationBonus).toBe(500);
    expect(result.finalScore).toBe(10500);
  });

  it('adds 50 per room visited', () => {
    const result = computeScore(makeMetrics({ roomsVisited: 4 }));
    expect(result.explorationBonus).toBe(200);
    expect(result.finalScore).toBe(10200);
  });

  it('combines clue and room bonuses', () => {
    const result = computeScore(makeMetrics({ cluesInspected: 8, roomsVisited: 5 }));
    expect(result.explorationBonus).toBe(8 * 100 + 5 * 50);
    expect(result.finalScore).toBe(10000 + 1050);
  });

  // ========================================================================
  // Combined scenarios
  // ========================================================================

  it('handles all penalties and bonuses together', () => {
    const result = computeScore(makeMetrics({
      solveLedger: 300, // 200 ledgers elapsed -> -200
      wrongAccusations: 2, // -1000
      cluesInspected: 6, // +600
      roomsVisited: 4, // +200
    }));
    expect(result.timePenalty).toBe(-200);
    expect(result.accusationPenalty).toBe(-1000);
    expect(result.explorationBonus).toBe(800);
    expect(result.finalScore).toBe(10000 - 200 - 1000 + 800);
    expect(result.finalScore).toBe(9600);
  });

  // ========================================================================
  // Floor at zero
  // ========================================================================

  it('floors score at 0', () => {
    const result = computeScore(makeMetrics({
      solveLedger: 10100, // -5000 (capped)
      wrongAccusations: 20, // -10000
    }));
    expect(result.finalScore).toBe(0);
  });

  it('floors at 0 even with some bonuses', () => {
    const result = computeScore(makeMetrics({
      solveLedger: 10100, // -5000
      wrongAccusations: 15, // -7500
      cluesInspected: 2, // +200
      roomsVisited: 1, // +50
    }));
    // 10000 - 5000 - 7500 + 250 = -2250 -> 0
    expect(result.finalScore).toBe(0);
  });

  // ========================================================================
  // Edge cases
  // ========================================================================

  it('handles startLedger greater than solveLedger gracefully', () => {
    const result = computeScore(makeMetrics({ startLedger: 500, solveLedger: 100 }));
    expect(result.timePenalty).toBe(0);
    expect(result.finalScore).toBe(10000);
  });

  it('handles zero metrics', () => {
    const result = computeScore({
      startLedger: 0,
      solveLedger: 0,
      cluesInspected: 0,
      roomsVisited: 0,
      wrongAccusations: 0,
    });
    expect(result.finalScore).toBe(10000);
  });
});

// ============================================================================
// Strategy archetypes
// ============================================================================

describe('strategy archetypes', () => {
  it('speedrunner: fast solve, few clues, some wrong guesses', () => {
    const speedrunner = computeScore(makeMetrics({
      solveLedger: 120, // 20 ledgers fast
      cluesInspected: 2,
      roomsVisited: 2,
      wrongAccusations: 1,
    }));

    // 10000 - 20 - 500 + 200 + 100 = 9780
    expect(speedrunner.finalScore).toBe(9780);
  });

  it('thorough detective: slow, all clues, all rooms, no wrong guesses', () => {
    const thorough = computeScore(makeMetrics({
      solveLedger: 700, // 600 ledgers
      cluesInspected: 11, // all clues in Meridian Manor
      roomsVisited: 5, // all rooms
      wrongAccusations: 0,
    }));

    // 10000 - 600 + 1100 + 250 = 10750
    expect(thorough.finalScore).toBe(10750);
  });

  it('minimalist: moderate speed, few clues, no wrong guesses', () => {
    const minimalist = computeScore(makeMetrics({
      solveLedger: 250, // 150 ledgers
      cluesInspected: 3,
      roomsVisited: 2,
      wrongAccusations: 0,
    }));

    // 10000 - 150 + 300 + 100 = 10250
    expect(minimalist.finalScore).toBe(10250);
  });

  it('all strategies produce viable scores', () => {
    const speedrunner = computeScore(makeMetrics({
      solveLedger: 120,
      cluesInspected: 2,
      roomsVisited: 2,
      wrongAccusations: 1,
    }));

    const thorough = computeScore(makeMetrics({
      solveLedger: 700,
      cluesInspected: 11,
      roomsVisited: 5,
      wrongAccusations: 0,
    }));

    const minimalist = computeScore(makeMetrics({
      solveLedger: 250,
      cluesInspected: 3,
      roomsVisited: 2,
      wrongAccusations: 0,
    }));

    // All strategies should produce scores > 5000 (above half base)
    expect(speedrunner.finalScore).toBeGreaterThan(5000);
    expect(thorough.finalScore).toBeGreaterThan(5000);
    expect(minimalist.finalScore).toBeGreaterThan(5000);
  });
});

// ============================================================================
// generateSummary
// ============================================================================

describe('generateSummary', () => {
  it('generates summary for solved case', () => {
    const summary = generateSummary(caseData, makeMetrics({
      solveLedger: 200,
      cluesInspected: 6,
      roomsVisited: 4,
      wrongAccusations: 1,
    }), true);

    expect(summary.solved).toBe(true);
    expect(summary.score).toBeGreaterThan(0);
    expect(summary.timeElapsed).toBe(100);
    expect(summary.cluesFound).toBe(6);
    expect(summary.totalClues).toBe(11); // Meridian Manor has 11 clues
    expect(summary.roomsVisited).toBe(4);
    expect(summary.totalRooms).toBe(5);
    expect(summary.wrongAccusations).toBe(1);
  });

  it('generates summary for unsolved case', () => {
    const summary = generateSummary(caseData, makeMetrics({
      wrongAccusations: 3,
    }), false);

    expect(summary.solved).toBe(false);
    expect(summary.score).toBe(0);
    expect(summary.breakdown.finalScore).toBe(0);
    expect(summary.wrongAccusations).toBe(3);
  });

  it('counts total clues from case data', () => {
    const summary = generateSummary(caseData, makeMetrics(), true);
    // Meridian Manor: bedroom(2) + lounge(2) + kitchen(3) + study(2) + garden(2) = 11
    expect(summary.totalClues).toBe(11);
  });

  it('counts total rooms from case data', () => {
    const summary = generateSummary(caseData, makeMetrics(), true);
    expect(summary.totalRooms).toBe(5);
  });

  it('includes score breakdown', () => {
    const summary = generateSummary(caseData, makeMetrics({
      solveLedger: 300,
      cluesInspected: 5,
      roomsVisited: 3,
      wrongAccusations: 1,
    }), true);

    expect(summary.breakdown.baseScore).toBe(10000);
    expect(summary.breakdown.timePenalty).toBeLessThan(0);
    expect(summary.breakdown.accusationPenalty).toBeLessThan(0);
    expect(summary.breakdown.explorationBonus).toBeGreaterThan(0);
    expect(summary.breakdown.finalScore).toBe(summary.score);
  });

  it('handles perfect game', () => {
    const summary = generateSummary(caseData, makeMetrics({
      cluesInspected: 11,
      roomsVisited: 5,
    }), true);

    // Perfect: base + all exploration, no penalties
    expect(summary.score).toBe(10000 + 11 * 100 + 5 * 50);
    expect(summary.score).toBe(11350);
    expect(summary.wrongAccusations).toBe(0);
    expect(summary.cluesFound).toBe(11);
    expect(summary.roomsVisited).toBe(5);
  });
});

// ============================================================================
// Utility functions
// ============================================================================

describe('ledgersToSeconds', () => {
  it('converts ledgers to seconds (5s per ledger)', () => {
    expect(ledgersToSeconds(0)).toBe(0);
    expect(ledgersToSeconds(1)).toBe(5);
    expect(ledgersToSeconds(12)).toBe(60);
    expect(ledgersToSeconds(120)).toBe(600);
  });
});

describe('formatTime', () => {
  it('formats seconds only', () => {
    expect(formatTime(30)).toBe('30s');
    expect(formatTime(0)).toBe('0s');
    expect(formatTime(59)).toBe('59s');
  });

  it('formats minutes and seconds', () => {
    expect(formatTime(60)).toBe('1m 0s');
    expect(formatTime(90)).toBe('1m 30s');
    expect(formatTime(125)).toBe('2m 5s');
    expect(formatTime(600)).toBe('10m 0s');
  });
});

// ============================================================================
// On-chain formula parity
// ============================================================================

describe('on-chain formula parity', () => {
  it('matches on-chain formula for base case', () => {
    // On-chain: base 10000, time 0, accusations 0, exploration 0
    const result = computeScore(makeMetrics());
    expect(result.finalScore).toBe(10000);
  });

  it('matches on-chain formula with time penalty', () => {
    // On-chain: base 10000 - 1000 time = 9000
    const result = computeScore(makeMetrics({ startLedger: 100, solveLedger: 1100 }));
    expect(result.finalScore).toBe(9000);
  });

  it('matches on-chain formula with exploration', () => {
    // On-chain: base 10000 + 8*100 + 4*50 = 11000
    const result = computeScore(makeMetrics({ cluesInspected: 8, roomsVisited: 4 }));
    expect(result.finalScore).toBe(11000);
  });

  it('matches on-chain formula with penalties', () => {
    // On-chain: base 10000 - 2*500 = 9000
    const result = computeScore(makeMetrics({ wrongAccusations: 2 }));
    expect(result.finalScore).toBe(9000);
  });

  it('matches on-chain formula full game scenario', () => {
    // Full game from F08 test_full_game_flow:
    // start=100, solve=200, clues=6, rooms=4, wrongs=1
    // On-chain: 10000 - 100 - 500 + 600 + 200 = 10200
    const result = computeScore(makeMetrics({
      startLedger: 100,
      solveLedger: 200,
      cluesInspected: 6,
      roomsVisited: 4,
      wrongAccusations: 1,
    }));
    expect(result.finalScore).toBe(10200);
  });
});
