# ADR-003: Mobile application platform

## Status

Accepted
Date: 2026-05-10

## Context

Autodidact is a mobile-first learning product. Users sign up, request a
course, then learn through chat — all on their phone. The mobile app is
the only end-user surface; the API ([ADR-004](../../services/api/ADR-004-rest-api-framework.md))
serves no other client. The platform decision shapes everything downstream
in `apps/mobile`: navigation, UI library, state management, build/release
pipeline.

We need to ship to **both iOS and Android** without doubling engineering
effort. The team is solo / TypeScript-primary. Push notifications, secure
local storage, and OAuth flows are needed at MVP; AR/AR-Kit-style or
deep-native features are not.

## Non-goals

- Routing strategy — see [ADR-014](./ADR-014-mobile-navigation.md).
- UI component system — see [ADR-013](./ADR-013-mobile-ui-system.md).
- State management — see [ADR-015](./ADR-015-mobile-state-management.md).
- Backend API choice or shape — see [ADR-004](../../services/api/ADR-004-rest-api-framework.md).
- Distribution mechanics (EAS Build, App Store, TestFlight) — operational, owned by `apps/mobile/CLAUDE.md`.

## Decision Drivers

- **iOS + Android from one codebase** — small team can't maintain two native codebases.
- **TypeScript-primary team** — language alignment with the rest of the monorepo (shared `packages/types`, `packages/schemas`) is real value.
- **Native feel** — animations, gestures, navigation transitions should feel native. A web-shell experience is not acceptable.
- **OTA updates** — pushing a fix without going through App Review is a meaningful operational lever for a small team.
- **Native API access** — push notifications, secure storage, deep links, biometrics. Common features that should not require reaching for a third-party SDK.
- **Build / release pipeline** — building IPAs and APKs reliably without owning a Mac mini farm.
- **Ecosystem maturity** — libraries we depend on (TanStack Query, Zustand, Tamagui, Supabase, fetch-event-source) need first-class support.
- **Onboarding cost** — solo team, learning curve matters.

## Options Considered

### Option A: Expo + React Native (current)
**What it is:** Managed React Native framework. JavaScript / TypeScript code; native rendering via React Native bridge / new architecture (Hermes + Fabric + TurboModules in 2026). Expo provides build infrastructure (EAS Build), OTA updates (EAS Update), Expo Modules for common native APIs, Expo Router for file-based routing.

**Pros**
- Cross-platform from one TypeScript codebase. Shares `packages/types` and `packages/schemas` directly with the backend.
- EAS Build produces signed iOS and Android binaries from any OS — we don't need a Mac to ship iOS.
- EAS Update pushes JS-only fixes OTA in minutes, bypassing App Review for the JS layer (subject to platform OTA policies).
- Expo SDK covers what we need: Secure Store (auth tokens), Constants, Font, SplashScreen, StatusBar — well-maintained, well-documented.
- React Native ecosystem is large and stable: Tamagui, TanStack Query, Zustand, `@microsoft/fetch-event-source`, `@supabase/supabase-js` all work natively.
- Expo SDK 52 (current) supports the new architecture (Fabric/TurboModules) with Hermes engine for solid runtime performance.
- "Eject" (now "Prebuild") path exists if we need a native module Expo doesn't ship — escape hatch is real.

**Cons**
- React Native bundle and runtime weight is meaningful — typical Expo apps run 30–60 MB on disk and have a JS bridge or new-architecture runtime to start. Cold launch is a few hundred ms, sometimes more.
- Expo's managed workflow restricts which native modules you can use; falling outside the SDK requires Prebuild, which adds setup cost.
- Updates to React Native / Expo SDK occasionally introduce breaking changes; we plan for an upgrade pass each year.
- The new architecture (Fabric / TurboModules) is GA in 2026 but some third-party libraries still have rough edges with it; we sometimes wait for libraries to update.
- iOS-specific behavior (autofill, deep links, push notification subtleties) sometimes requires reading Apple's docs in addition to Expo's; not as transparent as building against UIKit directly.

### Option B: Bare React Native (no Expo)
**What it is:** React Native CLI workflow. We own the iOS and Android Xcode/Android Studio projects directly. No EAS Build / EAS Update; we build via native tooling.

**Pros**
- Maximum control over native modules — any library or custom native code works without restriction.
- No Expo runtime in the bundle; slightly smaller download/install size.
- No vendor relationship with Expo's services.

**Cons**
- We own iOS and Android build infrastructure. iOS specifically requires a Mac to build IPAs — either a CI runner with macOS or a developer Mac. EAS Build solves this for us in Option A.
- No OTA updates without rolling our own (CodePush from Microsoft was deprecated in 2024; Expo Updates is the de-facto OTA solution).
- Common features (Secure Store, Constants, Font loading) become individual library choices; we glue together what Expo's SDK gives us bundled.
- More upfront work; faster only if the team is already deeply native-RN-experienced.

### Option C: Flutter
**What it is:** Google's cross-platform framework. Dart language, custom rendering engine (Skia/Impeller), native-feeling widgets via Material/Cupertino design libraries.

**Pros**
- Excellent UI consistency — same widgets render the same way on both platforms.
- Strong performance characteristics (Skia/Impeller renderer).
- Hot reload DX is best-in-class.
- Single codebase for iOS, Android, web, desktop.

**Cons**
- Dart is not TypeScript. We'd lose all type-sharing with the backend (`packages/types`, `packages/schemas`). The single biggest miss against our monorepo strategy.
- Community / library ecosystem is meaningful but smaller than React Native's. Specifically, our backend SDKs (Supabase JS, our `fetch-event-source` choice) would be replaced with Flutter equivalents of varying maturity.
- The team writes TypeScript everywhere else; adding Dart is a real onboarding tax for a solo team.
- Flutter web exists but is not a drop-in PWA solution.

