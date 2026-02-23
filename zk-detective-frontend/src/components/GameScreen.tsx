import { useEffect, useState, useRef } from 'react'
import { useGameStore } from '@/store/game-store'
import { TopBar } from './TopBar'
import { PixiRoomView } from './PixiRoomView'
import { AdventureDialogueBox } from './AdventureDialogueBox'
import { InventoryStrip } from './InventoryStrip'
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
  const selectedSuspect = useGameStore((s) => s.selectedSuspect)

  const [showToast, setShowToast] = useState(false)
  const [screenEffect, setScreenEffect] = useState<'none' | 'red' | 'white'>('none')
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Timer tick every second
  useEffect(() => {
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [tick])

  // Show toast + screen flash on wrong accusation
  useEffect(() => {
    if (lastAccusationResult === 'incorrect') {
      setShowToast(true)
      setScreenEffect('red')
      clearTimeout(toastTimerRef.current)
      toastTimerRef.current = setTimeout(() => setShowToast(false), 3000)
      setTimeout(() => setScreenEffect('none'), 400)
    } else if (lastAccusationResult === 'correct') {
      setScreenEffect('white')
      setTimeout(() => setScreenEffect('none'), 500)
    }
    return () => clearTimeout(toastTimerRef.current)
  }, [lastAccusationResult, wrongAccusationCount])

  const showAccusationModal = accusationStatus !== 'idle' && accusationStatus !== 'resolved'

  return (
    <div className="flex flex-col h-screen overflow-hidden animate-fade-in bg-detective-bg">
      <TopBar />

      {/* Wrong accusation toast */}
      {showToast && (
        <div
          key={wrongAccusationCount}
          className="absolute top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-detective-crimson/90 border border-detective-crimson rounded-lg animate-fade-in backdrop-blur-sm"
        >
          <XCircle className="w-4 h-4 text-white shrink-0" />
          <p className="font-pixel text-[9px] text-white">
            Wrong accusation! -500 points
          </p>
        </div>
      )}

      {/* Screen effect overlay */}
      {screenEffect !== 'none' && (
        <div
          className={`fixed inset-0 z-40 pointer-events-none ${
            screenEffect === 'red' ? 'screen-flash-red' : 'screen-flash-white'
          }`}
        />
      )}

      {/* Main game area — canvas fills available space */}
      <main className={`flex-1 min-h-0 relative ${
        accusationStatus === 'submitting' ? 'animate-accusation-zoom' : ''
      }`}>
        <PixiRoomView />

        {/* PvP opponent feed overlay */}
        {gameMode === 'pvp' && (
          <div className="absolute top-3 right-3 z-10 w-48">
            <OpponentFeed />
          </div>
        )}
      </main>

      {/* Adventure dialogue box — overlays bottom of screen when talking */}
      {selectedSuspect && <AdventureDialogueBox />}

      {/* Inventory strip — always visible at bottom */}
      <InventoryStrip />

      {/* Floating minimap (bottom-right, above inventory) */}
      <MiniMap />

      {/* Modal overlays */}
      {showSuspectsModal && <SuspectsModal />}
      {showInventoryModal && <InventoryModal />}
      {showAccusationModal && <AccusationModal />}
    </div>
  )
}
