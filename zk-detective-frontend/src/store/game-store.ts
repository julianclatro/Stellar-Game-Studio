import { create } from 'zustand'
import type {
  ClientCaseData,
  Clue,
  Room,
  Suspect,
} from '@/data/types'
import { loadCase } from '@/data/case-loader'
import { RoomEngine } from '@/engines/room-engine'
import type { RoomSnapshot } from '@/engines/room-engine'
import { InventoryEngine } from '@/engines/inventory-engine'
import { DialogueEngine } from '@/engines/dialogue-engine'
import type { DialogueOption, DialogueResolution } from '@/engines/dialogue-engine'
import { AccusationEngine } from '@/engines/accusation-engine'
import type { AccusationStatus, AccusationResult } from '@/engines/accusation-engine'
import { generateSummary, formatTime } from '@/services/scoring-service'
import type { GameSummary } from '@/services/scoring-service'
import { contractService } from '@/services/contract-service'
import { initializeZk, generateAccusationProof, isZkReady } from '@/services/zk-integration'
import type { AccusationProof } from '@/services/zk-integration'
import { SUSPECT_IDS, WEAPON_IDS, ROOM_IDS } from '@/data/id-maps'
import { multiplayerService } from '@/services/multiplayer-service'
import type { ConnectionState, ServerMessage } from '@/services/multiplayer-types'
import type { DetectiveId } from '@/data/detectives'
import caseJson from '@/data/cases/meridian-manor.json'
import solutionJson from '@/data/cases/meridian-manor.solution.json'

export type GamePhase = 'title' | 'character-select' | 'matchmaking' | 'briefing' | 'playing' | 'result'

export interface OpponentState {
  name: string
  currentRoom: string
  clueCount: number
  roomCount: number
  wrongAccusations: number
}

export interface FeedEntry {
  text: string
  timestamp: number
}

export interface PvpResult {
  winner: string | null
  myScore: number
  opponentScore: number
  reason: string
}

export interface GameState {
  // Phase
  phase: GamePhase

  // F16: Detective character
  selectedDetective: DetectiveId | null
  opponentDetective: DetectiveId | null

  // F14: PvP mode
  gameMode: 'solo' | 'pvp'
  connectionState: ConnectionState
  opponent: OpponentState | null
  opponentFeed: FeedEntry[]
  pvpTimeRemaining: number
  pvpFormattedTime: string
  pvpResult: PvpResult | null
  playerName: string

  // Case data
  caseData: ClientCaseData | null

  // Engine instances (mutable, not tracked by Zustand directly)
  roomEngine: RoomEngine | null
  inventoryEngine: InventoryEngine | null
  dialogueEngine: DialogueEngine | null
  accusationEngine: AccusationEngine | null

  // Derived flat state (tracked by Zustand for re-renders)
  currentRoom: RoomSnapshot | null
  visitedRoomIds: string[]
  visitedRoomCount: number
  collectedClues: Clue[]
  clueCount: number
  totalClues: number

  // Dialogue state
  selectedSuspect: Suspect | null
  dialogueResolution: DialogueResolution | null
  activeDialogueText: string | null

  // Accusation state
  accusationStatus: AccusationStatus
  accusedSuspect: string | null
  accusedWeapon: string | null
  accusedRoom: string | null
  lastAccusationResult: AccusationResult | null
  wrongAccusationCount: number

  // Timer
  startTime: number
  elapsedSeconds: number
  formattedTime: string

  // Result
  gameSummary: GameSummary | null

  // F09: Contract + ZK integration state
  sessionId: number | null
  isSubmitting: boolean
  zkProof: AccusationProof | null
  txHash: string | null
  contractConnected: boolean
  zkReady: boolean

  // Solution reveal (for result narrative)
  correctSolution: { suspect: string; weapon: string; room: string } | null

  // Modal state
  showSuspectsModal: boolean
  showInventoryModal: boolean

