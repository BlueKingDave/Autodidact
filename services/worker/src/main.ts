import IORedis from 'ioredis';
import { createLogger, initTracer } from '@autodidact/observability';
import { createQueueProvider } from '@autodidact/providers';
import { AgentClient } from './services/agent.client.js';
import { createCourseGenerationWorker } from './processors/course-generation.processor.js';
import { createEmbeddingWorker } from './processors/embedding.processor.js';

const logger = createLogger('worker');

async function start() {
  initTracer('autodidact-worker');

  const redisUrl = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
  const agentUrl = process.env['AGENT_SERVICE_URL'] ?? 'http://localhost:3001';

  const redis = new IORedis(redisUrl, { maxRetriesPerRequest: null });
  const agentClient = new AgentClient(agentUrl);
  const queueProvider = await createQueueProvider();

  const courseWorker = createCourseGenerationWorker(redis, agentClient, queueProvider, logger);
  const embeddingWorker = createEmbeddingWorker(redis, agentClient, logger);

  courseWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Course generation job failed');
  });

  embeddingWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Embedding job failed');
  });

  const shutdown = async () => {
    logger.info('Shutting down workers...');
    await Promise.all([courseWorker.close(), embeddingWorker.close(), queueProvider.close()]);
    redis.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  logger.info('Worker service started');
}

start().catch((err) => {
  logger.error(err, 'Worker failed to start');
  process.exit(1);
});
