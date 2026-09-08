import { Injectable } from '@nestjs/common';
import { SQL, and, asc, eq, exists, ilike, isNotNull, isNull, lte, not, or, sql } from 'drizzle-orm';

import { ContentSource, SubscriptionStatus } from '@dns/shared-types';

import {
    accountDeletionRequests,
    oauthIdentities,
    profiles,
    recipeFavorites,
    recipes,
    refreshTokens,
    subscriptionPlans,
    subscriptions,
    userSettings,
    users,
} from '../../schema';
import { BaseRepository } from '../base.repository';

/** What the panel narrows the directory by (user-directory FR-002). */
export type DeletionFilter = 'none' | 'active' | 'overdue';

export interface AdminUserFilters {
    search?: string;
    isBlocked?: boolean;
    isEmailVerified?: boolean;
    hasSubscription?: boolean;
    deletion?: DeletionFilter;
}

export interface AdminUserListItem {
    id: string;
    email: string;
    name: string | null;
    language: string | null;
    emailVerifiedAt: Date | null;
    blockedAt: Date | null;
    hasActiveSubscription: boolean;
    deletionScheduledFor: Date | null;
    createdAt: Date;
}

export interface AdminUserDetail extends AdminUserListItem {
    /** `password`, `apple`, `google` — an account can hold more than one. */
    signInMethods: string[];
    subscription: {
        status: string;
        planSlug: string;
        source: string;
        startedAt: Date;
        expiresAt: Date;
    } | null;
    activity: {
        ownRecipes: number;
        favorites: number;
        /** Last refresh token issued — see the plan; not «last API call». */
        lastSeenAt: Date | null;
    };
    deletionRequest: { scheduledFor: Date; createdAt: Date } | null;
}

@Injectable()
export class AdminUserRepository extends BaseRepository {
    async list(params: {
        filters: AdminUserFilters;
        page: number;
        limit: number;
    }): Promise<{ items: AdminUserListItem[]; total: number }> {
        const where = and(...this.conditions(params.filters));

        const [items, total] = await Promise.all([
            this.fetchList(where, { limit: params.limit, offset: (params.page - 1) * params.limit }),
            this.count(where),
        ]);

        return { items, total };
    }

    async findById(id: string): Promise<AdminUserDetail | null> {
        const [row] = await this.fetchList(eq(users.id, id), { limit: 1, offset: 0 });
        if (!row) return null;

        const [methods, subscription, activity, deletionRequest] = await Promise.all([
            this.signInMethods(id),
            this.activeSubscription(id),
            this.activity(id),
            this.activeDeletionRequest(id),
        ]);

        return { ...row, signInMethods: methods, subscription, activity, deletionRequest };
    }

    /**
     * Sets or clears the block (FR-005).
     *
     * Only the flag: revoking the sessions is the caller's second step, and
     * the order between them is deliberate — see the service.
     */
    async setBlocked(id: string, blocked: boolean): Promise<boolean> {
        const updated = await this.db
            .update(users)
            .set({ blockedAt: blocked ? new Date() : null, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning({ id: users.id });

        return updated.length > 0;
    }

    /**
     * Cancels the account's active deletion request (FR-009).
     *
     * The row is kept and stamped rather than deleted: a request can be raised
     * again later, and the history of the previous one is part of the entity —
     * that is why it is a table and not a column pair on `users`.
     */
    async cancelDeletionRequest(userId: string): Promise<boolean> {
        const cancelled = await this.db
            .update(accountDeletionRequests)
            .set({ cancelledAt: new Date() })
            .where(and(eq(accountDeletionRequests.userId, userId), this.deletionRequestIsActive()))
            .returning({ id: accountDeletionRequests.id });

        return cancelled.length > 0;
    }

    /** Active means neither cancelled nor executed — state is derived, never stored. */
    private deletionRequestIsActive(): SQL {
        const active = and(isNull(accountDeletionRequests.cancelledAt), isNull(accountDeletionRequests.executedAt));
        if (!active) throw new Error('Failed to build the deletion-request clause');
        return active;
    }

    /**
     * The list projection, shared with `findById` so the two cannot disagree
     * about what a user row is.
     *
     * Everything is a `left join`: an account that never started the
     * questionnaire has no profile row, and an inner join would drop exactly
     * the users support is most often asked about.
     */
    private async fetchList(
        where: SQL | undefined,
        page: { limit: number; offset: number },
    ): Promise<AdminUserListItem[]> {
        const rows = await this.db
            .select({
                id: users.id,
                email: users.email,
                name: profiles.name,
                language: userSettings.language,
                emailVerifiedAt: users.emailVerifiedAt,
                blockedAt: users.blockedAt,
                hasActiveSubscription: sql<boolean>`${this.activeSubscriptionExists()}`,
                deletionScheduledFor: sql<Date | null>`(
                    SELECT r.scheduled_for FROM ${accountDeletionRequests} r
                     WHERE r.user_id = ${users.id} AND r.cancelled_at IS NULL AND r.executed_at IS NULL
                     ORDER BY r.scheduled_for
                     LIMIT 1)`,
                createdAt: users.createdAt,
            })
            .from(users)
            .leftJoin(profiles, eq(profiles.userId, users.id))
            .leftJoin(userSettings, eq(userSettings.userId, users.id))
            .where(where)
            .orderBy(asc(users.createdAt))
            .limit(page.limit)
            .offset(page.offset);

        return rows.map(row => ({
            ...row,
            // `left join` on a column the driver hands back as a string.
            deletionScheduledFor: row.deletionScheduledFor ? new Date(row.deletionScheduledFor) : null,
        }));
    }

    private async count(where: SQL | undefined): Promise<number> {
        const [row] = await this.db
            .select({ total: sql<number>`count(*)::int` })
            .from(users)
            .leftJoin(profiles, eq(profiles.userId, users.id))
            .leftJoin(userSettings, eq(userSettings.userId, users.id))
            .where(where);

        return row?.total ?? 0;
    }

    private async signInMethods(userId: string): Promise<string[]> {
        const [account] = await this.db
            .select({ hasPassword: isNotNull(users.passwordHash) })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        const providers = await this.db
            .select({ provider: oauthIdentities.provider })
            .from(oauthIdentities)
            .where(eq(oauthIdentities.userId, userId));

        return [...(account?.hasPassword ? ['password'] : []), ...providers.map(row => row.provider)];
    }

    private async activeSubscription(userId: string): Promise<AdminUserDetail['subscription']> {
        const [row] = await this.db
            .select({
                status: subscriptions.status,
                planSlug: subscriptionPlans.slug,
                source: subscriptions.source,
                startedAt: subscriptions.startedAt,
                expiresAt: subscriptions.expiresAt,
            })
            .from(subscriptions)
            .innerJoin(subscriptionPlans, eq(subscriptionPlans.id, subscriptions.planId))
            .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, SubscriptionStatus.Active)))
            .limit(1);

