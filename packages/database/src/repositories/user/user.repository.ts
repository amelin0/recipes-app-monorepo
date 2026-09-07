import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { UserEntity } from '../../entities';
import { profiles, userReminders, users, userSettings } from '../../schema';
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
}
