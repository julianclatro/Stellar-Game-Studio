import type { SceneRoomHotspots } from '../asset-manifest'

export const clinicHotspots: SceneRoomHotspots = [
  // Suspects
  {
    id: 'ramirez', x: 440, y: 310, width: 80, height: 120, type: 'suspect', label: 'Doc Ramirez',
    layer: 'midground', cursor: 'talk',
    idleAnimation: { type: 'breathe', speed: 0.6 },
    hoverEffect: { type: 'brightness', intensity: 1.3 },
  },
  {
    id: 'agnes', x: 700, y: 330, width: 80, height: 120, type: 'suspect', label: 'Sister Agnes',
    layer: 'midground', cursor: 'talk',
    idleAnimation: { type: 'breathe', speed: 0.8 },
    hoverEffect: { type: 'brightness', intensity: 1.3 },
  },
  // Clues
  {
    id: 'blood_results', x: 280, y: 220, width: 60, height: 50, type: 'clue', label: 'Blood Results',
    layer: 'midground', cursor: 'investigate',
    idleAnimation: { type: 'shimmer', speed: 1.0 },
    hoverEffect: { type: 'glow', color: 0xffd700, intensity: 1.5 },
  },
  {
    id: 'threatening_note', x: 600, y: 190, width: 50, height: 40, type: 'clue', label: "Mayor's Note",
    layer: 'midground', cursor: 'investigate',
    idleAnimation: { type: 'shimmer', speed: 1.1 },
    hoverEffect: { type: 'glow', color: 0xffd700, intensity: 1.5 },
  },
  // Exits
  {
    id: 'exit_cantina', x: 40, y: 400, width: 80, height: 100, type: 'exit', label: 'To Cantina',
    layer: 'foreground', cursor: 'exit', exitDirection: 'left',
    hoverEffect: { type: 'brightness', intensity: 1.2 },
  },
  {
    id: 'exit_old_mine', x: 840, y: 400, width: 80, height: 100, type: 'exit', label: 'To Old Mine',
    layer: 'foreground', cursor: 'exit', exitDirection: 'right',
    hoverEffect: { type: 'brightness', intensity: 1.2 },
  },
]
