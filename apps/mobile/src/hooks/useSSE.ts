import { useCallback } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useQueryClient } from '@tanstack/react-query';
import { useChatStore } from '../stores/chat.store';
import { API_BASE_URL } from '../api/client';
import { useAuthStore } from '../stores/auth.store';

export function useSSE(sessionId: string, courseId: string) {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const { addUserMessage, appendStreamToken, finalizeStreamMessage } = useChatStore();

  const send = useCallback(
    async (content: string) => {
      addUserMessage(content);

      await fetchEventSource(`${API_BASE_URL}/chat/sessions/${sessionId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content, sessionId }),
        onmessage(event) {
          try {
            const data = JSON.parse(event.data) as {
              type: string;
              content?: string;
              score?: number;
              error?: string;
            };

            if (data.type === 'token' && data.content) {
              appendStreamToken(data.content);
            } else if (data.type === 'complete') {
              finalizeStreamMessage();
              // Invalidate progress so the module list refreshes
              void queryClient.invalidateQueries({ queryKey: ['progress', courseId] });
            } else if (data.type === 'error') {
              finalizeStreamMessage();
            }
          } catch {
            // Ignore malformed events
          }
        },
        onerror() {
          finalizeStreamMessage();
          throw new Error('SSE connection error');
        },
      });
    },
    [sessionId, courseId, token, addUserMessage, appendStreamToken, finalizeStreamMessage, queryClient],
  );

  return { send };
}
