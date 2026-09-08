import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Paginated } from '@dns/api-common';

import { AdminUserDetailView, AdminUserView, SetUserBlockedInboundDto, UserListQueryDto } from './dto';
import { AdminUserService } from './user.service';

@ApiTags('users')
@Controller('users')
@ApiBearerAuth()
export class AdminUserController {
    constructor(private readonly userService: AdminUserService) {}

    /**
     * The directory.
     *
     * `deletion=overdue` with `limit=1` is also how the panel counts requests
     * nobody has acted on: the total comes back in `meta`, so there is no
     * second endpoint reporting a number that could disagree with this filter.
     */
    @Get()
    @ApiOkResponse({ type: AdminUserView, isArray: true })
    async list(@Query() query: UserListQueryDto): Promise<Paginated<AdminUserView>> {
        const result = await this.userService.list(query);
        return Paginated.of(result.items.map(AdminUserView.from), result.total, query.page, query.limit);
    }

    @Get(':id')
    @ApiOkResponse({ type: AdminUserDetailView })
    @ApiNotFoundResponse({ description: 'No user with this id.' })
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AdminUserDetailView> {
        return AdminUserDetailView.fromDetail(await this.userService.findById(id));
    }

    /**
     * Stops the account, and every live session with it.
     *
     * There is no route that edits someone's profile (FR-012): blocking is the
     * only thing staff can change about another person's account.
     */
    @Patch(':id/block')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Blocking revokes every session; unblocking does not restore them.' })
    @ApiNotFoundResponse({ description: 'No user with this id.' })
    async setBlocked(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: SetUserBlockedInboundDto,
    ): Promise<void> {
        await this.userService.setBlocked(id, body.blocked);
    }

    /**
     * Cancels the **request**, not the account — which is why the path names
     * the request. There is deliberately no way to execute one from here: see
     * ADR-0005.
     */
    @Delete(':id/deletion-request')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'The account stays; the request is kept, stamped as cancelled.' })
    @ApiNotFoundResponse({ description: 'No user with this id, or no pending request.' })
    async cancelDeletionRequest(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        await this.userService.cancelDeletionRequest(id);
    }
}
