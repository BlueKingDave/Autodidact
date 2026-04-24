import type { FastifyInstance } from 'fastify';
import { z, ZodError } from 'zod';
import type { IEmbeddingProvider } from '@autodidact/providers';

const EmbedBodySchema = z.object({
  text: z.string().min(1).max(5000),
});

export async function registerEmbeddingsRoute(
  app: FastifyInstance,
  embeddingProvider: IEmbeddingProvider,
) {
  app.post('/embeddings/text', async (request, reply) => {
    let body: z.infer<typeof EmbedBodySchema>;
    try {
      body = EmbedBodySchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ error: 'Validation error', issues: err.issues });
      }
      throw err;
    }
    const embedding = await embeddingProvider.embed(body.text);
    return reply.send({ embedding });
  });
}
