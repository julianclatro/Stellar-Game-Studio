// F07: Numeric clue ID mappings for ZK circuit compatibility
// Each clue in the case gets a stable numeric ID for use as a Field element
// in the clue-verify Noir circuit.

export const CLUE_IDS: Record<string, number> = {
  // Bedroom clues
  perfume_bottle: 1,
  smudged_fingerprints: 2,
  torn_letter: 3,
  // Study clues
  insurance_docs: 4,
  crumpled_note: 5,
  // Lounge clues
  phone_records: 6,
  medicine_bottle: 7,
  // Kitchen clues
  wine_glass: 8,
  missing_knife: 9,
  // Garden clues
  muddy_footprints: 10,
  camera_photos: 11,
};

export const CLUE_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(CLUE_IDS).map(([k, v]) => [v, k])
);

/** Convert a clue string ID to its numeric circuit ID */
export function clueToNumeric(clueId: string): number {
  const id = CLUE_IDS[clueId];
  if (id === undefined) throw new Error(`Unknown clue: ${clueId}`);
  return id;
}

/** Convert a numeric clue ID back to its string ID */
export function numericToClue(id: number): string {
  const name = CLUE_NAMES[id];
  if (!name) throw new Error(`Unknown clue ID: ${id}`);
  return name;
}
