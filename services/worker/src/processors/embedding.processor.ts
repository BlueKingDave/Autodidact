import { Worker } from 'bullmq';
import type { Redis } from 'ioredis';
import { eq, sql } from 'drizzle-orm';
import { getDb, courses } from '@autodidact/db';
import type { EmbeddingJobData } from '@autodidact/types';
import type { Logger } from '@autodidact/observability';
import { QUEUES } from '../queues/definitions.js';
import type { AgentClient } from '../services/agent.client.js';

export function createEmbeddingWorker(
  connection: Redis,
  agentClient: AgentClient,
  logger: Logger,
): Worker {
  return new Worker<EmbeddingJobData>(
    QUEUES.EMBEDDING,
    async (job) => {
      const { courseId, topic } = job.data;
      const db = getDb();
      logger.info({ courseId }, 'Generating topic embedding');

      const vector = await agentClient.generateEmbedding(topic);

      // Use sql tag to write the pgvector literal
      await db
        .update(courses)
        .set({
          topicEmbedding: sql`${`[${vector.join(',')}]`}::vector`,
          updatedAt: new Date(),
        } as Parameters<typeof db.update>[0] extends infer T ? T : never)
        .where(eq(courses.id, courseId));

      logger.info({ courseId }, 'Embedding stored');
    },
    {
      connection,
      concurrency: 5,
      defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 3000 } },
    },
  );
}
