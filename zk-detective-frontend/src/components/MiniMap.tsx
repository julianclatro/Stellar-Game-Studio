import { useState } from 'react'
import { useGameStore } from '@/store/game-store'
import { DETECTIVES } from '@/data/detectives'
import { Map, X } from 'lucide-react'

// Fixed positions for the 5 rooms in a pentagon layout (220x160 viewBox)
const ROOM_POSITIONS: Record<string, { x: number; y: number }> = {
  bedroom: { x: 110, y: 24 },
  lounge: { x: 36, y: 68 },
  study: { x: 184, y: 68 },
  kitchen: { x: 60, y: 132 },
  garden: { x: 160, y: 132 },
}

// Connections between rooms (from meridian-manor.json)
const EDGES: [string, string][] = [
  ['bedroom', 'lounge'],
  ['bedroom', 'study'],
  ['kitchen', 'lounge'],
  ['kitchen', 'garden'],
  ['study', 'garden'],
]

const ROOM_LABELS: Record<string, string> = {
  bedroom: 'BED',
  lounge: 'LOU',
  study: 'STU',
  kitchen: 'KIT',
  garden: 'GAR',
}

// SVG detective icon (magnifying glass silhouette) — centered at 0,0
function DetectiveMarker({ x, y, fill, pulse }: { x: number; y: number; fill: string; pulse?: boolean }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Outer glow ring */}
      <circle r={9} fill="none" stroke={fill} strokeWidth={1} opacity={0.3}>
        {pulse && (
          <animate
            attributeName="r"
            values="9;12;9"
            dur="2s"
            repeatCount="indefinite"
          />
        )}
      </circle>
      {/* Detective icon: magnifying glass */}
      <circle r={7} fill={fill} stroke="#0a0a0f" strokeWidth={1.5} />
      {/* Magnifying glass lens */}
      <circle cx={-1} cy={-1} r={3} fill="none" stroke="#0a0a0f" strokeWidth={1} opacity={0.6} />
      {/* Magnifying glass handle */}
      <line x1={1.5} y1={1.5} x2={3.5} y2={3.5} stroke="#0a0a0f" strokeWidth={1} opacity={0.6} />
    </g>
  )
}

export function MiniMap() {
  const currentRoom = useGameStore((s) => s.currentRoom)
  const visitedRoomIds = useGameStore((s) => s.visitedRoomIds)
  const navigateToRoom = useGameStore((s) => s.navigateToRoom)
  const gameMode = useGameStore((s) => s.gameMode)
  const opponent = useGameStore((s) => s.opponent)
  const selectedDetective = useGameStore((s) => s.selectedDetective)
  const opponentDetective = useGameStore((s) => s.opponentDetective)

  const [collapsed, setCollapsed] = useState(false)

  const currentRoomId = currentRoom?.room.id
  const visited = new Set(visitedRoomIds)
  const connectedIds = new Set(currentRoom?.connections.map((r) => r.id) ?? [])
  const opponentRoomId = gameMode === 'pvp' && opponent ? opponent.currentRoom : null

  const playerColor = selectedDetective ? DETECTIVES[selectedDetective].color : '#d4a843'
  const opponentColor = opponentDetective ? DETECTIVES[opponentDetective].color : '#e63946'
  const playerLabel = selectedDetective ? DETECTIVES[selectedDetective].name.split(' ')[0] : 'You'
  const opponentLabel = opponentDetective ? DETECTIVES[opponentDetective].name.split(' ')[0] : opponent?.name ?? 'Opponent'

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-20 right-3 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-detective-surface border border-detective-border shadow-lg hover:border-detective-gold/40 transition-colors"
        title="Show map"
      >
        <Map className="w-4 h-4 text-detective-gold" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-20 right-3 z-30 w-[180px] bg-detective-surface/95 backdrop-blur-sm border border-detective-border rounded-xl shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 pt-2 pb-1">
        <h3 className="text-[10px] font-semibold text-detective-muted uppercase tracking-wider">
          Manor Map
        </h3>
        <button
          onClick={() => setCollapsed(true)}
          className="p-0.5 text-detective-muted hover:text-detective-ink transition-colors"
          title="Collapse map"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* SVG Map */}
      <svg viewBox="0 0 220 160" className="w-full px-1 pb-2">
        {/* Edges */}
        {EDGES.map(([from, to]) => {
          const a = ROOM_POSITIONS[from]
          const b = ROOM_POSITIONS[to]
          return (
            <line
              key={`${from}-${to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="rgba(232, 230, 227, 0.12)"
              strokeWidth={2}
              strokeDasharray="4 3"
            />
          )
        })}

        {/* Room nodes */}
        {Object.entries(ROOM_POSITIONS).map(([roomId, pos]) => {
          const isCurrent = roomId === currentRoomId
          const isVisited = visited.has(roomId)
          const isConnected = connectedIds.has(roomId)
          const isOpponentHere = roomId === opponentRoomId

          const fill = isCurrent
            ? '#d4a843'
            : isVisited
              ? '#2a9d8f'
              : '#1e1e2e'
          const stroke = isCurrent
            ? '#d4a843'
            : isConnected
              ? 'rgba(212, 168, 67, 0.4)'
              : isVisited
                ? '#2a9d8f'
                : 'rgba(232, 230, 227, 0.15)'
          const textFill = isCurrent || isVisited ? '#0a0a0f' : '#8a8a9a'

          return (
            <g
              key={roomId}
              onClick={isConnected ? () => navigateToRoom(roomId) : undefined}
              className={isConnected ? 'cursor-pointer' : ''}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={14}
                fill={fill}
                stroke={stroke}
                strokeWidth={1.5}
              />
              <text
                x={pos.x}
                y={pos.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill={textFill}
                fontSize={8}
                fontWeight={600}
                fontFamily="Inter, system-ui, sans-serif"
              >
                {ROOM_LABELS[roomId] ?? roomId.slice(0, 3).toUpperCase()}
              </text>

              {/* Player detective marker */}
              {isCurrent && (
                <DetectiveMarker x={pos.x + 12} y={pos.y - 12} fill={playerColor} />
              )}

              {/* Opponent detective marker */}
              {isOpponentHere && (
                <DetectiveMarker
                  x={pos.x + (isCurrent ? -12 : 12)}
                  y={pos.y - 12}
                  fill={opponentColor}
                  pulse
                />
              )}
            </g>
          )
        })}
      </svg>

      {/* Legend (PvP only) */}
      {gameMode === 'pvp' && opponent && (
        <div className="flex items-center justify-center gap-3 px-2 pb-2">
          <span className="flex items-center gap-1 text-[9px] text-detective-muted">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: playerColor }} />
            {playerLabel}
          </span>
          <span className="flex items-center gap-1 text-[9px] text-detective-muted">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: opponentColor }} />
            {opponentLabel}
          </span>
        </div>
      )}
    </div>
  )
}
