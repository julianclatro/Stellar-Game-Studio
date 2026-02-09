import { useEffect } from 'react'
import { useGameStore } from '@/store/game-store'
import { getSuspectImage } from '@/utils/asset-paths'
import { X, Users, MapPin, MessageCircle } from 'lucide-react'

export function SuspectsModal() {
  const caseData = useGameStore((s) => s.caseData)
  const dialogueEngine = useGameStore((s) => s.dialogueEngine)
  const currentRoom = useGameStore((s) => s.currentRoom)
  const selectSuspect = useGameStore((s) => s.selectSuspect)
  const closeSuspectsModal = useGameStore((s) => s.closeSuspectsModal)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSuspectsModal()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeSuspectsModal])

  if (!caseData || !dialogueEngine) return null

  const currentRoomId = currentRoom?.room.id
  const currentRoomSuspectIds = new Set(
    currentRoom?.suspects.map((s) => s.id) ?? []
  )

  // Room name lookup
  const roomNames: Record<string, string> = {}
  for (const room of caseData.rooms) {
    roomNames[room.id] = room.name
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 animate-fade-in"
      onClick={closeSuspectsModal}
    >
      <div
        className="bg-detective-surface border border-detective-border rounded-t-2xl sm:rounded-2xl w-full max-w-lg mx-0 sm:mx-4 max-h-[85vh] overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-detective-border">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-detective-gold" />
            <h2 className="font-display text-lg font-bold text-detective-ink">
              Suspects
            </h2>
            <span className="text-xs text-detective-muted">({caseData.suspects.length})</span>
          </div>
          <button
            onClick={closeSuspectsModal}
            className="p-1.5 rounded-lg hover:bg-detective-surface-light transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-detective-muted" />
          </button>
        </div>

        {/* Grid */}
        <div className="overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {caseData.suspects.map((suspect) => {
              const portrait = getSuspectImage(suspect.id)
              const isHere = currentRoomSuspectIds.has(suspect.id)
              const hasNew = dialogueEngine.hasUnseenDialogue(suspect)
              const suspectRoom = roomNames[suspect.room] ?? suspect.room

              return (
                <button
                  key={suspect.id}
                  onClick={() => selectSuspect(suspect)}
                  className={`
                    relative flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all cursor-pointer
                    ${isHere
                      ? 'bg-detective-surface-light border-detective-border hover:border-detective-gold/30'
                      : 'bg-detective-surface border-detective-border/50 opacity-60 hover:opacity-90'
                    }
                  `}
                >
                  {/* Portrait */}
                  {portrait ? (
                    <img
                      src={portrait}
                      alt={suspect.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-detective-border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-detective-surface-light border-2 border-detective-border flex items-center justify-center text-lg font-bold text-detective-muted">
                      {suspect.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                    </div>
                  )}

                  {/* Name + role */}
                  <div>
                    <p className="text-sm font-semibold text-detective-ink">{suspect.name}</p>
                    <p className="text-xs text-detective-muted">{suspect.role}</p>
                  </div>

                  {/* Room location */}
                  <div className="flex items-center gap-1 text-[10px] text-detective-muted">
                    <MapPin className="w-3 h-3" />
                    <span className="capitalize">{suspectRoom}</span>
                  </div>

                  {/* Badges */}
                  {isHere && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-bold rounded bg-detective-teal/20 text-detective-teal">
                      HERE
                    </span>
                  )}
                  {hasNew && (
                    <span className="absolute top-2 right-2">
                      <MessageCircle className="w-4 h-4 text-detective-gold" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
