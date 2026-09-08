import { notInArray, sql } from 'drizzle-orm';

import { DrizzleDB, schema } from '@dns/database';

const { products } = schema;

/**
 * Clears everything the staff suite creates.
 *
 * Only the three admin tables: this suite shares a database with the client
 * one, and reaching further would delete rows the other suite seeded. The
 * cascade from `admins` takes the refresh tokens; login attempts are wiped
 * explicitly because their FK is ON DELETE SET NULL — the rows survive an
 * admin being removed, which is the point of a journal and a nuisance here.
 */
export async function truncateAdminTables(db: DrizzleDB): Promise<void> {
    await db.execute(sql`TRUNCATE TABLE admin_login_attempts, admin_refresh_tokens`);
    await db.execute(sql`DELETE FROM admins`);
}

/**
 * Clears the catalogue rows this suite creates.
 *
 * Dishes before products would matter if we created products, but we do not —
 * every test builds on the fifteen the migration seeded, so those must survive.
 * `recipes` is emptied by `DELETE` rather than `TRUNCATE ... CASCADE`, because
 * CASCADE ignores ON DELETE rules and would take the seeded products with it.
 */
export async function truncateAdminRecipeTables(db: DrizzleDB): Promise<void> {
    await db.execute(
        sql`TRUNCATE TABLE recipe_step_ingredients, recipe_step_translations, recipe_steps,
            recipe_ingredients, recipe_translations, recipe_diets, recipe_favorites, meal_plan_items`,
    );
    await db.execute(sql`DELETE FROM recipes`);
}

/**
 * Clears what the product suite creates, and nothing that arrived before it.
 *
 * Takes an explicit set of ids to keep rather than guessing by age or source:
 * the fifteen quick-picks come from a migration and the mock-recipe products
 * from a seed, and every other suite builds on both. A predicate like
 * «created recently» would wipe them on a freshly migrated database — which
 * is exactly the machine where tests run for the first time.
 *
 * Dishes go before products: `recipe_ingredients` holds products through
 * ON DELETE RESTRICT, so a product cannot go until the dishes built on it have.
 */
export async function truncateAdminProductTables(db: DrizzleDB, keepProductIds: string[]): Promise<void> {
    await db.execute(
        sql`TRUNCATE TABLE recipe_step_ingredients, recipe_step_translations, recipe_steps,
            recipe_ingredients, recipe_translations, recipe_diets, recipe_favorites, meal_plan_items`,
    );
    await db.execute(sql`DELETE FROM recipes`);

    if (keepProductIds.length === 0) {
        await db.delete(products);
        return;
    }

    // `notInArray`, not raw SQL: interpolating a JS array into a template
    // expands it to a parameter list `($1, $2, …)`, which Postgres reads as a
    // record and refuses to cast to uuid[].
    await db.delete(products).where(notInArray(products.id, keepProductIds));
}

/** Every product id present before a suite starts — its "keep" list. */
export async function snapshotProductIds(db: DrizzleDB): Promise<string[]> {
    const rows = await db.execute<{ id: string }>(sql`SELECT id FROM products`);
    return rows.map(row => row.id);
}

/** id → the fields a test could overwrite without leaving any other trace. */
export type ProductFingerprints = Map<string, string>;

export async function fingerprintProducts(db: DrizzleDB): Promise<ProductFingerprints> {
    const rows = await db.execute<{ id: string; fingerprint: string }>(
        sql`SELECT id, concat_ws('|', calories_per_100g, protein_per_100g, fats_per_100g, carbs_per_100g,
                                 coalesce(serving_weight_g::text, '-'), is_quick_pick, is_verified,
                                 source, coalesce(created_by::text, '-')) AS fingerprint
              FROM products`,
    );

    return new Map(rows.map(row => [row.id, row.fingerprint]));
}

/**
 * Fails if the suite rewrote a row it did not create.
 *
 * Deleting a stray row is easy — `truncateAdminProductTables` does it by id.
 * **Updating** a seeded one is not: the row stays, keeps its id, and survives
 * every cleanup, so the damage is permanent in a database every other suite
 * shares. That is not hypothetical — an import test used `Cabbage` and
 * `Radish`, which are two of the fifteen seeded quick-picks, and turned them
 * into ordinary products. The client suite then failed on «15 quick picks»
 * three hundred seconds into an unrelated run, with nothing pointing here.
 */
export async function assertPreexistingProductsUntouched(db: DrizzleDB, before: ProductFingerprints): Promise<void> {
    const after = await fingerprintProducts(db);
    const changed = [...before]
        .filter(([id, fingerprint]) => after.has(id) && after.get(id) !== fingerprint)
        .map(([id, fingerprint]) => `${id}: ${fingerprint} → ${after.get(id)}`);

    if (changed.length > 0) {
        throw new Error(
            `This suite modified ${changed.length} product(s) it did not create. Use names that are not in the ` +
                `seeded catalogue.\n${changed.join('\n')}`,
        );
    }
}
