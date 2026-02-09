// F14: Session lifecycle management
import type { GameSession, PlayerState, WsData } from './types'
import type { ServerWebSocket } from 'bun'

const sessions = new Map<string, GameSession>()
const tokenIndex = new Map<string, { sessionId: string; playerIndex: number }>()

const SOLUTION = { suspect: 'victor', weapon: 'poison_vial', room: 'bedroom' }
const DEFAULT_TIME_LIMIT = Number(process.env.PVP_TIME_LIMIT ?? 600) // 10 min

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function createSession(
  ws0: ServerWebSocket<WsData>,
  name0: string,
  detective0: string | null,
  ws1: ServerWebSocket<WsData>,
  name1: string,
  detective1: string | null,
): GameSession {
  const id = generateId()

  const makePlayer = (ws: ServerWebSocket<WsData>, name: string, detective: string | null): PlayerState => ({
    name,
    detective,
    ws,
    currentRoom: 'bedroom',
    clueCount: 0,
    roomsVisited: new Set(['bedroom']),
    wrongAccusations: 0,
    sessionToken: generateId() + generateId(),
    disconnectedAt: null,
  })

  const session: GameSession = {
    id,
    players: [makePlayer(ws0, name0, detective0), makePlayer(ws1, name1, detective1)],
    solution: SOLUTION,
    timeLimit: DEFAULT_TIME_LIMIT,
    startedAt: Date.now(),
    timerInterval: null,
    finished: false,
  }

  sessions.set(id, session)
  tokenIndex.set(session.players[0].sessionToken, { sessionId: id, playerIndex: 0 })
  tokenIndex.set(session.players[1].sessionToken, { sessionId: id, playerIndex: 1 })

  // Tag each websocket with session info
  ws0.data.sessionId = id
  ws0.data.playerIndex = 0
  ws1.data.sessionId = id
  ws1.data.playerIndex = 1

  return session
}

export function getSession(id: string): GameSession | undefined {
  return sessions.get(id)
}

export function findByToken(token: string): { session: GameSession; playerIndex: number } | undefined {
  const entry = tokenIndex.get(token)
  if (!entry) return undefined
  const session = sessions.get(entry.sessionId)
  if (!session) return undefined
  return { session, playerIndex: entry.playerIndex }
}

export function getOpponent(session: GameSession, playerIndex: number): PlayerState {
  return session.players[playerIndex === 0 ? 1 : 0]
}

export function removeSession(id: string): void {
  const session = sessions.get(id)
  if (!session) return

  if (session.timerInterval) {
    clearInterval(session.timerInterval)
  }

  // Clean up token index
  for (const player of session.players) {
    tokenIndex.delete(player.sessionToken)
  }

  sessions.delete(id)
}

export function getSessionCount(): number {
  return sessions.size
}
