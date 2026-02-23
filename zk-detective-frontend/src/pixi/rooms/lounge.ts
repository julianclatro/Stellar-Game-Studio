import type { SceneRoomHotspots } from '../asset-manifest'

export const loungeHotspots: SceneRoomHotspots = [
  // Suspects
  {
    id: 'marcus', x: 440, y: 310, width: 80, height: 120, type: 'suspect', label: 'Marcus',
    layer: 'midground', cursor: 'talk',

    hoverEffect: { type: 'brightness', intensity: 1.3 },
  },
  {
    id: 'celeste', x: 700, y: 300, width: 80, height: 120, type: 'suspect', label: 'Celeste',
    layer: 'midground', cursor: 'talk',

    hoverEffect: { type: 'brightness', intensity: 1.3 },
  },
  // Clues
  {
    id: 'phone_records', x: 260, y: 200, width: 50, height: 45, type: 'clue', label: 'Phone Records',
    layer: 'midground', cursor: 'investigate',

    hoverEffect: { type: 'glow', color: 0xffd700, intensity: 1.5 },
  },
  {
    id: 'medicine_bottle', x: 580, y: 190, width: 40, height: 50, type: 'clue', label: 'Empty Medicine Bottle',
    layer: 'midground', cursor: 'investigate',

    hoverEffect: { type: 'glow', color: 0xffd700, intensity: 1.5 },
  },
  // Exits
  {
    id: 'exit_bedroom', x: 40, y: 400, width: 80, height: 100, type: 'exit', label: 'To Bedroom',
    layer: 'foreground', cursor: 'exit', exitDirection: 'left',
    hoverEffect: { type: 'brightness', intensity: 1.2 },
  },
  {
    id: 'exit_kitchen', x: 840, y: 400, width: 80, height: 100, type: 'exit', label: 'To Kitchen',
    layer: 'foreground', cursor: 'exit', exitDirection: 'right',
    hoverEffect: { type: 'brightness', intensity: 1.2 },
  },
]
