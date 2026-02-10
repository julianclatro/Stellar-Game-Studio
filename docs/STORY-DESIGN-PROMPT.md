# ZK Detective — Story Design Prompt

A creative framework for designing new cases. This is the **thinking tool** — use it before the authoring guide (technical schema) and before writing any JSON.

> **How the docs fit together:**
> 1. **This doc** — how to *think* about designing a mystery (rules, patterns, archetypes)
> 2. `STORY-AUTHORING-GUIDE.md` — how to *write* the case (schema, constraints, file checklist)
> 3. `DRY-CREEK-STORY-BIBLE.md` — a complete example of a finished story design
> 4. `meridian-manor.json` — the original case (classic murder mystery)
> 5. `dry-creek.json` — a second case (civic conspiracy, not yet wired)

---

## Phase 1: The Seed

Start with one question. Everything grows from this.

### The Central Question

Your mystery is always: **"Who did it, with what, where?"**

But "it" is wide open. Pick your act:

| Act | Example Question | Genre |
|-----|-----------------|-------|
| Murder | Who killed the host? | Classic noir |
| Sabotage | Who poisoned the water supply? | Civic conspiracy |
| Theft | Who stole the prototype? | Heist thriller |
| Fraud | Who forged the will? | Legal mystery |
| Disappearance | Who made the witness vanish? | Thriller |
| Leak | Who sold the source code? | Corporate espionage |
| Haunting | Who's pretending to be the ghost? | Scooby-Doo |
| Contamination | Who tainted the batch? | Medical/pharma thriller |

**Write yours in one sentence.** If you can't, the mystery isn't clear enough yet.

### The Tone Compass

Pick two adjectives that describe the feeling:

| Pairing | Example |
|---------|---------|
| Dark + atmospheric | True Detective, Chinatown |
| Witty + tense | Knives Out, Clue |
| Spooky + fun | Scooby-Doo, Gravity Falls |
| Cold + procedural | Zodiac, Mindhunter |
| Warm + quirky | Only Murders in the Building |
| Gritty + political | Spotlight, The Wire |

These two words guide every dialogue line, room description, and clue name you write.

---

## Phase 2: The Solution (Work Backwards)

**Design the answer first.** The best mysteries are written in reverse.

### The Culprit
- Who did it and **why**?
- What's their relationship to the affected party?
- What position gives them both **motive** and **access**?
- Why haven't they been caught yet? What's their cover?

Good culprits have:
- A reason that's *understandable* even if wrong (not cartoon evil)
- A position of trust or authority (makes the betrayal land harder)
- A cover story that holds up until the player starts pulling threads

### The Instrument (the "how")
- How did they do it?
- The instrument should be **specific and provable** — not "they did it secretly"
- It should be something that can exist as physical or documentary evidence
- Think: what object would you hold up in court?

### The Scene (the "where")
- Where did the act happen?
- This room should feel *wrong* when you enter it — something is off
- It should be a room the culprit has a reason to access (or deny accessing)

### Test Your Solution
Ask yourself:
- [ ] Could an outsider piece this together from clues alone?
- [ ] Does the culprit have a plausible reason to be where they are?
- [ ] Is the instrument something the player can physically find evidence of?
- [ ] Is the "where" surprising but logical in hindsight?

---

## Phase 3: The Cast (9 Suspects)

### The Suspect Spectrum

Not every suspect serves the same narrative purpose. Spread them across these roles:

| Role | Count | Purpose | Example (Dry Creek) |
|------|-------|---------|---------------------|
| **The Culprit** | 1 | Did it. Lies convincingly. Confession under pressure. | Elena Voss (mayor) |
| **The Accomplice** | 1-2 | Helped, enabled, or covered up. Guilty but not the mastermind. | Doc Ramirez (coerced), Sheriff Harlan (looked away) |
| **The Witness** | 1-2 | Saw or heard something crucial. Afraid to talk or not believed. | Coyote (saw the trucks), Clara (overheard the deal) |
| **The Red Herring** | 1-2 | Looks suspicious, has a secret, but it's unrelated to the crime. | Dale (buyout offer makes him look involved) |
| **The Victim's Ally** | 1-2 | Cares about the affected party. Provides context and emotional weight. | Agnes (community organizer), Ines (tried to report it) |

### Suspect Design Rules

1. **Everyone has a secret.** Even innocent suspects hide something. Secrets create tension and make every conversation feel like it could matter.

2. **Everyone has a cover story.** The first thing they say should sound reasonable. The player should think "okay, that checks out" before finding evidence that cracks it.

3. **The culprit's default dialogue should be the most helpful-sounding.** Overcompensation is a classic tell — but only in hindsight.

4. **Spread suspects 2-2-2-1-2 across rooms.** This gives every room at least one person to talk to and keeps the investigation feeling populated.

5. **Give each suspect 1-3 clue reactions.** Not every suspect reacts to every clue. Cross-room reactions are the most interesting ("you found that in the *clinic*?").

### The Dialogue Escalation Pattern

Each suspect's dialogue follows a three-act structure:

