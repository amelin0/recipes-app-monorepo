import { OtpPurpose } from '@dns/shared-types';

import { otpCodes } from '../schema';

type OtpCodeRow = typeof otpCodes.$inferSelect;

export class OtpCodeEntity {
    readonly id: string;
    readonly userId: string;
    readonly purpose: OtpPurpose;
    readonly codeHash: string;
    readonly attempts: number;
    readonly expiresAt: Date;
    readonly consumedAt: Date | null;
    readonly createdAt: Date;

    private constructor(row: OtpCodeRow) {
        this.id = row.id;
        this.userId = row.userId;
        this.purpose = row.purpose as OtpPurpose;
        this.codeHash = row.codeHash;
        this.attempts = row.attempts;
        this.expiresAt = row.expiresAt;
        this.consumedAt = row.consumedAt;
        this.createdAt = row.createdAt;
    }

    static from(row: OtpCodeRow): OtpCodeEntity {
        return new OtpCodeEntity(row);
    }

    isExpired(now: Date = new Date()): boolean {
        return this.expiresAt <= now;
    }

    isConsumed(): boolean {
        return this.consumedAt !== null;
    }
}
