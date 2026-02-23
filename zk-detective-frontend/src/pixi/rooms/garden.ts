import type { SceneRoomHotspots } from '../asset-manifest'

export const gardenHotspots: SceneRoomHotspots = [
  // Suspects
  {
    id: 'thomas', x: 380, y: 320, width: 80, height: 120, type: 'suspect', label: 'Thomas',
    layer: 'midground', cursor: 'talk',

    hoverEffect: { type: 'brightness', intensity: 1.3 },
  },
  {
    id: 'ren', x: 660, y: 310, width: 80, height: 120, type: 'suspect', label: 'Ren',
    layer: 'midground', cursor: 'talk',

    hoverEffect: { type: 'brightness', intensity: 1.3 },
  },
  // Clues
  {
    id: 'muddy_footprints', x: 200, y: 380, width: 60, height: 40, type: 'clue', label: 'Muddy Footprints',
    layer: 'midground', cursor: 'investigate',

    hoverEffect: { type: 'glow', color: 0xffd700, intensity: 1.5 },
  },
  {
    id: 'camera_photos', x: 540, y: 220, width: 50, height: 45, type: 'clue', label: 'Camera with Photos',
    layer: 'midground', cursor: 'investigate',

    hoverEffect: { type: 'glow', color: 0xffd700, intensity: 1.5 },
  },
  // Exits
  {
    id: 'exit_kitchen', x: 40, y: 400, width: 80, height: 100, type: 'exit', label: 'To Kitchen',
    layer: 'foreground', cursor: 'exit', exitDirection: 'left',
    hoverEffect: { type: 'brightness', intensity: 1.2 },
  },
  {
    id: 'exit_study', x: 840, y: 400, width: 80, height: 100, type: 'exit', label: 'To Study',
    layer: 'foreground', cursor: 'exit', exitDirection: 'right',
    hoverEffect: { type: 'brightness', intensity: 1.2 },
  },
]
