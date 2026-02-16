import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, JobsOptions } from 'bullmq';

@Injectable()
export class QueueService implements OnModuleDestroy {
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
    return queue.add(name, data, opts);
  }

  createWorker(queueName: string, processor: any) {
    const worker = new Worker(queueName, processor, { connection: this.connection });
    this.workers.push(worker);
    return worker;
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.close()));
    await Promise.all(Array.from(this.queues.values()).map((queue) => queue.close()));
  }
}
