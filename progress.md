# ZK Detective — Progress Log

## Session: 2026-02-08

### Documentation & Planning Setup

**Created:**
- `docs/game-plan.md` — Full game design document (15 sections)
- `docs/architecture/zk-architecture.md` — ZK layers, Noir circuits, category mapping
- `docs/architecture/technical-stack.md` — Stack overview, contract design, modular architecture
- `docs/architecture/data-model.md` — Case JSON schema, data structures, on-chain state
- `docs/case-content/meridian-manor.md` — Full case: setting, suspects, clues, solution path
- `docs/characters/detectives.md` — Kit Solano & Noor Vasari
- `docs/characters/suspects.md` — Nine suspect profiles with dialogue trees
- `docs/features/README.md` — Feature index with status tracker and dependency graph
- `docs/features/F01-F16` — 16 feature spec files with template structure
- `.claude/commands/feature.md` — `/feature` slash command for iterating features
- `task_plan.md` — Phase tracking
- `findings.md` — Research notes
- `progress.md` — This file

**Existing from zk-seek phase:**
- `contracts/zk-seek/` — Commit-reveal contract (27 tests passing, WASM builds)
- `contracts/{mock-game-hub,number-guess,twenty-one,dice-duel}/` — Reference contracts
- `zk-seek-frontend/` — Existing frontend
- Game Hub integration patterns established

### F01: Case Data System — DONE

**Created `zk-detective-frontend/`** — new frontend directory with data layer:

- `src/data/types.ts` — 7 TypeScript interfaces (CaseData, ClientCaseData, Room, Clue, Suspect, DialogueTree, Solution)
- `src/data/cases/meridian-manor.json` — Complete case: 5 rooms, 9 suspects, 11 clues, full dialogue trees, commitment hash
- `src/data/cases/meridian-manor.solution.json` — Solution + salt (build-time only, never shipped to client)
- `src/data/case-loader.ts` — Loader with structural validation (bidirectional connections, suspect/room/clue references)
- `src/data/commitment.ts` — keccak256 commitment generation/verification (matches on-chain pattern from zk-seek)
- `src/data/index.ts` — Barrel export
- `scripts/generate-commitment.ts` — Build script to inject commitment into case JSON
- **37 tests passing** (24 case-loader + 13 commitment)

**Design decisions:**
- Static import (no server API needed)
- Solution stripped from client JSON — only commitment hash shipped
- Two-type system: `CaseData` (full, build-time) vs `ClientCaseData` (stripped, client)
- Commitment: `keccak256(suspect + weapon + room + salt)` using `@noble/hashes`

### F06: ZK Accusation Circuit — DONE

**Noir toolchain installed** (nargo v1.0.0-beta.18) and full ZK pipeline built:

**Noir Circuits:**
- `circuits/accusation/` — Core accusation verification circuit
  - Pedersen hash (built-in, ~72 ACIR opcodes vs 150K for keccak256)
  - Public: commitment, accused_suspect/weapon/room
  - Private: solution_suspect/weapon/room, salt
  - Returns: bool (is accusation correct?)
  - **9 Noir tests passing**
- `circuits/compute_commitment/` — Helper circuit to compute pedersen commitments

**TypeScript (in `zk-detective-frontend/`):**
- `src/data/id-maps.ts` — Bidirectional string/numeric ID mapping (9 suspects, 5 weapons, 5 rooms)
- `src/services/zk-service.ts` — Noir.js wrapper for browser proof generation
- **16 TypeScript tests passing** (circuit execution + ID mapping)

**Proof Pipeline:**
- `nargo compile` → 62KB ACIR, 72 opcodes
- `nargo execute` → witness generated
- `bb prove` → 16KB proof in 17ms
- `bb verify` → proof verified
- Full pipeline validated via `scripts/test-proof.sh`

**Design decisions:**
- Pedersen hash (ZK-native, ~1K constraints, 2-5s in browser vs 30-60s for keccak256)
- Numeric ID mapping: suspect strings → Field elements (victor=1, elena=2, ...)
- On-chain UltraHonk verifier: pattern documented, deps not yet public. Deferred to F08.

