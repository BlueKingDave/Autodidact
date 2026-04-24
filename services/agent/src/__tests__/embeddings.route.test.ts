import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import { registerEmbeddingsRoute } from '../routes/embeddings.js';

function makeMockEmbeddingProvider(vector = [0.1, 0.2, 0.3]) {
  return {
    embed: vi.fn().mockResolvedValue(vector),
    embedBatch: vi.fn(),
  };
}

describe('POST /embeddings/text', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('validation errors', () => {
    it('returns 400 when body is missing', async () => {
      const provider = makeMockEmbeddingProvider();
      await registerEmbeddingsRoute(app, provider as never);
      const res = await app.inject({ method: 'POST', url: '/embeddings/text', body: {} });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when text is empty string', async () => {
      const provider = makeMockEmbeddingProvider();
      await registerEmbeddingsRoute(app, provider as never);
      const res = await app.inject({
        method: 'POST',
        url: '/embeddings/text',
        payload: { text: '' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when text exceeds 5000 characters', async () => {
      const provider = makeMockEmbeddingProvider();
      await registerEmbeddingsRoute(app, provider as never);
      const res = await app.inject({
        method: 'POST',
        url: '/embeddings/text',
        payload: { text: 'x'.repeat(5001) },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when text field is not a string', async () => {
      const provider = makeMockEmbeddingProvider();
      await registerEmbeddingsRoute(app, provider as never);
      const res = await app.inject({
        method: 'POST',
        url: '/embeddings/text',
        payload: { text: 42 },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('successful embedding', () => {
    it('returns 200 with { embedding } on valid input', async () => {
      const vector = [0.1, 0.2, 0.3];
      const provider = makeMockEmbeddingProvider(vector);
      await registerEmbeddingsRoute(app, provider as never);
      const res = await app.inject({
        method: 'POST',
        url: '/embeddings/text',
        payload: { text: 'Hello World' },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<{ embedding: number[] }>();
      expect(body.embedding).toEqual(vector);
    });

    it('calls embed() with the provided text', async () => {
      const provider = makeMockEmbeddingProvider();
      await registerEmbeddingsRoute(app, provider as never);
      await app.inject({
        method: 'POST',
        url: '/embeddings/text',
        payload: { text: 'Python programming' },
      });
      expect(provider.embed).toHaveBeenCalledWith('Python programming');
    });

    it('accepts text exactly at the 5000 char limit', async () => {
      const provider = makeMockEmbeddingProvider();
      await registerEmbeddingsRoute(app, provider as never);
      const res = await app.inject({
        method: 'POST',
        url: '/embeddings/text',
        payload: { text: 'x'.repeat(5000) },
      });
      expect(res.statusCode).toBe(200);
    });
  });
});
