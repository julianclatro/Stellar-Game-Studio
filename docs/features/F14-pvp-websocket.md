# F14: PvP WebSocket

**Status:** Done
**Phase:** 2 (PvP)
**Priority:** P1 (should)
**Dependencies:** F12

## Description

Real-time Player vs Player mode via WebSockets. Two detectives investigate the same crime scene simultaneously, racing to make the correct accusation first. The WebSocket server coordinates room state sync, timer management, and opponent position — broadcasting THAT actions happened without revealing WHAT was done (except room movement).

## Acceptance Criteria

- [ ] WebSocket server handles matchmaking (find opponent)
- [ ] Two players connected to the same game session
- [ ] Both players investigate the same case simultaneously
- [ ] Room movement broadcasts opponent's current room
- [ ] Clue inspections broadcast "opponent inspected" (no detail)
- [ ] Interrogations broadcast "opponent interrogated" (no detail)
- [ ] Accusations broadcast result (correct/wrong) but not the guess
- [ ] Match timer with total time limit
- [ ] First correct accusation wins
- [ ] Game over broadcast when someone solves or timer expires
- [ ] Opponent disconnect handling (timeout → other player wins)

## Technical Design

### WebSocket Events

```
// Client → Server
{ type: "move", room: "kitchen" }
{ type: "inspect", clue: "perfume_bottle" }
{ type: "interrogate", suspect: "victor", show_clue: "insurance_docs" }
{ type: "accuse", suspect: "victor", weapon: "poison_vial", room: "bedroom" }

// Server → Client
{ type: "opponent_moved", room: "lounge" }
{ type: "opponent_inspected" }              // No detail
{ type: "opponent_interrogated" }           // No detail
{ type: "opponent_accused", correct: false }
{ type: "game_over", winner: "player1", score: 850 }
{ type: "timer_update", remaining: 180 }
```

### Information Asymmetry

Key design decision: The opponent sees THAT you did something, but not WHAT (except room movement). This creates information asymmetry without needing ZK Layer 2. The WebSocket server simply doesn't broadcast details — only event types.

### Server Architecture

Simple Node.js/Bun WebSocket server:
- Room-based sessions (two players per room)
- Timer management (countdown per match)
- Event routing (filter details before broadcasting)
- State tracking (which player is in which room)

## Files to Create/Modify

- `server/websocket.ts` — WebSocket server
- `server/matchmaking.ts` — Player matching logic
- `server/session.ts` — Game session management
- `src/services/websocket-service.ts` — Client-side WebSocket handler
- `src/hooks/useMultiplayer.ts` — React hook for PvP state

## Open Questions

- WebSocket library: ws, Socket.IO, or Bun native WebSocket?
- Matchmaking: simple queue or ELO-based?
- How to handle reconnection mid-game?
- Should the server validate moves (anti-cheat) or trust the client?
