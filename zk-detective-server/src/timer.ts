// F14: Per-session countdown timer
import type { GameSession, ServerMessage, WsData } from './types'
import type { ServerWebSocket } from 'bun'
import { finishGame } from './handler'

const SYNC_INTERVAL = 10_000 // Sync every 10 seconds

function sendTo(ws: ServerWebSocket<WsData> | null, msg: ServerMessage): void {
  if (ws) ws.send(JSON.stringify(msg))
}

export function startTimer(session: GameSession): void {
  session.timerInterval = setInterval(() => {
    if (session.finished) {
      if (session.timerInterval) clearInterval(session.timerInterval)
      return
    }

    const elapsed = (Date.now() - session.startedAt) / 1000
    const remaining = Math.max(0, session.timeLimit - elapsed)

    // Broadcast sync to both players
    for (const player of session.players) {
      sendTo(player.ws, { type: 'timer_sync', remaining: Math.round(remaining) })
    }

    // Time expired
    if (remaining <= 0) {
      // Determine winner by score comparison
      const scores = session.players.map((p) => {
        const timePenalty = Math.min(Math.floor(session.timeLimit / 5), 5000)
        const accusationPenalty = p.wrongAccusations * 500
        const explorationBonus = p.clueCount * 100 + p.roomsVisited.size * 50
        return Math.max(0, 10000 - timePenalty - accusationPenalty + explorationBonus)
      })

      const winnerIndex = scores[0] > scores[1] ? 0 : scores[1] > scores[0] ? 1 : null
      finishGame(session, winnerIndex, 'timer_expired')
    }
  }, SYNC_INTERVAL)
}
