import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './client';
import type { ModuleProgressItem } from '@autodidact/types';

export function useProgress(courseId: string) {
  return useQuery({
    queryKey: ['progress', courseId],
    queryFn: async () => {
      const res = await apiFetch(`/progress/${courseId}`);
      if (!res.ok) throw new Error('Failed to fetch progress');
      return res.json() as Promise<ModuleProgressItem[]>;
    },
    enabled: !!courseId,
  });
}
