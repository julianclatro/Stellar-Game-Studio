# ZK Detective — Story Authoring Guide

How to write a new case for ZK Detective. This guide covers the engine constraints, the data schema, the clue/dialogue system, and a brainstorming template. The goal: **edit one JSON file** and create matching art assets to have a completely new game.

> **Genre-agnostic.** The engine doesn't assume murder — it solves the question **"Who did it, with what, where?"** Your mystery can be a murder, a theft, sabotage, a disappearance, a conspiracy, a Scooby-Doo unmasking — anything where suspects have alibis, clues point to the truth, and one person is responsible. The "weapons" are really just *instruments* (a stolen key, a hacked terminal, a forged document). The tone can be noir, comedic, sci-fi, supernatural, or cozy mystery. The engine doesn't care — it only cares about the solution tuple.

### Related Docs

| Doc | Purpose |
|-----|---------|
| **[Story Design Prompt](STORY-DESIGN-PROMPT.md)** | Creative framework — how to *think* about mystery design (suspect archetypes, clue economy, dialogue escalation, narrative pacing, self-review checklist). Start here before filling in the template below. |
| **[Dry Creek Story Bible](DRY-CREEK-STORY-BIBLE.md)** | Complete example of a finished story design — civic conspiracy / environmental crime. Shows every design decision made for a non-murder case. |
| `cases/meridian-manor.json` | The active case — classic murder mystery at a manor (Clue / Agatha Christie). |
| `cases/dry-creek.json` | Second case — desert town water contamination conspiracy (True Detective / Chinatown). Not yet wired into the app. |

### Genre Examples

| Genre | Mystery | "Weapon" (instrument) | Suspects | Tone |
|-------|---------|----------------------|----------|------|
| Classic noir | Murder at a manor | Poison vial | Dinner party guests | Dark, atmospheric |
| Scooby-Doo | Who's the ghost? | Hologram projector | Amusement park staff | Comedic, spooky-fun |
| Heist | Who stole the diamond? | Glass cutter | Museum employees | Tense, clever |
| Sci-fi | Who sabotaged the reactor? | Malware USB drive | Space station crew | Thriller |
| Cozy mystery | Who ate the prize cake? | Stolen recipe book | Baking competition contestants | Lighthearted, warm |
| Corporate | Who leaked the code? | Encrypted USB | Startup team members | Tech thriller |

---

## A. Game Engine Constraints (Hard Rules)

These are limits enforced by the Soroban contract, ZK circuits, and game engines. Violating them will break the game.

| Constraint | Current Value | Max (Contract) | Notes |
|-----------|---------------|----------------|-------|
| Suspects | 9 | 9 | `MAX_SUSPECT_ID` in `contracts/zk-detective/src/lib.rs:120` |
| Instruments ("weapons") | 5 | 5 | `MAX_WEAPON_ID` in `lib.rs:121` — the *means* used (could be a tool, document, device, etc.) |
| Rooms | 5 | 5 | `MAX_ROOM_ID` in `lib.rs:122` |
| Clues per room | 2–3 | No hard limit | Limited by inventory UI space |
| Suspects per room | 1–2 | No hard limit | Limited by room UI space |
| Solution tuple | (suspect, instrument, room) | — | **Who? How? Where?** — this is what the ZK commitment locks |

> To increase limits: change `MAX_*_ID` constants in the contract and redeploy. The ZK circuits and game engines will work with any IDs.

### Room Topology
- Each room must have at least 1 connection to another room
- All connections must be **reciprocal** (if A→B then B→A)
- The connection graph must be **connected** (every room reachable from every other)
- The case loader validates these rules at startup

### Solution
- Exactly one suspect is the **culprit** (the guilty party)
- Exactly one instrument is the **means** (how they did it — a weapon, tool, document, device...)
- Exactly one room is the **scene** (where it happened)
- The solution is encoded as `(suspect_id, weapon_id, room_id)` in the commitment hash
- Think of it as: **Who? How? Where?**

