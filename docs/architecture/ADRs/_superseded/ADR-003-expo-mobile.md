# ADR-003: Expo + React Native for Mobile

**Status**: Accepted  
**Date**: 2024

---

## Context

Autodidact is a mobile-first product. The MVP requires:

- iOS and Android apps from a single codebase
- A small team (likely one developer owning mobile)
- Managed build and distribution pipeline
- File-based routing for a clear screen hierarchy
- Server-Sent Events support for streaming chat
- Secure local storage for auth tokens

Options considered:

1. **Flutter** — Dart, single codebase, strong native performance
2. **Expo + React Native** — JavaScript/TypeScript, managed toolchain, large ecosystem
3. **Bare React Native** — React Native without Expo, more native control
4. **Swift (iOS only)** — native, best iOS performance, no Android coverage

---

## Decision

Use **Expo** with **React Native** and **TypeScript**. Specifically:

- **Expo Router** for file-based navigation (routes are `app/(auth)/`, `app/(app)/`, mirroring Next.js conventions)
- **EAS Build** for managed iOS and Android builds (no Xcode/Android Studio setup required locally)
- **TanStack Query v5** for server state (course lists, progress, job polling with `refetchInterval`)
- **Zustand v5** for client state (auth token in `SecureStore`, in-flight chat messages)
- **`@microsoft/fetch-event-source`** for SSE streaming (React Native lacks a native `EventSource`)

---

## Consequences

**Benefits**

- **Single codebase**: iOS and Android ship from the same TypeScript source. No feature divergence.
- **Shared types**: The mobile app imports directly from `@autodidact/types` and `@autodidact/schemas` via the monorepo workspace. Types are consistent with the backend.
- **Managed builds**: EAS Build abstracts away the iOS provisioning profile and Android keystore complexity. CI can trigger builds without a Mac runner.
- **Expo Router**: File-based routing gives clear separation between auth screens `(auth)` and app screens `(app)`. The route group convention prevents auth screens from being nested inside the app layout.
- **SecureStore**: Tokens are stored in the device keychain (iOS) and Android Keystore via `expo-secure-store`, not AsyncStorage. This prevents tokens from being extracted from an unencrypted SQLite file.

**Trade-offs**

- **Native capability limits**: Expo managed workflow limits access to low-level native modules. If the app requires Bluetooth, custom camera pipelines, or background audio, a bare workflow or native module would be needed.
- **Expo SDK coupling**: Expo SDK version upgrades are periodic and sometimes require migration work (e.g., `expo-router` API changes). The project is pinned to Expo SDK 52 / React Native 0.76.3.
- **Bundle size**: React Native bundles are larger than native apps. Not a problem for a learning app but worth noting.
- **SSE polyfill**: React Native's `fetch` does not support streaming responses. `@microsoft/fetch-event-source` works around this but adds a dependency and slightly different error handling behaviour compared to browser `EventSource`.
