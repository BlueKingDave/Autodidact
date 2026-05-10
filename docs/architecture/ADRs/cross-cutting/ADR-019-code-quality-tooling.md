# ADR-019: Code quality tooling

## Status

Accepted
Date: 2026-05-10

## Context

Every package and service in the monorepo needs consistent linting and
formatting. We share a base ESLint flat config and a Prettier config from
`packages/config`; each package extends them. Pre-commit runs Prettier;
CI runs both lint and typecheck.

The choice here shapes daily DX: a slow lint discourages "lint on save"; a
permissive lint lets bugs through; conflicting rules across packages waste
review cycles. The TypeScript linting landscape in 2026 has shifted —
Biome is now a credible all-in-one alternative, and Oxlint (Rust-based)
is the fastest pure linter.

## Non-goals

- Specific lint rule choices — owned by `packages/config/eslint.config.base.mjs`.
- Editor integration policy — local dev preference, not project-wide.
- Pre-commit hook framework — operational; we currently use a simple `npm` script + Prettier.
- Type checking — `tsc --noEmit` runs separately; lint and typecheck are different concerns.

## Decision Drivers

- **Catches real TypeScript bugs** — lint rules that understand TypeScript types (`no-floating-promises`, `no-misused-promises`, `await-thenable`) catch real production bugs ESLint without `typescript-eslint` cannot.
- **Speed** — slow lint is a developer-experience drag and a CI cost.
- **Consistency across the monorepo** — eleven packages must share one rule set.
- **Plugin ecosystem** — for Zod, NestJS, React Native we may want lint rules from third parties.
- **Onboarding cost** — solo team. The tool should be familiar to any TypeScript developer.
- **Stability** — a config that breaks on every minor version is a tax.

## Options Considered

### Option A: ESLint + Prettier (current)
**What it is:** ESLint 9 (flat config) for linting, with `typescript-eslint` for type-aware rules. Prettier for formatting. Two tools, two configs, well-trodden setup.

**Pros**
- The de-facto industry standard. Every TypeScript developer has used this combination.
- `typescript-eslint` has the deepest set of type-aware rules — catches real bugs like floating promises and unsafe `any` returns.
- Plugin ecosystem (~4000+ packages) covers framework-specific rules: NestJS, React Native, Zod, security, accessibility.
- Mature integrations with every editor, every CI, every formatter combination.
- Flat config (ESLint 9) is meaningfully cleaner than the legacy `.eslintrc` model.
- Rules and updates are the most thoroughly documented in the ecosystem.

**Cons**
- Slow — ESLint with `typescript-eslint` adds real time on large codebases. Type-aware rules require building a TS program; not free.
- Two tools, two configs to maintain.
- Combined dependency tree is larger (ESLint + several plugins + Prettier + integration libraries).
- Some legacy rules and configurations have unclear deprecation paths; the upgrade tail keeps growing.

### Option B: Biome (single binary, Rust-based)
**What it is:** Single Rust binary that handles linting, formatting, and import organization for JS / TS / JSON / CSS. v2 (2025) added type-aware lint rules (previously a `typescript-eslint`-only feature).

**Pros**
- Single tool replaces ESLint + Prettier. One config, one binary, one mental model.
- 15–50× faster than ESLint + Prettier on raw throughput.
- Format-compatible with Prettier ~97% of the time; migrations show diffs but no functional changes.
- v2 type-aware rules cover the most-impactful subset of `typescript-eslint`.
- Single dependency replaces ~10–15 packages.
- Active maintenance from a small but focused team.

**Cons**
- Rule coverage smaller than ESLint + `typescript-eslint` (~200 vs ~700+). Most common rules covered, but specialty rules (e.g., NestJS-specific patterns, React Native-specific) are sparse or absent.
- Plugin ecosystem is essentially non-existent compared to ESLint's. If we want a third-party rule (e.g., `eslint-plugin-zod` for Zod patterns), we may not find a Biome equivalent.
- Migration cost: rewriting our ESLint flat config as a Biome config. Estimated half-day; mechanical.
- v2 type-aware rules are newer; some edge cases that `typescript-eslint` handles may not yet be covered.
- Format choices differ from Prettier on ~3% of cases — initial migration produces a noisy `git diff`.

