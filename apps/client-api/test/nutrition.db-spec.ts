import { NotFoundException } from '@nestjs/common';

import { DAILY_STEPS_TARGET_DEFAULT } from '@dns/constants';
import { MealLogEntryEntity, UserEntity, UserRepository, schema } from '@dns/database';
import { ContentSource, MealSlot } from '@dns/shared-types';

import { AuthService } from '../src/modules/auth/auth.service';
import { MealPlanService } from '../src/modules/meal-plan/meal-plan.service';
import { DailyPlanItem, NutritionService } from '../src/modules/nutrition/nutrition.service';

import { truncateAuthTables } from './support/db';
import { AuthTestContext, createAuthTestContext } from './support/testing-module';

const EMAIL = 'eater@example.com';
const OTHER_EMAIL = 'other-eater@example.com';
const PASSWORD = 'passw0rd';
const DATE = new Date().toISOString().slice(0, 10);

const GOAL = {
    dailyCalories: 1850,
    dailyProteinG: 200,
    dailyFatsG: 60,
    dailyCarbsG: 180,
    dailyWaterMl: 2000,
    dailyFiberG: 30,
};

/** 337 kcal and 210 g in one portion — the mock the tracking screen uses. */
const PANCAKES = {
    slot: MealSlot.Lunch,
    dishName: 'Панкейки',
    perPortion: { calories: 337, proteinG: 12, fatsG: 9, carbsG: 40, weightG: 210 },
};

