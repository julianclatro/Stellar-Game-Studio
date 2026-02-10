# The Dry Creek Conspiracy — Story Bible

A second case for ZK Detective, designed as a proof that the engine is genre-agnostic. Where Meridian Manor is a classic murder mystery (Clue / Agatha Christie), Dry Creek is a **civic conspiracy** — environmental crime, small-town corruption, True Detective atmosphere.

> **Status**: Story and case JSON complete. Not yet wired into the app. Lives as `dry-creek.json` + `dry-creek.solution.json` alongside the active Meridian Manor case.

---

## What We Have

| Artifact | Path | Status |
|----------|------|--------|
| Case JSON (all content) | `zk-detective-frontend/src/data/cases/dry-creek.json` | Complete |
| Solution JSON | `zk-detective-frontend/src/data/cases/dry-creek.solution.json` | Complete |
| Commitment hash | `0x301468...1a6b` (embedded in case JSON) | Generated |
| Story Authoring Guide | `docs/STORY-AUTHORING-GUIDE.md` | Complete |
| Art assets | — | Not started |
| App wiring (imports, ID maps, hotspots) | — | Not started |

---

## The Mystery

Dry Creek's only water source — the underground aquifer feeding the town well — has been contaminated with industrial chemicals. People are getting sick. Livestock are dying. The state sent an investigator.

**This is NOT a murder.** Someone sabotaged the town's water supply. The detective must uncover **who**, **how**, and **where**.

### The Solution

| | Who | How | Where |
|-|-----|-----|-------|
| **Answer** | **Mayor Elena Voss** | **Forged Environmental Permit** | **The Old Mine** |

Elena Voss authorized illegal industrial waste dumping into the abandoned mine shaft — which connects to the town's aquifer. She forged an environmental permit to make it look legitimate, in exchange for a bribe from Beckman Mining Corp. When people started getting sick, she pressured the town doctor to misdiagnose and the sheriff to look the other way.

---

## Setting & Tone

A sun-bleached desert town, population 400 and shrinking. Main street has a cantina, a town hall, a clinic, and not much else. The old copper mine shut down years ago — or so everyone thinks.

**Tone**: Gritty realism. Dusty. Quiet tension. Everyone is polite but guarded. Think **True Detective S1** atmosphere meets **Chinatown**'s conspiracy.

Future inner monologue AI narrator examples:
- *"The mayor smiled too quickly. People who have nothing to hide don't rehearse their smiles."*
- *"Three weeks of bad water and nobody filed a complaint? This town isn't quiet. It's afraid."*

### The Hook (briefing text)

> "Dry Creek's water turned bad three weeks ago. By the time the state sent someone to look into it, half the town was on medication and the other half was packing their bags. You're the someone they sent. The mayor says it's natural. The doctor says it's the flu. The well says otherwise."

---

## Rooms (5)

```
        town_hall
       /         \
    cantina     well_house
       \         /
      clinic -- old_mine
```

| # | ID | Name | Abbr | Connections | Atmosphere | Start? |
|---|-----|------|------|-------------|------------|--------|
| 1 | `town_hall` | Town Hall | HAL | cantina, well_house | Faded civic pride. Peeling paint, dusty flags, rattling AC. | |
| 2 | `cantina` | The Cantina | CAN | town_hall, clinic | Dark wood, ceiling fans, cheap beer, a jukebox playing the same twelve songs. | **Yes** |
| 3 | `well_house` | The Well House | WEL | town_hall, old_mine | Concrete block building. Industrial pipes, pressure gauges, yellow-tinted water. | |
| 4 | `clinic` | The Clinic | CLN | cantina, old_mine | Fluorescent lights, too many chairs occupied, a locked filing cabinet. | |
| 5 | `old_mine` | The Old Mine | MIN | well_house, clinic | Chain-link fence cut and re-tied. Darkness, chemical smell, dripping water. | |

**Narrative labels** (result screen):
- town_hall → "Town Hall, behind closed doors"
- cantina → "the Cantina, where deals are whispered"
- well_house → "the Well House, where the water turned"
- clinic → "the Clinic, where the truth was medicated away"
- old_mine → "the Old Mine, where the poison entered the earth"

**Minimap positions** (180x120 SVG viewBox):
```json
{
  "town_hall":  { "x": 90,  "y": 18  },
  "cantina":    { "x": 30,  "y": 52  },
  "well_house": { "x": 150, "y": 52  },
  "clinic":     { "x": 50,  "y": 102 },
  "old_mine":   { "x": 130, "y": 102 }
}
```

---

## Suspects (9)

