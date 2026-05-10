# ADR-015: Mobile state management

## Status

Accepted
Date: 2026-05-10

## Context

The mobile app handles two structurally different kinds of state:

1. **Server state** — data that lives on the backend and is cached locally:
   the user's course list, course detail, module progress, chat history.
   These need fetching, caching, refetching on focus, optimistic updates,
   invalidation when something changes.
2. **Client state** — data that lives only on the device: auth tokens
   (already in SecureStore), the current chat input buffer, navigation
   transient state, in-progress modal flags.

These two state shapes have different lifecycles, different invalidation
semantics, and different consumers. The state-management choice should
acknowledge that they're different problems rather than forcing one
abstraction over both.

This decision is downstream of [ADR-003](./ADR-003-mobile-application-platform.md)
(Expo + React Native) and consumes the SSE wire protocol from
[ADR-011](../../services/agent/ADR-011-realtime-streaming-transport.md)
(streamed chat tokens are managed in client state during the stream, then
reconciled into server state after completion).

## Non-goals

- Specific cache key structure or query naming conventions — owned by `apps/mobile/CLAUDE.md`.
- Auth token storage — uses Expo Secure Store, decided in [ADR-003](./ADR-003-mobile-application-platform.md) and [ADR-020](../../cross-cutting/ADR-020-authentication-strategy.md).
- Offline-first / sync strategies — not implemented at MVP; would deserve its own ADR if it ships.
- Form state — owned by individual screen components.

## Decision Drivers

- **Server-state ergonomics** — caching, refetching on focus, optimistic mutations, invalidation. These are not optional; if we don't get them from a library, we hand-roll them.
- **Client-state ergonomics** — ephemeral state across screens, decoupled from React's component tree where helpful.
- **Recognize the two are different** — forcing client state into a server-state library or vice versa is the failure mode we want to avoid.
- **Type safety** — schema-derived types for server data; typed selectors for client state.
- **Bundle size** — RN apps ship every dep to user devices.
- **Mobile-friendly** — must work on RN's runtime; no DOM-only dependencies.
- **Onboarding cost** — solo team, multi-month contributors.
- **Mature ecosystem** — devtools, documentation, patterns in the wild.

## Options Considered

### Option A: TanStack Query + Zustand (current)
**What it is:** TanStack Query (formerly React Query) for server state — typed `useQuery` / `useMutation` hooks, cache, automatic refetching, optimistic updates. Zustand for client state — small, hook-based store, no provider wrapping.

