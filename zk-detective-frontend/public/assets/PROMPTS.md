# ZK Detective — Nano Banana Asset Prompts

> **34 prompts total** — 3 style probes (Phase 0) + 31 production assets (Phase 1).
> Feed each prompt to Nano Banana (or compatible image generator) one at a time.
> Every prompt includes the style anchor prefix for visual consistency.
> **Start with Phase 0** to validate the visual style before committing to the full batch.

---

## Style Anchor

Copy this as a prefix into every prompt:

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.

---

## Phase 0: Style Seeking (3 probes)

> **Goal:** Test the visual style across all 3 asset types before committing to 31 production generations.
> Each probe is identical to its final production counterpart, plus a meta-instruction for style calibration.
> If the style doesn't land, tweak the style anchor wording and re-run only these 3 probes.

### S1 — Scene Probe: The Study (800x450px)
- **Tests:** environment rendering, ink linework weight, watercolor wash density, lighting/shadow interplay, color palette accuracy
- **Why the Study:** richest visual elements (fireplace glow, bookshelves, scattered papers, whiskey decanter) — tests the most rendering challenges in one image

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> A dark wood-paneled study in a Victorian manor. A heavy mahogany desk covered in scattered documents and an open briefcase. A whiskey decanter and glass sit on a side table. A crackling fireplace casts flickering orange light. Floor-to-ceiling bookshelves line the walls. A crumpled note lies on the floor near the desk. Rich, heavy atmosphere with deep browns, amber, and gold. Viewed at an angle from the door. No text.
>
> *This is a style reference test. Focus on establishing: ink linework weight, watercolor wash density, color palette accuracy (#0a0a0f, #14141f, #e8e6e3, #d4a843, #c8463b, #2a9d8f), and overall 1920s noir mood.*

---

### S2 — Portrait Probe: Victor Ashford (400x500px)
- **Tests:** face/body detail, dramatic side-lighting, transparent background handling, gold accent rendering
- **Why Victor:** tailored suit + gold tie pin tests both the fine detail and the warm accent color system

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> Portrait of a middle-aged man in a sharp tailored suit with a silk tie. Clean-shaven, angular jawline, calculating dark eyes. Slicked-back hair. Confident but guarded expression — a man with secrets. Gold tie pin catches the light. Dramatic noir side-lighting. Bust/shoulder-up, 3/4 angle, looking slightly toward viewer. Ink linework with muted watercolor. Transparent background.
>
> *This is a style reference test. Focus on establishing: ink linework weight, watercolor wash density, color palette accuracy (#0a0a0f, #14141f, #e8e6e3, #d4a843, #c8463b, #2a9d8f), and overall 1920s noir mood.*

---

### S3 — Icon Probe: Poison Vial (200x200px)
- **Tests:** small-scale detail, object centering, crimson accent rendering, transparency
- **Why Poison Vial:** glass, liquid, vapor, and label detail all at 200px — if this reads clearly, all icons will work

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> A small glass vial with a cork stopper containing luminous green-purple liquid. A skull-and-crossbones label partially visible. Faint vapor wisps from the top. Crimson undertone accent. Centered on transparent background. 200x200px. Ink linework with watercolor.
>
> *This is a style reference test. Focus on establishing: ink linework weight, watercolor wash density, color palette accuracy (#0a0a0f, #14141f, #e8e6e3, #d4a843, #c8463b, #2a9d8f), and overall 1920s noir mood.*

---

> **CHECKPOINT:** Review the 3 style probes above. If the style matches the noir detective aesthetic (correct ink weight, watercolor density, palette accuracy, and 1920s mood), proceed to Phase 1. If adjustments are needed, tweak the style anchor wording and re-run the 3 probes before generating the full batch.

---

## Phase 1: Production Assets (31 prompts)

### A. TITLE SCREEN (1 asset)

### A1 — Meridian Manor Exterior
- **File:** `title/manor-exterior.png`
- **Size:** 800x500px

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> A grand Victorian manor at night seen from the front garden path. Moonlit sky with thin clouds. The mansion has ornate architecture with five visible windows — one glowing faintly gold (the bedroom). Wrought iron gates in foreground. Rose bushes and hedges line the stone path. Atmospheric fog at the ground level. Dark silhouette of the manor against a deep navy sky. Ink linework with watercolor washes in navy, charcoal, and gold. Cinematic wide shot. No text.

---

### B. ROOM ILLUSTRATIONS (5 assets)

### B1 — The Bedroom
- **File:** `rooms/bedroom.png`
- **Size:** 800x450px

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> A lavish master bedroom crime scene in a Victorian manor. Silk curtains frame a tall window overlooking a moonlit garden. An ornate nightstand with a shattered perfume bottle, its chemical residue visible. The bed is disheveled. Police tape or chalk outline subtly suggested. Dim golden lamplight casts long shadows across the room. Muted warm tones — cream, gold, deep shadows. Viewed from the doorway perspective. Atmospheric and unsettling. No text.

---

### B2 — The Kitchen
- **File:** `rooms/kitchen.png`
- **Size:** 800x450px

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> A professional Victorian manor kitchen at night. Copper pots hang from ceiling racks. A marble counter has a half-prepared dessert and two wine glasses — one with a suspicious residue. A magnetic knife rack on the wall has one conspicuous empty slot. Gas lamps cast warm amber light. Tile floor with checkerboard pattern. Warm but tense atmosphere. Viewed from the entrance. No text.

---

### B3 — The Study
- **File:** `rooms/study.png`
- **Size:** 800x450px

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> A dark wood-paneled study in a Victorian manor. A heavy mahogany desk covered in scattered documents and an open briefcase. A whiskey decanter and glass sit on a side table. A crackling fireplace casts flickering orange light. Floor-to-ceiling bookshelves line the walls. A crumpled note lies on the floor near the desk. Rich, heavy atmosphere with deep browns, amber, and gold. Viewed at an angle from the door. No text.

---

### B4 — The Lounge
- **File:** `rooms/lounge.png`
- **Size:** 800x450px

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> An elegant Victorian lounge at night. Deep velvet sofas arranged around a low table with an unfinished chess game. A fireplace with dying embers. A vintage rotary telephone sits on a side table with its receiver slightly off the hook. An empty medicine bottle sits near the phone. Crystal chandelier provides dim golden light. Tense, sophisticated atmosphere. Deep burgundy, navy, and gold tones. No text.

---

### B5 — The Garden
- **File:** `rooms/garden.png`
- **Size:** 800x450px

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> A moonlit Victorian manor garden at night. Stone path winding through manicured hedges and rose bushes. Muddy boot prints clearly visible on the path. A stone bench near the garden wall. The manor's bedroom window is visible in the background, lit faintly. A camera tripod sits abandoned near the roses. Cool teal and navy tones with moonlight silver highlights. Mysterious, exposed atmosphere. No text.

---

### C. SUSPECT PORTRAITS (9 assets)

All portraits: bust/shoulder-up, 3/4 angle, looking slightly toward viewer. Noir lighting with dramatic side light. Transparent PNG background.

### C1 — Victor Ashford, Business Partner
- **File:** `suspects/victor.png`
- **Size:** 400x500px

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> Portrait of a middle-aged man in a sharp tailored suit with a silk tie. Clean-shaven, angular jawline, calculating dark eyes. Slicked-back hair. Confident but guarded expression — a man with secrets. Gold tie pin catches the light. Dramatic noir side-lighting. Bust/shoulder-up, 3/4 angle, looking slightly toward viewer. Ink linework with muted watercolor. Transparent background.

---

### C2 — Elena Castillo, Personal Chef
- **File:** `suspects/elena.png`
- **Size:** 400x500px

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> Portrait of a woman in professional chef's whites with a clean apron. Dark hair pulled back neatly. Warm brown eyes with a kind but observant expression — she notices everything. Slight flour dust on her shoulder. Warm amber lighting from below suggesting kitchen warmth. Bust/shoulder-up, 3/4 angle, looking slightly toward viewer. Ink linework with muted watercolor. Transparent background.

---

### C3 — Dr. Marcus Webb, Family Doctor
- **File:** `suspects/marcus.png`
- **Size:** 400x500px

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> Portrait of a distinguished older man with gray temples and wire-rimmed glasses. Medical coat over a dress shirt. Tired, intelligent eyes with a hint of nervous energy. A stethoscope around his neck. Composed exterior masking anxiety. Cool clinical lighting. Bust/shoulder-up, 3/4 angle, looking slightly toward viewer. Ink linework with muted watercolor. Transparent background.

---

### C4 — Isabelle Fontaine, Art Dealer & Ex-Lover
- **File:** `suspects/isabelle.png`
- **Size:** 400x500px

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> Portrait of an elegant woman in a silk blouse and statement jewelry. Expressive dark eyes with visible grief behind a composed facade. Wavy hair falling past her shoulders. An artist's ring on her finger. Beautiful but haunted. Dramatic chiaroscuro lighting. Bust/shoulder-up, 3/4 angle, looking slightly toward viewer. Ink linework with muted watercolor. Transparent background.

---

### C5 — Thomas Grey, Groundskeeper
- **File:** `suspects/thomas.png`
- **Size:** 400x500px

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> Portrait of a weathered middle-aged man in work clothes — flannel shirt, rough hands. Strong jaw, deep-set eyes with a guarded, closed-off expression. Sun-damaged skin. A leaf or twig caught in his collar. Earthy, natural lighting with deep shadows. Bust/shoulder-up, 3/4 angle, looking slightly toward viewer. Ink linework with muted watercolor. Transparent background.

---

### C6 — Priya Sharma, Accountant
- **File:** `suspects/priya.png`
- **Size:** 400x500px

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> Portrait of a sharp-featured woman in professional business attire — blazer, crisp collar. Hair in a neat bun. Intelligent, analytical eyes behind stylish glasses. Precise and observant demeanor. She holds a pen like a weapon. Cool neutral lighting. Bust/shoulder-up, 3/4 angle, looking slightly toward viewer. Ink linework with muted watercolor. Transparent background.

---

### C7 — James Whitmore, Lawyer
- **File:** `suspects/james.png`
- **Size:** 400x500px

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> Portrait of a middle-aged man in an expensive three-piece suit. Distinguished bearing, silver at the temples. Calculating blue eyes. A legal pad barely visible at the bottom edge. The expression of a man who knows too much. Formal, slightly cold lighting. Bust/shoulder-up, 3/4 angle, looking slightly toward viewer. Ink linework with muted watercolor. Transparent background.

---

### C8 — Celeste Duval, Victim's Sister
- **File:** `suspects/celeste.png`
- **Size:** 400x500px

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> Portrait of a woman in formal dark clothing suggesting mourning. Delicate features, red-rimmed eyes from crying but maintaining dignity. A locket necklace. Devastated yet determined expression — she wants answers. Soft, melancholic side-lighting. Bust/shoulder-up, 3/4 angle, looking slightly toward viewer. Ink linework with muted watercolor. Transparent background.

---

### C9 — Ren Nakamura, Photographer & Guest
- **File:** `suspects/ren.png`
- **Size:** 400x500px

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> Portrait of a young man with an artistic, casual look — open collar shirt, camera strap visible at the shoulder. Sharp perceptive eyes, slightly messy hair. An outsider who sees everything through a lens. Creative energy meets quiet observation. Natural mixed lighting. Bust/shoulder-up, 3/4 angle, looking slightly toward viewer. Ink linework with muted watercolor. Transparent background.

---

### D. CLUE ITEM ICONS (11 assets)

All clue icons: centered object on transparent background, 200x200px. Noir illustration style with gold accent glow on KEY EVIDENCE items.

### D1 — Broken Perfume Bottle (KEY EVIDENCE)
- **File:** `clues/perfume-bottle.png`
- **Size:** 200x200px
- **Game ID:** `perfume_bottle`

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> A shattered ornate glass perfume bottle with its gold stopper displaced. Amber liquid pooling beneath. A faint chemical vapor rising. Gold accent glow around the object suggesting key evidence. Centered on transparent background. 200x200px icon style. Ink linework with watercolor.

---

### D2 — Smudged Fingerprints
- **File:** `clues/fingerprints.png`
- **Size:** 200x200px
- **Game ID:** `smudged_fingerprints`

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> A glass surface or doorknob showing multiple overlapping smudged fingerprints. Dusting powder residue visible. The prints are blurred and partial. Centered on transparent background. 200x200px icon style. Ink linework with muted watercolor.

---

### D3 — Torn Business Letter
- **File:** `clues/torn-letter.png`
- **Size:** 200x200px
- **Game ID:** `torn_letter`

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> A torn piece of formal letterhead with visible handwriting. The paper has ragged torn edges. A wax seal is partially visible. Cream paper with blue-black ink. Centered on transparent background. 200x200px icon style. Ink linework with watercolor.

---

### D4 — Wine Glass with Residue
- **File:** `clues/wine-glass.png`
- **Size:** 200x200px
- **Game ID:** `wine_glass`

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> An elegant wine glass with a suspicious discolored residue coating the inside bottom. The glass is half-empty with a dark ring stain. Centered on transparent background. 200x200px icon style. Ink linework with watercolor.

---

### D5 — Missing Chef's Knife (the gap)
- **File:** `clues/missing-knife.png`
- **Size:** 200x200px
- **Game ID:** `missing_knife`

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> A magnetic knife rack mounted on tile wall with several chef's knives — and one conspicuous empty slot. The outline/shadow of the missing knife is visible. Centered on transparent background. 200x200px icon style. Ink linework with watercolor.

---

### D6 — Insurance Documents (KEY EVIDENCE)
- **File:** `clues/insurance-docs.png`
- **Size:** 200x200px
- **Game ID:** `insurance_docs`

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> An open leather briefcase with insurance policy documents spilling out. Numbers and legal text partially visible on cream paper. Gold accent glow suggesting key evidence. Centered on transparent background. 200x200px icon style. Ink linework with watercolor.

---

### D7 — Crumpled Note (KEY EVIDENCE)
- **File:** `clues/crumpled-note.png`
- **Size:** 200x200px
- **Game ID:** `crumpled_note`

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> A crumpled handwritten note on cream paper. Hasty, emotional handwriting partially legible. The paper has deep creases and wrinkles. Gold accent glow suggesting key evidence. Centered on transparent background. 200x200px icon style. Ink linework with watercolor.

---

### D8 — Phone Records (KEY EVIDENCE)
- **File:** `clues/phone-records.png`
- **Size:** 200x200px
- **Game ID:** `phone_records`

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> A vintage rotary telephone with a paper call log or printout draped over it. Times and phone numbers visible on the paper strip. Gold accent glow suggesting key evidence. Centered on transparent background. 200x200px icon style. Ink linework with watercolor.

---

### D9 — Empty Medicine Bottle
- **File:** `clues/medicine-bottle.png`
- **Size:** 200x200px
- **Game ID:** `medicine_bottle`

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> A prescription medicine bottle lying on its side, empty and open. The label shows a name and dosage (illegible but suggested). The cap is off nearby. Centered on transparent background. 200x200px icon style. Ink linework with watercolor.

---

### D10 — Muddy Footprints
- **File:** `clues/muddy-footprints.png`
- **Size:** 200x200px
- **Game ID:** `muddy_footprints`

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> A pair of muddy boot prints on stone — clearly showing a distinctive sole pattern. Mud spatters around the prints. Earth-toned browns against gray stone. Centered on transparent background. 200x200px icon style. Ink linework with watercolor.

---

### D11 — Camera with Photos (KEY EVIDENCE)
- **File:** `clues/camera-photos.png`
- **Size:** 200x200px
- **Game ID:** `camera_photos`

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> A vintage film camera with a developed photograph partially sliding out. The photo shows a garden scene at dusk with a timestamp. Gold accent glow suggesting key evidence. Centered on transparent background. 200x200px icon style. Ink linework with watercolor.

---

### E. WEAPON ICONS (5 assets)

All weapon icons: centered object on transparent background, 200x200px. Dramatic noir lighting, crimson tint/accent.

### E1 — Poison Vial
- **File:** `weapons/poison-vial.png`
- **Size:** 200x200px
- **Game ID:** `poison_vial`

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> A small glass vial with a cork stopper containing luminous green-purple liquid. A skull-and-crossbones label partially visible. Faint vapor wisps from the top. Crimson undertone accent. Centered on transparent background. 200x200px. Ink linework with watercolor.

---

### E2 — Kitchen Knife
- **File:** `weapons/kitchen-knife.png`
- **Size:** 200x200px
- **Game ID:** `kitchen_knife`

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> A sharp professional chef's knife with a polished steel blade reflecting dim light. Dark wooden handle with rivets. The blade edge catches a glint of light. Crimson undertone accent. Centered on transparent background. 200x200px. Ink linework with watercolor.

---

### E3 — Candlestick
- **File:** `weapons/candlestick.png`
- **Size:** 200x200px
- **Game ID:** `candlestick`

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> An ornate silver candlestick with heavy base, no candle. Decorative baroque engravings on the stem. The heavy base suggests it could be a weapon. Crimson undertone accent. Centered on transparent background. 200x200px. Ink linework with watercolor.

---

### E4 — Letter Opener
- **File:** `weapons/letter-opener.png`
- **Size:** 200x200px
- **Game ID:** `letter_opener`

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> An ornate metal letter opener with a decorative handle featuring a lion's head pommel. The blade is thin and pointed. Antique brass finish. Crimson undertone accent. Centered on transparent background. 200x200px. Ink linework with watercolor.

---

### E5 — Garden Shears
- **File:** `weapons/garden-shears.png`
- **Size:** 200x200px
- **Game ID:** `garden_shears`

**Prompt:**

> **Style:** Dark noir detective illustration, ink linework with muted watercolor washes. Color palette: near-black backgrounds (#0a0a0f), deep navy surfaces (#14141f), warm cream highlights (#e8e6e3), antique gold accents (#d4a843), deep crimson (#c8463b), muted teal (#2a9d8f). 1920s murder mystery atmosphere. Moody lighting with strong shadows. Transparent PNG where noted.
>
> Heavy-duty garden pruning shears with long metal blades and wooden handles. A spot of rust on one blade. Dirt on the handles. Crimson undertone accent. Centered on transparent background. 200x200px. Ink linework with watercolor.

---

## Asset Checklist

| # | Category | Asset | File | Size | Key? |
|---|----------|-------|------|------|------|
| S1 | STYLE PROBE | Scene: The Study | *(same as B3)* | 800x450 | - |
| S2 | STYLE PROBE | Portrait: Victor Ashford | *(same as C1)* | 400x500 | - |
| S3 | STYLE PROBE | Icon: Poison Vial | *(same as E1)* | 200x200 | - |
| A1 | Title | Manor Exterior | `title/manor-exterior.png` | 800x500 | - |
| B1 | Room | Bedroom | `rooms/bedroom.png` | 800x450 | - |
| B2 | Room | Kitchen | `rooms/kitchen.png` | 800x450 | - |
| B3 | Room | Study | `rooms/study.png` | 800x450 | - |
| B4 | Room | Lounge | `rooms/lounge.png` | 800x450 | - |
| B5 | Room | Garden | `rooms/garden.png` | 800x450 | - |
| C1 | Suspect | Victor Ashford | `suspects/victor.png` | 400x500 | - |
| C2 | Suspect | Elena Castillo | `suspects/elena.png` | 400x500 | - |
| C3 | Suspect | Dr. Marcus Webb | `suspects/marcus.png` | 400x500 | - |
| C4 | Suspect | Isabelle Fontaine | `suspects/isabelle.png` | 400x500 | - |
| C5 | Suspect | Thomas Grey | `suspects/thomas.png` | 400x500 | - |
| C6 | Suspect | Priya Sharma | `suspects/priya.png` | 400x500 | - |
| C7 | Suspect | James Whitmore | `suspects/james.png` | 400x500 | - |
| C8 | Suspect | Celeste Duval | `suspects/celeste.png` | 400x500 | - |
| C9 | Suspect | Ren Nakamura | `suspects/ren.png` | 400x500 | - |
| D1 | Clue | Broken Perfume Bottle | `clues/perfume-bottle.png` | 200x200 | KEY |
| D2 | Clue | Smudged Fingerprints | `clues/fingerprints.png` | 200x200 | - |
| D3 | Clue | Torn Business Letter | `clues/torn-letter.png` | 200x200 | - |
| D4 | Clue | Wine Glass with Residue | `clues/wine-glass.png` | 200x200 | - |
| D5 | Clue | Missing Chef's Knife | `clues/missing-knife.png` | 200x200 | - |
| D6 | Clue | Insurance Documents | `clues/insurance-docs.png` | 200x200 | KEY |
| D7 | Clue | Crumpled Note | `clues/crumpled-note.png` | 200x200 | KEY |
| D8 | Clue | Phone Records | `clues/phone-records.png` | 200x200 | KEY |
| D9 | Clue | Empty Medicine Bottle | `clues/medicine-bottle.png` | 200x200 | - |
| D10 | Clue | Muddy Footprints | `clues/muddy-footprints.png` | 200x200 | - |
| D11 | Clue | Camera with Photos | `clues/camera-photos.png` | 200x200 | KEY |
| E1 | Weapon | Poison Vial | `weapons/poison-vial.png` | 200x200 | - |
| E2 | Weapon | Kitchen Knife | `weapons/kitchen-knife.png` | 200x200 | - |
| E3 | Weapon | Candlestick | `weapons/candlestick.png` | 200x200 | - |
| E4 | Weapon | Letter Opener | `weapons/letter-opener.png` | 200x200 | - |
| E5 | Weapon | Garden Shears | `weapons/garden-shears.png` | 200x200 | - |
