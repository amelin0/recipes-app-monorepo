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
        const { onboardingStep, ...rest } = data;

        const [row] = await this.db
            .update(profiles)
            .set({
                ...rest,
                ...(onboardingStep === undefined ? {} : { onboardingStep: advanceOnboardingTo(onboardingStep) }),
                updatedAt: new Date(),
            })
            .where(eq(profiles.userId, userId))
            .returning();

        if (!row) throw new Error(`Profile not found for user ${userId}`);
        return ProfileEntity.from(row);
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
 * The resume point, moved forward only — computed in the statement, from the
 * value the row holds at that moment. A `Math.max` against a value the
 * request read earlier could not do this: two answers in flight both read the
 * same old step, and whichever lands second wins, even if it is the smaller.
 */
function advanceOnboardingTo(step: number): SQL {
    return sql`greatest(${profiles.onboardingStep}, ${step}::integer)`;
}
