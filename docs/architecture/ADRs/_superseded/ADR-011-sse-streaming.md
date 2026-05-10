# ADR-011: Server-Sent Events for AI Response Streaming

## Status

Accepted — 2026-05-05

## Context

The module chat feature streams AI teacher responses token by token. After the user sends a message, the server generates a response incrementally via a LangGraph graph, and each token must reach the mobile client in real time to display a "typing" effect.

This requires a long-lived, server-initiated data channel. The communication is unidirectional after the initial request — the server streams tokens, the client only listens. The mobile client is React Native (Expo), which does not have a native `EventSource` implementation.

Three transport options were evaluated: WebSockets, SSE, and HTTP long-polling.

## Decision

We use Server-Sent Events (SSE) for AI response streaming. The full flow across three services:

1. Mobile client sends `POST /v1/chat/sessions/:id/stream` with the user message (via `@microsoft/fetch-event-source` in `useSSE.ts`).
2. API service (`ChatController`, `@Sse` decorator) returns an RxJS `Observable<MessageEvent>`. `ChatService.streamMessage()` opens a second SSE connection to the Agent service (`POST /module-chat/stream`) and proxies each `data:` line through an RxJS `Subject`.
3. Agent service (`Fastify`, raw `reply.raw.write()`) streams LangGraph output, emitting four event types in order: `token` (content chunk), `module_complete` (score when the graph signals completion), `complete` (stream end), `error` (on exception).
4. Mobile client receives events via the `useSSE` hook and routes them: `token` events append to the in-progress message, `complete` invalidates the progress query, `error` finalizes the message.

The API acts as an SSE proxy — there are two simultaneous SSE connections per chat turn (client → API, API → Agent).

## Consequences

### Positive

- SSE is unidirectional by design — matches the use case precisely; the server pushes tokens and the client does not send data mid-stream
- SSE works over standard HTTP/1.1; no protocol upgrade handshake required
- The structured event protocol (`type` field in each JSON payload) allows `module_complete`, `complete`, and `error` events to be distinguished from token content without out-of-band signalling
- NestJS `@Sse` with RxJS `Observable<MessageEvent>` integrates cleanly with the existing NestJS controller pattern

### Negative

- React Native does not have a native `EventSource`; the mobile client requires `@microsoft/fetch-event-source` as a polyfill
- The API acts as an SSE proxy rather than streaming directly from the Agent — two simultaneous SSE connections per chat turn; if the API → Agent connection drops, the client connection stalls until the Subject completes or errors
- Client cannot send data mid-stream; interrupting a response requires a separate HTTP request (not yet implemented)
- SSE does not have built-in backpressure; a slow client can cause the Agent's `reply.raw` buffer to grow

### Neutral

- SSE reconnects automatically on connection drop in browser `EventSource` implementations; the `@microsoft/fetch-event-source` polyfill in `useSSE.ts` throws on error (`onerror` throws) and does not auto-reconnect — each send is a new call
- The Agent emits `module_complete` (with `score`) as a distinct event before `complete` (without score); the mobile `useSSE` hook handles only `token`, `complete`, and `error` — module completion detection happens in the API service's `ChatService`, not on the mobile client

## Alternatives considered

- **WebSockets**: Bidirectional capability is unnecessary for streaming tokens. WebSockets add socket lifecycle management (open/close/ping/pong) and a protocol upgrade without benefit for this unidirectional flow. Rejected.
- **HTTP long-polling**: One HTTP round trip per poll cycle means one request per token at minimum. Poor user experience and high server load for token-by-token streaming at this frequency. Rejected.
- **HTTP chunked transfer encoding without SSE framing**: Simpler server-side implementation, but loses the structured event protocol (`type`, `data` fields). Without event types, `module_complete` and `error` events cannot be distinguished from token content without embedding metadata in the content itself. Rejected.

## References

- services/agent/src/routes/module-chat.ts (SSE source — event types: token, module_complete, complete, error)
- services/api/src/modules/chat/chat.service.ts (SSE proxy via RxJS Subject)
- services/api/src/modules/chat/chat.controller.ts (NestJS @Sse controller)
- apps/mobile/src/hooks/useSSE.ts (client implementation via @microsoft/fetch-event-source)
- services/agent/CLAUDE.md (SSE invariants for the agent service)
- services/api/src/modules/chat/CLAUDE.md (SSE bridge invariants for the API service)
