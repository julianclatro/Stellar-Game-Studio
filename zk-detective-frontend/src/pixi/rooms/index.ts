import type { SceneRoomHotspots } from '../asset-manifest'
import { bedroomHotspots } from './bedroom'
import { kitchenHotspots } from './kitchen'
import { studyHotspots } from './study'
import { loungeHotspots } from './lounge'
import { gardenHotspots } from './garden'

export const ROOM_HOTSPOTS: Record<string, SceneRoomHotspots> = {
  bedroom: bedroomHotspots,
  kitchen: kitchenHotspots,
  study: studyHotspots,
  lounge: loungeHotspots,
  garden: gardenHotspots,
}
