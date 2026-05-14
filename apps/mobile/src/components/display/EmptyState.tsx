import { useTheme, YStack } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../typography/AppText';
import { Button } from '../interactive/Button';

type EmptyStateProps = {
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  action?: { label: string; onPress: () => void };
};

export function EmptyState({ message, icon, action }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" paddingTop="$10" gap="$4">
      {icon && <Ionicons name={icon} size={48} color={theme.textMuted.get()} />}
      <AppText variant="muted" textAlign="center">
        {message}
      </AppText>
      {action && (
        <Button variant="ghost" size="sm" onPress={action.onPress}>
          {action.label}
        </Button>
      )}
    </YStack>
  );
}
