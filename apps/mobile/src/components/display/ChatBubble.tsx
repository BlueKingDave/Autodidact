import { XStack } from 'tamagui';
import { AppText } from '../typography/AppText';
import type { ChatMessage } from '@autodidact/types';

type ChatBubbleProps = {
  message: ChatMessage;
  isStreaming?: boolean;
};

export function ChatBubble({ message, isStreaming = false }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <XStack
      maxWidth="85%"
      alignSelf={isUser ? 'flex-end' : 'flex-start'}
      backgroundColor={isUser ? '$userBubble' : '$assistantBubble'}
      borderRadius="$lg"
      borderBottomRightRadius={isUser ? '$sm' : '$lg'}
      borderBottomLeftRadius={isUser ? '$lg' : '$sm'}
      borderWidth={isUser ? 0 : 1}
      borderColor="$border"
      padding="$3"
    >
      <AppText variant="body">
        {message.content}
        {isStreaming ? <AppText variant="body" color="$primary">▋</AppText> : null}
      </AppText>
    </XStack>
  );
}