```
ACT 1 — Default (the mask)
  The alibi. The deflection. The performed normalcy.
  "I was in the kitchen all evening."

ACT 2 — Clue-triggered (cracks appear)
  Evidence forces a reaction. Denial, deflection, or partial truth.
  "Those results were preliminary. Inconclusive."

ACT 3 — Confrontation (the mask falls)
  Two key clues combined. Can't deny it anymore.
  "I'm not a brave man. Elena told me — if I flagged it, she'd defund the clinic."
```

**Rules for confrontation dialogue:**
- The **culprit** MUST have at least one confrontation → this is the confession/unmasking
- **Accomplices** SHOULD have confrontations → they reveal how the conspiracy worked
- **Witnesses** CAN have confrontations → they finally tell the truth
- **Red herrings and allies** should have empty confrontations `{}` → they have nothing to confess

---

## Phase 4: The Rooms (5 Locations)

### Room Design Principles

1. **Each room is a world.** Write the atmosphere as if you're walking in. What do you see, smell, hear? One sentence should make the player feel *there*.

2. **The room topology is a puzzle.** Connections control pacing. The player has to traverse the graph to reach all evidence. Don't make every room connect to every other room — force navigation choices.

3. **The starting room should be safe but interesting.** It's where the player gets oriented. Put approachable suspects and introductory clues here.

4. **The crime scene room should feel dangerous or forbidden.** It's where the hardest evidence lives. Put it far from the start.

5. **Every room needs a narrative label** — a poetic sentence fragment for the result screen. "the Bedroom, during the dinner party" / "the Old Mine, where the poison entered the earth"

### Room Topology Patterns

The connection graph must be connected (every room reachable) and reciprocal (if A→B then B→A).

Good patterns with 5 rooms:

```
Pentagon (every room has 2 connections):
    A
   / \
  B   C        Meridian Manor, Dry Creek
   \ /
  D - E

Hub-and-spoke (one central room):
  B   C
   \ /
    A          Central hub with 4 branches
   / \
  D   E

Chain with shortcuts:
  A - B - C    Linear with crosslinks
  |       |
  D - - - E
```

### Room Content Distribution

| Room | Clues | Suspects | Feel |
|------|-------|----------|------|
| Starting room | 2 (introductory) | 2 (approachable) | Safe, social |
| Middle rooms | 2-3 each | 1-2 each | Investigation deepens |
| Crime scene | 2 (hardest evidence) | 1-2 (the culprit or accomplice) | Tense, revealing |

Target: **11 clues total** across 5 rooms (distribution: 3-2-2-2-2 or 2-2-2-2-3).

---

## Phase 5: The Clues (11 Evidence Items)

### Clue Design Philosophy

Clues are the core mechanic. Every clue should do at least one of these:

1. **Point at the culprit** — evidence that links to the guilty party
2. **Crack an alibi** — proves someone lied about where they were or what they did
3. **Reveal a relationship** — shows a connection between suspects, or between a suspect and the crime
4. **Mislead** — looks important but leads nowhere (red herring)
5. **Corroborate a witness** — confirms what someone else said, making their testimony trustworthy

### The Clue Economy

| Type | Count | `related_suspect` | `is_key_evidence` | Purpose |
|------|-------|--------------------|--------------------|---------|
| Direct evidence against culprit | 3-5 | culprit's ID | mixed | Points right at them |
| Evidence against accomplices | 1-2 | accomplice's ID | YES | Reveals the cover-up |
| Witness corroboration | 1-2 | witness's ID | mixed | Confirms testimony |
| Red herring | 1-2 | `""` or wrong suspect | NO | Creates uncertainty |

### Key Evidence Rules

- Mark 6-8 out of 11 clues as `is_key_evidence: true`
- Key evidence is required to unlock confrontation dialogue
- Confrontation combos require TWO key evidence clues
- Spread key evidence across at least 3 different rooms

### ZK Circuit Behavior

This is important for puzzle design:

- Clues where `related_suspect` = the culprit → ZK returns `response_value: 1` ("relevant")
- Everything else → returns `0`
- The player can use ZK verification as a hint: "this clue IS connected to the guilty party"
- So having 3-5 clues pointing at the culprit means the ZK signal guides the player toward them

### Clue Naming

Clues are items in an inventory. Name them like **evidence tags**, not puzzle descriptions:

| Good | Bad |
|------|-----|
| "Redacted Council Minutes" | "Suspicious Document" |
| "Clara's Notepad Entry" | "Overheard Conversation" |
| "Hidden Blood Test Results" | "Medical Evidence" |
| "Forged State Clearance" | "Fake Paper" |

Specific beats vague. The name should make the player think "I need to ask someone about THIS."

---

## Phase 6: The Instruments (5 "Weapons")

### What Makes a Good Instrument

The instruments are the **how** — what the player accuses the culprit of using. Only one is correct, but all five should be plausible.

Design them in three tiers:

| Tier | Count | Design |
|------|-------|--------|
| **The real one** | 1 | Directly matches evidence found in the game |
| **Plausible alternatives** | 2 | Could have been the method based on partial evidence |
| **Thematic distractors** | 2 | Fit the genre/setting but don't match any evidence |

