# Architecture Decision Records

This folder contains ADRs — durable records of architectural decisions for this repo.

## What is an ADR?

An ADR captures a single decision: what we chose, why, what we rejected, and what
we're now committed to. ADRs record *decisions*, not designs or how-tos.

For the rules on when and how to create one, see [CLAUDE.md](./CLAUDE.md).
For the structure of an ADR, see [ADR-000-template.md](./ADR-000-template.md).

## Index

<!--
Keep this list in sync when adding, accepting, or superseding ADRs.
Format: ADR-NNN — Title — Status
Sort by number, ascending.
-->

- ADR-000 — Template (not a real decision)
- ADR-001 — Monorepo with pnpm Workspaces + Turborepo — **Accepted**
- ADR-002 — Supabase for Database and Authentication — **Accepted**
- ADR-003 — Expo + React Native for Mobile — **Accepted**

## Conventions

**Filenames:** `ADR-NNN-kebab-case-slug.md` (e.g., `ADR-014-use-drizzle-over-prisma.md`).
Numbers are zero-padded to 3 digits and never reused.

**Status values:** `Proposed`, `Accepted`, `Deprecated`, `Superseded by ADR-NNN`.

**Append-only:** ADRs are history. To change a decision, write a new ADR that
supersedes the old one. Link both ways.

**Scope:** One decision per ADR. Cross-cutting designs go in `../` (architecture
docs), not here.

## How to add an ADR

1. Copy `ADR-000-template.md` to `ADR-NNN-your-slug.md` using the next number.
2. Fill in all sections. "Alternatives considered" is mandatory.
3. Set Status to `Proposed` (or `Accepted` if already agreed).
4. Add an entry to the Index above.
5. If the decision affects a specific subsystem, add a one-line reference in
   that subsystem's README under "Key Decisions."

## Related

- [Architecture overview](../README.md)
- Root [CLAUDE.md](../../../CLAUDE.md) — repo-wide rules
- [ADR template](./ADR-000-template.md)