---

## B. Clue System Rules

Each clue is placed in a room and optionally links to a suspect.

| Field | Required | Purpose |
|-------|----------|---------|
| `id` | yes | Unique string ID (used as key everywhere) |
| `name` | yes | Display name in inventory |
| `description` | yes | Flavor text shown on inspection |
| `is_key_evidence` | yes | `true` = needed to unlock confrontation dialogue |
| `related_suspect` | yes | Suspect ID this clue points to, or `""` for red herrings |
| `icon` | yes | Lucide icon name for inventory display |

### How clues interact with ZK:
- Clues with `related_suspect` matching the **culprit** → ZK circuit returns `response_value: 1` ("this clue is relevant")
- Clues with `related_suspect` pointing to an **innocent** suspect → `response_value: 0`
- Red herring clues (`related_suspect: ""`) → always `response_value: 0`

### Design guidance:
- Spread key evidence across multiple rooms to force exploration
- Mix red herrings with real clues to create uncertainty
- The culprit should have 2–3 clues pointing to them across different rooms
- At least 2 key evidence clues are needed to unlock a confrontation
- Clues don't have to be physical objects — they can be records, photos, overheard conversations, digital logs, etc.

---

## C. Dialogue System (3 States per Suspect)

Every suspect has a dialogue tree with exactly three tiers:

### 1. Default
What they say when the player first talks to them. Usually their alibi or initial reaction.
```json
"default": "I was in the kitchen all evening. Elena can confirm."
```

### 2. Clue-Triggered
What they say when the player has collected a specific clue. Keyed by `clue_id`.
```json
"clue_triggered": {
  "missing_knife": "That knife! Someone must have taken it.",
  "wine_glass": "I washed all the glasses. If one wasn't clean, it was used later."
}
```
- Only clues the player has collected are shown as dialogue options
- A suspect can respond to clues found in other rooms (cross-referencing)

### 3. Confrontation
What they say when the player presents a **combination** of clues. Keyed by `"clue1+clue2"`.
```json
"confrontation": {
  "perfume_bottle+insurance_docs": "You don't understand the pressure I was under..."
}
```
- **Innocent suspects** should have an empty `confrontation: {}` object
- **The culprit** must have at least one confrontation entry (this is the "unmasking" moment — a confession, a slip-up, or undeniable proof)
- **Alibi witnesses** (innocent but hiding something) can also have confrontation entries that reveal testimony against the culprit
- Both clues in the combo must be `is_key_evidence: true` for the confrontation to trigger

---

## D. Scoring Formula

Mirrors the on-chain `compute_score()` in the detective contract:

```
score = 10,000 (base)
      − min(time_elapsed_in_ledgers, 5000)
      − 500 × wrong_accusations
      + 100 × clues_inspected
      + 50 × rooms_visited

floor at 0
```

- **1 ledger ≈ 5 seconds** (Stellar network)
- Maximum time penalty is capped at 5,000 points
- A perfect "speedrun" (instant solve, 0 wrong, all 11 clues, all 5 rooms) = 10,000 + 1,100 + 250 = 11,350

---

## E. Story Structure Template

Use this to brainstorm a new case before touching any code. The engine is genre-agnostic — fill this in for a murder mystery, a heist, a sabotage, a disappearance, or any "whodunit."

> **Before filling this in**, read the [Story Design Prompt](STORY-DESIGN-PROMPT.md) — it walks you through *how to think* about each section (suspect archetypes, clue distribution strategy, dialogue escalation patterns, room topology). For a completed example of this template, see the [Dry Creek Story Bible](DRY-CREEK-STORY-BIBLE.md).

### The Mystery
> What happened? What's the central question the detective must answer?
> Examples: "Who poisoned the host?" / "Who stole the prototype?" / "Who sabotaged the launch?" / "Who's behind the mask?"

### Setting
> Where and when does this take place? (Manor, spaceship, train, island, office building, haunted amusement park...)
> What event brings these people together? (Dinner party, conference, voyage, heist, festival...)

