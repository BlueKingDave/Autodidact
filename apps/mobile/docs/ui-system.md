# UI System

The design system is split into two layers: `src/design/` (values) and `src/components/` (components). Nothing outside these two folders defines colors, spacing, or type sizes.

## src/design/

Dependency chain:

```
tokens → themes ↘
                  config
typography      ↗
```

| File | Responsibility |
|------|---------------|
| `tokens.ts` | Primitive scales: raw hex values, spacing steps, border radius, size, z-index |
| `themes.ts` | Semantic dark theme: maps token values to intent names (`bg`, `surface`, `primary`, `danger`, …) |
| `typography.ts` | System font definition + named type scale (`xs` → `h1`) |
| `config.ts` | Single `createTamagui` call — consumed only by `TamaguiProvider` in `app/_layout.tsx` |

`config.ts` must never be imported from other files in `src/design/` — that creates a circular dependency.

### Theme tokens (dark)

`bg` · `surface` · `surfaceHover` · `overlay` · `text` · `textMuted` · `border` · `primary` · `primaryHover` · `primarySubtle` · `success` · `successSubtle` · `warning` · `warningSubtle` · `danger` · `dangerSubtle` · `userBubble` · `assistantBubble`

Reference in Tamagui props as `$primary`, `$textMuted`, etc.

### Typography scale

`xs` (12) · `sm` (13) · `md` (15) · `lg` (16) · `xl` (18) · `h2` (26) · `h1` (32)

Reference as `fontSize="$3"` (Tamagui numeric key) or use `AppText`/`Heading` which resolve scale names for you.

## src/components/

```
components/
├── typography/
│   ├── AppText.tsx        # Variant text: body | muted | caption | label | error
│   └── Heading.tsx        # Semantic headings: h1 | h2
├── interactive/
│   ├── Button.tsx         # Primary/secondary/ghost, size sm|md|lg
│   ├── IconButton.tsx     # Icon-only pressable
│   ├── Input.tsx          # Compound: label + StyledInput + error/helper text
│   └── Chip.tsx           # Selectable tag
├── display/
│   ├── Card.tsx           # Pressable surface: default | elevated | ghost
│   ├── Badge.tsx          # Status label: default | success | warning | danger
│   ├── ProgressBar.tsx    # Animated horizontal fill bar (0–1 value)
│   ├── ChatBubble.tsx     # User / assistant message bubble; renders inline markdown + timestamp
│   ├── EmptyState.tsx     # Centred empty-list state; optional icon + CTA action
│   ├── PositionBadge.tsx  # Numbered module step indicator
│   ├── Skeleton.tsx       # SkeletonLine (text row) and SkeletonCard (card placeholder)
│   ├── Toast.tsx          # Animated success/error/info notification pill
│   └── ToastProvider.tsx  # Overlay renderer for active toasts (place in root layout)
├── layout/
│   ├── Screen.tsx         # Safe-area scroll container
│   └── ErrorBoundary.tsx  # React class error boundary with retry fallback
└── index.ts               # Barrel: all components re-exported from one path
```

Import everything from `@/components`.

## Adding something new

- **New color:** add to `tokens.ts` first, then add a semantic name in `themes.ts`.
- **New component:** add to the appropriate sub-folder, export from `index.ts`, add an entry to the sub-folder's `README.md`.
- **Light theme:** add a second export to `themes.ts` and pass it to `createTamagui` in `config.ts`.
