import { BadRequestException, NotFoundException } from '@nestjs/common';

import { DAILY_TARGET_TOLERANCE } from '@dns/constants';
import { NutritionRepository, ProfileEntity, ProfileRepository, UserEntity, UserRepository } from '@dns/database';
import { BodyMetric, DailyOutcome, Gender, MealSlot, MetricKind, ProgressMetric, UserGoal } from '@dns/shared-types';

import { AuthService } from '../src/modules/auth/auth.service';
import { NutritionService } from '../src/modules/nutrition/nutrition.service';
import { DailyCard, OneOffCard, ProgressCard, ProgressService } from '../src/modules/progress/progress.service';
import { OnboardingService } from '../src/modules/user/onboarding.service';

import { truncateAuthTables } from './support/db';
import { AuthTestContext, createAuthTestContext } from './support/testing-module';

const EMAIL = 'tracker@example.com';
const OTHER_EMAIL = 'stranger@example.com';
const PASSWORD = 'passw0rd';

const GOAL = {
    dailyCalories: 2000,
    dailyProteinG: 150,
    dailyFatsG: 67,
    dailyCarbsG: 200,
    dailyWaterMl: 2500,
    dailyFiberG: 30,
    dailyStepsTarget: 10_000,
};

const today = (): string => new Date().toISOString().slice(0, 10);
const daysAgo = (days: number): string => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

