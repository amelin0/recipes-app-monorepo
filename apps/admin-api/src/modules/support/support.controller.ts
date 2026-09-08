import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiTags,
} from '@nestjs/swagger';

import { Paginated } from '@dns/api-common';
import { AdminEntity } from '@dns/database';

import { CurrentAdmin } from '../auth';

import {
    CreateFeedbackNoteInboundDto,
    FeedbackDetailView,
    FeedbackListQueryDto,
    FeedbackNoteView,
    FeedbackView,
    SetFeedbackStatusInboundDto,
} from './dto';
import { SupportService } from './support.service';

/**
 * Named `feedback` after the table and after the client's own
 * `POST /profile/feedback`. The V1 panel called the same thing
 * «support-messages»; a third name for one entity is a difference where there
 * is none.
 */
@ApiTags('feedback')
@Controller('feedback')
@ApiBearerAuth()
export class SupportController {
    constructor(private readonly supportService: SupportService) {}

    /**
     * The queue, newest first.
     *
     * `status=new` with `limit=1` is also how the panel counts what is waiting:
     * the number arrives in `meta`, so there is no second endpoint reporting a
     * total that could drift from this filter.
     */
    @Get()
    @ApiOkResponse({ type: FeedbackView, isArray: true })
    async list(@Query() query: FeedbackListQueryDto): Promise<Paginated<FeedbackView>> {
        const result = await this.supportService.list(query);
        return Paginated.of(result.items.map(FeedbackView.from), result.total, query.page, query.limit);
    }

    @Get(':id')
    @ApiOkResponse({ type: FeedbackDetailView })
    @ApiNotFoundResponse({ description: 'No ticket with this id.' })
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<FeedbackDetailView> {
        return FeedbackDetailView.fromDetail(await this.supportService.findById(id));
    }

    @Patch(':id/status')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Any state to any state, including back.' })
    @ApiNotFoundResponse({ description: 'No ticket with this id.' })
    async setStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: SetFeedbackStatusInboundDto,
    ): Promise<void> {
        await this.supportService.setStatus(id, body.status);
    }

    /**
     * Internal note. Append-only: there is no route that edits or removes one.
     *
     * The author comes from the token — the body carries the text and nothing
     * else, so a note cannot be signed with somebody else's name.
     */
    @Post(':id/notes')
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({ type: FeedbackNoteView })
    @ApiNotFoundResponse({ description: 'No ticket with this id.' })
    async addNote(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() body: CreateFeedbackNoteInboundDto,
        @CurrentAdmin() admin: AdminEntity,
    ): Promise<FeedbackNoteView> {
        const note = await this.supportService.addNote(id, { id: admin.id, fullName: admin.fullName }, body.body);
        return new FeedbackNoteView(note);
    }
}
