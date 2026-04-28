import { YStack } from 'tamagui';
import { AppText } from '../typography/AppText';

type EmptyStateProps = {
  message: string;
};

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" paddingTop="$10">
      <AppText variant="muted" textAlign="center">
        {message}
      </AppText>
    </YStack>
  );
}