describe('Nutrition', () => {
    let ctx: AuthTestContext;
    let authService: AuthService;
    let nutrition: NutritionService;
    let mealPlan: MealPlanService;
    let users: UserRepository;
    let user: UserEntity;

    beforeAll(async () => {
        ctx = await createAuthTestContext();
        authService = ctx.moduleRef.get(AuthService);
        nutrition = ctx.moduleRef.get(NutritionService);
        mealPlan = ctx.moduleRef.get(MealPlanService);
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

    describe('goal', () => {
        it('has none until one is saved, rather than inventing numbers', async () => {
            const day = await nutrition.getDay(user.id, DATE);

            expect(day.goal).toBeNull();
            // The step target has no configuration screen, so it still needs a
            // value for the card to render.
            expect(day.stepsTarget).toBe(DAILY_STEPS_TARGET_DEFAULT);
        });

        it('saves the goal whole and replaces it on the next save', async () => {
            await nutrition.upsertGoal(user.id, GOAL);
            const updated = await nutrition.upsertGoal(user.id, { ...GOAL, dailyCalories: 2100 });

            expect(updated.dailyCalories).toBe(2100);
            expect(updated.dailyProteinG).toBe(GOAL.dailyProteinG);

            const day = await nutrition.getDay(user.id, DATE);
            expect(day.goal?.dailyCalories).toBe(2100);
        });

        /**
         * The progress cards each edit their own target, so a narrow patch has
         * to leave the other six alone — sending the whole goal from a card
         * would overwrite them with whatever that screen last read.
         */
        it('moves one target without disturbing the rest', async () => {
            await nutrition.upsertGoal(user.id, GOAL);
            const patched = await nutrition.patchGoal(user.id, { dailyWaterMl: 3000 });

            expect(patched.dailyWaterMl).toBe(3000);
            expect(patched.dailyCalories).toBe(GOAL.dailyCalories);
            expect(patched.dailyProteinG).toBe(GOAL.dailyProteinG);
        });

        it('refuses to patch a goal that has never been set', async () => {
            await expect(nutrition.patchGoal(user.id, { dailyWaterMl: 3000 })).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });

        it('falls back to the default step target while nothing sets it', async () => {
            const goal = await nutrition.upsertGoal(user.id, GOAL);
            expect(goal.dailyStepsTarget).toBe(DAILY_STEPS_TARGET_DEFAULT);

            const explicit = await nutrition.upsertGoal(user.id, { ...GOAL, dailyStepsTarget: 12_000 });
            expect(explicit.dailyStepsTarget).toBe(12_000);
        });
    });

    describe('meal logging', () => {
        it('credits only the share that was eaten', async () => {
            const entry = await nutrition.logMeal(user.id, DATE, { ...PANCAKES, portions: 2, eatenFraction: 0.5 });

            // Two portions, half eaten: one portion's worth reaches the stats.
            expect(entry.creditedCalories).toBe(337);
            expect(entry.creditedProteinG).toBe(12);
            expect(entry.creditedWeightG).toBe(210);

            // ...while the whole cooked dish stays visible (meal-logging FR-005).
            expect(entry.totalWeightG).toBe(420);
        });

        it('credits everything when nothing was left', async () => {
            const entry = await nutrition.logMeal(user.id, DATE, { ...PANCAKES, portions: 1, eatenFraction: 1 });

            expect(entry.creditedCalories).toBe(337);
            expect(entry.creditedWeightG).toBe(entry.totalWeightG);
        });

        it('shows up in the day totals immediately', async () => {
            await nutrition.logMeal(user.id, DATE, { ...PANCAKES, portions: 1, eatenFraction: 1 });
            await nutrition.logMeal(user.id, DATE, {
                ...PANCAKES,
                slot: MealSlot.Dinner,
                portions: 1,
                eatenFraction: 0.5,
            });

            const day = await nutrition.getDay(user.id, DATE);

            expect(day.meals).toHaveLength(2);
            expect(day.totals.calories).toBe(337 + 169);
        });

        it('logs the same dish twice rather than replacing the first entry', async () => {
            await nutrition.logMeal(user.id, DATE, { ...PANCAKES, portions: 1, eatenFraction: 1 });
            await nutrition.logMeal(user.id, DATE, { ...PANCAKES, portions: 1, eatenFraction: 1 });

            const day = await nutrition.getDay(user.id, DATE);
            expect(day.meals).toHaveLength(2);
            expect(day.totals.calories).toBe(674);
        });

        it('keeps the snapshot, so a later day still reads what was eaten', async () => {
            const entry = await nutrition.logMeal(user.id, DATE, { ...PANCAKES, portions: 1, eatenFraction: 1 });

            // No recipe reference at all — the entry is complete without one,
            // which is what lets this ship before the recipe domain exists.
            expect(entry.recipeId).toBeNull();
            expect(entry.dishName).toBe('Панкейки');
        });

        it('removes an entry and drops the totals with it', async () => {
            const entry = await nutrition.logMeal(user.id, DATE, { ...PANCAKES, portions: 1, eatenFraction: 1 });
            await nutrition.deleteMeal(user.id, entry.id);

            const day = await nutrition.getDay(user.id, DATE);
            expect(day.meals).toHaveLength(0);
            expect(day.totals.calories).toBe(0);
        });

        it('explains a delete of something already gone', async () => {
            const entry = await nutrition.logMeal(user.id, DATE, { ...PANCAKES, portions: 1, eatenFraction: 1 });
            await nutrition.deleteMeal(user.id, entry.id);

            await expect(nutrition.deleteMeal(user.id, entry.id)).rejects.toBeInstanceOf(NotFoundException);
        });

        it('will not let one account touch another account entry', async () => {
            const other = await register(OTHER_EMAIL);
            const entry = await nutrition.logMeal(user.id, DATE, { ...PANCAKES, portions: 1, eatenFraction: 1 });

            await expect(nutrition.deleteMeal(other.id, entry.id)).rejects.toBeInstanceOf(NotFoundException);

            // ...and the entry is still there.
            const day = await nutrition.getDay(user.id, DATE);
            expect(day.meals).toHaveLength(1);

            // ...and never appeared on the other account's day at all.
            const otherDay = await nutrition.getDay(other.id, DATE);
            expect(otherDay.meals).toHaveLength(0);
            expect(otherDay.totals.calories).toBe(0);
        });
    });

    describe('water and steps', () => {
        it('adds up glasses and lets one be taken back', async () => {
            await nutrition.logWater(user.id, DATE, { amountMl: 250 });
            const second = await nutrition.logWater(user.id, DATE, { amountMl: 250 });

            expect((await nutrition.getDay(user.id, DATE)).totals.waterMl).toBe(500);

            await nutrition.deleteWater(user.id, second.id);
            expect((await nutrition.getDay(user.id, DATE)).totals.waterMl).toBe(250);
        });

        it('replaces the step count instead of accumulating it', async () => {
            await nutrition.setSteps(user.id, DATE, { steps: 5000 });
            await nutrition.setSteps(user.id, DATE, { steps: 13_000 });

            // A second sync of the same day must not double-count.
            expect((await nutrition.getDay(user.id, DATE)).steps).toBe(13_000);
        });

        it('keeps days apart', async () => {
            const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

            await nutrition.logWater(user.id, DATE, { amountMl: 250 });
            await nutrition.setSteps(user.id, yesterday, { steps: 9000 });

            expect((await nutrition.getDay(user.id, yesterday)).totals.waterMl).toBe(0);
            expect((await nutrition.getDay(user.id, yesterday)).steps).toBe(9000);
            expect((await nutrition.getDay(user.id, DATE)).steps).toBe(0);
        });
    });

    describe('planned dishes', () => {
        /** A catalogue dish, written straight to the schema — the same helper the plan suite uses. */
        const seedRecipe = async (title: string): Promise<string> => {
            const [recipe] = await ctx.db
                .insert(schema.recipes)
                .values({
                    source: ContentSource.Global,
                    servings: 1,
                    totalWeightG: '300.00',
                    calories: 450,
                    proteinG: '20.00',
                    fatsG: '10.00',
                    carbsG: '40.00',
                    cookTimeMinutes: 20,
                })
                .returning();

            const recipeId = (recipe as { id: string }).id;
            await ctx.db.insert(schema.recipeTranslations).values({ recipeId, language: 'uk', title });

            return recipeId;
        };

        const logEaten = (recipeId: string | undefined, slot: MealSlot): Promise<MealLogEntryEntity> =>
            nutrition.logMeal(user.id, DATE, {
                slot,
                recipeId,
                dishName: 'Сирники',
                portions: 1,
                eatenFraction: 1,
                perPortion: { calories: 450, proteinG: 20, fatsG: 10, carbsG: 40, weightG: 300 },
            });

        const itemsIn = async (slot: MealSlot): Promise<DailyPlanItem[]> => {
            const day = await nutrition.getDay(user.id, DATE);
            return day.plan.find(candidate => candidate.slot === slot)?.items ?? [];
        };

        it('lists all four slots, empty ones included', async () => {
            const day = await nutrition.getDay(user.id, DATE);

            expect(day.plan.map(slot => slot.slot)).toEqual([
                MealSlot.Breakfast,
                MealSlot.Lunch,
                MealSlot.Dinner,
                MealSlot.Snack,
            ]);
            expect(day.plan.every(slot => slot.items.length === 0)).toBe(true);
        });

        it('carries the planned dish and marks it eaten by the entry that logged it', async () => {
            const recipeId = await seedRecipe('Сирники');
            await mealPlan.addItem(user.id, DATE, { slot: MealSlot.Breakfast, recipeId });

            const [before] = await itemsIn(MealSlot.Breakfast);
            expect(before?.recipe.title).toBe('Сирники');
            expect(before?.eatenEntryId).toBeNull();

            const entry = await logEaten(recipeId, MealSlot.Breakfast);
            expect((await itemsIn(MealSlot.Breakfast))[0]?.eatenEntryId).toBe(entry.id);

            // Unmarking is deleting the entry — the mark follows the log, and the ring with it.
            await nutrition.deleteMeal(user.id, entry.id);
            expect((await itemsIn(MealSlot.Breakfast))[0]?.eatenEntryId).toBeNull();
            expect((await nutrition.getDay(user.id, DATE)).totals.calories).toBe(0);
        });

        it('needs one entry per planned serving', async () => {
            const recipeId = await seedRecipe('Сирники');
            await mealPlan.addItem(user.id, DATE, { slot: MealSlot.Lunch, recipeId });
            await mealPlan.addItem(user.id, DATE, { slot: MealSlot.Lunch, recipeId });

            const entry = await logEaten(recipeId, MealSlot.Lunch);

            const items = await itemsIn(MealSlot.Lunch);
            expect(items.map(item => item.eatenEntryId)).toEqual([entry.id, null]);
        });

        it('is not settled by the same dish in another slot, or by an entry with no recipe', async () => {
            const recipeId = await seedRecipe('Сирники');
            await mealPlan.addItem(user.id, DATE, { slot: MealSlot.Lunch, recipeId });

            await logEaten(recipeId, MealSlot.Dinner);
            await logEaten(undefined, MealSlot.Lunch);

            expect((await itemsIn(MealSlot.Lunch))[0]?.eatenEntryId).toBeNull();
            // Both still count: eating off-plan is eating.
            const day = await nutrition.getDay(user.id, DATE);
            expect(day.meals).toHaveLength(2);
            expect(day.totals.calories).toBe(900);
        });

        it('shows only this day’s plan', async () => {
            const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
            const recipeId = await seedRecipe('Сирники');
            await mealPlan.addItem(user.id, tomorrow, { slot: MealSlot.Dinner, recipeId });

            expect(await itemsIn(MealSlot.Dinner)).toHaveLength(0);
        });
    });
});
