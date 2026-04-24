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
  databaseUrl?: string;
}

export function createLLMProvider(config: ProviderConfig = {}): ILLMProvider {
  const provider = config.llmProvider ?? process.env['LLM_PROVIDER'] ?? 'openai';
  if (provider === 'anthropic') {
    const { AnthropicLLMProvider } = require('./implementations/llm/anthropic.provider.js');
    return new AnthropicLLMProvider({
      apiKey: config.anthropicApiKey ?? process.env['ANTHROPIC_API_KEY'] ?? '',
    });
  }
  const { OpenAILLMProvider } = require('./implementations/llm/openai.provider.js');
  return new OpenAILLMProvider({
    apiKey: config.openaiApiKey ?? process.env['OPENAI_API_KEY'] ?? '',
  });
}

export function createEmbeddingProvider(config: ProviderConfig = {}): IEmbeddingProvider {
  const { OpenAIEmbeddingProvider } = require('./implementations/embedding/openai-embedding.provider.js');
  return new OpenAIEmbeddingProvider({
    apiKey: config.openaiApiKey ?? process.env['OPENAI_API_KEY'] ?? '',
  });
}

export function createQueueProvider(config: ProviderConfig = {}): IQueueProvider {
  const { BullMQQueueProvider } = require('./implementations/queue/bullmq.provider.js');
  return new BullMQQueueProvider({
    redisUrl: config.redisUrl ?? process.env['REDIS_URL'] ?? 'redis://localhost:6379',
  });
}

export function createAuthProvider(config: ProviderConfig = {}): IAuthProvider {
  const { SupabaseAuthProvider } = require('./implementations/auth/supabase-auth.provider.js');
  return new SupabaseAuthProvider({
    supabaseUrl: config.supabaseUrl ?? process.env['SUPABASE_URL'] ?? '',
    serviceRoleKey:
      config.supabaseServiceRoleKey ?? process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
  });
}

export function createCheckpointer(config: ProviderConfig = {}): ICheckpointerProvider {
  const checkpointer = config.checkpointer ?? process.env['CHECKPOINTER'] ?? 'memory';
  if (checkpointer === 'postgres') {
    const { PostgresCheckpointerProvider } = require('./implementations/checkpointer/postgres.provider.js');
    return new PostgresCheckpointerProvider({
      connectionString: config.databaseUrl ?? process.env['DATABASE_URL'] ?? '',
    });
  }
  const { MemoryCheckpointerProvider } = require('./implementations/checkpointer/memory.provider.js');
  return new MemoryCheckpointerProvider();
}
