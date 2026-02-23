import { useGameStore } from '@/store/game-store'
import { Eye, Users } from 'lucide-react'

export function OpponentFeed() {
  const opponent = useGameStore((s) => s.opponent)
  const opponentFeed = useGameStore((s) => s.opponentFeed)

  if (!opponent) return null

  const displayFeed = opponentFeed.slice(0, 5)

  return (
    <div className="bg-detective-surface border border-detective-border rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <Eye className="w-3.5 h-3.5 text-detective-crimson" />
        <h3 className="text-[10px] font-semibold text-detective-muted uppercase tracking-wider">
          {opponent.name}
        </h3>
      </div>

      {displayFeed.length === 0 ? (
        <p className="text-xs text-detective-muted/50 italic">No activity yet</p>
      ) : (
        <div className="space-y-1">
          {displayFeed.map((entry, i) => (
            <p
              key={entry.timestamp}
              className={`text-xs ${
                entry.text.includes('Wrong accusation')
                  ? 'text-detective-crimson'
                  : entry.text.includes('Solved')
                    ? 'text-detective-gold'
                    : 'text-detective-muted'
              } ${i === 0 ? 'opacity-100' : 'opacity-60'}`}
            >
              {entry.text}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
