// Audio Bridge — subscribes to Zustand store changes and triggers audio.
// This is the glue between game state and sound.

import { useGameStore } from '@/store/game-store'
import { audioManager } from './AudioManager'
import type { GamePhase } from '@/store/game-store'

let prevPhase: GamePhase | null = null
let prevRoomId: string | null = null
let prevClueCount = 0
let prevAccusationResult: string | null = null
let initialized = false

export function initAudioBridge() {
  if (initialized) return
  initialized = true

  useGameStore.subscribe((state) => {
    // Phase changes → music
    if (state.phase !== prevPhase) {
      switch (state.phase) {
        case 'title':
          audioManager.playMusic('title')
          break
        case 'briefing':
        case 'character-select':
          // Keep title music or quiet
          break
        case 'playing':
          audioManager.playMusic('investigation')
          break
        case 'result': {
          const won = state.lastAccusationResult === 'correct' ||
            (state.pvpResult?.winner === state.playerName)
          audioManager.playMusic(won ? 'victory' : 'defeat')
          break
        }
      }
      prevPhase = state.phase
    }

    // Room navigation → door SFX
    const roomId = state.currentRoom?.room.id ?? null
    if (roomId && roomId !== prevRoomId && prevRoomId !== null) {
      audioManager.playSfx('door')
    }
    prevRoomId = roomId

    // Clue collection → pickup SFX
    if (state.clueCount > prevClueCount && prevClueCount > 0) {
      audioManager.playSfx('cluePickup')
    }
    prevClueCount = state.clueCount

    // Accusation result → sting/buzz SFX
    const accResult = state.lastAccusationResult
    if (accResult && accResult !== prevAccusationResult) {
      if (accResult === 'correct') {
        audioManager.playSfx('correctSting')
      } else if (accResult === 'incorrect') {
        audioManager.playSfx('wrongBuzz')
      }
    }
    prevAccusationResult = accResult

    // Accusation submit → slam SFX
    if (state.accusationStatus === 'submitting') {
      audioManager.playSfx('accusationSlam')
    }
  })
}
