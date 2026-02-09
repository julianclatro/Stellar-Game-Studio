# F01: Case Data System

**Status:** Done
**Phase:** 1 (MVP)
**Priority:** P0 (must)
**Dependencies:** —

## Description

The foundational data layer for the game. Defines the case JSON schema, loads case data, and provides typed access to rooms, clues, suspects, dialogue trees, and the solution. Every other feature depends on this data structure.

## Acceptance Criteria

- [x] Case JSON schema defined and validated (TypeScript types)
- [x] "The Meridian Manor Incident" case data file created with all 5 rooms, 9 suspects, all clues, and full dialogue trees
- [x] Case loader function that reads and validates case JSON
- [x] Solution commitment generation utility (hash of suspect + weapon + room + salt)
- [x] TypeScript types exported for Room, Clue, Suspect, DialogueTree, Solution, CaseData
- [x] Unit tests for case loading and validation

## Technical Design

The case data lives as a static JSON file loaded by the frontend. The solution is never sent to the client in plaintext — only the commitment hash. The case JSON schema follows the structure defined in [data-model.md](../architecture/data-model.md).

Key types:
- `CaseData` — top-level case with rooms, suspects, weapons, solution (build-time only)
- `ClientCaseData` — same as CaseData but without solution field (shipped to client)
- `Room` — id, name, description, connections, clues, suspects_present
- `Clue` — id, name, description, is_key_evidence, related_suspect, icon
- `Suspect` — id, name, role, room, dialogue (3-state tree)
- `DialogueTree` — default, clue_triggered (map), confrontation (map)

The case file for Meridian Manor contains all content from [meridian-manor.md](../case-content/meridian-manor.md).

## Files Created

- `zk-detective-frontend/src/data/types.ts` — TypeScript type definitions (CaseData, ClientCaseData, Room, Clue, Suspect, DialogueTree, Solution)
- `zk-detective-frontend/src/data/cases/meridian-manor.json` — Client-safe case data (no solution, commitment hash only)
- `zk-detective-frontend/src/data/cases/meridian-manor.solution.json` — Solution + salt (build-time only)
- `zk-detective-frontend/src/data/case-loader.ts` — Load, validate, and query case data
- `zk-detective-frontend/src/data/commitment.ts` — keccak256 commitment hash generation/verification
- `zk-detective-frontend/src/data/index.ts` — Barrel export
- `zk-detective-frontend/src/data/__tests__/case-loader.test.ts` — 24 tests
- `zk-detective-frontend/src/data/__tests__/commitment.test.ts` — 13 tests
- `zk-detective-frontend/scripts/generate-commitment.ts` — Build script to inject commitment hash

## Resolved Questions

- **Data loading:** Static import (bundled in frontend). No server needed.
- **Solution safety:** Stripped from client JSON. Only commitment hash shipped. Solution in separate `.solution.json` file.
- **Multiple cases:** Single case for now (Meridian Manor). Structure supports multiple via `case_id`.
