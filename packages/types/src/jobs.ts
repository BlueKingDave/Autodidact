export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'unknown';

export interface CourseGenerationJobData {
  courseId: string;
  userId: string;
  topic: string;
  difficulty: string;
  moduleCount: number;
}

export interface EmbeddingJobData {
  courseId: string;
  topic: string;
}

export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  courseId?: string;
  error?: string;
}