### The Affected Party
> Who was harmed, wronged, or victimized? What were they like? Why would anyone target them?
> (This could be a murder victim, a theft target, a sabotage victim, or even an abstract entity like "the company")

### The Hook
> The opening line — why should the player care? What makes this case interesting?

### Tone & Genre
> What's the vibe? Noir detective? Cozy mystery? Sci-fi thriller? Comedic Scooby-Doo? Gothic horror? Corporate espionage?

### Suspects (up to 9)

For each suspect:
| # | Name | Role | Room | Cover Story | Real Secret | Culprit? |
|---|------|------|------|-------------|-------------|----------|
| 1 | | | | | | |
| 2 | | | | | | |
| ... | | | | | | |

### Instruments / "Weapons" (up to 5)

The *means* by which the act was committed. Doesn't have to be a weapon — could be a forged document, a hacked terminal, a stolen key, a tampered device, etc.

| # | ID | Display Name | Narrative Label |
|---|-----|-------------|-----------------|
| 1 | | | "a [instrument] found in [context]" |
| ... | | | |

### Rooms / Locations (up to 5)

| # | ID | Name | Connections | Atmosphere |
|---|-----|------|------------|------------|
| 1 | | | → room2, room3 | |
| ... | | | | |

### Clue Map

| # | Clue ID | Room | Related Suspect | Key Evidence? | Description |
|---|---------|------|----------------|---------------|-------------|
| 1 | | | | | |
| ... | | | | | |

### The Solution
> **Who** (culprit): [suspect]
> **How** (means): [instrument/weapon]
> **Where** (scene): [room]

### The Reveal (Epilogue)
> How does it all come together? What's the "aha" moment? The Scooby-Doo unmasking? The confession? The evidence that makes it undeniable?

---

## F. Where Things Live (File Reference)

### Story Content (edit these for a new story)

| What | File | Format |
|------|------|--------|
| **All story content** | `zk-detective-frontend/src/data/cases/{case-name}.json` | JSON |
| Solution + salt | `zk-detective-frontend/src/data/cases/{case-name}.solution.json` | JSON (build-time only) |
| Case import | `zk-detective-frontend/src/store/game-store.ts` lines 25–26 | TS import path |

### ID Mapping Files (must match case JSON entity IDs)

| What | File | Notes |
|------|------|-------|
| String → numeric ID maps | `src/data/id-maps.ts` | `SUSPECT_IDS`, `WEAPON_IDS`, `ROOM_IDS` |
| Clue numeric IDs | `src/data/clue-ids.ts` | `CLUE_IDS` map |

### Art Assets (must match entity IDs)

| What | Path | Dimensions |
|------|------|-----------|
| Room backgrounds | `public/assets/rooms/{room-id}.png` | 800×450 |
| Suspect portraits | `public/assets/suspects/{suspect-id}.png` | 400×500 |
| Clue icons | `public/assets/clues/{clue-id}.png` | 200×200 |
| Weapon icons | `public/assets/weapons/{weapon-id}.png` | 200×200 |
| Scene layers | `public/assets/scenes/{room-id}/` | Various PNGs |
| Title screen art | `public/assets/title/manor-exterior.png` | 800×500 |

### PixiJS Scene System (must match entity IDs)

| What | File | Notes |
|------|------|-------|
| Asset manifest | `src/pixi/asset-manifest.ts` | Maps room IDs → scene PNG paths |
| Room hotspot positions | `src/pixi/rooms/{room-id}.ts` | Pixel coordinates for interactive elements |
| Room hotspot registry | `src/pixi/rooms/index.ts` | Maps room IDs → hotspot configs |
| Asset path helpers | `src/utils/asset-paths.ts` | `getSuspectImage()`, `getClueImage()`, etc. |

### Contract Limits

