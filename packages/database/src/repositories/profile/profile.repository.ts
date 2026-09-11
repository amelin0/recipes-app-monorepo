import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { ProfileEntity } from '../../entities';
import { profiles } from '../../schema';
import { BaseRepository } from '../base.repository';

type ProfileColumns = typeof profiles.$inferInsert;

/** Everything the edit screen and the questionnaire may write. */
type UpdateProfile = Partial<
    Pick<
        ProfileColumns,
        | 'name'
        | 'photoUrl'
        | 'gender'
        | 'birthDate'
        | 'weightKg'
        | 'heightCm'
        | 'activityLevel'
        | 'goal'
        | 'targetWeightKg'
        | 'onboardingStep'
        | 'onboardingCompletedAt'
        | 'paywallSeenAt'
    >
>;

@Injectable()
export class ProfileRepository extends BaseRepository {
    async findByUserId(userId: string): Promise<ProfileEntity | null> {
        const row = await this.db.query.profiles.findFirst({ where: eq(profiles.userId, userId) });
        return row ? ProfileEntity.from(row) : null;
    }

    async update(userId: string, data: UpdateProfile): Promise<ProfileEntity> {
        const [row] = await this.db
            .update(profiles)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(profiles.userId, userId))
            .returning();

        if (!row) throw new Error(`Profile not found for user ${userId}`);
        return ProfileEntity.from(row);
    }

    /**
     * An update whose content depends on the row as it stands — decided and
     * written under a row lock, so no other write to this profile can land in
     * between.
     *
     * Needed where the decision is «is this a change?»: two concurrent edits
     * reading the same old row would each decide against a state the other is
     * about to replace. `decide` may do I/O (the photo check asks the store);
     * the lock covers one account's row, so only that account's own
     * concurrent edits wait on it.
     */
    async updateLocked(
        userId: string,
        decide: (current: ProfileEntity) => Promise<UpdateProfile>,
    ): Promise<{ before: ProfileEntity; after: ProfileEntity }> {
        return this.db.transaction(async tx => {
            const [current] = await tx.select().from(profiles).where(eq(profiles.userId, userId)).for('update');
            if (!current) throw new Error(`Profile not found for user ${userId}`);

            const before = ProfileEntity.from(current);
            const data = await decide(before);

            const [row] = await tx
                .update(profiles)
                .set({ ...data, updatedAt: new Date() })
                .where(eq(profiles.userId, userId))
                .returning();

            if (!row) throw new Error(`Profile not found for user ${userId}`);
            return { before, after: ProfileEntity.from(row) };
        });
    }

    /**
     * Runs `act` against the row as it stands, holding the same lock
     * `updateLocked` takes — for work outside the database that must not
     * interleave with a write to this profile (deleting the file the row
     * used to point at). Writes nothing itself.
     */
    async withRowLocked(userId: string, act: (current: ProfileEntity) => Promise<void>): Promise<void> {
        await this.db.transaction(async tx => {
            const [current] = await tx.select().from(profiles).where(eq(profiles.userId, userId)).for('update');
            if (!current) throw new Error(`Profile not found for user ${userId}`);

            await act(ProfileEntity.from(current));
        });
    }
}
