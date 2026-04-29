import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth.store';

export const API_BASE_URL: string =
  (Constants.expoConfig?.extra as Record<string, string> | undefined)?.['apiBaseUrl'] ??
  'http://localhost:3000/v1';

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (res.status === 401) {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data.session?.access_token && data.session?.refresh_token) {
      useAuthStore.getState().setSession(
        data.session.access_token,
        data.session.refresh_token,
      );
      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${data.session.access_token}`,
      };
      return fetch(`${API_BASE_URL}${path}`, { ...init, headers: retryHeaders });
    }
    useAuthStore.getState().clearSession();
  }

  return res;
}