**Total test count: 53 TS + 9 Noir = 62 tests passing**

### F02: Room Navigation — DONE

**Room state machine** built as pure engine layer (no React — rendering deferred to F13):

- `src/engines/room-engine.ts` — RoomEngine class: navigation, visited tracking, pathfinding, snapshots
- `src/engines/index.ts` — Barrel export
- `src/engines/__tests__/room-engine.test.ts` — **46 tests**

**API highlights:**
- `navigateTo(roomId)` — validates against connections graph, throws NavigationError if not adjacent
- `canNavigateTo(roomId)` — check before navigate
- `getSnapshot()` — room + clues + suspects + connected rooms in one call
- `findPath(from, to)` — BFS shortest path between any two rooms
- `hasVisitedAll()` — tracks exploration progress (visited count / total rooms)
- `getCurrentClues()` / `getCurrentSuspects()` — room content queries

**Design decisions:**
- Engine-only (no React) — clean separation of state from rendering
- Map-based room lookup for O(1) access
- BFS pathfinding for minimap/hint features later (F15)
- NavigationError custom error for typed catch handling

**Total test count: 99 TS + 9 Noir = 108 tests**

### F03: Inventory System — DONE

**Inventory engine** built as pure state manager (no React — UI deferred to F13):

- `src/engines/inventory-engine.ts` — InventoryEngine class: clue collection, queries, combo checking
- `src/engines/__tests__/inventory-engine.test.ts` — **35 tests**
- `src/engines/index.ts` — Updated barrel export

**API highlights:**
- `inspectClue(clue)` — idempotent collection, returns `InspectionResult { isNew, totalCollected }`
- `hasClueCombo("clue1+clue2")` — checks if all clues in a confrontation combo are collected
- `getSatisfiedCombos(keys)` — filters combo keys to only those the player can trigger
- `getCluesForSuspect(id)` — clues related to a specific suspect (for dialogue)
- `partitionRoomClues(clues)` — splits into inspected/uninspected (for visual states)
- `getKeyEvidence()` — filters to is_key_evidence clues only

**Design decisions:**
- Engine-only (no React) — same pattern as F02
- Idempotent inspection — duplicate clicks are no-ops with `isNew: false`
- Combo checking matches F04's confrontation key format ("clue1+clue2")
- Room-independent — inventory persists across room transitions by design

**Total test count: 134 TS + 9 Noir = 143 tests**

### F04: Dialogue Engine — DONE

**Dialogue resolution engine** — resolves suspect dialogue based on player inventory:

- `src/engines/dialogue-engine.ts` — DialogueEngine class: resolve, options, history
- `src/engines/__tests__/dialogue-engine.test.ts` — **37 tests**
- `src/engines/index.ts` — Updated barrel export

**API highlights:**
- `resolve(suspect)` — returns `DialogueResolution { currentDialogue, availableOptions, hasNewDialogue }`
- `getAvailableOptions(suspect)` — default + clue-triggered + confrontation options based on inventory
- `markSeen(suspectId, option)` / `hasUnseenDialogue(suspect)` — dialogue history tracking
- `getSuspectsWithConfrontations(suspects)` — find suspects with available unseen confrontations
- Priority: confrontation > clue_triggered > default

**Meridian Manor dialogue map:**
- 4 suspects with confrontation: Victor, Marcus, Thomas, James
- 5 suspects without: Elena, Isabelle, Priya, Celeste, Ren
- Victor's confession triggers with perfume_bottle + insurance_docs

**Design decisions:**
- Player chooses which clue to present (not auto-shown)
- All options remain available even after highest priority is determined
- Dialogue labels: "Show: [Clue Name]" for clue_triggered, "Confront: X + Y" for confrontation
- History tracked per suspect (seenDefault, seenClueTriggered set, seenConfrontations set)

**Total test count: 171 TS + 9 Noir = 180 tests**

### F05: Accusation System — DONE

**Accusation state machine** — manages the WHO/WHAT/WHERE accusation flow:

- `src/engines/accusation-engine.ts` — AccusationEngine class: selection, confirmation, submission, results
- `src/engines/__tests__/accusation-engine.test.ts` — **40 tests**
- `src/engines/index.ts` — Updated barrel export

