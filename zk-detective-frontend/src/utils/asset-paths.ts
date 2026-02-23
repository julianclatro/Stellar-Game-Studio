// Asset path mappings for all game visual assets.
// Maps game entity IDs (from case data) to their image file paths.
// Images live in public/assets/ and are served from /assets/ at runtime.
//
// EXT switched to '.png' — using Nano Banana generated assets (2026-02-09).

const BASE = '/assets'
const EXT = '.png'

// ── Title ──────────────────────────────────────

export const TITLE_ASSETS = {
  manor: `${BASE}/title/manor-exterior${EXT}`,
} as const

// ── Rooms ──────────────────────────────────────

const ROOM_IMAGES: Record<string, string> = {
  bedroom: `${BASE}/rooms/bedroom${EXT}`,
  kitchen: `${BASE}/rooms/kitchen${EXT}`,
  study: `${BASE}/rooms/study${EXT}`,
  lounge: `${BASE}/rooms/lounge${EXT}`,
  garden: `${BASE}/rooms/garden${EXT}`,
}

export function getRoomImage(roomId: string): string | undefined {
  return ROOM_IMAGES[roomId]
}

// ── Suspects ───────────────────────────────────

const SUSPECT_IMAGES: Record<string, string> = {
  victor: `${BASE}/suspects/victor${EXT}`,
  elena: `${BASE}/suspects/elena${EXT}`,
  marcus: `${BASE}/suspects/marcus${EXT}`,
  isabelle: `${BASE}/suspects/isabelle${EXT}`,
  thomas: `${BASE}/suspects/thomas${EXT}`,
  priya: `${BASE}/suspects/priya${EXT}`,
  james: `${BASE}/suspects/james${EXT}`,
  celeste: `${BASE}/suspects/celeste${EXT}`,
  ren: `${BASE}/suspects/ren${EXT}`,
}

export function getSuspectImage(suspectId: string): string | undefined {
  return SUSPECT_IMAGES[suspectId]
}

// ── Clues ──────────────────────────────────────

const CLUE_IMAGES: Record<string, string> = {
  perfume_bottle: `${BASE}/clues/perfume-bottle${EXT}`,
  smudged_fingerprints: `${BASE}/clues/fingerprints${EXT}`,
  torn_letter: `${BASE}/clues/torn-letter${EXT}`,
  wine_glass: `${BASE}/clues/wine-glass${EXT}`,
  missing_knife: `${BASE}/clues/missing-knife${EXT}`,
  insurance_docs: `${BASE}/clues/insurance-docs${EXT}`,
  crumpled_note: `${BASE}/clues/crumpled-note${EXT}`,
  phone_records: `${BASE}/clues/phone-records${EXT}`,
  medicine_bottle: `${BASE}/clues/medicine-bottle${EXT}`,
  muddy_footprints: `${BASE}/clues/muddy-footprints${EXT}`,
  camera_photos: `${BASE}/clues/camera-photos${EXT}`,
}

export function getClueImage(clueId: string): string | undefined {
  return CLUE_IMAGES[clueId]
}

// ── Weapons ────────────────────────────────────

const WEAPON_IMAGES: Record<string, string> = {
  poison_vial: `${BASE}/weapons/poison-vial${EXT}`,
  kitchen_knife: `${BASE}/weapons/kitchen-knife${EXT}`,
  candlestick: `${BASE}/weapons/candlestick${EXT}`,
  letter_opener: `${BASE}/weapons/letter-opener${EXT}`,
  garden_shears: `${BASE}/weapons/garden-shears${EXT}`,
}

export function getWeaponImage(weaponId: string): string | undefined {
  return WEAPON_IMAGES[weaponId]
}
