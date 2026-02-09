// Build-time script: generates the commitment hash and injects it into the client case JSON.
// Run: bun scripts/generate-commitment.ts

import { keccak_256 } from '@noble/hashes/sha3.js';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const solutionPath = resolve(__dirname, '../src/data/cases/meridian-manor.solution.json');
const casePath = resolve(__dirname, '../src/data/cases/meridian-manor.json');

const solutionData = JSON.parse(readFileSync(solutionPath, 'utf-8'));
const caseData = JSON.parse(readFileSync(casePath, 'utf-8'));

const { suspect, weapon, room } = solutionData.solution;
const salt = solutionData.salt;

const encoder = new TextEncoder();
const data = new Uint8Array([
  ...encoder.encode(suspect),
  ...encoder.encode(weapon),
  ...encoder.encode(room),
  ...encoder.encode(salt),
]);

const hash = keccak_256(data);
const hex = '0x' + Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');

caseData.commitment = hex;
writeFileSync(casePath, JSON.stringify(caseData, null, 2) + '\n');

console.log(`Commitment generated: ${hex}`);
console.log(`Written to: ${casePath}`);
