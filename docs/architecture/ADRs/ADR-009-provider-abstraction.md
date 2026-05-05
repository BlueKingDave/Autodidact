# ADR-009: Provider Abstraction for External Dependencies

## Status

Accepted — 2026-05-05

## Context

The system relies on several external services: an LLM provider (initially OpenAI or Anthropic), an embedding provider (initially OpenAI), a job queue (BullMQ/Redis), an auth provider (Supabase), and a LangGraph conversation checkpointer (memory or PostgreSQL). Hardcoding vendor SDKs throughout service code would make vendor switching expensive and make unit testing difficult, since tests would need to make real API calls or resort to monkey-patching.

A pattern was needed to: (a) isolate vendor-specific code in one place, (b) allow env-var-based provider selection without code changes, and (c) enable test doubles in unit tests without mocking entire SDK modules.

## Decision

We define a typed interface for each external dependency category (`ILLMProvider`, `IEmbeddingProvider`, `IQueueProvider`, `IAuthProvider`, `ICheckpointerProvider`) in `packages/providers/src/interfaces/`. Concrete implementations are in `src/implementations/`. Services call factory functions (`createLLMProvider()`, `createQueueProvider()`, etc.) which read environment variables to select the concrete implementation. Services never import concrete provider classes.

## Consequences

### Positive

- Vendor switching (e.g., OpenAI → Anthropic for LLM) requires adding one implementation file and changing an env var — no service code changes.
- Unit tests inject mock providers via `makeMockLLMProvider()` from `@autodidact/config/test-utils` without any real API calls.
- Interfaces make the contract explicit: adding a new implementation requires fulfilling a well-defined interface rather than reverse-engineering call sites.
- The `ProviderConfig` object passed to factory functions allows config overrides without touching `process.env`, making tests deterministic.

### Negative

- Adds an abstraction layer: developers must look up the interface definition to understand what capabilities a provider exposes, rather than reading the SDK docs directly.
- Interface design is a constraint: adding vendor-specific features (e.g., OpenAI structured output parameters, Anthropic extended thinking) requires deciding whether to generalize the interface or bypass the abstraction. Bypassing undermines the isolation.
- Factory functions must be updated when adding new provider options — there is no auto-discovery mechanism.

### Neutral

- `ILLMProvider.getModel()` returns a LangChain `BaseChatModel` rather than a generic type. This makes the interface LangChain-aware by design, since all LLM usage in the agent service flows through LangGraph. A fully vendor-neutral interface would require a heavier abstraction over LangChain itself.
- Currently the Cohere embedding implementation (`cohere-embedding.provider.ts`) is a stub and is not production-ready. The abstraction value is realized when a second implementation is promoted to production quality.

## Alternatives Considered

- **Direct SDK imports in services**: Rejected — would couple service code to specific vendors. Switching LLM providers (e.g., in response to pricing or capability changes) would require changes across multiple files in multiple services and would have no single place to test the swap.
- **Environment-based if/else in service code**: Rejected — equivalent coupling to direct SDK imports, without the interface contract. Producing test doubles would require monkey-patching module-level imports.
- **Full dependency injection framework (tsyringe, InversifyJS)**: Considered for `packages/providers` — would provide a DI container with injection tokens, scoping, and lifecycle management. Rejected for this package because the pattern is simple enough (factory functions + plain objects) that a full DI framework adds ceremony without benefit. Note: the NestJS API service uses NestJS's built-in DI container with injection tokens for providers within that service context; `packages/providers` factory functions integrate cleanly into that model.

## References

- `packages/providers/README.md`
- `packages/config/src/test-utils/mock-factories.ts` (canonical mock implementations)
- ADR-004: NestJS API service (uses provider tokens via `@Inject()` in NestJS DI)
- ADR-005: Fastify agent service (uses manual provider injection via factory functions)
- ADR-006: LangGraph conversations (uses `ILLMProvider` and `ICheckpointerProvider`)
