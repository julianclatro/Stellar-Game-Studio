Load and implement feature $ARGUMENTS from the ZK Detective game.

## Instructions

1. Parse the feature ID from the argument. Accept formats: "F01", "f01", "1", "01"
2. Read the feature spec from `docs/features/F{NN}-*.md` (use glob to find the exact filename)
3. Read the feature index from `docs/features/README.md` to check dependencies
4. For each dependency listed in the feature spec, read those feature docs too (to understand context)
5. Read relevant architecture docs based on the feature:
   - If feature involves ZK/circuits → read `docs/architecture/zk-architecture.md`
   - If feature involves contracts → read `docs/architecture/technical-stack.md`
   - If feature involves data/schemas → read `docs/architecture/data-model.md`
   - If feature involves case content → read `docs/case-content/meridian-manor.md`
   - If feature involves characters → read `docs/characters/detectives.md` and `docs/characters/suspects.md`
6. Check the current status of the feature
7. If status is "Not Started", update it to "In Progress" in the feature doc
8. Present:
   - Feature summary and why it matters
   - Dependencies and their current status
   - Acceptance criteria checklist
   - Technical design overview
   - Files to create/modify
   - Open questions to resolve before implementation
9. Implement the feature following the technical design
10. After implementation, update the feature doc status to "Done" and check off completed acceptance criteria
11. Update `docs/features/README.md` status tracker
12. Update `progress.md` with what was built
