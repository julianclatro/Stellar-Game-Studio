import { useGameStore } from '@/store/game-store'
import { DETECTIVES } from '@/data/detectives'
import { Clock, Search, MapPin, Eye, Timer } from 'lucide-react'

export function TopBar() {
  const formattedTime = useGameStore((s) => s.formattedTime)
  const clueCount = useGameStore((s) => s.clueCount)
  const totalClues = useGameStore((s) => s.totalClues)
  const visitedRoomCount = useGameStore((s) => s.visitedRoomCount)
  const caseData = useGameStore((s) => s.caseData)
  const wrongAccusationCount = useGameStore((s) => s.wrongAccusationCount)
  const gameMode = useGameStore((s) => s.gameMode)
  const opponent = useGameStore((s) => s.opponent)
  const pvpFormattedTime = useGameStore((s) => s.pvpFormattedTime)
  const pvpTimeRemaining = useGameStore((s) => s.pvpTimeRemaining)
  const selectedDetective = useGameStore((s) => s.selectedDetective)

  const totalRooms = caseData?.rooms.length ?? 5
  const detective = selectedDetective ? DETECTIVES[selectedDetective] : null

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-detective-surface border-b border-detective-border">
      {/* Left: detective + case title */}
      <div className="flex items-center gap-2">
        {detective && (
          <span className="text-base" title={detective.name}>{detective.emoji}</span>
        )}
        <h2 className="font-display text-sm font-semibold text-detective-gold">
          {caseData?.title ?? 'ZK Detective'}
        </h2>
      </div>

      {/* Center: stats */}
      <div className="flex items-center gap-6">
        {gameMode === 'pvp' ? (
          <Stat
            icon={<Timer className="w-3.5 h-3.5" />}
            label="Left"
            value={pvpFormattedTime}
            variant={pvpTimeRemaining < 60 ? 'crimson' : 'default'}
          />
        ) : (
          <Stat icon={<Clock className="w-3.5 h-3.5" />} label="Time" value={formattedTime} />
        )}
        <Stat
          icon={<Search className="w-3.5 h-3.5" />}
          label="Clues"
          value={`${clueCount}/${totalClues}`}
          highlight={clueCount === totalClues}
        />
        <Stat
          icon={<MapPin className="w-3.5 h-3.5" />}
          label="Rooms"
          value={`${visitedRoomCount}/${totalRooms}`}
          highlight={visitedRoomCount === totalRooms}
        />
        {wrongAccusationCount > 0 && (
          <Stat
            icon={<span className="text-xs">X</span>}
            label="Wrong"
            value={String(wrongAccusationCount)}
            variant="crimson"
          />
        )}
      </div>

      {/* Right: opponent info or spacer */}
      {gameMode === 'pvp' && opponent ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3 h-3 text-detective-crimson" />
            <span className="text-xs text-detective-muted">{opponent.name}</span>
          </div>
          <span className="text-[10px] text-detective-muted/60 capitalize">
            {opponent.currentRoom}
          </span>
          <span className="text-[10px] text-detective-muted/60">
            {opponent.clueCount} clues
          </span>
        </div>
      ) : (
        <div className="w-24" />
      )}
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  highlight = false,
  variant = 'default',
}: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
  variant?: 'default' | 'crimson'
}) {
  const color = variant === 'crimson'
    ? 'text-detective-crimson'
    : highlight
      ? 'text-detective-teal'
      : 'text-detective-muted'

  return (
    <div className="flex items-center gap-1.5">
      <span className={color}>{icon}</span>
      <span className="text-xs text-detective-muted">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  )
}
