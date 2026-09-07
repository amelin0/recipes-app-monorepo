import { sql } from 'drizzle-orm';

import { DrizzleDB } from '@dns/database';

/**
 * Resets everything a test could have created, and nothing that arrived with
 * the schema.
 *
 * The order matters, and so does the absence of `CASCADE`. `TRUNCATE … CASCADE`
 * empties every table with a foreign key pointing at the target **regardless of
 * its ON DELETE rule** — so cascading from `users` would take the seeded
 * products with it, and every later test would be looking at a filter screen
 * the product says cannot be empty. `DELETE FROM users` respects the rules
 * instead: own dishes cascade away, custom products detach, seeded rows stay.
 */
export async function truncateAuthTables(db: DrizzleDB): Promise<void> {
    // Dishes first: `recipe_ingredients` points at products with RESTRICT, so a
    // custom product cannot go until the dishes built from it have.
    await db.execute(
        sql`TRUNCATE TABLE recipe_favorites, recipe_diets, recipe_step_ingredients, recipe_step_translations,
            recipe_steps, recipe_ingredients, recipe_translations, recipes`,
    );
    await db.execute(sql`DELETE FROM products WHERE source = 'custom'`);

    await db.execute(
        sql`TRUNCATE TABLE nutrition_goals, meal_log_entries, water_log_entries, daily_steps,
            body_measurements, feedback, account_deletion_requests, user_reminders,
            user_settings, profiles, oauth_identities, password_reset_permits, otp_codes, refresh_tokens`,
    );

    await db.execute(sql`DELETE FROM users`);
}
