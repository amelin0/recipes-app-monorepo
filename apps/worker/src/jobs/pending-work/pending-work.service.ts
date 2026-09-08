import { Injectable, Logger } from '@nestjs/common';

import { AccountDeletionRequestRepository } from '@dns/database';

import { JobsMetrics } from '../jobs.metrics';

export interface PendingWorkReport {
    /** Requests whose grace period ended and whose account is still here. */
    overdueDeletions: number;
    /** Requests still counting down. */
    waitingDeletions: number;
    /**
     * How long the longest-waiting one has been due, in seconds; 0 when none.
     *
     * This — not the count — is what an alert can act on. The procedure that
     * clears these is manual and weekly, so a non-zero count is the normal
     * state on a Tuesday; an oldest one that has been waiting a fortnight
     * means nobody has run it.
     */
    oldestOverdueSeconds: number;
}

/**
 * Counts the work the system has quietly left for a human.
 *
 * Today that is one thing, and it is the one that matters most: account
 * deletion requests past their date. Nothing erases an account yet — that is
 * blocked on [ADR-0005](../../../../docs/adr/0005-what-account-deletion-erases.md)
 * — so the requests accumulate, the procedure is a runbook someone has to
 * remember to run weekly, and **nothing anywhere says they are piling up**.
 *
 * The promise made to the user carries a date, which makes this a legal
 * exposure rather than a tidiness one. A count nobody reads would not fix that;
 * the point of the job is the gauge it feeds and the alert on top of it.
 *
 * Read-only by design: it counts, it does not delete. Deleting is what needs
 * the decision.
 */
@Injectable()
export class PendingWorkService {
    private readonly logger = new Logger(PendingWorkService.name);

    constructor(
        private readonly deletionRequests: AccountDeletionRequestRepository,
        private readonly metrics: JobsMetrics,
    ) {}

    async run(now: Date = new Date()): Promise<PendingWorkReport> {
        const { overdue, waiting, oldestOverdueAt } = await this.deletionRequests.countOpen(now);

        const oldestOverdueSeconds = oldestOverdueAt
            ? Math.max(0, Math.round((now.getTime() - oldestOverdueAt.getTime()) / 1000))
            : 0;

        // The gauges are the product of this job, not a side effect of it —
        // which is why they are set here rather than in the processor.
        this.metrics.recordOpenAccountDeletions({ overdue, waiting, oldestOverdueSeconds });

        const report: PendingWorkReport = {
            overdueDeletions: overdue,
            waitingDeletions: waiting,
            oldestOverdueSeconds,
        };

        // Logged every run, not only when something is overdue: a line that
        // appears exactly when there is trouble is a line nobody has learned
        // to read, and the zero is what proves the job ran at all.
        this.logger.log({ msg: 'counted pending work', ...report });

        return report;
    }
}
