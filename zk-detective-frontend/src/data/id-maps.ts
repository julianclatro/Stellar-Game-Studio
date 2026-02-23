// F06: Numeric ID mappings for ZK circuit compatibility
// The Noir circuit operates on Field elements (numbers), but case data
// uses string IDs. These bidirectional maps bridge the two worlds.

export const SUSPECT_IDS: Record<string, number> = {
  victor: 1,
  elena: 2,
  marcus: 3,
  isabelle: 4,
  thomas: 5,
  priya: 6,
  james: 7,
  celeste: 8,
  ren: 9,
};

export const WEAPON_IDS: Record<string, number> = {
  poison_vial: 1,
  kitchen_knife: 2,
  candlestick: 3,
  letter_opener: 4,
  garden_shears: 5,
};

export const ROOM_IDS: Record<string, number> = {
  bedroom: 1,
  kitchen: 2,
  study: 3,
  lounge: 4,
  garden: 5,
};

// Reverse lookups (number -> string)
export const SUSPECT_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(SUSPECT_IDS).map(([k, v]) => [v, k])
);

export const WEAPON_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(WEAPON_IDS).map(([k, v]) => [v, k])
);

export const ROOM_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(ROOM_IDS).map(([k, v]) => [v, k])
);

/** Convert a string-based solution to numeric IDs for the ZK circuit */
export function solutionToNumeric(solution: {
  suspect: string;
  weapon: string;
  room: string;
}): { suspect: number; weapon: number; room: number } {
  const suspect = SUSPECT_IDS[solution.suspect];
  const weapon = WEAPON_IDS[solution.weapon];
  const room = ROOM_IDS[solution.room];

  if (suspect === undefined) throw new Error(`Unknown suspect: ${solution.suspect}`);
  if (weapon === undefined) throw new Error(`Unknown weapon: ${solution.weapon}`);
  if (room === undefined) throw new Error(`Unknown room: ${solution.room}`);

  return { suspect, weapon, room };
}

/** Convert numeric IDs back to string-based solution */
export function numericToSolution(ids: {
  suspect: number;
  weapon: number;
  room: number;
}): { suspect: string; weapon: string; room: string } {
  const suspect = SUSPECT_NAMES[ids.suspect];
  const weapon = WEAPON_NAMES[ids.weapon];
  const room = ROOM_NAMES[ids.room];

  if (!suspect) throw new Error(`Unknown suspect ID: ${ids.suspect}`);
  if (!weapon) throw new Error(`Unknown weapon ID: ${ids.weapon}`);
  if (!room) throw new Error(`Unknown room ID: ${ids.room}`);

  return { suspect, weapon, room };
}
