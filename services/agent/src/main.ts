import Fastify from 'fastify';
import {
  createLLMProvider,
  createEmbeddingProvider,
  createCheckpointerProvider,
} from '@autodidact/providers';
import { createLogger, initTracer } from '@autodidact/observability';
import { buildCourseGenerationGraph } from './graphs/course-generation/graph.js';
import { buildModuleChatGraph } from './graphs/module-chat/graph.js';
import { registerGenerateCourseRoute } from './routes/generate-course.js';
import { registerModuleChatRoute } from './routes/module-chat.js';
import { registerEmbeddingsRoute } from './routes/embeddings.js';

const logger = createLogger('agent');
const PORT = parseInt(process.env['AGENT_PORT'] ?? '3001', 10);

async function start() {
  initTracer('autodidact-agent');

  const [llm, embeddings, checkpointer] = await Promise.all([
    createLLMProvider(),
    createEmbeddingProvider(),
    createCheckpointerProvider(),
  ]);

  const courseGraph = buildCourseGenerationGraph(llm);
  const chatGraph = buildModuleChatGraph(llm, checkpointer);

  const app = Fastify({ logger: false });

  app.get('/health', async () => ({ status: 'ok', service: 'agent' }));

  await registerGenerateCourseRoute(app, courseGraph);
  await registerModuleChatRoute(app, chatGraph);
  await registerEmbeddingsRoute(app, embeddings);

  await app.listen({ port: PORT, host: '0.0.0.0' });
  logger.info({ port: PORT }, 'Agent service started');
}

start().catch((err) => {
  logger.error(err, 'Agent service failed to start');
  process.exit(1);
});
