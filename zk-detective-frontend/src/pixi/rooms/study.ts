import type { SceneRoomHotspots } from '../asset-manifest'

export const studyHotspots: SceneRoomHotspots = [
  // Suspects
  {
    id: 'victor', x: 480, y: 300, width: 80, height: 120, type: 'suspect', label: 'Victor',
    layer: 'midground', cursor: 'talk',

    hoverEffect: { type: 'brightness', intensity: 1.3 },
  },
  {
    id: 'james', x: 720, y: 320, width: 80, height: 120, type: 'suspect', label: 'James',
    layer: 'midground', cursor: 'talk',

    hoverEffect: { type: 'brightness', intensity: 1.3 },
  },
  // Clues
  {
    id: 'insurance_docs', x: 300, y: 190, width: 55, height: 45, type: 'clue', label: 'Insurance Documents',
    layer: 'midground', cursor: 'investigate',

    hoverEffect: { type: 'glow', color: 0xffd700, intensity: 1.5 },
  },
  {
    id: 'crumpled_note', x: 580, y: 220, width: 45, height: 40, type: 'clue', label: 'Crumpled Note',
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
    id: 'exit_garden', x: 840, y: 400, width: 80, height: 100, type: 'exit', label: 'To Garden',
    layer: 'foreground', cursor: 'exit', exitDirection: 'right',
    hoverEffect: { type: 'brightness', intensity: 1.2 },
  },
]
