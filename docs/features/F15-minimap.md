# F15: Minimap

**Status:** Done
**Phase:** 2 (PvP)
**Priority:** P2 (nice)
**Dependencies:** F14

## Description

A small map in the bottom-right of the game screen showing the room layout. In PvP mode, both the player's and opponent's positions are shown as detective icons that update in real-time. This mirrors a real scenario where two detectives on the same crime scene can see each other moving around.

## Acceptance Criteria

- [x] Minimap renders in bottom-right corner of game screen
- [x] Shows all 5 rooms as connected nodes matching the room layout
- [x] Player's current room highlighted with their detective icon
- [x] In PvP: opponent's position shown with their detective icon
- [x] Position updates in real-time via WebSocket
- [x] Rooms labeled with abbreviations or icons
- [x] Minimap is unobtrusive but always visible
- [x] Works in both single-player (no opponent) and PvP modes

## Implementation Notes

### Architecture Decisions
- **SVG** for rendering (resolution-independent, lightweight, no Canvas overhead)
- **Clickable rooms** — connected rooms are clickable for navigation
- **Fixed 180px width** — floating overlay with collapse/expand toggle
- **Detective markers** — magnifying-glass icon markers (gold for player, crimson for opponent)
- **Collapsible** — X button collapses to a small map icon; click to expand

### Layout
Pentagon layout matching the Meridian Manor room graph:
- Bedroom at top center
- Lounge at left, Study at right
- Kitchen bottom-left, Garden bottom-right
- Dashed connection lines between adjacent rooms

### PvP Integration
Reads `opponent.currentRoom` from the game store, which is updated via `opponent_moved` WebSocket events (F14). When both detectives are in the same room, their markers offset to avoid overlap.

### Files Modified
- `src/components/MiniMap.tsx` — Upgraded to floating overlay with detective markers, collapse toggle, PvP legend
- `src/components/GameScreen.tsx` — Renders MiniMap as floating overlay (above ActionBar)
- `src/components/ActionBar.tsx` — Removed embedded minimap, simplified to Suspects/Evidence + Accuse layout