| # | ID | Name | Role | Room | Cover Story | Real Secret |
|---|-----|------|------|------|-------------|-------------|
| 1 | `elena` | Elena Voss | Mayor | town_hall | "I'm doing everything I can." | **CULPRIT.** Approved the dumping deal. Forged the permit. |
| 2 | `harlan` | Tom Harlan | Sheriff | town_hall | "Wells go bad. No foul play." | Knows the mayor is involved. Looking away for his pension. |
| 3 | `clara` | Clara Whitfield | Cantina Owner | cantina | "I just pour drinks." | Overheard Elena and Roy making the deal. Wrote it down. Afraid to speak. |
| 4 | `dale` | Dale Mercer | Rancher | cantina | "My cattle are dying." | Was offered a buyout for water rights before the crisis. Almost took it. |
| 5 | `ramirez` | Doc Ramirez | Town Doctor | clinic | "It's seasonal flu." | Elena threatened to defund the clinic unless he misdiagnosed. |
| 6 | `agnes` | Sister Agnes | Community Organizer | clinic | "We're praying for the town." | Found contamination docs in town hall dumpster. Hid them. |
| 7 | `ines` | Ines Fuentes | Water Engineer | well_house | "Readings are within parameters." | Filed a report months ago. It was buried. Has a copy. |
| 8 | `beckman` | Roy Beckman | Mining Company Rep | old_mine | "Routine property assessment." | Brokered the dumping deal. The corporate muscle. |
| 9 | `coyote` | Miguel "Coyote" Santos | Handyman / Drifter | old_mine | "I'm nobody." | SAW the barrels being dumped. Nobody believes him. |

**Distribution**: 2-2-1-2-2 (same pattern as Meridian Manor).

---

## Instruments / "Weapons" (5)

| # | ID | Name | Narrative Label |
|---|-----|------|-----------------|
| 1 | `forged_permit` | Forged Environmental Permit | a forged environmental impact permit, stamped with the state seal but never issued |
| 2 | `chemical_drums` | Industrial Chemical Drums | unmarked industrial chemical drums bearing mining company lot numbers |
| 3 | `bribe_ledger` | Offshore Bribe Ledger | a hidden ledger tracking monthly wire transfers from Beckman Mining Corp |
| 4 | `sealed_report` | Buried Water Quality Report | a suppressed water quality report showing contamination levels 40x above safe limits |
| 5 | `pipeline_valve` | Illegal Pipeline Valve | a concealed pipeline valve connecting the mine drainage to the town aquifer |

---

## Clues (11)

### By Room

**Town Hall** (3 clues):

| # | ID | Name | Key? | Related | Description |
|---|-----|------|------|---------|-------------|
| 1 | `redacted_minutes` | Redacted Council Minutes | **YES** | elena | Meeting minutes with sections blacked out. Redacted dates match when the water turned. |
| 2 | `campaign_funds` | Anonymous Campaign Donation | no | elena | Six-figure anonymous donation. Offshore bank routing number. |
| 3 | `resignation_draft` | Unsent Resignation Letter | **YES** | ines | Crumpled draft from Ines: "I cannot stay silent about what the readings show." Never sent. |

**Cantina** (2 clues):

| 4 | `overheard_note` | Clara's Notepad Entry | **YES** | elena | "E.V. + R.B. — back room — 11pm — 'the mine deal.' She promised 'nobody gets hurt.'" |
| 5 | `buyout_offer` | Rejected Buyout Letter | no | dale | $800K offer for Dale's water rights from "Beckman Development LLC." Unsigned. |

**Well House** (2 clues):

| 6 | `tampered_samples` | Diluted Water Samples | no | "" | Test tubes diluted with distilled water. The original sample glows yellow. **Red herring.** |
| 7 | `falsified_log` | Falsified Maintenance Log | no | elena | "Routine maintenance" entries with Ines's forged signature on dates she never visited. |

**Clinic** (2 clues):

| 8 | `blood_results` | Hidden Blood Test Results | **YES** | ramirez | Lab results: heavy metals 40x above safe levels. "INDUSTRIAL CONTAMINATION" crossed out, "seasonal influenza" written in. |
| 9 | `threatening_note` | Mayor's Threatening Note | **YES** | elena | "Keep writing flu diagnoses or the clinic loses its funding. — E.V." |

**Old Mine** (2 clues):

| 10 | `chemical_barrels` | Unmarked Chemical Barrels | **YES** | beckman | Dozens of rusted barrels. Lot numbers match Beckman Mining Corp. The source. |
| 11 | `forged_clearance` | Forged State Clearance | **YES** | elena | Environmental clearance document. Document number doesn't exist. Signature forged. |

### ZK Circuit Behavior

