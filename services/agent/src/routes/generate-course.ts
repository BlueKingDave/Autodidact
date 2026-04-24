import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { ILLMProvider } from '@autodidact/providers';
import { buildCourseGenerationGraph } from '../graphs/course-generation/graph.js';
import type { DifficultyLevel } from '@autodidact/types';

const GenerateCourseBodySchema = z.object({
  courseId: z.string().uuid(),
  topic: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  moduleCount: z.number().int().min(1).max(20),
});

export async function registerGenerateCourseRoute(
  app: FastifyInstance,
  llmProvider: ILLMProvider,
) {
  const graph = buildCourseGenerationGraph(llmProvider);

  app.post('/course/generate', async (request, reply) => {
    const body = GenerateCourseBodySchema.parse(request.body);

    const result = await graph.invoke({
      topic: body.topic,
      difficulty: body.difficulty as DifficultyLevel,
      moduleCount: body.moduleCount,
      blueprint: null,
      retryCount: 0,
      error: null,
    });

    if (!result.blueprint) {
      return reply.status(500).send({ error: 'Failed to generate course blueprint', detail: result.error });
    }

    return reply.send({ blueprint: result.blueprint });
  });
}
