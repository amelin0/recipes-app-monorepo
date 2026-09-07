import { BadRequestException, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { RECIPE_CALORIE_FILTER } from '@dns/constants';
import { ReferenceRepository, UserEntity, UserRepository, schema } from '@dns/database';
import { ContentSource, RecipeTab } from '@dns/shared-types';

import { AuthService } from '../src/modules/auth/auth.service';
import { ProductService } from '../src/modules/catalog/product.service';
import { RecipeService } from '../src/modules/catalog/recipe.service';

import { truncateAuthTables } from './support/db';
import { AuthTestContext, createAuthTestContext } from './support/testing-module';

const EMAIL = 'cook@example.com';
const OTHER_EMAIL = 'stranger@example.com';
const PASSWORD = 'passw0rd';

interface RecipeSeed {
    title: string;
    titleEn?: string;
    source?: ContentSource;
    createdBy?: string;
    categorySlug?: string;
    cuisineSlug?: string;
    dietSlugs?: string[];
    servings?: number;
    calories?: number;
    cookTimeMinutes?: number;
    /** Product name → grams. Names are matched against the seeded quick picks. */
    ingredients?: Record<string, number>;
    steps?: { title: string; description?: string; durationMinutes?: number }[];
}

describe('Catalog', () => {
    let ctx: AuthTestContext;
    let authService: AuthService;
    let recipes: RecipeService;
    let productService: ProductService;
    let references: ReferenceRepository;
    let users: UserRepository;
    let user: UserEntity;

    beforeAll(async () => {
        ctx = await createAuthTestContext();
        authService = ctx.moduleRef.get(AuthService);
        recipes = ctx.moduleRef.get(RecipeService);
        productService = ctx.moduleRef.get(ProductService);
        references = ctx.moduleRef.get(ReferenceRepository);
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

    const idBySlug = async (kind: 'category' | 'cuisine' | 'diet', slug: string): Promise<string> => {
        const rows =
            kind === 'category'
                ? await references.categories('uk')
                : kind === 'cuisine'
                  ? await references.cuisines('uk')
                  : await references.diets('uk');

        const row = rows.find(candidate => candidate.slug === slug);
        expect(row).toBeDefined();

        return (row as { id: string }).id;
    };

    const productIdByName = async (name: string): Promise<string> => {
        const row = await ctx.db.query.productTranslations.findFirst({
            where: eq(schema.productTranslations.name, name),
        });
        expect(row).toBeDefined();

        return (row as { productId: string }).productId;
    };

    /**
     * Inserts a dish straight into the tables. There is no write endpoint for
     * recipes yet — create-dish is the next slice — so the fixture speaks to
     * the schema rather than pretending an API exists.
     */
    const seedRecipe = async (seed: RecipeSeed): Promise<string> => {
        const [recipe] = await ctx.db
            .insert(schema.recipes)
            .values({
                source: seed.source ?? ContentSource.Global,
                createdBy: seed.createdBy ?? null,
                categoryId: seed.categorySlug ? await idBySlug('category', seed.categorySlug) : null,
                cuisineId: seed.cuisineSlug ? await idBySlug('cuisine', seed.cuisineSlug) : null,
                photoUrl: null,
                cookTimeMinutes: seed.cookTimeMinutes ?? 25,
                servings: seed.servings ?? 2,
                totalWeightG: '600.00',
                calories: seed.calories ?? 800,
                proteinG: '40.00',
                fatsG: '20.00',
                carbsG: '90.00',
            })
            .returning();

        const recipeId = (recipe as { id: string }).id;

        await ctx.db
            .insert(schema.recipeTranslations)
            .values([
                { recipeId, language: 'uk', title: seed.title },
                ...(seed.titleEn ? [{ recipeId, language: 'en', title: seed.titleEn }] : []),
            ]);

        for (const slug of seed.dietSlugs ?? []) {
            await ctx.db.insert(schema.recipeDiets).values({ recipeId, dietId: await idBySlug('diet', slug) });
        }

        let sortOrder = 0;
        for (const [name, grams] of Object.entries(seed.ingredients ?? {})) {
            await ctx.db.insert(schema.recipeIngredients).values({
                recipeId,
                productId: await productIdByName(name),
                amountG: grams.toFixed(2),
                sortOrder: sortOrder++,
            });
        }

        let stepNumber = 1;
        for (const step of seed.steps ?? []) {
            const [row] = await ctx.db
                .insert(schema.recipeSteps)
                .values({ recipeId, stepNumber: stepNumber++, durationMinutes: step.durationMinutes ?? null })
                .returning();

            await ctx.db.insert(schema.recipeStepTranslations).values({
                stepId: (row as { id: string }).id,
                language: 'uk',
                title: step.title,
                description: step.description ?? null,
            });
        }

        return recipeId;
    };

    beforeEach(async () => {
        await truncateAuthTables(ctx.db);
        user = await register(EMAIL);
    });

    describe('filter options', () => {
        it('offers every group the design names, in one request', async () => {
            const options = await recipes.filters(user.id);

            expect(options.categories).toHaveLength(11);
            expect(options.productGroups).toHaveLength(6);
            expect(options.cuisines).toHaveLength(6);
            expect(options.diets).toHaveLength(13);
            expect(options.quickProducts).toHaveLength(15);
            expect(options.calories).toEqual(RECIPE_CALORIE_FILTER);
        });

        it('names the options in the reader language and keeps the design order', async () => {
            const options = await recipes.filters(user.id);

            expect(options.categories[0]?.slug).toBe('salty-breakfast');
            expect(options.categories[0]?.name).toBe('Солоні сніданки');
            expect(options.categories[0]?.emoji).toBe('🥓');
        });
    });

    describe('the catalogue list', () => {
        it('divides the stored totals into a per-serving card', async () => {
            await seedRecipe({ title: 'Лосось', calories: 900, servings: 3 });

            const { items, total } = await recipes.list(user.id, listQuery());

            expect(total).toBe(1);
            expect(items[0]?.title).toBe('Лосось');
            expect(items[0]?.calories).toBe(900);
            expect(items[0]?.caloriesPerServing).toBe(300);
            expect(items[0]?.isFavorite).toBe(false);
        });

        it('falls back to Ukrainian when the reader language has no title', async () => {
            await seedRecipe({ title: 'Борщ' });
            await ctx.db
                .update(schema.userSettings)
                .set({ language: 'pl' })
                .where(eq(schema.userSettings.userId, user.id));

            const { items } = await recipes.list(user.id, listQuery());

            // A dish with no Polish title still has to appear — vanishing from
            // the catalogue is a worse answer than showing the Ukrainian name.
            expect(items.map(item => item.title)).toEqual(['Борщ']);
        });

        it('matches a title by substring, ignoring case', async () => {
            await seedRecipe({ title: 'Гречана каша' });
            await seedRecipe({ title: 'Салат Цезар' });

            const { items } = await recipes.list(user.id, listQuery({ q: 'ГРЕЧ' }));

            expect(items.map(item => item.title)).toEqual(['Гречана каша']);
        });

        it('counts every match, not only the page returned', async () => {
            await seedRecipe({ title: 'Перша' });
            await seedRecipe({ title: 'Друга' });
            await seedRecipe({ title: 'Третя' });

            const { items, total } = await recipes.list(user.id, listQuery({ limit: 2 }));

            expect(items).toHaveLength(2);
            expect(total).toBe(3);
        });

        it('keeps somebody else’s own dish out of the catalogue', async () => {
            const stranger = await register(OTHER_EMAIL);
            await seedRecipe({ title: 'Чужа страва', source: ContentSource.Custom, createdBy: stranger.id });
            await seedRecipe({ title: 'Наша страва' });

            const { items } = await recipes.list(user.id, listQuery());

            expect(items.map(item => item.title)).toEqual(['Наша страва']);
        });

        it('shows only this account’s dishes on the «own» tab', async () => {
            await seedRecipe({ title: 'Каталожна' });
            await seedRecipe({ title: 'Моя страва', source: ContentSource.Custom, createdBy: user.id });

            const { items } = await recipes.list(user.id, listQuery({ tab: RecipeTab.Own }));

            expect(items.map(item => item.title)).toEqual(['Моя страва']);
        });
    });

    describe('filters', () => {
        it('widens on two cuisines and narrows on two ingredients', async () => {
            const italian = await seedRecipe({ title: 'Паста', cuisineSlug: 'italian' });
            const greek = await seedRecipe({ title: 'Грецький салат', cuisineSlug: 'greek' });
            await seedRecipe({ title: 'Борщ', cuisineSlug: 'ukrainian' });

            const { items } = await recipes.list(
                user.id,
                listQuery({ cuisines: [await idBySlug('cuisine', 'italian'), await idBySlug('cuisine', 'greek')] }),
            );

            expect(items.map(item => item.id).sort()).toEqual([italian, greek].sort());
        });

        it('a second chosen ingredient narrows the result rather than widening it', async () => {
            const both = await seedRecipe({ title: 'Салат з двома', ingredients: { Помідори: 100, Огірки: 80 } });
            await seedRecipe({ title: 'Тільки помідори', ingredients: { Помідори: 100 } });

            const tomato = await productIdByName('Помідори');
            const cucumber = await productIdByName('Огірки');

            const { items } = await recipes.list(user.id, listQuery({ products: [tomato, cucumber] }));

            expect(items.map(item => item.id)).toEqual([both]);
        });

        it('filters by the group its ingredients belong to', async () => {
            await seedRecipe({ title: 'Овочева', ingredients: { Морква: 100 } });
            await seedRecipe({ title: 'Порожня' });

            const groups = await references.productGroups('uk');
            const vegetables = groups.find(group => group.slug === 'vegetables');

            const { items } = await recipes.list(
                user.id,
                listQuery({ productGroups: [(vegetables as { id: string }).id] }),
            );

            expect(items.map(item => item.title)).toEqual(['Овочева']);
        });

        it('either of two diets is enough', async () => {
            const vegan = await seedRecipe({ title: 'Веганська', dietSlugs: ['vegan'] });
            const keto = await seedRecipe({ title: 'Кето', dietSlugs: ['keto'] });
            await seedRecipe({ title: 'Звичайна' });

            const { items } = await recipes.list(
                user.id,
                listQuery({ diets: [await idBySlug('diet', 'vegan'), await idBySlug('diet', 'keto')] }),
            );

            expect(items.map(item => item.id).sort()).toEqual([vegan, keto].sort());
        });

        it('narrows the calorie range per serving, not per dish', async () => {
            // 900 kcal over three servings is 300 — inside a 250–350 window
            // that the whole-dish figure would fall far outside of.
            await seedRecipe({ title: 'Три порції', calories: 900, servings: 3 });

            const inside = await recipes.list(user.id, listQuery({ caloriesMin: 250, caloriesMax: 350 }));
            expect(inside.items).toHaveLength(1);

            const above = await recipes.list(user.id, listQuery({ caloriesMin: 400 }));
            expect(above.items).toHaveLength(0);
        });

        it('treats the top of the slider as «no upper limit»', async () => {
            await seedRecipe({ title: 'Ситна', calories: 4000, servings: 1 });

            const capped = await recipes.list(user.id, listQuery({ caloriesMax: RECIPE_CALORIE_FILTER.max }));

            expect(capped.items).toHaveLength(1);
        });

        it('applies filters on the favourites tab too', async () => {
            const italian = await seedRecipe({ title: 'Паста', cuisineSlug: 'italian' });
            const greek = await seedRecipe({ title: 'Грецький салат', cuisineSlug: 'greek' });
            await recipes.addFavorite(user.id, italian);
            await recipes.addFavorite(user.id, greek);

            const { items } = await recipes.list(
                user.id,
                listQuery({ tab: RecipeTab.Favorite, cuisines: [await idBySlug('cuisine', 'greek')] }),
            );

            expect(items.map(item => item.id)).toEqual([greek]);
        });
    });

    describe('favourites', () => {
        it('adds, shows on its tab, and removes', async () => {
            const id = await seedRecipe({ title: 'Улюблена' });

            await recipes.addFavorite(user.id, id);

            const hearted = await recipes.list(user.id, listQuery({ tab: RecipeTab.Favorite }));
            expect(hearted.items.map(item => item.id)).toEqual([id]);
            expect(hearted.items[0]?.isFavorite).toBe(true);

            await recipes.removeFavorite(user.id, id);

            const empty = await recipes.list(user.id, listQuery({ tab: RecipeTab.Favorite }));
            expect(empty.items).toHaveLength(0);
        });

        it('hearting twice leaves one row, not a conflict', async () => {
            const id = await seedRecipe({ title: 'Улюблена' });

            await recipes.addFavorite(user.id, id);
            await recipes.addFavorite(user.id, id);

            const { total } = await recipes.list(user.id, listQuery({ tab: RecipeTab.Favorite }));
            expect(total).toBe(1);
        });

        it('refuses to heart a dish this account cannot see', async () => {
            const stranger = await register(OTHER_EMAIL);
            const hidden = await seedRecipe({
                title: 'Чужа',
                source: ContentSource.Custom,
                createdBy: stranger.id,
            });

            await expect(recipes.addFavorite(user.id, hidden)).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('detail', () => {
        it('computes each ingredient’s contribution from its weight', async () => {
            // Carrot is 41 kcal and 9.6 g of carbs per 100 g, so 200 g is
            // double that.
            const id = await seedRecipe({ title: 'Морквяна', ingredients: { Морква: 200 } });

            const detail = await recipes.detail(user.id, id);

            expect(detail.ingredients).toHaveLength(1);
            expect(detail.ingredients[0]?.name).toBe('Морква');
            expect(detail.ingredients[0]?.amountG).toBe(200);
            expect(detail.ingredients[0]?.calories).toBe(82);
            expect(detail.ingredients[0]?.carbsG).toBe(19.2);
        });

        it('returns the method in order, with the cuisine and diets named', async () => {
            const id = await seedRecipe({
                title: 'Різото',
                cuisineSlug: 'italian',
                dietSlugs: ['vegetarian'],
                steps: [
                    { title: 'Підготовка', durationMinutes: 5 },
                    { title: 'Смаження', description: 'На середньому вогні', durationMinutes: 10 },
                ],
            });

            const detail = await recipes.detail(user.id, id);

            expect(detail.recipe.cuisine?.name).toBe('Італійська');
            expect(detail.recipe.diets.map(diet => diet.slug)).toEqual(['vegetarian']);
            expect(detail.steps.map(step => step.stepNumber)).toEqual([1, 2]);
            expect(detail.steps[1]?.description).toBe('На середньому вогні');
        });

        it('answers the same way for a missing dish and somebody else’s', async () => {
            const stranger = await register(OTHER_EMAIL);
            const hidden = await seedRecipe({
                title: 'Чужа',
                source: ContentSource.Custom,
                createdBy: stranger.id,
            });

            await expect(recipes.detail(user.id, hidden)).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('products', () => {
        it('finds a seeded product by part of its name', async () => {
            const { items, total } = await productService.search(user.id, {
                q: 'помідор',
                page: 1,
                limit: 20,
            });

            expect(total).toBe(1);
            expect(items[0]?.name).toBe('Помідори');
            expect(items[0]?.caloriesPer100g).toBe(18);
            expect(items[0]?.servingWeightG).toBe(123);
            expect(items[0]?.group?.slug).toBe('vegetables');
        });

        it('derives the calories of a custom product from its macros', async () => {
            const product = await productService.create(user.id, {
                name: 'Домашній сир',
                proteinPer100g: 18,
                fatsPer100g: 5,
                carbsPer100g: 3,
            });

            // 18×4 + 3×4 + 5×9 = 129
            expect(product.caloriesPer100g).toBe(129);
            expect(product.source).toBe(ContentSource.Custom);
        });

        it('keeps a custom product to the account that made it', async () => {
            await productService.create(user.id, {
                name: 'Мій продукт',
                proteinPer100g: 10,
                fatsPer100g: 1,
                carbsPer100g: 2,
            });

            const stranger = await register(OTHER_EMAIL);
            const theirs = await productService.search(stranger.id, { q: 'Мій продукт', page: 1, limit: 20 });

            expect(theirs.total).toBe(0);
        });

        it('rejects an unknown product group instead of failing on the foreign key', async () => {
            await expect(
                productService.create(user.id, {
                    name: 'Щось',
                    proteinPer100g: 1,
                    fatsPer100g: 1,
                    carbsPer100g: 1,
                    groupId: '11111111-1111-4111-8111-111111111111',
                }),
            ).rejects.toBeInstanceOf(BadRequestException);
        });
    });
});

type ListQuery = Parameters<RecipeService['list']>[1];

function listQuery(overrides: Partial<ListQuery> = {}): ListQuery {
    return { tab: RecipeTab.All, page: 1, limit: 20, ...overrides };
}
