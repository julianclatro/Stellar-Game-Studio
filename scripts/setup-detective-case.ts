#!/usr/bin/env bun
// F09: One-time case setup script for ZK Detective on testnet.
//
// Computes the keccak256 commitment matching the contract's encoding
// (u32 big-endian IDs + 32-byte zero-padded salt) and calls create_case().
//
// Usage: bun run scripts/setup-detective-case.ts
//
// Prerequisites:
//   - ZK Detective contract deployed (VITE_ZK_DETECTIVE_CONTRACT_ID in .env)
//   - Admin secret key in .env (VITE_DEV_ADMIN_SECRET)

import { keccak_256 } from '@noble/hashes/sha3.js';
import { execSync } from 'child_process';
import { readEnvFile } from './utils/env';

// Load env from repo root
const env = await readEnvFile('.env');

// ── Case 1: Meridian Manor ──────────────────────────────────────────────
const CASE_ID = 1;
const SUSPECT_ID = 1; // victor
const WEAPON_ID = 1;  // poison_vial
const ROOM_ID = 1;    // bedroom
const SALT_TEXT = 'meridian_manor_salt_v1';

// ── Build commitment matching contract's compute_commitment() ───────────
function buildCommitment(): string {
  const data = new Uint8Array(44); // 4+4+4+32
  const view = new DataView(data.buffer);
  view.setUint32(0, SUSPECT_ID, false); // big-endian
  view.setUint32(4, WEAPON_ID, false);
  view.setUint32(8, ROOM_ID, false);

  // Zero-padded 32-byte salt
  const encoder = new TextEncoder();
  const saltUtf8 = encoder.encode(SALT_TEXT);
  data.set(saltUtf8.slice(0, 32), 12);

  const hash = keccak_256(data);
  return Buffer.from(hash).toString('hex');
}

// ── Main ────────────────────────────────────────────────────────────────
const contractId = env.VITE_ZK_DETECTIVE_CONTRACT_ID;
const adminSecret = env.VITE_DEV_ADMIN_SECRET;
const rpcUrl = env.VITE_SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org';
const networkPassphrase = env.VITE_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015';

if (!contractId) {
  console.error('Error: VITE_ZK_DETECTIVE_CONTRACT_ID not set in .env');
  console.error('Run: bun run deploy zk-detective');
  process.exit(1);
}

if (!adminSecret) {
  console.error('Error: VITE_DEV_ADMIN_SECRET not set in .env');
  process.exit(1);
}

const commitmentHex = buildCommitment();
console.log(`Case ${CASE_ID} commitment: ${commitmentHex}`);
console.log(`  suspect_id=${SUSPECT_ID} weapon_id=${WEAPON_ID} room_id=${ROOM_ID}`);
console.log(`  salt="${SALT_TEXT}" (zero-padded to 32 bytes)`);
console.log(`  contract=${contractId}`);

// Call create_case via stellar CLI
const cmd = [
  'stellar contract invoke',
  `--id ${contractId}`,
  `--source ${adminSecret}`,
  `--rpc-url ${rpcUrl}`,
  `--network-passphrase "${networkPassphrase}"`,
  '-- create_case',
  `--case_id ${CASE_ID}`,
  `--commitment ${commitmentHex}`,
].join(' ');

console.log('\nInvoking create_case...');
try {
  const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
  console.log('Success!', output.trim());
} catch (err: any) {
  if (err.stderr?.includes('CaseAlreadyExists')) {
    console.log('Case already exists on-chain (OK, skipping).');
  } else {
    console.error('Failed:', err.stderr || err.message);
    process.exit(1);
  }
}
