// SceneSuspectSprite — renders a full-body transparent character sprite in the scene.
// Falls back to the old portrait card + golden border when no scene sprite exists.

import { useCallback, useEffect, useState } from 'react'
import { Assets, Texture, Graphics } from 'pixi.js'
import { SUSPECT_PORTRAITS } from './asset-manifest'
import type { SceneHotspot } from './asset-manifest'
import type { Suspect } from '@/data/types'
import { InteractiveElement } from './InteractiveElement'

interface SceneSuspectSpriteProps {
  hotspot: SceneHotspot
  suspect: Suspect
  onClick: () => void
  onHover: (label: string | null, x: number, y: number) => void
}

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

export function SceneSuspectSprite({ hotspot, suspect, onClick, onHover }: SceneSuspectSpriteProps) {
  const sceneTex = useTexture(hotspot.sprite)
  const portraitTex = useTexture(SUSPECT_PORTRAITS[suspect.id])

  // Fallback: old-style portrait card with golden border
  const fallbackBg = useCallback((g: InstanceType<typeof Graphics>) => {
    g.clear()
    g.setFillStyle({ color: 0x1e1e2e })
    g.roundRect(0, 0, 80, 120, 8)
    g.fill()
    g.setStrokeStyle({ width: 1.5, color: 0xd4a843 })
    g.roundRect(0, 0, 80, 120, 8)
    g.stroke()
  }, [])

  const hasSceneSprite = sceneTex !== null

  return (
    <InteractiveElement
      hotspot={hotspot}
      onClick={onClick}
      onHover={onHover}
      hoverLabel={hotspot.label}
    >
      {hasSceneSprite ? (
        (() => {
          const fitScale = Math.min(hotspot.width / sceneTex.width, hotspot.height / sceneTex.height)
          return (
            <pixiSprite
              texture={sceneTex}
              scale={fitScale}
              anchor={{ x: 0.5, y: 1.0 }}
              x={hotspot.width / 2}
              y={hotspot.height}
            />
          )
        })()
      ) : (
        // Fallback: 80x120 portrait card centered in the hotspot
        <pixiContainer
          x={(hotspot.width - 80) / 2}
          y={hotspot.height - 120}
        >
          <pixiGraphics draw={fallbackBg} />
          {portraitTex && (
            <pixiSprite
              texture={portraitTex}
              width={80}
              height={120}
            />
          )}
        </pixiContainer>
      )}
    </InteractiveElement>
  )
}
