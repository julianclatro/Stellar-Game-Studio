// F14: GameServerDO — Single Durable Object handling all PvP connections
import { DurableObject } from 'cloudflare:workers'
import type { ClientMessage, ServerMessage, GameSession, PlayerState, WsAttachment } from './types'
import { SOLUTION, DEFAULT_TIME_LIMIT, generateId, computeScore, checkAccusation } from './game-logic'

const DISCONNECT_GRACE_PERIOD = 30_000 // 30 seconds
const CLEANUP_DELAY = 60_000 // 60 seconds after game ends
const ALARM_INTERVAL = 10_000 // 10 seconds

export class GameServerDO extends DurableObject {
  private sessions = new Map<string, GameSession>()
  private tokenIndex = new Map<string, { sessionId: string; playerIndex: number }>()

  // --- WebSocket Hibernation API ---

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/health') {
      const queueCount = this.ctx.getWebSockets().filter((ws) => {
        const att = ws.deserializeAttachment() as WsAttachment | null
        return att?.state === 'queued'
      }).length
      return Response.json({ status: 'ok', sessions: this.sessions.size, queue: queueCount })
    }

    // WebSocket upgrade
    const upgradeHeader = request.headers.get('Upgrade')
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
      return new Response('ZK Detective PvP Server', { status: 200 })
    }

    const pair = new WebSocketPair()
    const [client, server] = [pair[0], pair[1]]

    // Accept with no initial attachment — client must send join/reconnect
    this.ctx.acceptWebSocket(server)

    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    let msg: ClientMessage
    try {
      msg = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw))
    } catch {
      this.send(ws, { type: 'error', message: 'Invalid JSON' })
      return
    }

    if (msg.type === 'join') {
      this.handleJoin(ws, msg.playerName, msg.detective ?? null)
      return
    }

    if (msg.type === 'reconnect') {
      this.handleReconnect(ws, msg.sessionToken)
      return
    }

    // Game messages — require session attachment
    const att = ws.deserializeAttachment() as WsAttachment | null
    if (!att || att.state !== 'session') {
      this.send(ws, { type: 'error', message: 'Not in a session' })
      return
    }

    const session = this.sessions.get(att.sessionId)
    if (!session) {
      this.send(ws, { type: 'error', message: 'Session not found' })
      return
    }

    this.handleGameMessage(ws, session, att.playerIndex, msg)
  }

  async webSocketClose(ws: WebSocket, _code: number, _reason: string, _wasClean: boolean): Promise<void> {
    const att = ws.deserializeAttachment() as WsAttachment | null
    if (!att) return

    if (att.state === 'queued') {
      // Was in matchmaking queue — nothing to clean up, socket is already gone
      return
    }

    // In a session — handle disconnect
    const session = this.sessions.get(att.sessionId)
    if (!session || session.finished) return

    const player = session.players[att.playerIndex]
    player.disconnectedAt = Date.now()

    const opponentIndex = att.playerIndex === 0 ? 1 : 0
    const opponentWs = this.findPlayerWs(att.sessionId, opponentIndex)
    if (opponentWs) {
      this.send(opponentWs, {
        type: 'opponent_disconnected',
        gracePeriod: DISCONNECT_GRACE_PERIOD / 1000,
      })
    }

    this.ensureAlarm()
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    // Treat errors like close
    await this.webSocketClose(ws, 1006, 'error', false)
  }

  async alarm(): Promise<void> {
    const now = Date.now()
    let hasActiveSessions = false

    for (const [sessionId, session] of this.sessions) {
      if (session.finished) {
        // Clean up finished sessions after delay
        if (now - session.startedAt > session.timeLimit * 1000 + CLEANUP_DELAY) {
          this.removeSession(sessionId)
        }
        continue
      }

      hasActiveSessions = true
      const elapsed = (now - session.startedAt) / 1000
      const remaining = Math.max(0, session.timeLimit - elapsed)

      // Broadcast timer sync
      for (let i = 0; i < 2; i++) {
        const ws = this.findPlayerWs(sessionId, i)
        if (ws) {
          this.send(ws, { type: 'timer_sync', remaining: Math.round(remaining) })
        }
      }

      // Time expired
      if (remaining <= 0) {
        const scores = session.players.map((p) =>
          computeScore(session.timeLimit, p.clueCount, p.roomsVisited.length, p.wrongAccusations)
        )
        const winnerIndex = scores[0] > scores[1] ? 0 : scores[1] > scores[0] ? 1 : null
        this.finishGame(session, winnerIndex, 'timer_expired')
        continue
      }

      // Check disconnect grace period
      for (let i = 0; i < 2; i++) {
        const player = session.players[i]
        if (player.disconnectedAt !== null && now - player.disconnectedAt >= DISCONNECT_GRACE_PERIOD) {
          const opponentIndex = i === 0 ? 1 : 0
          this.finishGame(session, opponentIndex, 'opponent_disconnected')
          break
        }
      }
    }

    // Also check if there are queued sockets (keep alive for matchmaking)
    const hasQueued = this.ctx.getWebSockets().some((ws) => {
      const att = ws.deserializeAttachment() as WsAttachment | null
      return att?.state === 'queued'
    })

    if (hasActiveSessions || hasQueued) {
      this.ensureAlarm()
    }
  }

  // --- Private methods ---

  private handleJoin(ws: WebSocket, playerName: string, detective: string | null): void {
    // Look for a queued socket to match with
    const allSockets = this.ctx.getWebSockets()
    let matchedWs: WebSocket | null = null
    let matchedAtt: WsAttachment & { state: 'queued' } | null = null

    for (const candidate of allSockets) {
      if (candidate === ws) continue
      const att = candidate.deserializeAttachment() as WsAttachment | null
      if (att?.state === 'queued') {
        matchedWs = candidate
        matchedAtt = att as WsAttachment & { state: 'queued' }
        break
      }
    }

    if (matchedWs && matchedAtt) {
      // Match found — create session
      const session = this.createSession(
        matchedWs, matchedAtt.playerName, matchedAtt.detective,
        ws, playerName, detective,
      )

      // Notify both players
      this.send(matchedWs, {
        type: 'matched',
        sessionId: session.id,
        sessionToken: session.players[0].sessionToken,
        opponentName: playerName,
        opponentDetective: detective,
        timeLimit: session.timeLimit,
      })
      this.send(ws, {
        type: 'matched',
        sessionId: session.id,
        sessionToken: session.players[1].sessionToken,
        opponentName: matchedAtt.playerName,
        opponentDetective: matchedAtt.detective,
        timeLimit: session.timeLimit,
      })

      this.ensureAlarm()
    } else {
      // No match — queue this socket
      const att: WsAttachment = { state: 'queued', playerName, detective }
      ws.serializeAttachment(att)
      this.send(ws, { type: 'waiting' })
      this.ensureAlarm()
    }
  }

  private handleReconnect(ws: WebSocket, sessionToken: string): void {
    const entry = this.tokenIndex.get(sessionToken)
    if (!entry) {
      this.send(ws, { type: 'error', message: 'Session not found' })
      return
    }

    const session = this.sessions.get(entry.sessionId)
    if (!session) {
      this.send(ws, { type: 'error', message: 'Session not found' })
      return
    }

    const { playerIndex } = entry
    const player = session.players[playerIndex]
    const opponentIndex = playerIndex === 0 ? 1 : 0

    // Close old socket if still open
    const oldWs = this.findPlayerWs(entry.sessionId, playerIndex)
    if (oldWs && oldWs !== ws) {
      try { oldWs.close(1000, 'replaced') } catch {}
    }

    // Update attachment on new socket
    const att: WsAttachment = { state: 'session', sessionId: entry.sessionId, playerIndex }
    ws.serializeAttachment(att)

    // Clear disconnect state
    player.disconnectedAt = null

    // Notify opponent
    const opponentWs = this.findPlayerWs(entry.sessionId, opponentIndex)
    if (opponentWs) {
      this.send(opponentWs, { type: 'opponent_reconnected' })
    }

    // Send state snapshot
    const elapsed = (Date.now() - session.startedAt) / 1000
    const remaining = Math.max(0, session.timeLimit - elapsed)

    this.send(ws, {
      type: 'matched',
      sessionId: session.id,
      sessionToken: player.sessionToken,
      opponentName: session.players[opponentIndex].name,
      opponentDetective: session.players[opponentIndex].detective,
      timeLimit: Math.round(remaining),
    })
  }

  private handleGameMessage(
    ws: WebSocket,
    session: GameSession,
    playerIndex: number,
    msg: ClientMessage,
  ): void {
    if (session.finished) {
      this.send(ws, { type: 'error', message: 'Game is already over' })
      return
    }

    const player = session.players[playerIndex]
    const opponentIndex = playerIndex === 0 ? 1 : 0
    const opponentWs = this.findPlayerWs(session.id, opponentIndex)

    switch (msg.type) {
      case 'move': {
        player.currentRoom = msg.room
        if (!player.roomsVisited.includes(msg.room)) {
          player.roomsVisited.push(msg.room)
        }
        if (opponentWs) this.send(opponentWs, { type: 'opponent_moved', room: msg.room })
        break
      }

      case 'inspect': {
        player.clueCount++
        if (opponentWs) this.send(opponentWs, { type: 'opponent_inspected' })
        break
      }

      case 'interrogate': {
        if (opponentWs) this.send(opponentWs, { type: 'opponent_interrogated' })
        break
      }

      case 'accuse': {
        const correct = checkAccusation(msg.suspect, msg.weapon, msg.room, session.solution)
        this.send(ws, { type: 'accusation_result', correct })
        if (opponentWs) this.send(opponentWs, { type: 'opponent_accused', correct })

        if (correct) {
          this.finishGame(session, playerIndex, 'solved')
        } else {
          player.wrongAccusations++
        }
        break
      }

      default:
        this.send(ws, { type: 'error', message: 'Unknown message type' })
    }
  }

  private createSession(
    ws0: WebSocket, name0: string, detective0: string | null,
    ws1: WebSocket, name1: string, detective1: string | null,
  ): GameSession {
    const id = generateId()

    const makePlayer = (name: string, detective: string | null): PlayerState => ({
      name,
      detective,
      currentRoom: 'bedroom',
      clueCount: 0,
      roomsVisited: ['bedroom'],
      wrongAccusations: 0,
      sessionToken: generateId() + generateId(),
      disconnectedAt: null,
    })

    const session: GameSession = {
      id,
      players: [makePlayer(name0, detective0), makePlayer(name1, detective1)],
      solution: SOLUTION,
      timeLimit: DEFAULT_TIME_LIMIT,
      startedAt: Date.now(),
      finished: false,
    }

    this.sessions.set(id, session)
    this.tokenIndex.set(session.players[0].sessionToken, { sessionId: id, playerIndex: 0 })
    this.tokenIndex.set(session.players[1].sessionToken, { sessionId: id, playerIndex: 1 })

    // Update attachments from 'queued' to 'session'
    const att0: WsAttachment = { state: 'session', sessionId: id, playerIndex: 0 }
    const att1: WsAttachment = { state: 'session', sessionId: id, playerIndex: 1 }
    ws0.serializeAttachment(att0)
    ws1.serializeAttachment(att1)

    return session
  }

  private finishGame(session: GameSession, winnerIndex: number | null, reason: string): void {
    if (session.finished) return
    session.finished = true

    const elapsed = (Date.now() - session.startedAt) / 1000
    const scores = session.players.map((p) =>
      computeScore(elapsed, p.clueCount, p.roomsVisited.length, p.wrongAccusations)
    )

    const winnerName = winnerIndex !== null ? session.players[winnerIndex].name : null

    for (let i = 0; i < 2; i++) {
      const oppIdx = i === 0 ? 1 : 0
      const ws = this.findPlayerWs(session.id, i)
      if (ws) {
        this.send(ws, {
          type: 'game_over',
          winner: winnerName,
          myScore: scores[i],
          opponentScore: scores[oppIdx],
          reason,
        })
      }
    }
  }

  private findPlayerWs(sessionId: string, playerIndex: number): WebSocket | null {
    for (const ws of this.ctx.getWebSockets()) {
      const att = ws.deserializeAttachment() as WsAttachment | null
      if (att?.state === 'session' && att.sessionId === sessionId && att.playerIndex === playerIndex) {
        return ws
      }
    }
    return null
  }

  private removeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    for (const player of session.players) {
      this.tokenIndex.delete(player.sessionToken)
    }
    this.sessions.delete(sessionId)
  }

  private ensureAlarm(): void {
    // getAlarm returns null if no alarm is set
    this.ctx.storage.getAlarm().then((currentAlarm) => {
      if (!currentAlarm) {
        this.ctx.storage.setAlarm(Date.now() + ALARM_INTERVAL)
      }
    })
  }

  private send(ws: WebSocket, msg: ServerMessage): void {
    try {
      ws.send(JSON.stringify(msg))
    } catch {
      // Socket may have closed between check and send
    }
  }
}