**State machine:** `idle → selecting → confirming → submitting → resolved|idle`

**API highlights:**
- `beginAccusation()` / `cancelAccusation()` — open/close the flow
- `selectSuspect/Weapon/Room()` — validated selections from case data
- `confirm()` / `unconfirm()` — confirmation step before ZK proof
- `submit()` — returns Accusation for ZK proof generation
- `resolveResult('correct'|'incorrect')` — record result from ZK verification
- `getWrongAccusationCount()` / `wasAlreadyTried()` — penalty + duplicate tracking
- `getSuspectChoices()` / `getWeaponChoices()` / `getRoomChoices()` — dropdown data

**Design decisions:**
- Confirmation step before submission (player can go back and change)
- No hints on wrong accusations (preserves ZK design)
- No hard limit on attempts (penalty tracked, applied by F11)
- Duplicate detection so UI can warn player

**Total test count: 211 TS + 9 Noir = 220 tests**

### F08: Detective Contract — DONE

**Soroban smart contract** for ZK Detective game lifecycle:

- `contracts/zk-detective/Cargo.toml` — New contract crate (soroban-sdk v25.0.2)
- `contracts/zk-detective/src/lib.rs` — Full contract: constructor, case management, game sessions, accusations, scoring, leaderboard
- `contracts/zk-detective/src/test.rs` — **39 tests**
- `Cargo.toml` — Added `contracts/zk-detective` to workspace members

**Contract functions:**
- `__constructor(env, admin, game_hub)` — Game Hub integration pattern
- `create_case(case_id, commitment)` — Admin stores keccak256 commitment hash
- `start_game(session_id, p1, p2, p1_points, p2_points, case_id)` — Creates session, calls Game Hub
- `update_progress(session_id, player, clues, rooms)` — Tracks investigation metrics
- `accuse(session_id, player, suspect, weapon, room, salt)` — Verifies via hash recomputation
- `abandon_game(session_id)` — Admin ends stuck games
- `get_game/get_case/get_player_stats` — Query functions
- `set_admin/set_hub/upgrade` — Admin management

**Design decisions:**
- keccak256 hash verification (same as zk-seek) — UltraHonk ZK verifier deps not yet public for Soroban
- Per-session tracking (not per-player) for MVP — PvP deferred to F14
- Scoring on-chain: base 10000 - time_penalty - accusation_penalty + exploration_bonus
- 8 error codes: GameNotFound, CaseNotFound, NotPlayer, GameAlreadyEnded, GameNotActive, CaseAlreadyExists, InvalidAccusationId, SessionAlreadyExists
- GameStatus enum: Active | Solved | Abandoned
- Temporary storage with 30-day TTL for game state, persistent for cases + player stats

**Total test count: 211 TS + 9 Noir + 39 Rust = 259 tests**

### F10: Game Hub Integration — DONE

**No new code required** — F10 was fully implemented as part of F08 (Detective Contract).

The F08 contract already includes:
- Game Hub client trait (`#[contractclient(name = "GameHubClient")]`)
- `start_game()` calls `game_hub.start_game()` with correct parameters
- `accuse()` (correct) calls `game_hub.end_game()` with winner info
- Constructor stores Game Hub address in instance storage
- Both players `require_auth_for_args` with session_id + points
- Mock Game Hub in tests (39 tests)

The deploy scripts (`scripts/deploy.ts`, `scripts/build.ts`, `scripts/bindings.ts`) auto-discover workspace contracts from `Cargo.toml` — `zk-detective` was already added in F08. No script changes needed.

Deploy commands ready:
```
bun run build zk-detective
bun run deploy zk-detective
bun run bindings zk-detective
```

### F11: Scoring System — DONE

**Client-side scoring service** mirroring the on-chain formula from F08:

- `src/services/scoring-service.ts` — computeScore(), generateSummary(), ledgersToSeconds(), formatTime()
- `src/services/__tests__/scoring-service.test.ts` — **36 tests**
- `src/services/index.ts` — Barrel export

