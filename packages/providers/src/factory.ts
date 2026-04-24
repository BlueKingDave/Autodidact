import type { ILLMProvider } from './interfaces/llm.js';
import type { IEmbeddingProvider } from './interfaces/embedding.js';
import type { IQueueProvider } from './interfaces/queue.js';
import type { IAuthProvider } from './interfaces/auth.js';
import type { ICheckpointerProvider } from './interfaces/checkpointer.js';

export interface ProviderConfig {
  llmProvider?: string;
  embeddingProvider?: string;
  queueProvider?: string;
  authProvider?: string;
  checkpointer?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  redisUrl?: string;
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  supabaseJwtSecret?: string;
  databaseUrl?: string;
}

function fromEnv(): ProviderConfig {
  return {
    llmProvider: process.env['LLM_PROVIDER'] ?? 'openai',
    embeddingProvider: process.env['EMBEDDING_PROVIDER'] ?? 'openai',
    queueProvider: process.env['QUEUE_PROVIDER'] ?? 'bullmq',
    authProvider: process.env['AUTH_PROVIDER'] ?? 'supabase',
    checkpointer: process.env['CHECKPOINTER'] ?? 'memory',
    openaiApiKey: process.env['OPENAI_API_KEY'],
    anthropicApiKey: process.env['ANTHROPIC_API_KEY'],
    redisUrl: process.env['REDIS_URL'],
    supabaseUrl: process.env['SUPABASE_URL'],
    supabaseServiceRoleKey: process.env['SUPABASE_SERVICE_ROLE_KEY'],
    supabaseJwtSecret: process.env['SUPABASE_JWT_SECRET'],
    databaseUrl: process.env['DATABASE_URL'],
  };
}

export async function createLLMProvider(config?: ProviderConfig): Promise<ILLMProvider> {
  const cfg = config ?? fromEnv();
  const provider = cfg.llmProvider ?? 'openai';

  if (provider === 'anthropic') {
    const { AnthropicLLMProvider } = await import(
      './implementations/llm/anthropic.provider.js'
    );
    if (!cfg.anthropicApiKey) throw new Error('ANTHROPIC_API_KEY is required');
    return new AnthropicLLMProvider(cfg.anthropicApiKey);
  }

  const { OpenAILLMProvider } = await import('./implementations/llm/openai.provider.js');
  if (!cfg.openaiApiKey) throw new Error('OPENAI_API_KEY is required');
  return new OpenAILLMProvider(cfg.openaiApiKey);
}

export async function createEmbeddingProvider(config?: ProviderConfig): Promise<IEmbeddingProvider> {
  const cfg = config ?? fromEnv();
  const provider = cfg.embeddingProvider ?? 'openai';

  if (provider === 'cohere') {
    const { CohereEmbeddingProvider } = await import(
      './implementations/embedding/cohere-embedding.provider.js'
    );
    return new CohereEmbeddingProvider('');
  }

  const { OpenAIEmbeddingProvider } = await import(
    './implementations/embedding/openai-embedding.provider.js'
  );
  if (!cfg.openaiApiKey) throw new Error('OPENAI_API_KEY is required');
  return new OpenAIEmbeddingProvider(cfg.openaiApiKey);
}

export async function createQueueProvider(config?: ProviderConfig): Promise<IQueueProvider> {
  const cfg = config ?? fromEnv();
  const { BullMQQueueProvider } = await import(
    './implementations/queue/bullmq.provider.js'
  );
  const { default: IORedis } = await import('ioredis');
  const redis = new IORedis(cfg.redisUrl ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });
  return new BullMQQueueProvider(redis);
}

export async function createAuthProvider(config?: ProviderConfig): Promise<IAuthProvider> {
  const cfg = config ?? fromEnv();
  const { SupabaseAuthProvider } = await import(
    './implementations/auth/supabase-auth.provider.js'
  );
  if (!cfg.supabaseUrl || !cfg.supabaseServiceRoleKey || !cfg.supabaseJwtSecret) {
    throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_JWT_SECRET are required');
  }
  return new SupabaseAuthProvider(
    cfg.supabaseUrl,
    cfg.supabaseServiceRoleKey,
    cfg.supabaseJwtSecret,
  );
}

export async function createCheckpointerProvider(config?: ProviderConfig): Promise<ICheckpointerProvider> {
  const cfg = config ?? fromEnv();
  const type = cfg.checkpointer ?? 'memory';

  if (type === 'postgres') {
    const { PostgresCheckpointerProvider } = await import(
      './implementations/checkpointer/postgres.provider.js'
    );
    if (!cfg.databaseUrl) throw new Error('DATABASE_URL is required for postgres checkpointer');
    return new PostgresCheckpointerProvider(cfg.databaseUrl);
  }

  const { MemoryCheckpointerProvider } = await import(
    './implementations/checkpointer/memory.provider.js'
  );
  return new MemoryCheckpointerProvider();
}
