import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';

import { DEFAULT_LANGUAGE } from '@dns/constants';
import { AdminProductRepository, ProductRepository, schema } from '@dns/database';
import { ContentSource, Language, NotificationEvent } from '@dns/shared-types';
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

        /**
         * The old guard looked the name up and then inserted — two requests
         * both looked, both found nothing, both inserted. The unique index
         * on `name_en_key` lets exactly one through, however they interleave.
         */
        it('lets only one of two simultaneous creates of one English name through', async () => {
            const outcomes = await Promise.allSettled([
                productService.create(payload()),
                productService.create(payload()),
                productService.create(payload()),
            ]);

            expect(outcomes.filter(outcome => outcome.status === 'fulfilled')).toHaveLength(1);

            const refused = outcomes.filter(outcome => outcome.status === 'rejected');
            expect(refused).toHaveLength(2);
            for (const outcome of refused) {
                expect((outcome as PromiseRejectedResult).reason).toBeInstanceOf(ConflictException);
            }

            expect(await globalProductsNamed(context, 'Test product')).toBe(1);
        });

        it('treats a name differing only in case or spacing as the same name', async () => {
            await productService.create(payload());

            const shouting = payload({
                translations: [
                    { language: Language.Ukrainian, name: 'Інший', servingLabel: null },
                    { language: Language.English, name: '  TEST PRODUCT ', servingLabel: null },
                ],
            });

            await expect(productService.create(shouting)).rejects.toThrow(ConflictException);
        });

        it('refuses renaming a product to another one’s English name', async () => {
            await productService.create(payload());
            const other = await productService.create(
                payload({
                    translations: [
                        { language: Language.Ukrainian, name: 'Інший', servingLabel: null },
                        { language: Language.English, name: 'Other product', servingLabel: null },
                    ],
                }),
            );

            await expect(productService.update(other, payload())).rejects.toThrow(ConflictException);

            // Refused as a whole: the transaction took the translations back too.
            const product = await productService.findById(other, DEFAULT_LANGUAGE);
            expect(product.nameEn).toBe('Other product');
        });

        /**
         * Somebody's private «Test product» is theirs. Before the lookup was
         * scoped to the catalogue it made the admin's create a 409.
         */
        it('is not blocked by a user’s private product of the same name', async () => {
            const userId = await createUser(context);
            await createCustomProduct(context, userId, 'Test product');

            await expect(productService.create(payload())).resolves.toEqual(expect.any(String));

            await context.db.execute(sql`delete from users where id = ${userId}`);
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

        /**
         * The author is told even though the write clears `created_by`: the
         * promoting statement returns the author it cleared, so there is
         * still somebody to notify afterwards.
         */
        it('tells the person who created it', async () => {
            const userId = await createUser(context);
            const id = await createCustomProduct(context, userId, 'Homemade cheese');

            await productService.setVerified(id, true);

            const messages = await context.db
                .select({ title: schema.notifications.title, event: schema.notifications.event })
                .from(schema.notifications)
                .where(eq(schema.notifications.userId, userId));

            expect(messages).toHaveLength(1);
            expect(messages[0]?.event).toBe(NotificationEvent.ProductVerified);

            await context.db.execute(sql`delete from users where id = ${userId}`);
        });

        /**
         * The old service read the author, then wrote unconditionally: two
         * admins verifying at once both read the author and both told them.
         * Now one conditional statement decides who promoted it, and only
         * that caller tells.
         */
        it('tells the author once when two admins verify at the same moment', async () => {
            const userId = await createUser(context);
            const id = await createCustomProduct(context, userId, 'Homemade cheese');

            await Promise.all([
                productService.setVerified(id, true),
                productService.setVerified(id, true),
                productService.setVerified(id, true),
            ]);

            const messages = await context.db
                .select({ event: schema.notifications.event })
                .from(schema.notifications)
                .where(eq(schema.notifications.userId, userId));
            expect(messages).toHaveLength(1);
            expect(messages[0]?.event).toBe(NotificationEvent.ProductVerified);

            await context.db.execute(sql`delete from users where id = ${userId}`);
        });

        it('tells nobody a second time when it is verified again', async () => {
            const userId = await createUser(context);
            const id = await createCustomProduct(context, userId, 'Homemade cheese');

            await productService.setVerified(id, true);
            await productService.setVerified(id, false);
            await productService.setVerified(id, true);

            const messages = await context.db
                .select({ id: schema.notifications.id })
                .from(schema.notifications)
                .where(eq(schema.notifications.userId, userId));
            expect(messages).toHaveLength(1);

            await context.db.execute(sql`delete from users where id = ${userId}`);
        });

        /**
         * Promotion is how a row enters the catalogue's name index. A private
         * «Test product» cannot become a second catalogue one: 409, and the
         * product stays its author's, untold.
         */
        it('refuses to promote a product whose English name the catalogue already has', async () => {
            await productService.create(payload());
            const userId = await createUser(context);
            const id = await createCustomProduct(context, userId, 'Test product');

            await expect(productService.setVerified(id, true)).rejects.toThrow(ConflictException);

            const [row] = await context.db.select().from(schema.products).where(eq(schema.products.id, id));
            expect(row?.source).toBe(ContentSource.Custom);
            expect(row?.createdBy).toBe(userId);
            expect(row?.isVerified).toBe(false);

            const messages = await context.db
                .select({ id: schema.notifications.id })
                .from(schema.notifications)
                .where(eq(schema.notifications.userId, userId));
            expect(messages).toHaveLength(0);

            await context.db.execute(sql`delete from users where id = ${userId}`);
        });

        it('404s when verifying a product that is not there', async () => {
            await expect(productService.setVerified('00000000-0000-4000-8000-000000000000', true)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('tells nobody when the product was ours all along', async () => {
            // Measured as a difference: notifications are not this suite's
            // table, and a bare `count(*)` would be an assertion about whatever
            // else happens to be in a shared database.
            const before = await notificationCount(context);
            const id = await productService.create(payload());

            await productService.setVerified(id, true);

            expect(await notificationCount(context)).toBe(before);
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

        /**
         * The bug this guards was not a race: the import's lookup was not
         * limited to the catalogue, so a user's own «Kohlrabi» matched, and
         * the import **overwrote that person's private product** with the
         * file's numbers and names.
         */
        it('never touches a user’s private product of the same name', async () => {
            const userId = await createUser(context);
            const privateId = await createCustomProduct(context, userId, 'Kohlrabi');
            const before = await productRow(context, privateId);

            const report = await importService.import([HEADER, line('Kohlrabi', 'Кольрабі', '27')].join('\n'), 2000);

            expect(report.created).toBe(1);
            expect(report.updated).toBe(0);
            expect(await productRow(context, privateId)).toEqual(before);
            expect(await globalProductsNamed(context, 'Kohlrabi')).toBe(1);

            await context.db.execute(sql`delete from users where id = ${userId}`);
        });

        /**
         * Two imports of the same file at once — both rows say «create
         * Kohlrabi». One creates it; the other either updates it or is
         * reported as a duplicate, and either way there is one row.
         */
        it('leaves one product when two imports of the same name run at once', async () => {
            const file = [HEADER, line('Kohlrabi', 'Кольрабі')].join('\n');

            const reports = await Promise.all([importService.import(file, 2000), importService.import(file, 2000)]);

            expect(reports.reduce((sum, report) => sum + report.created, 0)).toBe(1);
            expect(await globalProductsNamed(context, 'Kohlrabi')).toBe(1);
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

            const id = await adminRepository.findGlobalIdByEnglishName('Kohlrabi');
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

/** Global rows carrying this English name, compared the way the unique index compares. */
async function globalProductsNamed(context: AdminTestContext, nameEn: string): Promise<number> {
    const [row] = await context.db.execute<{ total: number }>(
        sql`select count(*)::int as total
              from products p
              join product_translations t on t.product_id = p.id and t.language = 'en'
             where p.source = 'global' and lower(btrim(t.name)) = lower(btrim(${nameEn}::text))`,
    );
    return Number(row?.total ?? 0);
}

/** A product with its translations, as one comparable value. */
async function productRow(context: AdminTestContext, id: string): Promise<unknown> {
    const [product] = await context.db.select().from(schema.products).where(eq(schema.products.id, id));
    const translations = await context.db
        .select()
        .from(schema.productTranslations)
        .where(eq(schema.productTranslations.productId, id))
        .orderBy(schema.productTranslations.language);

    return { product, translations };
}

async function notificationCount(context: AdminTestContext): Promise<number> {
    const [row] = await context.db.select({ total: sql<number>`count(*)::int` }).from(schema.notifications);
    return Number(row?.total ?? 0);
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
