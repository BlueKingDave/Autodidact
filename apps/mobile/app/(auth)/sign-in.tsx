import { useState } from 'react';
import { Alert } from 'react-native';
import { YStack } from 'tamagui';
import { useAuthStore } from '@/stores/auth.store';
import { supabase } from '@/lib/supabase';
import { Screen, Heading, AppText, Input, Button } from '@/components';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setToken = useAuthStore((s) => s.setToken);

  const handleSignIn = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Sign in failed', error.message);
      return;
    }
    if (data.session?.access_token) setToken(data.session.access_token);
  };

  return (
    <Screen>
      <YStack flex={1} justifyContent="center" gap="$4">
        <YStack gap="$2" marginBottom="$6">
          <Heading size="h1">Autodidact</Heading>
          <AppText variant="muted" size="lg">Learn anything, one module at a time.</AppText>
        </YStack>

        <YStack gap="$3">
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            label="Password"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </YStack>

        <Button
          variant="primary"
          size="lg"
          loading={loading}
          onPress={handleSignIn}
        >
          Sign In
        </Button>
      </YStack>
    </Screen>
  );
}
