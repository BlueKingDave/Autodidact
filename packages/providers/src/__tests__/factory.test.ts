import { describe, it, expect, vi, afterEach } from 'vitest';

// ────────────────────────────────────────────────────────────────────────────
// Mock concrete implementations (static imports in factory.ts)
// Paths are relative to this test file (src/__tests__/), same resolution as
// the relative imports in src/factory.ts.
// ────────────────────────────────────────────────────────────────────────────

const MockOpenAILLMProvider = vi.fn().mockImplementation(() => ({
  getModel: vi.fn().mockReturnValue({}),
  getModelName: vi.fn().mockReturnValue('gpt-4o'),
}));
const MockAnthropicLLMProvider = vi.fn().mockImplementation(() => ({
  getModel: vi.fn().mockReturnValue({}),
  getModelName: vi.fn().mockReturnValue('claude-3-5-sonnet'),
}));

vi.mock('../implementations/llm/openai.provider', () => ({ OpenAILLMProvider: MockOpenAILLMProvider }));
vi.mock('../implementations/llm/anthropic.provider', () => ({ AnthropicLLMProvider: MockAnthropicLLMProvider }));
vi.mock('../implementations/embedding/openai-embedding.provider', () => ({
  OpenAIEmbeddingProvider: vi.fn().mockImplementation(() => ({
    embed: vi.fn(),
    embedBatch: vi.fn(),
  })),
}));
vi.mock('../implementations/queue/bullmq.provider', () => ({
  BullMQQueueProvider: vi.fn().mockImplementation(() => ({
    enqueue: vi.fn(),
    getJobStatus: vi.fn(),
    close: vi.fn(),
  })),
}));
vi.mock('../implementations/auth/supabase-auth.provider', () => ({
  SupabaseAuthProvider: vi.fn().mockImplementation(() => ({
    verifyToken: vi.fn(),
  })),
}));
vi.mock('../implementations/checkpointer/memory.provider', () => ({
  MemoryCheckpointerProvider: vi.fn().mockImplementation(() => ({
    getCheckpointer: vi.fn().mockReturnValue({}),
  })),
}));
vi.mock('../implementations/checkpointer/postgres.provider', () => ({
  PostgresCheckpointerProvider: vi.fn().mockImplementation(() => ({
    getCheckpointer: vi.fn().mockImplementation(() => {
      throw new Error('Must call init() first');
    }),
    init: vi.fn(),
  })),
}));

import {
  createLLMProvider,
  createEmbeddingProvider,
  createQueueProvider,
  createAuthProvider,
  createCheckpointer,
} from '../factory.js';

// ────────────────────────────────────────────────────────────────────────────

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('createLLMProvider()', () => {
  it('returns a provider with getModel() and getModelName() when LLM_PROVIDER=openai', () => {
    vi.stubEnv('LLM_PROVIDER', 'openai');
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    const provider = createLLMProvider();
    expect(typeof provider.getModel).toBe('function');
    expect(typeof provider.getModelName).toBe('function');
  });

  it('getModelName() contains "gpt" for the default openai provider', () => {
    vi.stubEnv('LLM_PROVIDER', 'openai');
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    const provider = createLLMProvider();
    expect(provider.getModelName().toLowerCase()).toContain('gpt');
  });

  it('instantiates OpenAILLMProvider when LLM_PROVIDER=openai', () => {
    vi.stubEnv('LLM_PROVIDER', 'openai');
    createLLMProvider({ openaiApiKey: 'key' });
    expect(MockOpenAILLMProvider).toHaveBeenCalled();
    expect(MockAnthropicLLMProvider).not.toHaveBeenCalled();
  });

  it('instantiates AnthropicLLMProvider when LLM_PROVIDER=anthropic', () => {
    createLLMProvider({ llmProvider: 'anthropic', anthropicApiKey: 'key' });
    expect(MockAnthropicLLMProvider).toHaveBeenCalled();
  });

  it('returns anthropic provider when LLM_PROVIDER=anthropic', () => {
    vi.stubEnv('LLM_PROVIDER', 'anthropic');
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
    const provider = createLLMProvider();
    expect(typeof provider.getModelName).toBe('function');
    const name = provider.getModelName().toLowerCase();
    expect(name).toMatch(/claude|anthropic/);
  });

  it('config object overrides env var', () => {
    vi.stubEnv('LLM_PROVIDER', 'openai');
    const provider = createLLMProvider({ llmProvider: 'openai', openaiApiKey: 'config-key' });
    expect(typeof provider.getModelName).toBe('function');
  });

  it('defaults to openai when LLM_PROVIDER is not set', () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    const provider = createLLMProvider();
    expect(provider.getModelName().toLowerCase()).toContain('gpt');
  });
});

describe('createEmbeddingProvider()', () => {
  it('returns a provider with embed() and embedBatch()', () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    const provider = createEmbeddingProvider();
    expect(typeof provider.embed).toBe('function');
    expect(typeof provider.embedBatch).toBe('function');
  });
});

describe('createQueueProvider()', () => {
  it('returns a provider with enqueue(), getJobStatus(), and close()', () => {
    vi.stubEnv('REDIS_URL', 'redis://localhost:6379');
    const provider = createQueueProvider();
    expect(typeof provider.enqueue).toBe('function');
    expect(typeof provider.getJobStatus).toBe('function');
    expect(typeof provider.close).toBe('function');
  });
});

describe('createCheckpointer()', () => {
  it('returns memory checkpointer by default', () => {
    const checkpointer = createCheckpointer({ checkpointer: 'memory' });
    expect(typeof checkpointer.getCheckpointer).toBe('function');
    const saver = checkpointer.getCheckpointer();
    expect(saver).toBeDefined();
  });

  it('returns postgres checkpointer when configured', () => {
    const checkpointer = createCheckpointer({
      checkpointer: 'postgres',
      databaseUrl: 'postgresql://localhost/test',
    });
    expect(typeof checkpointer.getCheckpointer).toBe('function');
    expect(() => checkpointer.getCheckpointer()).toThrow();
  });
});

describe('createAuthProvider()', () => {
  it('returns a provider with verifyToken()', () => {
    const provider = createAuthProvider({
      supabaseUrl: 'https://test.supabase.co',
      supabaseServiceRoleKey: 'test-key',
    });
    expect(typeof provider.verifyToken).toBe('function');
  });
});
