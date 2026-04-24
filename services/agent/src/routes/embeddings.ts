import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { IEmbeddingProvider } from '@autodidact/providers';

const EmbedBodySchema = z.object({
  text: z.string().min(1).max(5000),
});

export async function registerEmbeddingsRoute(
  app: FastifyInstance,
  embeddingProvider: IEmbeddingProvider,
) {
  app.post('/embeddings/text', async (request, reply) => {
    const body = EmbedBodySchema.parse(request.body);
    const embedding = await embeddingProvider.embed(body.text);
    return reply.send({ embedding });
  });
}
