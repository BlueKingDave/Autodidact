import { useEffect, useRef, useState, useCallback } from 'react';
import { FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { XStack, YStack, Spinner } from 'tamagui';
import { apiFetch } from '@/api/client';
import { useSSE } from '@/hooks/useSSE';
import { useChatStore } from '@/stores/chat.store';
import { Screen, AppText, Input, IconButton, ChatBubble } from '@/components';
import type { ChatMessage } from '@autodidact/types';

function UpArrow() {
  return <AppText variant="body" weight="bold" color="$text">↑</AppText>;
}

export default function ModuleChatScreen() {
  const { id: courseId, moduleId } = useLocalSearchParams<{ id: string; moduleId: string }>();
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const { messages, streamingContent, isStreaming, setMessages, clearMessages } = useChatStore();
  const { send } = useSSE(sessionId ?? '', courseId);

  const { mutateAsync: createSession, isPending: creatingSession } = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/chat/sessions', {
        method: 'POST',
        body: JSON.stringify({ moduleId, courseId }),
      });
      if (!res.ok) throw new Error('Failed to create session');
      return res.json() as Promise<{ id: string; messages: ChatMessage[] }>;
    },
  });

  useEffect(() => {
    clearMessages();
    void (async () => {
      const session = await createSession();
      setSessionId(session.id);
      if (session.messages?.length) setMessages(session.messages);
    })();
    return () => clearMessages();
  }, [moduleId]);

  useEffect(() => {
    if (messages.length || streamingContent) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length, streamingContent]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming || !sessionId) return;
    const text = input.trim();
    setInput('');
    await send(text);
  }, [input, isStreaming, sessionId, send]);

  const allItems = [
    ...messages,
    ...(streamingContent
      ? [{ id: '__streaming__', role: 'assistant' as const, content: streamingContent, createdAt: '' }]
      : []),
  ];

  if (creatingSession) {
    return (
      <Screen>
        <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
          <Spinner color="$primary" />
          <AppText variant="muted">Starting session...</AppText>
        </YStack>
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <YStack flex={1} backgroundColor="$bg">
        <FlatList
          ref={flatListRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          data={allItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatBubble message={item} isStreaming={item.id === '__streaming__'} />
          )}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        <XStack
          padding="$3"
          gap="$2"
          borderTopWidth={1}
          borderTopColor="$border"
          backgroundColor="$surface"
          alignItems="flex-end"
        >
          <Input
            flex={1}
            placeholder="Ask a question or respond..."
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={4000}
            editable={!isStreaming}
          />
          <IconButton
            icon={<UpArrow />}
            variant="primary"
            loading={isStreaming}
            disabled={!input.trim()}
            onPress={handleSend}
          />
        </XStack>
      </YStack>
    </KeyboardAvoidingView>
  );
}
