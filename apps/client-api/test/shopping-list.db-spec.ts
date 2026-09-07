import { NotFoundException } from '@nestjs/common';

import { UserEntity, UserRepository, schema } from '@dns/database';
import { ContentSource, MealSlot, ShoppingItemOrigin, ShoppingUnit } from '@dns/shared-types';

import { AuthService } from '../src/modules/auth/auth.service';
import { ProductService } from '../src/modules/catalog/product.service';
import { MealPlanService } from '../src/modules/meal-plan/meal-plan.service';
import { ShoppingItem, ShoppingListService } from '../src/modules/shopping-list/shopping-list.service';

import { truncateAuthTables } from './support/db';
import { AuthTestContext, createAuthTestContext } from './support/testing-module';

const EMAIL = 'shopper@example.com';
const OTHER_EMAIL = 'stranger@example.com';
const PASSWORD = 'passw0rd';

const FROM = '2026-05-18';
const TO = '2026-05-24';
const WINDOW = { from: FROM, to: TO };

describe('Shopping list', () => {
    let ctx: AuthTestContext;
    let authService: AuthService;
    let list: ShoppingListService;
    let plan: MealPlanService;
    let productService: ProductService;
    let users: UserRepository;
    let user: UserEntity;

    beforeAll(async () => {
        ctx = await createAuthTestContext();
        authService = ctx.moduleRef.get(AuthService);
        list = ctx.moduleRef.get(ShoppingListService);
        plan = ctx.moduleRef.get(MealPlanService);
        productService = ctx.moduleRef.get(ProductService);
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

    const productId = async (name: string): Promise<string> => {
        const row = await ctx.db.query.productTranslations.findFirst({
            where: (translations, { eq }) => eq(translations.name, name),
        });
        expect(row).toBeDefined();

        return (row as { productId: string }).productId;
    };

    /** A catalogue dish made of the given products, written straight to the schema. */
    const seedRecipe = async (title: string, composition: Record<string, number>): Promise<string> => {
        const [recipe] = await ctx.db
            .insert(schema.recipes)
            .values({
                source: ContentSource.Global,
                servings: 1,
                totalWeightG: '400.00',
                calories: 500,
                proteinG: '20.00',
                fatsG: '10.00',
                carbsG: '40.00',
            })
            .returning();

        const recipeId = (recipe as { id: string }).id;
        await ctx.db.insert(schema.recipeTranslations).values({ recipeId, language: 'uk', title });

        let sortOrder = 0;
        for (const [name, grams] of Object.entries(composition)) {
            await ctx.db.insert(schema.recipeIngredients).values({
                recipeId,
                productId: await productId(name),
                amountG: grams.toFixed(2),
                sortOrder: sortOrder++,
            });
        }

        return recipeId;
    };

    const allItems = (groups: { items: ShoppingItem[] }[]): ShoppingItem[] => groups.flatMap(group => group.items);

    const itemFor = (groups: { items: ShoppingItem[] }[], name: string, origin: ShoppingItemOrigin): ShoppingItem => {
        const found = allItems(groups).find(item => item.product.name === name && item.origin === origin);
        expect(found).toBeDefined();

        return found as ShoppingItem;
    };

    beforeEach(async () => {
        await truncateAuthTables(ctx.db);
        user = await register(EMAIL);
    });

    describe('an empty list', () => {
        it('starts empty with the plan switch on', async () => {
            const result = await list.read(user.id, WINDOW);

            expect(result.groups).toHaveLength(0);
            expect(result.visibleCount).toBe(0);
            expect(result.importFromPlan).toBe(true);
        });
    });

    describe('adding by hand', () => {
        it('converts each unit into grams and prices the line from the product', async () => {
            // Carrot is 41 kcal per 100 g, so 100 g is 41.
            await list.add(user.id, {
                productId: await productId('Морква'),
                unit: ShoppingUnit.Piece,
                value: 1,
            });

            const result = await list.read(user.id, WINDOW);
            const carrot = itemFor(result.groups, 'Морква', ShoppingItemOrigin.Manual);

            expect(carrot.amountG).toBe(100);
            expect(carrot.calories).toBe(41);
            expect(carrot.purchased).toBe(false);
            expect(result.visibleCount).toBe(1);
        });

        it('a serving is 250 g and grams pass through', async () => {
            await list.add(user.id, { productId: await productId('Морква'), unit: ShoppingUnit.Serving, value: 2 });
            await list.add(user.id, { productId: await productId('Огірки'), unit: ShoppingUnit.Gram, value: 300 });

            const result = await list.read(user.id, WINDOW);

            expect(itemFor(result.groups, 'Морква', ShoppingItemOrigin.Manual).amountG).toBe(500);
            expect(itemFor(result.groups, 'Огірки', ShoppingItemOrigin.Manual).amountG).toBe(300);
        });

        it('adding the same product again sums into one line and unticks it', async () => {
            const carrot = await productId('Морква');

            await list.add(user.id, { productId: carrot, unit: ShoppingUnit.Gram, value: 200 });
            await list.setPurchased(user.id, carrot, ShoppingItemOrigin.Manual, true);
            await list.add(user.id, { productId: carrot, unit: ShoppingUnit.Gram, value: 300 });

            const result = await list.read(user.id, WINDOW);
            const line = itemFor(result.groups, 'Морква', ShoppingItemOrigin.Manual);

            expect(allItems(result.groups)).toHaveLength(1);
            expect(line.amountG).toBe(500);
            // There is more to buy than there was, so it is no longer bought.
            expect(line.purchased).toBe(false);
        });

        it('refuses a product this account cannot see', async () => {
            const stranger = await register(OTHER_EMAIL);
            const theirs = await productService.create(stranger.id, {
                name: 'Чужий продукт',
                proteinPer100g: 10,
                fatsPer100g: 1,
                carbsPer100g: 2,
            });

            await expect(
                list.add(user.id, { productId: theirs.id, unit: ShoppingUnit.Gram, value: 100 }),
            ).rejects.toBeInstanceOf(NotFoundException);
        });

        it('removes a line it owns and refuses one it does not have', async () => {
            const carrot = await productId('Морква');
            await list.add(user.id, { productId: carrot, unit: ShoppingUnit.Gram, value: 100 });

            await list.remove(user.id, carrot);
            expect((await list.read(user.id, WINDOW)).visibleCount).toBe(0);

            await expect(list.remove(user.id, carrot)).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('importing from the plan', () => {
        const planCarrotAndCucumber = async (): Promise<void> => {
            const recipeId = await seedRecipe('Салат', { Морква: 200, Огірки: 150 });
            await plan.addItem(user.id, FROM, { slot: MealSlot.Lunch, recipeId });
        };

        it('sums the composition of the planned dishes, per product', async () => {
            await planCarrotAndCucumber();

            const result = await list.read(user.id, WINDOW);

            expect(itemFor(result.groups, 'Морква', ShoppingItemOrigin.Plan).amountG).toBe(200);
            expect(itemFor(result.groups, 'Огірки', ShoppingItemOrigin.Plan).amountG).toBe(150);
        });

        it('adds up the same product across two planned dishes', async () => {
            const first = await seedRecipe('Салат', { Морква: 200 });
            const second = await seedRecipe('Суп', { Морква: 150 });

            await plan.addItem(user.id, FROM, { slot: MealSlot.Lunch, recipeId: first });
            await plan.addItem(user.id, TO, { slot: MealSlot.Dinner, recipeId: second });

            const result = await list.read(user.id, WINDOW);

            expect(allItems(result.groups)).toHaveLength(1);
            expect(itemFor(result.groups, 'Морква', ShoppingItemOrigin.Plan).amountG).toBe(350);
        });

        it('follows the plan without any re-sync', async () => {
            await planCarrotAndCucumber();
            await plan.clearDay(user.id, FROM);

            const result = await list.read(user.id, WINDOW);

            expect(result.visibleCount).toBe(0);
        });

        it('counts only the days asked for', async () => {
            await planCarrotAndCucumber();

            const outside = await list.read(user.id, { from: '2026-06-01', to: '2026-06-07' });

            expect(outside.visibleCount).toBe(0);
        });

        it('hides imported lines when the switch is off, and keeps the manual ones', async () => {
            await planCarrotAndCucumber();
            await list.add(user.id, { productId: await productId('Часник'), unit: ShoppingUnit.Gram, value: 50 });

            await list.setImportFromPlan(user.id, false);
            const hidden = await list.read(user.id, WINDOW);

            expect(hidden.importFromPlan).toBe(false);
            expect(allItems(hidden.groups).map(item => item.product.name)).toEqual(['Часник']);
        });

        it('brings imported ticks back exactly as they were', async () => {
            await planCarrotAndCucumber();
            await list.setPurchased(user.id, await productId('Морква'), ShoppingItemOrigin.Plan, true);

            await list.setImportFromPlan(user.id, false);
            await list.setImportFromPlan(user.id, true);

            const result = await list.read(user.id, WINDOW);

            expect(itemFor(result.groups, 'Морква', ShoppingItemOrigin.Plan).purchased).toBe(true);
            expect(itemFor(result.groups, 'Огірки', ShoppingItemOrigin.Plan).purchased).toBe(false);
        });

        it('keeps a manual line separate from the imported one for the same product', async () => {
            await planCarrotAndCucumber();
            await list.add(user.id, { productId: await productId('Морква'), unit: ShoppingUnit.Gram, value: 100 });

            const result = await list.read(user.id, WINDOW);
            const lines = allItems(result.groups).filter(item => item.product.name === 'Морква');

            expect(lines.map(line => line.origin).sort()).toEqual([ShoppingItemOrigin.Manual, ShoppingItemOrigin.Plan]);
            expect(itemFor(result.groups, 'Морква', ShoppingItemOrigin.Manual).amountG).toBe(100);
            expect(itemFor(result.groups, 'Морква', ShoppingItemOrigin.Plan).amountG).toBe(200);
        });

        it('buying the manual line does not tick the imported one', async () => {
            await planCarrotAndCucumber();
            const carrot = await productId('Морква');
            await list.add(user.id, { productId: carrot, unit: ShoppingUnit.Gram, value: 100 });

            await list.setPurchased(user.id, carrot, ShoppingItemOrigin.Manual, true);

            const result = await list.read(user.id, WINDOW);

            expect(itemFor(result.groups, 'Морква', ShoppingItemOrigin.Manual).purchased).toBe(true);
            expect(itemFor(result.groups, 'Морква', ShoppingItemOrigin.Plan).purchased).toBe(false);
        });
    });

    describe('ticking and clearing', () => {
        it('ticks, unticks, and survives being ticked twice', async () => {
            const carrot = await productId('Морква');
            await list.add(user.id, { productId: carrot, unit: ShoppingUnit.Gram, value: 100 });

            await list.setPurchased(user.id, carrot, ShoppingItemOrigin.Manual, true);
            await list.setPurchased(user.id, carrot, ShoppingItemOrigin.Manual, true);

            let result = await list.read(user.id, WINDOW);
            expect(itemFor(result.groups, 'Морква', ShoppingItemOrigin.Manual).purchased).toBe(true);
            // A ticked line stays on the list, greyed rather than gone.
            expect(result.visibleCount).toBe(1);

            await list.setPurchased(user.id, carrot, ShoppingItemOrigin.Manual, false);
            result = await list.read(user.id, WINDOW);
            expect(itemFor(result.groups, 'Морква', ShoppingItemOrigin.Manual).purchased).toBe(false);
        });

        it('clearing empties the list but leaves the plan alone', async () => {
            const recipeId = await seedRecipe('Салат', { Морква: 200 });
            await plan.addItem(user.id, FROM, { slot: MealSlot.Lunch, recipeId });
            await list.add(user.id, { productId: await productId('Часник'), unit: ShoppingUnit.Gram, value: 50 });

            await list.clear(user.id);

            const result = await list.read(user.id, WINDOW);
            // The manual line is gone; the imported one is still derived from
            // the plan, which clearing a shopping list has no business touching.
            expect(allItems(result.groups).map(item => item.origin)).toEqual([ShoppingItemOrigin.Plan]);
        });
    });

    describe('aisles', () => {
        it('groups in shopping order, which is not the recipe filter order', async () => {
            await list.add(user.id, { productId: await productId('Морква'), unit: ShoppingUnit.Gram, value: 100 });

            const result = await list.read(user.id, WINDOW);

            expect(result.groups).toHaveLength(1);
            expect(result.groups[0]?.group?.slug).toBe('vegetables');
        });

        it('puts a product with no group into a trailing bucket rather than losing it', async () => {
            const homemade = await productService.create(user.id, {
                name: 'Домашній сир',
                proteinPer100g: 18,
                fatsPer100g: 5,
                carbsPer100g: 3,
            });
            await list.add(user.id, { productId: homemade.id, unit: ShoppingUnit.Gram, value: 200 });
            await list.add(user.id, { productId: await productId('Морква'), unit: ShoppingUnit.Gram, value: 100 });

            const result = await list.read(user.id, WINDOW);

            expect(result.groups).toHaveLength(2);
            expect(result.groups[0]?.group?.slug).toBe('vegetables');
            expect(result.groups[1]?.group).toBeNull();
            expect(result.groups[1]?.items[0]?.product.name).toBe('Домашній сир');
        });
    });
});
