import { OpenAIEmbeddings } from '@langchain/openai';
import type { Embeddings } from '@langchain/core/embeddings';
import type { IEmbeddingProvider } from '../../interfaces/embedding.js';

export class OpenAIEmbeddingProvider implements IEmbeddingProvider {
  private readonly embeddings: OpenAIEmbeddings;

  constructor(config: { apiKey: string; model?: string }) {
    this.embeddings = new OpenAIEmbeddings({
      apiKey: config.apiKey,
      model: config.model ?? 'text-embedding-3-small',
      dimensions: 1536,
    });
  }

  async embed(text: string): Promise<number[]> {
    return this.embeddings.embedQuery(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return this.embeddings.embedDocuments(texts);
  }

  getEmbeddings(): Embeddings {
    return this.embeddings;
  }
}
