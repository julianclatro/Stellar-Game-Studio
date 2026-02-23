// Audio mute/unmute toggle for TopBar.

import { useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { audioManager } from '@/audio/AudioManager'

export function AudioToggle() {
  const [muted, setMuted] = useState(audioManager.muted)

  const toggle = () => {
    const newMuted = audioManager.toggleMute()
    setMuted(newMuted)
  }

  return (
    <button
      onClick={toggle}
      className="p-1.5 rounded-lg hover:bg-detective-surface-light transition-colors cursor-pointer"
      title={muted ? 'Unmute' : 'Mute'}
    >
      {muted ? (
        <VolumeX className="w-4 h-4 text-detective-muted" />
      ) : (
        <Volume2 className="w-4 h-4 text-detective-gold" />
      )}
    </button>
  )
}
