import { Worker } from 'bullmq';
import type { Redis } from 'ioredis';
import { sql, getDb, courses } from '@autodidact/db';
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
      const vectorLiteral = `[${vector.join(',')}]`;

      // Raw SQL update for pgvector — Drizzle's custom type doesn't handle
      // the ::vector cast cleanly in .set(), so we use execute() directly.
      await db.execute(
        sql`UPDATE courses SET topic_embedding = ${vectorLiteral}::vector, updated_at = NOW() WHERE id = ${courseId}::uuid`,
      );

      logger.info({ courseId }, 'Embedding stored');
    },
    { connection, concurrency: 5 },
  );
}
