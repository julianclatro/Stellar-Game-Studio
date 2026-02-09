# ZK Detective: Case Closed on Soroban

## Game Plan & Architecture Document

---

## 1. Vision

Two detectives. One crime scene. A race to solve the case.

**ZK Detective** is a competitive deduction game built on Soroban where players investigate a crime scene, gather clues, interrogate suspects, and race to make the correct accusation — all verified by zero-knowledge proofs. The game draws inspiration from *Case Closed (Detective Conan)* and classic board games like *Clue*, reimagined for the blockchain era where **nobody needs to trust the game master**.

The core innovation: ZK proofs replace the trusted admin entirely. The solution is committed on-chain at game start, and every clue response is proven consistent with that commitment. The game master literally cannot lie.

---

## 2. Game Modes

### 2.1 Single Player (Hackathon Priority)
- Player investigates a pre-written case against the clock
- Score is calculated from time taken + clues inspected (hidden formula)
- Results posted to a **ranked leaderboard** on-chain
- All players solve the same case, compete on efficiency and speed

### 2.2 Player vs Player (Target Feature)
- Two detectives investigate the same crime scene simultaneously
- Real-time via WebSockets
- Minimap shows opponent's current room location (both detectives are "on the scene" — you can see your counterpart)
- Timer creates urgency — match has a total time limit
- First correct accusation wins
- Wrong accusation penalizes score but doesn't eliminate (player can continue investigating)

---

## 3. The ZK Architecture

### 3.1 Layer 1: Honest Game Master (Core — Must Build)

This is the essential ZK mechanic for the hackathon.

**Commit Phase:**
At case creation, the admin commits the solution on-chain:
```
commitment = hash(suspect_id, weapon_id, room_id, salt)
```
This commitment is stored in the Soroban contract. Nobody can see the solution, but it's locked.

**Investigate Phase:**
When a player inspects a clue or interrogates a suspect, the game responds with information AND a ZK proof:
- "I know a solution (suspect, weapon, room, salt) such that hash(...) matches the on-chain commitment, AND the clue I'm giving you is consistent with that solution."

The Soroban contract verifies the proof. The player trusts the response without anyone revealing the solution. The game master cannot lie — an incorrect clue would produce an invalid proof.

**Accuse Phase:**
Player selects: **WHO** (suspect) + **WHAT** (weapon) + **WHERE** (room).
The contract hashes the accusation and verifies it against the commitment via ZK proof.

### 3.2 Layer 2: Hidden Investigation (Future — Noted in Submission)

In PvP, if Player 2 can see Player 1's queries, they gain free information. Layer 2 uses ZK to hide *what* you investigated while proving the response is valid. This is noted as future work — it's significantly more complex but demonstrates the team understands the design space.

### 3.3 ZK Framework: Noir

- Noir circuits compiled to generate proofs client-side (browser)
- Proof verification happens on-chain in the Soroban contract
- Noir is Rust-like, aligning with Soroban's Rust ecosystem
- Circuit complexity is manageable: hash verification + attribute lookups

### 3.4 How It Maps to the Existing Architecture

