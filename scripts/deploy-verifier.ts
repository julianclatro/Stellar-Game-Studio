#!/usr/bin/env bun
// Deploy the UltraHonk verifier contract and configure the ZK Detective contract.
//
// Steps:
//   1. Build the verifier WASM
//   2. Read the verification key from circuits/accusation/target/vk
//   3. Deploy the verifier contract with VK as constructor argument
//   4. Call set_verifier on the ZK Detective contract
//
// Usage: bun run scripts/deploy-verifier.ts
//
// Prerequisites:
//   - Accusation circuit compiled and VK generated:
//     cd circuits/accusation && nargo compile
//     bb write_vk -b ./target/accusation.json -s ultra_honk --oracle_hash keccak -o ./target/vk
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

// 1. Build verifier WASM
console.log('Building ultrahonk-verifier contract...');
execSync('stellar contract build -p ultrahonk-verifier', {
  encoding: 'utf8',
  stdio: 'inherit',
});

// 2. Read VK bytes
// bb write_vk outputs to a directory: target/vk/vk
const vkPath = 'circuits/accusation/target/vk/vk';
if (!existsSync(vkPath)) {
  console.error(`Error: VK not found at ${vkPath}`);
  console.error('Generate it with:');
  console.error('  cd circuits/accusation && nargo compile');
  console.error('  bb write_vk -b ./target/accusation.json -s ultra_honk --oracle_hash keccak -o ./target/vk');
  process.exit(1);
}

const vkBytes = readFileSync(vkPath);
const vkHex = Buffer.from(vkBytes).toString('hex');
console.log(`VK loaded: ${vkBytes.length} bytes`);

// 3. Deploy verifier contract
const wasmPath = 'target/wasm32-unknown-unknown/release/ultrahonk_verifier.wasm';
if (!existsSync(wasmPath)) {
  console.error(`Error: WASM not found at ${wasmPath}`);
  process.exit(1);
}

console.log('Deploying ultrahonk-verifier contract...');
const deployCmd = [
  'stellar contract deploy',
  `--wasm ${wasmPath}`,
  `--source ${adminSecret}`,
  `--rpc-url ${rpcUrl}`,
  `--network-passphrase "${networkPassphrase}"`,
  `-- --vk_bytes ${vkHex}`,
].join(' ');

let verifierContractId: string;
try {
  verifierContractId = execSync(deployCmd, { encoding: 'utf8', stdio: 'pipe' }).trim();
  console.log(`Verifier deployed: ${verifierContractId}`);
} catch (err: any) {
  console.error('Deploy failed:', err.stderr || err.message);
  process.exit(1);
}

// 4. Set verifier on ZK Detective contract
console.log('Setting verifier address on ZK Detective contract...');
const setCmd = [
  'stellar contract invoke',
  `--id ${contractId}`,
  `--source ${adminSecret}`,
  `--rpc-url ${rpcUrl}`,
  `--network-passphrase "${networkPassphrase}"`,
  '-- set_verifier',
  `--verifier ${verifierContractId}`,
].join(' ');

try {
  execSync(setCmd, { encoding: 'utf8', stdio: 'pipe' });
  console.log('Verifier address set successfully.');
} catch (err: any) {
  console.error('set_verifier failed:', err.stderr || err.message);
  process.exit(1);
}

console.log('\nDone! Verifier contract deployed and linked.');
console.log(`  Verifier ID: ${verifierContractId}`);
console.log(`  ZK Detective: ${contractId}`);
console.log('\nNext: run compute-poseidon-commitment.ts to set the Poseidon2 commitment.');
