# ADR-999: Workflow smoke test (dummy)

## Status

Proposed
Date: 2026-05-14

> **NOTE:** This ADR is a smoke test for the `adr-review.yml` GitHub Actions
> workflow. It is intentionally lightweight and will be deleted once the
> workflow's per-PR review path is confirmed to fire and post a comment.
> Do not treat its contents as a real decision.

## Context

We recently added `.github/workflows/adr-review.yml` (commit bd6452f). The
`review-changed-adrs` job is gated on `pull_request` events touching
`docs/architecture/ADRs/**/*.md`. We have not yet observed it run end-to-end
on a real PR, so we don't know whether the trigger, permissions, and
`gh pr comment` step all work in this repo.

## Non-goals

This ADR does not decide:
- Any actual architectural matter.
- The long-term shape of the ADR review workflow itself.

## Decision Drivers

- Trigger correctness — does the path filter match?
- Permissions — can the workflow comment on PRs?
- Output — does the Claude action post a single, well-formed comment?

## Options Considered

### Option A: Add a brand-new dummy ADR (this PR)
**What it is:** Author a throwaway ADR file under `cross-cutting/` to satisfy the path filter and exercise the full workflow.

**Pros**
- Cleanest signal: file is new, diff is obvious, no risk of misreading an unrelated change.

**Cons**
- Introduces churn that has to be reverted.

### Option B: Edit an existing ADR with a doc-only tweak
**What it is:** Add a `Documentation revised:` note to an Accepted ADR.

**Pros**
- Allowed by `ADRs/CLAUDE.md`; no cleanup needed.

**Cons**
- Mixes a workflow test with a real (if tiny) documentation change.

### Option C: Trigger via `workflow_dispatch` only
**What it is:** Skip the PR path; run the all-ADRs review manually.

**Pros**
- No PR churn at all.

**Cons**
- Does not exercise the `review-changed-adrs` job, which is the one we want to verify.

## Decision

**We chose: Option A.**

## Rationale

The point of the change is to verify the per-PR review path. Option C does
not exercise it. Option B muddies the test signal. Option A is the most
direct way to observe the trigger, permissions, and comment-posting steps end
to end. We sacrifice a small amount of repo churn (one file added now, one
file removed later) in exchange for an unambiguous signal.

## Consequences

### Positive
- We learn whether the workflow fires, has permissions, and posts a comment.

### Negative
- Adds a throwaway file that must be deleted in a follow-up.

### Follow-up decisions
- After confirmation, delete this file in a follow-up PR.
- If the workflow misbehaves, fix `.github/workflows/adr-review.yml` before
  retrying.
