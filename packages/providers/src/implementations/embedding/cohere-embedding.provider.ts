import type { IEmbeddingProvider } from '../../interfaces/embedding.js';

/** Stub — wire up @langchain/cohere when needed */
export class CohereEmbeddingProvider implements IEmbeddingProvider {
  readonly dimensions = 1024;

  constructor(_apiKey: string) {}

  async embed(_text: string): Promise<number[]> {
    throw new Error('CohereEmbeddingProvider is not yet implemented');
  }

  async embedBatch(_texts: string[]): Promise<number[][]> {
    throw new Error('CohereEmbeddingProvider is not yet implemented');
  }
}