| Current (zk-seek / Where's Waldo) | ZK Detective Equivalent |
|---|---|
| Scene with committed target coordinates | Case with committed solution (suspect, weapon, room) |
| Player commits guess coordinates | Player makes investigation choices |
| Admin resolves (reveals target) | **Replaced by ZK proof — no reveal needed** |
| Distance calculation on-chain | Clue consistency verified via ZK proof |

The key upgrade: **ZK proofs eliminate the admin resolve step entirely.** The game is trustless from start to finish.

---

## 4. Game Flow

### 4.1 Full Player Journey

```
┌─────────────────────────────────────────────────┐
│                   LOBBY                         │
│  Select mode: Single Player / Find Match (PvP)  │
│  Choose detective character (cosmetic only)      │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│                CASE BRIEFING                    │
│  Narrative intro — what happened, where, when   │
│  Timer starts (PvP) or begins counting (Solo)   │
│  Solution commitment verified on-chain          │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              INVESTIGATION PHASE                │
│                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │ Room 1  │──│ Room 2  │──│ Room 3  │         │
│  └────┬────┘  └────┬────┘  └────┬────┘         │
│       │            │            │               │
│  ┌────┴────┐  ┌────┴────┐                       │
│  │ Room 4  │──│ Room 5  │                       │
│  └─────────┘  └─────────┘                       │
│                                                 │
│  Each room: 2-3 inspectable objects + suspects  │
│  Click object → added to inventory + info       │
│  Click suspect → dialogue (evolves with clues)  │
│  ZK proof verifies every clue response          │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              ACCUSATION PHASE                   │
│  Available at any time during investigation     │
│                                                 │
│  Select WHO:   [Dropdown: 9 suspects]           │
│  Select WHAT:  [Dropdown: weapons from inventory│
│  Select WHERE: [Dropdown: 5 rooms]              │
│                                                 │
│  Submit → ZK proof verifies against commitment  │
│  Correct → WIN (case solved!)                   │
│  Wrong → Penalty (score hit, continue playing)  │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│                 RESOLUTION                      │
│  Reveal the full story — narrative conclusion   │
│  Show score breakdown                           │
│  Update leaderboard on-chain                    │
│  PvP: declare winner, settle any stakes         │
└─────────────────────────────────────────────────┘
```

### 4.2 Room Navigation

The crime scene has **5 rooms** connected as a navigable map. The player sees doorways/exits to adjacent rooms and clicks to move between them.

**Example layout for the first case:**

```
        ┌──────────┐
        │  Garden  │ (Outdoor — accessible from Kitchen & Study)
        └────┬─┬───┘
             │ │
    ┌────────┘ └────────┐
    │                    │
┌───┴──────┐      ┌─────┴────┐
│  Kitchen │──────│  Study   │
└───┬──────┘      └─────┬────┘
    │                    │
┌───┴──────┐      ┌─────┴────┐
│  Lounge  │──────│ Bedroom  │ ← Crime Scene (body found here)
└──────────┘      └──────────┘
```

Each room has:
- A background scene illustration (the room environment)
- 2-3 **inspectable objects** with distinct visual contrast (brighter saturation, subtle glow/outline so the player knows they're clickable)
- 1-2 **suspect characters** standing in the room (positioned left or right, Pokémon battle style — they slide in from the side)

### 4.3 Clue & Inventory System

**Inspectable Objects:**
- Player clicks an object with distinct contrast/highlight
- Object animates (glow, zoom, or lift effect)
- A text panel appears at the bottom describing the clue
- Item is added to the **inventory sidebar**
- ZK proof verifies the clue information is consistent with the committed solution

**Inventory:**
- Persistent sidebar or bottom panel showing all collected clues
- Each clue has an icon + short description
- Clues can be "shown" to suspects during interrogation to unlock new dialogue

### 4.4 Suspect Interrogation & Dialogue System

Each suspect has **3 dialogue states:**

1. **Default** — What they say when you first click them (and if you have no relevant clues)
   - Example: *"I was in the kitchen all evening. I didn't hear anything."*

2. **Clue-Triggered** — Changes when you have a specific clue in your inventory that relates to them
   - Example: (After finding the kitchen knife) *"That knife? I used it to prepare dinner earlier. You can check with the cook."*

3. **Confrontation** — When you present evidence that directly contradicts their story
   - Example: (After finding their fingerprints on the bedroom door) *"...Fine. I went to the bedroom to borrow a book. But I left before anything happened!"*

The dialogue evolution is the key investigative mechanic — it's how players piece together who is lying.

**Important:** False clues and misleading dialogue exist. Not every clue is relevant, and some suspects deliberately mislead. This creates depth and prevents brute-force solving.

---

## 5. The First Case: "The Meridian Manor Incident"

### 5.1 Setting

A prestigious dinner party at Meridian Manor. Nine guests. One host found dead in the bedroom. Two rival detectives arrive to solve the case.

### 5.2 Solution (Committed On-Chain)

> **WHO:** Victor Ashford (the business partner)
> **WHAT:** The poison vial (disguised as perfume)
> **WHERE:** The Bedroom

### 5.3 The Nine Suspects

| # | Name | Location | Role | Alibi |
|---|---|---|---|---|
| 1 | **Victor Ashford** | Study | Business partner | Claims he was reviewing documents in the study all evening |
| 2 | **Elena Castillo** | Kitchen | Personal chef | Says she was cooking and never left the kitchen |
| 3 | **Dr. Marcus Webb** | Lounge | Family doctor | Claims he was on a phone call in the lounge |
| 4 | **Isabelle Fontaine** | Bedroom | Art dealer & ex-lover | Found near the body, says she discovered it |
| 5 | **Thomas Grey** | Garden | Groundskeeper | Says he was tending the garden and saw nothing |
| 6 | **Priya Sharma** | Kitchen | Accountant | Claims she was helping Elena in the kitchen |
| 7 | **James Whitmore** | Study | Lawyer | Says he was with Victor reviewing contracts |
| 8 | **Celeste Duval** | Lounge | Victim's sister | Claims she was chatting with Dr. Webb |
| 9 | **Ren Nakamura** | Garden | Photographer/guest | Says he was photographing the garden at dusk |

### 5.4 Clue Map

**Bedroom (Crime Scene):**
- 🔍 **Broken perfume bottle** — Smells odd, not like perfume. (Key evidence — it's the poison vial)
- 🔍 **Smudged fingerprints on the door handle** — Multiple sets
- 🔍 **A torn business letter** — Mentions a hostile takeover
- 👤 Isabelle Fontaine (distraught, found the body)

**Kitchen:**
- 🔍 **Wine glass with residue** — One glass wasn't properly washed
- 🔍 **A missing chef's knife** — Elena insists she had a full set (red herring — the murder wasn't by knife)
- 👤 Elena Castillo
- 👤 Priya Sharma

**Study:**
- 🔍 **Victor's briefcase** — Contains insurance documents with a large payout clause
- 🔍 **A crumpled note** — "We need to talk about what you did. Tonight." (unsigned)
- 👤 Victor Ashford
- 👤 James Whitmore

**Lounge:**
- 🔍 **Phone records on the table** — Dr. Webb's call log shows a 2-minute call, not the "hour-long" call he claims
- 🔍 **An empty medicine bottle** — Prescribed to the victim, but emptied recently
- 👤 Dr. Marcus Webb
- 👤 Celeste Duval

**Garden:**
- 🔍 **Muddy footprints** — Leading from the kitchen door to the bedroom window
- 🔍 **A camera with photos** — Ren's photos include a timestamp showing the garden was empty at 8 PM (contradicts Thomas's alibi)
- 👤 Thomas Grey
- 👤 Ren Nakamura

### 5.5 The Solution Path (How the Player Pieces It Together)

1. Find the **broken perfume bottle** → smells chemical, not like perfume
2. Find **Victor's briefcase** with insurance payout documents → motive (financial gain)
3. Find the **crumpled note** → Victor knew something was happening tonight
4. Talk to **James Whitmore** with the insurance docs → James admits Victor was nervous all evening and stepped out for "fresh air"
5. Talk to **Isabelle** with the perfume bottle → she recognizes it as NOT the victim's perfume — "He never wore that scent"
6. Find **Dr. Webb's phone records** → his alibi collapses (only a 2-minute call)
7. Talk to **Dr. Webb** confronted with phone records → admits he saw Victor leaving the bedroom corridor but didn't think much of it
8. **Accusation:** Victor Ashford, with the poison vial, in the Bedroom ✓

### 5.6 Red Herrings & False Trails

- The **missing kitchen knife** suggests a stabbing — but the murder was by poison
- **Isabelle** being found near the body makes her look suspicious — but she genuinely discovered it
- **Thomas's** broken alibi (Ren's photos) makes him look like he's hiding something — but he was just sneaking a cigarette break, not murdering anyone
- The **muddy footprints** lead to the bedroom window but belong to Thomas (sneaking cigarettes), not the killer
- **Celeste** inherits from her brother and has motive — but she has a solid alibi with Dr. Webb (the 2 minutes they weren't together isn't enough)

