# F13: Frontend UI

**Status:** Not Started
**Phase:** 1 (MVP)
**Priority:** P0 (must)
**Dependencies:** F02, F03, F04, F05

## Description

The visual frontend that brings the detective game to life. Anime-inspired art style with stylized crime scene backgrounds, layered character sprites, and interactive clue objects that "pop" from the background. The UI combines room scenes, inventory, dialogue panels, and the accusation flow into a cohesive game experience.

## Acceptance Criteria

- [ ] Dark, moody color palette with high-contrast interactive elements
- [ ] Room backgrounds rendered as scene illustrations
- [ ] Characters layered on backgrounds (left/right positioning)
- [ ] Inspectable objects have distinct visual contrast (glow/outline/saturation)
- [ ] Hover states show cursor change + subtle highlight on interactive elements
- [ ] Dialogue panel at bottom of screen for suspect interactions
- [ ] Timer display in top bar
- [ ] Inventory sidebar or panel with clue icons
- [ ] ACCUSE button prominently visible
- [ ] Screen layout matches the design spec (room scene center, suspects L/R, inventory bottom-left, minimap bottom-right)
- [ ] Responsive design (desktop priority, mobile consideration)
- [ ] Transition animations between rooms (slide or fade)
- [ ] Object inspection animation (glow, zoom, or lift)
- [ ] Character interaction animation (bounce or expression change)

## Technical Design

### Screen Layout

```
┌──────────────────────────────────────────────────────┐
│  [Timer: 04:32]              [Opponent: Room 3] (PvP)│
├──────────────────────────────────────────────────────┤
│                                                      │
│              ┌────────────────────┐                   │
│              │                    │                   │
│              │   ROOM SCENE       │                   │
│   ┌──────┐   │   (Background)     │   ┌──────┐       │
│   │Suspect│  │                    │   │Suspect│       │
│   │  (L)  │  │  [Clue] [Clue]    │   │  (R)  │       │
│   └──────┘   │       [Clue]      │   └──────┘       │
│              │                    │                   │
│              └────────────────────┘                   │
│                                                      │
│  ◀ Door Left          ▲ Door Up       Door Right ▶   │
│                                                      │
├──────────────────────────────────────────────────────┤
│  💬 "I was in the kitchen all evening."              │
│                                                      │
├──────────────┬──────────────────────┬────────────────┤
│  INVENTORY   │                      │   MINIMAP      │
│  🔍 Knife    │   [ACCUSE BUTTON]    │   ┌─┬─┐       │
│  🔍 Letter   │                      │   ├─┼─┤       │
│  🔍 Photos   │                      │   └─┴─┘       │
└──────────────┴──────────────────────┴────────────────┘
```

### Art Direction

- Anime-inspired character art with stylized crime scene backgrounds
- Characters appear in Pokémon battle style — sliding in from left/right
- Interactive elements use the classic adventure game convention: brighter, distinct from background
- Color palette: dark, moody backgrounds with high-contrast interactive elements

### Technology

- React/TypeScript (from Game Studio template)
- CSS animations or Framer Motion for transitions
- SVG or Canvas for room scenes (or layered PNG backgrounds)
- Sprite sheets for character animations

## Files to Create/Modify

- `src/styles/theme.ts` — Color palette, typography, spacing
- `src/components/GameLayout.tsx` — Main game screen layout
- `src/components/TopBar.tsx` — Timer, opponent info
- `src/components/BottomBar.tsx` — Dialogue + inventory + minimap
- `src/assets/rooms/` — Room background images
- `src/assets/characters/` — Character sprite images
- `src/assets/clues/` — Clue icon images

## Open Questions

- What art tools/pipeline for room backgrounds and character sprites?
- Canvas vs. DOM for room rendering — performance vs. ease of development?
- Should we use a game framework (Phaser, PixiJS) or vanilla React?
- Animation library: CSS transitions, Framer Motion, or GSAP?