  // Actions
  openSuspectsModal: () => void
  closeSuspectsModal: () => void
  openInventoryModal: () => void
  closeInventoryModal: () => void
  selectDetective: (id: DetectiveId) => void
  startBriefing: () => void
  startPvp: (playerName: string) => void
  startInvestigation: () => void
  navigateToRoom: (roomId: string) => void
  inspectClue: (clue: Clue) => void
  selectSuspect: (suspect: Suspect) => void
  dismissSuspect: () => void
  chooseDialogueOption: (option: DialogueOption) => void
  beginAccusation: () => void
  cancelAccusation: () => void
  selectAccusedSuspect: (id: string) => void
  selectAccusedWeapon: (id: string) => void
  selectAccusedRoom: (id: string) => void
  confirmAccusation: () => void
  submitAccusation: () => void
  tick: () => void
  resetGame: () => void
}

const MAX_FEED_ENTRIES = 8

export const useGameStore = create<GameState>((set, get) => {
  function _refreshSnapshot() {
    const { roomEngine, inventoryEngine, dialogueEngine, accusationEngine, selectedSuspect } = get()
    if (!roomEngine || !inventoryEngine || !accusationEngine) return

    const currentRoom = roomEngine.getSnapshot()
    const collectedClues = [...inventoryEngine.getCollectedClues()]
    const visitedIds = [...roomEngine.getVisitedRoomIds()]

    let dialogueResolution: DialogueResolution | null = null
    if (selectedSuspect && dialogueEngine) {
      dialogueResolution = dialogueEngine.resolve(selectedSuspect)
    }

    const currentAccusation = accusationEngine.getCurrentAccusation()

    set({
      currentRoom,
      visitedRoomIds: visitedIds,
      visitedRoomCount: roomEngine.getVisitedCount(),
      collectedClues,
      clueCount: inventoryEngine.getClueCount(),
      dialogueResolution,
      accusationStatus: accusationEngine.getStatus(),
      accusedSuspect: currentAccusation.suspect ?? null,
      accusedWeapon: currentAccusation.weapon ?? null,
      accusedRoom: currentAccusation.room ?? null,
      wrongAccusationCount: accusationEngine.getWrongAccusationCount(),
    })
  }

  function _pushFeed(text: string) {
    const { opponentFeed } = get()
    const entry: FeedEntry = { text, timestamp: Date.now() }
    const updated = [entry, ...opponentFeed].slice(0, MAX_FEED_ENTRIES)
    set({ opponentFeed: updated })
  }

  function _handleServerMessage(msg: ServerMessage) {
    switch (msg.type) {
      case 'waiting':
        set({ connectionState: 'waiting' })
        break

      case 'matched': {
        const caseData = loadCase(caseJson as unknown as ClientCaseData)
        const sessionId = Math.floor(Date.now() / 1000) % 1_000_000
        set({
          phase: 'briefing',
          connectionState: 'matched',
          caseData,
          sessionId,
          opponent: {
            name: msg.opponentName,
            currentRoom: 'bedroom',
            clueCount: 0,
            roomCount: 1,
            wrongAccusations: 0,
          },
          pvpTimeRemaining: msg.timeLimit,
          pvpFormattedTime: formatTime(msg.timeLimit),
          lastAccusationResult: null,
          gameSummary: null,
          correctSolution: null,
          isSubmitting: false,
          zkProof: null,
          txHash: null,
          opponentDetective: (msg.opponentDetective as DetectiveId) ?? null,
          pvpResult: null,
          opponentFeed: [],
        })
        break
      }

      case 'opponent_moved': {
        const { opponent } = get()
        if (!opponent) break
        const roomCount = opponent.currentRoom !== msg.room ? opponent.roomCount + 1 : opponent.roomCount
        set({
          opponent: { ...opponent, currentRoom: msg.room, roomCount },
        })
        _pushFeed(`Moved to ${msg.room}`)
        break
      }

      case 'opponent_inspected': {
        const { opponent } = get()
        if (!opponent) break
        set({
          opponent: { ...opponent, clueCount: opponent.clueCount + 1 },
        })
        _pushFeed('Found a clue')
        break
      }

      case 'opponent_interrogated':
        _pushFeed('Interrogated a suspect')
        break

      case 'opponent_accused': {
        const { opponent } = get()
        if (!opponent) break
        if (!msg.correct) {
          set({
            opponent: { ...opponent, wrongAccusations: opponent.wrongAccusations + 1 },
          })
          _pushFeed('Wrong accusation!')
        } else {
          _pushFeed('Solved the case!')
        }
        break
      }

      case 'accusation_result': {
        const { accusationEngine } = get()
        if (!accusationEngine) break

        const result: AccusationResult = msg.correct ? 'correct' : 'incorrect'
        accusationEngine.resolveResult(result)

        if (msg.correct) {
          set({ lastAccusationResult: 'correct' })
        } else {
          set({ lastAccusationResult: 'incorrect' })
        }
        _refreshSnapshot()
        break
      }

      case 'timer_sync':
        set({
          pvpTimeRemaining: msg.remaining,
          pvpFormattedTime: formatTime(msg.remaining),
        })
        break

      case 'game_over': {
        const { caseData, inventoryEngine, roomEngine, accusationEngine, elapsedSeconds } = get()

        // Build summary for the result screen
        let summary: GameSummary | null = null
        if (caseData && inventoryEngine && roomEngine && accusationEngine) {
          const elapsedLedgers = Math.floor(elapsedSeconds / 5)
          const solved = msg.winner === get().playerName
          summary = generateSummary(caseData, {
            startLedger: 0,
            solveLedger: elapsedLedgers,
            cluesInspected: inventoryEngine.getClueCount(),
            roomsVisited: roomEngine.getVisitedCount(),
            wrongAccusations: accusationEngine.getWrongAccusationCount(),
          }, solved)
          // Override with the server's authoritative scores
          summary.score = msg.myScore
          summary.breakdown.finalScore = msg.myScore
        }

        set({
          phase: 'result',
          gameSummary: summary,
          pvpResult: {
            winner: msg.winner,
            myScore: msg.myScore,
            opponentScore: msg.opponentScore,
            reason: msg.reason,
          },
          correctSolution: solutionJson.solution,
        })
        break
      }

      case 'opponent_disconnected':
        _pushFeed(`Opponent disconnected (${msg.gracePeriod}s to reconnect)`)
        break

      case 'opponent_reconnected':
        _pushFeed('Opponent reconnected')
        break

      case 'error':
        console.warn('[F14] Server error:', msg.message)
        break
    }
  }

  return {
    // Initial state
    phase: 'title',
    selectedDetective: null,
    opponentDetective: null,
    gameMode: 'solo',
    connectionState: 'idle',
    opponent: null,
    opponentFeed: [],
    pvpTimeRemaining: 0,
    pvpFormattedTime: '0m 0s',
    pvpResult: null,
    playerName: '',
    caseData: null,
    roomEngine: null,
    inventoryEngine: null,
    dialogueEngine: null,
    accusationEngine: null,
    currentRoom: null,
    visitedRoomIds: [],
    visitedRoomCount: 0,
    collectedClues: [],
    clueCount: 0,
    totalClues: 11,
    selectedSuspect: null,
    dialogueResolution: null,
    activeDialogueText: null,
    accusationStatus: 'idle' as AccusationStatus,
    accusedSuspect: null,
    accusedWeapon: null,
    accusedRoom: null,
    lastAccusationResult: null,
    wrongAccusationCount: 0,
    startTime: 0,
    elapsedSeconds: 0,
    formattedTime: '0m 0s',
    gameSummary: null,
    sessionId: null,
    isSubmitting: false,
    zkProof: null,
    txHash: null,
    contractConnected: false,
    zkReady: false,
    correctSolution: null,
    showSuspectsModal: false,
    showInventoryModal: false,

    openSuspectsModal: () => set({ showSuspectsModal: true }),
    closeSuspectsModal: () => set({ showSuspectsModal: false }),
    openInventoryModal: () => set({ showInventoryModal: true }),
    closeInventoryModal: () => set({ showInventoryModal: false }),

    selectDetective: (id: DetectiveId) => {
      const { gameMode, playerName } = get()
      set({ selectedDetective: id })
      if (gameMode === 'pvp') {
        // PvP: proceed to matchmaking
        set({
          phase: 'matchmaking',
          connectionState: 'connecting',
        })
        multiplayerService.connect(playerName, {
          onMessage: _handleServerMessage,
          onStateChange: (state) => set({ connectionState: state }),
        }, id)
      } else {
        // Solo: proceed to briefing
        const caseData = loadCase(caseJson as unknown as ClientCaseData)
        const sessionId = Math.floor(Date.now() / 1000) % 1_000_000
        set({
          phase: 'briefing',
          caseData,
          sessionId,
          lastAccusationResult: null,
          gameSummary: null,
          correctSolution: null,
          isSubmitting: false,
          zkProof: null,
          txHash: null,
          pvpResult: null,
          opponent: null,
          opponentFeed: [],
        })

        const contractAvailable = contractService.isAvailable()
        console.log('[F09] Contract available:', contractAvailable, '| Session:', sessionId)
        if (contractAvailable) {
          contractService.startGame(sessionId, 1).then(() => {
            set({ contractConnected: true })
            console.log('[F09] Contract game session started:', sessionId)
          }).catch((err) => {
            console.warn('[F09] Contract start failed (offline mode):', err)
            set({ contractConnected: false })
          })
        }
        initializeZk().then((ready) => {
          set({ zkReady: ready })
        })
      }
    },

    startBriefing: () => {
      // Go to character select first; actual briefing starts after detective choice
      set({
        phase: 'character-select',
        gameMode: 'solo',
        selectedDetective: null,
        opponentDetective: null,
        // Reset stale state
        lastAccusationResult: null,
        gameSummary: null,
        correctSolution: null,
        pvpResult: null,
        opponent: null,
        opponentFeed: [],
      })
    },

    startPvp: (playerName: string) => {
      // Go to character select first; matchmaking starts after detective choice
      set({
        phase: 'character-select',
        gameMode: 'pvp',
        connectionState: 'idle',
        playerName,
        selectedDetective: null,
        opponentDetective: null,
        // Reset stale state
        lastAccusationResult: null,
        gameSummary: null,
        correctSolution: null,
        pvpResult: null,
        opponent: null,
        opponentFeed: [],
      })
    },

    startInvestigation: () => {
      const { caseData, gameMode } = get()
      if (!caseData) return

      const inventoryEngine = new InventoryEngine()
      const roomEngine = new RoomEngine(caseData, 'bedroom')
      const dialogueEngine = new DialogueEngine(inventoryEngine)
      const accusationEngine = new AccusationEngine(caseData)

      set({
        phase: 'playing',
        connectionState: gameMode === 'pvp' ? 'playing' : 'idle',
        roomEngine,
        inventoryEngine,
        dialogueEngine,
        accusationEngine,
        totalClues: caseData.rooms.reduce((sum, r) => sum + r.clues.length, 0),
        startTime: Date.now(),
        elapsedSeconds: 0,
        formattedTime: '0m 0s',
        selectedSuspect: null,
        dialogueResolution: null,
        activeDialogueText: null,
      })

      _refreshSnapshot()
    },

    navigateToRoom: (roomId: string) => {
      const { roomEngine, gameMode } = get()
      if (!roomEngine) return
      roomEngine.navigateTo(roomId)
      set({ selectedSuspect: null, dialogueResolution: null, activeDialogueText: null })
      _refreshSnapshot()
      if (gameMode === 'pvp') multiplayerService.sendMove(roomId)
    },

    inspectClue: (clue: Clue) => {
      const { inventoryEngine, gameMode } = get()
      if (!inventoryEngine) return
      inventoryEngine.inspectClue(clue)
      _refreshSnapshot()
      if (gameMode === 'pvp') multiplayerService.sendInspect(clue.id)
    },

    selectSuspect: (suspect: Suspect) => {
      const { dialogueEngine, gameMode } = get()
      if (!dialogueEngine) return
      const resolution = dialogueEngine.resolve(suspect)
      set({
        selectedSuspect: suspect,
        dialogueResolution: resolution,
        activeDialogueText: resolution.currentDialogue.text,
        showSuspectsModal: false,
      })
      if (gameMode === 'pvp') multiplayerService.sendInterrogate(suspect.id)
    },

    dismissSuspect: () => {
      set({
        selectedSuspect: null,
        dialogueResolution: null,
        activeDialogueText: null,
      })
    },

    chooseDialogueOption: (option: DialogueOption) => {
      const { dialogueEngine, selectedSuspect } = get()
      if (!dialogueEngine || !selectedSuspect) return
      dialogueEngine.markSeen(selectedSuspect.id, option)
      set({ activeDialogueText: option.text })
      _refreshSnapshot()
    },

    beginAccusation: () => {
      const { accusationEngine } = get()
      if (!accusationEngine) return
      accusationEngine.beginAccusation()
      set({ lastAccusationResult: null })
      _refreshSnapshot()
    },

    cancelAccusation: () => {
      const { accusationEngine } = get()
      if (!accusationEngine) return
      accusationEngine.cancelAccusation()
      _refreshSnapshot()
    },

    selectAccusedSuspect: (id: string) => {
      const { accusationEngine } = get()
      if (!accusationEngine) return
      accusationEngine.selectSuspect(id)
      _refreshSnapshot()
    },

    selectAccusedWeapon: (id: string) => {
      const { accusationEngine } = get()
      if (!accusationEngine) return
      accusationEngine.selectWeapon(id)
      _refreshSnapshot()
    },

    selectAccusedRoom: (id: string) => {
      const { accusationEngine } = get()
      if (!accusationEngine) return
      accusationEngine.selectRoom(id)
      _refreshSnapshot()
    },

    confirmAccusation: () => {
      const { accusationEngine } = get()
      if (!accusationEngine) return
      accusationEngine.confirm()
      _refreshSnapshot()
    },

    submitAccusation: async () => {
      const {
        accusationEngine, caseData, inventoryEngine, roomEngine,
        startTime, sessionId, contractConnected, zkReady, gameMode,
      } = get()
      if (!accusationEngine || !caseData || !inventoryEngine || !roomEngine) return

      set({ isSubmitting: true })

      const submitted = accusationEngine.submit()

      // In PvP mode, send accusation to server and wait for result
      if (gameMode === 'pvp') {
        multiplayerService.sendAccuse(submitted.suspect, submitted.weapon, submitted.room)
        set({ isSubmitting: false })
        // Server will respond with accusation_result + possibly game_over
        return
      }

      // Solo mode: local correctness check
      const solution = solutionJson.solution
      const isCorrect =
        submitted.suspect === solution.suspect &&
        submitted.weapon === solution.weapon &&
        submitted.room === solution.room

      // Run ZK proof + contract call in parallel (non-blocking)
      const promises: Promise<any>[] = []

      // ZK proof generation (client-side)
      if (zkReady) {
        promises.push(
          generateAccusationProof(
            { suspect: submitted.suspect, weapon: submitted.weapon, room: submitted.room },
            solution,
            solutionJson.salt,
            // Pedersen commitment from solution JSON (for ZK circuit)
            (caseJson as any).commitment ?? '',
          ).then((proof) => {
            if (proof) set({ zkProof: proof })
          })
        )
      }

      // Contract accusation (on-chain)
      if (contractConnected && sessionId != null) {
        const suspectId = SUSPECT_IDS[submitted.suspect]
        const weaponId = WEAPON_IDS[submitted.weapon]
        const roomId = ROOM_IDS[submitted.room]

        if (suspectId && weaponId && roomId) {
          promises.push(
            contractService.accuse(
              sessionId, suspectId, weaponId, roomId, solutionJson.salt,
            ).then((result) => {
              set({ txHash: result.txHash })
              console.log(`[F09] Contract accuse: correct=${result.isCorrect}, tx=${result.txHash}`)
            }).catch((err) => {
              console.warn('[F09] Contract accuse failed:', err)
            })
          )
        }
      }

      // Wait for all parallel operations
      if (promises.length > 0) {
        await Promise.allSettled(promises)
      }

      set({ isSubmitting: false })

      // Resolve the accusation result
      const result: AccusationResult = isCorrect ? 'correct' : 'incorrect'
      accusationEngine.resolveResult(result)

      if (isCorrect) {
        const elapsedMs = Date.now() - startTime
        const elapsedLedgers = Math.floor(elapsedMs / 5000)
        const summary = generateSummary(caseData, {
          startLedger: 0,
          solveLedger: elapsedLedgers,
          cluesInspected: inventoryEngine.getClueCount(),
          roomsVisited: roomEngine.getVisitedCount(),
          wrongAccusations: accusationEngine.getWrongAccusationCount(),
        }, true)
        set({
          phase: 'result',
          gameSummary: summary,
          lastAccusationResult: 'correct',
          correctSolution: solution,
        })
      } else {
        set({ lastAccusationResult: 'incorrect' })
      }

      _refreshSnapshot()
    },

    tick: () => {
      const { startTime, phase, gameMode, pvpTimeRemaining } = get()
      if (phase !== 'playing' || startTime === 0) return

      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      set({
        elapsedSeconds: elapsed,
        formattedTime: formatTime(elapsed),
      })

      // PvP: local countdown between server syncs
      if (gameMode === 'pvp' && pvpTimeRemaining > 0) {
        const remaining = Math.max(0, pvpTimeRemaining - 1)
        set({
          pvpTimeRemaining: remaining,
          pvpFormattedTime: formatTime(remaining),
        })
      }
    },

    resetGame: () => {
      multiplayerService.disconnect()
      set({
        phase: 'title',
        selectedDetective: null,
        opponentDetective: null,
        gameMode: 'solo',
        connectionState: 'idle',
        opponent: null,
        opponentFeed: [],
        pvpTimeRemaining: 0,
        pvpFormattedTime: '0m 0s',
        pvpResult: null,
        playerName: '',
        caseData: null,
        roomEngine: null,
        inventoryEngine: null,
        dialogueEngine: null,
        accusationEngine: null,
        currentRoom: null,
        visitedRoomIds: [],
        visitedRoomCount: 0,
        collectedClues: [],
        clueCount: 0,
        totalClues: 11,
        selectedSuspect: null,
        dialogueResolution: null,
        activeDialogueText: null,
        accusationStatus: 'idle' as AccusationStatus,
        accusedSuspect: null,
        accusedWeapon: null,
        accusedRoom: null,
        lastAccusationResult: null,
        wrongAccusationCount: 0,
        startTime: 0,
        elapsedSeconds: 0,
        formattedTime: '0m 0s',
        gameSummary: null,
        correctSolution: null,
        sessionId: null,
        isSubmitting: false,
        zkProof: null,
        txHash: null,
        contractConnected: false,
        zkReady: false,
        showSuspectsModal: false,
        showInventoryModal: false,
      })
    },
  }
})
