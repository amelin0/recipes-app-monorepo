import { InjectQueue } from '@nestjs/bullmq';
import { Controller, Get, Res } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Response } from 'express';

import { JOBS_QUEUE } from '../jobs/jobs.constants';
import { JobsMetrics } from '../jobs/jobs.metrics';

/**
 * The only two routes a worker serves.
 *
 * It answers no business requests, so without these it would be invisible to
 * everything that watches the rest of the stack — and a container that is
 * merely idle would be indistinguishable from one that is wedged.
 */
@Controller()
export class HealthController {
    constructor(
        @InjectQueue(JOBS_QUEUE) private readonly queue: Queue,
        private readonly metrics: JobsMetrics,
    ) {}

    /**
     * Ready means «the queue answers», not «the process is up».
     *
     * A worker that cannot reach Redis runs nothing at all, and reporting ok in
     * that state is how a silent failure survives a deploy.
     */
    @Get('health')
    async health(): Promise<{ status: string; queue: Record<string, number> }> {
        const counts = await this.queue.getJobCounts('waiting', 'active', 'delayed', 'failed');

        return { status: 'ok', queue: counts };
    }

    @Get('metrics')
    async scrape(@Res() res: Response): Promise<void> {
        res.header('Content-Type', this.metrics.contentType());
        res.send(await this.metrics.scrape());
    }
}
