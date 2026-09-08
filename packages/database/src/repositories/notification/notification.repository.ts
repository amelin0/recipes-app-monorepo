import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, isNull, sql } from 'drizzle-orm';

import { NotificationEvent } from '@dns/shared-types';

import { NotificationEntity } from '../../entities';
import { notifications } from '../../schema';
import { BaseRepository } from '../base.repository';

export interface NotificationPage {
    items: NotificationEntity[];
    total: number;
}

type InsertNotification = typeof notifications.$inferInsert;

@Injectable()
export class NotificationRepository extends BaseRepository {
    /** Newest first — the screen groups them into days itself. */
    async findPage(params: {
        userId: string;
        unreadOnly: boolean;
        page: number;
        limit: number;
    }): Promise<NotificationPage> {
        const where = params.unreadOnly
            ? and(eq(notifications.userId, params.userId), isNull(notifications.readAt))
            : eq(notifications.userId, params.userId);

        const [rows, [countRow]] = await Promise.all([
            this.db
                .select()
                .from(notifications)
                .where(where)
                .orderBy(desc(notifications.createdAt), desc(notifications.id))
                .limit(params.limit)
                .offset((params.page - 1) * params.limit),
            this.db
                .select({ total: sql<number>`count(*)::int` })
                .from(notifications)
                .where(where),
        ]);

        return { items: rows.map(NotificationEntity.from), total: countRow?.total ?? 0 };
    }

    async countUnread(userId: string): Promise<number> {
        const [row] = await this.db
            .select({ total: sql<number>`count(*)::int` })
            .from(notifications)
            .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

        return row?.total ?? 0;
    }

    /**
     * Marks one as read, and says whether there was one to mark.
     *
     * Already-read rows are left alone rather than restamped: `read_at` is
     * when it was first opened, and opening it again does not change that.
     */
    async markRead(userId: string, id: string): Promise<boolean> {
        const updated = await this.db
            .update(notifications)
            .set({ readAt: new Date() })
            .where(and(eq(notifications.id, id), eq(notifications.userId, userId), isNull(notifications.readAt)))
            .returning({ id: notifications.id });

        if (updated.length > 0) return true;

        // Nothing updated either because it is already read or because it is
        // not this account's. Only the second is a 404.
        const existing = await this.db.query.notifications.findFirst({
            where: and(eq(notifications.id, id), eq(notifications.userId, userId)),
            columns: { id: true },
        });

        return existing !== undefined;
    }

    async markAllRead(userId: string): Promise<void> {
        await this.db
            .update(notifications)
            .set({ readAt: new Date() })
            .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    }

    /**
     * Has this account already been told about this, since a given moment?
     *
     * The job that warns «premium runs out in three days» runs every day, and
     * without this it would say so three times. There is no «notified» column
     * for the same reason there is no copy of the shopping list: the
     * notification IS the record, and a second flag could disagree with it.
     */
    async existsForUserSince(userId: string, event: NotificationEvent, since: Date): Promise<boolean> {
        const row = await this.db.query.notifications.findFirst({
            where: and(
                eq(notifications.userId, userId),
                eq(notifications.event, event),
                gte(notifications.createdAt, since),
            ),
            columns: { id: true },
        });

        return row !== undefined;
    }

    /**
     * Nothing in the client API creates notifications — they arrive from
     * elsewhere. This exists so tests and, later, the admin service have one
     * way in rather than each writing rows their own way.
     */
    async create(data: InsertNotification): Promise<NotificationEntity> {
        const [row] = await this.db.insert(notifications).values(data).returning();
        if (!row) throw new Error('Failed to insert notification');

        return NotificationEntity.from(row);
    }
}
