// SceneClueSprite — renders a clue as an in-scene object (e.g. bottle on nightstand).
// Shows collectedSprite after pickup, or fades out. Falls back to old icon+sparkle if
// no scene sprite exists.

import { useCallback, useEffect, useState } from 'react'
import { Assets, Texture, Graphics } from 'pixi.js'
import { useTick } from '@pixi/react'
import { CLUE_ICONS } from './asset-manifest'
import type { SceneHotspot } from './asset-manifest'
import type { Clue } from '@/data/types'
import { InteractiveElement } from './InteractiveElement'

interface SceneClueSpriteProps {
  hotspot: SceneHotspot
  clue: Clue
  collected: boolean
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

// Sparkle 4-pointed star (reused from old ClueHotspot)
function SparkleEffect({ x, y }: { x: number; y: number }) {
  const [phase, setPhase] = useState(Math.random() * Math.PI * 2)

  useTick(useCallback((ticker: { deltaTime: number }) => {
    setPhase((p) => p + ticker.deltaTime * 0.05)
  }, []))

  const alpha = 0.4 + Math.sin(phase) * 0.4
  const scale = 0.8 + Math.sin(phase * 1.3) * 0.2

  const draw = useCallback((g: InstanceType<typeof Graphics>) => {
    g.clear()
    g.setStrokeStyle({ width: 2, color: 0xd4a843 })
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2
      g.moveTo(0, 0)
      g.lineTo(Math.cos(angle) * 8, Math.sin(angle) * 8)
    }
    g.stroke()
  }, [])

  return (
    <pixiGraphics
      draw={draw}
      x={x}
      y={y}
      alpha={alpha}
      scale={scale}
    />
  )
}

export function SceneClueSprite({ hotspot, clue, collected, onClick, onHover }: SceneClueSpriteProps) {
  const sceneTex = useTexture(hotspot.sprite)
  const collectedTex = useTexture(hotspot.collectedSprite)
  const iconTex = useTexture(CLUE_ICONS[clue.id])

  const hasSceneSprite = sceneTex !== null

  // When collected: show collectedSprite if available, otherwise disappear
  if (collected) {
    if (collectedTex) {
      const fitScale = Math.min(hotspot.width / collectedTex.width, hotspot.height / collectedTex.height)
      return (
        <pixiContainer x={hotspot.x} y={hotspot.y}>
          <pixiSprite
            texture={collectedTex}
            scale={fitScale}
            anchor={{ x: 0.5, y: 0.5 }}
            x={hotspot.width / 2}
            y={hotspot.height / 2}
          />
        </pixiContainer>
      )
    }
    // No collected sprite — element simply doesn't render
    return null
  }

  return (
    <InteractiveElement
      hotspot={hotspot}
      onClick={onClick}
      onHover={onHover}
      hoverLabel={`Examine ${hotspot.label}`}
    >
      {hasSceneSprite ? (
        (() => {
          const fitScale = Math.min(hotspot.width / sceneTex.width, hotspot.height / sceneTex.height)
          return (
            <>
              <pixiSprite
                texture={sceneTex}
                scale={fitScale}
                anchor={{ x: 0.5, y: 0.5 }}
                x={hotspot.width / 2}
                y={hotspot.height / 2}
              />
              <SparkleEffect x={hotspot.width / 2} y={-4} />
            </>
          )
        })()
      ) : (
        // Fallback: 48x48 icon centered in hotspot
        <pixiContainer
          x={(hotspot.width - 48) / 2}
          y={(hotspot.height - 48) / 2}
        >
          {iconTex && (
            <pixiSprite
              texture={iconTex}
              width={48}
              height={48}
            />
          )}
          <SparkleEffect x={24} y={-8} />
        </pixiContainer>
      )}
    </InteractiveElement>
  )
}
