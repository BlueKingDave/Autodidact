# ADR Rules

> Extends root CLAUDE.md. Applies when working in `docs/architecture/decisions/`.
> See ./README.md (if present) for the index of accepted ADRs.

## Purpose

This folder holds Architecture Decision Records — durable records of decisions
that will outlive the people who made them. ADRs capture *what* was decided
and *why*, not *how* the system works.

## When to create an ADR

Create an ADR when a decision meets all of:
- It will be expensive to reverse later.
- It constrains future technical choices.
- A reasonable person might revisit it in 6+ months and ask "why did we do this?"

Do NOT create an ADR for:
- Implementation details (those go in code or folder READMEs).
- Reversible choices (library version bumps, internal refactors).
- Style or naming conventions (those go in CLAUDE.md or READMEs).
- Decisions that affect only one folder (folder README is enough).

If unsure, ask the user before creating one. Over-ADR'ing is a real failure mode.

## How to create an ADR

1. Copy `ADR-000-template.md` to a new file.
2. Filename format: `ADR-NNN-kebab-case-slug.md` (e.g., `ADR-014-use-drizzle-over-prisma.md`).
3. Number = next available integer, zero-padded to 3 digits. Never reuse numbers.
4. Fill in all sections. An ADR with empty "Alternatives considered" is incomplete.
5. Set Status to `Proposed` unless the user explicitly says it's accepted.
6. Add the date in `YYYY-MM-DD` format.

## Editing existing ADRs

ADRs are append-only history. Do NOT:
- Renumber existing ADRs.
- Delete ADRs.
- Rewrite the Decision or Context of an Accepted ADR to reflect new thinking.

You MAY:
- Fix typos, broken links, or formatting.
- Update Status (e.g., Accepted → Deprecated, or → Superseded by ADR-NNN).
- Add a short note at the bottom under a `## Update` heading if context shifts,
  but the original Decision text stays intact.

If a decision changes, write a new ADR that supersedes the old one. Link both ways:
- New ADR: "Supersedes ADR-007."
- Old ADR: Status becomes "Superseded by ADR-NNN" with a link.

## Status values

Use exactly one of:
- `Proposed` — drafted, not yet agreed.
- `Accepted` — in force.
- `Deprecated` — no longer followed, but not replaced.
- `Superseded by ADR-NNN` — replaced by a newer ADR.

## Writing rules

- One decision per ADR. If you're tempted to write "and also...", that's a second ADR.
- Keep it to one page where possible. Long ADRs usually contain design-doc material
  that belongs in `docs/architecture/`.
- "Alternatives considered" is mandatory. An ADR without rejected options is a sales pitch.
- Be honest in "Consequences." Record real downsides, not just upsides.
- Active voice in the Decision section: "We will use X," not "X could be considered."

## What NOT to put in an ADR

- How-to guides or runbooks → folder README or `docs/architecture/`.
- System diagrams or data flow → `docs/architecture/`.
- Code examples beyond a few illustrative lines → link to the code instead.
- Status updates, project notes, meeting minutes → not ADRs at all.

## After creating or accepting an ADR

- If the decision affects a specific subsystem, add a one-line reference in that
  subsystem's README under "Key Decisions" linking to the ADR.
- If the decision creates a new behavioral rule for the agent, add it to the
  relevant CLAUDE.md (root or nested) and link to the ADR.
- Do not duplicate the full ADR content elsewhere. Link to it.