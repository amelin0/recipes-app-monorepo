import { Injectable } from '@nestjs/common';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';

import { UserEntity } from '../../entities';
import {
    otpCodes,
    passwordResetPermits,
    profiles,
    refreshTokens,
    userReminders,
    users,
    userSettings,
} from '../../schema';
import { BaseRepository } from '../base.repository';

type InsertUser = typeof users.$inferInsert;
type InsertProfile = typeof profiles.$inferInsert;
type InsertUserSettings = typeof userSettings.$inferInsert;
type InsertUserReminder = typeof userReminders.$inferInsert;

/**
 * Everything a new account needs to exist. Values come from the caller, not
 * from this layer: what a new user's default theme or breakfast time should be
 * is product policy (`@dns/constants`), and the data layer stays free of it.
 */
export interface CreateAccountInput {
    user: InsertUser;
    profile: Omit<InsertProfile, 'userId'>;
    settings: Omit<InsertUserSettings, 'userId'>;
    reminders: Omit<InsertUserReminder, 'userId'>[];
}

@Injectable()
export class UserRepository extends BaseRepository {
    /**
     * The caller passes an already-lower-cased address. Normalisation lives in
     * the service so exactly one place decides what "the same email" means.
     */
    async findByEmail(email: string): Promise<UserEntity | null> {
        const row = await this.db.query.users.findFirst({ where: eq(users.email, email) });
        return row ? UserEntity.from(row) : null;
    }

    async findById(id: string): Promise<UserEntity | null> {
        const row = await this.db.query.users.findFirst({ where: eq(users.id, id) });
        return row ? UserEntity.from(row) : null;
    }

    /**
     * Creates the account and the rows that must exist alongside it, in one
     * transaction: a user without settings or reminders would make every later
     * read handle a null that is not supposed to be reachable.
     *
     * Spans four tables on purpose — they form one aggregate, and splitting
     * the inserts across repositories would put the transaction boundary
     * somewhere it cannot be enforced.
     */
    async createAccount({ user, profile, settings, reminders }: CreateAccountInput): Promise<UserEntity> {
        return this.db.transaction(async tx => {
            const [row] = await tx.insert(users).values(user).returning();
            if (!row) throw new Error('Failed to insert user');

            await tx.insert(profiles).values({ ...profile, userId: row.id });
            await tx.insert(userSettings).values({ ...settings, userId: row.id });

            if (reminders.length > 0) {
                await tx.insert(userReminders).values(reminders.map(reminder => ({ ...reminder, userId: row.id })));
            }

            return UserEntity.from(row);
        });
    }

    async create(data: InsertUser): Promise<UserEntity> {
        const [row] = await this.db.insert(users).values(data).returning();
        if (!row) throw new Error('Failed to insert user');
        return UserEntity.from(row);
    }

    async markEmailVerified(id: string): Promise<void> {
        await this.db.update(users).set({ emailVerifiedAt: new Date(), updatedAt: new Date() }).where(eq(users.id, id));
    }

    async setPasswordHash(id: string, passwordHash: string): Promise<void> {
        await this.db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, id));
    }

    /**
     * Spends a reset permit and sets the new password, clearing everything the
     * old password could still reach — every session, every permit, every
     * outstanding code (password-reset FR-005). One transaction; false when
     * the permit is unknown, expired or already spent.
     *
     * - **Single use** is the conditional UPDATE on the permit: two requests
     *   carrying the same permit both get this far, and only the first finds
     *   `consumed_at IS NULL`. The second changes nothing.
     * - **Revocation wins over a refresh in flight.** The user row is locked
     *   `FOR NO KEY UPDATE` first — the lock every session grant and rotation
     *   conflicts with (`RefreshTokenRepository`, which takes `FOR SHARE`). A
     *   rotation that got in first is waited for, and the DELETE below, a later
     *   statement with a fresh snapshot, sees the token it minted. One that
     *   comes later waits for this commit and finds its token gone.
     * - **Lock order** is user row, then permits, then tokens — the same user-
     *   first order as rotation. Consuming the permit before locking the user
     *   would deadlock two resets of one account holding different permits.
     *
     * READ COMMITTED on purpose: each statement must see what committed while
     * it waited for the lock. Under REPEATABLE READ the DELETE would read from
     * the snapshot taken before the wait and miss that token.
     */
    async resetPasswordWithPermit({
        userId,
        permitId,
        passwordHash,
    }: {
        userId: string;
        permitId: string;
        passwordHash: string;
    }): Promise<boolean> {
        return this.db.transaction(async tx => {
            const [user] = await tx
                .select({ id: users.id })
                .from(users)
                .where(eq(users.id, userId))
                .for('no key update');
            if (!user) return false;

            const [permit] = await tx
                .update(passwordResetPermits)
                .set({ consumedAt: sql`now()` })
                .where(
                    and(
                        eq(passwordResetPermits.id, permitId),
                        eq(passwordResetPermits.userId, userId),
                        isNull(passwordResetPermits.consumedAt),
                        gt(passwordResetPermits.expiresAt, sql`now()`),
                    ),
                )
                .returning({ id: passwordResetPermits.id });
            if (!permit) return false;

            await tx
                .update(users)
                .set({ passwordHash, updatedAt: sql`now()` })
                .where(eq(users.id, userId));

            await tx.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
            await tx.delete(passwordResetPermits).where(eq(passwordResetPermits.userId, userId));
            // Both flows' codes — «every outstanding code», not only this flow's.
            await tx.delete(otpCodes).where(eq(otpCodes.userId, userId));

            return true;
        });
    }
}
