# Frontend Architecture

## Routing

Expo Router 4 provides file-system routing. Every file under `app/` is a route; no manual navigator config is needed.

```
app/
├── _layout.tsx                          # Root layout (providers + auth guard)
├── (auth)/
│   └── sign-in.tsx                      # /sign-in
└── (app)/
    ├── _layout.tsx                      # Tab navigator
    ├── index.tsx                        # / (Dashboard)
    ├── profile.tsx                      # /profile
    ├── courses/
    │   ├── index.tsx                    # /courses
    │   └── [id]/
    │       ├── index.tsx                # /courses/:id
    │       └── modules/[moduleId]/
    │           └── chat.tsx             # /courses/:id/modules/:moduleId/chat
```

Parentheses groups `(auth)` and `(app)` are route segments that don't appear in the URL. They exist to scope layouts.

## Provider stack

`app/_layout.tsx` owns the two global providers and the auth guard:

```
TamaguiProvider (config + dark theme)
  └── QueryClientProvider (staleTime 30s, retry 1)
        └── Slot (rendered route)
```

The auth guard runs inside `_layout.tsx` via two `useEffect` hooks:

1. Supabase `onAuthStateChange` → writes token into `auth.store`.
2. Watches `token` + `segments` → redirects between `(auth)` and `(app)` using `router.replace`.

`app/(app)/_layout.tsx` renders the tab bar. It reads Tamagui theme values via `useTheme()` to feed React Navigation's `screenOptions` with real hex values.

## Screens

| File | Purpose |
|------|---------|
| `(auth)/sign-in.tsx` | Email/password sign-in form |
| `(app)/index.tsx` | Dashboard: welcome, quick-start course generation |
| `(app)/courses/index.tsx` | Course list with progress indicators |
| `(app)/courses/[id]/index.tsx` | Course detail: module list, per-module progress |
| `(app)/courses/[id]/modules/[moduleId]/chat.tsx` | AI tutor chat for a module |
| `(app)/profile.tsx` | User profile display |

## Conventions

- Screens import only from `@/components` and `@/stores` / `@/api`. No raw Tamagui primitives in screen files.
- Navigation params come from `useLocalSearchParams<{ id: string }>()`.
- No `StyleSheet.create` anywhere. All styling is Tamagui props.
