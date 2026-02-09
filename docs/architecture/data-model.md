# Data Model

> Extracted from [Game Plan](../game-plan.md) — Section 8.4

---

## Case Definition JSON Schema

Cases are pre-written and stored off-chain (loaded by the frontend). The solution commitment is stored on-chain.

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

---

## Key Data Structures

### Room

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique room identifier |
| `name` | `string` | Display name |
| `description` | `string` | Room narrative description |
| `connections` | `string[]` | IDs of adjacent rooms (navigation graph) |
| `clues` | `Clue[]` | Inspectable objects in this room |
| `suspects_present` | `string[]` | Suspect IDs found in this room |

### Clue

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique clue identifier |
| `name` | `string` | Display name |
| `description` | `string` | What the player sees on inspection |
| `is_key_evidence` | `boolean` | Whether this clue is essential to the solution |
| `related_suspect` | `string` | Suspect this clue relates to |
| `icon` | `string` | Icon identifier for inventory display |

### Suspect

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique suspect identifier |
| `name` | `string` | Display name |
| `role` | `string` | Their relationship to the victim |
| `room` | `string` | Room they're found in |
| `dialogue` | `DialogueTree` | Three-state dialogue system |

### DialogueTree

| Field | Type | Description |
|-------|------|-------------|
| `default` | `string` | Initial dialogue (no relevant clues) |
| `clue_triggered` | `Record<clue_id, string>` | Dialogue when player has specific clue |
| `confrontation` | `Record<clue_combo, string>` | Dialogue when presenting contradicting evidence |

### Solution

| Field | Type | Description |
|-------|------|-------------|
| `suspect` | `string` | The guilty suspect ID |
| `weapon` | `string` | The murder weapon ID |
| `room` | `string` | The room where the crime occurred |

---

## On-Chain State

### Contract Storage

```
CaseCommitment: Map<u32, BytesN<32>>     // case_id → hash(suspect, weapon, room, salt)
GameState: Map<u32, GameSession>          // session_id → current game state
Leaderboard: Map<Address, PlayerStats>    // player → best scores
```

### GameSession

| Field | Type | Description |
|-------|------|-------------|
| `session_id` | `u32` | Unique session ID |
| `case_id` | `u32` | Which case is being played |
| `player` | `Address` | Player address |
| `start_ledger` | `u32` | When the game started |
| `clues_inspected` | `u32` | Count of clues inspected |
| `rooms_visited` | `u32` | Count of unique rooms visited |
| `wrong_accusations` | `u32` | Count of failed accusations |
| `status` | `GameStatus` | Active / Solved / TimedOut |

### PlayerStats (Leaderboard)

| Field | Type | Description |
|-------|------|-------------|
| `best_score` | `i128` | Highest score achieved |
| `cases_solved` | `u32` | Total cases solved |
| `avg_solve_time` | `u32` | Average solve time in ledgers |
