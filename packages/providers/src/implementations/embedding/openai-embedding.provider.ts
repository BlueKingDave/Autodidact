import { OpenAIEmbeddings } from '@langchain/openai';
import type { IEmbeddingProvider } from '../../interfaces/embedding.js';

export class OpenAIEmbeddingProvider implements IEmbeddingProvider {
  readonly dimensions = 1536;
  private readonly embeddings: OpenAIEmbeddings;

  constructor(apiKey: string, modelName = 'text-embedding-3-small') {
    this.embeddings = new OpenAIEmbeddings({ apiKey, model: modelName });
  }

  async embed(text: string): Promise<number[]> {
    return this.embeddings.embedQuery(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return this.embeddings.embedDocuments(texts);
  }
}
