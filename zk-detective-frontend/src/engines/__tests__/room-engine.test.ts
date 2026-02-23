// F02: Room Navigation — Tests
import { describe, it, expect, beforeEach } from 'vitest';
import { RoomEngine, NavigationError } from '../room-engine';
import type { ClientCaseData } from '../../data/types';
import caseJson from '../../data/cases/meridian-manor.json';

const caseData = caseJson as unknown as ClientCaseData;

// Room connection map for Meridian Manor:
//   bedroom <-> lounge <-> kitchen <-> garden <-> study <-> bedroom
//   (plus: lounge-bedroom, kitchen-lounge, study-garden already listed)
// Exact connections:
//   bedroom: [lounge, study]
//   kitchen: [lounge, garden]
//   study:   [bedroom, garden]
//   lounge:  [bedroom, kitchen]
//   garden:  [kitchen, study]

describe('RoomEngine', () => {
  let engine: RoomEngine;

  beforeEach(() => {
    engine = new RoomEngine(caseData);
  });

  // --- Initialization ---

  describe('initialization', () => {
    it('starts in the first room by default', () => {
      expect(engine.getCurrentRoomId()).toBe('bedroom');
      expect(engine.getCurrentRoom().name).toBe('The Bedroom');
    });

    it('can start in a specified room', () => {
      const eng = new RoomEngine(caseData, 'kitchen');
      expect(eng.getCurrentRoomId()).toBe('kitchen');
      expect(eng.getCurrentRoom().name).toBe('The Kitchen');
    });

    it('marks the starting room as visited', () => {
      expect(engine.hasVisited('bedroom')).toBe(true);
      expect(engine.getVisitedCount()).toBe(1);
    });

    it('throws on invalid start room', () => {
      expect(() => new RoomEngine(caseData, 'nonexistent')).toThrow(NavigationError);
      expect(() => new RoomEngine(caseData, 'nonexistent')).toThrow(/nonexistent/);
    });

    it('throws on empty case data', () => {
      const empty = { ...caseData, rooms: [] } as ClientCaseData;
      expect(() => new RoomEngine(empty)).toThrow(NavigationError);
    });
  });

  // --- Navigation ---

  describe('navigation', () => {
    it('can navigate to a connected room', () => {
      // bedroom -> lounge
      const room = engine.navigateTo('lounge');
      expect(room.id).toBe('lounge');
      expect(engine.getCurrentRoomId()).toBe('lounge');
    });

    it('rejects navigation to non-adjacent rooms', () => {
      // bedroom -> kitchen is not direct
      expect(() => engine.navigateTo('kitchen')).toThrow(NavigationError);
      expect(() => engine.navigateTo('kitchen')).toThrow(/Cannot navigate/);
      expect(engine.getCurrentRoomId()).toBe('bedroom'); // unchanged
    });

    it('rejects navigation to unknown rooms', () => {
      expect(() => engine.navigateTo('dungeon')).toThrow(NavigationError);
      expect(() => engine.navigateTo('dungeon')).toThrow(/does not exist/);
    });

    it('allows navigating to the current room (no-op)', () => {
      const room = engine.navigateTo('bedroom');
      expect(room.id).toBe('bedroom');
      expect(engine.getCurrentRoomId()).toBe('bedroom');
    });

    it('supports multi-step navigation', () => {
      // bedroom -> lounge -> kitchen -> garden -> study -> bedroom
      engine.navigateTo('lounge');
      expect(engine.getCurrentRoomId()).toBe('lounge');

      engine.navigateTo('kitchen');
      expect(engine.getCurrentRoomId()).toBe('kitchen');

      engine.navigateTo('garden');
      expect(engine.getCurrentRoomId()).toBe('garden');

      engine.navigateTo('study');
      expect(engine.getCurrentRoomId()).toBe('study');

      engine.navigateTo('bedroom');
      expect(engine.getCurrentRoomId()).toBe('bedroom');
    });

    it('can backtrack to previous room', () => {
      engine.navigateTo('lounge');
      engine.navigateTo('bedroom');
      expect(engine.getCurrentRoomId()).toBe('bedroom');
    });
  });

  // --- canNavigateTo ---

  describe('canNavigateTo', () => {
    it('returns true for connected rooms', () => {
      // bedroom connects to lounge and study
      expect(engine.canNavigateTo('lounge')).toBe(true);
      expect(engine.canNavigateTo('study')).toBe(true);
    });

    it('returns false for non-adjacent rooms', () => {
      expect(engine.canNavigateTo('kitchen')).toBe(false);
      expect(engine.canNavigateTo('garden')).toBe(false);
    });

    it('returns false for unknown rooms', () => {
      expect(engine.canNavigateTo('dungeon')).toBe(false);
    });

    it('returns false for current room', () => {
      expect(engine.canNavigateTo('bedroom')).toBe(false);
    });
  });

  // --- Connected Rooms ---

  describe('getConnectedRooms', () => {
    it('returns full Room objects for connected rooms', () => {
      const connected = engine.getConnectedRooms();
      const ids = connected.map(r => r.id).sort();
      expect(ids).toEqual(['lounge', 'study']);
    });

    it('updates after navigation', () => {
      engine.navigateTo('lounge');
      const connected = engine.getConnectedRooms();
      const ids = connected.map(r => r.id).sort();
      expect(ids).toEqual(['bedroom', 'kitchen']);
    });
  });

  // --- Visited Room Tracking ---

  describe('visited rooms', () => {
    it('tracks rooms as they are visited', () => {
      engine.navigateTo('lounge');
      engine.navigateTo('kitchen');

      expect(engine.hasVisited('bedroom')).toBe(true);
      expect(engine.hasVisited('lounge')).toBe(true);
      expect(engine.hasVisited('kitchen')).toBe(true);
      expect(engine.hasVisited('garden')).toBe(false);
      expect(engine.hasVisited('study')).toBe(false);
    });

    it('does not double-count revisited rooms', () => {
      engine.navigateTo('lounge');
      engine.navigateTo('bedroom');
      engine.navigateTo('lounge');
      expect(engine.getVisitedCount()).toBe(2);
    });

    it('returns visited room IDs as a set', () => {
      engine.navigateTo('lounge');
      const visited = engine.getVisitedRoomIds();
      expect(visited.has('bedroom')).toBe(true);
      expect(visited.has('lounge')).toBe(true);
      expect(visited.size).toBe(2);
    });

    it('detects when all rooms visited', () => {
      expect(engine.hasVisitedAll()).toBe(false);

      // Visit all 5 rooms: bedroom -> lounge -> kitchen -> garden -> study
      engine.navigateTo('lounge');
      engine.navigateTo('kitchen');
      engine.navigateTo('garden');
      engine.navigateTo('study');

      expect(engine.hasVisitedAll()).toBe(true);
      expect(engine.getVisitedCount()).toBe(5);
    });

    it('returns correct total room count', () => {
      expect(engine.getTotalRoomCount()).toBe(5);
    });
  });

  // --- Room Content ---

  describe('room content', () => {
    it('returns clues for current room', () => {
      // bedroom has: perfume_bottle, smudged_fingerprints, torn_letter
      const clues = engine.getCurrentClues();
      expect(clues).toHaveLength(3);
      const ids = clues.map(c => c.id).sort();
      expect(ids).toEqual(['perfume_bottle', 'smudged_fingerprints', 'torn_letter']);
    });

    it('returns suspects for current room', () => {
      // bedroom has: isabelle
      const suspects = engine.getCurrentSuspects();
      expect(suspects).toHaveLength(1);
      expect(suspects[0].id).toBe('isabelle');
      expect(suspects[0].name).toBe('Isabelle Fontaine');
    });

    it('updates content after navigation', () => {
      engine.navigateTo('study');
      // study has: insurance_docs, crumpled_note
      const clues = engine.getCurrentClues();
      expect(clues).toHaveLength(2);
      expect(clues.map(c => c.id).sort()).toEqual(['crumpled_note', 'insurance_docs']);

      // study has: victor, james
      const suspects = engine.getCurrentSuspects();
      expect(suspects).toHaveLength(2);
      expect(suspects.map(s => s.id).sort()).toEqual(['james', 'victor']);
    });
  });

  // --- Snapshot ---

  describe('getSnapshot', () => {
    it('returns a complete snapshot of the current room', () => {
      const snap = engine.getSnapshot();
      expect(snap.room.id).toBe('bedroom');
      expect(snap.clues).toHaveLength(3);
      expect(snap.suspects).toHaveLength(1);
      expect(snap.connections).toHaveLength(2);
      expect(snap.connections.map(r => r.id).sort()).toEqual(['lounge', 'study']);
    });

    it('snapshot updates after navigation', () => {
      engine.navigateTo('lounge');
      const snap = engine.getSnapshot();
      expect(snap.room.id).toBe('lounge');
      expect(snap.clues).toHaveLength(2);
      expect(snap.suspects).toHaveLength(2);
      expect(snap.suspects.map(s => s.id).sort()).toEqual(['celeste', 'marcus']);
    });
  });

  // --- Room Lookup ---

  describe('room lookup', () => {
    it('can get any room by ID', () => {
      const garden = engine.getRoom('garden');
      expect(garden.name).toBe('The Garden');
    });

    it('throws for unknown room', () => {
      expect(() => engine.getRoom('dungeon')).toThrow(/not found/);
    });

    it('returns all rooms', () => {
      const all = engine.getAllRooms();
      expect(all).toHaveLength(5);
    });
  });

  // --- Pathfinding ---

  describe('findPath', () => {
    it('finds direct path between adjacent rooms', () => {
      const path = engine.findPath('bedroom', 'lounge');
      expect(path).toEqual(['bedroom', 'lounge']);
    });

    it('finds path to same room', () => {
      const path = engine.findPath('bedroom', 'bedroom');
      expect(path).toEqual(['bedroom']);
    });

    it('finds shortest path between non-adjacent rooms', () => {
      // bedroom -> kitchen requires: bedroom -> lounge -> kitchen
      const path = engine.findPath('bedroom', 'kitchen');
      expect(path).toEqual(['bedroom', 'lounge', 'kitchen']);
    });

    it('finds shortest path across the map', () => {
      // bedroom -> garden: bedroom -> study -> garden (2 hops)
      const path = engine.findPath('bedroom', 'garden');
      expect(path).toHaveLength(3);
      // Could be bedroom->study->garden or bedroom->lounge->kitchen->garden
      // BFS finds shortest, which is 3 nodes (2 hops)
      expect(path![0]).toBe('bedroom');
      expect(path![path!.length - 1]).toBe('garden');
    });

    it('returns null for unknown rooms', () => {
      expect(engine.findPath('bedroom', 'dungeon')).toBeNull();
      expect(engine.findPath('dungeon', 'bedroom')).toBeNull();
    });
  });

  // --- Meridian Manor Full Connection Verification ---

  describe('Meridian Manor connections', () => {
    it('bedroom connects to lounge and study', () => {
      const eng = new RoomEngine(caseData, 'bedroom');
      expect(eng.getConnectedRooms().map(r => r.id).sort()).toEqual(['lounge', 'study']);
    });

    it('kitchen connects to lounge and garden', () => {
      const eng = new RoomEngine(caseData, 'kitchen');
      expect(eng.getConnectedRooms().map(r => r.id).sort()).toEqual(['garden', 'lounge']);
    });

    it('study connects to bedroom and garden', () => {
      const eng = new RoomEngine(caseData, 'study');
      expect(eng.getConnectedRooms().map(r => r.id).sort()).toEqual(['bedroom', 'garden']);
    });

    it('lounge connects to bedroom and kitchen', () => {
      const eng = new RoomEngine(caseData, 'lounge');
      expect(eng.getConnectedRooms().map(r => r.id).sort()).toEqual(['bedroom', 'kitchen']);
    });

    it('garden connects to kitchen and study', () => {
      const eng = new RoomEngine(caseData, 'garden');
      expect(eng.getConnectedRooms().map(r => r.id).sort()).toEqual(['kitchen', 'study']);
    });

    it('all rooms are reachable from any starting room', () => {
      for (const startRoom of caseData.rooms) {
        for (const targetRoom of caseData.rooms) {
          const eng = new RoomEngine(caseData, startRoom.id);
          const path = eng.findPath(startRoom.id, targetRoom.id);
          expect(path).not.toBeNull();
          expect(path!.length).toBeGreaterThanOrEqual(1);
          expect(path!.length).toBeLessThanOrEqual(4); // max 3 hops in this map
        }
      }
    });

    it('every room has exactly 2 connections', () => {
      for (const room of caseData.rooms) {
        expect(room.connections).toHaveLength(2);
      }
    });

    it('all connections are bidirectional', () => {
      for (const room of caseData.rooms) {
        for (const connId of room.connections) {
          const target = caseData.rooms.find(r => r.id === connId)!;
          expect(target.connections).toContain(room.id);
        }
      }
    });
  });

  // --- Suspect/Clue Distribution ---

  describe('room content distribution', () => {
    it('all 9 suspects are placed in rooms', () => {
      const allSuspectIds = new Set<string>();
      for (const room of caseData.rooms) {
        for (const id of room.suspects_present) {
          allSuspectIds.add(id);
        }
      }
      expect(allSuspectIds.size).toBe(9);
    });

    it('all 11 clues are distributed across rooms', () => {
      const allClueIds = caseData.rooms.flatMap(r => r.clues.map(c => c.id));
      expect(allClueIds).toHaveLength(11);
      expect(new Set(allClueIds).size).toBe(11); // all unique
    });

    it('each room has at least 1 suspect and 2 clues', () => {
      for (const room of caseData.rooms) {
        expect(room.suspects_present.length).toBeGreaterThanOrEqual(1);
        expect(room.clues.length).toBeGreaterThanOrEqual(2);
      }
    });
  });
});
