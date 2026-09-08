import { Injectable, Logger } from '@nestjs/common';

import { OtpCodeRepository, PasswordResetPermitRepository, RefreshTokenRepository } from '@dns/database';

export interface CleanupReport {
    refreshTokens: number;
    otpCodes: number;
    passwordResetPermits: number;
}

/**
 * Deletes rows that expired and were never cleaned up.
 *
 * Three tables grow forever otherwise: refresh tokens are kept after rotation
 * so a replay stays detectable, OTP codes after use so a second attempt can be
 * told from a first, and reset permits until they are spent. All three of those
 * reasons stop applying at the expiry moment — after it the row proves nothing.
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
    ) {}

    async run(now: Date = new Date()): Promise<CleanupReport> {
        // Sequential, not Promise.all: this runs at night against the same
        // database the API serves from, and three concurrent deletes buy
        // nothing but lock contention.
        const report: CleanupReport = {
            refreshTokens: await this.refreshTokens.deleteExpired(now),
            otpCodes: await this.otpCodes.deleteExpired(now),
            passwordResetPermits: await this.permits.deleteExpired(now),
        };

        this.logger.log({ msg: 'swept expired rows', ...report });

        return report;
    }
}