describe('Progress', () => {
    let ctx: AuthTestContext;
    let authService: AuthService;
    let progress: ProgressService;
    let nutritionService: NutritionService;
    let nutrition: NutritionRepository;
    let onboarding: OnboardingService;
    let profiles: ProfileRepository;
    let users: UserRepository;
    let user: UserEntity;

    beforeAll(async () => {
        ctx = await createAuthTestContext();
        authService = ctx.moduleRef.get(AuthService);
        progress = ctx.moduleRef.get(ProgressService);
        nutritionService = ctx.moduleRef.get(NutritionService);
        nutrition = ctx.moduleRef.get(NutritionRepository);
        onboarding = ctx.moduleRef.get(OnboardingService);
        profiles = ctx.moduleRef.get(ProfileRepository);
        users = ctx.moduleRef.get(UserRepository);
    });

    afterAll(async () => {
        await ctx.close();
    });

    const register = async (email: string): Promise<UserEntity> => {
        await authService.register({ email, password: PASSWORD });
        await authService.verifyEmail({ email, code: '000000' });

        const found = await users.findByEmail(email);
        expect(found).not.toBeNull();

        return found as UserEntity;
    };

    beforeEach(async () => {
        await truncateAuthTables(ctx.db);
        user = await register(EMAIL);
    });

    const cardFor = (cards: ProgressCard[], metric: ProgressMetric): ProgressCard => {
        const card = cards.find(candidate => candidate.metric === metric);
        expect(card).toBeDefined();

        return card as ProgressCard;
    };

    /** Asserts the kind as well as finding the card, so the point fields are typed. */
    const dailyCardFor = (cards: ProgressCard[], metric: ProgressMetric): DailyCard => {
        const card = cardFor(cards, metric);
        expect(card.kind).toBe(MetricKind.Daily);

        return card as DailyCard;
    };

    const oneOffCardFor = (cards: ProgressCard[], metric: ProgressMetric): OneOffCard => {
        const card = cardFor(cards, metric);
        expect(card.kind).toBe(MetricKind.OneOff);

        return card as OneOffCard;
    };

    describe('overview', () => {
        it('returns every card even for an account that has recorded nothing', async () => {
            const cards = await progress.overview(user.id, 30);

            expect(cards.map(card => card.metric)).toEqual([
                ProgressMetric.Weight,
                ProgressMetric.Calories,
                ProgressMetric.Water,
                ProgressMetric.Steps,
                ProgressMetric.Waist,
                ProgressMetric.Height,
            ]);

            // An empty card is a legitimate state: the screen has to offer the
            // «record your first measurement» prompt somewhere.
            expect(cardFor(cards, ProgressMetric.Weight).current).toBeNull();
            expect(cardFor(cards, ProgressMetric.Weight).points).toHaveLength(0);
        });

        it('draws one bar per day in the window, gaps included', async () => {
            const water = dailyCardFor(await progress.overview(user.id, 7), ProgressMetric.Water);

            expect(water.points).toHaveLength(7);
            expect(water.points.every(point => point.value === 0)).toBe(true);
            // Oldest first, so a chart reads left to right.
            expect(water.points[0]?.date).toBe(daysAgo(6));
            expect(water.points.at(-1)?.date).toBe(today());
        });

        it('reads the daily metrics out of the nutrition log rather than storing them twice', async () => {
            await nutritionService.upsertGoal(user.id, GOAL);
            await nutritionService.logWater(user.id, today(), { amountMl: 500 });
            await nutritionService.setSteps(user.id, today(), { steps: 9000 });
            await nutritionService.logMeal(user.id, today(), {
                slot: MealSlot.Breakfast,
                dishName: 'Oats',
                portions: 1,
                eatenFraction: 1,
                perPortion: { calories: 400, proteinG: 20, fatsG: 10, carbsG: 60, weightG: 300 },
            });

            const cards = await progress.overview(user.id, 7);

            expect(cardFor(cards, ProgressMetric.Water).current).toBe(500);
            expect(cardFor(cards, ProgressMetric.Steps).current).toBe(9000);
            expect(cardFor(cards, ProgressMetric.Calories).current).toBe(400);
        });

        it('carries the goal from the nutrition target onto every daily card', async () => {
            await nutritionService.upsertGoal(user.id, GOAL);
            const cards = await progress.overview(user.id, 3);

            expect(cardFor(cards, ProgressMetric.Calories).goal).toBe(GOAL.dailyCalories);
            expect(cardFor(cards, ProgressMetric.Water).goal).toBe(GOAL.dailyWaterMl);
            expect(cardFor(cards, ProgressMetric.Steps).goal).toBe(GOAL.dailyStepsTarget);
        });

        it('leaves the target null while no goal exists, rather than inventing one', async () => {
            const water = dailyCardFor(await progress.overview(user.id, 3), ProgressMetric.Water);

            expect(water.goal).toBeNull();
            expect(water.points.every(point => point.outcome === null)).toBe(true);
        });

        it('shows the latest reading even when it predates the window', async () => {
            await progress.record(user.id, BodyMetric.Weight, { value: 82, measuredOn: daysAgo(60) });

            const weight = oneOffCardFor(await progress.overview(user.id, 7), ProgressMetric.Weight);

            // A weight from two months ago is still this person's weight.
            expect(weight.current).toBe(82);
            expect(weight.points).toHaveLength(0);
        });

        it('publishes the waist limit for the recorded gender and for nothing else', async () => {
            await onboarding.saveStep(await profileOf(), { gender: Gender.Female });

            const cards = await progress.overview(user.id, 7);

            expect(oneOffCardFor(cards, ProgressMetric.Waist).recommendedMax).toBe(80);
            expect(oneOffCardFor(cards, ProgressMetric.Weight).recommendedMax).toBeNull();
        });
    });

    describe('recording', () => {
        it('keeps a reading and returns it on the card', async () => {
            await progress.record(user.id, BodyMetric.Weight, { value: 79.4 });

            const weight = oneOffCardFor(await progress.overview(user.id, 7), ProgressMetric.Weight);
            expect(weight.current).toBe(79.4);
            expect(weight.points).toHaveLength(1);
        });

        it('rejects a value the sheet could never produce', async () => {
            await expect(progress.record(user.id, BodyMetric.Weight, { value: 900 })).rejects.toBeInstanceOf(
                BadRequestException,
            );
        });

        /**
         * The recommendation is computed from the profile, so a weight recorded
         * here has to reach it — otherwise the app offers a «new norm» derived
         * from a weight the user replaced weeks ago (metric-logging FR-006).
         */
        it('moves the profile weight, so the recommendation follows', async () => {
            await onboarding.saveStep(await profileOf(), {
                gender: Gender.Male,
                birthDate: '1995-06-15',
                weightKg: 80,
                heightCm: 180,
                activityLevel: 1,
                goal: UserGoal.Maintain,
            });
            const before = onboarding.recommendations(await profileOf());

            await progress.record(user.id, BodyMetric.Weight, { value: 90 });

            expect((await profileOf()).weightKg).toBe(90);
            expect(onboarding.recommendations(await profileOf())?.norms.calories).toBeGreaterThan(
                before?.norms.calories as number,
            );
        });

        it('moves the profile height too, for the same reason', async () => {
            await progress.record(user.id, BodyMetric.Height, { value: 176 });
            expect((await profileOf()).heightCm).toBe(176);
        });

        it('leaves the profile alone for a waist reading', async () => {
            await onboarding.saveStep(await profileOf(), { weightKg: 80 });
            await progress.record(user.id, BodyMetric.Waist, { value: 88 });

            expect((await profileOf()).weightKg).toBe(80);
        });

        /**
         * Wrong even without concurrency: the profile used to take whatever
         * was written last, so yesterday's weight entered today replaced
         * today's.
         */
        it('keeps the profile on the latest reading by date when an older one is entered after it', async () => {
            await progress.record(user.id, BodyMetric.Weight, { value: 84, measuredOn: today() });
            await progress.record(user.id, BodyMetric.Weight, { value: 80, measuredOn: daysAgo(5) });

            expect((await profileOf()).weightKg).toBe(84);

            const weight = oneOffCardFor(await progress.overview(user.id, 30), ProgressMetric.Weight);
            expect(weight.current).toBe(84);
        });

        it('takes the later-entered of two readings on the same day, as the card does', async () => {
            await progress.record(user.id, BodyMetric.Weight, { value: 81, measuredOn: today() });
            await progress.record(user.id, BodyMetric.Weight, { value: 82, measuredOn: today() });

            const weight = oneOffCardFor(await progress.overview(user.id, 30), ProgressMetric.Weight);

            expect(weight.current).toBe(82);
            expect((await profileOf()).weightKg).toBe(weight.current);
        });

        it('ends on the latest reading by date when readings are recorded in parallel', async () => {
            const readings = [
                { value: 80, measuredOn: daysAgo(9) },
                { value: 86, measuredOn: daysAgo(1) },
                { value: 81, measuredOn: daysAgo(7) },
                { value: 83, measuredOn: daysAgo(4) },
                { value: 79, measuredOn: daysAgo(12) },
                { value: 84, measuredOn: daysAgo(2) },
            ];

            await Promise.all(readings.map(reading => progress.record(user.id, BodyMetric.Weight, reading)));

            expect((await profileOf()).weightKg).toBe(86);
            expect(oneOffCardFor(await progress.overview(user.id, 30), ProgressMetric.Weight).current).toBe(86);
        });

        it('agrees with the card when parallel readings share a day', async () => {
            await Promise.all(
                [81, 82, 83, 84, 85].map(value =>
                    progress.record(user.id, BodyMetric.Weight, { value, measuredOn: today() }),
                ),
            );

            // Which one is latest is decided by the shared order, not by which
            // request committed last — and the profile and the card agree on it.
            const weight = oneOffCardFor(await progress.overview(user.id, 30), ProgressMetric.Weight);
            expect((await profileOf()).weightKg).toBe(weight.current);
        });

        it('keeps height on the latest reading by date as well', async () => {
            await Promise.all([
                progress.record(user.id, BodyMetric.Height, { value: 178, measuredOn: daysAgo(3) }),
                progress.record(user.id, BodyMetric.Height, { value: 176, measuredOn: daysAgo(30) }),
                progress.record(user.id, BodyMetric.Height, { value: 177, measuredOn: daysAgo(10) }),
            ]);

            expect((await profileOf()).heightCm).toBe(178);
        });

        it('hands the profile back to the previous reading when the latest is deleted', async () => {
            await progress.record(user.id, BodyMetric.Weight, { value: 82, measuredOn: daysAgo(3) });
            const latest = await progress.record(user.id, BodyMetric.Weight, { value: 85, measuredOn: today() });
            expect((await profileOf()).weightKg).toBe(85);

            await progress.remove(user.id, latest.id);

            expect((await profileOf()).weightKg).toBe(82);
        });

        it('keeps the profile weight when the only reading is deleted', async () => {
            await onboarding.saveStep(await profileOf(), { weightKg: 80 });
            const only = await progress.record(user.id, BodyMetric.Weight, { value: 83 });

            await progress.remove(user.id, only.id);

            // Nothing better to fall back to: the questionnaire answer the
            // reading replaced is not stored anywhere else, and a null weight
            // would take the recommendation away.
            expect((await profileOf()).weightKg).toBe(83);
        });

        it('ends on the latest surviving reading when deletes and records race', async () => {
            const old = await progress.record(user.id, BodyMetric.Weight, { value: 80, measuredOn: daysAgo(10) });
            const newest = await progress.record(user.id, BodyMetric.Weight, { value: 84, measuredOn: daysAgo(1) });

            await Promise.all([
                progress.remove(user.id, newest.id),
                progress.record(user.id, BodyMetric.Weight, { value: 82, measuredOn: daysAgo(5) }),
                progress.remove(user.id, old.id),
            ]);

            expect((await profileOf()).weightKg).toBe(82);
        });

        it('removes a reading and refuses to remove one that is not yours', async () => {
            const mine = await progress.record(user.id, BodyMetric.Waist, { value: 88 });
            const stranger = await register(OTHER_EMAIL);

            await expect(progress.remove(stranger.id, mine.id)).rejects.toBeInstanceOf(NotFoundException);
            await progress.remove(user.id, mine.id);
            await expect(progress.remove(user.id, mine.id)).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('detail', () => {
        it('summarises a measured metric as min, average and max', async () => {
            await progress.record(user.id, BodyMetric.Weight, { value: 80, measuredOn: daysAgo(2) });
            await progress.record(user.id, BodyMetric.Weight, { value: 82, measuredOn: daysAgo(1) });
            await progress.record(user.id, BodyMetric.Weight, { value: 84, measuredOn: today() });

            const detail = await progress.detail(user.id, ProgressMetric.Weight, 30);

            expect(detail.summary).toEqual({ min: 80, avg: 82, max: 84 });
        });

        it('reports the distance left to the target weight', async () => {
            await onboarding.saveStep(await profileOf(), { targetWeightKg: 75 });
            await progress.record(user.id, BodyMetric.Weight, { value: 84 });

            const detail = await progress.detail(user.id, ProgressMetric.Weight, 30);

            expect(detail.card.goal).toBe(75);
            expect(detail.difference).toBe(9);
        });

        it('counts how the days landed against a daily target', async () => {
            await nutritionService.upsertGoal(user.id, GOAL);
            const target = GOAL.dailyWaterMl;

            await nutrition.createWaterLogEntry({ userId: user.id, logDate: today(), amountMl: target });
            await nutrition.createWaterLogEntry({ userId: user.id, logDate: daysAgo(1), amountMl: 500 });
            await nutrition.createWaterLogEntry({ userId: user.id, logDate: daysAgo(2), amountMl: target * 2 });

            const detail = await progress.detail(user.id, ProgressMetric.Water, 3);

            expect(detail.summary).toEqual({
                under: 1,
                onTarget: 1,
                over: 1,
                lowerBound: target * (1 - DAILY_TARGET_TOLERANCE),
                upperBound: target * (1 + DAILY_TARGET_TOLERANCE),
            });
        });

        it('treats a day inside the tolerance band as on target', async () => {
            await nutritionService.upsertGoal(user.id, GOAL);
            // 5% short of 2500 ml — «about right» to a person, and the band says so.
            await nutrition.createWaterLogEntry({ userId: user.id, logDate: today(), amountMl: 2375 });

            const detail = await progress.detail(user.id, ProgressMetric.Water, 1);
            const card = detail.card as DailyCard;

            expect(card.points[0]?.outcome).toBe(DailyOutcome.OnTarget);
        });

        it('summarises a macro the same way, from the same meal log', async () => {
            await nutritionService.upsertGoal(user.id, GOAL);
            await nutritionService.logMeal(user.id, today(), {
                slot: MealSlot.Lunch,
                dishName: 'Chicken and rice',
                portions: 1,
                eatenFraction: 1,
                perPortion: { calories: 600, proteinG: 50, fatsG: 15, carbsG: 70, weightG: 400 },
            });

            const detail = await progress.detail(user.id, ProgressMetric.Protein, 1);

            expect(detail.card.kind).toBe(MetricKind.Daily);
            expect(detail.card.current).toBe(50);
            expect(detail.card.goal).toBe(GOAL.dailyProteinG);
        });

        it('has no summary for a measured metric with nothing in the window', async () => {
            const detail = await progress.detail(user.id, ProgressMetric.Waist, 30);

            expect(detail.summary).toBeNull();
            expect(detail.difference).toBeNull();
        });
    });

    const profileOf = async (): Promise<ProfileEntity> => {
        const profile = await profiles.findByUserId(user.id);
        expect(profile).not.toBeNull();

        return profile as ProfileEntity;
    };
});