**Pros**
- Each tool optimal for its domain. TanStack Query is the canonical server-state choice in 2026 React; Zustand is the canonical lightweight client-state choice.
- Tiny combined footprint (Zustand is ~1 KB; TanStack Query is meaningfully larger but on par with any server-state library we'd pick).
- Both are mature, both have RN-first compatibility.
- Excellent TypeScript stories — both libraries lean into TS rather than retrofit it.
- Devtools exist for both (TanStack Query devtools work in dev mode on RN).
- Zustand's no-provider model means we don't wrap the app in another context.
- TanStack Query's `useFocusEffect` pattern + auto-refetch-on-app-foreground are well-documented for RN.

**Cons**
- Two libraries instead of one — devs need to learn the philosophy split (server state vs client state).
- Boundaries can blur: where does "currently active course" live? Cache it in TanStack Query as a derived query, or store the id in Zustand and re-fetch? Conventions help.
- TanStack Query's cache is in-memory; on app cold start it's empty unless we wire up the `persistQueryClient` adapter (we do, with a Secure Store adapter).
- Zustand without a middleware lacks Redux-style devtools time-travel; the redux devtools middleware exists but adds setup.

### Option B: SWR + Jotai
**What it is:** SWR for server-state fetching (Vercel's data-fetching library); Jotai for atomic client state (small, atom-based, RN-friendly).

**Pros**
- SWR is simple and lightweight; for basic server-state needs it's hard to beat.
- Jotai's atom model is elegant for fine-grained reactivity.
- Both are TS-first.

**Cons**
- SWR has fewer features than TanStack Query (mutation handling, optimistic updates, infinite queries are less polished).
- Jotai's atom model rewards investment; for our needs it's more abstract than Zustand's plain store.
- Combined community/ecosystem traction is smaller than TanStack Query + Zustand.

### Option C: Redux Toolkit (RTK) + RTK Query
**What it is:** Redux Toolkit for client state (slices, reducers); RTK Query for server state (built into RTK).

**Pros**
- One library, one paradigm.
- RTK Query offers caching and invalidation.
- Redux DevTools time-travel is best-in-class for debugging state changes.

**Cons**
- Boilerplate. Even modern Redux is more code than Zustand for the same use case.
- RTK Query is good but not as featured as TanStack Query for our common patterns (window-focus refetching, persistence, infinite queries).
- Heavier bundle than Zustand + TanStack Query.
- Mental model is bigger; new dev faces actions, slices, the store config.

### Option D: Apollo Client
**What it is:** GraphQL client with caching. Common when the API is GraphQL.

**Pros**
- Excellent for GraphQL APIs.
- Cache normalization handles complex relational data well.

**Cons**
- We have a REST + SSE API ([ADR-004](../../services/api/ADR-004-rest-api-framework.md), [ADR-011](../../services/agent/ADR-011-realtime-streaming-transport.md)). Apollo's value lights up with GraphQL, not REST.
- Heavy library, large bundle.
- Wrong tool for our backend shape.

### Option E: useState / useReducer + manual fetching
**What it is:** No state library. Use React primitives. Fetching with bare `fetch` plus app-level helpers.

**Pros**
- Smallest dependency footprint.
- No abstraction to learn.

**Cons**
- We re-implement caching, refetch-on-focus, dedupe, optimistic updates, mutation handling. Each takes a few days; together they take weeks.
- Solo team. Time spent reinventing TanStack Query is time not spent on product.
- Bugs in hand-rolled cache invalidation are subtle and hard to test.

### Option F: Effector
**What it is:** Reactive state library; events / stores / effects. Strong TypeScript support.

**Pros**
- Powerful reactive model; performant.
- Good TS story.

**Cons**
- Smaller community, less curriculum to draw on.
- The mental model (events / stores / effects) is meaningfully different from React's; not the lowest-friction choice for a small team.
- Doesn't replace a server-state library on its own.

## Decision

**We use TanStack Query for server state and Zustand for client state.**

## Rationale

Lining up the drivers:

- **Server-state ergonomics (#1)**: A wins decisively. TanStack Query's feature set (window-focus refetch, optimistic updates, infinite queries, query invalidation, persistence adapters) is the most complete in the React ecosystem. C's RTK Query is the next contender; B's SWR is meaningfully thinner.
- **Client-state ergonomics (#2)**: A's Zustand is the lightest weight idiomatic React client store. B's Jotai is comparable; C is heavier; D doesn't apply; E is bare React; F is more reactive but less idiomatic.
- **Recognize two are different (#3)**: A is the option that *explicitly* splits server and client state by tool. C tries to handle both with one paradigm, which works but blurs the line.
- **Type safety (#4)**: A, B, C, F all strong. D's caching layer adds type complexity. E is whatever you write.
- **Bundle size (#5)**: A and B smallest. C is meaningful. D is largest.
- **Mobile-friendly (#6)**: All options work on RN; no DOM-only deps to worry about.
- **Onboarding (#7)**: A's two libraries each have a 1–2 hour ramp. C's Redux ramp is longer. F's Effector is longest.
- **Mature ecosystem (#8)**: A is the canonical 2026 choice for new React projects. B is solid. C is mature but waning in new-project share. D is GraphQL-specific.

What we are sacrificing by picking A over a single-library solution like C:

- Slightly larger total mental model (two philosophies, two APIs). Worth it
  for the per-domain ergonomics of each.

What we are sacrificing by picking A over E:

- Approximately three weeks of saved engineering time.

No reconsideration flag is raised. TanStack Query + Zustand is the
first-principles choice for our specific intersection (REST + SSE
backend, mobile-first, solo team, TypeScript).

## Consequences

### Positive
- Server queries are typed, cached, refetched-on-focus by default.
- Optimistic updates for mutations (e.g., marking a module complete) are a few lines.
- Client state stores (auth status, active session id, chat input) are tiny `create(set => ...)` calls without provider wrapping.
- Both libraries have well-known patterns; new contributors can be productive quickly.
- TanStack Query's persistence adapter (with Secure Store) lets cached data survive app restart.

### Negative
- Two libraries, two philosophies. Convention is needed for "is this server state or client state?" — captured in `apps/mobile/CLAUDE.md`.
- TanStack Query devtools require an extra dev-mode setup on RN.
- Cache key conventions are app-author responsibility; mistakes cause stale UI.
- Optimistic updates have to be undone on mutation failure; the rollback logic is a small but real pattern to maintain.

### Follow-up decisions
- Cache key naming conventions, invalidation patterns — owned by `apps/mobile/CLAUDE.md`.
- Persistence strategy (which queries to persist) — operational detail.
- Reconsider this ADR if: TanStack Query's licensing or maintenance trajectory changes, an offline-first sync strategy becomes core to the product (a sync-first library like Replicache or Convex would reframe the question), or the state surface grows to where Redux DevTools' time-travel debugging becomes a real productivity lever.
