import { useEffect } from 'react'
import { useGameStore } from '@/store/game-store'
import { getClueIcon } from '@/utils/icons'
import { X, Package, Search } from 'lucide-react'
import { audioManager } from '@/audio/AudioManager'

export function InventoryModal() {
  const collectedClues = useGameStore((s) => s.collectedClues)
  const clueCount = useGameStore((s) => s.clueCount)
  const totalClues = useGameStore((s) => s.totalClues)
  const closeInventoryModal = useGameStore((s) => s.closeInventoryModal)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeInventoryModal()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeInventoryModal])

  const keyEvidence = collectedClues.filter((c) => c.is_key_evidence)
  const regularEvidence = collectedClues.filter((c) => !c.is_key_evidence)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 animate-fade-in"
      onClick={closeInventoryModal}
    >
      <div
        className="bg-[#0d0d18] border-2 border-detective-gold/30 rounded-t-2xl sm:rounded-2xl w-full max-w-lg mx-0 sm:mx-4 max-h-[85vh] overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-detective-gold/20">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-detective-gold" />
            <h2 className="font-pixel text-sm font-bold text-detective-ink">
              Evidence
            </h2>
            <span className={`text-xs font-semibold ${clueCount === totalClues ? 'text-detective-teal' : 'text-detective-muted'}`}>
              ({clueCount}/{totalClues})
            </span>
          </div>
          <button
            onClick={() => { audioManager.playSfx('uiClick'); closeInventoryModal(); }}
            className="p-1.5 rounded-lg hover:bg-detective-gold/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-detective-gold/60 hover:text-detective-gold" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 space-y-4">
          {collectedClues.length === 0 ? (
            <div className="text-center py-8">
              <Search className="w-10 h-10 text-detective-muted/40 mx-auto mb-3" />
              <p className="text-sm text-detective-muted">
                No evidence collected yet.
              </p>
              <p className="text-xs text-detective-muted/60 mt-1">
                Inspect clues in rooms to build your case.
              </p>
            </div>
          ) : (
            <>
              {/* Key Evidence */}
              {keyEvidence.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-detective-gold uppercase tracking-wider mb-2">
                    Key Evidence
                  </h3>
                  <div className="space-y-2">
                    {keyEvidence.map((clue) => {
                      const Icon = getClueIcon(clue.icon)
                      return (
                        <div
                          key={clue.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-detective-gold-dim border border-detective-gold/20"
                        >
                          <Icon className="w-5 h-5 text-detective-gold shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-detective-gold">{clue.name}</p>
                            <p className="text-xs text-detective-ink/80 mt-0.5 leading-relaxed">{clue.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Regular Evidence */}
              {regularEvidence.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-detective-muted uppercase tracking-wider mb-2">
                    Evidence
                  </h3>
                  <div className="space-y-2">
                    {regularEvidence.map((clue) => {
                      const Icon = getClueIcon(clue.icon)
                      return (
                        <div
                          key={clue.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-detective-surface-light border border-detective-border"
                        >
                          <Icon className="w-5 h-5 text-detective-muted shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-detective-ink">{clue.name}</p>
                            <p className="text-xs text-detective-muted mt-0.5 leading-relaxed">{clue.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
