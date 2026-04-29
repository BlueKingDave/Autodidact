import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TamaguiProvider } from 'tamagui';
import { useAuthStore } from '@/stores/auth.store';
import { supabase } from '@/lib/supabase';
import config from '@/design/config';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function RootLayout() {
  const { accessToken, refreshToken, setSession, clearSession } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  // On app launch, restore the Supabase in-memory session from our persisted tokens
  // so that autoRefreshToken can kick in without requiring a full sign-in.
  useEffect(() => {
    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep our store in sync with Supabase's session events (token refresh, sign-out).
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token && session?.refresh_token) {
        setSession(session.access_token, session.refresh_token);
      } else {
        clearSession();
      }
    });
    return () => subscription.unsubscribe();
  }, [setSession, clearSession]);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    if (!accessToken && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (accessToken && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [accessToken, segments, router]);

  return (
    <TamaguiProvider config={config} defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <Slot />
      </QueryClientProvider>
    </TamaguiProvider>
  );
}
