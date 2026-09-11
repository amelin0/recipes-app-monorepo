import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';

import { DEFAULT_LANGUAGE } from '@dns/constants';
import { AdminRecipeRepository, ProductRepository, ReferenceRepository, schema } from '@dns/database';
import { Language } from '@dns/shared-types';
import { AdminCreateRecipeInput } from '@dns/validation';

import { RecipeImportService } from '../src/modules/recipe/import/import.service';
import { AdminRecipeService } from '../src/modules/recipe/recipe.service';

import { truncateAdminRecipeTables } from './support/db';
import { AdminTestContext, createAdminTestContext } from './support/testing-module';

const HEADER =
    'import_key,title_uk,title_en,category,cuisine,diets,servings,cook_time_minutes,ingredients,steps_uk,step_durations';

describe('admin recipe catalogue', () => {
    let context: AdminTestContext;
    let recipeService: AdminRecipeService;
    let importService: RecipeImportService;
    let recipeRepository: AdminRecipeRepository;
    let productRepository: ProductRepository;
    let referenceRepository: ReferenceRepository;

    /** Two seeded quick-picks, looked up once — every dish below is built from them. */
    let tomatoes: { id: string; kcal: number };
    let carrot: { id: string; kcal: number };
    let saladsCategoryId: string;
    let veganDietId: string;

    beforeAll(async () => {
        context = await createAdminTestContext();
        recipeService = context.moduleRef.get(AdminRecipeService);
        importService = context.moduleRef.get(RecipeImportService);
        recipeRepository = context.moduleRef.get(AdminRecipeRepository);
        productRepository = context.moduleRef.get(ProductRepository);
        referenceRepository = context.moduleRef.get(ReferenceRepository);

        const found = await productRepository.searchGlobal({ language: Language.English, page: 1, limit: 500 });
        const pick = (name: string): { id: string; kcal: number } => {
            const product = found.items.find(item => item.name === name);
            if (!product) throw new Error(`Seeded product "${name}" is missing — run the migrations`);
            return { id: product.id, kcal: product.caloriesPer100g };
        };
        tomatoes = pick('Tomatoes');
        carrot = pick('Carrot');

        const categories = await referenceRepository.categories(DEFAULT_LANGUAGE);
        const diets = await referenceRepository.diets(DEFAULT_LANGUAGE);
        saladsCategoryId = categories.find(item => item.slug === 'salads')!.id;
        veganDietId = diets.find(item => item.slug === 'vegan')!.id;
    });

    afterAll(async () => {
        await truncateAdminRecipeTables(context.db);
        await context.close();
    });

    beforeEach(async () => {
        await truncateAdminRecipeTables(context.db);
    });

    const payload = (overrides: Partial<AdminCreateRecipeInput> = {}): AdminCreateRecipeInput =>
        ({
            importKey: null,
            categoryId: saladsCategoryId,
            cuisineId: null,
            dietIds: [],
            photoUrl: null,
            servings: 2,
            cookTimeMinutes: 15,
            translations: [{ language: Language.Ukrainian, title: 'Тестова страва' }],
            ingredients: [{ productId: tomatoes.id, amountG: 200 }],
            steps: [],
            ...overrides,
        }) as AdminCreateRecipeInput;

    describe('create', () => {
        it('stores the dish and derives its macros from the composition', async () => {
            const id = await recipeService.create(
                payload({
                    ingredients: [
                        { productId: tomatoes.id, amountG: 200 },
                        { productId: carrot.id, amountG: 100 },
                    ],
                }),
            );

            const recipe = await recipeService.findById(id);

            // The invariant that matters: the number on the card equals the
            // list underneath it. Anything else and the two disagree on screen.
            const expected = Math.round((tomatoes.kcal * 200) / 100 + (carrot.kcal * 100) / 100);
            expect(recipe.calories).toBe(expected);
            expect(Number(recipe.totalWeightG)).toBe(300);
        });

        it('refuses an ingredient that is not in the catalogue', async () => {
            await expect(
                recipeService.create(
                    payload({ ingredients: [{ productId: '00000000-0000-4000-8000-000000000000', amountG: 100 }] }),
                ),
            ).rejects.toThrow(BadRequestException);
        });

        it('keeps steps, their translations and their ingredient chips', async () => {
            const id = await recipeService.create(
                payload({
                    ingredients: [
                        { productId: tomatoes.id, amountG: 200 },
                        { productId: carrot.id, amountG: 100 },
                    ],
                    steps: [
                        {
                            stepNumber: 1,
                            durationMinutes: 5,
                            translations: [{ language: Language.Ukrainian, title: 'Наріжте', description: 'Кубиком.' }],
                            ingredientIndexes: [1],
                        },
                    ],
                }),
            );

            const recipe = await recipeService.findById(id);

            expect(recipe.steps).toHaveLength(1);
            expect(recipe.steps[0]?.translations[0]?.description).toBe('Кубиком.');
            // The chip points at the recipe's own ingredient row, not at the
            // product — «the 100 g of carrot in this dish».
            const carrotLine = recipe.ingredients.find(line => line.productId === carrot.id);
            expect(recipe.steps[0]?.ingredientIds).toEqual([carrotLine?.id]);
        });

        it('refuses a second dish under an import key that is taken', async () => {
            await recipeService.create(payload({ importKey: 'greek-salad' }));

            await expect(recipeService.create(payload({ importKey: 'greek-salad' }))).rejects.toThrow(
                ConflictException,
            );
        });

        it('is a catalogue dish, not somebody own', async () => {
            const id = await recipeService.create(payload());

            const [row] = await context.db.select().from(schema.recipes).where(eq(schema.recipes.id, id));
            expect(row?.source).toBe('global');
            expect(row?.createdBy).toBeNull();
        });
    });

    describe('update', () => {
        it('replaces the composition wholesale rather than merging it', async () => {
            const id = await recipeService.create(
                payload({
                    ingredients: [
                        { productId: tomatoes.id, amountG: 200 },
                        { productId: carrot.id, amountG: 100 },
                    ],
                }),
            );

            await recipeService.update(id, payload({ ingredients: [{ productId: carrot.id, amountG: 50 }] }));

            const recipe = await recipeService.findById(id);
            expect(recipe.ingredients).toHaveLength(1);
            expect(recipe.ingredients[0]?.productId).toBe(carrot.id);
            expect(Number(recipe.totalWeightG)).toBe(50);
        });

        it('recomputes the macros from the new composition', async () => {
            const id = await recipeService.create(payload({ ingredients: [{ productId: tomatoes.id, amountG: 500 }] }));
            const before = await recipeService.findById(id);

            await recipeService.update(id, payload({ ingredients: [{ productId: tomatoes.id, amountG: 100 }] }));
            const after = await recipeService.findById(id);

            expect(after.calories).toBeLessThan(before.calories);
        });

        it('does not collide with its own import key', async () => {
            const id = await recipeService.create(payload({ importKey: 'greek-salad' }));

            await expect(
                recipeService.update(id, payload({ importKey: 'greek-salad', servings: 4 })),
            ).resolves.toBeUndefined();
        });

        it('404s on an id that is not there', async () => {
            await expect(recipeService.update('00000000-0000-4000-8000-000000000000', payload())).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('list', () => {
        it('finds by a fragment of the title, ignoring case', async () => {
            await recipeService.create(payload({ translations: [{ language: Language.Ukrainian, title: 'Борщ' }] }));
            await recipeService.create(payload({ translations: [{ language: Language.Ukrainian, title: 'Салат' }] }));

            const page = await recipeService.list({
                search: 'бор',
                language: DEFAULT_LANGUAGE,
                page: 1,
                limit: 20,
            } as never);

            expect(page.total).toBe(1);
            expect(page.items[0]?.title).toBe('Борщ');
        });

        it('narrows by diet', async () => {
            await recipeService.create(payload({ dietIds: [veganDietId] }));
            await recipeService.create(payload({ dietIds: [] }));

            const page = await recipeService.list({
                dietIds: [veganDietId],
                language: DEFAULT_LANGUAGE,
                page: 1,
                limit: 20,
            } as never);

            expect(page.total).toBe(1);
        });

        it('counts how many people hearted a dish', async () => {
            const id = await recipeService.create(payload());
            const userId = await createUser(context);
            await context.db.execute(sql`insert into recipe_favorites (user_id, recipe_id) values (${userId}, ${id})`);

            const page = await recipeService.list({ language: DEFAULT_LANGUAGE, page: 1, limit: 20 } as never);

            expect(page.items[0]?.favoritesCount).toBe(1);

            await context.db.execute(sql`delete from users where id = ${userId}`);
        });
    });

    describe('delete', () => {
        it('removes what it is given and says how many', async () => {
            const first = await recipeService.create(payload());
            const second = await recipeService.create(payload());

            await expect(recipeService.deleteMany([first, second])).resolves.toBe(2);
        });

        it('refuses a dish that is in somebody meal plan', async () => {
            const id = await recipeService.create(payload());
            const userId = await createUser(context);
            await context.db.execute(
                sql`insert into meal_plan_items (user_id, recipe_id, plan_date, slot)
                    values (${userId}, ${id}, current_date, 'lunch')`,
            );

            // Until the product decides what should happen to a planned dish,
            // refusing beats quietly emptying someone's week.
            await expect(recipeService.deleteMany([id])).rejects.toThrow(ConflictException);

            await context.db.execute(sql`delete from users where id = ${userId}`);
        });

        /**
         * The interleaving that used to lose a plan row, forced rather than
         * hoped for: a user's plan-add is caught mid-transaction — inserted,
         * not committed — when the delete starts. The old check ran on a
         * snapshot that could not see the uncommitted row, found nothing, and
         * the delete then waited for the insert, cascaded, and took the
         * freshly planned dish with it. Now the delete's lock waits for the
         * plan-add, and its check sees the committed row and refuses.
         */
        it('waits for a plan being added at that moment, then refuses', async () => {
            const id = await recipeService.create(payload());
            const userId = await createUser(context);

            let release!: () => void;
            const held = new Promise<void>(resolve => (release = resolve));
            let signalInserted!: () => void;
            const inserted = new Promise<void>(resolve => (signalInserted = resolve));

            const planAdd = context.db.transaction(async tx => {
                await tx.execute(
                    sql`insert into meal_plan_items (user_id, recipe_id, plan_date, slot)
                        values (${userId}, ${id}, current_date, 'lunch')`,
                );
                signalInserted();
                await held;
            });

            await inserted;

            const deletion = recipeService.deleteMany([id]);
            const settled = jest.fn();
            deletion.then(settled, settled);

            // Blocked on the plan-add's lock, not racing past it.
            await new Promise(resolve => setTimeout(resolve, 300));
            expect(settled).not.toHaveBeenCalled();

            release();
            await planAdd;

            await expect(deletion).rejects.toThrow(ConflictException);
            expect(await planRowsFor(context, userId)).toBe(1);

            await context.db.execute(sql`delete from users where id = ${userId}`);
        });

        /**
         * Both orders, many times: whichever wins, the outcome is one of the
         * two honest ones — the delete refused and the plan kept, or the dish
         * gone and the plan-add failed. Never both «succeeded» with the plan
         * row missing, which is what a silent cascade looks like.
         */
        it('never lets a plan-add succeed and then lose its row to a concurrent delete', async () => {
            const userId = await createUser(context);

            for (let round = 0; round < 10; round++) {
                const id = await recipeService.create(payload());
                const before = await planRowsFor(context, userId);

                const [deletion, planAdd] = await Promise.allSettled([
                    recipeService.deleteMany([id]),
                    context.db.execute(
                        sql`insert into meal_plan_items (user_id, recipe_id, plan_date, slot)
                            values (${userId}, ${id}, current_date, 'dinner')`,
                    ),
                ]);

                const planKept = (await planRowsFor(context, userId)) - before === 1;

                expect([deletion.status, planAdd.status].sort()).toEqual(['fulfilled', 'rejected']);
                expect(planKept).toBe(planAdd.status === 'fulfilled');
                if (deletion.status === 'rejected') {
                    expect(deletion.reason).toBeInstanceOf(ConflictException);
                }
            }

            await context.db.execute(sql`delete from users where id = ${userId}`);
        });
    });

    describe('import', () => {
        const csv = (...rows: string[]): string => [HEADER, ...rows].join('\n');
        const line = (key: string, title = 'Салат', ingredients = 'Tomatoes:250'): string =>
            `${key},${title},Salad,salads,greek,vegan,2,15,${ingredients},Наріжте,8`;

        it('creates the rows it can and reports the ones it cannot', async () => {
            const report = await importService.import(
                csv(line('one'), line('two', 'Друга', 'Nonexistent:100'), line('three')),
                2000,
            );

            expect(report.created).toBe(2);
            expect(report.skipped).toBe(1);
            expect(report.errors[0]?.importKey).toBe('two');
            expect(report.errors[0]?.message).toMatch(/not in the catalogue/);
        });

        it('updates on a second run instead of duplicating', async () => {
            await importService.import(csv(line('one')), 2000);
            const report = await importService.import(csv(line('one', 'Оновлена назва')), 2000);

            expect(report.created).toBe(0);
            expect(report.updated).toBe(1);

            const page = await recipeService.list({ language: DEFAULT_LANGUAGE, page: 1, limit: 20 } as never);
            expect(page.total).toBe(1);
            expect(page.items[0]?.title).toBe('Оновлена назва');
        });

        it('gives imported dishes the same derived macros a hand-made one gets', async () => {
            await importService.import(csv(line('one', 'Салат', 'Tomatoes:250')), 2000);

            const page = await recipeService.list({ language: DEFAULT_LANGUAGE, page: 1, limit: 20 } as never);
            expect(page.items[0]?.calories).toBe(Math.round((tomatoes.kcal * 250) / 100));
        });

        it('resolves the taxonomy slugs', async () => {
            await importService.import(csv(line('one')), 2000);

            const id = await recipeRepository.findIdByImportKey('one');
            const recipe = await recipeService.findById(id!);

            expect(recipe.categoryId).toBe(saladsCategoryId);
            expect(recipe.dietIds).toEqual([veganDietId]);
        });

        it('rejects an unknown slug as a row error, not a crash', async () => {
            const report = await importService.import(
                csv(`one,Салат,Salad,not-a-category,greek,vegan,2,15,Tomatoes:250,Наріжте,8`),
                2000,
            );

            expect(report.created).toBe(0);
            expect(report.errors[0]?.message).toMatch(/Unknown category/);
        });

        it('refuses a file over the row limit before writing anything', async () => {
            await expect(importService.import(csv(line('one'), line('two')), 1)).rejects.toThrow(/limit is 1/);

            const page = await recipeService.list({ language: DEFAULT_LANGUAGE, page: 1, limit: 20 } as never);
            expect(page.total).toBe(0);
        });
    });
});

/** A throwaway account, for the tests that need something to reference a dish. */
async function createUser(context: AdminTestContext): Promise<string> {
    const [row] = await context.db.execute<{ id: string }>(
        sql`insert into users (email, password_hash, email_verified_at)
            values (${`plan-${Date.now()}-${Math.random()}@example.com`}, 'x', now()) returning id`,
    );

    return row!.id;
}

async function planRowsFor(context: AdminTestContext, userId: string): Promise<number> {
    const [row] = await context.db.execute<{ total: number }>(
        sql`select count(*)::int as total from meal_plan_items where user_id = ${userId}`,
    );

    return Number(row?.total ?? 0);
}
