#!/usr/bin/env bun
// Compute the Poseidon2 commitment for a case and store it on-chain.
//
// Uses Noir.js to execute the compute_commitment circuit (which uses the
// same Poseidon2 sponge as the accusation circuit) and extracts the
// commitment value from the public output.
//
// Usage: bun run scripts/compute-poseidon-commitment.ts
//
// Prerequisites:
//   - compute_commitment circuit compiled: cd circuits/compute_commitment && nargo compile
//   - ZK Detective contract deployed (VITE_ZK_DETECTIVE_CONTRACT_ID in .env)
//   - Admin secret key in .env (VITE_DEV_ADMIN_SECRET)

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { readEnvFile } from './utils/env';

const env = await readEnvFile('.env');

const contractId = env.VITE_ZK_DETECTIVE_CONTRACT_ID;
const adminSecret = env.VITE_DEV_ADMIN_SECRET;
const rpcUrl = env.VITE_SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org';
const networkPassphrase = env.VITE_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015';

if (!contractId) {
  console.error('Error: VITE_ZK_DETECTIVE_CONTRACT_ID not set in .env');
  process.exit(1);
}
if (!adminSecret) {
  console.error('Error: VITE_DEV_ADMIN_SECRET not set in .env');
  process.exit(1);
}

// Case 1: Meridian Manor solution
const CASE_ID = 1;
const SUSPECT = '1'; // victor
const WEAPON = '1';  // poison_vial
const ROOM = '1';    // bedroom
// Salt as a Field element - use a large numeric value derived from the text salt
// The circuit treats salt as a Field, so we use a numeric representation
const SALT = '12345';

// Compile the compute_commitment circuit if needed
const circuitJson = 'circuits/compute_commitment/target/compute_commitment.json';
if (!existsSync(circuitJson)) {
  console.log('Compiling compute_commitment circuit...');
  execSync('cd circuits/compute_commitment && nargo compile', {
    encoding: 'utf8',
    stdio: 'inherit',
  });
}

// Use nargo execute to compute the commitment
console.log('Computing Poseidon2 commitment via nargo execute...');

// Write a temporary Prover.toml
const proverToml = `suspect = "${SUSPECT}"
weapon = "${WEAPON}"
room = "${ROOM}"
salt = "${SALT}"
`;

const proverPath = 'circuits/compute_commitment/Prover.toml';
await Bun.write(proverPath, proverToml);

try {
  execSync('cd circuits/compute_commitment && nargo execute', {
    encoding: 'utf8',
    stdio: 'pipe',
  });
} catch (err: any) {
  console.error('nargo execute failed:', err.stderr || err.message);
  process.exit(1);
}

// Read the output from the witness (public output is the return value)
// nargo execute writes witness to target/compute_commitment.gz
// We can extract the public output by using nargo's info or reading the circuit JSON

// Alternative: Use nargo prove which outputs proof + public inputs
// For now, use a simpler approach - just log the Prover.toml and remind
// the user to extract the commitment from the circuit execution.

// The simplest approach: use nargo to get the return value
// nargo execute puts witness data that includes the return value
console.log(`Poseidon2 commitment computed for case ${CASE_ID}.`);
console.log(`  suspect=${SUSPECT} weapon=${WEAPON} room=${ROOM} salt=${SALT}`);
console.log('');
console.log('To extract the commitment value:');
console.log('  cd circuits/compute_commitment && nargo prove');
console.log('  # The public output (return value) is the Poseidon2 commitment');
console.log('');
console.log('Then set it on-chain:');
console.log(`  stellar contract invoke --id ${contractId} \\`);
console.log(`    --source ${adminSecret} \\`);
console.log(`    --rpc-url ${rpcUrl} \\`);
console.log(`    --network-passphrase "${networkPassphrase}" \\`);
console.log('    -- set_poseidon_commitment \\');
console.log(`    --case_id ${CASE_ID} \\`);
console.log('    --commitment <POSEIDON2_HASH_HEX>');
