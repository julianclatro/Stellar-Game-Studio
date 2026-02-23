// PixiJS Room Scene — layered depth-sorted rendering system.
// Layer stack: Background (z=0) → Midground y-sorted (z=1) → Foreground (z=2) → Vignette (z=3) → Effects (z=4)
// Falls back gracefully when scene sprites are missing (old portraits/icons shown).

import { useCallback, useEffect, useMemo, useState } from 'react'
import { extend } from '@pixi/react'
import { Container, Sprite, Graphics, Assets, Texture } from 'pixi.js'
import {
  ROOM_BACKGROUNDS, SCENE_ROOMS,
  CANVAS_WIDTH, CANVAS_HEIGHT,
} from './asset-manifest'
import type { SceneHotspot } from './asset-manifest'
import { ROOM_HOTSPOTS } from './rooms'
import type { Clue, Suspect } from '@/data/types'
import { EffectsLayer } from './EffectsLayer'
import type { EffectType } from './EffectsLayer'
import { SceneSuspectSprite } from './SceneSuspectSprite'
import { SceneClueSprite } from './SceneClueSprite'
import { ExitZone } from './ExitZone'

// Register PixiJS components for JSX use
extend({ Container, Sprite, Graphics })

interface PixiRoomSceneProps {
  roomId: string
  suspects: Suspect[]
  clues: Clue[]
  collectedClueIds: Set<string>
  connections: string[]
  onClickSuspect: (suspect: Suspect) => void
  onClickClue: (clue: Clue) => void
  onClickExit: (roomId: string) => void
  onHotspotHover: (label: string | null, x: number, y: number) => void
  effect?: EffectType
  onEffectComplete?: () => void
}

// Async texture loader hook
function useTexture(src: string | undefined): Texture | null {
  const [tex, setTex] = useState<Texture | null>(null)
  useEffect(() => {
    if (!src) { setTex(null); return }
    let cancelled = false
    Assets.load<Texture>(src)
      .then((t) => { if (!cancelled) setTex(t) })
      .catch(() => { if (!cancelled) setTex(null) })
    return () => { cancelled = true }
  }, [src])
  return tex
}

export function PixiRoomScene({
  roomId,
  suspects,
  clues,
  collectedClueIds,
  connections,
  onClickSuspect,
  onClickClue,
  onClickExit,
  onHotspotHover,
  effect = 'none',
  onEffectComplete,
}: PixiRoomSceneProps) {
  // Scene-specific layered backgrounds
  const sceneRoom = SCENE_ROOMS[roomId]
  const sceneBaseTex = useTexture(sceneRoom?.base)
  const sceneFgTex = useTexture(sceneRoom?.foreground)
  // Fallback: old room background
  const oldBgTex = useTexture(ROOM_BACKGROUNDS[roomId])
  // Use scene base if available, otherwise old background
  const bgTex = sceneBaseTex ?? oldBgTex

  const hotspots = ROOM_HOTSPOTS[roomId] ?? []

  const suspectMap = useMemo(() => {
    const map = new Map<string, Suspect>()
    for (const s of suspects) map.set(s.id, s)
    return map
  }, [suspects])

  const clueMap = useMemo(() => {
    const map = new Map<string, Clue>()
    for (const c of clues) map.set(c.id, c)
    return map
  }, [clues])

  const connectionSet = useMemo(() => new Set(connections), [connections])

  // Sort midground hotspots by Y position for depth ordering
  const midgroundHotspots = useMemo(() => {
    return [...hotspots]
      .filter((h) => h.layer === 'midground')
      .sort((a, b) => a.y - b.y)
  }, [hotspots])

  const vignetteDraw = useCallback((g: InstanceType<typeof Graphics>) => {
    g.clear()
    g.setFillStyle({ color: 0x000000, alpha: 0.3 })
    g.rect(0, 0, CANVAS_WIDTH, 40)
    g.fill()
    g.setFillStyle({ color: 0x000000, alpha: 0.4 })
    g.rect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50)
    g.fill()
  }, [])

  const renderHotspot = useCallback((h: SceneHotspot) => {
    if (h.type === 'suspect') {
      const suspect = suspectMap.get(h.id)
      if (!suspect) return null
      return (
        <SceneSuspectSprite
          key={h.id}
          hotspot={h}
          suspect={suspect}
          onClick={() => onClickSuspect(suspect)}
          onHover={onHotspotHover}
        />
      )
    }

    if (h.type === 'clue') {
      const clue = clueMap.get(h.id)
      if (!clue) return null
      return (
        <SceneClueSprite
          key={h.id}
          hotspot={h}
          clue={clue}
          collected={collectedClueIds.has(h.id)}
          onClick={() => onClickClue(clue)}
          onHover={onHotspotHover}
        />
      )
    }

    if (h.type === 'exit') {
      if (!connectionSet.has(h.id)) return null
      return (
        <ExitZone
          key={h.id}
          hotspot={h}
          onClick={() => onClickExit(h.id)}
          onHover={onHotspotHover}
        />
      )
    }

    return null
  }, [suspectMap, clueMap, collectedClueIds, connectionSet, onClickSuspect, onClickClue, onClickExit, onHotspotHover])

  return (
    <pixiContainer sortableChildren>
      {/* [z=0] Background — room base (empty room with doors painted in) */}
      {bgTex && (
        <pixiSprite
          texture={bgTex}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          zIndex={0}
        />
      )}

      {/* [z=1] Midground — y-sorted suspects, clues, and exit zones */}
      <pixiContainer zIndex={1} sortableChildren>
        {midgroundHotspots.map((h, i) => (
          <pixiContainer key={h.id} zIndex={h.y}>
            {renderHotspot(h)}
          </pixiContainer>
        ))}
      </pixiContainer>

      {/* [z=2] Foreground — optional overlap layer (table edges, curtains) */}
      {sceneFgTex && (
        <pixiSprite
          texture={sceneFgTex}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          zIndex={2}
        />
      )}

      {/* [z=3] Vignette overlay */}
      <pixiGraphics draw={vignetteDraw} zIndex={3} />

      {/* [z=4] Flash effects overlay (gold/white/red) */}
      <pixiContainer zIndex={4}>
        <EffectsLayer effect={effect} onEffectComplete={onEffectComplete} />
      </pixiContainer>
    </pixiContainer>
  )
}
