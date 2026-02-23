import { useGameStore } from '@/store/game-store'
import { DETECTIVE_LIST } from '@/data/detectives'
import type { DetectiveId } from '@/data/detectives'
import { ArrowLeft } from 'lucide-react'

export function CharacterSelect() {
  const selectDetective = useGameStore((s) => s.selectDetective)
  const gameMode = useGameStore((s) => s.gameMode)
  const resetGame = useGameStore((s) => s.resetGame)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 animate-fade-in">
      <div className="relative z-10 w-full max-w-lg">
        {/* Back button */}
        <button
          onClick={resetGame}
          className="flex items-center gap-1.5 text-sm text-detective-muted hover:text-detective-ink transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-detective-ink mb-2">
            Choose Your Detective
          </h1>
          <p className="text-sm text-detective-muted">
            {gameMode === 'pvp'
              ? 'Pick your detective, then find an opponent.'
              : 'Who will investigate Meridian Manor?'}
          </p>
        </div>

        {/* Detective cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DETECTIVE_LIST.map((detective) => (
            <button
              key={detective.id}
              onClick={() => selectDetective(detective.id as DetectiveId)}
              className="group bg-detective-surface border border-detective-border rounded-xl p-5 text-left transition-all hover:border-detective-gold/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {/* Avatar placeholder */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 border-2 transition-colors"
                style={{
                  borderColor: detective.color,
                  backgroundColor: `${detective.color}15`,
                }}
              >
                {detective.emoji}
              </div>

              {/* Name */}
              <h2
                className="font-display text-xl font-bold mb-1 transition-colors"
                style={{ color: detective.color }}
              >
                {detective.name}
              </h2>

              {/* Style */}
              <p className="text-xs text-detective-muted mb-3">
                {detective.style}
              </p>

              {/* Description */}
              <p className="text-sm text-detective-muted leading-relaxed mb-4">
                {detective.description}
              </p>

              {/* Tagline */}
              <p className="text-sm italic text-detective-ink/80">
                "{detective.tagline}"
              </p>

              {/* Select indicator */}
              <div
                className="mt-4 text-center py-2 rounded-lg text-sm font-semibold transition-all opacity-70 group-hover:opacity-100"
                style={{
                  backgroundColor: `${detective.color}20`,
                  color: detective.color,
                }}
              >
                Select {detective.name.split(' ')[0]}
              </div>
            </button>
          ))}
        </div>

        {/* Footnote */}
        <p className="text-center mt-6 text-xs text-detective-muted/60">
          Choice is cosmetic only — same abilities, same clues.
        </p>
      </div>
    </div>
  )
}
