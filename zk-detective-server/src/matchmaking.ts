// F14: FIFO matchmaking queue
import type { ServerMessage, WsData } from './types'
import type { ServerWebSocket } from 'bun'
import { createSession } from './session'
import { startTimer } from './timer'

interface QueueEntry {
  ws: ServerWebSocket<WsData>
  playerName: string
  detective: string | null
}

const queue: QueueEntry[] = []

function send(ws: ServerWebSocket<WsData>, msg: ServerMessage): void {
  ws.send(JSON.stringify(msg))
}

export function enqueue(ws: ServerWebSocket<WsData>, playerName: string, detective: string | null = null): void {
  if (queue.length > 0) {
    // Match with first person in queue
    const opponent = queue.shift()!
    const session = createSession(opponent.ws, opponent.playerName, opponent.detective, ws, playerName, detective)

    // Notify both players
    send(opponent.ws, {
      type: 'matched',
      sessionId: session.id,
      sessionToken: session.players[0].sessionToken,
      opponentName: playerName,
      opponentDetective: detective,
      timeLimit: session.timeLimit,
    })
    send(ws, {
      type: 'matched',
      sessionId: session.id,
      sessionToken: session.players[1].sessionToken,
      opponentName: opponent.playerName,
      opponentDetective: opponent.detective,
      timeLimit: session.timeLimit,
    })

    // Start the match timer
    startTimer(session)
  } else {
    // Add to queue and wait
    queue.push({ ws, playerName, detective })
    send(ws, { type: 'waiting' })
  }
}

export function dequeue(ws: ServerWebSocket<WsData>): void {
  const idx = queue.findIndex((entry) => entry.ws === ws)
  if (idx !== -1) {
    queue.splice(idx, 1)
  }
}

export function getQueueSize(): number {
  return queue.length
}
