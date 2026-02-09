import { useEffect, useState, useRef } from 'react'
import { useGameStore } from '@/store/game-store'
import { TopBar } from './TopBar'
import { RoomView } from './RoomView'
import { DialoguePanel } from './DialoguePanel'
import { ActionBar } from './ActionBar'
import { AccusationModal } from './AccusationModal'
import { SuspectsModal } from './SuspectsModal'
import { InventoryModal } from './InventoryModal'
import { MiniMap } from './MiniMap'
import { OpponentFeed } from './OpponentFeed'
import { XCircle } from 'lucide-react'

export function GameScreen() {
  const tick = useGameStore((s) => s.tick)
  const accusationStatus = useGameStore((s) => s.accusationStatus)
  const showSuspectsModal = useGameStore((s) => s.showSuspectsModal)
  const showInventoryModal = useGameStore((s) => s.showInventoryModal)
  const lastAccusationResult = useGameStore((s) => s.lastAccusationResult)
  const wrongAccusationCount = useGameStore((s) => s.wrongAccusationCount)
  const gameMode = useGameStore((s) => s.gameMode)

  const [showToast, setShowToast] = useState(false)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Timer tick every second
  useEffect(() => {
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [tick])

  // Show toast on wrong accusation
  useEffect(() => {
    if (lastAccusationResult === 'incorrect') {
      setShowToast(true)
      clearTimeout(toastTimerRef.current)
      toastTimerRef.current = setTimeout(() => setShowToast(false), 3000)
    }
    return () => clearTimeout(toastTimerRef.current)
  }, [lastAccusationResult, wrongAccusationCount])

  const showAccusationModal = accusationStatus !== 'idle' && accusationStatus !== 'resolved'

  return (
    <div className="flex flex-col h-screen overflow-hidden animate-fade-in">
      <TopBar />

      {/* Wrong accusation toast */}
      {showToast && (
        <div
          key={wrongAccusationCount}
          className="mx-3 mt-1 flex items-center gap-2 px-4 py-2.5 bg-detective-crimson/15 border border-detective-crimson/30 rounded-lg animate-fade-in"
        >
          <XCircle className="w-4 h-4 text-detective-crimson shrink-0" />
          <p className="text-sm text-detective-crimson font-medium">
            Wrong accusation! -500 points. Keep investigating.
          </p>
        </div>
      )}

      {/* Main scrollable content */}
      <main className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        <RoomView />
        <DialoguePanel />
        {gameMode === 'pvp' && <OpponentFeed />}
      </main>

      {/* Sticky bottom action bar */}
      <ActionBar />

      {/* Floating minimap (bottom-right) */}
      <MiniMap />

      {/* Modal overlays */}
      {showSuspectsModal && <SuspectsModal />}
      {showInventoryModal && <InventoryModal />}
      {showAccusationModal && <AccusationModal />}
    </div>
  )
}
