import { Injectable, NotFoundException } from '@nestjs/common';

import { NotificationPage, NotificationRepository } from '@dns/database';
import { NotificationListQuery } from '@dns/validation';

import { NotificationErrorCode } from './notifications.errors';

@Injectable()
export class NotificationsService {
    constructor(private readonly notifications: NotificationRepository) {}

    async list(userId: string, query: NotificationListQuery): Promise<NotificationPage> {
        return this.notifications.findPage({
            userId,
            unreadOnly: query.unreadOnly,
            page: query.page,
            limit: query.limit,
        });
    }

    async unreadCount(userId: string): Promise<number> {
        return this.notifications.countUnread(userId);
    }

    /** Opening one marks it read (FR-004); doing so twice is not an error. */
    async markRead(userId: string, id: string): Promise<void> {
        if (!(await this.notifications.markRead(userId, id))) {
            throw new NotFoundException({
                message: 'No such notification',
                code: NotificationErrorCode.NotFound,
            });
        }
    }

    async markAllRead(userId: string): Promise<void> {
        await this.notifications.markAllRead(userId);
    }
}
