import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/game-store'
import { Trophy, Clock, Search, MapPin, XCircle, RotateCcw, Link, Shield, Cpu, Skull, Swords, Home, FileText } from 'lucide-react'
import { audioManager } from '@/audio/AudioManager'
import { toWeapon } from '@/data/types'

export function ResultScreen() {
  const gameSummary = useGameStore((s) => s.gameSummary)
  const formattedTime = useGameStore((s) => s.formattedTime)
  const resetGame = useGameStore((s) => s.resetGame)
  const txHash = useGameStore((s) => s.txHash)
  const zkProof = useGameStore((s) => s.zkProof)
  const contractConnected = useGameStore((s) => s.contractConnected)
  const zkReady = useGameStore((s) => s.zkReady)
  const correctSolution = useGameStore((s) => s.correctSolution)
  const caseData = useGameStore((s) => s.caseData)
  const gameMode = useGameStore((s) => s.gameMode)
  const pvpResult = useGameStore((s) => s.pvpResult)
  const playerName = useGameStore((s) => s.playerName)
  const opponent = useGameStore((s) => s.opponent)

  // Animated score count-up
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    if (!gameSummary) return
    const target = gameSummary.score
    const duration = 1500
    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayScore(Math.floor(target * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [gameSummary])

  if (!gameSummary) return null

  const { score, breakdown, cluesFound, totalClues, roomsVisited, totalRooms, wrongAccusations } =
    gameSummary

  // Build narrative reveal data from case JSON
  const guiltyEntity = correctSolution && caseData
    ? caseData.suspects.find((s) => s.id === correctSolution.suspect)
    : null
  const suspectInfo = guiltyEntity && (guiltyEntity.biography || guiltyEntity.motive)
    ? { fullName: guiltyEntity.biography ?? guiltyEntity.name, motive: guiltyEntity.motive ?? '' }
    : null
  const suspectName = guiltyEntity?.name ?? correctSolution?.suspect ?? null

  const weaponLabel = correctSolution && caseData
    ? caseData.weapons.map(toWeapon).find((w) => w.id === correctSolution.weapon)?.narrative_label ?? correctSolution.weapon
    : null
  const roomLabel = correctSolution && caseData
    ? caseData.rooms.find((r) => r.id === correctSolution.room)?.narrative_label ?? correctSolution.room
    : null

  // PvP result determination
  const isPvp = gameMode === 'pvp' && pvpResult
  const isWinner = isPvp && pvpResult!.winner === playerName
  const isDraw = isPvp && pvpResult!.winner === null

  const pvpReasonText =
    pvpResult?.reason === 'solved'
      ? isWinner ? 'You solved the case first!' : 'Your opponent solved it first.'
      : pvpResult?.reason === 'timer_expired'
        ? "Time's up! Scores compared."
        : pvpResult?.reason === 'opponent_disconnected'
          ? 'Your opponent disconnected.'
          : ''

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-8 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-md">
        {/* Header — PvP or Solo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-detective-gold-dim mb-4">
            <Trophy className="w-8 h-8 text-detective-gold" />
          </div>
          {isPvp ? (
            <>
              <h1 className={`font-display text-4xl font-bold mb-2 ${
                isWinner ? 'text-detective-gold' : isDraw ? 'text-detective-muted' : 'text-detective-crimson'
              }`}>
                {isWinner ? 'Victory!' : isDraw ? 'Draw' : 'Defeat'}
              </h1>
              <p className="text-detective-muted mb-3">{pvpReasonText}</p>
              <div className="flex items-center justify-center gap-4 text-sm">
                <span className="text-detective-gold font-semibold">
                  You: {pvpResult!.myScore.toLocaleString()}
                </span>
                <span className="text-detective-muted">vs</span>
                <span className="text-detective-crimson font-semibold">
                  {opponent?.name ?? 'Opponent'}: {pvpResult!.opponentScore.toLocaleString()}
                </span>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-display text-4xl font-bold text-detective-ink mb-2">
                Case Closed
              </h1>
              <p className="text-detective-muted">
                The case is closed.
              </p>
            </>
          )}
        </div>

        {/* The Truth — narrative reveal */}
        {correctSolution && (
          <div className="bg-detective-surface border border-detective-border rounded-xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-detective-crimson" />
              <h2 className="font-display text-lg font-semibold text-detective-ink">
                The Truth Behind {caseData?.title ?? 'the Case'}
              </h2>
            </div>
            <div className="space-y-3 text-sm text-detective-muted leading-relaxed">
              <div className="flex items-start gap-2.5">
                <Skull className="w-4 h-4 text-detective-crimson mt-0.5 shrink-0" />
                <p>
                  <span className="text-detective-ink font-semibold">{suspectInfo?.fullName ?? suspectName}</span>
                  {' '}committed the crime.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <Swords className="w-4 h-4 text-detective-crimson mt-0.5 shrink-0" />
                <p>
                  The weapon: <span className="text-detective-ink font-semibold">
                    {weaponLabel ?? correctSolution.weapon}
                  </span>.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <Home className="w-4 h-4 text-detective-crimson mt-0.5 shrink-0" />
                <p>
                  It happened in <span className="text-detective-ink font-semibold">
                    {roomLabel ?? correctSolution.room}
                  </span>.
                </p>
              </div>
              {suspectInfo && (
                <div className="border-t border-detective-border pt-3 mt-3">
                  {suspectInfo.motive && (
                    <p className="italic">
                      {suspectInfo.motive}
                    </p>
                  )}
                  {caseData?.epilogue && (
                    <p className="mt-2">
                      {caseData.epilogue}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Score */}
        <div className="bg-detective-surface border border-detective-border rounded-xl p-6 mb-4">
          <div className="text-center mb-6">
            <p className="font-pixel text-[8px] text-detective-muted uppercase mb-2">
              Final Score
            </p>
            <p className="font-pixel text-3xl text-detective-gold animate-score-glow">
              {displayScore.toLocaleString()}
            </p>
          </div>

          {/* Score breakdown */}
          <div className="space-y-2">
            <BreakdownRow label="Base Score" value={breakdown.baseScore} />
            {breakdown.timePenalty !== 0 && (
              <BreakdownRow
                label="Time Penalty"
                value={breakdown.timePenalty}
                variant="penalty"
              />
            )}
            {breakdown.accusationPenalty !== 0 && (
              <BreakdownRow
                label="Wrong Accusations"
                value={breakdown.accusationPenalty}
                variant="penalty"
              />
            )}
            {breakdown.explorationBonus !== 0 && (
              <BreakdownRow
                label="Exploration Bonus"
                value={breakdown.explorationBonus}
                variant="bonus"
              />
            )}
            <div className="border-t border-detective-border pt-2 mt-2">
              <BreakdownRow label="Total" value={breakdown.finalScore} variant="total" />
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <StatCard
            icon={<Clock className="w-4 h-4" />}
            label="Time"
            value={formattedTime}
          />
          <StatCard
            icon={<Search className="w-4 h-4" />}
            label="Clues Found"
            value={`${cluesFound}/${totalClues}`}
          />
          <StatCard
            icon={<MapPin className="w-4 h-4" />}
            label="Rooms Visited"
            value={`${roomsVisited}/${totalRooms}`}
          />
          <StatCard
            icon={<XCircle className="w-4 h-4" />}
            label="Wrong Guesses"
            value={String(wrongAccusations)}
          />
        </div>

        {/* Blockchain Verification */}
        {(txHash || zkProof) && (
          <div className="bg-detective-surface border border-detective-border rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-detective-teal" />
              <h3 className="text-sm font-semibold text-detective-ink">
                Blockchain Verification
              </h3>
            </div>
            <div className="space-y-2 text-xs">
              {txHash && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-detective-muted flex items-center gap-1">
                    <Link className="w-3 h-3" />
                    Transaction
                  </span>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-detective-teal hover:underline font-mono truncate max-w-[180px]"
                  >
                    {txHash.slice(0, 8)}...{txHash.slice(-8)}
                  </a>
                </div>
              )}
              {import.meta.env.VITE_ZK_DETECTIVE_CONTRACT_ID && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-detective-muted">Contract</span>
                  <span className="font-mono text-detective-ink/70 truncate max-w-[180px]">
                    {(import.meta.env.VITE_ZK_DETECTIVE_CONTRACT_ID as string).slice(0, 8)}...
                  </span>
                </div>
              )}
              {zkProof && (
                <>
                  <div className="border-t border-detective-border pt-2 mt-2" />
                  <div className="flex items-center gap-2 mb-1">
                    <Cpu className="w-3 h-3 text-detective-teal" />
                    <span className="text-detective-muted">ZK Proof</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-detective-muted">Status</span>
                    <span className="text-detective-teal font-medium">Verified</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-detective-muted">Proof size</span>
                    <span className="text-detective-ink/70">{zkProof.proof.proof.length} bytes</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-detective-muted">Public inputs</span>
                    <span className="text-detective-ink/70">{zkProof.publicInputs.length}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Return to lobby */}
        <button
          onClick={() => {
            audioManager.playSfx('uiClick')
            resetGame()
          }}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-detective-gold text-detective-bg font-semibold rounded-lg hover:brightness-110 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="font-pixel text-[10px]">Return to Lobby</span>
        </button>

        {/* Footer — dynamic status */}
        <p className="text-center mt-8 mb-4 text-xs text-detective-muted/60">
          {contractConnected && zkReady
            ? 'Verified with Zero-Knowledge Proofs on Soroban'
            : contractConnected
              ? 'Verified on Soroban (ZK proofs offline)'
              : zkReady
                ? 'ZK proofs verified locally (contract offline)'
                : 'Local verification mode'}
        </p>
      </div>
    </div>
  )
}

function BreakdownRow({
  label,
  value,
  variant = 'neutral',
}: {
  label: string
  value: number
  variant?: 'neutral' | 'penalty' | 'bonus' | 'total'
}) {
  const valueColor =
    variant === 'penalty'
      ? 'text-detective-crimson'
      : variant === 'bonus'
        ? 'text-detective-teal'
        : variant === 'total'
          ? 'text-detective-gold font-bold'
          : 'text-detective-ink'

  const prefix = value > 0 && variant === 'bonus' ? '+' : ''

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-detective-muted">{label}</span>
      <span className={`text-sm font-semibold ${valueColor}`}>
        {prefix}{value.toLocaleString()}
      </span>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="bg-detective-surface border border-detective-border rounded-xl p-3 text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1 text-detective-muted">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-semibold text-detective-ink">{value}</p>
    </div>
  )
}
