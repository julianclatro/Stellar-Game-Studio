// F14: WebSocket Protocol Types
// SYNC WITH: zk-detective-frontend/src/services/multiplayer-types.ts

// Client -> Server
export type ClientMessage =
  | { type: 'join'; playerName: string; detective?: string }
  | { type: 'reconnect'; sessionToken: string }
  | { type: 'move'; room: string }
  | { type: 'inspect'; clue: string }
  | { type: 'interrogate'; suspect: string }
  | { type: 'accuse'; suspect: string; weapon: string; room: string }

// Server -> Client
export type ServerMessage =
  | { type: 'waiting' }
  | { type: 'matched'; sessionId: string; sessionToken: string; opponentName: string; opponentDetective: string | null; timeLimit: number }
  | { type: 'opponent_moved'; room: string }
  | { type: 'opponent_inspected' }
  | { type: 'opponent_interrogated' }
  | { type: 'opponent_accused'; correct: boolean }
  | { type: 'accusation_result'; correct: boolean }
  | { type: 'timer_sync'; remaining: number }
  | { type: 'game_over'; winner: string | null; myScore: number; opponentScore: number; reason: string }
  | { type: 'opponent_disconnected'; gracePeriod: number }
  | { type: 'opponent_reconnected' }
  | { type: 'error'; message: string }

export interface PlayerState {
  name: string
  detective: string | null
  ws: ServerWebSocket<WsData> | null
  currentRoom: string
  clueCount: number
  roomsVisited: Set<string>
  wrongAccusations: number
  sessionToken: string
  disconnectedAt: number | null
}

export interface GameSession {
  id: string
  players: [PlayerState, PlayerState]
  solution: { suspect: string; weapon: string; room: string }
  timeLimit: number
  startedAt: number
  timerInterval: ReturnType<typeof setInterval> | null
  finished: boolean
}

export interface WsData {
  sessionId: string | null
  playerIndex: number
}

// Import Bun's WebSocket type
import type { ServerWebSocket } from 'bun'
