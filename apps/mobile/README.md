# @autodidact/mobile

React Native client for Autodidact — an AI-powered learning platform where users generate personalised courses and study through guided chat sessions with an AI tutor.

## Stack

| Concern | Library | Version |
|---------|---------|---------|
| Framework | Expo | 52 |
| Runtime | React Native | 0.76 |
| Routing | Expo Router | 4 |
| UI library | Tamagui | 2.0.0-rc.41 |
| Server state | TanStack Query | 5 |
| Client state | Zustand | 5 |
| Auth / realtime | Supabase | 2 |
| SSE streaming | @microsoft/fetch-event-source | 2 |

## Running

```bash
# From monorepo root
pnpm --filter @autodidact/mobile start     # Expo dev server
pnpm --filter @autodidact/mobile ios       # iOS simulator
pnpm --filter @autodidact/mobile android   # Android emulator
pnpm --filter @autodidact/mobile typecheck # Type-check only (no test runner)
```

`app.json` `extra` block must supply `supabaseUrl`, `supabaseAnonKey`, and `apiBaseUrl`.

## Folder structure

```
apps/mobile/
├── app/                        # Expo Router file-based routes
│   ├── _layout.tsx             # Root: TamaguiProvider + QueryClient + auth guard
│   ├── (auth)/sign-in.tsx      # Unauthenticated entry
│   └── (app)/                  # Authenticated shell (tab navigator)
│       ├── index.tsx           # Dashboard / home
│       ├── profile.tsx
│       ├── courses/index.tsx
│       └── courses/[id]/
│           ├── index.tsx
│           └── modules/[moduleId]/chat.tsx
└── src/
    ├── design/                 # Token → theme → typography → config (single source of truth)
    ├── components/             # Shared UI built on the design system
    ├── stores/                 # Zustand client state (auth, chat)
    ├── api/                    # React Query hooks + typed fetch wrapper
    ├── hooks/                  # Feature-level hooks (SSE, course generation)
    └── lib/                    # Module singletons (Supabase client)
```

## Deeper docs

- [Architecture](docs/architecture.md) — monorepo position, external dependencies, auth flow
- [Frontend architecture](docs/frontend-architecture.md) — routing, screens, provider stack
- [UI system](docs/ui-system.md) — design tokens, themes, component library
- [Data flow](docs/data-flow.md) — REST, SSE streaming, React Query
- [State management](docs/state-management.md) — Zustand stores, persistence, patterns
