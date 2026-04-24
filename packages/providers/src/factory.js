"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLLMProvider = createLLMProvider;
exports.createEmbeddingProvider = createEmbeddingProvider;
exports.createQueueProvider = createQueueProvider;
exports.createAuthProvider = createAuthProvider;
exports.createCheckpointer = createCheckpointer;
function createLLMProvider(config = {}) {
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
function createEmbeddingProvider(config = {}) {
    const { OpenAIEmbeddingProvider } = require('./implementations/embedding/openai-embedding.provider.js');
    return new OpenAIEmbeddingProvider({
        apiKey: config.openaiApiKey ?? process.env['OPENAI_API_KEY'] ?? '',
    });
}
function createQueueProvider(config = {}) {
    const { BullMQQueueProvider } = require('./implementations/queue/bullmq.provider.js');
    return new BullMQQueueProvider({
        redisUrl: config.redisUrl ?? process.env['REDIS_URL'] ?? 'redis://localhost:6379',
    });
}
function createAuthProvider(config = {}) {
    const { SupabaseAuthProvider } = require('./implementations/auth/supabase-auth.provider.js');
    return new SupabaseAuthProvider({
        supabaseUrl: config.supabaseUrl ?? process.env['SUPABASE_URL'] ?? '',
        serviceRoleKey: config.supabaseServiceRoleKey ?? process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
    });
}
function createCheckpointer(config = {}) {
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
//# sourceMappingURL=factory.js.map