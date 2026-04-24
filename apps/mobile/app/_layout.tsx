import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { useAuthStore } from '../src/stores/auth.store';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
const supabase = createClient(
  extra?.['supabaseUrl'] ?? '',
  extra?.['supabaseAnonKey'] ?? '',
);

export default function RootLayout() {
  const { token, setToken, clearSession } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setToken(session.access_token);
      } else {
        clearSession();
      }
    });
    return () => subscription.unsubscribe();
  }, [setToken, clearSession]);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    if (!token && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (token && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [token, segments, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <Slot />
    </QueryClientProvider>
  );
}
