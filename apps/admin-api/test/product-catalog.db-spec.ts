import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';

import { DEFAULT_LANGUAGE } from '@dns/constants';
import { AdminProductRepository, ProductRepository, schema } from '@dns/database';
import { ContentSource, Language } from '@dns/shared-types';
import { AdminCreateProductInput, adminCreateProductSchema } from '@dns/validation';

import { ProductImportService } from '../src/modules/product/import/product-import.service';
import { AdminProductService } from '../src/modules/product/product.service';

import {
    ProductFingerprints,
    assertPreexistingProductsUntouched,
    fingerprintProducts,
    snapshotProductIds,
    truncateAdminProductTables,
} from './support/db';
import { AdminTestContext, createAdminTestContext } from './support/testing-module';

const HEADER = 'name_en,name_uk,group,calories,protein,fats,carbs,serving_weight_g,quick_pick';

describe('admin product catalogue', () => {
    let context: AdminTestContext;
    let productService: AdminProductService;
    let importService: ProductImportService;
    let adminRepository: AdminProductRepository;
    let clientRepository: ProductRepository;
    /** Everything that existed before this suite — migrations and seeds. */
    let preexisting: string[];
    /** …and what those rows looked like, so an accidental update is caught here. */
    let preexistingState: ProductFingerprints;

    beforeAll(async () => {
        context = await createAdminTestContext();
        productService = context.moduleRef.get(AdminProductService);
        importService = context.moduleRef.get(ProductImportService);
        adminRepository = context.moduleRef.get(AdminProductRepository);
        clientRepository = context.moduleRef.get(ProductRepository);
        preexisting = await snapshotProductIds(context.db);
        preexistingState = await fingerprintProducts(context.db);
    });

    afterAll(async () => {
        try {
            await truncateAdminProductTables(context.db, preexisting);
            // Reported here, not as a test: a suite that damages the shared
            // catalogue has to say so where the cause is obvious, instead of in
            // somebody else's run half an hour later.
            await assertPreexistingProductsUntouched(context.db, preexistingState);
        } finally {
            // `finally`, because a hook that throws before closing the Nest
            // context leaves Jest hanging instead of failing.
            await context.close();
        }
    });

    beforeEach(async () => {
        await truncateAdminProductTables(context.db, preexisting);
    });

    const payload = (overrides: Partial<AdminCreateProductInput> = {}): AdminCreateProductInput =>
        ({
            groupSlug: 'vegetables',
            caloriesPer100g: 18,
            proteinPer100g: 0.9,
            fatsPer100g: 0.2,
            carbsPer100g: 3.9,
            servingWeightG: 123,
            isQuickPick: false,
            translations: [
                { language: Language.Ukrainian, name: 'Тестовий продукт', servingLabel: '1 шт' },
                { language: Language.English, name: 'Test product', servingLabel: '1 piece' },
            ],
            ...overrides,
        }) as AdminCreateProductInput;

    describe('create and update', () => {
        it('joins the shared catalogue, not somebody private list', async () => {
            const id = await productService.create(payload());

            const [row] = await context.db.select().from(schema.products).where(eq(schema.products.id, id));
            expect(row?.source).toBe(ContentSource.Global);
            expect(row?.createdBy).toBeNull();
            expect(row?.isVerified).toBe(true);
        });

        it('keeps every translation and the serving label', async () => {
            const id = await productService.create(payload());
            const product = await productService.findById(id, DEFAULT_LANGUAGE);

            expect(product.translations).toHaveLength(2);
            expect(product.translations.find(t => t.language === 'en')?.servingLabel).toBe('1 piece');
        });

        it('refuses an unknown product group', async () => {
            await expect(productService.create(payload({ groupSlug: 'not-a-group' }))).rejects.toThrow(
                BadRequestException,
            );
        });

        it('refuses a second product under the same English name', async () => {
            await productService.create(payload());

            // The recipe CSV addresses products by their English name, so a
            // duplicate would silently resolve to whichever row came first.
            await expect(productService.create(payload())).rejects.toThrow(ConflictException);
        });

        it('replaces translations wholesale', async () => {
            const id = await productService.create(payload());

            await productService.update(
                id,
                payload({
                    translations: [{ language: Language.Ukrainian, name: 'Лише українська', servingLabel: null }],
                }),
            );

            const product = await productService.findById(id, DEFAULT_LANGUAGE);
            expect(product.translations).toHaveLength(1);
            expect(product.nameEn).toBeNull();
        });

        it('404s on an id that is not there', async () => {
            await expect(
                productService.update('00000000-0000-4000-8000-000000000000', payload()),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('verification', () => {
        it('promotes a user product into the shared catalogue', async () => {
            const userId = await createUser(context);
            const id = await createCustomProduct(context, userId, 'Homemade cheese');

            await productService.setVerified(id, true);

            const [row] = await context.db.select().from(schema.products).where(eq(schema.products.id, id));
            expect(row?.source).toBe(ContentSource.Global);
            // Cleared on purpose: a product everyone can see is no longer one
            // person's data, and this is what stops account deletion taking it.
            expect(row?.createdBy).toBeNull();
            expect(row?.isVerified).toBe(true);

            await context.db.execute(sql`delete from users where id = ${userId}`);
        });

        it('makes it findable by somebody else', async () => {
            const owner = await createUser(context);
            const stranger = await createUser(context);
            const id = await createCustomProduct(context, owner, 'Homemade cheese');

            const before = await clientRepository.search({
                userId: stranger,
                language: Language.English,
                query: 'Homemade',
                page: 1,
                limit: 20,
            });
            expect(before.total).toBe(0);

            await productService.setVerified(id, true);

            const after = await clientRepository.search({
                userId: stranger,
                language: Language.English,
                query: 'Homemade',
                page: 1,
                limit: 20,
            });
            expect(after.total).toBe(1);

            await context.db.execute(sql`delete from users where id in (${owner}, ${stranger})`);
        });
    });

    describe('archiving', () => {
        it('hides the product from the admin list but keeps it reachable by id', async () => {
            const id = await productService.create(payload());

            // Searched by name rather than paged: the catalogue already holds
            // the seeded rows, and a bare first page would miss this one on
            // collation order alone — the assertion would then pass whether or
            // not archiving worked.
            await expect(findByName(productService, 'Тестовий')).resolves.toBe(1);

            await productService.setArchived(id, true);

            await expect(findByName(productService, 'Тестовий')).resolves.toBe(0);

            // The edit page has to open it, or un-archiving is unreachable.
            await expect(productService.findById(id, DEFAULT_LANGUAGE)).resolves.toBeDefined();
        });

        it('hides it from the app search too', async () => {
            const userId = await createUser(context);
            const id = await productService.create(payload());

            const before = await clientRepository.search({
                userId,
                language: Language.English,
                query: 'Test product',
                page: 1,
                limit: 20,
            });
            expect(before.total).toBe(1);

            await productService.setArchived(id, true);

            // FR-009: hiding it only in the panel would be worse than not
            // hiding it, because it would look done.
            const after = await clientRepository.search({
                userId,
                language: Language.English,
                query: 'Test product',
                page: 1,
                limit: 20,
            });
            expect(after.total).toBe(0);

            await context.db.execute(sql`delete from users where id = ${userId}`);
        });

        it('leaves a dish that uses it intact', async () => {
            const id = await productService.create(payload());
            const recipeId = await createRecipeUsing(context, id);

            await productService.setArchived(id, true);

            const [ingredient] = await context.db
                .select()
                .from(schema.recipeIngredients)
                .where(eq(schema.recipeIngredients.recipeId, recipeId));
            expect(ingredient?.productId).toBe(id);
        });

        it('can be undone', async () => {
            const id = await productService.create(payload());
            await productService.setArchived(id, true);
            await productService.setArchived(id, false);

            await expect(findByName(productService, 'Тестовий')).resolves.toBe(1);
            expect(id).toEqual(expect.any(String));
        });

        it('reports how many dishes use it', async () => {
            const id = await productService.create(payload());
            await createRecipeUsing(context, id);

            const product = await productService.findById(id, DEFAULT_LANGUAGE);
            expect(product.usedInRecipes).toBe(1);
        });
    });

    describe('implausible numbers', () => {
        // Tested against the schema, not the service: validation runs in the
        // DTO layer, so calling the service directly would sail straight past
        // it and the test would assert nothing.
        it('refuses more calories than pure fat', () => {
            const result = adminCreateProductSchema.safeParse(payload({ caloriesPer100g: 1600 }));

            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.message).toMatch(/900 kcal/);
        });

        it('refuses a negative macro', () => {
            expect(adminCreateProductSchema.safeParse(payload({ proteinPer100g: -1 })).success).toBe(false);
        });

        it('refuses macros that weigh more than the food', async () => {
            const report = await importService.import(
                [HEADER, 'Impossible,Неможливий,vegetables,100,60,50,40,,'].join('\n'),
                2000,
            );

            expect(report.created).toBe(0);
            expect(report.errors[0]?.message).toMatch(/more than the food weighs/);
        });
    });

    describe('import', () => {
        // Deliberately names that are NOT among the fifteen seeded quick-picks:
        // `Cabbage` and `Radish` are, so importing them would count as updates
        // and quietly turn a "created" assertion into a false failure.
        const line = (nameEn: string, nameUk: string, kcal = '18'): string =>
            `${nameEn},${nameUk},vegetables,${kcal},0.9,0.2,3.9,123,false`;

        it('creates the rows it can and reports the ones it cannot', async () => {
            const report = await importService.import(
                [
                    HEADER,
                    line('Kohlrabi', 'Кольрабі'),
                    'Broken,Зламаний,vegetables,abc,0,0,0,,',
                    line('Daikon', 'Дайкон'),
                ].join('\n'),
                2000,
            );

            expect(report.created).toBe(2);
            expect(report.skipped).toBe(1);
            expect(report.errors[0]?.row).toBe(3);
            expect(report.errors[0]?.message).toMatch(/calories must be a number/);
        });

        it('updates on a second run instead of duplicating', async () => {
            await importService.import([HEADER, line('Kohlrabi', 'Кольрабі')].join('\n'), 2000);
            const report = await importService.import([HEADER, line('Kohlrabi', 'Нова назва', '25')].join('\n'), 2000);

            expect(report.created).toBe(0);
            expect(report.updated).toBe(1);

            const list = await productService.list({
                search: 'Нова',
                language: DEFAULT_LANGUAGE,
                page: 1,
                limit: 20,
            } as never);
            expect(list.total).toBe(1);
            expect(list.items[0]?.caloriesPer100g).toBe('25.00');
        });

        it('catches a name repeated inside one file', async () => {
            const report = await importService.import(
                [HEADER, line('Kohlrabi', 'Кольрабі'), line('Kohlrabi', 'Інша')].join('\n'),
                2000,
            );

            expect(report.created).toBe(1);
            expect(report.errors[0]?.message).toMatch(/Duplicate name_en/);
        });

        it('refuses a file missing a required column', async () => {
            await expect(importService.import('name_en,name_uk\nKohlrabi,Кольрабі', 2000)).rejects.toThrow(
                /Missing required columns/,
            );
        });

        it('unblocks a recipe import that needed the product', async () => {
            // SC-003, the whole point of the slice: the recipe importer rejects
            // rows whose product is absent, so filling the product catalogue is
            // what lets real recipes in.
            await importService.import([HEADER, line('Kohlrabi', 'Кольрабі')].join('\n'), 2000);

            const id = await adminRepository.findIdByEnglishName('Kohlrabi');
            expect(id).not.toBeNull();
        });
    });
});

/** How many products match a name — the only list assertion that survives paging. */
async function findByName(service: AdminProductService, search: string): Promise<number> {
    const page = await service.list({ search, language: DEFAULT_LANGUAGE, page: 1, limit: 100 } as never);
    return page.total;
}

async function createUser(context: AdminTestContext): Promise<string> {
    const [row] = await context.db.execute<{ id: string }>(
        sql`insert into users (email, password_hash, email_verified_at)
            values (${`product-${Date.now()}-${Math.random()}@example.com`}, 'x', now()) returning id`,
    );
    return row!.id;
}

/** A product as a user's own — the state verification promotes out of. */
async function createCustomProduct(context: AdminTestContext, userId: string, nameEn: string): Promise<string> {
    const [row] = await context.db.execute<{ id: string }>(
        sql`insert into products (source, created_by, calories_per_100g, protein_per_100g, fats_per_100g, carbs_per_100g)
            values ('custom', ${userId}, 300, 20, 25, 2) returning id`,
    );
    const id = row!.id;

    await context.db.execute(
        sql`insert into product_translations (product_id, language, name)
            values (${id}, 'uk', ${nameEn}), (${id}, 'en', ${nameEn})`,
    );

    return id;
}

async function createRecipeUsing(context: AdminTestContext, productId: string): Promise<string> {
    const [recipe] = await context.db.execute<{ id: string }>(
        sql`insert into recipes (source, servings, calories, protein_g, fats_g, carbs_g)
            values ('global', 1, 100, 1, 1, 1) returning id`,
    );
    const recipeId = recipe!.id;

    await context.db.execute(
        sql`insert into recipe_ingredients (recipe_id, product_id, amount_g) values (${recipeId}, ${productId}, 100)`,
    );

    return recipeId;
}
