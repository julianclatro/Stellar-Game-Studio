import { useGameStore } from './store/game-store'
import { TitleScreen } from './components/TitleScreen'
import { CharacterSelect } from './components/CharacterSelect'
import { MatchmakingScreen } from './components/MatchmakingScreen'
import { BriefingScreen } from './components/BriefingScreen'
import { GameScreen } from './components/GameScreen'
import { ResultScreen } from './components/ResultScreen'

export default function App() {
  const phase = useGameStore((s) => s.phase)

  return (
    <div className="min-h-screen bg-detective-bg text-detective-ink font-body">
      {phase === 'title' && <TitleScreen />}
      {phase === 'character-select' && <CharacterSelect />}
      {phase === 'matchmaking' && <MatchmakingScreen />}
      {phase === 'briefing' && <BriefingScreen />}
      {phase === 'playing' && <GameScreen />}
      {phase === 'result' && <ResultScreen />}
    </div>
  )
}
