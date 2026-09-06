import { users } from '../schema';

type UserRow = typeof users.$inferSelect;

export class UserEntity {
    readonly id: string;
    readonly email: string;
    readonly passwordHash: string | null;
    readonly emailVerifiedAt: Date | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    private constructor(row: UserRow) {
        this.id = row.id;
        this.email = row.email;
        this.passwordHash = row.passwordHash;
        this.emailVerifiedAt = row.emailVerifiedAt;
        this.createdAt = row.createdAt;
        this.updatedAt = row.updatedAt;
    }

    static from(row: UserRow): UserEntity {
        return new UserEntity(row);
    }

    isEmailVerified(): boolean {
        return this.emailVerifiedAt !== null;
    }

    /**
     * False for an account created through Apple or Google that has never set
     * one. Such an account cannot log in with a password — but it can acquire
     * one through the reset flow (sign-up FR-013).
     */
    hasPassword(): boolean {
        return this.passwordHash !== null;
    }
}
