import { useGameStore } from '@/store/game-store'
import { TITLE_ASSETS } from '@/utils/asset-paths'
import { getSuspectImage } from '@/utils/asset-paths'
import { DETECTIVES } from '@/data/detectives'
import { Search, Shield, MapPin, Users, Crosshair } from 'lucide-react'

// Fixed pentagon positions matching MiniMap
const ROOM_POSITIONS: Record<string, { x: number; y: number }> = {
  bedroom: { x: 90, y: 18 },
  lounge: { x: 30, y: 52 },
  study: { x: 150, y: 52 },
  kitchen: { x: 50, y: 102 },
  garden: { x: 130, y: 102 },
}

const EDGES: [string, string][] = [
  ['bedroom', 'lounge'],
  ['bedroom', 'study'],
  ['kitchen', 'lounge'],
  ['kitchen', 'garden'],
  ['study', 'garden'],
]

export function BriefingScreen() {
  const caseData = useGameStore((s) => s.caseData)
  const startInvestigation = useGameStore((s) => s.startInvestigation)
  const gameMode = useGameStore((s) => s.gameMode)
  const opponent = useGameStore((s) => s.opponent)
  const selectedDetective = useGameStore((s) => s.selectedDetective)

  const detective = selectedDetective ? DETECTIVES[selectedDetective] : null

  if (!caseData) return null

  const totalClues = caseData.rooms.reduce((sum, r) => sum + r.clues.length, 0)

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-8 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl space-y-6">
        {/* Case header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-detective-border bg-detective-surface mb-4">
            <Search className="w-3.5 h-3.5 text-detective-gold" />
            <span className="text-xs font-medium text-detective-muted uppercase tracking-wider">
              Case Briefing
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-detective-ink mb-2">
            {caseData.title}
          </h1>
          <p className="text-detective-muted text-sm">
            A Zero-Knowledge Murder Mystery
          </p>
          {gameMode === 'pvp' && opponent && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-detective-crimson/30 bg-detective-crimson/10">
              <span className="text-xs font-medium text-detective-crimson">
                PvP Match — vs {opponent.name}
              </span>
            </div>
          )}
          {detective && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-detective-surface"
              style={{ borderColor: `${detective.color}40` }}
            >
              <span className="text-base">{detective.emoji}</span>
              <span className="text-xs font-medium" style={{ color: detective.color }}>
                {detective.name}
              </span>
            </div>
          )}
        </div>

        {/* Manor image + setting */}
        <div className="bg-detective-surface border border-detective-border rounded-xl overflow-hidden">
          <img
            src={TITLE_ASSETS.manor}
            alt="Meridian Manor at night"
            className="w-full h-48 object-cover opacity-80"
          />
          <div className="p-5">
            <p className="text-sm text-detective-muted leading-relaxed">
              A prestigious dinner party at Meridian Manor has ended in tragedy.
              A prominent figure has been found dead in the bedroom, and every
              guest is a suspect. The police have sealed the manor — no one
              leaves until the truth is uncovered.
            </p>
          </div>
        </div>

        {/* Mission card */}
        <div className="bg-detective-surface border border-detective-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Crosshair className="w-4 h-4 text-detective-crimson" />
            <h2 className="font-display text-lg font-semibold text-detective-ink">
              Your Mission
            </h2>
          </div>
          <p className="text-sm text-detective-muted leading-relaxed mb-4">
            Investigate the manor, collect clues, interrogate suspects, and
            identify the killer. You must determine <strong className="text-detective-ink">who</strong> committed
            the crime, <strong className="text-detective-ink">what weapon</strong> was used,
            and <strong className="text-detective-ink">where</strong> it happened.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center py-2 px-3 bg-detective-bg rounded-lg border border-detective-border">
              <p className="text-2xl font-bold text-detective-gold">{caseData.suspects.length}</p>
              <p className="text-xs text-detective-muted">Suspects</p>
            </div>
            <div className="text-center py-2 px-3 bg-detective-bg rounded-lg border border-detective-border">
              <p className="text-2xl font-bold text-detective-gold">{caseData.rooms.length}</p>
              <p className="text-xs text-detective-muted">Rooms</p>
            </div>
            <div className="text-center py-2 px-3 bg-detective-bg rounded-lg border border-detective-border">
              <p className="text-2xl font-bold text-detective-gold">{totalClues}</p>
              <p className="text-xs text-detective-muted">Clues</p>
            </div>
          </div>
        </div>

        {/* Room map */}
        <div className="bg-detective-surface border border-detective-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-detective-teal" />
            <h2 className="font-display text-lg font-semibold text-detective-ink">
              Manor Layout
            </h2>
          </div>
          <div className="max-w-xs mx-auto">
            <svg viewBox="0 0 180 120" className="w-full">
              {EDGES.map(([from, to]) => {
                const a = ROOM_POSITIONS[from]
                const b = ROOM_POSITIONS[to]
                return (
                  <line
                    key={`${from}-${to}`}
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke="rgba(232, 230, 227, 0.15)"
                    strokeWidth={1.5}
                  />
                )
              })}
              {Object.entries(ROOM_POSITIONS).map(([roomId, pos]) => {
                const room = caseData.rooms.find((r) => r.id === roomId)
                return (
                  <g key={roomId}>
                    <circle
                      cx={pos.x} cy={pos.y} r={12}
                      fill="#1e1e2e"
                      stroke="rgba(212, 168, 67, 0.4)"
                      strokeWidth={1.5}
                    />
                    <text
                      x={pos.x} y={pos.y + 1}
                      textAnchor="middle" dominantBaseline="central"
                      fill="#d4a843" fontSize={7} fontWeight={600}
                      fontFamily="Inter, system-ui, sans-serif"
                    >
                      {(room?.name ?? roomId).replace('The ', '').slice(0, 3).toUpperCase()}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
          <div className="grid grid-cols-5 gap-1 mt-2">
            {caseData.rooms.map((room) => (
              <p key={room.id} className="text-[10px] text-detective-muted text-center capitalize">
                {room.name.replace('The ', '')}
              </p>
            ))}
          </div>
        </div>

        {/* Suspect gallery */}
        <div className="bg-detective-surface border border-detective-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-detective-crimson" />
            <h2 className="font-display text-lg font-semibold text-detective-ink">
              The Suspects
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {caseData.suspects.map((suspect) => (
              <div
                key={suspect.id}
                className="flex flex-col items-center gap-1.5 py-2.5 px-2 bg-detective-bg rounded-lg border border-detective-border"
              >
                {getSuspectImage(suspect.id) ? (
                  <img
                    src={getSuspectImage(suspect.id)}
                    alt={suspect.name}
                    className="w-10 h-10 rounded-full object-cover border border-detective-border"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-detective-surface-light flex items-center justify-center text-detective-muted text-xs font-bold">
                    {suspect.name.charAt(0)}
                  </div>
                )}
                <p className="text-xs font-medium text-detective-ink text-center leading-tight">
                  {suspect.name}
                </p>
                <p className="text-[10px] text-detective-muted text-center">
                  {suspect.role}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ZK trust notice */}
        <div className="bg-detective-surface border border-detective-teal/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-detective-teal" />
            <h2 className="font-display text-sm font-semibold text-detective-teal">
              Cryptographic Fair Play
            </h2>
          </div>
          <p className="text-sm text-detective-muted leading-relaxed">
            The solution to this case is cryptographically committed on-chain
            before you begin. Zero-knowledge proofs ensure that no one — not
            even the game itself — can cheat. Your deductions alone will solve
            the case.
          </p>
        </div>

        {/* Begin Investigation button */}
        <div className="text-center pb-4">
          <button
            onClick={startInvestigation}
            className="inline-flex items-center gap-3 px-8 py-3.5 bg-detective-gold text-detective-bg font-semibold text-base rounded-lg hover:brightness-110 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Search className="w-5 h-5" />
            Begin Investigation
          </button>
          <p className="mt-3 text-xs text-detective-muted/60">
            {gameMode === 'pvp' ? 'The countdown begins when you start.' : 'The timer starts when you begin.'}
          </p>
        </div>
      </div>
    </div>
  )
}
