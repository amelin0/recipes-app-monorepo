import { sql } from 'drizzle-orm';

import { DrizzleDB } from '@dns/database';

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
