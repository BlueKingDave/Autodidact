# ADR-020: Authentication strategy

## Status

🚩 Accepted with reconsideration flag
Date: 2026-05-10

🚩 Reconsideration flag: Better Auth (self-hosted, Drizzle-native, no vendor lock-in) is a stronger first-principles fit for our stack than Supabase Auth. Staying with Supabase Auth because the auth.users / RLS coupling makes migration a 1–2 week project rather than a swap. Migration trigger: a security/scaling event with Supabase, or a planned auth refresh once we have spare engineering bandwidth.

## Context

Autodidact users sign up, sign in, and stay logged in across sessions on the
mobile app. The API verifies a JWT on every protected request. There is one
user role (no enterprise SSO, no admin/staff hierarchy yet). The mobile app
talks only to the API for protected resources; it talks to the auth provider
directly for the sign-in / sign-up flows.

This decision is closely entangled with the database platform
([ADR-002](./ADR-002-database-platform.md)): Supabase bundles DB and Auth,
and many of the patterns in our codebase (RLS policies that reference
`auth.uid()`, the `users` table joined via `supabaseId`) assume Supabase Auth.
Treating DB and Auth as one decision was the previous framing in the now-
superseded ADR-002. We now treat them as separable so the rationale for each
is honest.

This ADR consumes [ADR-009](../packages/providers/ADR-009-external-vendor-abstraction.md):
auth flows through `IAuthProvider` in `packages/providers`. A vendor swap is
a one-implementation-file change *in principle* — the friction comes from
RLS and `auth.users` coupling, not the code abstraction.

## Non-goals

- Database platform — see [ADR-002](./ADR-002-database-platform.md).
- The provider abstraction shape — see [ADR-009](../packages/providers/ADR-009-external-vendor-abstraction.md).
- Multi-tenancy / org / role models — out of scope for the MVP.
- SSO, MFA, passkey configuration policy — operational decisions, owned by `services/api/src/modules/auth/CLAUDE.md`.

## Decision Drivers

- **Mobile-first sign-in flow** — React Native client; the SDK ergonomics on RN matter as much as on web.
- **JWT verification on the API** — API has to verify signed tokens cheaply and offline (no per-request callback to the auth provider).
- **Cost at MVP and at 50k+ MAUs** — pricing pressure intensifies past free tier; we're cost-sensitive.
- **DB / RLS integration** — RLS policies reference `auth.uid()` in current migrations; whatever we pick has to be RLS-compatible or we rebuild that policy layer ourselves.
- **Operational burden** — solo team. Self-hosting auth shifts security maintenance onto us.
- **Vendor concentration** — concentration with [ADR-002](./ADR-002-database-platform.md) means a single Supabase incident can take down both DB and login. Real risk.
- **TypeScript-native ergonomics** — type-safe session, type-safe custom claims, integration with Drizzle for our `users` table.
- **Future portability** — auth is an annoying thing to migrate; our choice should leave a clean exit.

## Options Considered

### Option A: Supabase Auth (current)
**What it is:** Email/password, OAuth, magic links, JWT issuance, password reset — all served by Supabase. Mobile app uses `@supabase/supabase-js` for sign-in. API verifies JWTs via the `IAuthProvider` interface, which calls `supabase.auth.getUser(token)` (or verifies with the JWT secret directly for offline verification).

**Pros**
- Bundled with [ADR-002](./ADR-002-database-platform.md). One less vendor to wire up; one less env var pile.
- RLS works natively via `auth.uid()`. Our migration `0003_rls.sql` already uses this pattern.
- Free tier covers 100k MAUs; Pro tier ($25/mo) raises that and adds richer features. At our scale, effective cost is $0.
- Mobile React Native SDK is well-maintained; sign-in screen is a 30-line component.
- Email + OAuth providers + magic links + phone OTP all out of the box.

**Cons**
- Vendor concentration with the DB. One Supabase outage takes down both login and persisted data simultaneously. No graceful-degradation story.
- TypeScript ergonomics for custom session fields are partial — adding typed claims requires manual augmentation.
- The bundle ties us in: RLS policies plus `auth.users` references mean migrating off Supabase Auth is also a migration off Supabase RLS, which is a meaningful project even with the `IAuthProvider` abstraction.
- DX gap vs Clerk on UI components — Supabase ships hooks but no pre-built drop-in UI for React Native.

