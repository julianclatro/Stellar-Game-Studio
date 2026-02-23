// Floating label positioned by canvas hotspot hover coordinates.
// Positioned absolutely within the PixiRoomView container.

interface HoverTooltipProps {
  label: string
  x: number
  y: number
}

export function HoverTooltip({ label, x, y }: HoverTooltipProps) {
  return (
    <div
      className="absolute z-20 pointer-events-none animate-fade-in"
      style={{
        left: `${(x / 960) * 100}%`,
        top: `${(y / 540) * 100}%`,
        transform: 'translate(-50%, -100%) translateY(-8px)',
      }}
    >
      <div className="px-2.5 py-1 bg-black/85 rounded border border-detective-gold/30 backdrop-blur-sm whitespace-nowrap">
        <span className="font-pixel text-[9px] text-detective-gold">
          {label}
        </span>
      </div>
    </div>
  )
}
