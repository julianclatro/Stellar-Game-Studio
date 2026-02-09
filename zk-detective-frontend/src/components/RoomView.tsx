import { useGameStore } from '@/store/game-store'
import { getClueIcon } from '@/utils/icons'
import { getRoomImage, getSuspectImage } from '@/utils/asset-paths'
import { DoorOpen, Sparkles, Users, MessageCircle } from 'lucide-react'

export function RoomView() {
  const currentRoom = useGameStore((s) => s.currentRoom)
  const inventoryEngine = useGameStore((s) => s.inventoryEngine)
  const dialogueEngine = useGameStore((s) => s.dialogueEngine)
  const navigateToRoom = useGameStore((s) => s.navigateToRoom)
  const inspectClue = useGameStore((s) => s.inspectClue)
  const selectSuspect = useGameStore((s) => s.selectSuspect)

  if (!currentRoom || !inventoryEngine) return null

  const { room, clues, connections, suspects } = currentRoom
  const { inspected, uninspected } = inventoryEngine.partitionRoomClues(clues)
  const roomImage = getRoomImage(room.id)

  return (
    <div className="flex flex-col bg-detective-surface rounded-xl border border-detective-border animate-fade-in overflow-hidden">
      {/* Hero room image */}
      {roomImage && (
        <div className="overflow-hidden bg-detective-bg flex justify-center">
          <img
            src={roomImage}
            alt={room.name}
            className="aspect-square max-h-[60vh] min-h-[280px] w-auto object-contain"
          />
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Room header */}
        <div>
          <h2 className="font-display text-2xl font-bold text-detective-ink capitalize">
            {room.name}
          </h2>
          <p className="text-sm text-detective-muted mt-1 leading-relaxed">
            {room.description}
          </p>
        </div>

        {/* People here */}
        {suspects.length > 0 && (
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-detective-muted uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5" />
              People Here
            </h3>
            <div className="flex flex-wrap gap-2">
              {suspects.map((suspect) => {
                const portrait = getSuspectImage(suspect.id)
                const hasNew = dialogueEngine?.hasUnseenDialogue(suspect)
                return (
                  <button
                    key={suspect.id}
                    onClick={() => selectSuspect(suspect)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-detective-surface-light border border-detective-border text-detective-ink hover:border-detective-gold/30 hover:text-detective-gold transition-all cursor-pointer"
                  >
                    {portrait ? (
                      <img src={portrait} alt={suspect.name} className="w-8 h-8 rounded-full object-cover border border-detective-border" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-detective-surface flex items-center justify-center text-xs font-bold text-detective-muted border border-detective-border">
                        {suspect.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-sm font-medium">{suspect.name}</p>
                      <p className="text-xs opacity-60">{suspect.role}</p>
                    </div>
                    {hasNew && (
                      <MessageCircle className="w-4 h-4 text-detective-gold ml-1" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Evidence */}
        {(uninspected.length > 0 || inspected.length > 0) && (
          <div>
            <h3 className="text-xs font-semibold text-detective-muted uppercase tracking-wider mb-2">
              Evidence in this room
            </h3>
            <div className="flex flex-wrap gap-2">
              {uninspected.map((clue) => {
                const Icon = getClueIcon(clue.icon)
                return (
                  <button
                    key={clue.id}
                    onClick={() => inspectClue(clue)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-detective-gold-dim border border-detective-gold/20 text-detective-gold hover:bg-detective-gold/20 transition-all animate-pulse-glow cursor-pointer"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{clue.name}</span>
                    <Sparkles className="w-3 h-3 opacity-60" />
                  </button>
                )
              })}
              {inspected.map((clue) => {
                const Icon = getClueIcon(clue.icon)
                return (
                  <div
                    key={clue.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-detective-surface-light border border-detective-border text-detective-muted"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{clue.name}</span>
                    <span className="text-xs opacity-50">collected</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Exits */}
        <div>
          <h3 className="text-xs font-semibold text-detective-muted uppercase tracking-wider mb-2">
            Exits
          </h3>
          <div className="flex flex-wrap gap-2">
            {connections.map((connRoom) => (
              <button
                key={connRoom.id}
                onClick={() => navigateToRoom(connRoom.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-detective-surface-light border border-detective-border text-detective-ink hover:border-detective-teal hover:text-detective-teal transition-all cursor-pointer"
              >
                <DoorOpen className="w-4 h-4" />
                <span className="text-sm font-medium capitalize">{connRoom.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
