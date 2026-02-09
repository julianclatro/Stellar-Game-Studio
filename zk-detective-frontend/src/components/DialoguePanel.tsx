import { useGameStore } from '@/store/game-store'
import { getSuspectImage } from '@/utils/asset-paths'
import { X, MessageSquare } from 'lucide-react'

export function DialoguePanel() {
  const selectedSuspect = useGameStore((s) => s.selectedSuspect)
  const dialogueResolution = useGameStore((s) => s.dialogueResolution)
  const activeDialogueText = useGameStore((s) => s.activeDialogueText)
  const dismissSuspect = useGameStore((s) => s.dismissSuspect)
  const chooseDialogueOption = useGameStore((s) => s.chooseDialogueOption)

  if (!selectedSuspect || !dialogueResolution) return null

  const { availableOptions } = dialogueResolution

  return (
    <div className="bg-detective-surface border border-detective-border rounded-xl p-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {getSuspectImage(selectedSuspect.id) ? (
            <img
              src={getSuspectImage(selectedSuspect.id)}
              alt={selectedSuspect.name}
              className="w-8 h-8 rounded-full object-cover border border-detective-gold"
            />
          ) : (
            <MessageSquare className="w-4 h-4 text-detective-gold" />
          )}
          <h3 className="font-display text-base font-semibold text-detective-ink">
            {selectedSuspect.name}
          </h3>
          <span className="text-xs text-detective-muted">— {selectedSuspect.role}</span>
        </div>
        <button
          onClick={dismissSuspect}
          className="p-1 rounded hover:bg-detective-surface-light transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 text-detective-muted" />
        </button>
      </div>

      {/* Dialogue text */}
      {activeDialogueText && (
        <div className="bg-detective-bg rounded-lg p-3 mb-3 border border-detective-border">
          <p className="text-sm text-detective-ink leading-relaxed italic">
            "{activeDialogueText}"
          </p>
        </div>
      )}

      {/* Dialogue options */}
      <div className="flex flex-wrap gap-2">
        {availableOptions.map((option, idx) => {
          const stateColor =
            option.state === 'confrontation'
              ? 'border-detective-crimson/30 text-detective-crimson hover:bg-detective-crimson-dim'
              : option.state === 'clue_triggered'
                ? 'border-detective-gold/30 text-detective-gold hover:bg-detective-gold-dim'
                : 'border-detective-border text-detective-muted hover:bg-detective-surface-light'

          return (
            <button
              key={idx}
              onClick={() => chooseDialogueOption(option)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all cursor-pointer ${stateColor}`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
