// Inventory Strip — horizontal clue strip with golden key evidence borders,
// scroll arrows, and ACCUSE button. Classic adventure game inventory bar.

import { useRef, useState, useEffect } from 'react'
import { useGameStore } from '@/store/game-store'
import { getClueImage } from '@/utils/asset-paths'
import { getClueIcon } from '@/utils/icons'
import { Crosshair, ChevronLeft, ChevronRight, Users, Package } from 'lucide-react'

export function InventoryStrip() {
  const collectedClues = useGameStore((s) => s.collectedClues)
  const clueCount = useGameStore((s) => s.clueCount)
  const totalClues = useGameStore((s) => s.totalClues)
  const beginAccusation = useGameStore((s) => s.beginAccusation)
  const openSuspectsModal = useGameStore((s) => s.openSuspectsModal)
  const openInventoryModal = useGameStore((s) => s.openInventoryModal)
  const lastAccusationResult = useGameStore((s) => s.lastAccusationResult)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [hoveredClue, setHoveredClue] = useState<string | null>(null)
  const [newClueId, setNewClueId] = useState<string | null>(null)
  const prevCountRef = useRef(collectedClues.length)

  // Track newly added clues for receive animation
  useEffect(() => {
    if (collectedClues.length > prevCountRef.current) {
      const newest = collectedClues[collectedClues.length - 1]
      if (newest) {
        setNewClueId(newest.id)
        const timer = setTimeout(() => setNewClueId(null), 600)
        return () => clearTimeout(timer)
      }
    }
    prevCountRef.current = collectedClues.length
  }, [collectedClues])

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -120 : 120,
      behavior: 'smooth',
    })
  }

  const allCollected = clueCount === totalClues

  return (
    <div className="shrink-0 bg-black/90 backdrop-blur-sm border-t border-detective-border">
      <div className="flex items-center gap-2 px-2 py-1.5">
        {/* Left controls: Suspects + Inventory detail */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={openSuspectsModal}
            className="p-2 rounded-lg border border-detective-border text-detective-muted hover:text-detective-gold hover:border-detective-gold/30 transition-all cursor-pointer"
            title="Suspects"
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            onClick={openInventoryModal}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              allCollected
                ? 'border-detective-teal/30 text-detective-teal'
                : 'border-detective-border text-detective-muted hover:text-detective-gold hover:border-detective-gold/30'
            }`}
            title="Evidence Detail"
          >
            <Package className="w-4 h-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-detective-border shrink-0" />

        {/* Scroll left */}
        {collectedClues.length > 6 && (
          <button
            onClick={() => scroll('left')}
            className="p-1 text-detective-muted hover:text-detective-gold transition-colors cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Clue icons strip */}
        <div
          ref={scrollRef}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto inventory-scroll min-w-0"
        >
          {collectedClues.length === 0 ? (
            <p className="text-[10px] text-detective-muted/50 font-pixel px-2">
              No evidence collected
            </p>
          ) : (
            collectedClues.map((clue) => {
              const image = getClueImage(clue.id)
              const Icon = getClueIcon(clue.icon)
              const isKey = clue.is_key_evidence

              return (
                <div
                  key={clue.id}
                  className="relative shrink-0"
                  onMouseEnter={() => setHoveredClue(clue.id)}
                  onMouseLeave={() => setHoveredClue(null)}
                >
                  <div
                    className={`w-11 h-11 rounded-lg border-2 overflow-hidden flex items-center justify-center bg-detective-surface transition-all ${
                      isKey
                        ? 'border-detective-gold shadow-[0_0_8px_rgba(212,168,67,0.4)]'
                        : 'border-detective-border'
                    } ${newClueId === clue.id ? 'animate-inventory-receive animate-sparkle-burst' : ''}`}
                  >
                    {image ? (
                      <img src={image} alt={clue.name} className="w-full h-full object-cover" />
                    ) : (
                      <Icon className={`w-5 h-5 ${isKey ? 'text-detective-gold' : 'text-detective-muted'}`} />
                    )}
                  </div>

                  {/* Tooltip on hover */}
                  {hoveredClue === clue.id && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 pointer-events-none animate-fade-in">
                      <div className="px-2 py-1 bg-black/90 rounded border border-detective-border whitespace-nowrap">
                        <p className="font-pixel text-[8px] text-detective-ink">{clue.name}</p>
                        {isKey && (
                          <p className="text-[8px] text-detective-gold">Key Evidence</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Scroll right */}
        {collectedClues.length > 6 && (
          <button
            onClick={() => scroll('right')}
            className="p-1 text-detective-muted hover:text-detective-gold transition-colors cursor-pointer shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Divider */}
        <div className="w-px h-8 bg-detective-border shrink-0" />

        {/* Clue counter */}
        <div className="shrink-0 text-center px-1">
          <p className="font-pixel text-[8px] text-detective-muted">{clueCount}/{totalClues}</p>
        </div>

        {/* ACCUSE button */}
        <button
          onClick={beginAccusation}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-detective-crimson text-white font-semibold text-sm rounded-lg hover:brightness-110 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Crosshair className="w-4 h-4" />
          <span className="font-pixel text-[9px]">ACCUSE</span>
        </button>
      </div>

      {/* Wrong accusation indicator */}
      {lastAccusationResult === 'incorrect' && (
        <div className="px-3 pb-1">
          <p className="font-pixel text-[8px] text-detective-crimson animate-fade-in text-center">
            Wrong accusation! -500 pts
          </p>
        </div>
      )}
    </div>
  )
}