---

## 6. The Two Detectives (Player Characters)

Both detectives are **mechanically identical** — same abilities, same access, same clues. The choice is purely cosmetic and personality-driven. They need to be stylish, memorable, and contrast each other.

### Detective A: "Kit Solano"
- **Style:** Laid-back, streetwise, instinctive
- **Visual:** Trench coat, messy hair, always has a coffee cup
- **Vibe:** The detective who solves cases by talking to people and reading body language
- **Tagline:** *"The truth doesn't hide. People do."*

### Detective B: "Noor Vasari"
- **Style:** Precise, methodical, analytical
- **Visual:** Sharp suit, glasses, carries a notebook
- **Vibe:** The detective who solves cases by examining evidence and finding contradictions
- **Tagline:** *"Every lie leaves a fingerprint."*

> *Note: Character design and art assets will be created by Julian. These descriptions serve as creative direction for consistent visual identity.*

---

## 7. UI / UX Design

### 7.1 Visual Style

- **Art direction:** Anime-inspired character art with stylized crime scene backgrounds
- **Character rendering:** Characters appear layered on top of backgrounds (Pokémon battle style — sliding in from left/right)
- **Inspectable objects:** Distinct from background through higher saturation, subtle glow, or outline effect — classic adventure game convention where interactive elements "pop"
- **Color palette:** Dark, moody backgrounds with high-contrast interactive elements

