import type { SceneRoomHotspots } from '../asset-manifest'

export const cantinaHotspots: SceneRoomHotspots = [
  // Suspects
  {
    id: 'clara', x: 460, y: 300, width: 80, height: 120, type: 'suspect', label: 'Clara Whitfield',
    layer: 'midground', cursor: 'talk',
    idleAnimation: { type: 'breathe', speed: 0.7 },
    hoverEffect: { type: 'brightness', intensity: 1.3 },
  },
  {
    id: 'dale', x: 680, y: 340, width: 80, height: 120, type: 'suspect', label: 'Dale Mercer',
    layer: 'midground', cursor: 'talk',
    idleAnimation: { type: 'breathe', speed: 0.5 },
    hoverEffect: { type: 'brightness', intensity: 1.3 },
  },
  // Clues
  {
    id: 'overheard_note', x: 340, y: 220, width: 50, height: 40, type: 'clue', label: "Clara's Notepad",
    layer: 'midground', cursor: 'investigate',
    idleAnimation: { type: 'shimmer', speed: 1.0 },
    hoverEffect: { type: 'glow', color: 0xffd700, intensity: 1.5 },
  },
  {
    id: 'buyout_offer', x: 600, y: 200, width: 50, height: 40, type: 'clue', label: 'Buyout Letter',
    layer: 'midground', cursor: 'investigate',
    idleAnimation: { type: 'shimmer', speed: 1.1 },
    hoverEffect: { type: 'glow', color: 0xffd700, intensity: 1.5 },
  },
  // Exits
  {
    id: 'exit_town_hall', x: 40, y: 400, width: 80, height: 100, type: 'exit', label: 'To Town Hall',
    layer: 'foreground', cursor: 'exit', exitDirection: 'left',
    hoverEffect: { type: 'brightness', intensity: 1.2 },
  },
  {
    id: 'exit_clinic', x: 840, y: 400, width: 80, height: 100, type: 'exit', label: 'To Clinic',
    layer: 'foreground', cursor: 'exit', exitDirection: 'right',
    hoverEffect: { type: 'brightness', intensity: 1.2 },
  },
]
