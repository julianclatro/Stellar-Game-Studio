#!/usr/bin/env bun

/**
 * Create a scene on the zk-seek contract.
 *
 * Usage: bun scripts/create-scene.ts [scene_id] [target_x] [target_y] [tolerance]
 *
 * Defaults: scene_id=1, target_x=500, target_y=300, tolerance=150
 *
 * Reads admin secret + contract ID from .env
 */

import { keccak_256 } from '@noble/hashes/sha3.js';
import { readEnvFile, getEnvValue } from './utils/env';
import { $ } from 'bun';

const args = process.argv.slice(2);
const sceneId = Number(args[0] || '1');
const targetX = Number(args[1] || '500');
const targetY = Number(args[2] || '300');
const tolerance = Number(args[3] || '150');

const env = await readEnvFile('.env');
const adminSecret = getEnvValue(env, 'VITE_DEV_ADMIN_SECRET');
const contractId = getEnvValue(env, 'VITE_ZK_SEEK_CONTRACT_ID');

if (!adminSecret) {
  console.error('❌ VITE_DEV_ADMIN_SECRET not found in .env');
  process.exit(1);
}
if (!contractId) {
  console.error('❌ VITE_ZK_SEEK_CONTRACT_ID not found in .env');
  process.exit(1);
}

// Generate a 32-byte scene salt
const sceneSalt = new Uint8Array(32);
crypto.getRandomValues(sceneSalt);

// Compute target commitment: keccak256(target_x_be || target_y_be || scene_salt)
const data = new Uint8Array(4 + 4 + 32);
const view = new DataView(data.buffer);
view.setUint32(0, targetX, false); // big-endian
view.setUint32(4, targetY, false);
data.set(sceneSalt, 8);
const commitment = keccak_256(data);
const commitmentHex = Buffer.from(commitment).toString('hex');

console.log(`🎯 Creating scene ${sceneId}`);
console.log(`   Target: (${targetX}, ${targetY})`);
console.log(`   Tolerance: ${tolerance}`);
console.log(`   Salt (hex): ${Buffer.from(sceneSalt).toString('hex')}`);
console.log(`   Commitment (hex): ${commitmentHex}`);
console.log(`   Contract: ${contractId}\n`);

try {
  await $`stellar contract invoke \
    --id ${contractId} \
    --source-account ${adminSecret} \
    --network testnet \
    -- \
    create_scene \
    --scene_id ${sceneId} \
    --target_commitment ${commitmentHex} \
    --tolerance ${tolerance}`;

  console.log(`\n✅ Scene ${sceneId} created!`);
  console.log(`\n⚠️  SAVE THESE VALUES for resolve_game later:`);
  console.log(`   target_x: ${targetX}`);
  console.log(`   target_y: ${targetY}`);
  console.log(`   scene_salt: ${Buffer.from(sceneSalt).toString('hex')}`);

  // Save to a file for convenience
  const sceneInfo = {
    sceneId,
    targetX,
    targetY,
    tolerance,
    sceneSalt: Buffer.from(sceneSalt).toString('hex'),
    commitment: commitmentHex,
    createdAt: new Date().toISOString(),
  };
  await Bun.write(`scene-${sceneId}.json`, JSON.stringify(sceneInfo, null, 2) + '\n');
  console.log(`   (Also saved to scene-${sceneId}.json)`);
} catch (error) {
  console.error('❌ Failed to create scene:', error);
  process.exit(1);
}
