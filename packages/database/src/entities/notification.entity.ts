import { NotificationType } from '@dns/shared-types';

import { notifications } from '../schema';

type NotificationRow = typeof notifications.$inferSelect;

export class NotificationEntity {
    readonly id: string;
    readonly type: NotificationType;
    readonly title: string;
    readonly body: string;
    readonly subtitle: string | null;
    readonly items: string[];
    readonly metaLabel: string | null;
    readonly actionLabel: string | null;
    readonly actionRoute: string | null;
    readonly isRead: boolean;
    readonly createdAt: Date;

    private constructor(row: NotificationRow) {
        this.id = row.id;
        this.type = row.type as NotificationType;
        this.title = row.title;
        this.body = row.body;
        this.subtitle = row.subtitle;
        this.items = row.items ?? [];
        this.metaLabel = row.metaLabel;
        this.actionLabel = row.actionLabel;
        this.actionRoute = row.actionRoute;
        // The timestamp is when it was read; the screen only ever asks whether.
        this.isRead = row.readAt !== null;
        this.createdAt = row.createdAt;
    }

    static from(row: NotificationRow): NotificationEntity {
        return new NotificationEntity(row);
    }
}
