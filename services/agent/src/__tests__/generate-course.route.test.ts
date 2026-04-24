import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';

// ────────────────────────────────────────────────────────────────────────────
// Mock the graph module so route tests don't spin up real LangGraph chains
// ────────────────────────────────────────────────────────────────────────────

const mockGraphInvoke = vi.fn();

vi.mock('../graphs/course-generation/graph.js', () => ({
  buildCourseGenerationGraph: vi.fn().mockReturnValue({ invoke: mockGraphInvoke }),
}));

const { registerGenerateCourseRoute } = await import('../routes/generate-course.js');

// ────────────────────────────────────────────────────────────────────────────

const validBlueprint = {
  title: 'Python Basics',
  description: 'Learn Python.',
  difficulty: 'beginner',
  estimatedHours: 10,
  modules: [
    {
      position: 0,
      title: 'Intro',
      description: 'Getting started',
      objectives: ['Understand Python'],
      contentOutline: [{ title: 'Setup', points: ['Install Python'] }],
      estimatedMinutes: 60,
    },
  ],
};

const validBody = {
  courseId: '00000000-0000-0000-0000-000000000001',
  topic: 'Python',
  difficulty: 'beginner',
  moduleCount: 5,
};

describe('POST /course/generate', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('validation errors', () => {
    it('returns 400 when courseId is missing', async () => {
      await registerGenerateCourseRoute(app, {} as never);
      const res = await app.inject({
        method: 'POST',
        url: '/course/generate',
        payload: { topic: 'Python', difficulty: 'beginner', moduleCount: 5 },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when courseId is not a UUID', async () => {
      await registerGenerateCourseRoute(app, {} as never);
      const res = await app.inject({
        method: 'POST',
        url: '/course/generate',
        payload: { ...validBody, courseId: 'not-a-uuid' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when difficulty is not a valid enum value', async () => {
      await registerGenerateCourseRoute(app, {} as never);
      const res = await app.inject({
        method: 'POST',
        url: '/course/generate',
        payload: { ...validBody, difficulty: 'expert' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when moduleCount is 0', async () => {
      await registerGenerateCourseRoute(app, {} as never);
      const res = await app.inject({
        method: 'POST',
        url: '/course/generate',
        payload: { ...validBody, moduleCount: 0 },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when moduleCount exceeds 20', async () => {
      await registerGenerateCourseRoute(app, {} as never);
      const res = await app.inject({
        method: 'POST',
        url: '/course/generate',
        payload: { ...validBody, moduleCount: 21 },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('graph returns null blueprint', () => {
    it('returns 500 with error message when blueprint is null', async () => {
      mockGraphInvoke.mockResolvedValue({ blueprint: null, error: 'Zod validation failed', retryCount: 3 });
      await registerGenerateCourseRoute(app, {} as never);
      const res = await app.inject({
        method: 'POST',
        url: '/course/generate',
        payload: validBody,
      });
      expect(res.statusCode).toBe(500);
      const body = res.json<{ error: string; detail: string }>();
      expect(body.error).toContain('blueprint');
    });
  });

  describe('successful generation', () => {
    it('returns 200 with { blueprint } on success', async () => {
      mockGraphInvoke.mockResolvedValue({ blueprint: validBlueprint, error: null, retryCount: 0 });
      await registerGenerateCourseRoute(app, {} as never);
      const res = await app.inject({
        method: 'POST',
        url: '/course/generate',
        payload: validBody,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json<{ blueprint: typeof validBlueprint }>();
      expect(body.blueprint).toEqual(validBlueprint);
    });

    it('invokes the graph with the correct state fields', async () => {
      mockGraphInvoke.mockResolvedValue({ blueprint: validBlueprint, error: null, retryCount: 0 });
      await registerGenerateCourseRoute(app, {} as never);
      await app.inject({
        method: 'POST',
        url: '/course/generate',
        payload: validBody,
      });
      expect(mockGraphInvoke).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'Python',
          difficulty: 'beginner',
          moduleCount: 5,
          blueprint: null,
          retryCount: 0,
          error: null,
        }),
      );
    });
  });
});