### 7.2 Screen Layout

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

### 7.3 Interaction Flow

1. **Room Navigation:** Click doors/exits at edges of screen to move between rooms. Transition animation (slide or fade).
2. **Object Inspection:** Hover shows cursor change + subtle highlight. Click opens detail panel at bottom with description. Object added to inventory.
3. **Suspect Interaction:** Click on character → they animate (slight bounce or expression change) → dialogue appears in bottom panel. If you have relevant clues, option to "Show Evidence" appears.
4. **Accusation:** Click "ACCUSE" button → modal overlay with three dropdown selections (WHO / WHAT / WHERE) → Submit triggers ZK verification → Result animation.

### 7.4 Minimap (PvP)

Small map in bottom-right showing room layout. Your position shown as your detective icon. Opponent's position shown as their detective icon. Updates in real-time. This mirrors a real scenario where two detectives on the same crime scene can see each other moving around.

---

## 8. Technical Architecture

### 8.1 Stack Overview

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│  React/TypeScript (from Game Studio template)       │
│  WebSocket client (PvP real-time)                   │
│  Noir.js (client-side proof generation)             │
│  Stellar SDK (contract interaction)                 │
└─────────────┬─────────────────┬─────────────────────┘
              │                 │
              ▼                 ▼
┌─────────────────────┐  ┌──────────────────────────┐
│   SOROBAN CONTRACTS  │  │   WEBSOCKET SERVER       │
│   (Stellar Testnet)  │  │   (PvP coordination)     │
│                      │  │   Room state sync         │
│  • Game Hub (given)  │  │   Timer management        │
│  • ZK Detective      │  │   Opponent position       │
│  • Leaderboard       │  └──────────────────────────┘
│  • Noir Verifier     │
└──────────────────────┘
```

### 8.2 Soroban Contracts

**Contract: `zk-detective`**

```rust
// Core storage
CaseCommitment: Map<u32, BytesN<32>>     // case_id → hash(suspect, weapon, room, salt)
GameState: Map<u32, GameSession>          // session_id → game state
Leaderboard: Map<Address, PlayerStats>    // player → best scores

