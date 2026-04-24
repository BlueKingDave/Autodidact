import type { Embeddings } from '@langchain/core/embeddings';
import type { IEmbeddingProvider } from '../../interfaces/embedding.js';

/** Stub — wire up @langchain/cohere when needed */
export class CohereEmbeddingProvider implements IEmbeddingProvider {
  constructor(_apiKey: string) {}

  async embed(_text: string): Promise<number[]> {
    throw new Error('CohereEmbeddingProvider is not yet implemented');
  }

  async embedBatch(_texts: string[]): Promise<number[][]> {
    throw new Error('CohereEmbeddingProvider is not yet implemented');
  }

  getEmbeddings(): Embeddings {
    throw new Error('CohereEmbeddingProvider is not yet implemented');
  }
}
