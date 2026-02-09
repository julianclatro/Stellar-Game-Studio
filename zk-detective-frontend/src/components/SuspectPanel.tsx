import { useGameStore } from '@/store/game-store'
import type { Suspect } from '@/data/types'
import { getSuspectImage } from '@/utils/asset-paths'
import { MessageCircle } from 'lucide-react'

interface SuspectPanelProps {
  side: 'left' | 'right'
}

export function SuspectPanel({ side }: SuspectPanelProps) {
  const caseData = useGameStore((s) => s.caseData)
  const dialogueEngine = useGameStore((s) => s.dialogueEngine)
  const selectedSuspect = useGameStore((s) => s.selectedSuspect)
  const selectSuspect = useGameStore((s) => s.selectSuspect)
  const currentRoom = useGameStore((s) => s.currentRoom)

  if (!caseData || !dialogueEngine) return null

  const allSuspects = caseData.suspects
  const midpoint = Math.ceil(allSuspects.length / 2)
  const suspects = side === 'left'
    ? allSuspects.slice(0, midpoint)
    : allSuspects.slice(midpoint)

  const currentRoomSuspectIds = new Set(
    currentRoom?.suspects.map((s) => s.id) ?? []
  )

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-detective-muted uppercase tracking-wider px-1 mb-1">
        Suspects
      </h3>
      {suspects.map((suspect) => (
        <SuspectCard
          key={suspect.id}
          suspect={suspect}
          isSelected={selectedSuspect?.id === suspect.id}
          isInRoom={currentRoomSuspectIds.has(suspect.id)}
          hasNewDialogue={dialogueEngine.hasUnseenDialogue(suspect)}
          onSelect={() => selectSuspect(suspect)}
        />
      ))}
    </div>
  )
}

function SuspectCard({
  suspect,
  isSelected,
  isInRoom,
  hasNewDialogue,
  onSelect,
}: {
  suspect: Suspect
  isSelected: boolean
  isInRoom: boolean
  hasNewDialogue: boolean
  onSelect: () => void
}) {
  const initials = suspect.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const portrait = getSuspectImage(suspect.id)

  return (
    <button
      onClick={onSelect}
      className={`
        relative flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer
        ${isSelected
          ? 'bg-detective-gold-dim border-detective-gold/30 text-detective-gold'
          : isInRoom
            ? 'bg-detective-surface-light border-detective-border text-detective-ink hover:border-detective-gold/20'
            : 'bg-detective-surface border-detective-border text-detective-muted hover:border-detective-border'
        }
        ${!isInRoom ? 'opacity-50' : ''}
      `}
    >
      {/* Avatar / Portrait */}
      {portrait ? (
        <img
          src={portrait}
          alt={suspect.name}
          className={`
            w-9 h-9 rounded-full object-cover shrink-0 border
            ${isSelected
              ? 'border-detective-gold'
              : 'border-detective-border'
            }
          `}
        />
      ) : (
        <div
          className={`
            w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0
            ${isSelected
              ? 'bg-detective-gold text-detective-bg'
              : isInRoom
                ? 'bg-detective-surface-light text-detective-ink border border-detective-border'
                : 'bg-detective-surface text-detective-muted border border-detective-border'
            }
          `}
        >
          {initials}
        </div>
      )}

      {/* Info */}
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{suspect.name}</p>
        <p className="text-xs opacity-60 truncate">{suspect.role}</p>
      </div>

      {/* New dialogue badge */}
      {hasNewDialogue && isInRoom && (
        <div className="absolute top-2 right-2">
          <MessageCircle className="w-4 h-4 text-detective-gold" />
        </div>
      )}
    </button>
  )
}
