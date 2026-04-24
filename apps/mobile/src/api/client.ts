import Constants from 'expo-constants';
import { useAuthStore } from '../stores/auth.store';

export const API_BASE_URL: string =
  (Constants.expoConfig?.extra as Record<string, string> | undefined)?.['apiBaseUrl'] ??
  'http://localhost:3000/v1';

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (res.status === 401) {
    useAuthStore.getState().clearSession();
  }

  return res;
}
