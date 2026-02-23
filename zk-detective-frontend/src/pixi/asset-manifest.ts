// Asset manifest for PixiJS canvas — room backgrounds, sprite configs, and hotspot data.
// Reuses the same PNG assets from public/assets/ that the card-based UI uses.

const BASE = '/assets'

export const ROOM_BACKGROUNDS: Record<string, string> = {
  bedroom: `${BASE}/rooms/bedroom.png`,
  kitchen: `${BASE}/rooms/kitchen.png`,
  study: `${BASE}/rooms/study.png`,
  lounge: `${BASE}/rooms/lounge.png`,
  garden: `${BASE}/rooms/garden.png`,
}

export const SUSPECT_PORTRAITS: Record<string, string> = {
  victor: `${BASE}/suspects/victor.png`,
  elena: `${BASE}/suspects/elena.png`,
  marcus: `${BASE}/suspects/marcus.png`,
  isabelle: `${BASE}/suspects/isabelle.png`,
  thomas: `${BASE}/suspects/thomas.png`,
  priya: `${BASE}/suspects/priya.png`,
  james: `${BASE}/suspects/james.png`,
  celeste: `${BASE}/suspects/celeste.png`,
  ren: `${BASE}/suspects/ren.png`,
}

export const CLUE_ICONS: Record<string, string> = {
  perfume_bottle: `${BASE}/clues/perfume-bottle.png`,
  smudged_fingerprints: `${BASE}/clues/fingerprints.png`,
  torn_letter: `${BASE}/clues/torn-letter.png`,
  wine_glass: `${BASE}/clues/wine-glass.png`,
  missing_knife: `${BASE}/clues/missing-knife.png`,
  insurance_docs: `${BASE}/clues/insurance-docs.png`,
  crumpled_note: `${BASE}/clues/crumpled-note.png`,
  phone_records: `${BASE}/clues/phone-records.png`,
  medicine_bottle: `${BASE}/clues/medicine-bottle.png`,
  muddy_footprints: `${BASE}/clues/muddy-footprints.png`,
  camera_photos: `${BASE}/clues/camera-photos.png`,
}

// Canvas dimensions — 16:9 aspect ratio, scales to fit viewport
export const CANVAS_WIDTH = 960
export const CANVAS_HEIGHT = 540

// Hotspot definitions per room: x,y positions within 960x540 canvas
export interface Hotspot {
  id: string
  x: number
  y: number
  width: number
  height: number
  type: 'clue' | 'suspect' | 'exit'
  label: string
}

// Extended hotspot for layered scene system — adds sprite paths, depth layer, and effects
export interface SceneHotspot extends Hotspot {
  layer: 'background' | 'midground' | 'foreground'
  anchor?: { x: number; y: number }          // default: bottom-center (0.5, 1.0)
  scale?: number                              // display scale multiplier
  flipX?: boolean
  sprite?: string                             // transparent PNG path for scene-integrated art
  collectedSprite?: string                    // empty-spot sprite after clue pickup
  cursor?: 'investigate' | 'talk' | 'exit' | 'grab'
  hoverEffect?: {
    type: 'glow' | 'brightness' | 'outline'
    color?: number
    intensity?: number
  }
  idleAnimation?: {
    type: 'breathe' | 'bob' | 'shimmer' | 'none'
    speed?: number
    amplitude?: number
  }
  exitDirection?: 'left' | 'right'
}

export type RoomHotspots = Hotspot[]
export type SceneRoomHotspots = SceneHotspot[]

// Scene asset paths — layered backgrounds, foregrounds, and sprites
const SCENE_BASE = '/assets/scenes'

export const SCENE_ROOMS: Record<string, {
  base: string
  foreground?: string
}> = {
  bedroom: { base: `${SCENE_BASE}/bedroom/room-base.png`, foreground: `${SCENE_BASE}/bedroom/room-foreground.png` },
  kitchen: { base: `${SCENE_BASE}/kitchen/room-base.png`, foreground: `${SCENE_BASE}/kitchen/room-foreground.png` },
  study: { base: `${SCENE_BASE}/study/room-base.png`, foreground: `${SCENE_BASE}/study/room-foreground.png` },
  lounge: { base: `${SCENE_BASE}/lounge/room-base.png`, foreground: `${SCENE_BASE}/lounge/room-foreground.png` },
  garden: { base: `${SCENE_BASE}/garden/room-base.png`, foreground: `${SCENE_BASE}/garden/room-foreground.png` },
}
