import type { Embeddings } from '@langchain/core/embeddings';
export interface IEmbeddingProvider {
    embed(text: string): Promise<number[]>;
    embedBatch(texts: string[]): Promise<number[][]>;
    getEmbeddings(): Embeddings;
}
//# sourceMappingURL=embedding.d.ts.map