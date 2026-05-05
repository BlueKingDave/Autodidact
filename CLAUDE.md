# Claude Project Instructions

> Planning, assumptions, and completion summaries scale with change size — trivial fixes don't need them.

## Core engineering values

Every code change must respect these:

1. **Test what you change.** Add or update focused tests for new or changed behavior. If a test isn't practical, explain why and describe how you verified it manually.
2. **Single source of truth.** Don't duplicate facts, config, schemas, business rules, or ownership info. Update the authoritative source; reference it from elsewhere.
3. **Modular design.** Isolated responsibilities, clear interfaces, small modules. Don't couple unrelated concerns to ship faster.
4. **Simplicity first.** Write the minimum code that solves the problem. No speculative features, no abstractions for single-use code, no "configurability" that wasn't asked for. If you wrote 200 lines and it could be 50, rewrite it.
5. **Surgical changes.** Touch only what the task requires. No drive-by cleanup of adjacent code, comments, or formatting. Match existing style — exception: if it violates an invariant stated in a nested `CLAUDE.md`, the invariant wins. Remove only dead code your changes created, not pre-existing orphans. Tests for code you're modifying count as part of the change, not cleanup.

---

## Before you code

State assumptions before implementing. If uncertain, ask:

- If multiple interpretations exist, name them — don't pick silently.
- If a simpler approach is available, say so and push back when warranted.
- If something is unclear, stop, name what's confusing, ask before proceeding.
- If success criteria are vague ("make it work"), ask for specifics.

For multi-step tasks, state a brief plan with verifiable checkpoints:

1. [Step] → verify: [check]
2. [Step] → verify: [check]

---

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
- Folder `README.md` = local narrative, ownership, workflows, gotchas (human-facing)
- Nested `CLAUDE.md` = subtree invariants, source-of-truth, agent rules (agent-binding)
- Code comments = non-obvious implementation details only

Higher-level docs explain broad context. Lower-level docs explain local implementation details. Link upward instead of duplicating.

---

## Authority: README vs CLAUDE.md

Both files coexist in many folders. They serve different audiences and may overlap on reference content — that's fine.

**Binding rules need a single source of truth.** Imperative rules ("must use X," "must not Y," invariants) live authoritatively in `CLAUDE.md`. README does not restate them — if relevant to humans, link to `CLAUDE.md`.

**Reference content can appear in both.** Source-of-truth maps, component relationships, file locations, commands — duplicate freely. Both audiences benefit from self-contained files, and drift in pointer data is obvious when it happens.

**Audience split for narrative:**
- Narrative purpose, ownership, gotchas, onboarding → README
- Agent-binding rules, invariants, testing rules → `CLAUDE.md`

Each file cross-links to its pair at the top.

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
- verification commands (tests, typecheck, lint)
- testing rules
- source-of-truth declarations
- anything an agent must always respect in that subtree

Nested rules extend this root file.

---

## Where to document

- Local implementation detail → nearest folder `README.md`
- Service/package responsibility → service/package `README.md`
- Cross-boundary contract → README of the lowest common ancestor folder
- System-wide relationship → `docs/architecture/`
- Durable decision/tradeoff → ADR
- Verification commands (tests, typecheck, lint) → nearest `CLAUDE.md`
- Broader workflows → nearest README, plus root README if globally relevant
- Non-obvious code behavior → code comment

---

## Compounding rule

After meaningful changes, ask:

> Did this change teach the codebase something future agents or developers need to know?

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

If documentation contradicts current code, fix or delete the stale documentation in the same change. Stale docs are worse than missing docs.

---

## README style

Keep README updates short, factual, specific, and link upward instead of duplicating.

---

## Final response expectation

When completing a task, mention:
1. What code changed
2. What tests were added or updated (or why none were needed)
3. What docs were read
4. Whether docs were updated, and if not, why