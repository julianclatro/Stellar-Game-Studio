// F01: Case Data System — Solution Commitment
// Generates keccak256 commitment hash from (suspect, weapon, room, salt).
// Must match the on-chain verification in the detective contract (F08).

import { keccak_256 } from '@noble/hashes/sha3.js';
import type { Solution } from './types';
import { SUSPECT_IDS, WEAPON_IDS, ROOM_IDS } from './id-maps';

/**
 * Generate a commitment hash for a case solution.
 *
 * Format: keccak256(suspect_id_utf8 || weapon_id_utf8 || room_id_utf8 || salt_utf8)
 *
 * This hash is stored on-chain. When a player makes an accusation,
 * the ZK proof verifies their guess matches this commitment without
 * revealing the answer to other players.
 */
export function generateCommitment(solution: Solution, salt: string): Uint8Array {
  const encoder = new TextEncoder();
  const suspectBytes = encoder.encode(solution.suspect);
  const weaponBytes = encoder.encode(solution.weapon);
  const roomBytes = encoder.encode(solution.room);
  const saltBytes = encoder.encode(salt);

  const data = new Uint8Array(
    suspectBytes.length + weaponBytes.length + roomBytes.length + saltBytes.length
  );
  let offset = 0;
  data.set(suspectBytes, offset); offset += suspectBytes.length;
  data.set(weaponBytes, offset);  offset += weaponBytes.length;
  data.set(roomBytes, offset);    offset += roomBytes.length;
  data.set(saltBytes, offset);

  return keccak_256(data);
}

/** Convert commitment bytes to hex string (0x-prefixed) */
export function commitmentToHex(commitment: Uint8Array): string {
  return '0x' + Array.from(commitment).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Verify that a guess matches a commitment hash */
export function verifyCommitment(
  guess: Solution,
  salt: string,
  expectedCommitment: Uint8Array
): boolean {
  const computed = generateCommitment(guess, salt);
  if (computed.length !== expectedCommitment.length) return false;
  return computed.every((byte, i) => byte === expectedCommitment[i]);
}

/**
 * Convert a text salt to a zero-padded 32-byte array.
 * Matches the Soroban contract's BytesN<32> salt parameter.
 */
export function textSaltToBytes32(textSalt: string): Uint8Array {
  const encoder = new TextEncoder();
  const utf8 = encoder.encode(textSalt);
  const bytes32 = new Uint8Array(32);
  bytes32.set(utf8.slice(0, 32));
  return bytes32;
}

/**
 * Generate a contract-compatible commitment hash.
 *
 * Format: keccak256(suspect_id_u32_be || weapon_id_u32_be || room_id_u32_be || salt_32bytes)
 *
 * This matches the Soroban contract's compute_commitment() in lib.rs:130-144,
 * which encodes each u32 as 4-byte big-endian and uses a BytesN<32> salt.
 * Total preimage: 4 + 4 + 4 + 32 = 44 bytes.
 */
export function generateContractCommitment(
  solution: Solution,
  salt32bytes: Uint8Array
): Uint8Array {
  const suspectId = SUSPECT_IDS[solution.suspect];
  const weaponId = WEAPON_IDS[solution.weapon];
  const roomId = ROOM_IDS[solution.room];

  if (suspectId === undefined) throw new Error(`Unknown suspect: ${solution.suspect}`);
  if (weaponId === undefined) throw new Error(`Unknown weapon: ${solution.weapon}`);
  if (roomId === undefined) throw new Error(`Unknown room: ${solution.room}`);
  if (salt32bytes.length !== 32) throw new Error(`Salt must be 32 bytes, got ${salt32bytes.length}`);

  const data = new Uint8Array(44); // 4 + 4 + 4 + 32
  const view = new DataView(data.buffer);
  view.setUint32(0, suspectId, false);  // big-endian
  view.setUint32(4, weaponId, false);
  view.setUint32(8, roomId, false);
  data.set(salt32bytes, 12);

  return keccak_256(data);
}