// Key functions
fn create_case(env, admin, case_id, commitment)        // Admin commits solution hash
fn start_game(env, player1, player2, case_id)          // Start session, call Game Hub
fn investigate(env, session_id, player, proof)          // Verify ZK proof for clue response
fn accuse(env, session_id, player, suspect, weapon, room, proof)  // Verify accusation via ZK
fn end_game(env, session_id)                            // Call Game Hub, update leaderboard
fn get_leaderboard(env)                                 // Read leaderboard
```

**Integration with Game Hub:**
- `start_game()` calls Game Hub's `start_game()` with both players and initial points
- `end_game()` calls Game Hub's `end_game()` with the winner
- Follows the exact pattern from AGENTS.md

### 8.3 Noir Circuits

**Circuit 1: Clue Verification**
```
// Proves: "This clue response is consistent with the committed solution"
// Public inputs: commitment hash, clue_id, clue_response
// Private inputs: suspect_id, weapon_id, room_id, salt, case_data
//
// Logic:
// 1. Verify hash(suspect_id, weapon_id, room_id, salt) == commitment
// 2. Verify clue_response == lookup(clue_id, case_data)
```

**Circuit 2: Accusation Verification**
```
// Proves: "This accusation matches the committed solution"
// Public inputs: commitment hash, accused_suspect, accused_weapon, accused_room
// Private inputs: suspect_id, weapon_id, room_id, salt
//
// Logic:
// 1. Verify hash(suspect_id, weapon_id, room_id, salt) == commitment
// 2. Verify accused_suspect == suspect_id
// 3. Verify accused_weapon == weapon_id
// 4. Verify accused_room == room_id
// 5. Return match: true/false
```

### 8.4 Data Model

**Case Definition (Pre-written, stored off-chain or in contract):**
```json
{
  "case_id": 1,
  "title": "The Meridian Manor Incident",
  "commitment": "0xabc123...",
  "rooms": [
    {
      "id": "bedroom",
      "name": "The Bedroom",
      "description": "Where the body was found...",
      "connections": ["kitchen", "lounge"],
      "clues": [
        {
          "id": "perfume_bottle",
          "name": "Broken Perfume Bottle",
          "description": "Shattered glass on the nightstand. The liquid smells chemical, not floral.",
          "is_key_evidence": true,
          "related_suspect": "victor",
          "icon": "bottle"
        }
      ],
      "suspects_present": ["isabelle"]
    }
  ],
  "suspects": [
    {
      "id": "victor",
      "name": "Victor Ashford",
      "role": "Business Partner",
      "room": "study",
      "dialogue": {
        "default": "I was reviewing documents all evening. This is a tragedy.",
        "clue_triggered": {
          "insurance_docs": "Those documents are routine business. Every partner has them.",
          "crumpled_note": "...Where did you find that? It's not what it looks like."
        },
        "confrontation": {
          "perfume_bottle+insurance_docs": "You don't understand the pressure I was under. He was going to ruin everything."
        }
      }
    }
  ],
  "weapons": ["poison_vial", "kitchen_knife", "candlestick", "letter_opener", "garden_shears"],
  "solution": {
    "suspect": "victor",
    "weapon": "poison_vial",
    "room": "bedroom"
  }
}
```

### 8.5 Real-Time PvP (WebSocket)

**Events:**
```
// Client → Server
{ type: "move", room: "kitchen" }
{ type: "inspect", clue: "perfume_bottle" }
{ type: "interrogate", suspect: "victor", show_clue: "insurance_docs" }
{ type: "accuse", suspect: "victor", weapon: "poison_vial", room: "bedroom" }

// Server → Client
{ type: "opponent_moved", room: "lounge" }
{ type: "opponent_inspected" }              // No detail — just that they inspected something
{ type: "opponent_interrogated" }           // No detail
{ type: "opponent_accused", correct: false } // Opponent got it wrong
{ type: "game_over", winner: "player1", score: 850 }
{ type: "timer_update", remaining: 180 }
```

**Key design decision:** The opponent sees THAT you did something, but not WHAT (except room movement via minimap). This creates information asymmetry without needing ZK Layer 2. The WebSocket server simply doesn't broadcast the details — only the event type.

---

## 9. Scoring System

The scoring formula is **hidden from players** — they only see their final score and leaderboard position. This prevents gaming the system and encourages natural investigation.

**Internal formula:**
```
BASE_SCORE = 1000
TIME_PENALTY = elapsed_seconds * 2
CLUE_BONUS = (total_clues - clues_inspected) * 30   // fewer clues = higher score
WRONG_ACCUSATION_PENALTY = 200 per wrong attempt
ROOM_EFFICIENCY = (5 - unique_rooms_visited) * 50    // solving with fewer rooms = bonus

