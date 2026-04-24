import { Queue, QueueEvents } from 'bullmq';
import type { Redis } from 'ioredis';
import type { JobStatus } from '@autodidact/types';
import type { IQueueProvider, EnqueueOptions } from '../../interfaces/queue.js';

export class BullMQQueueProvider implements IQueueProvider {
  private readonly queues = new Map<string, Queue>();
  private readonly connection: Redis;

  constructor(connection: Redis) {
    this.connection = connection;
  }

  private getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      this.queues.set(name, new Queue(name, { connection: this.connection }));
    }
    return this.queues.get(name)!;
  }

  async enqueue<T>(
    queueName: string,
    jobName: string,
    data: T,
    options?: EnqueueOptions,
  ): Promise<string> {
    const queue = this.getQueue(queueName);
    const job = await queue.add(jobName, data, {
      attempts: options?.attempts ?? 3,
      backoff: { type: 'exponential', delay: options?.backoffDelay ?? 5000 },
      delay: options?.delay,
      priority: options?.priority,
    });
    return job.id!;
  }

  async getJobStatus(queueName: string, jobId: string): Promise<JobStatus> {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);
    if (!job) return 'unknown';
    const state = await job.getState();
    const map: Record<string, JobStatus> = {
      waiting: 'waiting',
      active: 'active',
      completed: 'completed',
      failed: 'failed',
      delayed: 'delayed',
    };
    return map[state] ?? 'unknown';
  }

  async close(): Promise<void> {
    await Promise.all([...this.queues.values()].map((q) => q.close()));
  }
}
