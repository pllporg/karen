import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, JobsOptions } from 'bullmq';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly connection = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    maxRetriesPerRequest: null,
  };
  private readonly queues = new Map<string, Queue>();
  private readonly workers: Worker[] = [];

  getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      this.queues.set(name, new Queue(name, { connection: this.connection }));
    }
    return this.queues.get(name)!;
  }

  async addJob(queueName: string, name: string, data: unknown, opts?: JobsOptions) {
    const queue = this.getQueue(queueName);
    try {
      const job = await queue.add(name, data, opts);
      this.logger.log(
        JSON.stringify({
          event: 'queue.job.enqueued',
          queueName,
          jobName: name,
          jobId: job.id,
          correlationId: this.readCorrelationId(data),
        }),
      );
      return job;
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          event: 'queue.job.enqueue_failed',
          queueName,
          jobName: name,
          correlationId: this.readCorrelationId(data),
          errorName: error instanceof Error ? error.name : 'UnknownError',
          errorMessage: error instanceof Error ? error.message : String(error),
        }),
      );
      throw error;
    }
  }

  createWorker(queueName: string, processor: any) {
    const worker = new Worker(queueName, processor, { connection: this.connection });
    worker.on('failed', (job, error) => {
      this.logger.error(
        JSON.stringify({
          event: 'queue.job.failed',
          queueName,
          jobName: job?.name,
          jobId: job?.id,
          correlationId: this.readCorrelationId(job?.data),
          errorName: error?.name,
          errorMessage: error?.message,
        }),
      );
    });
    this.workers.push(worker);
    return worker;
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.close()));
    await Promise.all(Array.from(this.queues.values()).map((queue) => queue.close()));
  }

  private readCorrelationId(data: unknown) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return undefined;
    }
    const row = data as Record<string, unknown>;
    const candidate = row.correlationId || row.requestId;
    return typeof candidate === 'string' ? candidate : undefined;
  }
}
