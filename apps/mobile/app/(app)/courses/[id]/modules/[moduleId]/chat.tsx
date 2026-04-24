import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../../../../../../src/api/client';
import { useSSE } from '../../../../../../src/hooks/useSSE';
import { useChatStore } from '../../../../../../src/stores/chat.store';
import { useAuthStore } from '../../../../../../src/stores/auth.store';
import { colors } from '../../../../../../src/constants/colors';
import type { ChatMessage } from '@autodidact/types';

export default function ModuleChatScreen() {
  const { id: courseId, moduleId } = useLocalSearchParams<{ id: string; moduleId: string }>();
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const { messages, streamingContent, isStreaming, setMessages, clearMessages } = useChatStore();
  const user = useAuthStore((s) => s.user);
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
      if (session.messages?.length) {
        setMessages(session.messages);
      }
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
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Starting session...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        data={allItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatBubble message={item} isStreaming={item.id === '__streaming__'} />}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          placeholder="Ask a question or respond..."
          placeholderTextColor={colors.textDim}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={4000}
          editable={!isStreaming}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (isStreaming || !input.trim()) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={isStreaming || !input.trim()}
        >
          {isStreaming ? (
            <ActivityIndicator color={colors.text} size="small" />
          ) : (
            <Text style={styles.sendIcon}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function ChatBubble({ message, isStreaming }: { message: ChatMessage; isStreaming: boolean }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
      <Text style={[styles.bubbleText, isUser ? styles.userText : styles.assistantText]}>
        {message.content}
        {isStreaming && <Text style={styles.cursor}>▋</Text>}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: colors.textMuted, fontSize: 15 },
  messages: { flex: 1 },
  messagesContent: { padding: 16, gap: 12 },
  bubble: { maxWidth: '85%', borderRadius: 16, padding: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.userBubble, borderBottomRightRadius: 4 },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: colors.assistantBubble, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: colors.text },
  assistantText: { color: colors.text },
  cursor: { color: colors.primary },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { color: colors.text, fontSize: 18, fontWeight: '700' },
});
