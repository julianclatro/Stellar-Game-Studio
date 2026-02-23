// Effects Layer — screen flash, shake, and vignette effects rendered in PixiJS.
// These are overlays on top of the room scene, driven by game state changes.

import { useCallback, useEffect, useState } from 'react'
import { extend } from '@pixi/react'
import { Graphics } from 'pixi.js'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './asset-manifest'

extend({ Graphics })

type EffectType = 'none' | 'flash-white' | 'flash-red' | 'flash-gold'

interface EffectsLayerProps {
  effect: EffectType
  onEffectComplete?: () => void
}

export function EffectsLayer({ effect, onEffectComplete }: EffectsLayerProps) {
  const [alpha, setAlpha] = useState(0)

  useEffect(() => {
    if (effect === 'none') {
      setAlpha(0)
      return
    }

    setAlpha(0.7)
    const decay = setInterval(() => {
      setAlpha((a) => {
        const next = a - 0.05
        if (next <= 0) {
          clearInterval(decay)
          onEffectComplete?.()
          return 0
        }
        return next
      })
    }, 16)

    return () => clearInterval(decay)
  }, [effect, onEffectComplete])

  const color = effect === 'flash-white' ? 0xffffff
    : effect === 'flash-red' ? 0xc8463b
    : effect === 'flash-gold' ? 0xd4a843
    : 0xffffff

  const draw = useCallback((g: Graphics) => {
    g.clear()
    g.setFillStyle({ color, alpha })
    g.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    g.fill()
  }, [color, alpha])

  if (alpha <= 0) return null

  return <pixiGraphics draw={draw} />
}

export type { EffectType }
