import { Injectable } from '@nestjs/common';
import { SQL, eq, sql } from 'drizzle-orm';

import { ProfileEntity } from '../../entities';
import { nutritionGoals, profiles } from '../../schema';
import { BaseRepository } from '../base.repository';

type ProfileColumns = typeof profiles.$inferInsert;

/**
 * Everything the edit screen and the questionnaire may write.
 *
 * `onboardingStep` only ever moves forward: it is written as
 * `greatest(current, given)`, so an earlier step answered again — or two
 * answers in flight landing out of order — cannot move the resume point back.
 */
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

/** The daily goal the questionnaire ends with, minus the key the repository fills in. */
export type OnboardingGoal = Omit<typeof nutritionGoals.$inferInsert, 'userId' | 'createdAt' | 'updatedAt'>;

@Injectable()
export class ProfileRepository extends BaseRepository {
    async findByUserId(userId: string): Promise<ProfileEntity | null> {
        const row = await this.db.query.profiles.findFirst({ where: eq(profiles.userId, userId) });
        return row ? ProfileEntity.from(row) : null;
    }

    async update(userId: string, data: UpdateProfile): Promise<ProfileEntity> {
        const [row] = await this.db
            .update(profiles)
            .set(columnsFor(data))
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
                .set(columnsFor(data))
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

    /**
     * Ends the questionnaire: writes the daily goal and marks the profile
     * done, in one transaction.
     *
     * `goalFor` receives the profile as it stands **under a row lock**, not
     * the copy the request read on its way in. The goal is derived from the
     * answers, so deriving it from a stale read would let an answer changed in
     * the meantime (a weight saved a moment earlier) produce a goal that
     * matches no state the profile was ever in. Throwing from `goalFor` —
     * «the questionnaire is not finished» — rolls both writes back.
     *
     * One transaction because the two belong together: a goal written with
     * the profile update failing after it would leave a goal behind for a
     * questionnaire that still reads unfinished.
     */
    async completeOnboarding(
        userId: string,
        finalStep: number,
        goalFor: (profile: ProfileEntity) => OnboardingGoal,
    ): Promise<ProfileEntity> {
        return this.db.transaction(async tx => {
            const [current] = await tx.select().from(profiles).where(eq(profiles.userId, userId)).for('no key update');

            if (!current) throw new Error(`Profile not found for user ${userId}`);

            const goal = { ...goalFor(ProfileEntity.from(current)), userId };

            await tx
                .insert(nutritionGoals)
                .values(goal)
                .onConflictDoUpdate({
                    target: nutritionGoals.userId,
                    set: { ...goal, updatedAt: new Date() },
                });

            const [row] = await tx
                .update(profiles)
                .set({
                    onboardingCompletedAt: new Date(),
                    onboardingStep: advanceOnboardingTo(finalStep),
                    updatedAt: new Date(),
                })
                .where(eq(profiles.userId, userId))
                .returning();

            if (!row) throw new Error(`Profile not found for user ${userId}`);
            return ProfileEntity.from(row);
        });
    }
}

/**
 * The columns an update writes. Shared by the plain and the locked update so
 * the step rule below cannot hold on one path and not the other.
 */
function columnsFor(data: UpdateProfile) {
    const { onboardingStep, ...rest } = data;

    return {
        ...rest,
        ...(onboardingStep === undefined ? {} : { onboardingStep: advanceOnboardingTo(onboardingStep) }),
        updatedAt: new Date(),
    };
}

/**
 * The resume point, moved forward only — computed in the statement, from the
 * value the row holds at that moment. A `Math.max` against a value the
 * request read earlier could not do this: two answers in flight both read the
 * same old step, and whichever lands second wins, even if it is the smaller.
 */
function advanceOnboardingTo(step: number): SQL {
    return sql`greatest(${profiles.onboardingStep}, ${step}::integer)`;
}
