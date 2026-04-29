# Implementations

Concrete provider classes. Each implements one interface from `../interfaces/`. Selected at runtime by the factory functions in `../factory.ts`.

## Directory Structure

```
implementations/
├── llm/
│   ├── openai.provider.ts         # OpenAILLMProvider
│   └── anthropic.provider.ts      # AnthropicLLMProvider
├── embedding/
│   ├── openai-embedding.provider.ts   # OpenAIEmbeddingProvider
│   └── cohere-embedding.provider.ts   # CohereEmbeddingProvider (stub)
├── queue/
│   └── bullmq.provider.ts         # BullMQQueueProvider
├── auth/
│   └── supabase-auth.provider.ts  # SupabaseAuthProvider
└── checkpointer/
    ├── memory.provider.ts         # MemoryCheckpointerProvider
    └── postgres.provider.ts       # PostgresCheckpointerProvider
```

---

## LLM Implementations

### `OpenAILLMProvider`
- **Library**: `@langchain/openai` — `ChatOpenAI`
- **Default model**: `gpt-4o`
- **Temperature**: `0.7`
- **Config**: `{ apiKey, model?, temperature? }`

### `AnthropicLLMProvider`
- **Library**: `@langchain/anthropic` — `ChatAnthropic`
- **Default model**: `claude-opus-4-7`
- **Temperature**: `0.7`
- **Config**: `{ apiKey, model?, temperature? }`
- **Activation**: Set `LLM_PROVIDER=anthropic`

---

## Embedding Implementations

### `OpenAIEmbeddingProvider`
- **Library**: `@langchain/openai` — `OpenAIEmbeddings`
- **Default model**: `text-embedding-3-small`
- **Output dimensions**: 1536
- **Config**: `{ apiKey, model? }`

### `CohereEmbeddingProvider`
- **Status**: Stub — not production-ready. Returns empty arrays.
- **Activation**: Would be activated via `EMBEDDING_PROVIDER=cohere`
- Planned for Phase 3 (Roadmap).

---

## Queue Implementation

### `BullMQQueueProvider`
- **Library**: `bullmq` + `ioredis`
- **Config**: `{ redisUrl }` (default: `redis://localhost:6379`)
- **Queues are created lazily**: A `Queue` instance is created the first time `enqueue()` is called for a given queue name.
- **Job status mapping**:

| BullMQ state | `JobStatus` |
|-------------|------------|
| `waiting`, `waiting-children` | `'pending'` |
| `active` | `'active'` |
| `completed` | `'completed'` |
| `failed` | `'failed'` |
| `delayed` | `'delayed'` |
| unknown / not found | `'pending'` |

---

## Auth Implementation

### `SupabaseAuthProvider`
- **Library**: `@supabase/supabase-js`
- **Config**: `{ supabaseUrl, serviceRoleKey }`
- **Verification**: `supabase.auth.getUser(token)` — validates JWT against Supabase's JWKS endpoint
- **Returns**: `AuthUser { id, supabaseId, email }` where `id` is the app user's UUID and `supabaseId` is the Supabase Auth UUID

---

## Checkpointer Implementations

### `MemoryCheckpointerProvider`
- **Library**: `@langchain/langgraph` — `MemorySaver`
- **Persistence**: In-process only. Lost on service restart.
- **Use case**: Development and testing.
- **Thread isolation**: Multiple threads are isolated by `thread_id` key.

### `PostgresCheckpointerProvider`
- **Library**: `@langchain/langgraph-checkpoint-postgres` — `PostgresSaver`
- **Persistence**: Durable, survives service restarts and scales across instances.
- **Config**: `{ connectionString }` (the `DATABASE_URL`)
- **Initialisation**: Lazy async. The `PostgresSaver` instance calls `.setup()` (creates checkpoint tables) once on first use.
- **Activation**: Set `CHECKPOINTER=postgres`
- **Required for production**: `MemorySaver` causes conversation history loss on every deploy.
