import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UserEntity } from '@dns/database';

import { CurrentUser } from '../auth/decorators';
import { JwtGuard } from '../auth/guards';

import { CreateFeedbackInboundDto, FeedbackView } from './dto';
import { FeedbackService } from './feedback.service';

@ApiTags('profile')
@Controller('profile/feedback')
@UseGuards(JwtGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing, expired or revoked access token.' })
export class FeedbackController {
    constructor(private readonly feedbackService: FeedbackService) {}

    /**
     * Images are uploaded first through `POST /uploads` with the `feedback`
     * scope; this call carries their URLs, not their bytes.
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({ type: FeedbackView })
    @ApiBadRequestResponse({ description: 'An attachment URL is not a file this user uploaded for feedback.' })
    async create(@CurrentUser() user: UserEntity, @Body() body: CreateFeedbackInboundDto): Promise<FeedbackView> {
        return FeedbackView.from(await this.feedbackService.create(user.id, body));
    }
}
