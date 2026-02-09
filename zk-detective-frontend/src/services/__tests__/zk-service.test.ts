import { describe, it, expect, beforeAll } from 'vitest';
import { Noir } from '@noir-lang/noir_js';
import circuit from '../../../../circuits/accusation/target/accusation.json';
import { solutionToNumeric, numericToSolution } from '../../data/id-maps';

// Pre-computed commitment for solution (1, 1, 1) with salt "12345"
// Generated via: nargo execute on circuits/compute_commitment
const TEST_COMMITMENT = '0x0325401f14dc80ecd8223dd78c9bc1b5729fa819618112fbcad4f5bdaf7ed337';
const TEST_SALT = '12345';

describe('ZK Accusation Circuit (Noir.js Execution)', () => {
  let noir: Noir;

  beforeAll(async () => {
    noir = new Noir(circuit as any);
  }, 30000);

  it('circuit JSON has correct ABI', () => {
    const params = (circuit as any).abi.parameters.map((p: any) => p.name);
    expect(params).toEqual([
      'solution_suspect', 'solution_weapon', 'solution_room', 'salt',
      'commitment', 'accused_suspect', 'accused_weapon', 'accused_room',
    ]);
    expect((circuit as any).abi.return_type.abi_type.kind).toBe('boolean');
  });

  it('correct accusation returns true', async () => {
    const { returnValue } = await noir.execute({
      solution_suspect: '1', solution_weapon: '1', solution_room: '1',
      salt: TEST_SALT, commitment: TEST_COMMITMENT,
      accused_suspect: '1', accused_weapon: '1', accused_room: '1',
    });
    expect(returnValue).toBe(true);
  }, 30000);

  it('wrong suspect returns false', async () => {
    const { returnValue } = await noir.execute({
      solution_suspect: '1', solution_weapon: '1', solution_room: '1',
      salt: TEST_SALT, commitment: TEST_COMMITMENT,
      accused_suspect: '2', accused_weapon: '1', accused_room: '1',
    });
    expect(returnValue).toBe(false);
  }, 30000);

  it('wrong weapon returns false', async () => {
    const { returnValue } = await noir.execute({
      solution_suspect: '1', solution_weapon: '1', solution_room: '1',
      salt: TEST_SALT, commitment: TEST_COMMITMENT,
      accused_suspect: '1', accused_weapon: '3', accused_room: '1',
    });
    expect(returnValue).toBe(false);
  }, 30000);

  it('wrong room returns false', async () => {
    const { returnValue } = await noir.execute({
      solution_suspect: '1', solution_weapon: '1', solution_room: '1',
      salt: TEST_SALT, commitment: TEST_COMMITMENT,
      accused_suspect: '1', accused_weapon: '1', accused_room: '5',
    });
    expect(returnValue).toBe(false);
  }, 30000);

  it('all wrong returns false', async () => {
    const { returnValue } = await noir.execute({
      solution_suspect: '1', solution_weapon: '1', solution_room: '1',
      salt: TEST_SALT, commitment: TEST_COMMITMENT,
      accused_suspect: '9', accused_weapon: '5', accused_room: '5',
    });
    expect(returnValue).toBe(false);
  }, 30000);

  it('invalid commitment rejects execution', async () => {
    await expect(noir.execute({
      solution_suspect: '1', solution_weapon: '1', solution_room: '1',
      salt: TEST_SALT, commitment: '999999',
      accused_suspect: '1', accused_weapon: '1', accused_room: '1',
    })).rejects.toThrow();
  }, 30000);

  it('generates witness for correct accusation', async () => {
    const { witness } = await noir.execute({
      solution_suspect: '1', solution_weapon: '1', solution_room: '1',
      salt: TEST_SALT, commitment: TEST_COMMITMENT,
      accused_suspect: '1', accused_weapon: '1', accused_room: '1',
    });
    expect(witness).toBeDefined();
    // Witness is a typed array or map-like structure
    expect(witness).toBeTruthy();
  }, 30000);
});

// Note: Proof generation/verification tests use the bb CLI (see scripts/test-proof.sh)
// because UltraHonkBackend requires WASM workers that only work in browser contexts.
// The full proof pipeline is validated via:
//   nargo execute -> bb prove -> bb verify

describe('ID Mapping', () => {
  it('converts Meridian Manor solution to numeric', () => {
    expect(solutionToNumeric({
      suspect: 'victor', weapon: 'poison_vial', room: 'bedroom',
    })).toEqual({ suspect: 1, weapon: 1, room: 1 });
  });

  it('round-trips all suspects', () => {
    const suspects = ['victor', 'elena', 'marcus', 'isabelle', 'thomas', 'priya', 'james', 'celeste', 'ren'];
    suspects.forEach((s, i) => {
      const numeric = solutionToNumeric({ suspect: s, weapon: 'poison_vial', room: 'bedroom' });
      expect(numeric.suspect).toBe(i + 1);
      const back = numericToSolution({ suspect: i + 1, weapon: 1, room: 1 });
      expect(back.suspect).toBe(s);
    });
  });

  it('round-trips all weapons', () => {
    const weapons = ['poison_vial', 'kitchen_knife', 'candlestick', 'letter_opener', 'garden_shears'];
    weapons.forEach((w, i) => {
      const numeric = solutionToNumeric({ suspect: 'victor', weapon: w, room: 'bedroom' });
      expect(numeric.weapon).toBe(i + 1);
    });
  });

  it('round-trips all rooms', () => {
    const rooms = ['bedroom', 'kitchen', 'study', 'lounge', 'garden'];
    rooms.forEach((r, i) => {
      const numeric = solutionToNumeric({ suspect: 'victor', weapon: 'poison_vial', room: r });
      expect(numeric.room).toBe(i + 1);
    });
  });

  it('rejects unknown suspect', () => {
    expect(() => solutionToNumeric({ suspect: 'ghost', weapon: 'poison_vial', room: 'bedroom' }))
      .toThrow('Unknown suspect: ghost');
  });

  it('rejects unknown weapon', () => {
    expect(() => solutionToNumeric({ suspect: 'victor', weapon: 'ray_gun', room: 'bedroom' }))
      .toThrow('Unknown weapon: ray_gun');
  });

  it('rejects unknown room', () => {
    expect(() => solutionToNumeric({ suspect: 'victor', weapon: 'poison_vial', room: 'dungeon' }))
      .toThrow('Unknown room: dungeon');
  });

  it('rejects unknown numeric ID', () => {
    expect(() => numericToSolution({ suspect: 99, weapon: 1, room: 1 }))
      .toThrow('Unknown suspect ID: 99');
  });
});
