# Module: Chat

## Responsibility

Manages chat sessions between users and the AI teacher. Owns session creation, message persistence, SSE stream proxying from the Agent service, and triggering module completion logic.

## Files

| File | Description |
|------|-------------|
| `chat.controller.ts` | `POST /chat/sessions`, `POST /chat/sessions/:id/stream` (SSE) |
| `chat.service.ts` | Session lifecycle, SSE proxy logic, message persistence |
| `chat.module.ts` | NestJS module wiring |

## Session Lifecycle

```
1. Client calls POST /chat/sessions { moduleId, courseId }
     → INSERT chat_sessions row (userId, moduleId, threadId=UUID, messages=[])
     → return { id, messages }

2. Client calls POST /chat/sessions/:id/stream { content }
     → Append user ChatMessage to JSONB column
     → Proxy Agent SSE stream
     → Accumulate assistant content
     → Persist assistant ChatMessage to JSONB
     → If completionScore >= 60 → ProgressService.completeModule()
```

## SSE Proxy Pattern

The API acts as a transparent proxy between the mobile app and the Agent service:

```
Mobile ←──SSE──── API Service ←──SSE──── Agent Service
                 (RxJS Subject)         (raw reply.raw.write)
```

Implementation detail:

1. `ChatService.streamMessage()` returns `Observable<MessageEvent>` (RxJS)
2. `ChatController` decorates the endpoint with `@Sse()` — NestJS converts the Observable to an HTTP SSE response
3. Inside `streamMessage()`, a `Subject<MessageEvent>` is created
4. A native `fetch()` call reads the Agent's SSE stream via `ReadableStream.getReader()`
5. Each parsed event is pushed to the Subject → forwarded to the client
6. When the reader is done, `subject.complete()` closes the client SSE connection

## Message Persistence

Chat history is stored in the `chat_sessions.messages` JSONB column as `ChatMessage[]`. Each turn:

1. User message appended **before** calling Agent (so the Agent sees the full history via its own checkpointer)
2. Assistant message accumulated from token events, appended **after** the stream completes

## Completion Handling

The Agent emits a `module_complete` event with a score when the teacher node signals completion. However, the API service uses the score from the `complete` event (which echoes the final state), not the `module_complete` event, to avoid a race condition.

Score threshold: **≥ 60** triggers `ProgressService.completeModule()`. Scores below 60 do not mark the module as completed.

## Key Dependency

`ChatModule` imports `ProgressModule` to call `ProgressService` on completion. This is the only cross-module dependency in the API service.
