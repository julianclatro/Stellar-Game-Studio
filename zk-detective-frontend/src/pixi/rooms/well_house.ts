import type { SceneRoomHotspots } from '../asset-manifest'

export const wellHouseHotspots: SceneRoomHotspots = [
  // Suspects
  {
    id: 'ines', x: 500, y: 320, width: 80, height: 120, type: 'suspect', label: 'Ines Fuentes',
    layer: 'midground', cursor: 'talk',
    idleAnimation: { type: 'breathe', speed: 0.7 },
    hoverEffect: { type: 'brightness', intensity: 1.3 },
  },
  // Clues
  {
    id: 'tampered_samples', x: 300, y: 240, width: 60, height: 50, type: 'clue', label: 'Diluted Samples',
    layer: 'midground', cursor: 'investigate',
    idleAnimation: { type: 'shimmer', speed: 1.0 },
    hoverEffect: { type: 'glow', color: 0xffd700, intensity: 1.5 },
  },
  {
    id: 'falsified_log', x: 650, y: 200, width: 50, height: 40, type: 'clue', label: 'Falsified Log',
    layer: 'midground', cursor: 'investigate',
    idleAnimation: { type: 'shimmer', speed: 1.2 },
    hoverEffect: { type: 'glow', color: 0xffd700, intensity: 1.5 },
  },
  // Exits
  {
    id: 'exit_town_hall', x: 40, y: 400, width: 80, height: 100, type: 'exit', label: 'To Town Hall',
    layer: 'foreground', cursor: 'exit', exitDirection: 'left',
    hoverEffect: { type: 'brightness', intensity: 1.2 },
  },
  {
    id: 'exit_old_mine', x: 840, y: 400, width: 80, height: 100, type: 'exit', label: 'To Old Mine',
    layer: 'foreground', cursor: 'exit', exitDirection: 'right',
    hoverEffect: { type: 'brightness', intensity: 1.2 },
  },
]
