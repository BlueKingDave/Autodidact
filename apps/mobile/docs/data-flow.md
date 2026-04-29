# Data Flow

## REST — React Query + apiFetch

All REST calls go through `src/api/client.ts:apiFetch`, which:

- Reads the base URL from `app.json` `extra.apiBaseUrl` (falls back to `http://localhost:3000/v1`).
- Reads the JWT from `auth.store.getState().token` (non-reactive, safe to call outside React).
- Attaches `Authorization: Bearer <token>` on every request.
- On a 401 response, calls `clearSession()` — the auth guard in `_layout.tsx` then redirects to sign-in.

React Query hooks live in `src/api/`:

| File | Hooks |
|------|-------|
| `courses.ts` | `useCourses`, `useCourse`, `useJobStatus`, `useCreateCourse` |
| `progress.ts` | `useCourseProgress` |

Global defaults: `staleTime: 30_000`, `retry: 1`.

## Streaming — SSE chat

`src/hooks/useSSE.ts` handles the AI chat stream using `fetchEventSource` (a fetch-compatible SSE client that works in React Native).

Flow for a single user message:

```
useSSE.send(content)
  → useChatStore.addUserMessage()         # optimistic: add user bubble, set isStreaming
  → POST /chat/sessions/:id/stream
      onmessage { type: 'token' }         → useChatStore.appendStreamToken()
      onmessage { type: 'complete' }      → useChatStore.finalizeStreamMessage()
                                          → queryClient.invalidateQueries(['progress'])
      onmessage { type: 'error' }         → useChatStore.finalizeStreamMessage()
      onerror                             → useChatStore.finalizeStreamMessage()
```

The chat screen renders `streamingContent` from the store as a live-updating bubble while `isStreaming` is true. On `finalizeStreamMessage`, the accumulated string becomes a permanent message and `streamingContent` is cleared.

## Course generation polling

`src/hooks/useCourseGeneration.ts` wraps `useJobStatus` (polling React Query hook) and watches for a `completed` status to navigate the user to the new course. The hook returns `{ isGenerating, failed, status }` for the UI to render a progress state.
