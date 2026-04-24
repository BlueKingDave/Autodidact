import type { JobStatus } from '@autodidact/types';

export interface EnqueueOptions {
  attempts?: number;
  backoffDelay?: number;
  delay?: number;
  priority?: number;
}

export interface IQueueProvider {
  enqueue<T>(
    queueName: string,
    jobName: string,
    data: T,
    options?: EnqueueOptions,
  ): Promise<string>;
  getJobStatus(queueName: string, jobId: string): Promise<JobStatus>;
  close(): Promise<void>;
}