        return row ?? null;
    }

    private async activity(userId: string): Promise<AdminUserDetail['activity']> {
        const [own, favorites, lastSeen] = await Promise.all([
            this.db
                .select({ total: sql<number>`count(*)::int` })
                .from(recipes)
                .where(and(eq(recipes.createdBy, userId), eq(recipes.source, ContentSource.Custom))),
            this.db
                .select({ total: sql<number>`count(*)::int` })
                .from(recipeFavorites)
                .where(eq(recipeFavorites.userId, userId)),
            this.db
                .select({ at: sql<Date | null>`max(${refreshTokens.createdAt})` })
                .from(refreshTokens)
                .where(eq(refreshTokens.userId, userId)),
        ]);

        return {
            ownRecipes: own[0]?.total ?? 0,
            favorites: favorites[0]?.total ?? 0,
            lastSeenAt: lastSeen[0]?.at ? new Date(lastSeen[0].at) : null,
        };
    }

    private async activeDeletionRequest(userId: string): Promise<AdminUserDetail['deletionRequest']> {
        const [row] = await this.db
            .select({
                scheduledFor: accountDeletionRequests.scheduledFor,
                createdAt: accountDeletionRequests.createdAt,
            })
            .from(accountDeletionRequests)
            .where(and(eq(accountDeletionRequests.userId, userId), this.deletionRequestIsActive()))
            .orderBy(asc(accountDeletionRequests.scheduledFor))
            .limit(1);

        return row ?? null;
    }

    /** A correlated EXISTS rather than a join: a join would multiply rows. */
    private activeSubscriptionExists(): SQL {
        return sql`EXISTS (SELECT 1 FROM ${subscriptions} s
                            WHERE s.user_id = ${users.id} AND s.status = 'active')`;
    }

    private conditions(filters: AdminUserFilters): SQL[] {
        const conditions: SQL[] = [];

        if (filters.search) {
            const pattern = `%${filters.search}%`;
            const match = or(ilike(users.email, pattern), ilike(profiles.name, pattern));
            if (match) conditions.push(match);
        }

        if (filters.isBlocked !== undefined) {
            conditions.push(filters.isBlocked ? isNotNull(users.blockedAt) : isNull(users.blockedAt));
        }

        if (filters.isEmailVerified !== undefined) {
            conditions.push(
                filters.isEmailVerified ? isNotNull(users.emailVerifiedAt) : isNull(users.emailVerifiedAt),
            );
        }

        if (filters.hasSubscription !== undefined) {
            const active = this.activeSubscriptionExists();
            conditions.push(filters.hasSubscription ? active : (not(active) as SQL));
        }

        if (filters.deletion) conditions.push(this.deletionCondition(filters.deletion));

        return conditions;
    }

    /**
     * `overdue` counts only requests still waiting: cancelled and executed ones
     * are excluded, or the number the panel shows would never go down — and it
     * is meant to be worked off (FR-010).
     */
    private deletionCondition(filter: DeletionFilter): SQL {
        const request = this.db
            .select({ one: sql`1` })
            .from(accountDeletionRequests)
            .where(and(eq(accountDeletionRequests.userId, users.id), this.deletionRequestIsActive()));

        if (filter === 'none') return not(exists(request)) as SQL;
        if (filter === 'active') return exists(request) as SQL;

        return exists(
            this.db
                .select({ one: sql`1` })
                .from(accountDeletionRequests)
                .where(
                    and(
                        eq(accountDeletionRequests.userId, users.id),
                        this.deletionRequestIsActive(),
                        lte(accountDeletionRequests.scheduledFor, new Date()),
                    ),
                ),
        ) as SQL;
    }
}
