import { Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiParam,
    ApiQuery,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { Paginated } from '@dns/api-common';
import { UserEntity } from '@dns/database';

import { CurrentUser } from '../auth/decorators';
import { JwtGuard } from '../auth/guards';

import { NotificationIdParam, NotificationListQuery, NotificationView, UnreadCountView } from './dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing, expired or revoked access token.' })
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    /**
     * Newest first, whole. The screen groups them into «Сьогодні» and dates
     * itself: which day a timestamp belongs to depends on the device's
     * timezone, and only the device knows it — the same rule the meal log
     * follows for the day a meal counts toward.
     */
    @Get()
    @ApiQuery({ name: 'unreadOnly', required: false, description: 'The «Не прочитані» tab.' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiOkResponse({ type: NotificationView, isArray: true, description: 'Paged: `{ data, meta }`.' })
    async list(
        @CurrentUser() user: UserEntity,
        @Query() query: NotificationListQuery,
    ): Promise<Paginated<NotificationView>> {
        const { items, total } = await this.notificationsService.list(user.id, query);
        return Paginated.of(items.map(NotificationView.from), total, query.page, query.limit);
    }

    /**
     * Declared before `:id` so the parameterised route does not swallow it —
     * and separate from the list because the home screen shows the bell
     * without ever loading the inbox.
     */
    @Get('unread-count')
    @ApiOkResponse({ type: UnreadCountView })
    async unreadCount(@CurrentUser() user: UserEntity): Promise<UnreadCountView> {
        return UnreadCountView.from(await this.notificationsService.unreadCount(user.id));
    }

    /**
     * Marking everything read is one act over many rows, so it takes a verb —
     * the same exception ADR-0004 makes for copying a day of the plan.
     */
    @Post('read-all')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'The bell is clear.' })
    async markAllRead(@CurrentUser() user: UserEntity): Promise<void> {
        await this.notificationsService.markAllRead(user.id);
    }

    /** The read flag as a sub-resource; opening the same notification twice is not an error. */
    @Put(':id/read')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiParam({ name: 'id', format: 'uuid' })
    @ApiNoContentResponse({ description: 'Read — idempotent.' })
    @ApiNotFoundResponse({ description: 'No such notification for this account.' })
    async markRead(@CurrentUser() user: UserEntity, @Param() params: NotificationIdParam): Promise<void> {
        await this.notificationsService.markRead(user.id, params.id);
    }
}
