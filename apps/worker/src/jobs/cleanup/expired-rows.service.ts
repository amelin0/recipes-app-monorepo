import { Injectable, Logger } from '@nestjs/common';

import { NOTIFICATION_RETENTION_DAYS } from '@dns/constants';
import {
    NotificationRepository,
    OtpCodeRepository,
    PasswordResetPermitRepository,
    RefreshTokenRepository,
} from '@dns/database';

export interface CleanupReport {
    refreshTokens: number;
    otpCodes: number;
    passwordResetPermits: number;
    /** Older than `NOTIFICATION_RETENTION_DAYS`. */
    notifications: number;
}

const DAY_MS = 86_400_000;

/**
 * Rows per statement when forgetting notifications. Small enough that each
 * delete is a short transaction on the database the API serves from; large
 * enough that a night's worth is a handful of statements, not thousands.
 */
const NOTIFICATION_BATCH_SIZE = 1_000;

/**
 * Deletes rows whose time is up and that nothing cleans up otherwise.
 *
 * Three tables grow forever otherwise: refresh tokens are kept after rotation
 * so a replay stays detectable, OTP codes after use so a second attempt can be
 * told from a first, and reset permits until they are spent. All three of those
 * reasons stop applying at the expiry moment — after it the row proves nothing.
 *
 * The fourth is the inbox, and its moment is a product decision rather than a
 * column: a notification is kept `NOTIFICATION_RETENTION_DAYS` from when it was
 * written, and then it goes.
 *
 * Idempotent by construction: it deletes by a predicate on time, so running it
 * twice deletes nothing the second time. That matters because the queue
 * guarantees «at least once», not «exactly once».
 */
@Injectable()
export class ExpiredRowsService {
    private readonly logger = new Logger(ExpiredRowsService.name);

    constructor(
        private readonly refreshTokens: RefreshTokenRepository,
        private readonly otpCodes: OtpCodeRepository,
        private readonly permits: PasswordResetPermitRepository,
        private readonly notifications: NotificationRepository,
    ) {}

    async run(now: Date = new Date()): Promise<CleanupReport> {
        // Sequential, not Promise.all: this runs at night against the same
        // database the API serves from, and concurrent deletes buy nothing
        // but lock contention.
        const report: CleanupReport = {
            refreshTokens: await this.refreshTokens.deleteExpired(now),
            otpCodes: await this.otpCodes.deleteExpired(now),
            passwordResetPermits: await this.permits.deleteExpired(now),
            notifications: await this.forgetOldNotifications(now),
        };

        this.logger.log({ msg: 'swept expired rows', ...report });

        return report;
    }

    /**
     * Unread goes too — deliberately. `read_at` says whether somebody opened
     * it, not whether it still matters. An «unread» message three months old is
     * not news the account is still waiting for, and exempting it would keep
     * forever exactly the rows nobody is going to open.
     *
     * The subscription warning reads the inbox back to avoid repeating itself,
     * but only `JOBS_EXPIRING_WITHIN_DAYS` into the past — days, not months —
     * so nothing it relies on is ever old enough to be here.
     */
    private forgetOldNotifications(now: Date): Promise<number> {
        const cutoff = new Date(now.getTime() - NOTIFICATION_RETENTION_DAYS * DAY_MS);

        return this.notifications.deleteCreatedBefore(cutoff, NOTIFICATION_BATCH_SIZE);
    }
}
