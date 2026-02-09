# F02: Room Navigation

**Status:** Done
**Phase:** 1 (MVP)
**Priority:** P0 (must)
**Dependencies:** F01

## Description

The room navigation engine allows the player to move between the 5 connected rooms of the crime scene. Each room displays a background scene, interactive clue objects, suspect characters, and doorways/exits to adjacent rooms. Navigation follows the room connection graph defined in the case data.

## Acceptance Criteria

- [x] Room state machine with current room tracking
- [x] Navigation validates target room is in connections array
- [x] Room state persists (visited rooms tracked)
- [x] Each room exposes its clue objects and suspect characters
- [x] All 5 Meridian Manor rooms navigable with correct connections
- [x] Pathfinding (BFS) between any two rooms
- [x] Room snapshot API (room + clues + suspects + connections)
- [x] Unit tests covering all navigation scenarios (46 tests)
- [ ] React rendering components (deferred to F13 -- Frontend UI)
- [ ] Transition animations (deferred to F13 -- Frontend UI)
- [ ] Visual clue highlighting (deferred to F13 -- Frontend UI)

## Technical Design

Room navigation is a state machine driven by the case data's `connections` array. The current room ID is stored in game state. When the player navigates:
1. Validates the target room exists in `currentRoom.connections`
2. Updates current room ID
3. Adds target room to visited set
4. Returns new room data

Room layout for Meridian Manor:
```
Garden <-> Kitchen <-> Lounge
Garden <-> Study <-> Bedroom
Kitchen <-> Study
Lounge <-> Bedroom
```

Each room has exactly 2 connections, forming a connected graph where any room is reachable from any other in at most 3 hops.

## Files Created

- `src/engines/room-engine.ts` -- RoomEngine class (state machine, navigation, pathfinding, snapshots)
- `src/engines/index.ts` -- Barrel export
- `src/engines/__tests__/room-engine.test.ts` -- 46 tests

## API

```typescript
class RoomEngine {
  constructor(caseData: ClientCaseData, startRoomId?: string)
  getCurrentRoom(): Room
  getCurrentRoomId(): string
  canNavigateTo(targetRoomId: string): boolean
  getConnectedRooms(): Room[]
  navigateTo(targetRoomId: string): Room       // throws NavigationError
  getVisitedRoomIds(): ReadonlySet<string>
  hasVisited(roomId: string): boolean
  getVisitedCount(): number
  getTotalRoomCount(): number
  hasVisitedAll(): boolean
  getCurrentClues(): Clue[]
  getCurrentSuspects(): Suspect[]
  getSnapshot(): RoomSnapshot
  getRoom(roomId: string): Room
  getAllRooms(): Room[]
  findPath(fromRoomId: string, toRoomId: string): string[] | null
}
```

## Resolved Questions

- **React components:** Deferred to F13 (Frontend UI). F02 is the engine layer only.
- **Transition animations:** Deferred to F13. The engine provides the state; rendering is separate.
- **Door positioning:** Will be handled by F13 based on connection data from the engine.