Example (Dry Creek):
- **Real**: Forged Environmental Permit (matches the forged clearance clue)
- **Plausible**: Industrial Chemical Drums (you find them, but they're the *result*, not the *method*)
- **Plausible**: Buried Water Quality Report (exists as a clue, but it was *suppressed*, not the instrument)
- **Distractor**: Offshore Bribe Ledger (motive evidence, not method)
- **Distractor**: Illegal Pipeline Valve (thematic but no direct evidence of it)

### Narrative Labels

Each instrument needs a narrative label for the result screen — a sentence fragment that reads naturally after "...using":

> "...using **a forged environmental impact permit, stamped with the state seal but never issued**"

Write it like evidence being read aloud in court.

---

## Phase 7: The Narrative Arc

### The Player's Journey

Think about the emotional arc as the player moves through rooms:

```
Cantina (start)          → "This seems straightforward"
  ↓ talk to Clara, Dale
Town Hall                 → "Wait, the mayor is hiding something"
  ↓ find redacted minutes, threatening note
Well House                → "The engineer was silenced"
  ↓ find tampered samples, falsified log
Clinic                    → "The doctor is lying too"
  ↓ find blood results, threatening note
Old Mine                  → "This is where it happened. Everything connects."
  ↓ find barrels, forged clearance → ACCUSATION
```

### Revelation Pacing

- **Rooms 1-2**: Gather surface-level clues, talk to approachable suspects
- **Room 3**: First "aha" — a clue contradicts something someone said
- **Room 4**: The conspiracy deepens — multiple people are lying
- **Room 5**: The smoking gun — undeniable physical evidence

### The Epilogue

Write 3-5 sentences that:
1. Name the instrument and explain how it was used
2. Name the culprit and explain their motive
3. Connect the clue trail — how the evidence led to the truth
4. End with a thematic sentence that resonates with the tone

---

## Phase 8: Self-Review Checklist

Before moving to JSON, verify your story against these rules:

### Structure
- [ ] Exactly 9 suspects, 5 rooms, 5 instruments, 11 clues
- [ ] One culprit, one correct instrument, one correct room
- [ ] All rooms connected (no isolated rooms), all connections reciprocal
- [ ] Starting room is not the crime scene
- [ ] Suspect distribution: every room has at least 1 suspect

### Clue Integrity
- [ ] 6-8 clues marked as key evidence
- [ ] Key evidence spread across at least 3 rooms
- [ ] At least 3 clues have `related_suspect` = culprit
- [ ] At least 1 red herring (`related_suspect: ""`)
- [ ] No room has 0 clues

### Dialogue Integrity
- [ ] Every suspect has a default line (their mask)
- [ ] Every suspect responds to at least 1 clue
- [ ] The culprit has at least 1 confrontation entry (the confession)
- [ ] Confrontation combos use only key evidence clues
- [ ] Innocent "color" suspects have empty confrontation `{}`

### Narrative Quality
- [ ] The hook makes you want to investigate (read it aloud — does it grab?)
- [ ] Every room description has sensory detail (sight, sound, smell)
- [ ] Suspects sound like different people (read all 9 defaults — can you tell them apart?)
- [ ] The epilogue connects the clue trail back to the solution
- [ ] Instrument narrative labels read naturally after "...using"

### Fairness
- [ ] The player CAN solve it from clues alone (no hidden information)
- [ ] The culprit's confrontation is triggered by clues available in the game
- [ ] Red herrings are misleading but not unfair (they don't contradict the real solution)
- [ ] The ZK signal (response_value 1 for culprit-linked clues) is a useful hint, not a giveaway

---

## Quick-Start: The 10-Minute Pitch

If you're brainstorming from zero, answer these eight questions:

1. **What happened?** (one sentence)
2. **Where?** (the setting — one vivid image)
3. **Who did it and why?** (culprit + motive)
4. **How?** (the instrument — what would you hold up in court?)
5. **Where specifically?** (which of the 5 rooms is the crime scene?)
6. **Who else is involved?** (list 8 more suspects — name + role + one-line secret)
7. **What's the first thing the player sees?** (the starting room)
8. **What's the last line of the story?** (the epilogue's final sentence)

If all eight answers feel compelling, you have a case. Go to `STORY-AUTHORING-GUIDE.md` Section E to fill in the full template.

---

## Reference: Two Complete Examples

| | Meridian Manor | Dry Creek |
|--|---------------|-----------|
| **Case file** | `cases/meridian-manor.json` | `cases/dry-creek.json` |
| **Story bible** | (inline in case JSON) | `docs/DRY-CREEK-STORY-BIBLE.md` |
| **Act** | Murder | Conspiracy/sabotage |
| **Culprit archetype** | Business partner (greed) | Mayor (corruption) |
| **Instrument** | Poison vial | Forged permit |
| **Suspect dynamic** | 1 killer, 8 innocent | 1 mastermind, 3 accomplices, 5 bystanders |
| **Tone** | Gothic noir, mansion | Desert grit, political |
| **Starting room** | Bedroom (crime scene adjacent) | Cantina (social hub) |
| **Crime scene** | Bedroom | Old Mine |