FINAL_SCORE = BASE_SCORE - TIME_PENALTY + CLUE_BONUS - WRONG_ACCUSATION_PENALTY + ROOM_EFFICIENCY
```

This creates multiple strategies:
- **Speedrunner:** Rush through rooms, make educated guesses fast, accept time bonus
- **Thorough detective:** Visit every room, collect all clues, reduce error risk
- **Minimalist:** Find the key clues in few rooms, accuse early with confidence

### 9.1 Leaderboard

Stored on-chain in the Soroban contract:
- Player address
- Best score per case
- Total cases solved
- Average solve time
- Ranked by best score (descending)

---

## 10. Modular Architecture

Everything is built as reusable, composable modules — not spaghetti. Each module works independently and can be tested in isolation.

### 10.1 Module Map

```
┌──────────────────────────────────────────────────────────────┐
│                      GAME ENGINE MODULES                     │
├──────────────┬──────────────┬──────────────┬─────────────────┤
│  Room Engine │  Dialogue    │  Inventory   │  Accusation     │
│              │  Engine      │  System      │  System         │
│  Navigation  │  State mgmt  │  Collect     │  Select & verify│
│  Connections │  Clue-aware  │  Track       │  ZK proof       │
│  Rendering   │  Evolution   │  Present     │  Result         │
├──────────────┴──────────────┴──────────────┴─────────────────┤
│                      SHARED SERVICES                         │
├──────────────┬──────────────┬──────────────┬─────────────────┤
│  ZK Service  │  Contract    │  WebSocket   │  Scoring        │
│              │  Service     │  Service     │  Service        │
│  Noir proofs │  Soroban     │  PvP sync    │  Calculate      │
│  Verify      │  Read/write  │  Events      │  Leaderboard    │
├──────────────┴──────────────┴──────────────┴─────────────────┤
│                      DATA LAYER                              │
├──────────────┬──────────────┬────────────────────────────────┤
│  Case Data   │  Game State  │  Player State                  │
│  (static)    │  (session)   │  (persistent)                  │
│  Rooms, clues│  Current room│  Inventory, score              │
│  Suspects    │  Timer       │  Leaderboard entry             │
│  Solution    │  Phase       │  Match history                 │
└──────────────┴──────────────┴────────────────────────────────┘
```

### 10.2 Module Reusability

These modules are designed so that a **second game** (Battleship, Mastermind, etc.) reuses the shared services layer entirely:
- ZK Service: same proof generation/verification pipeline
- Contract Service: same Soroban interaction pattern
- WebSocket Service: same PvP coordination
- Scoring Service: different formula, same leaderboard infrastructure

Only the game engine modules change per game. This is the "ZK game engine" concept — detective game is the flagship, but the platform supports more.

---

## 11. Hackathon Submission Checklist

Mapping to the five submission requirements:

| Requirement | How We Meet It |
|---|---|
| **1. Fork Game Studio** | ✅ Already forked and working. Existing zk-seek game runs. |
| **2. ZK-Powered Mechanic** | ✅ Noir proofs verify clue responses and accusations against committed solution. ZK is THE core mechanic — without it, the game requires a trusted admin. |
| **3. Deployed On-Chain** | ✅ ZK Detective contract on Stellar Testnet. Calls `start_game()` and `end_game()` on Game Hub `CB4VZ...`. Leaderboard stored on-chain. |
| **4. Front End** | ✅ Interactive visual crime scene with room navigation, clue inspection, suspect interrogation, and accusation flow. Judges can play a full case. |
| **5. Open-Source Repo** | ✅ Public GitHub with clear README documenting ZK architecture, game mechanics, and setup instructions. |
| **6. Video Demo** | ✅ 2-3 minute video showing: case briefing → investigation → accusation → ZK verification → leaderboard. Explain how ZK proves honesty without revealing solution. |

---

## 12. ZK Categories Covered

From the hackathon's suggested directions:

| Category | How ZK Detective Uses It |
|---|---|
| **Hidden-information games** | Solution committed privately. Clue responses proven without revealing the answer. |
| **Provable outcomes** | Accusations verified on-chain via ZK proof. Match results are auditable. |
| **Private actions / fog-of-war** | Investigation choices hidden from opponent (PvP). WebSocket broadcasts events without details. Layer 2 ZK noted as future work for full privacy. |
| **Provable randomness** | Case selection and clue distribution can use provably fair randomness (future: procedural case generation). |
| **Puzzle / strategy proofs** | Player proves they solved the case without revealing their reasoning path to the opponent. |

---

## 13. Development Roadmap

### Phase 1: Core Engine (Hackathon MVP)
- [ ] Case data structure and "The Meridian Manor Incident" content
- [ ] Room navigation engine with 5 connected rooms
- [ ] Clue inspection and inventory system
- [ ] Suspect dialogue system with 3 states (default, clue-triggered, confrontation)
- [ ] Accusation flow (WHO / WHAT / WHERE selection)
- [ ] Soroban contract: case commitment, game sessions, accusation verification
- [ ] Noir circuit: accusation verification against commitment
- [ ] Noir circuit: clue response verification
- [ ] On-chain leaderboard
- [ ] Game Hub integration (start_game / end_game)
- [ ] Visual assets: 5 room backgrounds, 9 suspect characters, clue icons
- [ ] Single-player flow end-to-end
- [ ] Scoring system (hidden formula)

### Phase 2: PvP & Polish
- [ ] WebSocket server for real-time PvP
- [ ] Matchmaking (find opponent)
- [ ] Minimap with opponent position
- [ ] Timer system
- [ ] PvP-specific scoring adjustments
- [ ] Detective character selection (Kit Solano / Noor Vasari)
- [ ] Sound effects and ambient audio
- [ ] Case briefing narrative intro
- [ ] Resolution narrative outro

### Phase 3: Beyond Hackathon (Vision)
- [ ] ZK Layer 2: hidden investigation choices
- [ ] Procedural case generation (off-chain oracle with ZK-proven honesty)
- [ ] Multiple pre-written cases
- [ ] Token staking / wager system for matches
- [ ] ELO-based ranked matchmaking
- [ ] Additional games using the same engine (Battleship, Mastermind)
- [ ] Mobile-responsive design
- [ ] Spectator mode

---

## 14. Video Demo Script (2-3 minutes)

**[0:00-0:20] Hook**
*"What if you could play detective — but nobody could cheat? Not even the game itself. This is ZK Detective."*

**[0:20-0:50] The Problem**
*"In online mystery games, you have to trust the server. It could change the answer, give unfair clues, or favor one player. Zero-knowledge proofs fix this. The solution is locked on-chain before the game starts, and every clue is mathematically proven honest."*

**[0:50-1:40] Gameplay Demo**
Show: Room navigation → clicking clues → inventory filling → interrogating a suspect → dialogue evolving when you show evidence → the "aha" moment → making the accusation

**[1:40-2:10] ZK Under the Hood**
Show: The commitment on-chain → a proof being generated → contract verification → "The game master literally cannot lie."

**[2:10-2:40] Competitive Layer**
Show: Leaderboard → PvP mode with two players → minimap showing opponent → first to accuse correctly wins

**[2:40-3:00] Vision**
*"One engine. Many games. ZK Detective is the first game on a trustless competitive gaming platform — built on Stellar, powered by Noir, and verified on Soroban."*

---

## 15. Key Design Decisions Summary

| Decision | Choice | Rationale |
|---|---|---|
| ZK Framework | Noir | Rust-like syntax aligns with Soroban, good tooling, client-side proof generation |
| Game Master | Pre-written cases (Option B) | Simplest for hackathon, maps to existing architecture, no trusted server needed |
| ZK Layer | Layer 1 only (honest game master) | Core innovation, Layer 2 noted as future work |
| Accusation format | Structured selection (WHO/WHAT/WHERE) | ZK-verifiable, clean UX, classic Clue mechanic |
| Player asymmetry | None (cosmetic only) | Keeps it fair, simpler to balance, focus on skill not character meta |
| Scoring | Hidden formula | Prevents gaming, encourages natural play, creates strategic diversity |
| PvP info hiding | WebSocket filtering (no ZK) | Pragmatic — server doesn't broadcast details, functionally equivalent for hackathon |
| Art style | Anime-inspired, layered characters on backgrounds | Consistent with Case Closed inspiration, manageable asset creation |
| Detective characters | Two contrasting personalities, same abilities | Strong identity without balance concerns |
| First case | Pre-written murder mystery, 5 rooms, 9 suspects | Rich enough to showcase all mechanics, hand-crafted narrative quality |