# ADR-006: LangGraph for AI Conversation Orchestration

## Status

Accepted — 2026-05-05

## Context

The module chat feature requires a stateful, multi-turn AI conversation that:

1. Runs a `teacher` node per user message to respond to the student.
2. Detects when the student has demonstrated sufficient understanding (via a `[MODULE_COMPLETE:score=N]` marker in the LLM response).
3. Conditionally runs an `evaluator` node to produce a structured numeric score (0–100).
4. Persists conversation history across turns so context survives service restarts in production.

This is a conditional, multi-node workflow with shared typed state — not a simple request/response LLM call.

Additionally, the course generation feature needs a retry loop: if the LLM returns malformed or schema-invalid JSON, the node must retry up to 3 times before failing.

A framework was needed for: typed graph state with reducers, conditional edges between nodes, pluggable persistence (checkpointing), and token-level streaming output.

## Decision

We use LangGraph (`@langchain/langgraph`) for all AI graph orchestration in `services/agent/`.

## Consequences

### Positive

- `StateGraph` with typed `Annotation.Root` state and conditional edges cleanly models the `teacher → evaluator` routing without custom dispatcher code.
- Built-in checkpointing (`MemorySaver` / `PostgresSaver`) handles conversation persistence across turns with no custom serialization or storage code.
- `graph.stream()` with `streamMode: 'messages'` yields token-level events directly, enabling SSE streaming with minimal glue code in the route handler.
- Provider abstraction for LLMs works cleanly via LangChain's `BaseChatModel` interface — swapping the underlying model does not change graph code.
- The `messagesStateReducer` handles message appending correctly across checkpointed turns; no custom merging logic is needed.

### Negative

- LangGraph is an evolving library; APIs have shifted between minor versions and may continue to do so.
- Graph determinism requirements: node functions must not use `Math.random()`, `Date.now()`, or other non-deterministic values — these break LangGraph's replay/checkpointing guarantees. (`crypto.randomUUID()` in the blueprint node runs after graph exit and is acceptable.)
- Adding new state keys to a graph that has live checkpointed sessions can break replay for those sessions — schema migrations are not automatic.
- Adds the full LangChain ecosystem dependency surface to this service.

### Neutral

- The checkpointer is swappable via environment variable (`CHECKPOINTER=memory|postgres`). Development uses in-process `MemorySaver`; production uses `PostgresSaver` with the same `DATABASE_URL` used by Supabase (see ADR-002).
- Course generation uses the same framework but is compiled without a checkpointer — it is stateless per request.

## Alternatives considered

- **Custom state machine:** Rejected. Would require reimplementing typed state management, conditional routing, checkpointing, and streaming. LangGraph provides all of these. The development cost of a bespoke solution is not justified.
- **LangChain LCEL (chains without graphs):** Rejected. LCEL does not natively support conditional branching or checkpointed multi-turn state. It is appropriate for single-turn pipelines, not for the teacher/evaluator routing pattern.
- **Vercel AI SDK:** Considered. Good streaming primitives and straightforward SSE integration. Rejected because it has no built-in graph state, conditional routing, or checkpointing. It would require implementing those features manually — the same problem as a custom state machine.
- **Direct LLM SDK calls with custom session storage:** Rejected. Would require implementing message history persistence, retry loops, and conditional routing logic from scratch. High maintenance burden with no framework leverage.

## References

- ADR-002: Supabase (PostgresSaver uses the same `DATABASE_URL`)
- `services/agent/README.md`
- `services/agent/CLAUDE.md`
- `services/agent/src/graphs/module-chat/` (implementation)
- `services/agent/src/graphs/course-generation/` (implementation)
