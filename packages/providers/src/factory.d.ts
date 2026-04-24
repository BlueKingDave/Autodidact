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
export declare function createLLMProvider(config?: ProviderConfig): ILLMProvider;
export declare function createEmbeddingProvider(config?: ProviderConfig): IEmbeddingProvider;
export declare function createQueueProvider(config?: ProviderConfig): IQueueProvider;
export declare function createAuthProvider(config?: ProviderConfig): IAuthProvider;
export declare function createCheckpointer(config?: ProviderConfig): ICheckpointerProvider;
//# sourceMappingURL=factory.d.ts.map