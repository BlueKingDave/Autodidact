# State Management

Client state is managed by two Zustand stores in `src/stores/`. Server state is owned by React Query (see [data-flow.md](data-flow.md)).

## auth.store

`src/stores/auth.store.ts`

Persisted to device **SecureStore** via the Zustand `persist` middleware.

| Field | Type | Purpose |
|-------|------|---------|
| `token` | `string \| null` | Supabase JWT. Presence determines auth state. |
| `user` | `UserProfile \| null` | Profile data set after sign-in. |

Actions: `setToken`, `setUser`, `clearSession` (nulls both fields).

The store is read in three places outside React components:

- `app/_layout.tsx` — auth guard watches `token` to redirect between route groups.
- `src/api/client.ts` — `apiFetch` calls `getState().token` to attach the auth header.
- `src/hooks/useSSE.ts` — reads `token` to set the SSE request header.

## chat.store

`src/stores/chat.store.ts`

**In-memory only** — not persisted. Cleared when the app restarts or when `clearMessages()` is called (e.g. when leaving the chat screen).

| Field | Type | Purpose |
|-------|------|---------|
| `messages` | `ChatMessage[]` | Finalised conversation history |
| `streamingContent` | `string` | Accumulates SSE tokens during a live response |
| `isStreaming` | `boolean` | True while an SSE response is in flight |

Actions:

| Action | Effect |
|--------|--------|
| `addUserMessage(content)` | Appends a user message, sets `isStreaming: true`, clears `streamingContent` |
| `appendStreamToken(token)` | Concatenates a new token onto `streamingContent` |
| `finalizeStreamMessage()` | Moves `streamingContent` into `messages` as an assistant message, clears streaming state |
| `setMessages(messages)` | Replaces the entire history (used on initial load) |
| `clearMessages()` | Resets everything to empty |

## Patterns

- **In React components:** use hooks (`useAuthStore(s => s.token)`) with selectors to avoid unnecessary re-renders.
- **Outside React (API, hooks):** use `useAuthStore.getState()` — Zustand stores expose their state synchronously without a hook.
- **Never** import `chat.store` from `auth.store` or vice versa. Cross-store reads go through `getState()` at the call site.
