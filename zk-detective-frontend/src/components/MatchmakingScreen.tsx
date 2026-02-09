import { useGameStore } from '@/store/game-store'
import { Loader, X } from 'lucide-react'

export function MatchmakingScreen() {
  const connectionState = useGameStore((s) => s.connectionState)
  const resetGame = useGameStore((s) => s.resetGame)

  const statusText =
    connectionState === 'connecting'
      ? 'Connecting to server...'
      : connectionState === 'waiting'
        ? 'Searching for opponent...'
        : 'Setting up match...'

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 animate-fade-in">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-detective-surface border border-detective-border mb-6">
          <Loader className="w-8 h-8 text-detective-teal animate-spin" />
        </div>

        <h2 className="font-display text-2xl font-bold text-detective-ink mb-2">
          PvP Challenge
        </h2>
        <p className="text-detective-muted mb-8">
          {statusText}
        </p>

        <div className="flex justify-center mb-4">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-detective-teal animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={resetGame}
          className="inline-flex items-center gap-2 px-5 py-2 text-sm text-detective-muted border border-detective-border rounded-lg hover:bg-detective-surface transition-colors"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>
  )
}
