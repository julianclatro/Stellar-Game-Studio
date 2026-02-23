// F11: Scoring System
// Client-side scoring service that mirrors the on-chain formula (F08).
// The formula is computed on-chain for trustlessness; this service provides
// local preview and post-game display without requiring a blockchain call.

import type { ClientCaseData } from '../data/types';

/** Raw game metrics used as scoring inputs */
export interface GameMetrics {
  /** Ledger sequence when game started */
  startLedger: number;
  /** Ledger sequence when case was solved (0 if unsolved) */
  solveLedger: number;
  /** Number of clues the player inspected */
  cluesInspected: number;
  /** Number of unique rooms the player visited */
  roomsVisited: number;
  /** Number of incorrect accusations made */
  wrongAccusations: number;
}

/** Breakdown of score components for post-game display */
export interface ScoreBreakdown {
  /** Base score before modifiers */
  baseScore: number;
  /** Points deducted for time taken (negative) */
  timePenalty: number;
  /** Points deducted for wrong accusations (negative) */
  accusationPenalty: number;
  /** Points added for exploration (positive) */
  explorationBonus: number;
  /** Final computed score (floored at 0) */
  finalScore: number;
}

/** Post-game summary shown to the player */
export interface GameSummary {
  /** Whether the case was solved */
  solved: boolean;
  /** Final score (0 if unsolved) */
  score: number;
  /** Score breakdown components */
  breakdown: ScoreBreakdown;
  /** Time elapsed in ledgers */
  timeElapsed: number;
  /** Clues inspected vs total available */
  cluesFound: number;
  /** Total clues in the case */
  totalClues: number;
  /** Rooms visited vs total */
  roomsVisited: number;
  /** Total rooms in the case */
  totalRooms: number;
  /** Number of wrong accusations */
  wrongAccusations: number;
}

// ============================================================================
// Constants — must match contracts/zk-detective/src/lib.rs
// ============================================================================

const BASE_SCORE = 10000;
const TIME_PENALTY_PER_LEDGER = 1;
const TIME_PENALTY_CAP = 5000;
const ACCUSATION_PENALTY = 500;
const CLUE_BONUS = 100;
const ROOM_BONUS = 50;

// ============================================================================
// Scoring Functions
// ============================================================================

/**
 * Compute the score breakdown from game metrics.
 * Mirrors the on-chain `compute_score()` in the detective contract.
 *
 * Formula:
 *   score = BASE_SCORE
 *         - min(time_elapsed, 5000)
 *         - wrong_accusations * 500
 *         + clues_inspected * 100
 *         + rooms_visited * 50
 *   floor at 0
 */
export function computeScore(metrics: GameMetrics): ScoreBreakdown {
  const timeElapsed = Math.max(0, metrics.solveLedger - metrics.startLedger);
  const timePenalty = Math.min(timeElapsed * TIME_PENALTY_PER_LEDGER, TIME_PENALTY_CAP);
  const accusationPenalty = metrics.wrongAccusations * ACCUSATION_PENALTY;
  const explorationBonus =
    metrics.cluesInspected * CLUE_BONUS + metrics.roomsVisited * ROOM_BONUS;

  const raw = BASE_SCORE - timePenalty - accusationPenalty + explorationBonus;
  const finalScore = Math.max(0, raw);

  return {
    baseScore: BASE_SCORE,
    timePenalty: -timePenalty,
    accusationPenalty: -accusationPenalty,
    explorationBonus,
    finalScore,
  };
}

/**
 * Generate the full post-game summary for display.
 * This is shown after the player solves (or fails) the case.
 */
export function generateSummary(
  caseData: ClientCaseData,
  metrics: GameMetrics,
  solved: boolean,
): GameSummary {
  const totalClues = caseData.rooms.reduce((sum, r) => sum + r.clues.length, 0);
  const totalRooms = caseData.rooms.length;
  const timeElapsed = Math.max(0, metrics.solveLedger - metrics.startLedger);

  const breakdown = solved
    ? computeScore(metrics)
    : {
        baseScore: BASE_SCORE,
        timePenalty: 0,
        accusationPenalty: -(metrics.wrongAccusations * ACCUSATION_PENALTY),
        explorationBonus: 0,
        finalScore: 0,
      };

  return {
    solved,
    score: solved ? breakdown.finalScore : 0,
    breakdown,
    timeElapsed,
    cluesFound: metrics.cluesInspected,
    totalClues,
    roomsVisited: metrics.roomsVisited,
    totalRooms,
    wrongAccusations: metrics.wrongAccusations,
  };
}

/**
 * Estimate approximate time in seconds from ledger count.
 * Stellar produces ~1 ledger per 5 seconds.
 */
export function ledgersToSeconds(ledgers: number): number {
  return ledgers * 5;
}

/**
 * Format a time duration in seconds to a human-readable string.
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}
