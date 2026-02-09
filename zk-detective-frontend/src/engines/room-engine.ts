// F02: Room Navigation — Room Engine
// State machine for navigating between connected rooms in a case.

import type { ClientCaseData, Room, Clue, Suspect } from '../data/types';
import { getRoom, getSuspect } from '../data/case-loader';

export class NavigationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NavigationError';
  }
}

export interface RoomSnapshot {
  room: Room;
  clues: Clue[];
  suspects: Suspect[];
  connections: Room[];
}

export class RoomEngine {
  private caseData: ClientCaseData;
  private currentRoomId: string;
  private visitedRoomIds: Set<string>;
  private roomLookup: Map<string, Room>;

  constructor(caseData: ClientCaseData, startRoomId?: string) {
    this.caseData = caseData;
    this.roomLookup = new Map(caseData.rooms.map(r => [r.id, r]));

    const startId = startRoomId ?? caseData.rooms[0]?.id;
    if (!startId || !this.roomLookup.has(startId)) {
      throw new NavigationError(
        `Invalid start room "${startId ?? '(none)'}". Available: ${[...this.roomLookup.keys()].join(', ')}`
      );
    }

    this.currentRoomId = startId;
    this.visitedRoomIds = new Set([startId]);
  }

  /** Get the current room */
  getCurrentRoom(): Room {
    return this.roomLookup.get(this.currentRoomId)!;
  }

  /** Get the current room ID */
  getCurrentRoomId(): string {
    return this.currentRoomId;
  }

  /** Check if a room is directly reachable from the current room */
  canNavigateTo(targetRoomId: string): boolean {
    return this.getCurrentRoom().connections.includes(targetRoomId);
  }

  /** Get all rooms connected to the current room */
  getConnectedRooms(): Room[] {
    return this.getCurrentRoom().connections.map(id => this.roomLookup.get(id)!);
  }

  /** Navigate to a connected room. Throws NavigationError if not adjacent. */
  navigateTo(targetRoomId: string): Room {
    if (!this.roomLookup.has(targetRoomId)) {
      throw new NavigationError(`Room "${targetRoomId}" does not exist`);
    }

    if (targetRoomId === this.currentRoomId) {
      return this.getCurrentRoom();
    }

    if (!this.canNavigateTo(targetRoomId)) {
      const current = this.getCurrentRoom();
      throw new NavigationError(
        `Cannot navigate from "${current.id}" to "${targetRoomId}". ` +
        `Connected rooms: ${current.connections.join(', ')}`
      );
    }

    this.currentRoomId = targetRoomId;
    this.visitedRoomIds.add(targetRoomId);
    return this.getCurrentRoom();
  }

  /** Get the set of visited room IDs */
  getVisitedRoomIds(): ReadonlySet<string> {
    return this.visitedRoomIds;
  }

  /** Check if a specific room has been visited */
  hasVisited(roomId: string): boolean {
    return this.visitedRoomIds.has(roomId);
  }

  /** Get the count of visited rooms */
  getVisitedCount(): number {
    return this.visitedRoomIds.size;
  }

  /** Get the total number of rooms in the case */
  getTotalRoomCount(): number {
    return this.caseData.rooms.length;
  }

  /** Check if all rooms have been visited */
  hasVisitedAll(): boolean {
    return this.visitedRoomIds.size === this.caseData.rooms.length;
  }

  /** Get clues in the current room */
  getCurrentClues(): Clue[] {
    return this.getCurrentRoom().clues;
  }

  /** Get suspects present in the current room (full Suspect objects) */
  getCurrentSuspects(): Suspect[] {
    return this.getCurrentRoom().suspects_present.map(id =>
      getSuspect(this.caseData, id)
    );
  }

  /** Get a full snapshot of the current room (room + clues + suspects + connections) */
  getSnapshot(): RoomSnapshot {
    return {
      room: this.getCurrentRoom(),
      clues: this.getCurrentClues(),
      suspects: this.getCurrentSuspects(),
      connections: this.getConnectedRooms(),
    };
  }

  /** Get a room by ID (any room, not just current) */
  getRoom(roomId: string): Room {
    return getRoom(this.caseData, roomId);
  }

  /** Get all rooms in the case */
  getAllRooms(): Room[] {
    return this.caseData.rooms;
  }

  /** Find the shortest path between two rooms (BFS). Returns room IDs including start and end. */
  findPath(fromRoomId: string, toRoomId: string): string[] | null {
    if (!this.roomLookup.has(fromRoomId) || !this.roomLookup.has(toRoomId)) {
      return null;
    }
    if (fromRoomId === toRoomId) return [fromRoomId];

    const visited = new Set<string>([fromRoomId]);
    const queue: string[][] = [[fromRoomId]];

    while (queue.length > 0) {
      const path = queue.shift()!;
      const current = path[path.length - 1];
      const room = this.roomLookup.get(current)!;

      for (const neighbor of room.connections) {
        if (neighbor === toRoomId) {
          return [...path, neighbor];
        }
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }

    return null; // unreachable (shouldn't happen with valid case data)
  }
}
