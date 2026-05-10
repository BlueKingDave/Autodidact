# ADR-001: Monorepo & build orchestration

## Status

Accepted
Date: 2026-05-10

## Context

Autodidact comprises one mobile app (`apps/mobile`), three backend services
(`services/api`, `services/agent`, `services/worker`), and seven shared
packages (`packages/{db,providers,schemas,types,prompts,observability,config}`).
These eleven units share TypeScript types and Zod schemas at compile time, must
deploy independently at runtime, and rely on a single CI pipeline for tests,
type-checks, and linting.

The repo strategy decision sits at the foundation: it determines how all
subsequent code is organized, how shared types flow between services, how
CI is structured, and how a new developer gets started. Picking it wrong
forces an expensive reorg later (every service's import paths change, every
deploy pipeline is touched).

This ADR is the foundation that other ADRs (auth, observability, testing,
provider abstraction, etc.) depend on — they assume code can be shared
across services through workspace packages.

## Non-goals

- Choosing TypeScript as the language (table stakes for this team; not a real choice).
- Specific package layout under `packages/*` (each package's responsibility belongs in its own `README.md`/`CLAUDE.md`).
- CI provider choice — see [ADR-022](../infra/ADR-022-cicd-platform.md).
- Container/runtime hosting — see [ADR-012](../infra/ADR-012-cloud-hosting-platform.md).
- Per-service deploy mechanics — covered by ADR-012 and ADR-021.

## Decision Drivers

In rough priority order for Autodidact's situation:

- **Compile-time type sharing** — the agent's `CourseBlueprint` is the API's
  enrollment payload is the worker's job data. A drift here is a runtime bug
  in production. The chosen tool must make a single source of truth for types
  effortless.
- **Build dependency ordering** — `packages/types` builds before `packages/schemas`
  builds before any consumer. Manual ordering is intolerable across 11 packages.
- **Caching (local + CI)** — small team, every minute of CI matters. Unchanged
  packages should not rebuild.
- **Onboarding cost** — solo or near-solo team. A new developer should be
  productive in an afternoon, not a week.
- **Independent deployment** — each service ships its own container image
  without dragging the whole repo's source.
- **Lock-in / portability** — if the orchestrator dies or pivots, can we leave?
- **Cost** — preferably free at our scale.

## Options Considered

### Option A: Polyrepo — one Git repo per service/app/package
**What it is:** Each service and shared package lives in its own Git repo; shared types are published to a private npm registry (or GitHub Packages) and consumed via versioned dependencies.

**Pros**
- Hard isolation — each repo can move at its own version cadence and CI is per-repo by construction.
- Smaller individual repos are faster to clone, index in IDEs, and search.
- Independent permissions per repo (rarely useful at our scale).

**Cons**
- Type changes become a multi-PR ceremony: bump in `@autodidact/types`, publish, bump consumers, publish, deploy. A solo dev does this 20 times a week.
- Private registry is an extra moving part (auth tokens, CI secrets, version pinning).
- Refactoring across services (rename a field, change a contract) cannot be done atomically — you get drift windows by construction.
- No cross-repo build cache; CI duplicates work.
- Modern tooling (Turbo, Nx) explicitly does not target this layout.

### Option B: Monorepo with pnpm workspaces only — no task orchestrator
**What it is:** Single repo, `pnpm-workspace.yaml` lists packages, dependencies declared via `workspace:*`. Builds run via shell scripts or `pnpm -r run build`.

**Pros**
- Zero extra tools beyond the package manager. One less dependency to learn or replace.
- pnpm's content-addressable store gives near-instant installs and per-package isolation.
- Workspace protocol (`workspace:*`) makes type-sharing native.
- Fully portable — pnpm is open source and the workspace format is a de-facto standard.

**Cons**
- No task graph: `pnpm -r run build` runs in package order but does not understand inter-package dependency graphs natively (it does topological order with `--workspace-concurrency`, but lacks granularity).
- No caching. Every CI run rebuilds every package, even when only one changed. With 11 packages and a Vitest suite per package, this hurts at scale.
- No "affected" detection — every PR runs the full pipeline.
- DIY scripts replace what an orchestrator gives for free; over time those scripts grow into a poor man's Turborepo.

### Option C: Monorepo with pnpm workspaces + Turborepo (current choice)
**What it is:** Single repo, pnpm for installs/workspaces, Turborepo for task pipelines (`turbo run build`, `dev`, `test`, etc.) with `dependsOn` ordering and content-hash-based caching. Free remote cache via Vercel account; can self-host with `ducktors/turborepo-remote-cache` if needed.

**Pros**
- `turbo.json` is small and declarative — our `build`/`dev`/`lint`/`typecheck`/`test` config is ~25 lines.
- Local cache is on by default; one config flag enables remote cache shared across CI and dev machines.
- Watch mode (Turbo 2) eliminates hand-rolled `concurrently` scripts for `pnpm dev`.
- Vercel-owned, ~2M weekly downloads — well-maintained, big install base.
- Free remote cache on Vercel even for non-Vercel-hosted apps (current Vercel policy as of 2026); self-hostable cache server exists.
- No code generators or framework opinions — Turbo just orchestrates whatever scripts each package defines.

**Cons**
- Vendor risk (single): owned by Vercel. If Vercel pivots, the OSS CLI continues but priority/maintenance could slow. Self-hosted remote cache is a viable escape.
- Cache-key debugging is the most common pain point (env vars or unlisted inputs causing cache misses).
- "Affected" analysis is coarser than Nx's — Turbo hashes file content per package, while Nx analyzes import graphs to know exactly which consumer is affected by a TS interface change.
- Adds one more tool to learn beyond pnpm (modest curve, ~1 hour for the basics).

### Option D: Monorepo with pnpm workspaces + Nx
**What it is:** Single repo, pnpm for installs, Nx for task graph, code generation, "affected" commands, and architectural rules (allowed/disallowed cross-package imports).

**Pros**
- Smarter "affected" detection by analyzing TS imports rather than just file hashes — fewer wasted CI runs on no-op changes.
- Generators for new packages/services enforce structure consistency.
- Module-boundary linting (architectural rules) catches forbidden imports at lint time.
- Multi-language support (Python, Go, Rust) if Autodidact ever expands beyond TS.
- ~5M weekly downloads — largest monorepo-tool ecosystem, deepest plugin library.

**Cons**
- Heavier and more opinionated. A new dev meets `nx.json`, `project.json` per package, a generator system, and an executor model — meaningful learning curve vs Turbo's ~50-line config.
- Plugin ecosystem comes with version-coupling pain (e.g., `@nx/react-native` lagging RN releases).
- Nx Cloud (the remote-cache offering) is a paid product over a free tier; comparable to Vercel's free tier but with a different pricing trajectory.
- Overkill for an 11-package TS-only repo with a small team — the value lights up at 50+ packages and multi-language.

### Option E: Monorepo with Bun workspaces (Bun as both package manager and orchestrator)
**What it is:** Replace pnpm and Turbo with Bun's built-in workspaces, install, runtime, and bundler. Bun ships a single binary that does most of the toolchain.

**Pros**
- Single binary replaces pnpm + tsx + node — meaningful install simplification.
- Install and test runs are notably fast (Bun publishes benchmarks; independent benchmarks roughly corroborate but exact numbers vary by repo).
- Native TS execution removes a `tsx`/build step in some workflows.

**Cons**
- Maturity gap for production: NestJS, BullMQ, LangChain, and React Native all primarily target Node, not Bun. Edge-case incompatibilities and missing native modules surface in production logs months later — there are credible 2025–2026 reports of `bun install` and runtime quirks in non-trivial monorepos.
- Cloud Run images using Bun are less standard; container ecosystem (smaller official images, fewer base recipes).
- No mature task-graph orchestrator equivalent to Turbo/Nx — Bun's monorepo workflow is closer to Option B (workspaces only) plus a fast install.
- Migrating later if Bun stalls means re-doing pnpm + Turbo work anyway.

### Option F: Monorepo with Bazel
**What it is:** Bazel as the build system, with `rules_nodejs` or `rules_js` for the JS/TS world.

**Pros**
- Reproducible, hermetic builds across languages — the gold standard for very large repos.
- Remote execution distributes build work across a cluster.
- Used by Google, LinkedIn, Pinterest at extreme scale.

**Cons**
- Massive setup tax. `BUILD.bazel` files per package, manual dependency declarations, a build language to learn (Starlark).
- Bazel's JS/TS story is the weakest link in its ecosystem; mature usage requires patience for plugin/version drift.
- Designed for 1,000+ engineer monorepos. Severe overspec for a solo/small team with 11 TS packages.
- Onboarding a new developer becomes a multi-day exercise.

## Decision

**We choose pnpm workspaces + Turborepo.**

## Rationale

The decision drivers fall out as follows:

- **Type sharing (#1)**: pnpm `workspace:*` is the cleanest implementation of "one source of truth for types." Polyrepo (A) fails this on first principles (forces publish cycles); Bazel/Bun/Nx all also achieve it, so this driver narrows away polyrepo but does not differentiate among the monorepo options.
- **Build ordering (#2)**: Turbo's `dependsOn: ["^build"]` directly encodes our needs in 3 lines of JSON. Option B (pnpm only) does not solve this; everything else does.
- **Caching (#3)**: Turbo's content-hash cache + free remote cache via Vercel account is a strict superset of Option B and a near-equal of Nx Cloud. Bazel's caching is more powerful but the configuration cost is disproportionate to the benefit at our scale.
- **Onboarding cost (#4)**: Turbo's `turbo.json` is ~25 lines and Turbo can be ignored entirely on day one (`pnpm dev` works). Nx's `project.json` per package and generator system require front-loaded learning. Bazel requires deep upfront investment.
- **Independent deployment (#5)**: orthogonal to all monorepo options.
- **Lock-in / portability (#6)**: Turbo's CLI is OSS under MIT; the cache protocol has an open-source self-hostable server (`ducktors/turborepo-remote-cache`). Worst-case exit is replacing Turbo with shell scripts plus `nx affected` or going back to Option B — a one-day migration for a repo this size.
- **Cost (#7)**: free at any plausible Autodidact scale.

What we are sacrificing by choosing Turbo over Nx: smarter "affected" analysis
that understands TS import graphs (Nx) vs Turbo's file-hash approach. For 11
packages this matters rarely; at 50+ packages the calculus would tilt toward Nx.

What we are sacrificing by choosing pnpm + Turbo over Bun: a moderate amount
of install/test speed and a single-binary toolchain story. We are taking on
zero risk that production-critical libraries (NestJS, BullMQ, LangChain, RN)
behave differently under Bun than under Node — that risk is unacceptable for
a system whose money path runs through these libraries.

No reconsideration flag is raised. The current choice is also the
first-principles choice given the drivers.

## Consequences

### Positive
- Single CI pipeline; cache hits keep it fast as the repo grows.
- Type and schema drift between services is prevented by construction.
- New developer is productive after `pnpm install && pnpm dev`.
- Refactors that touch multiple services are atomic single-PR changes.
- Free remote cache via Vercel; a working self-hosted alternative exists.

### Negative
- All packages are bound to one Node engine version (`>=20` per `package.json#engines`). Diverging Node versions per service is no longer an option without leaving the monorepo.
- Turbo cache misses are the most common dev complaint when adding new pipelines or env-dependent steps; some Turbo learning is unavoidable for anyone authoring new tasks.
- Vendor risk concentrated on one company (Vercel) for the orchestrator. Mitigated by the OSS CLI and self-hosted cache option but worth noting.

### Follow-up decisions
- Vitest workspace configuration for cross-package testing — covered in [ADR-018](./ADR-018-testing-strategy.md).
- Shared TS/ESLint/Prettier configs — covered in [ADR-019](./ADR-019-code-quality-tooling.md).
- Reconsider this ADR if: package count exceeds ~40 (Nx's affected-analysis advantage starts mattering), team grows past ~5 developers (Nx's architectural rules / module boundaries pay off), or Vercel materially changes Turbo's licensing or remote-cache pricing.