### Option B: Clerk
**What it is:** Hosted auth with first-class React + React Native SDKs and pre-built UI. JWT-based, signed by Clerk; API verifies via Clerk's JWKS endpoint or a static JWT key. Custom claims supported.

**Pros**
- Best DX in 2026 for React-flavored apps; the pre-built UI components save real time on the sign-in / profile-management UX.
- React Native SDK improved meaningfully through 2025; supports OAuth, passkeys, MFA out of the box.
- TypeScript types for custom claims are first-class and well-typed.
- Hosted infra is mature and well-monitored; free tier covers 10k MAUs.
- Independent of [ADR-002](./ADR-002-database-platform.md) — separate vendor risk profile.

**Cons**
- $0.02/MAU after the 10k free tier. At 50k MAUs that's ~$800/month — meaningfully more than Supabase Auth.
- Custom JWT verification on the API requires JWKS fetching + caching (mostly off-the-shelf with `jose`, but we'd add the wiring; current `jose` dependency in `packages/providers` makes it easy).
- RLS integration requires us to wire `clerk_user_id → app_user_id` bridging in our DB schema. Not impossible — every Clerk + Supabase or Clerk + Postgres tutorial covers it — but it's a non-trivial layer.
- Clerk is tightly tied to React. RN works but is meaningfully behind web in features and polish.
- Concentration risk shifts from "Supabase down = both DB and auth down" to "DB on one vendor, auth on another" — better isolation, but two vendor relationships.

### Option C: Auth0
**What it is:** Enterprise identity platform, OIDC-compliant, decades of operations track record.

**Pros**
- The most mature product in this space. SAML, SSO, fine-grained RBAC, enterprise compliance, audit trails.
- Token verification is straightforward standard OIDC; works against any backend.

**Cons**
- Pricing aimed at enterprise: ~$0.07/MAU after free tier; at 100k MAUs the bill is dramatically higher than Supabase or Clerk.
- DX feels dated in 2026 vs Clerk; documentation is broad but onboarding is longer.
- Severe overspec for a single-role consumer mobile app at MVP stage.
- We'd be paying for SSO, RBAC, and enterprise features we'd not use for at least a year.

### Option D: Better Auth (self-hosted TypeScript library)
**What it is:** Modern TypeScript-native auth library. Replaces the deprecated Lucia (Lucia was sunset in March 2025; Better Auth is the de-facto successor in 2026 with ~500k weekly downloads). Stores sessions in our own Postgres via Drizzle. Plugins for OAuth, passkeys, MFA, email/password, and more.

**Pros**
- TypeScript-native, including type inference for custom session fields and plugins. Best-in-class TS ergonomics in 2026.
- Native Drizzle adapter — sessions and users live in our Postgres ([ADR-008](../packages/db/ADR-008-orm-data-access.md)). No additional database. RLS we control fully.
- Free at any scale; no per-MAU pricing, no vendor pricing surprises.
- Plugin ecosystem covers OAuth, magic link, passkeys, organizations, RBAC, rate limiting, 2FA — current as of 2026.
- Eliminates vendor concentration risk with the DB; we own the auth surface end-to-end.
- Easy to extend: custom session claims, custom tables, custom flows are first-class.

**Cons**
- We own the operational responsibility for auth: vulnerability response, rate limiting, brute-force defense, suspicious-activity flagging, password reset email delivery, audit logging.
- Library is young (rapid growth, but has not been in production at scale for as long as Supabase Auth or Clerk). Real production track record is months-to-a-year, not years.
- Building the React Native sign-in flow against Better Auth is a from-scratch UI effort vs. Clerk's pre-built components.
- Email delivery for verification / password reset is our problem (Resend / SES / SMTP). Adds an integration.
- The migration cost from Supabase Auth would be 1–2 weeks of focused work (move users table, rewrite RLS, swap mobile sign-in, swap API verification).

### Option E: Custom JWT — roll our own
**What it is:** Hand-rolled email/password storage, password hashing (argon2 / scrypt), JWT issuance via `jose`, no library dependency.

**Pros**
- Maximum simplicity for the trivial case; no library to learn.
- Zero recurring cost.

**Cons**
- Auth is one of the most security-sensitive parts of the system; hand-rolled is asking for OWASP-list issues.
- Every standard feature (password reset, OAuth, magic links, MFA, rate limiting, account lockout, audit trail) becomes a custom build.
- Time to ship a feature-complete custom auth >> time to integrate any of A/B/C/D.
- Would only consider this if we had unique requirements no provider could meet. We don't.

### Option F: Firebase Auth
**What it is:** Google's auth-as-a-service. JWTs signed by Google; verified via Firebase Admin SDK or JWKS.

**Pros**
- Mature, scaled, generous free tier.
- React Native SDK is well-maintained.
- Aligns with [ADR-012](../infra/ADR-012-cloud-hosting-platform.md) (we're on GCP for hosting), so vendor relationship overlaps cleanly.

**Cons**
- Pairing Firebase Auth with Supabase DB is unusual and adds a vendor relationship (Google) without removing one (Supabase). Same number of vendors with worse integration.
- RLS would be re-built — `auth.uid()` is a Supabase concept; we'd map `firebase_uid` to user rows ourselves.
- Documentation patterns for "Firebase Auth + non-Firebase DB + Postgres + RLS" are sparse.

## Decision

**We use Supabase Auth.**

## Rationale

Lining up the drivers:

- **Mobile-first (#1)**: A, B, F all yes; D self-built; C and E are higher friction.
- **JWT verification (#2)**: A, B, C, D, F all yes; trivial with `jose` for any of them.
- **Cost at MVP and 50k+ (#3)**: A free at our scale; D free at any scale; B costs at 50k+; C is enterprise-priced.
- **DB / RLS integration (#4)**: A is best by far — RLS uses `auth.uid()` natively. D is good but requires us to write RLS ourselves against our own users table. B, C, F all require an `external_id ↔ user_row` bridge; RLS rewrite is real work.
- **Operational burden (#5)**: A, B, C, F are managed; D shifts auth security onto us; E is the worst case here.
- **Vendor concentration (#6)**: A worst (concentration with DB). B/C/F best (auth split from DB). D best (no vendor at all).
- **TypeScript ergonomics (#7)**: D best, B strong, A partial.
- **Future portability (#8)**: D best, then B/C/F, then A (because of RLS coupling).

The first-principles ranking favors **D (Better Auth)** for our stack: TypeScript-native, Drizzle-native ([ADR-008](../packages/db/ADR-008-orm-data-access.md)), free at all scales, no vendor concentration. The cons are real (operational burden, younger library) but manageable.

We are choosing **A (Supabase Auth)** anyway because:
1. The bundled DB ([ADR-002](./ADR-002-database-platform.md)) means the migration is "DB + Auth + RLS" in lockstep — ~1–2 weeks of focused work — not a hot-swap.
2. RLS policies in current migrations reference `auth.uid()`. Replacing them is mechanical but involves every protected table.
3. Solo team, MVP stage. We do not have the bandwidth to take on auth's security surface area when a managed option works.
4. Cost is $0 at our scale; the per-MAU pricing concern that would drive us toward D doesn't bite yet.

This is a **convenience-over-merit choice**. The reconsideration flag is real and warranted.

> 🚩 **Reconsideration flag:** Better Auth would be a stronger long-term technical fit (no vendor concentration with DB, free at scale, full TypeScript types, Drizzle native, full RLS control). Staying with Supabase Auth because the bundled DB and existing RLS coupling make the migration a 1–2 week project rather than a one-day swap. Migration trigger: (a) a Supabase Auth incident that disrupts production for >2 hours, (b) MAU growth that pushes Supabase costs past ~$200/month, (c) requirement for a custom session feature that Supabase doesn't support cleanly, or (d) a planned "auth refresh" sprint when we have engineering bandwidth.

## Consequences

### Positive
- Sign-in flow on mobile and JWT verification on the API are both off-the-shelf — minimum work to ship.
- RLS uses `auth.uid()` directly; defense-in-depth for free.
- $0 at MVP scale; predictable up to mid-five-figure MAU.
- No additional integrations (email delivery, JWT signing keys, password storage) to operate.

### Negative
- Auth and DB share a vendor; an outage hits both.
- TypeScript ergonomics for custom claims are weaker than Better Auth's; we'll likely accept some `any` or manual types.
- Schema-level coupling (RLS, `auth.users` references) means migrating off Supabase Auth is migrating off Supabase, full stop.
- Reliance on Supabase's roadmap for features (passkeys, advanced session management).

### Follow-up decisions
- This ADR is dependent on [ADR-002](./ADR-002-database-platform.md). If that ADR is reopened, this one is reopened automatically.
- Reconsider when any of the migration triggers above fire, or proactively at each major release if Better Auth's traction continues.
- Operational policies for password reset, MFA enforcement, account lockout — owned by `services/api/src/modules/auth/CLAUDE.md`, not this ADR.
