// InteractiveElement — reusable wrapper that adds hover effects and idle animations
// to any PixiJS scene element. Uses ColorMatrixFilter for brightness, Graphics for glow.

import { useCallback, useState, useMemo } from 'react'
import { useTick } from '@pixi/react'
import { ColorMatrixFilter, Graphics } from 'pixi.js'
import type { SceneHotspot } from './asset-manifest'

interface InteractiveElementProps {
  hotspot: SceneHotspot
  onClick: () => void
  onHover: (label: string | null, x: number, y: number) => void
  hoverLabel: string
  children: React.ReactNode
}

export function InteractiveElement({ hotspot, onClick, onHover, hoverLabel, children }: InteractiveElementProps) {
  const [hovered, setHovered] = useState(false)
  const [animPhase, setAnimPhase] = useState(Math.random() * Math.PI * 2)

  const anim = hotspot.idleAnimation
  const speed = anim?.speed ?? 0.03
  const amplitude = anim?.amplitude ?? 0.01

  useTick(useCallback((ticker: { deltaTime: number }) => {
    setAnimPhase((p) => p + ticker.deltaTime * speed)
  }, [speed]))

  // Compute idle animation transforms
  let scaleX = hotspot.scale ?? 1
  let scaleY = hotspot.scale ?? 1
  let yOffset = 0
  let extraAlpha = 1

  const animType = anim?.type ?? 'none'
  if (animType === 'breathe') {
    scaleY = (hotspot.scale ?? 1) * (1 + Math.sin(animPhase) * amplitude)
  } else if (animType === 'bob') {
    yOffset = Math.sin(animPhase) * (amplitude * 100)
  } else if (animType === 'shimmer') {
    extraAlpha = 1 + Math.sin(animPhase) * amplitude
  }

  if (hotspot.flipX) scaleX = -scaleX

  // Hover filter: brightness boost
  const brightnessFilter = useMemo(() => {
    const f = new ColorMatrixFilter()
    return f
  }, [])

  const hoverFx = hotspot.hoverEffect
  if (hovered && hoverFx?.type === 'brightness') {
    brightnessFilter.brightness(hoverFx.intensity ?? 1.15, false)
  } else {
    brightnessFilter.brightness(1, false)
  }

  const filters = hoverFx?.type === 'brightness' ? [brightnessFilter] : []

  // Glow ring for 'glow' hover effect
  const glowColor = hoverFx?.color ?? 0xd4a843
  const glowIntensity = hoverFx?.intensity ?? 0.6
  const drawGlow = useCallback((g: InstanceType<typeof Graphics>) => {
    g.clear()
    if (!hovered || hoverFx?.type !== 'glow') return
    g.setFillStyle({ color: glowColor, alpha: glowIntensity * 0.25 })
    g.ellipse(hotspot.width / 2, hotspot.height, hotspot.width * 0.6, 12)
    g.fill()
    g.setStrokeStyle({ width: 2, color: glowColor, alpha: glowIntensity })
    g.ellipse(hotspot.width / 2, hotspot.height, hotspot.width * 0.55, 10)
    g.stroke()
  }, [hovered, hoverFx?.type, glowColor, glowIntensity, hotspot.width, hotspot.height])

  // Outline for 'outline' hover effect (exits)
  const outlineColor = hoverFx?.color ?? 0x2a9d8f
  const outlineIntensity = hoverFx?.intensity ?? 0.6
  const drawOutline = useCallback((g: InstanceType<typeof Graphics>) => {
    g.clear()
    if (!hovered || hoverFx?.type !== 'outline') return
    g.setStrokeStyle({ width: 2, color: outlineColor, alpha: outlineIntensity })
    g.roundRect(0, 0, hotspot.width, hotspot.height, 6)
    g.stroke()
  }, [hovered, hoverFx?.type, outlineColor, outlineIntensity, hotspot.width, hotspot.height])

  const anchor = hotspot.anchor ?? { x: 0.5, y: 1.0 }
  const pivotX = hotspot.width * anchor.x
  const pivotY = hotspot.height * anchor.y

  return (
    <pixiContainer
      x={hotspot.x}
      y={hotspot.y + yOffset}
      scale={{ x: scaleX, y: scaleY }}
      pivot={{ x: pivotX, y: pivotY }}
      alpha={extraAlpha}
      eventMode="static"
      cursor={hotspot.cursor === 'talk' ? 'pointer' : hotspot.cursor ?? 'pointer'}
      onClick={onClick}
      onPointerEnter={() => { setHovered(true); onHover(hoverLabel, hotspot.x, hotspot.y - 10) }}
      onPointerLeave={() => { setHovered(false); onHover(null, 0, 0) }}
      filters={filters}
    >
      <pixiGraphics draw={drawGlow} />
      <pixiGraphics draw={drawOutline} />
      {children}
    </pixiContainer>
  )
}