### Option D: Capacitor + web frontend
**What it is:** Web-first stack (React/TypeScript) wrapped in a Capacitor native shell that gives access to native APIs. Effectively a smart WebView.

**Pros**
- Maximum code reuse with any future web app.
- Familiar web stack (React, CSS, etc.).
- Quick to ship for teams with web-first skills.

**Cons**
- WebView rendering — performance, gestures, scrolling don't feel native. Power-user mobile UX suffers.
- Native module access via Capacitor plugins; less curated than Expo SDK or React Native's ecosystem.
- Cold-start of a WebView app is meaningfully slower than native rendering.
- This approach trades off performance and feel for code reuse; we don't have a web app today, so the "code reuse" payoff is hypothetical.

### Option E: Native iOS (Swift) + Native Android (Kotlin)
**What it is:** Two separate codebases, written in each platform's first-class language.

**Pros**
- Best possible UX, performance, platform integration.
- Access to every platform-specific API the moment Apple/Google ships it.

**Cons**
- Two codebases. Solo team cannot maintain both at any reasonable velocity.
- Two language stacks (Swift, Kotlin), two toolchains (Xcode, Android Studio), two release pipelines.
- Type-sharing with the TS backend is impossible; we'd hand-translate types or generate from OpenAPI.
- Severe over-investment for an MVP-stage product where the differentiator is the AI experience, not a custom-built native UI surface.

### Option F: Progressive Web App (PWA)
**What it is:** Web app installable to home screen; service workers for offline; push notifications via Web Push (limited iOS support historically).

**Pros**
- Single codebase, no app stores, instant updates.
- Cheapest distribution path.

**Cons**
- iOS Web Push historically lagged Android — feature parity has improved through 2024–2026 but mobile Safari restrictions still bite (background, certain APIs).
- "Install to home screen" friction. Most users don't do it.
- PWA discoverability is essentially zero — users find apps through App Store / Play Store.
- Native feel is absent; this is a category we are shipping a mobile-first app to compete in.

## Decision

**We use Expo + React Native.**

## Rationale

Lining up the drivers:

- **iOS + Android from one codebase (#1)**: A, B, C, D, F all yes. E is the only "no."
- **TypeScript-primary (#2)**: A and B win cleanly. D shares language but the runtime is a WebView. C uses Dart. E is two non-TS languages.
- **Native feel (#3)**: A, B, E provide native rendering. C provides custom rendering that *feels* native. D and F are WebView-based and feel less native.
- **OTA updates (#4)**: A wins decisively (EAS Update). B requires us to build OTA. C has Code Push variants but the ecosystem is smaller. D and F update natively (just deploy the web app).
- **Native API access (#5)**: A, B, C, E all comprehensive. D requires Capacitor plugins. F is constrained by web platform APIs.
- **Build / release pipeline (#6)**: A wins (EAS Build builds iOS without a Mac). B requires Mac-based CI. C/E require Xcode anyway.
- **Ecosystem (#7)**: A and B share the React Native ecosystem (largest cross-platform mobile ecosystem in 2026). C's Flutter ecosystem is real but smaller. D's web stack is largest overall but the mobile-specific bits are sparser.
- **Onboarding cost (#8)**: A is lowest for our team because TypeScript + React + npm. B is similar but with extra native config. C requires Dart. E requires Swift + Kotlin.

What we are sacrificing by picking Expo over bare RN:

- Some restrictions on which native modules can be consumed without
  Prebuild. We've not hit a meaningful restriction; if we do, Prebuild
  is the escape hatch.

What we are sacrificing by picking Expo + RN over Flutter:

- Slightly more polished UI primitives in some categories. Tamagui
  ([ADR-013](./ADR-013-mobile-ui-system.md)) brings most of that back to
  our stack.

What we are sacrificing by picking Expo over native (Swift/Kotlin):

- Best-possible per-platform UX. Real, accepted. The math doesn't work
  for a solo team aiming at MVP.

No reconsideration flag is raised. Expo + React Native is the
first-principles choice for a TypeScript team shipping a
cross-platform mobile app on a small headcount.

## Consequences

### Positive
- One TypeScript codebase serves both iOS and Android.
- EAS Build and EAS Update remove our biggest infrastructure burdens (no Mac, no OTA roll-your-own).
- Type sharing with the backend (`packages/types`, `packages/schemas`) is direct.
- Ecosystem covers everything we need today (Tamagui, TanStack Query, Zustand, Supabase, SSE).
- Prebuild escape hatch exists if Expo's managed workflow ever blocks us.

### Negative
- React Native bundle is meaningful (~30–60 MB installed). Mobile users on metered data download a real app.
- Cold launch is several hundred milliseconds — not bad, but slower than native.
- Expo SDK upgrades are an annual chore.
- Some Apple-specific behaviors require digging beyond Expo's docs.

### Follow-up decisions
- Mobile navigation strategy — see [ADR-014](./ADR-014-mobile-navigation.md).
- UI component system — see [ADR-013](./ADR-013-mobile-ui-system.md).
- Mobile state management — see [ADR-015](./ADR-015-mobile-state-management.md).
- Reconsider this ADR if: a deep-native feature (AR, advanced camera/audio, background processing) becomes core to the product and Expo's escape hatches don't suffice; team grows past where one codebase pace per platform is the bottleneck (unlikely soon); or React Native's project momentum stalls relative to Flutter.
