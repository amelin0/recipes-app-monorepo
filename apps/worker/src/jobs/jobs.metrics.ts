import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

/**
 * What Grafana can ask about a process that answers no requests.
 *
 * A worker with nothing to do and a worker that died look identical from the
 * outside — that is the risk ADR-0008 accepted when it added a second process.
 * These two series are what tells them apart: the run counter stops climbing.
 */
@Injectable()
export class JobsMetrics {
    readonly registry = new Registry();

    private readonly runs = new Counter({
        name: 'dns_worker_job_runs_total',
        help: 'Job executions by name and outcome',
        labelNames: ['job', 'outcome'] as const,
        registers: [this.registry],
    });

    private readonly duration = new Histogram({
        name: 'dns_worker_job_duration_seconds',
        help: 'How long a job took',
        labelNames: ['job'] as const,
        buckets: [0.1, 0.5, 1, 5, 15, 60, 300],
        registers: [this.registry],
    });

    constructor() {
        collectDefaultMetrics({ register: this.registry, prefix: 'dns_worker_' });
    }

    recordRun(job: string, outcome: 'ok' | 'failed', elapsedMs: number): void {
        this.runs.inc({ job, outcome });
        this.duration.observe({ job }, elapsedMs / 1000);
    }

    scrape(): Promise<string> {
        return this.registry.metrics();
    }

    contentType(): string {
        return this.registry.contentType;
    }
}
