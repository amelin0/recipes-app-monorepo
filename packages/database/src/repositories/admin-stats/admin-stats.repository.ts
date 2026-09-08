import { Injectable } from '@nestjs/common';
import { eq, inArray, sql } from 'drizzle-orm';

import { recipeFavorites, userSettings } from '../../schema';
import { BaseRepository } from '../base.repository';

export interface DailyCount {
    /** `YYYY-MM-DD`, a UTC day. */
    date: string;
    count: number;
}

export interface LanguageCount {
    /** Null for accounts that never got settings — a normal state, counted separately. */
    language: string | null;
    count: number;
}

export interface OverviewStats {
    registrations: { total: number; byDate: DailyCount[]; byLanguage: LanguageCount[] };
    users: { total: number; blocked: number; withActiveSubscription: number };
    catalogue: { recipes: number; products: number; unverifiedCustomProducts: number };
    queues: { newTickets: number; overdueDeletions: number };
}

export interface FavoriteRecipeStats {
    id: string;
    name: string;
    photoUrl: string | null;
    calories: number;
    favorites: number;
    byLanguage: LanguageCount[];
}

@Injectable()
export class AdminStatsRepository extends BaseRepository {
    async overview(days: number): Promise<OverviewStats> {
        const [byDate, byLanguage, counts] = await Promise.all([
            this.registrationsByDate(days),
            this.usersByLanguage(),
            this.counts(days),
        ]);

        return {
            registrations: { total: counts.registrations, byDate, byLanguage },
            users: {
                total: counts.users,
                blocked: counts.blocked,
                withActiveSubscription: counts.subscribed,
            },
            catalogue: {
                recipes: counts.recipes,
                products: counts.products,
                unverifiedCustomProducts: counts.unverifiedProducts,
            },
            queues: { newTickets: counts.newTickets, overdueDeletions: counts.overdueDeletions },
        };
    }

    /**
     * One row per day of the period, zeros included (FR-005).
     *
     * `generate_series` rather than filling gaps in JavaScript: a day with no
     * sign-ups is data, not a missing row, and letting the client invent the
     * calendar would put «which days exist» in two places.
     */
    private async registrationsByDate(days: number): Promise<DailyCount[]> {
        const rows = await this.db.execute<{ date: string; count: number }>(sql`
            SELECT to_char(day, 'YYYY-MM-DD') AS date,
                   coalesce(count(u.id), 0)::int AS count
              FROM generate_series(
                       (now() AT TIME ZONE 'utc')::date - make_interval(days => ${days - 1}),
                       (now() AT TIME ZONE 'utc')::date,
                       interval '1 day') AS day
              LEFT JOIN users u
                     ON (u.created_at AT TIME ZONE 'utc')::date = day::date
             GROUP BY day
             ORDER BY day
        `);

        return rows.map(row => ({ date: row.date, count: Number(row.count) }));
    }

    /**
     * `left join`, so an account that never got settings is counted as `null`
     * rather than dropped — otherwise this breakdown would quietly stop adding
     * up to the total (FR-006).
     */
    private async usersByLanguage(): Promise<LanguageCount[]> {
        const rows = await this.db.execute<{ language: string | null; count: number }>(sql`
            SELECT s.language AS language, count(*)::int AS count
              FROM users u
              LEFT JOIN user_settings s ON s.user_id = u.id
             GROUP BY s.language
             ORDER BY count DESC
        `);

        return rows.map(row => ({ language: row.language, count: Number(row.count) }));
    }

