import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useJobStatus } from '../api/courses';

export function useCourseGeneration(courseId: string | null, jobId: string | null) {
  const router = useRouter();
  const { data } = useJobStatus(jobId);

  useEffect(() => {
    if (data?.status === 'completed' && courseId) {
      router.replace(`/(app)/courses/${courseId}`);
    }
  }, [data?.status, courseId, router]);

  return {
    isGenerating: data?.status === 'waiting' || data?.status === 'active',
    failed: data?.status === 'failed',
    status: data?.status ?? null,
  };
}
