import { BadRequestException } from '@nestjs/common';

import { ONBOARDING_LIMITS } from '@dns/constants';
import { NutritionRepository, ProfileEntity, UserEntity, UserRepository } from '@dns/database';
import { Gender, UserGoal } from '@dns/shared-types';

import { AuthService } from '../src/modules/auth/auth.service';
import { OnboardingService } from '../src/modules/user/onboarding.service';
import { ProfileService } from '../src/modules/user/profile.service';

import { truncateAuthTables } from './support/db';
import { AuthTestContext, createAuthTestContext } from './support/testing-module';

const EMAIL = 'newbie@example.com';
const PASSWORD = 'passw0rd';

/** A 31-year-old man, 80 kg, 180 cm — the worked example in ADR-0007. */
const ANSWERS = {
    gender: Gender.Male,
    birthDate: '1995-06-15',
    weightKg: 80,
    heightCm: 180,
    activityLevel: 1,
    goal: UserGoal.Maintain,
};

describe('Onboarding', () => {
    let ctx: AuthTestContext;
    let authService: AuthService;
    let onboarding: OnboardingService;
    let profileService: ProfileService;
    let nutrition: NutritionRepository;
    let users: UserRepository;
    let user: UserEntity;

    beforeAll(async () => {
        ctx = await createAuthTestContext();
        authService = ctx.moduleRef.get(AuthService);
        onboarding = ctx.moduleRef.get(OnboardingService);
        profileService = ctx.moduleRef.get(ProfileService);
        nutrition = ctx.moduleRef.get(NutritionRepository);
        users = ctx.moduleRef.get(UserRepository);
    });

    afterAll(async () => {
        await ctx.close();
    });

    const profileOf = async (): Promise<ProfileEntity> => (await profileService.getAggregate(user)).profile;

    beforeEach(async () => {
        await truncateAuthTables(ctx.db);
        await authService.register({ email: EMAIL, password: PASSWORD });
        await authService.verifyEmail({ email: EMAIL, code: '000000' });

        const found = await users.findByEmail(EMAIL);
        expect(found).not.toBeNull();
        user = found as UserEntity;
    });

    const answerEverything = async (overrides: Partial<typeof ANSWERS> = {}): Promise<ProfileEntity> =>
        onboarding.saveStep(await profileOf(), { ...ANSWERS, ...overrides });

    describe('state', () => {
        it('starts unanswered and not complete', async () => {
            const profile = await profileOf();

            expect(profile.onboardingStep).toBe(0);
            expect(profile.hasCompletedOnboarding()).toBe(false);
            expect(profile.gender).toBeNull();
        });

        it('keeps answers between steps so an interrupted run resumes', async () => {
            await onboarding.saveStep(await profileOf(), { gender: Gender.Male, step: 3 });
            await onboarding.saveStep(await profileOf(), { birthDate: '1995-06-15', step: 4 });

            const profile = await profileOf();
            expect(profile.gender).toBe(Gender.Male);
            expect(profile.birthDate).toBe('1995-06-15');
            expect(profile.onboardingStep).toBe(4);
        });

        it('never moves the resume point backwards when an earlier answer is changed', async () => {
            await onboarding.saveStep(await profileOf(), { weightKg: 80, step: 7 });
            const after = await onboarding.saveStep(await profileOf(), { weightKg: 82, step: 6 });

            expect(after.weightKg).toBe(82);
            expect(after.onboardingStep).toBe(7);
        });

        it('drops a stale target weight when the goal stops being about weight', async () => {
            await onboarding.saveStep(await profileOf(), { goal: UserGoal.LoseWeight, targetWeightKg: 72 });
            expect((await profileOf()).targetWeightKg).toBe(72);

            await onboarding.saveStep(await profileOf(), { goal: UserGoal.LearnCooking });
            expect((await profileOf()).targetWeightKg).toBeNull();
        });
    });

    describe('recommendations', () => {
        it('has none until every input is answered', async () => {
            expect(onboarding.recommendations(await profileOf())).toBeNull();

            // One field short is still none — a norm computed from a guessed
            // weight would look just as authoritative as a real one.
            await onboarding.saveStep(await profileOf(), { ...ANSWERS, activityLevel: undefined });
            expect(onboarding.recommendations(await profileOf())).toBeNull();
        });

        it('matches the worked example once everything is answered', async () => {
            await answerEverything();
            const result = onboarding.recommendations(await profileOf());

            // BMR 1775 × PAL 1.2 = 2130, rounded to the dial's 50 kcal step.
            expect(result?.norms.calories).toBe(2150);
            // 80 kg × 30 ml, no activity supplement at level 1.
            expect(result?.norms.waterMl).toBe(2400);
            expect(result?.norms.steps).toBe(5000);
        });

        it('follows the goal', async () => {
            await answerEverything({ goal: UserGoal.Maintain });
            const maintain = onboarding.recommendations(await profileOf());

            await answerEverything({ goal: UserGoal.LoseWeight });
            const lose = onboarding.recommendations(await profileOf());

            expect(lose?.norms.calories).toBeLessThan(maintain?.norms.calories as number);
            // Losing weight also nudges the step target up.
            expect(lose?.norms.steps).toBeGreaterThan(maintain?.norms.steps as number);
        });

        it('follows a weight change, so a recomputed norm is never stale', async () => {
            await answerEverything({ weightKg: 80 });
            const before = onboarding.recommendations(await profileOf());

            await onboarding.saveStep(await profileOf(), { weightKg: 90 });
            const after = onboarding.recommendations(await profileOf());

            expect(after?.norms.calories).toBeGreaterThan(before?.norms.calories as number);
        });
    });

    describe('completion', () => {
        it('refuses to finish while questions are unanswered', async () => {
            await onboarding.saveStep(await profileOf(), { gender: Gender.Female, step: 3 });

            await expect(
                onboarding.complete(await profileOf(), {
                    dailyCalories: 1700,
                    dailyWaterMl: 2000,
                    dailySteps: 8000,
                }),
            ).rejects.toBeInstanceOf(BadRequestException);

            expect((await profileOf()).hasCompletedOnboarding()).toBe(false);
        });

        it('marks the account done and writes the daily goal in one go', async () => {
            await answerEverything();
            expect(await nutrition.findGoal(user.id)).toBeNull();

            const profile = await onboarding.complete(await profileOf(), {
                dailyCalories: 1700,
                dailyWaterMl: 2500,
                dailySteps: 9000,
            });

            expect(profile.hasCompletedOnboarding()).toBe(true);
            expect(profile.onboardingStep).toBe(ONBOARDING_LIMITS.stepCount);

            // Leaving the account complete but goal-less would drop the user on
            // a tracking screen with no rings and no way to explain why.
            const goal = await nutrition.findGoal(user.id);
            expect(goal?.dailyCalories).toBe(1700);
            expect(goal?.dailyWaterMl).toBe(2500);
            expect(goal?.dailyStepsTarget).toBe(9000);
        });

        it('derives the macro split from what the user chose, not what we suggested', async () => {
            await answerEverything();
            const recommended = onboarding.recommendations(await profileOf());

            await onboarding.complete(await profileOf(), {
                dailyCalories: 1700,
                dailyWaterMl: 2500,
                dailySteps: 9000,
            });

            const goal = await nutrition.findGoal(user.id);
            expect(recommended?.norms.calories).not.toBe(1700);

            // 30% of 1700 kcal from protein at 4 kcal/g.
            expect(goal?.dailyProteinG).toBe(Math.round((1700 * 0.3) / 4));
        });

        it('freezes the recommendation beside the choice, so the deviation stays answerable', async () => {
            await answerEverything();
            const recommended = onboarding.recommendations(await profileOf());

            await onboarding.complete(await profileOf(), {
                dailyCalories: 1700,
                dailyWaterMl: 2500,
                dailySteps: 9000,
            });

            const [row] = await ctx.db.query.nutritionGoals.findMany();
            expect(row?.recommendedCalories).toBe(recommended?.norms.calories);
            expect(row?.recommendedWaterMl).toBe(recommended?.norms.waterMl);
            expect(row?.recommendedSteps).toBe(recommended?.norms.steps);
        });
    });
});
