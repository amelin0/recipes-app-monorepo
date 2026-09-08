import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { ExpiredRowsService } from './cleanup/expired-rows.service';
import { JOBS_QUEUE, JobName } from './jobs.constants';
import { JobsMetrics } from './jobs.metrics';
import { PendingWorkService } from './pending-work/pending-work.service';
import { SubscriptionExpiryService } from './subscription/subscription-expiry.service';

/**
 * The one place a queued job turns into work.
 *
 * Every branch delegates to a service that knows nothing about BullMQ — which
 * is what lets the jobs be tested against a real database without a queue, and
 * what would let the queue be replaced without touching what it runs.
 */
@Processor(JOBS_QUEUE)
export class JobsProcessor extends WorkerHost {
    private readonly logger = new Logger(JobsProcessor.name);

    constructor(
        private readonly expiredRows: ExpiredRowsService,
        private readonly subscriptions: SubscriptionExpiryService,
        private readonly pendingWork: PendingWorkService,
        private readonly metrics: JobsMetrics,
    ) {
        super();
    }

    async process(job: Job): Promise<unknown> {
        const started = Date.now();

        try {
            const result = await this.run(job.name);

            this.metrics.recordRun(job.name, 'ok', Date.now() - started);
            this.logger.log({ msg: 'job finished', job: job.name, result });

            return result;
        } catch (error) {
            // Counted before rethrowing: BullMQ will retry, and the retry is
            // exactly the thing worth seeing on a graph.
            this.metrics.recordRun(job.name, 'failed', Date.now() - started);
            this.logger.error({ msg: 'job failed', job: job.name, error });

            throw error;
        }
    }

    private run(name: string): Promise<unknown> {
        switch (name) {
            case JobName.ExpiredRows:
                return this.expiredRows.run();
            case JobName.SubscriptionExpiry:
                return this.subscriptions.run();
            case JobName.PendingWork:
                return this.pendingWork.run();
            default:
                // A job nobody handles is a deploy mistake, not a data problem:
                // fail loudly rather than mark it done.
                throw new Error(`Unknown job: ${name}`);
        }
    }
}
