import { and, eq, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { ContentSource } from '@dns/shared-types';

import { cuisines } from '../schema/cuisines.schema';
import { diets } from '../schema/diets.schema';
import { dishCategories } from '../schema/dish-categories.schema';
import { productGroups } from '../schema/product-groups.schema';
import { productTranslations, products } from '../schema/products.schema';
import { recipeDiets } from '../schema/recipe-diets.schema';
import { recipeIngredients } from '../schema/recipe-ingredients.schema';
import { recipeStepIngredients, recipeStepTranslations, recipeSteps } from '../schema/recipe-steps.schema';
import { recipeTranslations, recipes } from '../schema/recipes.schema';

/**
 * Mock catalogue recipes, so a fresh environment has something on the recipes
 * tab.
 *
 * **This is scaffolding, not content.** Real recipes will arrive through the
 * admin panel's import; these exist only so the list, the filters, the detail
 * screen, favourites, the meal plan and the shopping list all have rows to
 * work on before that import is built.
 *
 * That is also why this is a seed and not a migration. The dictionaries
 * (categories, cuisines, diets, the fifteen quick-pick products) are migrations
 * because they are part of the product; these six dishes are not, and a
 * migration would make them permanent on every environment forever.
 *
 * Every id here starts with `5eed` so the whole lot is removable in one
 * statement once the import lands:
 *
 *   delete from recipes  where id::text like '5eed%';
 *   delete from products where id::text like '5eed%';
 *
 * (recipes first — recipe_ingredients references products with ON DELETE
 * RESTRICT, so the products will not budge while a dish still uses them.)
 */

/** Fixed ids make re-running a no-op and make the rows removable as a set. */
const recipeId = (n: number): string => `5eed0001-0000-4000-8000-${String(n).padStart(12, '0')}`;
const productId = (n: number): string => `5eed0002-0000-4000-8000-${String(n).padStart(12, '0')}`;

interface ProductSpec {
    /** English name — also the lookup key against the seeded catalogue. */
    en: string;
    uk: string;
    group: string;
    kcal: number;
    protein: number;
    fats: number;
    carbs: number;
    servingG?: number;
    servingUk?: string;
    servingEn?: string;
}

/**
 * Products the dishes below need beyond the fifteen the filter screen ships as
 * quick-picks — those are all vegetables, and no dish is built from vegetables
 * alone.
 *
 * `isQuickPick` stays false: the chip row on the filter screen is a designed
 * set of fifteen, not «whatever the catalogue happens to hold».
 *
 * Numbers are USDA per 100 g, for the form the dish actually uses — rice and
 * quinoa cooked, pasta dry, tuna canned in water.
 */
const PRODUCTS: ProductSpec[] = [
    { en: 'Chicken breast', uk: 'Куряче філе', group: 'meat', kcal: 165, protein: 31, fats: 3.6, carbs: 0 },
    { en: 'Salmon', uk: 'Лосось', group: 'fish', kcal: 208, protein: 20.4, fats: 13.4, carbs: 0 },
    { en: 'Tuna', uk: 'Тунець', group: 'fish', kcal: 116, protein: 25.5, fats: 0.8, carbs: 0 },
    {
        en: 'Egg',
        uk: 'Яйце',
        group: 'dairy',
        kcal: 143,
        protein: 12.6,
        fats: 9.5,
        carbs: 0.7,
        servingG: 50,
        servingUk: '1 шт',
        servingEn: '1 large',
    },
    { en: 'Feta', uk: 'Фета', group: 'dairy', kcal: 264, protein: 14.2, fats: 21.3, carbs: 4.1 },
    { en: 'Greek yogurt', uk: 'Грецький йогурт', group: 'dairy', kcal: 59, protein: 10, fats: 0.4, carbs: 3.6 },
    { en: 'Olive oil', uk: 'Оливкова олія', group: 'sweets', kcal: 884, protein: 0, fats: 100, carbs: 0 },
    { en: 'Olives', uk: 'Оливки', group: 'vegetables', kcal: 115, protein: 0.8, fats: 10.7, carbs: 6.3 },
    { en: 'White rice', uk: 'Рис', group: 'grains', kcal: 130, protein: 2.7, fats: 0.3, carbs: 28.2 },
    { en: 'Quinoa', uk: 'Кіноа', group: 'grains', kcal: 120, protein: 4.4, fats: 1.9, carbs: 21.3 },
    { en: 'Oats', uk: 'Вівсянка', group: 'grains', kcal: 389, protein: 16.9, fats: 6.9, carbs: 66.3 },
    { en: 'Spaghetti', uk: 'Спагеті', group: 'flour', kcal: 371, protein: 13, fats: 1.5, carbs: 74.7 },
    {
        en: 'Banana',
        uk: 'Банан',
        group: 'fruits',
        kcal: 89,
        protein: 1.1,
        fats: 0.3,
        carbs: 22.8,
        servingG: 118,
        servingUk: '1 шт',
        servingEn: '1 medium',
    },
    { en: 'Avocado', uk: 'Авокадо', group: 'fruits', kcal: 160, protein: 2, fats: 14.7, carbs: 8.5 },
    { en: 'Lemon juice', uk: 'Лимонний сік', group: 'fruits', kcal: 22, protein: 0.4, fats: 0.2, carbs: 6.9 },
];

interface StepSpec {
    uk: { title: string; description?: string };
    en: { title: string; description?: string };
    durationMinutes?: number;
    /** English product names, matched against this dish's own ingredients. */
    uses?: string[];
}

interface RecipeSpec {
    n: number;
    uk: string;
    en: string;
    category: string;
    cuisine?: string;
    diets: string[];
    cookTimeMinutes: number;
    servings: number;
    ingredients: { product: string; amountG: number }[];
    steps: StepSpec[];
}

const RECIPES: RecipeSpec[] = [
    {
        n: 1,
        uk: 'Грецький салат',
        en: 'Greek salad',
        category: 'salads',
        cuisine: 'greek',
        diets: ['vegetarian', 'gluten-free', 'low-carb'],
        cookTimeMinutes: 15,
        servings: 2,
        ingredients: [
            { product: 'Tomatoes', amountG: 250 },
            { product: 'Cucumber', amountG: 200 },
            { product: 'Bell pepper', amountG: 120 },
            { product: 'Onion', amountG: 50 },
            { product: 'Feta', amountG: 120 },
            { product: 'Olives', amountG: 60 },
            { product: 'Olive oil', amountG: 30 },
        ],
        steps: [
            {
                uk: { title: 'Наріжте овочі', description: 'Помідори й огірки — великими шматками, перець соломкою.' },
                en: {
                    title: 'Chop the vegetables',
                    description: 'Tomatoes and cucumber in large chunks, pepper in strips.',
                },
                durationMinutes: 8,
                uses: ['Tomatoes', 'Cucumber', 'Bell pepper'],
            },
            {
                uk: { title: 'Додайте цибулю та оливки', description: 'Цибулю — тонкими півкільцями.' },
                en: { title: 'Add the onion and olives', description: 'Slice the onion into thin half-rings.' },
                durationMinutes: 3,
                uses: ['Onion', 'Olives'],
            },
            {
                uk: { title: 'Фета і олія', description: 'Фету покладіть зверху шматком, полийте олією.' },
                en: { title: 'Feta and oil', description: 'Lay the feta on top in one piece and pour the oil over.' },
                durationMinutes: 2,
                uses: ['Feta', 'Olive oil'],
            },
        ],
    },
    {
        n: 2,
        uk: 'Курка з рисом і овочами',
        en: 'Chicken with rice and vegetables',
        category: 'lunch',
        cuisine: 'asian',
        diets: ['high-protein', 'lactose-free'],
        cookTimeMinutes: 35,
        servings: 2,
        ingredients: [
            { product: 'Chicken breast', amountG: 300 },
            { product: 'White rice', amountG: 300 },
            { product: 'Carrot', amountG: 120 },
            { product: 'Bell pepper', amountG: 120 },
            { product: 'Garlic', amountG: 9 },
            { product: 'Olive oil', amountG: 20 },
        ],
        steps: [
            {
                uk: { title: 'Відваріть рис', description: 'До готовності, за інструкцією на упаковці.' },
                en: { title: 'Cook the rice', description: 'To the packet instructions.' },
                durationMinutes: 15,
                uses: ['White rice'],
            },
            {
                uk: { title: 'Обсмажте курку', description: 'Наріжте кубиком і смажте на олії до золотистого.' },
                en: { title: 'Sear the chicken', description: 'Dice it and fry in the oil until golden.' },
                durationMinutes: 10,
                uses: ['Chicken breast', 'Olive oil'],
            },
            {
                uk: { title: 'Додайте овочі', description: 'Моркву, перець і часник — ще 5–7 хвилин.' },
                en: { title: 'Add the vegetables', description: 'Carrot, pepper and garlic — another 5–7 minutes.' },
                durationMinutes: 7,
                uses: ['Carrot', 'Bell pepper', 'Garlic'],
            },
            {
                uk: { title: 'Змішайте з рисом' },
                en: { title: 'Fold through the rice' },
                durationMinutes: 3,
            },
        ],
    },
    {
        n: 3,
        uk: 'Вівсянка з бананом',
        en: 'Banana porridge',
        category: 'sweet-breakfast',
        diets: ['vegetarian', 'high-fiber'],
        cookTimeMinutes: 10,
        servings: 1,
        ingredients: [
            { product: 'Oats', amountG: 60 },
            { product: 'Banana', amountG: 118 },
            { product: 'Greek yogurt', amountG: 100 },
        ],
        steps: [
            {
                uk: { title: 'Зваріть вівсянку', description: 'На воді, помішуючи, до мʼякості.' },
                en: { title: 'Cook the oats', description: 'In water, stirring, until soft.' },
                durationMinutes: 7,
                uses: ['Oats'],
            },
            {
                uk: { title: 'Банан і йогурт', description: 'Наріжте банан кружальцями, зверху — йогурт.' },
                en: { title: 'Banana and yogurt', description: 'Slice the banana over the top, then the yogurt.' },
                durationMinutes: 3,
                uses: ['Banana', 'Greek yogurt'],
            },
        ],
    },
    {
        n: 4,
        uk: 'Паста з тунцем',
        en: 'Tuna pasta',
        category: 'pasta',
        cuisine: 'italian',
        diets: ['high-protein', 'pescatarian'],
        cookTimeMinutes: 25,
        servings: 2,
        ingredients: [
            { product: 'Spaghetti', amountG: 200 },
            { product: 'Tuna', amountG: 160 },
            { product: 'Tomatoes', amountG: 200 },
            { product: 'Garlic', amountG: 6 },
            { product: 'Olive oil', amountG: 20 },
            { product: 'Parsley', amountG: 10 },
        ],
        steps: [
            {
                uk: { title: 'Відваріть спагеті', description: 'Al dente — на хвилину менше, ніж пише пачка.' },
                en: { title: 'Boil the spaghetti', description: 'Al dente — a minute less than the packet says.' },
                durationMinutes: 9,
                uses: ['Spaghetti'],
            },
            {
                uk: { title: 'Соус', description: 'Часник на олії, потім помідори — 5 хвилин.' },
                en: { title: 'The sauce', description: 'Garlic in the oil, then the tomatoes — 5 minutes.' },
                durationMinutes: 7,
                uses: ['Garlic', 'Olive oil', 'Tomatoes'],
            },
            {
                uk: { title: 'Тунець і петрушка', description: 'Вмішайте в соус, прогрійте, зʼєднайте з пастою.' },
                en: {
                    title: 'Tuna and parsley',
                    description: 'Stir into the sauce, warm through, toss with the pasta.',
                },
                durationMinutes: 4,
                uses: ['Tuna', 'Parsley'],
            },
        ],
    },
    {
        n: 5,
        uk: 'Боул з кіноа й авокадо',
        en: 'Quinoa and avocado bowl',
        category: 'bowls',
        diets: ['vegan', 'vegetarian', 'high-fiber', 'gluten-free'],
        cookTimeMinutes: 20,
        servings: 1,
        ingredients: [
            { product: 'Quinoa', amountG: 180 },
            { product: 'Avocado', amountG: 100 },
            { product: 'Tomatoes', amountG: 120 },
            { product: 'Spinach', amountG: 40 },
            { product: 'Lemon juice', amountG: 15 },
            { product: 'Olive oil', amountG: 10 },
        ],
        steps: [
            {
                uk: { title: 'Відваріть кіноа' },
                en: { title: 'Cook the quinoa' },
                durationMinutes: 15,
                uses: ['Quinoa'],
            },
            {
                uk: { title: 'Зберіть боул', description: 'Шпинат на дно, зверху кіноа, авокадо й помідори.' },
                en: {
                    title: 'Build the bowl',
                    description: 'Spinach at the bottom, then quinoa, avocado and tomatoes.',
                },
                durationMinutes: 4,
                uses: ['Spinach', 'Avocado', 'Tomatoes'],
            },
            {
                uk: { title: 'Заправка', description: 'Лимонний сік з олією, збити виделкою.' },
                en: { title: 'Dressing', description: 'Lemon juice and oil, whisked with a fork.' },
                durationMinutes: 1,
                uses: ['Lemon juice', 'Olive oil'],
            },
        ],
    },
    {
        n: 6,
        uk: 'Омлет зі шпинатом',
        en: 'Spinach omelette',
        category: 'salty-breakfast',
        diets: ['vegetarian', 'low-carb', 'gluten-free'],
        cookTimeMinutes: 12,
        servings: 1,
        ingredients: [
            { product: 'Egg', amountG: 150 },
            { product: 'Spinach', amountG: 60 },
            { product: 'Tomatoes', amountG: 80 },
            { product: 'Olive oil', amountG: 10 },
        ],
        steps: [
            {
                uk: { title: 'Підготуйте начинку', description: 'Шпинат і помідори — на олії, поки не зійде волога.' },
                en: {
                    title: 'Prepare the filling',
                    description: 'Spinach and tomatoes in the oil until the water goes.',
                },
                durationMinutes: 5,
                uses: ['Spinach', 'Tomatoes', 'Olive oil'],
            },
            {
                uk: { title: 'Залийте яйцями', description: 'Збийте яйця, залийте й тримайте під кришкою.' },
                en: { title: 'Add the eggs', description: 'Beat the eggs, pour over and cover the pan.' },
                durationMinutes: 6,
                uses: ['Egg'],
            },
        ],
    },
];

interface ResolvedProduct {
    id: string;
    kcal: number;
    protein: number;
    fats: number;
    carbs: number;
}

/**
 * Finds a product by its English name, creating it if the catalogue has none.
 *
 * The lookup matters: eleven of the ingredients below are among the fifteen
 * quick-picks a migration already seeded, and inserting a second «Tomatoes»
 * would put a duplicate in front of everyone using product search.
 *
 * The macros come back from the row that won, not from the spec, so a dish's
 * totals always match the numbers the app reads for its ingredients.
 */
async function ensureProduct(db: PostgresJsDatabase, spec: ProductSpec, index: number): Promise<ResolvedProduct> {
    const [found] = await db
        .select({
            id: products.id,
            kcal: products.caloriesPer100g,
            protein: products.proteinPer100g,
            fats: products.fatsPer100g,
            carbs: products.carbsPer100g,
        })
        .from(products)
        .innerJoin(productTranslations, eq(productTranslations.productId, products.id))
        .where(and(eq(productTranslations.language, 'en'), eq(productTranslations.name, spec.en)))
        .limit(1);

    if (found) {
        return {
            id: found.id,
            kcal: Number(found.kcal),
            protein: Number(found.protein),
            fats: Number(found.fats),
            carbs: Number(found.carbs),
        };
    }

    const id = productId(index);
    const [group] = await db
        .select({ id: productGroups.id })
        .from(productGroups)
        .where(eq(productGroups.slug, spec.group))
        .limit(1);

    await db.insert(products).values({
        id,
        source: ContentSource.Global,
        groupId: group?.id ?? null,
        caloriesPer100g: String(spec.kcal),
        proteinPer100g: String(spec.protein),
        fatsPer100g: String(spec.fats),
        carbsPer100g: String(spec.carbs),
        servingWeightG: spec.servingG === undefined ? null : String(spec.servingG),
        isQuickPick: false,
        isVerified: true,
    });

    await db.insert(productTranslations).values([
        { productId: id, language: 'uk', name: spec.uk, servingLabel: spec.servingUk ?? null },
        { productId: id, language: 'en', name: spec.en, servingLabel: spec.servingEn ?? null },
    ]);

    return { id, kcal: spec.kcal, protein: spec.protein, fats: spec.fats, carbs: spec.carbs };
}

async function dictionaryId(
    db: PostgresJsDatabase,
    table: typeof dishCategories | typeof cuisines | typeof diets,
    slug: string,
): Promise<string> {
    const [row] = await db.select({ id: table.id }).from(table).where(eq(table.slug, slug)).limit(1);
    if (!row) {
        throw new Error(`dictionary row '${slug}' is missing — run the migrations first`);
    }
    return row.id;
}

const round2 = (value: number): string => (Math.round(value * 100) / 100).toFixed(2);

export async function seedRecipes(db: PostgresJsDatabase): Promise<void> {
    const catalogue = new Map<string, ResolvedProduct>();
    for (const [index, spec] of PRODUCTS.entries()) {
        catalogue.set(spec.en, await ensureProduct(db, spec, index + 1));
    }

    // The eleven quick-picks the dishes reach for. They are already in the
    // database, so this only resolves their ids and macros — nothing is
    // inserted, and a missing one is a genuine error rather than a reason to
    // create a second copy under a different group.
    for (const name of ['Tomatoes', 'Cucumber', 'Bell pepper', 'Onion', 'Carrot', 'Garlic', 'Parsley', 'Spinach']) {
        const [found] = await db
            .select({
                id: products.id,
                kcal: products.caloriesPer100g,
                protein: products.proteinPer100g,
                fats: products.fatsPer100g,
                carbs: products.carbsPer100g,
            })
            .from(products)
            .innerJoin(productTranslations, eq(productTranslations.productId, products.id))
            .where(and(eq(productTranslations.language, 'en'), eq(productTranslations.name, name)))
            .limit(1);

        if (!found) {
            throw new Error(`quick-pick product '${name}' is missing — run the migrations first`);
        }
        catalogue.set(name, {
            id: found.id,
            kcal: Number(found.kcal),
            protein: Number(found.protein),
            fats: Number(found.fats),
            carbs: Number(found.carbs),
        });
    }

    let created = 0;
    let skipped = 0;

    for (const spec of RECIPES) {
        const id = recipeId(spec.n);

        const [existing] = await db.select({ id: recipes.id }).from(recipes).where(eq(recipes.id, id)).limit(1);
        if (existing) {
            skipped++;
            continue;
        }

        // Derived from the composition rather than authored. The column is
        // stored, not computed on read (see recipes.schema.ts) — for mock data
        // deriving it is what keeps the card's per-serving figure consistent
        // with the ingredient list underneath it.
        let kcal = 0;
        let protein = 0;
        let fats = 0;
        let carbs = 0;
        let weight = 0;

        for (const line of spec.ingredients) {
            const product = catalogue.get(line.product);
            if (!product) {
                throw new Error(`recipe '${spec.en}' wants unknown product '${line.product}'`);
            }
            const factor = line.amountG / 100;
            kcal += product.kcal * factor;
            protein += product.protein * factor;
            fats += product.fats * factor;
            carbs += product.carbs * factor;
            weight += line.amountG;
        }

        const categoryId = await dictionaryId(db, dishCategories, spec.category);
        const cuisineId = spec.cuisine ? await dictionaryId(db, cuisines, spec.cuisine) : null;

        await db.insert(recipes).values({
            id,
            source: ContentSource.Global,
            categoryId,
            cuisineId,
            photoUrl: null,
            cookTimeMinutes: spec.cookTimeMinutes,
            servings: spec.servings,
            totalWeightG: round2(weight),
            calories: Math.round(kcal),
            proteinG: round2(protein),
            fatsG: round2(fats),
            carbsG: round2(carbs),
            createdBy: null,
        });

        await db.insert(recipeTranslations).values([
            { recipeId: id, language: 'uk', title: spec.uk },
            { recipeId: id, language: 'en', title: spec.en },
        ]);

        for (const slug of spec.diets) {
            await db.insert(recipeDiets).values({ recipeId: id, dietId: await dictionaryId(db, diets, slug) });
        }

        // Kept so the step chips can point at the exact ingredient row rather
        // than at the product — «the 200 g of tomatoes in this dish».
        const ingredientIds = new Map<string, string>();
        for (const [index, line] of spec.ingredients.entries()) {
            const [row] = await db
                .insert(recipeIngredients)
                .values({
                    recipeId: id,
                    productId: catalogue.get(line.product)!.id,
                    amountG: round2(line.amountG),
                    sortOrder: index,
                })
                .returning({ id: recipeIngredients.id });
            ingredientIds.set(line.product, row!.id);
        }

        for (const [index, step] of spec.steps.entries()) {
            const [row] = await db
                .insert(recipeSteps)
                .values({
                    recipeId: id,
                    stepNumber: index + 1,
                    durationMinutes: step.durationMinutes ?? null,
                })
                .returning({ id: recipeSteps.id });
            const stepId = row!.id;

            await db.insert(recipeStepTranslations).values([
                { stepId, language: 'uk', title: step.uk.title, description: step.uk.description ?? null },
                { stepId, language: 'en', title: step.en.title, description: step.en.description ?? null },
            ]);

            for (const name of step.uses ?? []) {
                const ingredientId = ingredientIds.get(name);
                if (!ingredientId) {
                    throw new Error(
                        `step '${step.en.title}' uses '${name}', which is not an ingredient of '${spec.en}'`,
                    );
                }
                await db.insert(recipeStepIngredients).values({ stepId, recipeIngredientId: ingredientId });
            }
        }

        created++;
    }

    const [row] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(recipes)
        .where(eq(recipes.source, ContentSource.Global));

    console.log(
        `[seed:recipes] created ${created}, already present ${skipped} — ${row?.total ?? 0} catalogue recipes in total`,
    );
}
