# components/

All shared UI components. Built on Tamagui primitives (XStack, YStack, Text, etc.).
No StyleSheet.create or raw React Native primitives — screens are fully declarative.

Import from the barrel: `import { Card, AppText } from '@/components'`

## layout/

Components that control page structure and safe area behaviour.

**Screen** — wraps every screen. Handles SafeAreaView, background colour via `$bg`
token, and optional ScrollView. Exists so screens don't repeat safe-area boilerplate.
**ErrorBoundary** — React class component. Catches unhandled render errors and shows
  a "Something went wrong" fallback with a retry button. Wraps `<Slot>` in `app/_layout.tsx`.

## typography/

Single source of truth for all text rendering.

**Heading** — structural headings only (h1/h2). Not for inline emphasis.
**AppText** — all other text. `variant` is the primary API:
  - body — default readable text ($text, md)
  - muted — secondary/description text ($textMuted, md)
  - caption — hints, helper text ($textMuted, sm)
  - label — uppercase labels and badge text ($textMuted, xs, semibold)
  - error — validation errors ($danger, sm)
  `size` and `weight` props override the variant's defaults when needed.

## interactive/

Components the user directly acts on.

**Button** — primary/danger/ghost variants, sm/md/lg sizes, built-in loading spinner.
**IconButton** — circular icon-only button. Used for the chat send action.
**Input** — text field with colocated label, error, and helper text. Exists so
  label+field+validation messaging is always kept together as one unit.
**Chip** — single-select toggle. Used for the difficulty picker on HomeScreen.

## display/

Read-only visual components that present data.

**Card** — surface container. default/elevated/ghost variants.
  `onPress` makes it pressable; `disabled` reduces opacity (locked modules).
**Badge** — small status pill. Communicates state at a glance (difficulty, completion).
**ProgressBar** — linear 0–1 fill bar with optional text label. Course completion.
**PositionBadge** — circular module step indicator. Shows step number or ✓ when complete.
**ChatBubble** — message bubble, user and assistant variants. Renders streaming
  cursor while `isStreaming` is true.
**EmptyState** — centred message for lists with no data. Accepts optional `icon` (Ionicons
  name) and `action` ({ label, onPress }) for a call-to-action button.
**Skeleton / SkeletonLine / SkeletonCard** — static grey placeholder blocks for loading
  states. Use `SkeletonLine` for text rows, `SkeletonCard` for card-sized placeholders.
**Toast** — animated notification pill (success/error/info). Auto-dismisses after 3 s.
  Reads from `toast.store` and is rendered exclusively via `ToastProvider`.
**ToastProvider** — absolutely positioned overlay that renders all active toasts from
  `toast.store` with enter/exit animations. Placed in `app/_layout.tsx` as a sibling to
  `<Slot>` so it floats above all screens.
