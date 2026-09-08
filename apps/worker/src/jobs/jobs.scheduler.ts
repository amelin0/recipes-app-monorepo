import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

import { AllConfig } from '../common/config';

import { JOBS_QUEUE, JobName } from './jobs.constants';

/**
 * Registers the repeatable jobs on boot.
 *
 * `jobId` is fixed per job, which is what makes a restart idempotent: BullMQ
 * replaces the schedule instead of adding a second one. Without it, every
 * deploy would leave another copy of the nightly sweep behind, and after a
 * month the cleanup would run thirty times a night.
 */
@Injectable()
export class JobsScheduler implements OnApplicationBootstrap {
    private readonly logger = new Logger(JobsScheduler.name);

    constructor(
        @InjectQueue(JOBS_QUEUE) private readonly queue: Queue,
        private readonly configService: ConfigService<AllConfig>,
    ) {}

    async onApplicationBootstrap(): Promise<void> {
        const cleanup = this.configService.getOrThrow('jobs.cleanupCron', { infer: true });
        const subscriptions = this.configService.getOrThrow('jobs.subscriptionCron', { infer: true });

        await this.schedule(JobName.ExpiredRows, cleanup);
        await this.schedule(JobName.SubscriptionExpiry, subscriptions);
    }

    private async schedule(name: string, pattern: string): Promise<void> {
        await this.queue.add(
            name,
            {},
            {
                repeat: { pattern },
                jobId: name,
                // Nightly jobs that fail are retried three times with backoff,
                // then left alone: the next night is soon enough, and a job
                // hammering a database that is already unhappy helps nobody.
                attempts: 3,
                backoff: { type: 'exponential', delay: 60_000 },
                removeOnComplete: { count: 50 },
                removeOnFail: { count: 100 },
            },
        );

        this.logger.log({ msg: 'scheduled', job: name, pattern });
    }
}
