import type { SceneRoomHotspots } from '../asset-manifest'

export const townHallHotspots: SceneRoomHotspots = [
  // Suspects
  {
    id: 'elena', x: 480, y: 320, width: 80, height: 120, type: 'suspect', label: 'Mayor Voss',
    layer: 'midground', cursor: 'talk',
    idleAnimation: { type: 'breathe', speed: 0.8 },
    hoverEffect: { type: 'brightness', intensity: 1.3 },
  },
  {
    id: 'harlan', x: 700, y: 340, width: 80, height: 120, type: 'suspect', label: 'Sheriff Harlan',
    layer: 'midground', cursor: 'talk',
    idleAnimation: { type: 'breathe', speed: 0.6 },
    hoverEffect: { type: 'brightness', intensity: 1.3 },
  },
  // Clues
  {
    id: 'redacted_minutes', x: 320, y: 200, width: 60, height: 50, type: 'clue', label: 'Redacted Minutes',
    layer: 'midground', cursor: 'investigate',
    idleAnimation: { type: 'shimmer', speed: 1.0 },
    hoverEffect: { type: 'glow', color: 0xffd700, intensity: 1.5 },
  },
  {
    id: 'campaign_funds', x: 620, y: 180, width: 50, height: 40, type: 'clue', label: 'Campaign Donation',
    layer: 'midground', cursor: 'investigate',
    idleAnimation: { type: 'shimmer', speed: 1.2 },
    hoverEffect: { type: 'glow', color: 0xffd700, intensity: 1.5 },
  },
  {
    id: 'resignation_draft', x: 200, y: 280, width: 50, height: 40, type: 'clue', label: 'Resignation Letter',
    layer: 'midground', cursor: 'investigate',
    idleAnimation: { type: 'shimmer', speed: 0.9 },
    hoverEffect: { type: 'glow', color: 0xffd700, intensity: 1.5 },
  },
  // Exits
  {
    id: 'exit_cantina', x: 40, y: 400, width: 80, height: 100, type: 'exit', label: 'To Cantina',
    layer: 'foreground', cursor: 'exit', exitDirection: 'left',
    hoverEffect: { type: 'brightness', intensity: 1.2 },
  },
  {
    id: 'exit_well_house', x: 840, y: 400, width: 80, height: 100, type: 'exit', label: 'To Well House',
    layer: 'foreground', cursor: 'exit', exitDirection: 'right',
    hoverEffect: { type: 'brightness', intensity: 1.2 },
  },
]
