import { useGameStore } from '@/store/game-store'
import { Users, Package, Crosshair } from 'lucide-react'

export function ActionBar() {
  const clueCount = useGameStore((s) => s.clueCount)
  const totalClues = useGameStore((s) => s.totalClues)
  const openSuspectsModal = useGameStore((s) => s.openSuspectsModal)
  const openInventoryModal = useGameStore((s) => s.openInventoryModal)
  const beginAccusation = useGameStore((s) => s.beginAccusation)
  const lastAccusationResult = useGameStore((s) => s.lastAccusationResult)

  const allCollected = clueCount === totalClues

  return (
    <div className="shrink-0 flex items-center justify-between gap-3 px-3 py-2 border-t border-detective-border bg-detective-surface">
      {/* Left: Suspects + Evidence buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={openSuspectsModal}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-detective-border text-sm font-medium text-detective-ink hover:border-detective-gold/30 hover:text-detective-gold transition-all cursor-pointer"
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">Suspects</span>
        </button>

        <button
          onClick={openInventoryModal}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer
            ${allCollected
              ? 'border-detective-teal/30 text-detective-teal hover:bg-detective-teal/10'
              : 'border-detective-border text-detective-ink hover:border-detective-gold/30 hover:text-detective-gold'
            }
          `}
        >
          <Package className="w-4 h-4" />
          <span className="hidden sm:inline">Evidence</span>
          <span className="text-xs opacity-70">{clueCount}/{totalClues}</span>
        </button>
      </div>

      {/* Right: ACCUSE */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <button
          onClick={beginAccusation}
          className="flex items-center gap-2 px-5 py-2.5 bg-detective-crimson text-white font-semibold rounded-lg hover:brightness-110 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Crosshair className="w-4 h-4" />
          ACCUSE
        </button>
        {lastAccusationResult === 'incorrect' && (
          <p className="text-[10px] text-detective-crimson animate-fade-in">
            Wrong accusation!
          </p>
        )}
      </div>
    </div>
  )
}
