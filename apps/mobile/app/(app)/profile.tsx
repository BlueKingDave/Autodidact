import { YStack } from 'tamagui';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { Screen, Card, AppText, Button } from '@/components';

export default function ProfileScreen() {
  const { user, clearSession } = useAuthStore();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    clearSession();
  };

  return (
    <Screen>
      <YStack gap="$6" paddingTop="$4">
        <Card variant="elevated">
          <AppText variant="label">Email</AppText>
          <YStack marginTop="$1">
            <AppText variant="body" size="lg">{user?.email ?? '—'}</AppText>
          </YStack>
        </Card>

        <Button variant="danger" size="lg" onPress={handleSignOut}>
          Sign Out
        </Button>
      </YStack>
    </Screen>
  );
}
