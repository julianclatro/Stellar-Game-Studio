import type { SceneRoomHotspots } from '../asset-manifest'

export const bedroomHotspots: SceneRoomHotspots = [
  // Suspects
  {
    id: 'isabelle', x: 620, y: 300, width: 80, height: 120, type: 'suspect', label: 'Isabelle',
    layer: 'midground', cursor: 'talk',

    hoverEffect: { type: 'brightness', intensity: 1.3 },
  },
  // Clues
  {
    id: 'perfume_bottle', x: 340, y: 180, width: 50, height: 50, type: 'clue', label: 'Broken Perfume Bottle',
    layer: 'midground', cursor: 'investigate',

    hoverEffect: { type: 'glow', color: 0xffd700, intensity: 1.5 },
  },
  {
    id: 'smudged_fingerprints', x: 160, y: 260, width: 50, height: 40, type: 'clue', label: 'Smudged Fingerprints',
    layer: 'midground', cursor: 'investigate',

    hoverEffect: { type: 'glow', color: 0xffd700, intensity: 1.5 },
  },
  {
    id: 'torn_letter', x: 500, y: 200, width: 50, height: 40, type: 'clue', label: 'Torn Business Letter',
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
    id: 'exit_study', x: 840, y: 400, width: 80, height: 100, type: 'exit', label: 'To Study',
    layer: 'foreground', cursor: 'exit', exitDirection: 'right',
    hoverEffect: { type: 'brightness', intensity: 1.2 },
  },
]
