// F14: Bun WebSocket server entry point
import type { ClientMessage, WsData } from './types'
import { enqueue, dequeue, getQueueSize } from './matchmaking'
import { getSession, findByToken, getOpponent, getSessionCount } from './session'
import { handleMessage, finishGame } from './handler'

const DISCONNECT_GRACE_PERIOD = 30_000 // 30 seconds
const PORT = Number(process.env.PORT ?? 8080)

const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>()

const server = Bun.serve<WsData>({
  port: PORT,

  fetch(req, server) {
    const url = new URL(req.url)

    if (url.pathname === '/ws') {
      const upgraded = server.upgrade(req, {
        data: { sessionId: null, playerIndex: -1 } as WsData,
      })
      if (!upgraded) {
        return new Response('WebSocket upgrade failed', { status: 400 })
      }
      return undefined
    }

    if (url.pathname === '/health') {
      return Response.json({
        status: 'ok',
        sessions: getSessionCount(),
        queue: getQueueSize(),
      })
    }

    return new Response('ZK Detective PvP Server', { status: 200 })
  },

  websocket: {
    open(_ws) {
      // Connection established, wait for join/reconnect message
    },

    message(ws, raw) {
      let msg: ClientMessage
      try {
        msg = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw))
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }))
        return
      }

      // Handle join (matchmaking)
      if (msg.type === 'join') {
        enqueue(ws, msg.playerName, msg.detective ?? null)
        return
      }

      // Handle reconnection
      if (msg.type === 'reconnect') {
        const found = findByToken(msg.sessionToken)
        if (!found) {
          ws.send(JSON.stringify({ type: 'error', message: 'Session not found' }))
          return
        }

        const { session, playerIndex } = found
        const player = session.players[playerIndex]
        const opponent = getOpponent(session, playerIndex)

        // Reassign websocket
        player.ws = ws
        player.disconnectedAt = null
        ws.data.sessionId = session.id
        ws.data.playerIndex = playerIndex

        // Cancel disconnect timer
        const timerKey = `${session.id}-${playerIndex}`
        const timer = disconnectTimers.get(timerKey)
        if (timer) {
          clearTimeout(timer)
          disconnectTimers.delete(timerKey)
        }

        // Notify opponent
        if (opponent.ws) {
          opponent.ws.send(JSON.stringify({ type: 'opponent_reconnected' }))
        }

        // Send current state snapshot to reconnected player
        const elapsed = (Date.now() - session.startedAt) / 1000
        const remaining = Math.max(0, session.timeLimit - elapsed)

        ws.send(JSON.stringify({
          type: 'matched',
          sessionId: session.id,
          sessionToken: player.sessionToken,
          opponentName: opponent.name,
          opponentDetective: opponent.detective,
          timeLimit: Math.round(remaining),
        }))
        return
      }

      // Route game messages to handler
      const { sessionId, playerIndex } = ws.data
      if (!sessionId) {
        ws.send(JSON.stringify({ type: 'error', message: 'Not in a session' }))
        return
      }

      const session = getSession(sessionId)
      if (!session) {
        ws.send(JSON.stringify({ type: 'error', message: 'Session not found' }))
        return
      }

      handleMessage(ws, session, playerIndex, msg)
    },

    close(ws) {
      const { sessionId, playerIndex } = ws.data

      // If in matchmaking queue, remove
      if (!sessionId) {
        dequeue(ws)
        return
      }

      const session = getSession(sessionId)
      if (!session || session.finished) return

      const player = session.players[playerIndex]
      const opponent = getOpponent(session, playerIndex)

      player.ws = null
      player.disconnectedAt = Date.now()

      // Notify opponent
      if (opponent.ws) {
        opponent.ws.send(JSON.stringify({
          type: 'opponent_disconnected',
          gracePeriod: DISCONNECT_GRACE_PERIOD / 1000,
        }))
      }

      // Start grace period — if not reconnected, opponent wins
      const timerKey = `${sessionId}-${playerIndex}`
      disconnectTimers.set(timerKey, setTimeout(() => {
        disconnectTimers.delete(timerKey)
        if (!session.finished && player.disconnectedAt !== null) {
          const opponentIndex = playerIndex === 0 ? 1 : 0
          finishGame(session, opponentIndex, 'opponent_disconnected')
        }
      }, DISCONNECT_GRACE_PERIOD))
    },
  },
})

console.log(`[F14] ZK Detective PvP server running on port ${PORT}`)
