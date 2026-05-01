# Subtree Instructions — docs/superpowers/

> These rules apply only within `docs/superpowers/`. They extend `docs/CLAUDE.md`.

## Purpose

This folder manages structured planning documents used to guide feature implementation. Plans are inputs to agentic workers, not design explorations.

---

## Invariants (must not be broken)

- Plans in `plans/` must use the filename format: `YYYY-MM-DD-kebab-case-name.md`.
- Specs in `specs/` must use the filename format: `YYYY-MM-DD-kebab-case-name.md`.
- Plans and specs are append-only records. Mark tasks complete with `[x]`; do not delete completed sections.
- New plans and specs must be added to the index in the relevant subfolder `README.md`.

---

## Key patterns to follow

- Write a spec first when the design is unsettled. A plan requires knowing what to build.
- Plans use `- [ ]` / `- [x]` task syntax for progress tracking.
- When a plan is fully completed, add `> Completed: YYYY-MM-DD` at the top.

---

## Anti-patterns to avoid

- Do not put implementation code in plans.
- Do not use plans as a scratchpad — keep them structured and task-oriented.
- Do not create plans for changes that fit in a single PR description.
