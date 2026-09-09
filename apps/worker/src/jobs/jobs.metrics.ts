import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

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

    /**
     * A queue of human work, not of machine work.
     *
     * Deliberately a gauge rather than a counter: the question is «how many are
     * waiting right now», and it must be able to go back down when somebody
     * runs the manual procedure. Both label values are always set, including
     * when they are zero — a series that disappears when the number is fine
     * cannot be told from a series that stopped being written.
     */
    private readonly openAccountDeletions = new Gauge({
        name: 'dns_account_deletion_requests_open',
        help: 'Open account deletion requests, by whether their scheduled date has passed',
        labelNames: ['state'] as const,
        registers: [this.registry],
    });

    constructor() {
        collectDefaultMetrics({ register: this.registry, prefix: 'dns_worker_' });
    }

    /**
     * The number the alert actually reads.
     *
     * The count cannot carry one: clearing these is a manual weekly procedure,
     * so «more than zero» is the ordinary state between runs. Age is what
     * separates a normal Tuesday from nobody having run it in a month — and,
     * unlike a long `for:` on the count, it survives Grafana restarting.
     */
    private readonly oldestOverdueDeletion = new Gauge({
        name: 'dns_account_deletion_requests_oldest_overdue_seconds',
        help: 'How long the longest-waiting overdue deletion request has been due; 0 when there are none',
        registers: [this.registry],
    });

    recordOpenAccountDeletions(counts: { overdue: number; waiting: number; oldestOverdueSeconds: number }): void {
        this.openAccountDeletions.set({ state: 'overdue' }, counts.overdue);
        this.openAccountDeletions.set({ state: 'waiting' }, counts.waiting);
        this.oldestOverdueDeletion.set(counts.oldestOverdueSeconds);
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
