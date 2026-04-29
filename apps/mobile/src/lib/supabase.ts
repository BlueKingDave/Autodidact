import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;

export const supabase = createClient(
  extra?.['supabaseUrl'] ?? '',
  extra?.['supabasePublishableKey'] ?? '',
  {
    auth: {
      autoRefreshToken: true,
      // Session persistence is handled by our auth store via expo-secure-store
      persistSession: false,
      detectSessionInUrl: false,
    },
  },
);
