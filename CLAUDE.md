# Claude Project Instructions

## Documentation-first rule

For non-trivial changes, read existing docs before editing.

Start with:
1. Nearest relevant `README.md`
2. Parent `README.md` files, up to 2 levels up
3. Relevant `docs/architecture/` files if the change crosses boundaries
4. Relevant ADRs if the change touches a durable decision

Do not guess project conventions when documentation exists.

For trivial fixes, use judgment and avoid unnecessary context loading.

---

## Layered documentation model

- Root `README.md` = product/repo overview
- `docs/architecture/` = system architecture, C4, infra, data model
- `docs/architecture/decisions/` = durable decisions and tradeoffs
- Folder `README.md` = local ownership, boundaries, workflows, gotchas
- Nested `CLAUDE.md` = subtree-specific agent behavior rules
- Code comments = non-obvious implementation details only

Higher-level docs explain broad context.  
Lower-level docs explain local implementation details.  

Link upward instead of duplicating.

---

## Nested CLAUDE.md

Subtree-specific behavior rules belong in nested `CLAUDE.md` files.

Examples:
- `services/api/CLAUDE.md`
- `packages/db/CLAUDE.md`
- `apps/mobile/CLAUDE.md`

Use nested `CLAUDE.md` files for:
- local invariants
- library choices
- commands
- testing rules
- source-of-truth rules
- things an agent must always respect in that subtree

Nested rules extend this root file.

---

## Where to document

- Local implementation detail → nearest folder `README.md`
- Service/package responsibility → service/package `README.md`
- Cross-boundary contract → README of the lowest common ancestor folder
- System-wide relationship → `docs/architecture/`
- Durable decision/tradeoff → ADR
- Command/workflow → nearest README, plus root README if globally relevant
- Non-obvious code behavior → code comment

---

## Compounding rule

After meaningful changes, ask:

“Did this change teach the codebase something future agents or developers need to know?”

If yes, update the closest relevant doc.

Update docs for changes to:
- architecture
- ownership/boundaries
- commands/workflows
- environment variables
- source-of-truth rules
- integration contracts
- recurring gotchas
- testing strategy
- future agent behavior

Do not update docs for trivial refactors or obvious implementation details.

---

## Pruning rule

If documentation contradicts current code, fix or delete the stale documentation in the same change.

Stale docs are worse than missing docs.

---

## README style

Keep README updates short, factual, specific, and link upward instead of duplicating.

---

## Final response expectation

When completing a task, mention:
1. What code changed
2. What docs were read
3. Whether docs were updated
4. If docs were not updated, why