// PixiRoomView — Replaces card-based RoomView with an interactive PixiJS canvas.
// The canvas renders the room scene; React overlays handle room name, tooltip, etc.
// Includes CSS fade-to-black room transitions and PixiJS flash effects.

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { Application } from '@pixi/react'
import { useGameStore } from '@/store/game-store'
import { PixiRoomScene } from '@/pixi/PixiRoomScene'
import { HoverTooltip } from './HoverTooltip'
import type { EffectType } from '@/pixi/EffectsLayer'

export function PixiRoomView() {
  const currentRoom = useGameStore((s) => s.currentRoom)
  const inventoryEngine = useGameStore((s) => s.inventoryEngine)
  const navigateToRoom = useGameStore((s) => s.navigateToRoom)
  const inspectClue = useGameStore((s) => s.inspectClue)
  const selectSuspect = useGameStore((s) => s.selectSuspect)
  const collectedClues = useGameStore((s) => s.collectedClues)
  const lastAccusationResult = useGameStore((s) => s.lastAccusationResult)
  const wrongAccusationCount = useGameStore((s) => s.wrongAccusationCount)

  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{ label: string; x: number; y: number } | null>(null)
  const [fading, setFading] = useState(false)
  const [effect, setEffect] = useState<EffectType>('none')
  const prevRoomRef = useRef<string | null>(null)
  const pendingNavRef = useRef<string | null>(null)

  const collectedClueIds = useMemo(
    () => new Set(collectedClues.map((c) => c.id)),
    [collectedClues],
  )

  const prevClueCountRef = useRef(collectedClues.length)

  // Trigger gold flash on clue collection
  useEffect(() => {
    if (collectedClues.length > prevClueCountRef.current && prevClueCountRef.current > 0) {
      setEffect('flash-gold')
    }
    prevClueCountRef.current = collectedClues.length
  }, [collectedClues.length])

  // Trigger flash on accusation result
  useEffect(() => {
    if (lastAccusationResult === 'incorrect') {
      setEffect('flash-red')
    } else if (lastAccusationResult === 'correct') {
      setEffect('flash-white')
    }
  }, [lastAccusationResult, wrongAccusationCount])

  const handleEffectComplete = useCallback(() => {
    setEffect('none')
  }, [])

  const handleHotspotHover = useCallback((label: string | null, x: number, y: number) => {
    if (label) {
      setTooltip({ label, x, y })
    } else {
      setTooltip(null)
    }
  }, [])

  // Room transition with fade
  const handleNavigateRoom = useCallback((roomId: string) => {
    pendingNavRef.current = roomId
    setFading(true)
  }, [])

  // When fade-out completes, navigate and fade back in
  useEffect(() => {
    if (!fading) return
    const timer = setTimeout(() => {
      if (pendingNavRef.current) {
        navigateToRoom(pendingNavRef.current)
        pendingNavRef.current = null
      }
      setFading(false)
    }, 300) // match CSS transition duration
    return () => clearTimeout(timer)
  }, [fading, navigateToRoom])

  // Track room changes for transition detection
  useEffect(() => {
    prevRoomRef.current = currentRoom?.room.id ?? null
  }, [currentRoom?.room.id])

  if (!currentRoom || !inventoryEngine) return null

  const { room, clues, connections, suspects } = currentRoom

  return (
    <div className="relative w-full animate-fade-in" ref={containerRef}>
      {/* Room name overlay */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none">
        <div className="px-3 py-1.5 bg-black/70 rounded-lg backdrop-blur-sm border border-detective-border">
          <h2 className="font-pixel text-xs text-detective-gold capitalize">
            {room.name}
          </h2>
        </div>
      </div>

      {/* Room description overlay */}
      <div className="absolute top-3 right-3 z-10 pointer-events-none max-w-[200px]">
        <div className="px-2 py-1 bg-black/50 rounded-lg backdrop-blur-sm">
          <p className="text-[10px] text-detective-muted leading-tight">
            {room.description}
          </p>
        </div>
      </div>

      {/* PixiJS Canvas with fade transition */}
      <div
        className="w-full aspect-video bg-detective-bg rounded-xl overflow-hidden border border-detective-border adventure-canvas cursor-investigate"
        style={{
          transition: 'opacity 0.3s ease-in-out',
          opacity: fading ? 0 : 1,
        }}
      >
        <Application
          resizeTo={containerRef}
          background={0x0a0a0f}
          antialias={false}
          resolution={window.devicePixelRatio || 1}
          autoDensity
        >
          <PixiRoomScene
            roomId={room.id}
            suspects={suspects}
            clues={clues}
            collectedClueIds={collectedClueIds}
            connections={connections.map((r) => r.id)}
            onClickSuspect={selectSuspect}
            onClickClue={inspectClue}
            onClickExit={handleNavigateRoom}
            onHotspotHover={handleHotspotHover}
            effect={effect}
            onEffectComplete={handleEffectComplete}
          />
        </Application>
      </div>

      {/* Hover tooltip */}
      {tooltip && (
        <HoverTooltip label={tooltip.label} x={tooltip.x} y={tooltip.y} />
      )}
    </div>
  )
}
