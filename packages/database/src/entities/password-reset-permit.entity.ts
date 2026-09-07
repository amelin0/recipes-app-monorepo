import { passwordResetPermits } from '../schema';

type PasswordResetPermitRow = typeof passwordResetPermits.$inferSelect;

export class PasswordResetPermitEntity {
    readonly id: string;
    readonly userId: string;
    readonly expiresAt: Date;
    readonly consumedAt: Date | null;
    readonly createdAt: Date;

    private constructor(row: PasswordResetPermitRow) {
        this.id = row.id;
        this.userId = row.userId;
        this.expiresAt = row.expiresAt;
        this.consumedAt = row.consumedAt;
        this.createdAt = row.createdAt;
    }

    static from(row: PasswordResetPermitRow): PasswordResetPermitEntity {
        return new PasswordResetPermitEntity(row);
    }

    isExpired(now: Date = new Date()): boolean {
        return this.expiresAt <= now;
    }

    isConsumed(): boolean {
        return this.consumedAt !== null;
    }
}
