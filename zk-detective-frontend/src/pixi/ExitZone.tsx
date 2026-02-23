// ExitZone — invisible hitbox over a painted door in the room background.
// Shows a directional arrow on hover. No visible box at rest — the door is in the art.

import { useCallback, useState } from 'react'
import { Graphics } from 'pixi.js'
import type { SceneHotspot } from './asset-manifest'

interface ExitZoneProps {
  hotspot: SceneHotspot
  onClick: () => void
  onHover: (label: string | null, x: number, y: number) => void
}

export function ExitZone({ hotspot, onClick, onHover }: ExitZoneProps) {
  const [hovered, setHovered] = useState(false)

  const isLeft = hotspot.exitDirection === 'left'
  const arrowColor = hotspot.hoverEffect?.color ?? 0x2a9d8f

  const draw = useCallback((g: InstanceType<typeof Graphics>) => {
    g.clear()

    // Invisible hitbox (fully transparent fill for event detection)
    g.setFillStyle({ color: 0x000000, alpha: 0.001 })
    g.rect(0, 0, hotspot.width, hotspot.height)
    g.fill()

    if (!hovered) return

    // Subtle tinted overlay on hover
    g.setFillStyle({ color: arrowColor, alpha: 0.08 })
    g.roundRect(0, 0, hotspot.width, hotspot.height, 6)
    g.fill()

    // Directional arrow
    const cx = hotspot.width / 2
    const cy = hotspot.height / 2
    const arrowSize = 14
    g.setFillStyle({ color: arrowColor, alpha: 0.7 })

    if (isLeft) {
      g.moveTo(cx + arrowSize, cy - arrowSize * 0.7)
      g.lineTo(cx - arrowSize, cy)
      g.lineTo(cx + arrowSize, cy + arrowSize * 0.7)
    } else {
      g.moveTo(cx - arrowSize, cy - arrowSize * 0.7)
      g.lineTo(cx + arrowSize, cy)
      g.lineTo(cx - arrowSize, cy + arrowSize * 0.7)
    }
    g.closePath()
    g.fill()

    // Outline border
    g.setStrokeStyle({ width: 1.5, color: arrowColor, alpha: 0.4 })
    g.roundRect(0, 0, hotspot.width, hotspot.height, 6)
    g.stroke()
  }, [hovered, hotspot.width, hotspot.height, arrowColor, isLeft])

  return (
    <pixiGraphics
      draw={draw}
      x={hotspot.x}
      y={hotspot.y}
      eventMode="static"
      cursor="pointer"
      onClick={onClick}
      onPointerEnter={() => { setHovered(true); onHover(`Go to ${hotspot.label}`, hotspot.x + hotspot.width / 2, hotspot.y) }}
      onPointerLeave={() => { setHovered(false); onHover(null, 0, 0) }}
    />
  )
}
