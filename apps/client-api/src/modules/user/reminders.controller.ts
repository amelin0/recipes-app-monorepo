import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { UserEntity } from '@dns/database';

import { CurrentUser } from '../auth/decorators';
import { JwtGuard } from '../auth/guards';

import { ReminderView, UpdateRemindersInboundDto } from './dto';
import { RemindersService } from './reminders.service';

@ApiTags('profile')
@Controller('profile/reminders')
@UseGuards(JwtGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing, expired or revoked access token.' })
export class RemindersController {
    constructor(private readonly remindersService: RemindersService) {}

    @Get()
    @ApiOkResponse({ type: [ReminderView] })
    async list(@CurrentUser() user: UserEntity): Promise<ReminderView[]> {
        return (await this.remindersService.list(user.id)).map(ReminderView.from);
    }

    /**
     * `PUT`, not `PATCH`: the screen saves the whole schedule at once, so the
     * request replaces it wholesale. The same rows back the questionnaire
     * step, which is what makes the two screens agree (FR-006).
     */
    @Put()
    @ApiOkResponse({ type: [ReminderView] })
    async update(@CurrentUser() user: UserEntity, @Body() body: UpdateRemindersInboundDto): Promise<ReminderView[]> {
        return (await this.remindersService.update(user.id, body)).map(ReminderView.from);
    }
}
