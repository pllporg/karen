import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { MatterAuditSignalService } from '../audit/matter-audit-signal.service';
import { AuditService } from '../audit/audit.service';
import { MessageDispatchService } from './providers/message-dispatch.service';
import { MembershipStatus } from '@prisma/client';

const AUDIT_SCAN_QUEUE = 'audit-scan';
const AUDIT_SCAN_JOB_NAME = 'scheduled-missed-value-scan';
const AUDIT_SCAN_REPEAT_JOB_ID = 'audit-scan-repeat';

type ScanDispatchSummary = {
  sent: number;
  skipped: number;
  failures: number;
};

@Injectable()
export class AuditScanSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(AuditScanSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly matterAuditSignals: MatterAuditSignalService,
    private readonly audit: AuditService,
    private readonly messageDispatch: MessageDispatchService,
  ) {}

  onModuleInit() {
    if (!this.isSchedulerEnabled()) {
      this.logger.log(JSON.stringify({ event: 'audit.scan.scheduler.disabled' }));
      return;
    }

    this.queue.createWorker(AUDIT_SCAN_QUEUE, async (job: Job) => {
      await this.runScheduledScan(this.resolveRunId(job));
    });

    const cron = process.env.AUDIT_SCAN_CRON || '*/15 * * * *';
    void this.queue.addJob(
      AUDIT_SCAN_QUEUE,
      AUDIT_SCAN_JOB_NAME,
      { trigger: 'scheduled', configuredCron: cron },
      {
        jobId: AUDIT_SCAN_REPEAT_JOB_ID,
        repeat: { pattern: cron },
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    );
  }

  async runScheduledScan(runId?: string) {
    const startedAt = new Date();
    const correlationId = runId || `audit-scan-${startedAt.toISOString()}`;
    const scanLimit = this.readIntEnv('AUDIT_SCAN_SIGNAL_LIMIT', 100, 1, 1000);

    this.logger.log(JSON.stringify({ event: 'audit.scan.run.started', correlationId, scanLimit }));

    const organizations = await this.prisma.organization.findMany({
      select: { id: true },
    });

    let organizationsProcessed = 0;
    let organizationsFailed = 0;
    let createdSignals = 0;
    let notificationsSent = 0;
    let notificationsSkipped = 0;
    let notificationFailures = 0;

    for (const organization of organizations) {
      try {
        const generated = await this.matterAuditSignals.generateMissedValueSignals({
          organizationId: organization.id,
          limit: scanLimit,
        });

        createdSignals += generated.createdCount;
        organizationsProcessed += 1;

        const dispatch = await this.dispatchNotifications({
          organizationId: organization.id,
          signalIds: generated.signalIds,
          correlationId,
        });

        notificationsSent += dispatch.sent;
        notificationsSkipped += dispatch.skipped;
        notificationFailures += dispatch.failures;

        await this.audit.appendEvent({
          organizationId: organization.id,
          action: 'audit.scan.organization.completed',
          entityType: 'AuditScanRun',
          entityId: correlationId,
          metadata: {
            createdSignals: generated.createdCount,
            notificationDispatch: dispatch,
          },
        });
      } catch (error) {
        organizationsFailed += 1;
        this.logger.error(
          JSON.stringify({
            event: 'audit.scan.organization.failed',
            correlationId,
            organizationId: organization.id,
            errorName: error instanceof Error ? error.name : 'UnknownError',
            errorMessage: error instanceof Error ? error.message : String(error),
          }),
        );

        await this.audit.appendEvent({
          organizationId: organization.id,
          action: 'audit.scan.organization.failed',
          entityType: 'AuditScanRun',
          entityId: correlationId,
          metadata: {
            errorName: error instanceof Error ? error.name : 'UnknownError',
            errorMessage: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }

    this.logger.log(
      JSON.stringify({
        event: 'audit.scan.run.completed',
        correlationId,
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        organizationsProcessed,
        organizationsFailed,
        createdSignals,
        notificationsSent,
        notificationsSkipped,
        notificationFailures,
      }),
    );

    return {
      correlationId,
      organizationsProcessed,
      organizationsFailed,
      createdSignals,
      notificationsSent,
      notificationsSkipped,
      notificationFailures,
    };
  }

  private async dispatchNotifications(input: {
    organizationId: string;
    signalIds: string[];
    correlationId: string;
  }): Promise<ScanDispatchSummary> {
    if (input.signalIds.length === 0) {
      return { sent: 0, skipped: 0, failures: 0 };
    }

    const signals = await this.prisma.matterAuditSignal.findMany({
      where: {
        organizationId: input.organizationId,
        id: { in: input.signalIds },
      },
      include: {
        matter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ generatedAt: 'asc' }, { id: 'asc' }],
    });

    if (signals.length === 0) {
      return { sent: 0, skipped: 0, failures: 0 };
    }

    const recipients = await this.prisma.membership.findMany({
      where: {
        organizationId: input.organizationId,
        status: MembershipStatus.ACTIVE,
      },
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    let sent = 0;
    let skipped = 0;
    let failures = 0;

    for (const recipient of recipients) {
      const email = recipient.user.email?.trim();
      if (!email) {
        continue;
      }

      for (const signal of signals) {
        const idempotencyKey = `audit-signal:${signal.id}:recipient:${recipient.user.id}`;
        const alreadyDispatched = await this.prisma.notification.findFirst({
          where: {
            organizationId: input.organizationId,
            userId: recipient.userId,
            type: 'audit.signal.missed_value.email',
            payloadJson: {
              path: ['idempotencyKey'],
              equals: idempotencyKey,
            },
          },
          select: { id: true },
        });

        if (alreadyDispatched) {
          skipped += 1;
          continue;
        }

        const subject = `Audit scan: ${signal.title}`;
        const body = [
          'A scheduled audit scan generated a new missed-value signal.',
          '',
          `Matter: ${signal.matter.name || signal.matter.id}`,
          `Summary: ${signal.summary}`,
          `Signal ID: ${signal.id}`,
          `Correlation ID: ${input.correlationId}`,
        ].join('\n');

        try {
          const result = await this.messageDispatch.sendEmail({
            to: email,
            subject,
            body,
            idempotencyKey,
          });

          await this.prisma.notification.create({
            data: {
              organizationId: input.organizationId,
              userId: recipient.userId,
              type: 'audit.signal.missed_value.email',
              payloadJson: {
                signalId: signal.id,
                matterId: signal.matterId,
                idempotencyKey,
                provider: result.provider,
                deliveryStatus: result.status,
                providerMessageId: result.externalMessageId || result.id,
                correlationId: input.correlationId,
              },
            },
          });

          sent += 1;
        } catch (error) {
          failures += 1;
          await this.prisma.notification.create({
            data: {
              organizationId: input.organizationId,
              userId: recipient.userId,
              type: 'audit.signal.missed_value.dispatch_failed',
              payloadJson: {
                signalId: signal.id,
                matterId: signal.matterId,
                idempotencyKey,
                correlationId: input.correlationId,
                errorName: error instanceof Error ? error.name : 'UnknownError',
                errorMessage: error instanceof Error ? error.message : String(error),
              },
            },
          });
        }
      }
    }

    return { sent, skipped, failures };
  }

  private isSchedulerEnabled() {
    return String(process.env.AUDIT_SCAN_SCHEDULER_ENABLED || 'false').toLowerCase() === 'true';
  }

  private resolveRunId(job: Job) {
    const timestamp = typeof job.timestamp === 'number' ? job.timestamp : Date.now();
    return `audit-scan-${job.id || timestamp}`;
  }

  private readIntEnv(name: string, fallback: number, min: number, max: number) {
    const raw = process.env[name];
    if (!raw) return fallback;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
  }
}
