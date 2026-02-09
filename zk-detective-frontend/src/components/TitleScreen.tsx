import { useState } from 'react'
import { useGameStore } from '@/store/game-store'
import { Search, Swords } from 'lucide-react'
import { TITLE_ASSETS } from '@/utils/asset-paths'

function generateDefaultName(): string {
  return `Detective${Math.floor(1000 + Math.random() * 9000)}`
}

export function TitleScreen() {
  const startBriefing = useGameStore((s) => s.startBriefing)
  const startPvp = useGameStore((s) => s.startPvp)

  const [showPvpInput, setShowPvpInput] = useState(false)
  const [playerName, setPlayerName] = useState(generateDefaultName)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 animate-fade-in">
      {/* Atmospheric background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(212,168,67,0.06),transparent_70%)]" />
      </div>

      <div className="relative z-10 text-center max-w-lg">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-detective-border bg-detective-surface mb-8">
          <Search className="w-3.5 h-3.5 text-detective-gold" />
          <span className="text-xs font-medium text-detective-muted uppercase tracking-wider">
            Zero-Knowledge Investigation
          </span>
        </div>

        {/* Manor hero image */}
        <img
          src={TITLE_ASSETS.manor}
          alt="Meridian Manor at night"
          className="w-full max-w-[600px] mx-auto rounded-xl border border-detective-border mb-6 opacity-90"
        />

        {/* Title */}
        <h1 className="font-display text-5xl md:text-6xl font-bold text-detective-ink mb-3 leading-tight">
          ZK Detective
        </h1>
        <p className="font-display text-xl md:text-2xl text-detective-gold mb-6">
          Case Closed on Soroban
        </p>

        {/* Case briefing */}
        <div className="bg-detective-surface border border-detective-border rounded-xl p-6 mb-8 text-left">
          <h3 className="font-display text-lg text-detective-gold mb-3">
            The Meridian Manor Incident
          </h3>
          <p className="text-sm text-detective-muted leading-relaxed mb-4">
            A prominent figure has been found dead at Meridian Manor.
            Nine suspects. Five rooms. Eleven clues.
            No one can be trusted — not even the game itself.
          </p>
          <p className="text-sm text-detective-muted leading-relaxed">
            Zero-knowledge proofs ensure fair play: the solution is
            cryptographically committed before you begin. No admin can
            cheat. Your deductions alone will solve the case.
          </p>
        </div>

        {/* Mode selection */}
        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={startBriefing}
            className="inline-flex items-center gap-3 px-8 py-3.5 bg-detective-gold text-detective-bg font-semibold text-base rounded-lg hover:brightness-110 transition-all hover:scale-[1.02] active:scale-[0.98] w-full max-w-xs justify-center"
          >
            <Search className="w-5 h-5" />
            Solo Investigation
          </button>

          {!showPvpInput ? (
            <button
              onClick={() => setShowPvpInput(true)}
              className="inline-flex items-center gap-3 px-8 py-3.5 bg-detective-teal text-detective-bg font-semibold text-base rounded-lg hover:brightness-110 transition-all hover:scale-[1.02] active:scale-[0.98] w-full max-w-xs justify-center"
            >
              <Swords className="w-5 h-5" />
              PvP Challenge
            </button>
          ) : (
            <div className="flex gap-2 w-full max-w-xs animate-fade-in">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                placeholder="Your name"
                className="flex-1 px-3 py-3 bg-detective-surface border border-detective-border rounded-lg text-sm text-detective-ink placeholder-detective-muted focus:outline-none focus:border-detective-teal"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && playerName.trim()) startPvp(playerName.trim())
                }}
              />
              <button
                onClick={() => {
                  if (playerName.trim()) startPvp(playerName.trim())
                }}
                className="px-4 py-3 bg-detective-teal text-detective-bg font-semibold text-sm rounded-lg hover:brightness-110 transition-all"
              >
                Find Opponent
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs text-detective-muted/60">
          Built on Stellar Soroban &middot; Powered by Noir ZK Proofs
        </p>
      </div>
    </div>
  )
}
