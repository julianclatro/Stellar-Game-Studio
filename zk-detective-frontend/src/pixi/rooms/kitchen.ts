import type { SceneRoomHotspots } from '../asset-manifest'

export const kitchenHotspots: SceneRoomHotspots = [
  // Suspects
  {
    id: 'elena', x: 400, y: 310, width: 80, height: 120, type: 'suspect', label: 'Elena',
    layer: 'midground', cursor: 'talk',

    hoverEffect: { type: 'brightness', intensity: 1.3 },
  },
  {
    id: 'priya', x: 680, y: 320, width: 80, height: 120, type: 'suspect', label: 'Priya',
    layer: 'midground', cursor: 'talk',

    hoverEffect: { type: 'brightness', intensity: 1.3 },
  },
  // Clues
  {
    id: 'wine_glass', x: 280, y: 200, width: 45, height: 50, type: 'clue', label: 'Wine Glass with Residue',
    layer: 'midground', cursor: 'investigate',

    hoverEffect: { type: 'glow', color: 0xffd700, intensity: 1.5 },
  },
  {
    id: 'missing_knife', x: 560, y: 170, width: 55, height: 40, type: 'clue', label: 'Missing Chef\'s Knife',
    layer: 'midground', cursor: 'investigate',

    hoverEffect: { type: 'glow', color: 0xffd700, intensity: 1.5 },
  },
  // Exits
  {
    id: 'exit_lounge', x: 40, y: 400, width: 80, height: 100, type: 'exit', label: 'To Lounge',
    layer: 'foreground', cursor: 'exit', exitDirection: 'left',
    hoverEffect: { type: 'brightness', intensity: 1.2 },
  },
  {
    id: 'exit_garden', x: 840, y: 400, width: 80, height: 100, type: 'exit', label: 'To Garden',
    layer: 'foreground', cursor: 'exit', exitDirection: 'right',
    hoverEffect: { type: 'brightness', intensity: 1.2 },
  },
]
