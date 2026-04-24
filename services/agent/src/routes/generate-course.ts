import type { FastifyInstance } from 'fastify';
import type { CourseGenerationJobData } from '@autodidact/types';
import type { buildCourseGenerationGraph } from '../graphs/course-generation/graph.js';

type CourseGraph = ReturnType<typeof buildCourseGenerationGraph>;

export async function registerGenerateCourseRoute(
  app: FastifyInstance,
  graph: CourseGraph,
) {
  app.post<{ Body: CourseGenerationJobData }>('/course/generate', async (request, reply) => {
    const { topic, difficulty, moduleCount } = request.body;

    const result = await graph.invoke({
      topic,
      difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
      moduleCount,
      rawResponse: null,
      blueprint: null,
      validationErrors: [],
      retryCount: 0,
      error: null,
    });

    if (!result.blueprint) {
      return reply.status(422).send({
        error: result.error ?? 'Failed to generate course blueprint',
        validationErrors: result.validationErrors,
      });
    }

    return reply.send({ blueprint: result.blueprint });
  });
}