Clues with `related_suspect: "elena"` return `response_value: 1` (she's the culprit).
- elena (5 clues): redacted_minutes, campaign_funds, overheard_note, falsified_log, threatening_note, forged_clearance
- Others return 0: resignation_draft (ines), buyout_offer (dale), blood_results (ramirez), chemical_barrels (beckman), tampered_samples (red herring)

**Key evidence**: 7 of 11 clues (IDs 1, 3, 4, 8, 9, 10, 11).

---

## Dialogue Trees

Full dialogue for all 9 suspects. Each has three tiers: default, clue_triggered, confrontation.

### The Culprit: Elena Voss

- **Default**: Performative concern. "This town is my life. I've been on the phone with the state every day."
- **Clue-triggered**: Dismisses each piece of evidence. Redactions = "standard procedure." Campaign funds = "legal privacy." Clara's note = "gossip." Forged clearance = "someone framing us."
- **Confrontation** (`forged_clearance + redacted_minutes`): Confession. "The mine deal was supposed to save Dry Creek — jobs, tax revenue. Beckman promised the waste was inert. By the time the water turned, I'd already signed everything."

### Key Witnesses

- **Harlan** (Sheriff): "Wells go bad" → admits looking away when confronted with `redacted_minutes + falsified_log`. Pension-dependent.
- **Ramirez** (Doctor): "Seasonal flu" → breaks down with `blood_results + threatening_note`. "I told myself I was choosing the lesser harm."
- **Ines** (Engineer): "Within parameters" → reveals hidden readings with `resignation_draft + tampered_samples`. "The truth is behind the pressure gauge panel."
- **Beckman** (Mining Rep): "Routine assessment" → shifts blame to Elena with `chemical_barrels + overheard_note`. "She approached us, not the other way around."

### Color Suspects (no confrontation)

- **Clara**: Knows things, afraid to talk. Confirms the notepad entry when pressed.
- **Dale**: Angry rancher. Reveals the buyout letter context.
- **Agnes**: Community heart. Reacts with horror to the blood results.
- **Coyote**: The eyewitness nobody believes. Saw the trucks. Told everyone. Nobody listened.

---

## Epilogue

> "The permit was a fiction. The state seal, the approval signature, the document number — all fabricated by Elena Voss to give her deal with Beckman Mining a veneer of legality. For six months, industrial waste seeped through the mine shaft into the aquifer that sustained Dry Creek. The mayor who swore to protect her town poisoned it instead — not with her own hands, but with a pen. The redacted minutes, the silenced engineer, the coerced doctor, the compliant sheriff — every thread of the conspiracy led back to the same desk in Town Hall. The water of Dry Creek can be cleaned. The trust will take longer."

---

## Design Notes

### Why This Story Works for the Engine

1. **Genre proof**: Demonstrates the engine handles non-murder mysteries. The "weapon" is a forged document. The "crime scene" is a mine shaft. Nobody died (yet).
2. **Same structure**: 9 suspects, 5 rooms, 11 clues, 5 instruments — identical skeleton to Meridian Manor.
3. **Conspiracy web**: Unlike Meridian Manor (one killer, everyone else innocent), Dry Creek has a **conspiracy** — the mayor corrupted the sheriff, doctor, and engineer. Multiple confrontation scenes reveal different angles of the same cover-up.
4. **The outsider**: The player is a state investigator — an outsider in a tight-knit town. Everyone is polite but guarded. This creates natural tension in dialogue.
5. **The unheard witness**: Coyote saw everything but nobody believes him. His testimony becomes powerful once you have physical evidence to corroborate it.

### Story vs. Meridian Manor

| Aspect | Meridian Manor | Dry Creek |
|--------|---------------|-----------|
| Genre | Murder mystery | Civic conspiracy |
| Victim | A person (dead) | A town (poisoned) |
| Culprit motive | Insurance fraud | Bribery / corruption |
| "Weapon" | Poison vial | Forged permit |
| Tone | Gothic noir, mansion | Desert grit, Chinatown |
| Suspect dynamic | One killer, 8 innocent | One mastermind, 3 accomplices, 5 bystanders |
| Key tension | Who was in the room? | Who's covering for whom? |

---

## What's Needed to Ship

When ready to make this the active case:

1. **Art assets** — 5 room backgrounds, 9 suspect portraits, 11 clue icons, 5 weapon icons, 1 title image
2. **App wiring** — update imports, ID maps, clue IDs, asset paths, PixiJS hotspots (see Authoring Guide checklist, Section H)
3. **Case selector** (optional) — instead of swapping imports, build a case selection screen so both stories are playable

The `STORY-AUTHORING-GUIDE.md` Section H has the full 13-step checklist for wiring a new case into the app.

---

## ID Mappings (for reference)

When wiring into the app, these are the numeric IDs:

**Suspects**: elena=1, harlan=2, clara=3, dale=4, ramirez=5, agnes=6, ines=7, beckman=8, coyote=9

**Weapons**: forged_permit=1, chemical_drums=2, bribe_ledger=3, sealed_report=4, pipeline_valve=5

**Rooms**: town_hall=1, cantina=2, well_house=3, clinic=4, old_mine=5

**Clues**: redacted_minutes=1, campaign_funds=2, resignation_draft=3, overheard_note=4, buyout_offer=5, tampered_samples=6, falsified_log=7, blood_results=8, threatening_note=9, chemical_barrels=10, forged_clearance=11
