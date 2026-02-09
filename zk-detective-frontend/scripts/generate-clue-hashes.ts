#!/usr/bin/env bun
// F07: Generate clue response hashes for the clue-verify circuit
//
// This script computes the pre-committed clue_response_hash for each clue
// in a case, based on the solution. These hashes are public inputs to the
// clue-verify circuit and can be stored on-chain or in the case JSON.
//
// Usage: bun run scripts/generate-clue-hashes.ts
//
// The response_value encoding:
//   1 = clue's related_suspect IS the guilty suspect (relevant)
//   0 = clue's related_suspect is NOT the guilty suspect or has no link (not relevant)
//
// The hash: pedersen_hash([clue_numeric_id, response_value])
// These hashes must be generated using the Noir circuit (nargo execute on
// circuits/compute_commitment or a dedicated helper), since pedersen_hash
// is a Noir-native operation not easily replicated in TypeScript.
//
// This script outputs the clue -> response_value mapping for use with
// the Noir circuit toolchain.

import caseJson from '../src/data/cases/meridian-manor.json';
import solutionJson from '../src/data/cases/meridian-manor.solution.json';
import { CLUE_IDS } from '../src/data/clue-ids';
import { computeResponseValue } from '../src/services/clue-verify-service';

interface SolutionFile {
  case_id: number;
  solution: { suspect: string; weapon: string; room: string };
  salt: string;
}

const solution = (solutionJson as SolutionFile).solution;

console.log('=== F07: Clue Response Values ===');
console.log(`Case: ${caseJson.title}`);
console.log(`Guilty suspect: ${solution.suspect}`);
console.log('');
console.log('Clue ID                  | Numeric | Related Suspect | Response Value');
console.log('-------------------------|---------|-----------------|---------------');

for (const room of caseJson.rooms) {
  for (const clue of room.clues) {
    const numId = CLUE_IDS[clue.id];
    const responseValue = computeResponseValue(clue.related_suspect, solution.suspect);
    const padClue = clue.id.padEnd(24);
    const padNum = String(numId).padStart(7);
    const padSuspect = (clue.related_suspect || '(none)').padEnd(15);
    console.log(`${padClue} |${padNum} | ${padSuspect} | ${responseValue}`);
  }
}

console.log('');
console.log('To generate pedersen hashes, use nargo execute with these inputs.');
console.log('Each hash = pedersen_hash([clue_numeric_id, response_value])');