**Formula (matches F08 on-chain):**
- Base: 10000
- Time penalty: min(elapsed_ledgers, 5000)
- Accusation penalty: wrong_accusations × 500
- Exploration bonus: clues × 100 + rooms × 50
- Floor at 0

**Strategy archetypes tested:**
- Speedrunner (fast, few clues, some wrong) → 9780
- Thorough detective (slow, all clues, no wrong) → 10750
- Minimalist (moderate, few clues, no wrong) → 10250

**Design decisions:**
- Aligned with F08's exploration-based formula (not F11 spec's efficiency-based)
- On-chain formula is authoritative; client service is display-only preview
- 5 on-chain parity tests verify exact match with contract formula
- ScoreBreakdown React component deferred to F13

**Total test count: 247 TS + 9 Noir + 39 Rust = 295 tests**

### F07: ZK Clue Circuit — DONE

**Noir clue verification circuit** — the "honest game master" mechanic:

**Noir Circuit (`circuits/clue-verify/`):**
- `src/main.nr` — Clue verification circuit + **10 Noir tests**
- `Nargo.toml` — Noir project config
- Proves: (1) prover knows solution behind commitment, (2) clue response hash is valid, (3) response truthfully reflects whether clue's related_suspect is the guilty suspect
- Returns: `bool` (is this clue relevant to the solution?)
- 4 `should_fail` tests: lying about relevant clue, lying about irrelevant clue, invalid commitment, tampered response hash

**TypeScript (`zk-detective-frontend/`):**
- `src/data/clue-ids.ts` — Bidirectional clue string/numeric ID mapping (11 Meridian Manor clues)
- `src/services/clue-verify-service.ts` — ClueVerifyService (Noir.js wrapper) + `computeResponseValue()` + `computeAllResponseValues()`
- `src/services/__tests__/clue-verify-service.test.ts` — **32 TS tests**
- `scripts/generate-clue-hashes.ts` — Build script for pre-computing clue response hashes
- Updated barrel exports in `data/index.ts` and `services/index.ts`

**Response encoding:**
- `response_value = 1` if clue's `related_suspect` == guilty suspect (relevant)
- `response_value = 0` otherwise (different suspect or no link)
- `clue_response_hash = pedersen_hash([clue_numeric_id, response_value])`

**Design decisions:**
- Pre-committed response hashes (simple approach, not full case data in circuit)
- Separate ClueVerifyService (not merged into existing ZkService) for clean separation
- On-chain UltraHonk verification deferred (same as F06 — deps not public)
- Clue IDs are case-specific (Meridian Manor: 1-11)

**Total test count: 279 TS + 19 Noir + 39 Rust = 337 tests**

### F14: PvP WebSocket — DONE

**Real-time PvP multiplayer** — Bun WebSocket server + client integration:

**Server (`zk-detective-server/`):**
- `src/types.ts` — WebSocket protocol types (ClientMessage, ServerMessage, PlayerState, GameSession)
- `src/session.ts` — In-memory session lifecycle + token-based reconnection index
- `src/matchmaking.ts` — FIFO queue pairing (first two connected get matched)
- `src/handler.ts` — Message dispatch, accusation validation, score computation, game finish
- `src/timer.ts` — Per-session countdown with 10s sync broadcasts
- `src/index.ts` — Bun.serve entry point with WS upgrade, health endpoint, reconnection handling
- `package.json` / `tsconfig.json` — Zero runtime deps, bun-types devDep only

**Client (`zk-detective-frontend/`):**
- `src/services/multiplayer-types.ts` — Client copy of protocol types + ConnectionState
- `src/services/multiplayer-service.ts` — Singleton WS client with auto-reconnect (3 attempts / 30s)
- `src/store/game-store.ts` — Added gameMode, opponent, opponentFeed, pvpTimeRemaining, pvpResult, startPvp(), WS message handlers, PvP broadcasts on navigateToRoom/inspectClue/selectSuspect/submitAccusation
- `src/App.tsx` — Added matchmaking phase route
- `src/components/TitleScreen.tsx` — Solo/PvP mode buttons + inline name input
- `src/components/MatchmakingScreen.tsx` — Pulsing waiting screen with cancel
- `src/components/TopBar.tsx` — PvP countdown timer + opponent info (name, room, clues)
- `src/components/GameScreen.tsx` — Integrated OpponentFeed for PvP
- `src/components/OpponentFeed.tsx` — Live activity feed (last 5 opponent actions)
- `src/components/ResultScreen.tsx` — Victory/Defeat/Draw header + score comparison
- `src/components/BriefingScreen.tsx` — PvP banner "vs {opponent}" + countdown note

