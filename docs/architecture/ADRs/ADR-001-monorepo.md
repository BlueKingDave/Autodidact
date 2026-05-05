# ADR-001: Monorepo with pnpm Workspaces + Turborepo

**Status**: Accepted  
**Date**: 2024

---

## Context

Autodidact comprises three backend services (API, Agent, Worker), one mobile app, and a set of shared libraries (types, schemas, db, providers, prompts, observability, config). These units need to:

- Share TypeScript types and Zod schemas without runtime coupling
- Run coordinated builds, tests, and linting across all packages
- Support independent deployment per service
- Avoid package version drift across consumers

The options considered were:

1. **Separate repositories** — each service in its own Git repo
2. **Single monorepo with pnpm workspaces** — all code in one repo, pnpm manages interdependencies
3. **Single monorepo with Nx** — heavier framework with more built-in features

---

## Decision

Use a **pnpm workspace** monorepo with **Turborepo** for task orchestration.

- `pnpm-workspace.yaml` defines the workspace packages
- `turbo.json` defines task pipelines (`build`, `dev`, `lint`, `typecheck`, `test`) with dependency ordering (`dependsOn: ["^build"]`)
- Shared packages use `workspace:*` protocol for interdependency resolution
- Each package/service has its own `tsconfig.json`, `package.json`, and optional `vitest.config.ts`

---

## Consequences

**Benefits**

- **Shared types prevent drift**: `@autodidact/types` and `@autodidact/schemas` are single sources of truth. The same `CourseBlueprint` type used in the Agent service's graph state is used in the API service's database queries.
- **Turborepo caching**: Unchanged packages are not rebuilt. On CI, only affected packages run. Local builds also benefit from the cache.
- **Single CI pipeline**: One GitHub Actions workflow covers all packages. Cross-package integration (e.g., API calls Worker via queue) is easier to test.
- **Refactoring safety**: Moving a type or renaming a function shows breakage across all consumers at once.
- **Shared config**: `packages/config` provides a single `tsconfig.base.json`, ESLint config, and Prettier config that all packages extend.

**Trade-offs**

- **Bootstrap complexity**: New developers must install pnpm ≥ 9 and understand the workspace topology before running `pnpm dev`.
- **Build ordering**: TypeScript compilation must respect `dependsOn: ["^build"]`. If a shared package is changed, all consumers must rebuild. Turborepo handles this automatically but adds complexity vs. a simple `tsc` call.
- **Node version constraint**: Engines field enforces Node ≥ 20 across the entire workspace. Individual services cannot diverge.
