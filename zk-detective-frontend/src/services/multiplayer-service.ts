// F14: WebSocket client service (singleton)
import type { ClientMessage, ServerMessage, ConnectionState } from './multiplayer-types'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080/ws'
const MAX_RECONNECT_ATTEMPTS = 3
const RECONNECT_DELAY = 5_000 // 5 seconds between attempts

interface MultiplayerCallbacks {
  onMessage: (msg: ServerMessage) => void
  onStateChange: (state: ConnectionState) => void
}

class MultiplayerService {
  private ws: WebSocket | null = null
  private callbacks: MultiplayerCallbacks | null = null
  private state: ConnectionState = 'idle'
  private sessionToken: string | null = null
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  get connectionState(): ConnectionState {
    return this.state
  }

  connect(playerName: string, callbacks: MultiplayerCallbacks, detective?: string): void {
    this.callbacks = callbacks
    this.reconnectAttempts = 0
    this.setState('connecting')

    this.ws = new WebSocket(WS_URL)

    this.ws.onopen = () => {
      this.send({ type: 'join', playerName, detective })
      this.setState('waiting')
    }

    this.ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data)

        // Track session token for reconnection
        if (msg.type === 'matched') {
          this.sessionToken = msg.sessionToken
          this.reconnectAttempts = 0
          this.setState('matched')
        }

        this.callbacks?.onMessage(msg)
      } catch {
        // Ignore malformed messages
      }
    }

    this.ws.onclose = () => {
      if (this.state === 'idle') return // Intentional disconnect

      if (this.sessionToken && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        this.setState('disconnected')
        this.attemptReconnect()
      } else {
        this.setState('disconnected')
      }
    }

    this.ws.onerror = () => {
      // onclose will fire after onerror
    }
  }

  disconnect(): void {
    this.setState('idle')
    this.sessionToken = null
    this.reconnectAttempts = 0
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  sendMove(room: string): void {
    this.send({ type: 'move', room })
  }

  sendInspect(clue: string): void {
    this.send({ type: 'inspect', clue })
  }

  sendInterrogate(suspect: string): void {
    this.send({ type: 'interrogate', suspect })
  }

  sendAccuse(suspect: string, weapon: string, room: string): void {
    this.send({ type: 'accuse', suspect, weapon, room })
  }

  private send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  private setState(state: ConnectionState): void {
    this.state = state
    this.callbacks?.onStateChange(state)
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (!this.sessionToken || this.state === 'idle') return

      this.ws = new WebSocket(WS_URL)

      this.ws.onopen = () => {
        this.send({ type: 'reconnect', sessionToken: this.sessionToken! })
      }

      this.ws.onmessage = (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data)

          if (msg.type === 'matched') {
            this.sessionToken = msg.sessionToken
            this.reconnectAttempts = 0
            this.setState('playing')
          }

          this.callbacks?.onMessage(msg)
        } catch {
          // Ignore
        }
      }

      this.ws.onclose = () => {
        if (this.state === 'idle') return
        if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          this.attemptReconnect()
        } else {
          this.setState('disconnected')
        }
      }
    }, RECONNECT_DELAY)
  }
}

export const multiplayerService = new MultiplayerService()
