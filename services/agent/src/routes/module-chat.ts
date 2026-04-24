import type { FastifyInstance } from 'fastify';
import { HumanMessage } from '@langchain/core/messages';
import type { ModuleBlueprint } from '@autodidact/types';
import type { buildModuleChatGraph } from '../graphs/module-chat/graph.js';

type ChatGraph = ReturnType<typeof buildModuleChatGraph>;

interface StreamBody {
  sessionId: string;
  userId: string;
  message: string;
  moduleBlueprint: ModuleBlueprint;
}

export async function registerModuleChatRoute(app: FastifyInstance, graph: ChatGraph) {
  app.post<{ Body: StreamBody }>('/module-chat/stream', async (request, reply) => {
    const { sessionId, userId, message, moduleBlueprint } = request.body;

    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('X-Accel-Buffering', 'no');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.flushHeaders();

    const sendEvent = (data: object) => {
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const stream = await graph.stream(
        {
          messages: [new HumanMessage(message)],
          moduleBlueprint,
          userId,
          teachingPhase: 'introduction' as const,
          completionSignaled: false,
          completionScore: null,
        },
        {
          configurable: { thread_id: sessionId },
          streamMode: 'messages',
        },
      );

      for await (const [chunk] of stream) {
        if (chunk && typeof chunk === 'object' && 'content' in chunk) {
          const content = chunk.content;
          if (typeof content === 'string' && content) {
            sendEvent({ type: 'token', content });
          }
        }
      }

      // Signal stream completion — client checks for completionScore
      const state = await graph.getState({ configurable: { thread_id: sessionId } });
      if (state.values.completionSignaled) {
        sendEvent({ type: 'complete', score: state.values.completionScore });
      } else {
        sendEvent({ type: 'complete' });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      sendEvent({ type: 'error', error: message });
    } finally {
      reply.raw.end();
    }
  });
}
