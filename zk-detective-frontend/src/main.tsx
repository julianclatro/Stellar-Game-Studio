import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { initAudioBridge } from './audio/audio-bridge'

// Initialize audio bridge (subscribes to Zustand store for music/SFX triggers)
initAudioBridge()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