**Architecture:**
- Server validates accusations only (no game state replication)
- Information asymmetry via stripping (opponent sees THAT you acted, not WHAT)
- Timer authority on server, client does local countdown between 10s syncs
- 30s reconnection grace period via session tokens
- Score formula: base 10000 - min(elapsed/5, 5000) - wrong*500 + clues*100 + rooms*50

### F15: Minimap — DONE

**Floating minimap overlay** — upgraded from embedded ActionBar widget:

**Modified:**
- `src/components/MiniMap.tsx` — Complete rewrite as floating bottom-right overlay:
  - Larger 220x160 SVG viewBox (was 180x120 embedded)
  - Detective markers (magnifying glass icons) for player (gold) and opponent (crimson)
  - Pulsing animation on opponent marker
  - Smart offset when both detectives share a room
  - Collapse/expand toggle (X button to minimize, map icon to restore)
  - Dashed edge lines for room connections
  - PvP legend showing "You" and opponent name with colored dots
  - Backdrop blur for readability over scrolled content
- `src/components/GameScreen.tsx` — Renders MiniMap as floating overlay
- `src/components/ActionBar.tsx` — Removed embedded minimap, simplified layout

**All 8/8 acceptance criteria met:**
- Bottom-right floating overlay (fixed position, z-30)
- Pentagon room layout with connected nodes
- Detective icon on player's current room
- Opponent detective icon in PvP mode (real-time via F14 WebSocket)
- 3-letter room labels (BED, LOU, STU, KIT, GAR)
- Unobtrusive: collapsible, semi-transparent backdrop
- Works in solo (no opponent marker) and PvP (both markers + legend)

### F16: Detective Characters — DONE

**Character selection screen** — choose Kit Solano or Noor Vasari before investigation:

**Created:**
- `src/data/detectives.ts` — Detective type definitions, Kit (gold, coffee cup) + Noor (teal, magnifying glass)
- `src/components/CharacterSelect.tsx` — Full-screen character cards with back button

**Modified:**
- `src/store/game-store.ts` — `selectedDetective`, `opponentDetective` state; `selectDetective()` action; `character-select` phase
- `src/App.tsx` — Added CharacterSelect route for new phase
- `src/components/BriefingScreen.tsx` — Detective identity pill (emoji + name + color)
- `src/components/TopBar.tsx` — Detective emoji next to case title
- `src/components/MiniMap.tsx` — Markers use detective-specific colors, legend shows detective names
- `zk-detective-server/src/types.ts` — `detective` field on PlayerState, join, matched messages
- `zk-detective-server/src/session.ts` — Passes detective through session creation
- `zk-detective-server/src/matchmaking.ts` — Passes detective through queue and match notifications
- `zk-detective-server/src/index.ts` — Passes detective from join message to matchmaking
- `src/services/multiplayer-types.ts` — `detective` on join, `opponentDetective` on matched
- `src/services/multiplayer-service.ts` — `connect()` accepts detective parameter

**All 8/8 acceptance criteria met:**
- Character select screen appears after title, before briefing/matchmaking
- Two detective cards with emoji avatar, name, style, description, tagline
- Kit Solano: gold theme, coffee cup emoji, streetwise tagline
- Noor Vasari: teal theme, magnifying glass emoji, analytical tagline
- Detective emoji shown in TopBar and BriefingScreen during gameplay
- Minimap markers use detective-specific colors
- PvP: detective choice transmitted via WebSocket, opponent detective shown in minimap legend
- Purely cosmetic — no mechanical differences

### All 16 Features Complete

All features F01-F16 are now implemented. The ZK Detective game is feature-complete.
