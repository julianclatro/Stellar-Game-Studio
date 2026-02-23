// Adventure Dialogue Box — Monkey Island-style dialogue with character portrait,
// typewriter text with variable speed, pitch-varied blip SFX, and numbered response options.

import { useCallback } from 'react'
import { useGameStore } from '@/store/game-store'
import { getSuspectImage } from '@/utils/asset-paths'
import { useTypewriter } from '@/hooks/useTypewriter'
import { audioManager } from '@/audio/AudioManager'
import { X } from 'lucide-react'

export function AdventureDialogueBox() {
  const selectedSuspect = useGameStore((s) => s.selectedSuspect)
  const dialogueResolution = useGameStore((s) => s.dialogueResolution)
  const activeDialogueText = useGameStore((s) => s.activeDialogueText)
  const dismissSuspect = useGameStore((s) => s.dismissSuspect)
  const chooseDialogueOption = useGameStore((s) => s.chooseDialogueOption)

  // Play blip with slight pitch variation for natural sound
  const onChar = useCallback(() => {
    audioManager.playSfx('dialogueBlip')
  }, [])

  const { displayText, isTyping, isComplete, skip } = useTypewriter({
    text: activeDialogueText ?? '',
    speed: 25,
    onChar,
  })

  if (!selectedSuspect || !dialogueResolution) return null

  const { availableOptions } = dialogueResolution
  const portrait = getSuspectImage(selectedSuspect.id)

  // Dialogue state determines border color
  const hasConfrontation = availableOptions.some((o) => o.state === 'confrontation')
  const hasClueTriggered = availableOptions.some((o) => o.state === 'clue_triggered')
  const borderColor = hasConfrontation
    ? 'border-detective-crimson/50'
    : hasClueTriggered
      ? 'border-detective-gold/50'
      : 'border-detective-border'

  const stateLabel = hasConfrontation
    ? 'CONFRONTATION'
    : hasClueTriggered
      ? 'NEW EVIDENCE'
      : null

  return (
    <div className={`bg-black/90 backdrop-blur-sm border-t-2 ${borderColor} p-4 animate-slide-up`}>
      <div className="max-w-4xl mx-auto flex gap-4">
        {/* Character portrait */}
        <div className="shrink-0">
          {portrait ? (
            <img
              src={portrait}
              alt={selectedSuspect.name}
              className="w-20 h-20 rounded-lg object-cover border-2 border-detective-gold/40"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-detective-surface flex items-center justify-center border-2 border-detective-gold/40">
              <span className="font-pixel text-lg text-detective-gold">
                {selectedSuspect.name.charAt(0)}
              </span>
            </div>
          )}
          <p className="font-pixel text-[8px] text-detective-gold mt-1.5 text-center truncate max-w-20">
            {selectedSuspect.name}
          </p>
          <p className="text-[9px] text-detective-muted text-center">
            {selectedSuspect.role}
          </p>
        </div>

        {/* Dialogue content */}
        <div className="flex-1 min-w-0">
          {/* State badge + dismiss */}
          <div className="flex items-center justify-between mb-2">
            {stateLabel && (
              <span className={`font-pixel text-[8px] px-2 py-0.5 rounded ${
                hasConfrontation
                  ? 'bg-detective-crimson/20 text-detective-crimson'
                  : 'bg-detective-gold/20 text-detective-gold'
              }`}>
                {stateLabel}
              </span>
            )}
            <button
              onClick={dismissSuspect}
              className="p-1 rounded hover:bg-white/10 transition-colors cursor-pointer ml-auto"
            >
              <X className="w-4 h-4 text-detective-muted" />
            </button>
          </div>

          {/* Typewriter text area — click to skip or continue */}
          <div
            className="bg-detective-surface/50 rounded-lg p-3 mb-3 border border-detective-border min-h-[60px] cursor-pointer"
            onClick={isTyping ? skip : undefined}
          >
            <p className={`text-sm leading-relaxed ${
              hasConfrontation ? 'text-detective-crimson'
                : hasClueTriggered ? 'text-detective-gold'
                : 'text-detective-ink'
            }`}>
              &ldquo;{displayText}&rdquo;
              {isTyping && <span className="typewriter-cursor text-detective-gold">|</span>}
            </p>
            {isTyping && (
              <p className="text-[9px] text-detective-muted/50 mt-1">Click to skip</p>
            )}
            {isComplete && !isTyping && availableOptions.length > 0 && (
              <p className="text-[9px] text-detective-gold/60 mt-1 animate-pulse">
                Choose a response below...
              </p>
            )}
          </div>

          {/* Response options — numbered like classic adventure games */}
          {!isTyping && (
            <div className="flex flex-wrap gap-2">
              {availableOptions.map((option, idx) => {
                const stateStyle =
                  option.state === 'confrontation'
                    ? 'border-detective-crimson/40 text-detective-crimson hover:bg-detective-crimson/15'
                    : option.state === 'clue_triggered'
                      ? 'border-detective-gold/40 text-detective-gold hover:bg-detective-gold/15'
                      : 'border-detective-border text-detective-muted hover:bg-white/5'

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      audioManager.playSfx('uiClick')
                      chooseDialogueOption(option)
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all cursor-pointer ${stateStyle}`}
                  >
                    <span className="font-pixel text-[9px] opacity-60">{idx + 1}.</span>
                    <span className="font-medium">{option.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
