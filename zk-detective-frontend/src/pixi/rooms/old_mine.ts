import type { SceneRoomHotspots } from '../asset-manifest'

export const oldMineHotspots: SceneRoomHotspots = [
  // Suspects
  {
    id: 'beckman', x: 460, y: 300, width: 80, height: 120, type: 'suspect', label: 'Roy Beckman',
    layer: 'midground', cursor: 'talk',
    idleAnimation: { type: 'breathe', speed: 0.5 },
    hoverEffect: { type: 'brightness', intensity: 1.3 },
  },
  {
    id: 'coyote', x: 720, y: 340, width: 80, height: 120, type: 'suspect', label: 'Coyote Santos',
    layer: 'midground', cursor: 'talk',
    idleAnimation: { type: 'breathe', speed: 0.7 },
    hoverEffect: { type: 'brightness', intensity: 1.3 },
  },
  // Clues
  {
    id: 'chemical_barrels', x: 260, y: 260, width: 70, height: 60, type: 'clue', label: 'Chemical Barrels',
    layer: 'midground', cursor: 'investigate',
    idleAnimation: { type: 'shimmer', speed: 0.8 },
    hoverEffect: { type: 'glow', color: 0xffd700, intensity: 1.5 },
  },
  {
    id: 'forged_clearance', x: 580, y: 200, width: 50, height: 40, type: 'clue', label: 'Forged Clearance',
    layer: 'midground', cursor: 'investigate',
    idleAnimation: { type: 'shimmer', speed: 1.2 },
    hoverEffect: { type: 'glow', color: 0xffd700, intensity: 1.5 },
  },
  // Exits
  {
    id: 'exit_well_house', x: 40, y: 400, width: 80, height: 100, type: 'exit', label: 'To Well House',
    layer: 'foreground', cursor: 'exit', exitDirection: 'left',
    hoverEffect: { type: 'brightness', intensity: 1.2 },
  },
  {
    id: 'exit_clinic', x: 840, y: 400, width: 80, height: 100, type: 'exit', label: 'To Clinic',
    layer: 'foreground', cursor: 'exit', exitDirection: 'right',
    hoverEffect: { type: 'brightness', intensity: 1.2 },
  },
]
