import { useGameStore } from '@/store/game-store'
import { getClueIcon } from '@/utils/icons'
import { Package } from 'lucide-react'

export function InventoryPanel() {
  const collectedClues = useGameStore((s) => s.collectedClues)
  const clueCount = useGameStore((s) => s.clueCount)
  const totalClues = useGameStore((s) => s.totalClues)

  return (
    <div className="bg-detective-surface border border-detective-border rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <Package className="w-3.5 h-3.5 text-detective-gold" />
        <h3 className="text-xs font-semibold text-detective-muted uppercase tracking-wider">
          Evidence ({clueCount}/{totalClues})
        </h3>
      </div>

      {collectedClues.length === 0 ? (
        <p className="text-xs text-detective-muted/60 italic">
          No evidence collected yet. Inspect clues in rooms to build your case.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {collectedClues.map((clue) => {
            const Icon = getClueIcon(clue.icon)
            return (
              <div
                key={clue.id}
                className={`
                  group relative flex items-center gap-1.5 px-2 py-1 rounded-md text-xs
                  ${clue.is_key_evidence
                    ? 'bg-detective-gold-dim border border-detective-gold/20 text-detective-gold'
                    : 'bg-detective-surface-light border border-detective-border text-detective-muted'
                  }
                `}
                title={clue.description}
              >
                <Icon className="w-3 h-3" />
                <span className="font-medium">{clue.name}</span>
                {clue.is_key_evidence && (
                  <span className="text-[10px] opacity-60">KEY</span>
                )}
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-50 pointer-events-none">
                  <div className="bg-detective-bg border border-detective-border rounded-lg p-2 shadow-lg max-w-[200px]">
                    <p className="text-xs text-detective-ink">{clue.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
