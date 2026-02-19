// F14: Pure game logic — no platform dependencies

export const SOLUTION = { suspect: 'victor', weapon: 'poison_vial', room: 'bedroom' }
export const DEFAULT_TIME_LIMIT = 600 // 10 minutes

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function computeScore(
  elapsedSeconds: number,
  clueCount: number,
  roomCount: number,
  wrongAccusations: number,
): number {
  const timePenalty = Math.min(Math.floor(elapsedSeconds / 5), 5000)
  const accusationPenalty = wrongAccusations * 500
  const explorationBonus = clueCount * 100 + roomCount * 50
  return Math.max(0, 10000 - timePenalty - accusationPenalty + explorationBonus)
}

export function checkAccusation(
  suspect: string,
  weapon: string,
  room: string,
  solution: { suspect: string; weapon: string; room: string },
): boolean {
  return suspect === solution.suspect && weapon === solution.weapon && room === solution.room
}
