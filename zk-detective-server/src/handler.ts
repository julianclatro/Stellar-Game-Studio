// F14: Message handler — dispatches client actions, validates accusations, computes scores
import type { ClientMessage, GameSession, ServerMessage, WsData } from './types'
import type { ServerWebSocket } from 'bun'
import { getOpponent, removeSession } from './session'

function send(ws: ServerWebSocket<WsData>, msg: ServerMessage): void {
  ws.send(JSON.stringify(msg))
}

function sendTo(ws: ServerWebSocket<WsData> | null, msg: ServerMessage): void {
  if (ws) ws.send(JSON.stringify(msg))
}

/** Score formula — mirrors scoring-service.ts and the on-chain contract */
function computeScore(
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

function finishGame(
  session: GameSession,
  winnerIndex: number | null,
  reason: string,
): void {
  if (session.finished) return
  session.finished = true

  if (session.timerInterval) {
    clearInterval(session.timerInterval)
    session.timerInterval = null
  }

  const elapsed = (Date.now() - session.startedAt) / 1000

  const scores = session.players.map((p) =>
    computeScore(elapsed, p.clueCount, p.roomsVisited.size, p.wrongAccusations)
  )

  const winnerName = winnerIndex !== null ? session.players[winnerIndex].name : null

  for (let i = 0; i < 2; i++) {
    const oppIdx = i === 0 ? 1 : 0
    sendTo(session.players[i].ws, {
      type: 'game_over',
      winner: winnerName,
      myScore: scores[i],
      opponentScore: scores[oppIdx],
      reason,
    })
  }

  // Schedule session cleanup after 60s (give clients time to show results)
  setTimeout(() => removeSession(session.id), 60_000)
}

export function handleMessage(
  ws: ServerWebSocket<WsData>,
  session: GameSession,
  playerIndex: number,
  msg: ClientMessage,
): void {
  if (session.finished) {
    send(ws, { type: 'error', message: 'Game is already over' })
    return
  }

  const player = session.players[playerIndex]
  const opponent = getOpponent(session, playerIndex)

  switch (msg.type) {
    case 'move': {
      player.currentRoom = msg.room
      player.roomsVisited.add(msg.room)
      sendTo(opponent.ws, { type: 'opponent_moved', room: msg.room })
      break
    }

    case 'inspect': {
      player.clueCount++
      sendTo(opponent.ws, { type: 'opponent_inspected' })
      break
    }

    case 'interrogate': {
      sendTo(opponent.ws, { type: 'opponent_interrogated' })
      break
    }

    case 'accuse': {
      const { suspect, weapon, room } = msg
      const { solution } = session
      const correct =
        suspect === solution.suspect &&
        weapon === solution.weapon &&
        room === solution.room

      // Tell accuser their result
      send(ws, { type: 'accusation_result', correct })

      // Tell opponent (result only, no details)
      sendTo(opponent.ws, { type: 'opponent_accused', correct })

      if (correct) {
        finishGame(session, playerIndex, 'solved')
      } else {
        player.wrongAccusations++
      }
      break
    }

    default:
      send(ws, { type: 'error', message: `Unknown message type` })
  }
}

export { finishGame }
