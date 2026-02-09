import { useGameStore } from '@/store/game-store'
import { getSuspectImage, getWeaponImage, getRoomImage } from '@/utils/asset-paths'
import { X, ChevronRight, AlertTriangle, Check, Loader2 } from 'lucide-react'

export function AccusationModal() {
  const accusationStatus = useGameStore((s) => s.accusationStatus)
  const accusedSuspect = useGameStore((s) => s.accusedSuspect)
  const accusedWeapon = useGameStore((s) => s.accusedWeapon)
  const accusedRoom = useGameStore((s) => s.accusedRoom)
  const accusationEngine = useGameStore((s) => s.accusationEngine)
  const isSubmitting = useGameStore((s) => s.isSubmitting)
  const cancelAccusation = useGameStore((s) => s.cancelAccusation)
  const selectAccusedSuspect = useGameStore((s) => s.selectAccusedSuspect)
  const selectAccusedWeapon = useGameStore((s) => s.selectAccusedWeapon)
  const selectAccusedRoom = useGameStore((s) => s.selectAccusedRoom)
  const confirmAccusation = useGameStore((s) => s.confirmAccusation)
  const submitAccusation = useGameStore((s) => s.submitAccusation)

  if (!accusationEngine) return null

  const suspects = accusationEngine.getSuspectChoices()
  const weapons = accusationEngine.getWeaponChoices()
  const rooms = accusationEngine.getRoomChoices()
  const isComplete = accusedSuspect && accusedWeapon && accusedRoom

  // Determine current step
  const step = !accusedSuspect ? 0 : !accusedWeapon ? 1 : !accusedRoom ? 2 : 3
  const steps = ['Suspect', 'Weapon', 'Room', 'Confirm']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
      <div className="bg-detective-surface border border-detective-border rounded-2xl w-full max-w-xl mx-4 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-detective-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-detective-crimson" />
            <h2 className="font-display text-lg font-bold text-detective-ink">
              Make an Accusation
            </h2>
          </div>
          <button
            onClick={cancelAccusation}
            className="p-1.5 rounded-lg hover:bg-detective-surface-light transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-detective-muted" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1 px-6 py-3 bg-detective-bg">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-1">
              <div
                className={`
                  flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                  ${i < step
                    ? 'bg-detective-teal text-white'
                    : i === step
                      ? 'bg-detective-crimson text-white'
                      : 'bg-detective-surface-light text-detective-muted'
                  }
                `}
              >
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span
                className={`text-xs ${i === step ? 'text-detective-ink font-medium' : 'text-detective-muted'}`}
              >
                {label}
              </span>
              {i < steps.length - 1 && (
                <ChevronRight className="w-3 h-3 text-detective-muted/40 mx-1" />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {accusationStatus === 'selecting' && (
            <>
              {/* Suspect selection */}
              {step === 0 && (
                <SelectionGrid
                  title="Who committed the crime?"
                  items={suspects.map((s) => ({ id: s.id, label: s.name, image: getSuspectImage(s.id) }))}
                  selected={accusedSuspect}
                  onSelect={selectAccusedSuspect}
                />
              )}

              {/* Weapon selection */}
              {step === 1 && (
                <SelectionGrid
                  title="What was the murder weapon?"
                  items={weapons.map((w) => ({ id: w, label: formatLabel(w), image: getWeaponImage(w) }))}
                  selected={accusedWeapon}
                  onSelect={selectAccusedWeapon}
                />
              )}

              {/* Room selection */}
              {step === 2 && (
                <SelectionGrid
                  title="Where did it happen?"
                  items={rooms.map((r) => ({ id: r.id, label: r.name, image: getRoomImage(r.id) }))}
                  selected={accusedRoom}
                  onSelect={selectAccusedRoom}
                />
              )}

              {/* Summary & confirm */}
              {step === 3 && isComplete && (
                <div className="space-y-3">
                  <p className="text-sm text-detective-muted mb-4">
                    Review your accusation carefully. Wrong accusations carry a
                    <span className="text-detective-crimson font-semibold"> -500 point penalty</span>.
                  </p>
                  <SummaryRow label="Suspect" value={suspects.find((s) => s.id === accusedSuspect)?.name ?? accusedSuspect} />
                  <SummaryRow label="Weapon" value={formatLabel(accusedWeapon)} />
                  <SummaryRow label="Room" value={rooms.find((r) => r.id === accusedRoom)?.name ?? accusedRoom} />
                </div>
              )}
            </>
          )}

          {accusationStatus === 'confirming' && !isSubmitting && (
            <div className="text-center py-4">
              <AlertTriangle className="w-10 h-10 text-detective-crimson mx-auto mb-3" />
              <p className="text-detective-ink font-semibold mb-1">Are you certain?</p>
              <p className="text-sm text-detective-muted">This accusation cannot be undone.</p>
            </div>
          )}

          {isSubmitting && (
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 text-detective-teal mx-auto mb-3 animate-spin" />
              <p className="text-detective-ink font-semibold mb-1">Verifying Accusation...</p>
              <p className="text-sm text-detective-muted">
                Generating ZK proof &amp; submitting to Soroban
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-detective-border">
          <button
            onClick={cancelAccusation}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-detective-border text-sm text-detective-muted hover:bg-detective-surface-light transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          {accusationStatus === 'selecting' && isComplete && (
            <button
              onClick={confirmAccusation}
              className="px-6 py-2 rounded-lg bg-detective-crimson text-white text-sm font-semibold hover:brightness-110 transition-all cursor-pointer"
            >
              Confirm Accusation
            </button>
          )}

          {accusationStatus === 'confirming' && !isSubmitting && (
            <button
              onClick={submitAccusation}
              className="px-6 py-2 rounded-lg bg-detective-crimson text-white text-sm font-semibold hover:brightness-110 transition-all cursor-pointer"
            >
              Submit Final Answer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function SelectionGrid({
  title,
  items,
  selected,
  onSelect,
}: {
  title: string
  items: { id: string; label: string; image?: string }[]
  selected: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div>
      <p className="text-sm text-detective-muted mb-3">{title}</p>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`
              flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all capitalize cursor-pointer
              ${selected === item.id
                ? 'bg-detective-crimson-dim border-detective-crimson/30 text-detective-crimson'
                : 'bg-detective-surface-light border-detective-border text-detective-ink hover:border-detective-crimson/20'
              }
            `}
          >
            {item.image && (
              <img src={item.image} alt={item.label} className="w-10 h-10 rounded-full object-cover" />
            )}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-detective-bg rounded-lg border border-detective-border">
      <span className="text-xs text-detective-muted uppercase tracking-wider">{label}</span>
      <span className="text-sm font-semibold text-detective-ink capitalize">{value}</span>
    </div>
  )
}

function formatLabel(s: string): string {
  return s.replace(/_/g, ' ')
}
