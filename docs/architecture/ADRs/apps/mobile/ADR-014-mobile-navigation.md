# ADR-014: Mobile navigation

## Status

Accepted
Date: 2026-05-10

## Context

The mobile app has a typical learning-app flow: auth screens → home →
course list → course detail → module chat → results. About 8–12 screens
at MVP, growing modestly. The navigation layer needs to handle stack
transitions, modal presentation, deep links (so a user tapping a
notification lands on a specific module), tab navigation for the home
section, and parameter passing between screens.

This decision is downstream of [ADR-003](./ADR-003-mobile-application-platform.md)
(Expo + React Native). Both options below are React-Native-only choices;
the framework choice constrained the field.

## Non-goals

- Specific routing topology / screen tree — owned by `apps/mobile/app/` (file structure) and `apps/mobile/CLAUDE.md`.
- Deep link URL schema design — operational, owned by `apps/mobile/CLAUDE.md`.
- Authentication-gated route patterns — owned by feature CLAUDE.md.
- Web-vs-native shared routing — out of scope; we have no web app.

## Decision Drivers

- **Native feel** — push/pop animations, swipe-back gestures, modal sheets must match platform conventions.
- **Deep linking** — push notifications and email links need to open the app at a specific screen.
- **Type-safe params** — passing a `courseId` or `moduleId` to a screen should be type-checked, not stringly.
- **File-based vs imperative** — file-based routing scales better in a TS monorepo (the routing tree is the file tree); imperative routing is more flexible but more boilerplate.
- **Ecosystem maturity** — the underlying library has to be the one tutorials and StackOverflow assume.
- **Maintenance trajectory** — solo team, multi-year horizon. The library needs active maintenance.

## Options Considered

### Option A: Expo Router (current)
**What it is:** File-based routing for Expo apps, built on top of React Navigation. Routes are inferred from the `app/` directory structure (Next.js / SvelteKit-style). Layouts via `_layout.tsx` files. Type-safe Linking via generated types.

**Pros**
- File-based routing means the routing tree is visible from the file system. New screen = new file. Less code to maintain than imperative `Stack.Screen` declarations.
- Built on top of React Navigation — inherits its native transitions, gesture support, and deep-link infrastructure.
- Universal links and deep linking work out of the box.
- Generated TypeScript types for routes; passing params is type-safe.
- First-class with Expo (already part of [ADR-003](./ADR-003-mobile-application-platform.md)). EAS Build and EAS Update don't need extra config.
- Active maintenance from the Expo team.

**Cons**
- File-based conventions take a few hours to internalize (group folders `(group)`, layouts, dynamic segments `[id]`).
- Adding a screen pattern that doesn't fit file-based routing (modal flows, nested tab + stack combinations) sometimes requires reaching into React Navigation primitives — works but feels like leaving the abstraction.
- Generated types occasionally lag a screen rename; we run into "type can't find route" until we restart the dev server.
- Tied to Expo's release cadence; if a fix is needed, we wait for the next Expo SDK.

### Option B: React Navigation directly (no Expo Router)
**What it is:** Imperative React Navigation API. We declare `Stack.Navigator`, `Tab.Navigator`, etc., as React components. Navigation tree is in code, not in the file system.

**Pros**
- Maximum flexibility — any topology expressible.
- The library underneath Expo Router. Same native transitions, same gesture support.
- Best when the navigation tree is dynamic (computed at runtime).

**Cons**
- More boilerplate. A new screen requires updating both the screen file and the navigator config.
- Type-safe params require manual typing of the navigator's param list. Easy to forget; often diverges from reality.
- Deep link handling is wired by hand via the `linking` prop. Works but is more setup than Expo Router's automatic version.
- We'd be paying for everything Expo Router would have given us, hand-written.

### Option C: Solito (cross-platform router for RN + Next.js)
**What it is:** A thin compatibility layer that lets the same routing code work in React Native and Next.js. Built on React Navigation + Next.js Router.

**Pros**
- Genuinely useful when one codebase serves both a Next.js web app and a React Native app.
- TypeScript-first.

**Cons**
- Solves a problem we don't have (no Next.js app).
- Adds an abstraction layer that doesn't pay off without the cross-platform use case.
- Smaller community than Expo Router.

## Decision

**We use Expo Router.**

## Rationale

Lining up the drivers:

- **Native feel (#1)**: A and B equivalent (A is built on B). C inherits from B.
- **Deep linking (#2)**: A wins on ergonomics — it's automatic. B works with manual configuration. C is similar to B.
- **Type-safe params (#3)**: A's generated types are convenient. B requires hand-written param lists. C is similar to B.
- **File-based vs imperative (#4)**: A is file-based; B and C are imperative. For a solo team where the screen list is also the file list, A is clearly less code to maintain.
- **Ecosystem (#5)**: A and B both first-class. A is Expo's recommended router, so future Expo features land there first.
- **Maintenance (#6)**: A is actively maintained by the Expo team; tied to the Expo SDK upgrade cadence we already accept.

What we are sacrificing by picking Expo Router over plain React Navigation:

- A bit of flexibility for unusual navigation topologies. We've not hit a
  meaningful constraint; if we do, dropping into React Navigation for
  one screen is supported.

What we are sacrificing by picking Expo Router over Solito:

- Cross-platform routing if we ever build a Next.js web app. We don't have
  one and aren't planning one for the MVP.

No reconsideration flag is raised. Expo Router is the first-principles
choice for an Expo-based mobile app with no web counterpart.

## Consequences

### Positive
- Adding a screen is creating a file. Removing a screen is deleting a file. Less navigator config drift.
- Deep links work without per-route hand-wiring.
- Generated types catch param mismatches at compile time.
- Consistent with the rest of the Expo SDK upgrade story.

### Negative
- File-based conventions need a quick tutorial for new contributors.
- Generated route types occasionally lag renames; a dev-server restart fixes.
- For unusual navigation flows we may need to drop down to React Navigation primitives (which is supported but feels like leaving the abstraction).

### Follow-up decisions
- Specific route conventions (where layouts live, group folder usage) — owned by `apps/mobile/CLAUDE.md`.
- Authentication-gated routing pattern — owned by `apps/mobile/app/_layout.tsx` and the auth feature.
- Reconsider this ADR if: we ever build a Next.js web app and want shared navigation (Solito), Expo Router stops shipping (Expo team-level change), or we hit a navigation pattern Expo Router cannot reasonably express.