| What | File | Line |
|------|------|------|
| `MAX_SUSPECT_ID` | `contracts/zk-detective/src/lib.rs` | 120 |
| `MAX_WEAPON_ID` | `contracts/zk-detective/src/lib.rs` | 121 |
| `MAX_ROOM_ID` | `contracts/zk-detective/src/lib.rs` | 122 |

---

## G. Case JSON Schema Reference

The case JSON is the **single source of truth** for all story content. Here's the complete schema with all fields:

```jsonc
{
  // === Identity ===
  "case_id": 1,                              // Unique numeric ID
  "title": "The Meridian Manor Incident",     // Displayed on title + briefing screens
  "commitment": "0x...",                       // Pedersen hash commitment (from build script)

  // === Narrative (new — read by UI components) ===
  "setting": "...",         // Paragraph shown on briefing screen (the scene-setter)
  "briefing": "...",        // Short hook shown on title screen
  "epilogue": "...",        // Paragraph shown on result screen after solving
  "starting_room": "bedroom",  // Room ID where investigation begins

  // === Room Layout (for minimap + briefing SVG) ===
  "room_layout": {
    "positions": {
      "bedroom": { "x": 90, "y": 18 },  // SVG coordinates (180×120 viewBox)
      // ... one per room
    }
  },

  // === Rooms ===
  "rooms": [
    {
      "id": "bedroom",
      "name": "The Bedroom",
      "abbreviation": "BED",                    // 3-char label for minimap
      "narrative_label": "the Bedroom, during the dinner party",  // Result screen context
      "description": "...",                      // Shown when entering the room
      "connections": ["lounge", "study"],         // Must be reciprocal
      "clues": [ /* ...Clue objects... */ ],
      "suspects_present": ["isabelle"]
    }
  ],

  // === Suspects ===
  "suspects": [
    {
      "id": "victor",
      "name": "Victor Ashford",
      "role": "Business Partner",
      "biography": "Victor Ashford, the business partner",  // Result screen — who is this person?
      "motive": "A hostile takeover gone wrong...",           // Result screen — why did they do it?
      "room": "study",
      "dialogue": {
        "default": "...",
        "clue_triggered": { "clue_id": "..." },
        "confrontation": { "clue1+clue2": "..." }  // Empty {} for innocent suspects
      }
    }
  ],

  // === Instruments ("weapons" in engine terms) ===
  // The means by which the act was committed. Can be a weapon, tool, document, device, etc.
  "weapons": [
    {
      "id": "poison_vial",
      "name": "Poison Vial",
      "narrative_label": "a poison vial disguised as a perfume bottle"
    }
  ]
}
```

### Solution File (`{case-name}.solution.json`)

```json
{
  "solution": {
    "suspect": "victor",
    "weapon": "poison_vial",
    "room": "bedroom"
  },
  "salt": "my_secret_salt_string"
}
```

> **Never shipped to the client.** Only used at build time for:
> - Computing the commitment hash
> - Solo mode correctness checking (imported in game-store.ts)
> - ZK proof generation inputs

---

## H. Checklist: Creating a New Case

1. **Design the story** using the [Story Design Prompt](STORY-DESIGN-PROMPT.md), then fill in the template in Section E
2. **Write the case JSON** following the schema in Section G
3. **Write the solution JSON** with the culprit/instrument/room and a unique salt
4. **Run the commitment script** to compute the Pedersen hash commitment
5. **Update ID maps** in `id-maps.ts` and `clue-ids.ts` to match new entity IDs
6. **Create art assets** matching the entity IDs (rooms, suspects, clues, weapons, title)
7. **Update PixiJS hotspots** in `src/pixi/rooms/` for the new room layouts
8. **Update asset manifest** in `src/pixi/asset-manifest.ts`
9. **Update asset paths** in `src/utils/asset-paths.ts`
10. **Update the import** in `game-store.ts` to point to the new case JSON
11. **Redeploy contract** if entity counts exceed current `MAX_*_ID` limits
12. **Run setup script** to create the case commitment on-chain
13. **Test**: `bun test`, `bun run build`, visual check with `bun run dev`
