import type { JobStatus } from '@autodidact/types';

export interface EnqueueOptions {
  attempts?: number;
  backoff?: { type: 'exponential' | 'fixed'; delay: number };
  delay?: number;
  jobId?: string;
}

export interface IQueueProvider {
  enqueue<T>(queue: string, name: string, data: T, opts?: EnqueueOptions): Promise<string>;
  getJobStatus(queue: string, jobId: string): Promise<JobStatus>;
  close(): Promise<void>;
}
