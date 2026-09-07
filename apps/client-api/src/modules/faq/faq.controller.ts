import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { UserEntity } from '@dns/database';

import { CurrentUser } from '../auth/decorators';
import { JwtGuard } from '../auth/guards';

import { FaqTopicView } from './dto';
import { FaqService } from './faq.service';

@ApiTags('faq')
@Controller('faq')
@UseGuards(JwtGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing, expired or revoked access token.' })
export class FaqController {
    constructor(private readonly faqService: FaqService) {}

    /**
     * Every topic with its questions, in one response and in the reader's
     * language (faq FR-004, FR-005). The cards on screen are collapsed, not
     * unloaded, so a route per topic would only add round trips.
     */
    @Get()
    @ApiOkResponse({ type: [FaqTopicView] })
    async topics(@CurrentUser() user: UserEntity): Promise<FaqTopicView[]> {
        const topics = await this.faqService.topics(user.id);
        return topics.map(FaqTopicView.from);
    }
}