    /**
     * Every headline number in one round trip.
     *
     * Each predicate deliberately mirrors the page that shows the same figure:
     * archived products are excluded exactly as `GET /products` excludes them,
     * and the two queue counters use the filters their own lists use. A number
     * on the dashboard that disagrees with the list behind it is worse than no
     * number at all (FR-009).
     */
    private async counts(days: number): Promise<{
        registrations: number;
        users: number;
        blocked: number;
        subscribed: number;
        recipes: number;
        products: number;
        unverifiedProducts: number;
        newTickets: number;
        overdueDeletions: number;
    }> {
        const [row] = await this.db.execute<Record<string, number>>(sql`
            SELECT
                (SELECT count(*) FROM users
                  WHERE created_at >= (now() AT TIME ZONE 'utc')::date - make_interval(days => ${days - 1}))::int
                    AS registrations,
                (SELECT count(*) FROM users)::int AS users,
                (SELECT count(*) FROM users WHERE blocked_at IS NOT NULL)::int AS blocked,
                (SELECT count(*) FROM subscriptions WHERE status = 'active')::int AS subscribed,
                (SELECT count(*) FROM recipes WHERE source = 'global')::int AS recipes,
                (SELECT count(*) FROM products WHERE archived_at IS NULL)::int AS products,
                (SELECT count(*) FROM products
                  WHERE archived_at IS NULL AND source = 'custom' AND is_verified = false)::int
                    AS unverified_products,
                (SELECT count(*) FROM feedback WHERE status = 'new')::int AS new_tickets,
                (SELECT count(*) FROM account_deletion_requests
                  WHERE cancelled_at IS NULL AND executed_at IS NULL AND scheduled_for <= now())::int
                    AS overdue_deletions
        `);

        return {
            registrations: Number(row?.registrations ?? 0),
            users: Number(row?.users ?? 0),
            blocked: Number(row?.blocked ?? 0),
            subscribed: Number(row?.subscribed ?? 0),
            recipes: Number(row?.recipes ?? 0),
            products: Number(row?.products ?? 0),
            unverifiedProducts: Number(row?.unverified_products ?? 0),
            newTickets: Number(row?.new_tickets ?? 0),
            overdueDeletions: Number(row?.overdue_deletions ?? 0),
        };
    }

    /**
     * Which dishes people keep, and in what languages — never who.
     *
     * The language split is one query for the whole page rather than one per
     * dish: twenty extra round trips are invisible on a local database and
     * obvious on a real one.
     */
    async favorites(params: {
        language: string;
        page: number;
        limit: number;
    }): Promise<{ items: FavoriteRecipeStats[]; total: number }> {
        const offset = (params.page - 1) * params.limit;

        const rows = await this.db.execute<{
            id: string;
            name: string;
            photo_url: string | null;
            calories: number;
            favorites: number;
        }>(sql`
            SELECT r.id,
                   coalesce(preferred.title, fallback.title, '') AS name,
                   r.photo_url,
                   r.calories,
                   count(f.user_id)::int AS favorites
              FROM recipes r
              JOIN recipe_favorites f ON f.recipe_id = r.id
              LEFT JOIN recipe_translations preferred
                     ON preferred.recipe_id = r.id AND preferred.language = ${params.language}
              LEFT JOIN recipe_translations fallback
                     ON fallback.recipe_id = r.id AND fallback.language = 'uk'
             GROUP BY r.id, preferred.title, fallback.title
             ORDER BY favorites DESC, name
             LIMIT ${params.limit} OFFSET ${offset}
        `);

        const [totals] = await this.db.execute<{ total: number }>(sql`
            SELECT count(DISTINCT recipe_id)::int AS total FROM recipe_favorites
        `);

        const ids = rows.map(row => row.id);
        const byLanguage = await this.favoritesByLanguage(ids);

        return {
            items: rows.map(row => ({
                id: row.id,
                name: row.name,
                photoUrl: row.photo_url,
                calories: Number(row.calories),
                favorites: Number(row.favorites),
                byLanguage: byLanguage.get(row.id) ?? [],
            })),
            total: Number(totals?.total ?? 0),
        };
    }

    private async favoritesByLanguage(recipeIds: string[]): Promise<Map<string, LanguageCount[]>> {
        if (recipeIds.length === 0) return new Map();

        // The query builder, not a hand-built `ANY(ARRAY[…])`: ids interpolated
        // into SQL text are an injection shape even when they come from our own
        // rows, and `inArray` is the form that survives a uuid[] cast.
        const rows = await this.db
            .select({
                recipeId: recipeFavorites.recipeId,
                language: userSettings.language,
                count: sql<number>`count(*)::int`,
            })
            .from(recipeFavorites)
            .leftJoin(userSettings, eq(userSettings.userId, recipeFavorites.userId))
            .where(inArray(recipeFavorites.recipeId, recipeIds))
            .groupBy(recipeFavorites.recipeId, userSettings.language);

        const grouped = new Map<string, LanguageCount[]>();
        for (const row of rows) {
            const bucket = grouped.get(row.recipeId) ?? [];
            bucket.push({ language: row.language, count: Number(row.count) });
            grouped.set(row.recipeId, bucket);
        }

        // Biggest group first, per recipe.
        for (const bucket of grouped.values()) bucket.sort((a, b) => b.count - a.count);

        return grouped;
    }
}
