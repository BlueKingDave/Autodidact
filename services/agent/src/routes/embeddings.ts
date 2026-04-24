import type { FastifyInstance } from 'fastify';
import type { IEmbeddingProvider } from '@autodidact/providers';

export async function registerEmbeddingsRoute(
  app: FastifyInstance,
  embeddings: IEmbeddingProvider,
) {
  app.post<{ Body: { text: string } }>('/embeddings/text', async (request, reply) => {
    const { text } = request.body;
    const vector = await embeddings.embed(text);
    return reply.send({ vector, dimensions: embeddings.dimensions });
  });
}
