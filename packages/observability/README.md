# @autodidact/observability

## Purpose

Structured logging factory (pino) and OpenTelemetry trace initialization for all services. Centralizes observability configuration so individual services do not depend on pino or OpenTelemetry directly.

## Consumers

| Consumer | Usage |
|----------|-------|
| `services/api` | `createLogger('api')` at startup; `initTracer('api')` |
| `services/agent` | `createLogger('agent')` at startup; `initTracer('agent')` |
| `services/worker` | `createLogger('worker')` at startup; `initTracer('worker')` |

## Public API

```typescript
import {
  createLogger,   // pino logger factory
  initTracer,     // OpenTelemetry SDK startup (no-op if endpoint not set)
  shutdownTracer, // graceful OTLP exporter flush
  type Logger,    // ReturnType<typeof createLogger>
} from '@autodidact/observability';
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LOG_LEVEL` | No | `info` | pino log level (`trace`, `debug`, `info`, `warn`, `error`) |
| `NODE_ENV` | No | — | `production` → JSON output; anything else → pino-pretty colorized output |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | — | OTLP collector base URL (e.g. `http://localhost:4318`). If absent, tracing is disabled. |

## Usage Example

```typescript
import { createLogger, initTracer, shutdownTracer } from '@autodidact/observability';

// At service startup
const logger = createLogger('my-service');
initTracer('my-service');   // no-op if OTEL_EXPORTER_OTLP_ENDPOINT is not set

logger.info({ event: 'startup' }, 'Service started');

// Child logger for a sub-component
const dbLogger = logger.child({ component: 'database' });
dbLogger.warn({ query: 'slow-query' }, 'Query exceeded threshold');

// At graceful shutdown
await shutdownTracer();
```

## Internal Structure

```
packages/observability/src/
├── logger.ts   # createLogger() — pino factory; Logger type alias
├── tracer.ts   # initTracer() / shutdownTracer() — OTLP trace SDK
└── index.ts    # Re-exports all of the above
```

## Gotchas

- `initTracer()` is a no-op when `OTEL_EXPORTER_OTLP_ENDPOINT` is unset — safe to call unconditionally in all environments.
- In tests, mock pino-pretty to avoid spawning worker threads: `vi.mock('pino-pretty', () => ({ default: vi.fn(() => process.stdout) }))`.
- `NODE_ENV !== 'production'` activates pino-pretty regardless of specific value — `'development'`, `'test'`, and `undefined` all produce pretty output in development.
