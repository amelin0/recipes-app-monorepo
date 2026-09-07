import { ApiProperty } from '@nestjs/swagger';

import { NotificationEntity } from '@dns/database';
import { NotificationType } from '@dns/shared-types';

/**
 * One notification, whole.
 *
 * The list carries the full text rather than a summary, and there is no
 * separate detail route: the difference between the row and the card is how
 * much of the same message each chooses to draw (inbox FR-002 and FR-005).
 * Truncation to two lines is the client's, because only it knows its width.
 */
export class NotificationView {
    @ApiProperty({ format: 'uuid' }) readonly id: string;

    @ApiProperty({ enum: NotificationType }) readonly type: NotificationType;

    @ApiProperty() readonly title: string;
    @ApiProperty() readonly body: string;

    @ApiProperty({ nullable: true }) readonly subtitle: string | null;

    @ApiProperty({ type: [String], description: 'The bullet list a fuller message carries; empty otherwise.' })
    readonly items: string[];

    @ApiProperty({ nullable: true, example: 'Розмір файлу: 42.5 MB' }) readonly metaLabel: string | null;

    @ApiProperty({ nullable: true, description: 'Present only together with `actionRoute`.' })
    readonly actionLabel: string | null;

    @ApiProperty({ nullable: true, description: 'Where the button goes, as the app understands routes.' })
    readonly actionRoute: string | null;

    @ApiProperty() readonly isRead: boolean;

    @ApiProperty({
        description: 'When it arrived. The client groups by day, in its own timezone — only it knows which.',
    })
    readonly createdAt: string;

    private constructor(notification: NotificationEntity) {
        this.id = notification.id;
        this.type = notification.type;
        this.title = notification.title;
        this.body = notification.body;
        this.subtitle = notification.subtitle;
        this.items = notification.items;
        this.metaLabel = notification.metaLabel;
        this.actionLabel = notification.actionLabel;
        this.actionRoute = notification.actionRoute;
        this.isRead = notification.isRead;
        this.createdAt = notification.createdAt.toISOString();
    }

    static from(notification: NotificationEntity): NotificationView {
        return new NotificationView(notification);
    }
}

/** The number on the bell (inbox FR-006), on its own because the home screen never loads the list. */
export class UnreadCountView {
    @ApiProperty() readonly count: number;

    private constructor(count: number) {
        this.count = count;
    }

    static from(count: number): UnreadCountView {
        return new UnreadCountView(count);
    }
}
