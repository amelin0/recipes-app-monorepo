import { BadRequestException, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DAILY_TARGET_TOLERANCE } from '@dns/constants';
import { NutritionRepository, UserEntity, UserRepository, schema } from '@dns/database';
import { ContentSource, DailyOutcome, MealSlot } from '@dns/shared-types';

import { AuthService } from '../src/modules/auth/auth.service';
import { RecipeService } from '../src/modules/catalog/recipe.service';
import { MealPlanService, PlanDay } from '../src/modules/meal-plan/meal-plan.service';

import { truncateAuthTables } from './support/db';
import { AuthTestContext, createAuthTestContext } from './support/testing-module';

const EMAIL = 'planner@example.com';
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

const DAY = '2026-05-18';
const NEXT_DAY = '2026-05-19';
const THIRD_DAY = '2026-05-20';

/** Fixed dates would fall out of the plan window as the calendar moves, so they are relative. */
const daysFromNow = (days: number): string => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

describe('Meal plan', () => {
    let ctx: AuthTestContext;
    let authService: AuthService;
    let plan: MealPlanService;
    let recipes: RecipeService;
    let nutrition: NutritionRepository;
    let users: UserRepository;
    let user: UserEntity;

    beforeAll(async () => {
        ctx = await createAuthTestContext();
        authService = ctx.moduleRef.get(AuthService);
        plan = ctx.moduleRef.get(MealPlanService);
        recipes = ctx.moduleRef.get(RecipeService);
        nutrition = ctx.moduleRef.get(NutritionRepository);
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

    /** A catalogue dish with the given per-serving calories, written straight to the schema. */
    const seedRecipe = async (title: string, caloriesPerServing: number): Promise<string> => {
        const [recipe] = await ctx.db
            .insert(schema.recipes)
            .values({
                source: ContentSource.Global,
                servings: 1,
                totalWeightG: '300.00',
                calories: caloriesPerServing,
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

    const slotOf = (day: PlanDay, slot: MealSlot): PlanDay['slots'][number] => {
        const found = day.slots.find(candidate => candidate.slot === slot);
        expect(found).toBeDefined();

        return found as PlanDay['slots'][number];
    };

    beforeEach(async () => {
        await truncateAuthTables(ctx.db);
        user = await register(EMAIL);
    });

    describe('reading a window', () => {
        it('returns every day asked for, with all four slots, even when nothing is planned', async () => {
            const days = await plan.range(user.id, { from: DAY, to: THIRD_DAY });

            expect(days.map(day => day.date)).toEqual([DAY, NEXT_DAY, THIRD_DAY]);
            expect(days[0]?.slots.map(slot => slot.slot)).toEqual([
                MealSlot.Breakfast,
                MealSlot.Lunch,
                MealSlot.Dinner,
                MealSlot.Snack,
            ]);
            expect(days[0]?.planned.calories).toBe(0);
            // Nothing planned is not a verdict about the day.
            expect(days[0]?.outcome).toBeNull();
        });

        it('has no goal to compare against until one is set', async () => {
            const recipeId = await seedRecipe('Салат', 400);
            await plan.addItem(user.id, DAY, { slot: MealSlot.Lunch, recipeId });

            const [day] = await plan.range(user.id, { from: DAY, to: DAY });

            expect(day?.goal).toBeNull();
            expect(day?.outcome).toBeNull();
        });
    });

    describe('planning a day', () => {
        beforeEach(async () => {
            await nutrition.upsertGoal({ userId: user.id, ...GOAL });
        });

        it('adds a dish to its slot and answers with the recalculated day', async () => {
            const recipeId = await seedRecipe('Обід', 700);

            const day = await plan.addItem(user.id, DAY, { slot: MealSlot.Lunch, recipeId });

            expect(slotOf(day, MealSlot.Lunch).items).toHaveLength(1);
            expect(slotOf(day, MealSlot.Lunch).items[0]?.recipe.title).toBe('Обід');
            expect(slotOf(day, MealSlot.Breakfast).items).toHaveLength(0);
            expect(day.planned.calories).toBe(700);
            expect(day.goal?.calories).toBe(GOAL.dailyCalories);
        });

        it('sums the day across its slots', async () => {
            const breakfast = await seedRecipe('Сніданок', 500);
            const lunch = await seedRecipe('Обід', 700);

            await plan.addItem(user.id, DAY, { slot: MealSlot.Breakfast, recipeId: breakfast });
            const day = await plan.addItem(user.id, DAY, { slot: MealSlot.Lunch, recipeId: lunch });

            expect(day.planned.calories).toBe(1200);
            expect(day.planned.proteinG).toBe(40);
        });

        it('calls a plan inside the tolerance «on target», and one outside it under or over', async () => {
            // The band is ±10 % of 2000, so 1800…2200.
            const onTarget = await seedRecipe('Рівно', GOAL.dailyCalories);
            const day = await plan.addItem(user.id, DAY, { slot: MealSlot.Lunch, recipeId: onTarget });
            expect(day.outcome).toBe(DailyOutcome.OnTarget);

            const thin = await plan.range(user.id, { from: NEXT_DAY, to: NEXT_DAY });
            expect(thin[0]?.outcome).toBeNull();

            const small = await seedRecipe(
                'Замало',
                Math.round(GOAL.dailyCalories * (1 - DAILY_TARGET_TOLERANCE) - 50),
            );
            const under = await plan.addItem(user.id, NEXT_DAY, { slot: MealSlot.Lunch, recipeId: small });
            expect(under.outcome).toBe(DailyOutcome.Under);

            const big = await seedRecipe(
                'Забагато',
                Math.round(GOAL.dailyCalories * (1 + DAILY_TARGET_TOLERANCE) + 50),
            );
            const over = await plan.addItem(user.id, THIRD_DAY, { slot: MealSlot.Lunch, recipeId: big });
            expect(over.outcome).toBe(DailyOutcome.Over);
        });

        it('removes one dish and recalculates what is left', async () => {
            const first = await seedRecipe('Перша', 500);
            const second = await seedRecipe('Друга', 300);

            const withBoth = await plan.addItem(user.id, DAY, { slot: MealSlot.Dinner, recipeId: first });
            await plan.addItem(user.id, DAY, { slot: MealSlot.Dinner, recipeId: second });

            const itemId = slotOf(withBoth, MealSlot.Dinner).items[0]?.id as string;
            const day = await plan.removeItem(user.id, DAY, itemId);

            expect(slotOf(day, MealSlot.Dinner).items.map(item => item.recipe.title)).toEqual(['Друга']);
            expect(day.planned.calories).toBe(300);
        });

        it('clears a whole day', async () => {
            const recipeId = await seedRecipe('Щось', 400);
            await plan.addItem(user.id, DAY, { slot: MealSlot.Breakfast, recipeId });
            await plan.addItem(user.id, DAY, { slot: MealSlot.Dinner, recipeId });

            const day = await plan.clearDay(user.id, DAY);

            expect(day.slots.every(slot => slot.items.length === 0)).toBe(true);
            expect(day.planned.calories).toBe(0);
        });

        it('refuses to plan a dish this account cannot see', async () => {
            const stranger = await register(OTHER_EMAIL);
            const theirs = await recipes.create(stranger.id, {
                title: 'Чужа страва',
                ingredients: [{ productId: await productId('Морква'), amountG: 100 }],
            });

            await expect(
                plan.addItem(user.id, DAY, { slot: MealSlot.Lunch, recipeId: theirs.recipe.id }),
            ).rejects.toBeInstanceOf(NotFoundException);
        });

        it('refuses to remove somebody else’s planned dish', async () => {
            const recipeId = await seedRecipe('Спільна', 400);
            const stranger = await register(OTHER_EMAIL);
            const theirDay = await plan.addItem(stranger.id, DAY, { slot: MealSlot.Lunch, recipeId });
            const theirItem = slotOf(theirDay, MealSlot.Lunch).items[0]?.id as string;

            await expect(plan.removeItem(user.id, DAY, theirItem)).rejects.toBeInstanceOf(NotFoundException);
        });

        it('drops a planned dish when the dish itself is deleted', async () => {
            const own = await recipes.create(user.id, {
                title: 'Власна страва',
                ingredients: [{ productId: await productId('Морква'), amountG: 200 }],
            });

            await plan.addItem(user.id, DAY, { slot: MealSlot.Snack, recipeId: own.recipe.id });
            await recipes.remove(user.id, own.recipe.id);

            const [day] = await plan.range(user.id, { from: DAY, to: DAY });

            // A plan item is a reference, not a receipt — there is nothing left
            // to cook, so nothing is left in the slot.
            expect(slotOf(day as PlanDay, MealSlot.Snack).items).toHaveLength(0);
            expect(day?.planned.calories).toBe(0);
        });
    });

    describe('copying a day', () => {
        it('makes each target an exact copy, replacing what was there', async () => {
            const source = await seedRecipe('Джерело', 600);
            const alreadyThere = await seedRecipe('Було', 900);

            await plan.addItem(user.id, DAY, { slot: MealSlot.Breakfast, recipeId: source });
            await plan.addItem(user.id, NEXT_DAY, { slot: MealSlot.Dinner, recipeId: alreadyThere });

            const days = await plan.copyDay(user.id, DAY, { targetDates: [NEXT_DAY, THIRD_DAY] });

            expect(days.map(day => day.date)).toEqual([NEXT_DAY, THIRD_DAY]);
            for (const day of days) {
                expect(slotOf(day, MealSlot.Breakfast).items.map(item => item.recipe.title)).toEqual(['Джерело']);
                // Replaced, not merged: the dinner that was there is gone.
                expect(slotOf(day, MealSlot.Dinner).items).toHaveLength(0);
                expect(day.planned.calories).toBe(600);
            }
        });

        it('leaves the source untouched', async () => {
            const recipeId = await seedRecipe('Джерело', 600);
            await plan.addItem(user.id, DAY, { slot: MealSlot.Breakfast, recipeId });

            await plan.copyDay(user.id, DAY, { targetDates: [NEXT_DAY] });

            const [source] = await plan.range(user.id, { from: DAY, to: DAY });
            expect(slotOf(source as PlanDay, MealSlot.Breakfast).items).toHaveLength(1);
        });

        it('refuses to copy an empty day, which would clear every target', async () => {
            const recipeId = await seedRecipe('Було', 900);
            await plan.addItem(user.id, NEXT_DAY, { slot: MealSlot.Dinner, recipeId });

            await expect(plan.copyDay(user.id, DAY, { targetDates: [NEXT_DAY] })).rejects.toBeInstanceOf(
                BadRequestException,
            );

            const [target] = await plan.range(user.id, { from: NEXT_DAY, to: NEXT_DAY });
            expect(slotOf(target as PlanDay, MealSlot.Dinner).items).toHaveLength(1);
        });

        it('refuses to copy a day onto itself', async () => {
            const recipeId = await seedRecipe('Джерело', 600);
            await plan.addItem(user.id, DAY, { slot: MealSlot.Breakfast, recipeId });

            await expect(plan.copyDay(user.id, DAY, { targetDates: [DAY] })).rejects.toBeInstanceOf(
                BadRequestException,
            );
        });

        it('copying twice does not double the target', async () => {
            const recipeId = await seedRecipe('Джерело', 600);
            await plan.addItem(user.id, DAY, { slot: MealSlot.Breakfast, recipeId });

            await plan.copyDay(user.id, DAY, { targetDates: [NEXT_DAY] });
            const [day] = await plan.copyDay(user.id, DAY, { targetDates: [NEXT_DAY] });

            expect(slotOf(day as PlanDay, MealSlot.Breakfast).items).toHaveLength(1);
            expect(day?.planned.calories).toBe(600);
        });
    });

    describe('under concurrent requests', () => {
        const PARALLEL = 6;

        /** What a day holds, as the screen renders it: slot by slot, in order. */
        const contentsOf = (day: PlanDay): Array<[MealSlot, string[]]> =>
            day.slots.map(slot => [slot.slot, slot.items.map(item => item.recipe.title)]);

        const dayOf = async (date: string): Promise<PlanDay> => {
            const [day] = await plan.range(user.id, { from: date, to: date });
            expect(day).toBeDefined();

            return day as PlanDay;
        };

        const planRows = async (date: string): Promise<Array<{ slot: MealSlot; sortOrder: number }>> =>
            ctx.db
                .select({ slot: schema.mealPlanItems.slot, sortOrder: schema.mealPlanItems.sortOrder })
                .from(schema.mealPlanItems)
                .where(and(eq(schema.mealPlanItems.userId, user.id), eq(schema.mealPlanItems.planDate, date)));

        /**
         * A double submit used to double the target: on READ COMMITTED the
         * second copy's DELETE could not see the first copy's fresh rows, so it
         * removed nothing and inserted the source a second time.
         */
        it('leaves every target an exact copy of the source after parallel copies', async () => {
            const breakfast = await seedRecipe('Сніданок', 500);
            const lunch = await seedRecipe('Обід', 700);
            const snack = await seedRecipe('Перекус', 150);

            await plan.addItem(user.id, DAY, { slot: MealSlot.Breakfast, recipeId: breakfast });
            await plan.addItem(user.id, DAY, { slot: MealSlot.Lunch, recipeId: lunch });
            await plan.addItem(user.id, DAY, { slot: MealSlot.Lunch, recipeId: snack });

            const source = await dayOf(DAY);

            await Promise.all(
                Array.from({ length: PARALLEL }, () =>
                    plan.copyDay(user.id, DAY, { targetDates: [NEXT_DAY, THIRD_DAY] }),
                ),
            );

            for (const date of [NEXT_DAY, THIRD_DAY]) {
                const target = await dayOf(date);

                expect(contentsOf(target)).toEqual(contentsOf(source));
                expect(target.planned).toEqual(source.planned);
                expect(await planRows(date)).toHaveLength(3);
            }
        });

        it('gives dishes added in parallel to one slot distinct positions', async () => {
            const recipeId = await seedRecipe('Щось', 300);

            await Promise.all(
                Array.from({ length: PARALLEL }, () => plan.addItem(user.id, DAY, { slot: MealSlot.Dinner, recipeId })),
            );

            const positions = (await planRows(DAY)).map(row => row.sortOrder).sort((a, b) => a - b);

            // Without the lock, inserts in flight read the same max() and tie.
            expect(positions).toEqual(Array.from({ length: PARALLEL }, (_, index) => index));
        });

        it('never clears a target when the source empties while a copy is in flight', async () => {
            const source = await seedRecipe('Джерело', 600);
            const alreadyThere = await seedRecipe('Було', 900);

            await plan.addItem(user.id, DAY, { slot: MealSlot.Breakfast, recipeId: source });
            await plan.addItem(user.id, NEXT_DAY, { slot: MealSlot.Dinner, recipeId: alreadyThere });

            const [copy] = await Promise.allSettled([
                plan.copyDay(user.id, DAY, { targetDates: [NEXT_DAY] }),
                plan.clearDay(user.id, DAY),
            ]);

            const target = await dayOf(NEXT_DAY);

            // Either the copy saw the dish and made the target its copy, or it
            // saw an empty day and refused — the target is never left empty.
            if (copy.status === 'fulfilled') {
                expect(slotOf(target, MealSlot.Breakfast).items.map(item => item.recipe.title)).toEqual(['Джерело']);
            } else {
                expect(copy.reason).toBeInstanceOf(BadRequestException);
                expect(slotOf(target, MealSlot.Dinner).items.map(item => item.recipe.title)).toEqual(['Було']);
            }
            expect(target.planned.calories).toBeGreaterThan(0);
        });

        it('keeps a copy exact when dishes are added to the source alongside it', async () => {
            const first = await seedRecipe('Перша', 400);
            const second = await seedRecipe('Друга', 250);
            await plan.addItem(user.id, DAY, { slot: MealSlot.Lunch, recipeId: first });

            await Promise.all([
                plan.copyDay(user.id, DAY, { targetDates: [NEXT_DAY] }),
                plan.addItem(user.id, DAY, { slot: MealSlot.Lunch, recipeId: second }),
                plan.copyDay(user.id, DAY, { targetDates: [NEXT_DAY] }),
            ]);

            // Whichever copy ran last, the target equals the source as that
            // copy read it — one or two dishes, in the source's order, never
            // a mix of two copies' rows.
            const target = contentsOf(await dayOf(NEXT_DAY));
            const lunch = target.find(([slot]) => slot === MealSlot.Lunch)?.[1];

            expect([['Перша'], ['Перша', 'Друга']]).toContainEqual(lunch);
        });
    });

    describe('the plan window', () => {
        it('reaches a year ahead, which is what planning means', async () => {
            const recipeId = await seedRecipe('Далеко', 500);
            const far = daysFromNow(300);

            const day = await plan.addItem(user.id, far, { slot: MealSlot.Lunch, recipeId });

            expect(day.date).toBe(far);
        });
    });

    const productId = async (name: string): Promise<string> => {
        const row = await ctx.db.query.productTranslations.findFirst({
            where: eq(schema.productTranslations.name, name),
        });
        expect(row).toBeDefined();

        return (row as { productId: string }).productId;
    };
});
