# ADR-022: CI/CD platform

## Status

Accepted
Date: 2026-05-10

## Context

Every push to a PR runs typecheck, lint, unit tests, and integration tests
([ADR-018](../cross-cutting/ADR-018-testing-strategy.md)). Merges to main
trigger Docker image builds, push to Artifact Registry
([ADR-012](./ADR-012-cloud-hosting-platform.md)), and Terraform apply
([ADR-021](./ADR-021-infrastructure-as-code.md)) for the dev environment.
Production deploys are gated.

The CI/CD platform decision determines: where these workflows live, how
they're triggered, how secrets are managed, and how we authenticate
against GCP for deploys.

This decision is downstream of the repo being on GitHub. If the repo
moved (GitLab, Codeberg, self-hosted), this ADR would be reopened.

## Non-goals

- Specific workflow YAML — owned by `.github/workflows/` files.
- Branch protection rules, merge policies — operational, owned by the GitHub repo settings.
- Mobile build pipeline (EAS Build) — separate concern, owned by `apps/mobile`.
- Secret rotation policy — operational, owned by `infra/CLAUDE.md`.

## Decision Drivers

- **Tight integration with the source repo** — the repo is on GitHub. CI lives where the source lives.
- **Free tier sufficient at MVP** — pre-revenue; CI cost should be near zero.
- **GCP authentication** — must support OIDC-based federated auth so we don't ship long-lived service account keys.
- **Container-aware** — build Docker images, push to Artifact Registry.
- **Reusable workflow primitives** — solo team; copy-paste CI workflows across services should be cheap.
- **Operational simplicity** — solo team. No self-hosted runner unless absolutely necessary.

## Options Considered

### Option A: GitHub Actions (current)
**What it is:** Native CI on GitHub. Workflows live in `.github/workflows/`. Free tier covers 2,000 minutes/month for private repos on the basic plan; public repos are unlimited.

**Pros**
- Lives in the same repo as the code; PRs and CI are one URL space.
- Workload Identity Federation with GCP is well-documented and battle-tested. No long-lived service account keys.
- Marketplace of pre-built actions covers nearly every common task.
- Reusable workflows + composite actions reduce per-service boilerplate.
- Free for public repos; generous free tier for private.
- GitHub-hosted runners include Docker, recent Node, Linux/macOS/Windows variants.
- Excellent GitHub integration: PR check status, deployment environments with approval gates, native artifact storage.

**Cons**
- GitHub-hosted Linux runners are sometimes slower than CI competitors (CircleCI, Buildkite) on cold cache.
- Self-hosted runners are real work to maintain if needed for performance / cost.
- GitHub-platform vendor lock-in: workflows are GitHub Actions YAML, not portable to GitLab CI.
- If GitHub has an incident, our CI is down (~handful of meaningful incidents per year).

### Option B: CircleCI
**What it is:** Long-incumbent CI platform; YAML workflows; strong caching primitives.

**Pros**
- Faster runners than GitHub-hosted on many workloads, especially with their parallelism and caching.
- Mature, polished UI for CI status.

**Cons**
- Pricing meaningfully more expensive than GitHub Actions for a private repo. Their free tier exists but tighter than GitHub's.
- Separate platform = separate auth, separate config language, separate URL.
- CircleCI orbs are less common than GitHub Actions.

### Option C: GitLab CI
**What it is:** GitLab's native CI. Tightly integrated with GitLab repos.

**Pros**
- Excellent if the repo is on GitLab.

**Cons**
- The repo is on GitHub. Adopting GitLab CI for a GitHub repo is contrarian.
- Setup involves cross-platform integration that nullifies most benefits.

### Option D: Jenkins
**What it is:** The classic open-source CI server. Self-hosted, plugin-driven.

**Pros**
- Maximum control, maximum flexibility.
- Open source, no vendor.

**Cons**
- We host and maintain a Jenkins server. Solo team. Severe operational tax.
- Configuration via plugins is a rabbit hole.
- Inappropriate for an MVP-stage product.

### Option E: Buildkite
**What it is:** Hybrid model — Buildkite handles orchestration; you bring the runners.

**Pros**
- Strong performance; you pay for what you use.
- Excellent for shops with specific runner requirements.

**Cons**
- "Bring your own runners" means we host them. We don't want to.
- More setup than GitHub Actions for our use case.

## Decision

**We use GitHub Actions.**

## Rationale

Lining up the drivers:

- **Source repo integration (#1)**: A wins. Same URL space; PR and CI are one experience.
- **Free tier (#2)**: A's free tier is generous at our scale. C is comparable but assumes GitLab. B and E have real costs.
- **GCP auth (#3)**: A's Workload Identity Federation pattern is well-documented and used at scale. The other options can do it, but GitHub's docs and ecosystem are the most polished.
- **Container-aware (#4)**: All options support Docker. A's runners include Docker out of the box.
- **Reusable primitives (#5)**: A's reusable workflows + composite actions are first-class.
- **Operational simplicity (#6)**: A wins. D and E require infrastructure we don't want to own.

What we are sacrificing by picking GitHub Actions:

- Some performance on cold cache vs CircleCI / Buildkite. Not yet a
  binding constraint at our CI volume.

No reconsideration flag is raised. GitHub Actions is the first-principles
choice for a GitHub-hosted repo with a small team and modest CI volume.

## Consequences

### Positive
- CI lives next to code; PR experience is unified.
- Workload Identity Federation removes long-lived GCP keys from secrets.
- Free at our scale.
- Pre-built actions for Docker build/push, Terraform apply, GCP auth, etc.
- Deployment environments with approval gates support the prod-deploy review pattern.

### Negative
- Vendor lock-in to GitHub. Repo migration would imply CI rewrite.
- Runner cold-cache performance is a known weak point.
- A GitHub incident takes our CI down with it.

### Follow-up decisions
- Specific workflow structure (one workflow per service vs unified) — owned by `.github/workflows/`.
- Self-hosted runner adoption — only if performance / cost becomes a binding constraint.
- Reconsider this ADR if: the repo migrates off GitHub, GitHub Actions pricing changes materially, or CI runtime becomes a bottleneck that self-hosted or alternative platforms would meaningfully fix.
