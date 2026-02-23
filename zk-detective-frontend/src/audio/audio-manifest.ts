// Audio manifest — typed paths for all music tracks and SFX.
// Audio files live in public/assets/audio/ and are lazy-loaded.

const BASE = '/assets/audio'

export const MUSIC_TRACKS = {
  title: `${BASE}/music-title.wav`,
  investigation: `${BASE}/music-investigation.wav`,
  tension: `${BASE}/music-tension.wav`,
  victory: `${BASE}/music-victory.wav`,
  defeat: `${BASE}/music-defeat.wav`,
} as const

export const SFX = {
  footstep: `${BASE}/sfx-footstep.wav`,
  door: `${BASE}/sfx-door.wav`,
  cluePickup: `${BASE}/sfx-clue-pickup.wav`,
  dialogueBlip: `${BASE}/sfx-dialogue-blip.wav`,
  accusationSlam: `${BASE}/sfx-accusation-slam.wav`,
  wrongBuzz: `${BASE}/sfx-wrong-buzz.wav`,
  correctSting: `${BASE}/sfx-correct-sting.wav`,
  uiClick: `${BASE}/sfx-ui-click.wav`,
} as const

export type MusicTrack = keyof typeof MUSIC_TRACKS
export type SfxName = keyof typeof SFX