### Option C: Oxlint (linter only) + dprint or Biome formatter
**What it is:** Oxlint (Rust-based) for linting, paired with a separate formatter (dprint or Biome's formatter). Often used alongside ESLint as a "fast pre-pass."

**Pros**
- Fastest pure linter (50–100× ESLint's speed; 2× Biome's lint speed).
- Drop-in addition to existing ESLint setup; can run as a pre-pass to catch the obvious issues fast and let ESLint handle the rest.
- Vercel and others have adopted the dual-linter pattern (Oxlint pre-pass + ESLint for specialized rules) for ~60% CI improvements.

**Cons**
- Mostly only valuable as the dual-tool pattern; running Oxlint *alone* gives ~300 rules, less than Biome's ~200 type-aware-augmented set, and well below ESLint's 700+.
- Adopting Oxlint *plus* keeping ESLint means three tools (Oxlint + ESLint + Prettier) instead of two — more complexity, not less.
- For a small team, the dual-linter pattern's setup cost is disproportionate to the savings.

### Option D: Just `tsc --noEmit` — no separate lint
**What it is:** Use TypeScript compiler errors as the only "linting." Skip ESLint entirely. Format with Prettier or Biome.

**Pros**
- TypeScript already catches many classes of issues (missing imports, type mismatches, unused vars with `noUnusedLocals`).
- Simpler toolchain.

**Cons**
- TS type-checking and lint rules cover different categories. `no-floating-promises`, `no-implicit-any` (when you don't enforce strict at every spot), `prefer-const`, "did you mean to await?" are not what `tsc` covers.
- Code-style consistency rules (line length, import ordering, naming conventions) are out of `tsc`'s scope.
- A team without lint accumulates inconsistency over time.

## Decision

**We use ESLint + Prettier.**

## Rationale

Lining up the drivers:

- **Catches TS bugs (#1)**: A wins — `typescript-eslint` is the deepest set of type-aware rules in the ecosystem. B (v2) covers most-impactful rules; gap is narrowing. C is rule-set-poorer.
- **Speed (#2)**: B and C win. A is the slowest of the credible options. At our scale (~11 packages, ~10–20k LOC each), the speed difference exists but isn't yet a daily friction.
- **Consistency across monorepo (#3)**: All options can deliver this with shared config.
- **Plugin ecosystem (#4)**: A wins decisively. B has effectively no plugin ecosystem. C inherits Oxlint's much smaller rule set.
- **Onboarding (#5)**: A is what every TS dev knows. B's config syntax is similar but tooling integrations are less universal.
- **Stability (#6)**: A's flat config is now stable; rules and upgrades are well-documented. B is younger; the v2 release was a significant rule expansion that we'd be adopting on its first major version.

What we are sacrificing by picking ESLint + Prettier over Biome:

- Faster lint (15–50× ratio in published benchmarks). Daily impact on our
  scale: small but real. CI delta: probably 10–30 seconds saved per run.
- A single tool / single config. Real cognitive simplification.

What we are sacrificing by picking ESLint + Prettier over Oxlint + dprint:

- The fastest possible lint. Same kind of marginal-benefit-vs-disruption
  calculus.

We are not raising a reconsideration flag because (a) the ecosystem is
genuinely transitioning — Biome v3 + ecosystem maturity may make the
calculus clearer in 12–18 months, and we'd rather wait for that than
churn now; (b) `typescript-eslint`'s rule depth is real value we use; and
(c) the daily speed cost of ESLint, while real, isn't the binding
constraint on our productivity.

We acknowledge that Biome is the strongest greenfield contender as of
2026 — for a fresh start with no legacy ESLint config, it would be a
defensible first-principles choice.

## Consequences

### Positive
- All packages share one ESLint flat config + one Prettier config from `packages/config`.
- `typescript-eslint`'s type-aware rules catch real bugs in CI.
- New contributors don't have to learn a new linter.
- Plugin ecosystem available if we want framework-specific rules later.

### Negative
- Lint is slower than Biome / Oxlint. Acceptable today.
- Two tools (lint + format) instead of one.
- `typescript-eslint` requires building a TS program, which has an init cost.
- ESLint + Prettier dependency surface is meaningful (~10–15 packages combined).

### Follow-up decisions
- Specific rule selections — owned by `packages/config/eslint.config.base.mjs`.
- Editor / pre-commit integration — local dev preference, not project policy.
- Reconsider this ADR if: lint runtime becomes a measured CI bottleneck (Biome / Oxlint give us 15–50× back), Biome's plugin ecosystem grows enough that we'd not lose anything by switching, or `typescript-eslint`'s maintenance trajectory changes.
