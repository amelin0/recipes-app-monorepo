import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { UserEntity } from '@dns/database';

import { CurrentUser } from '../auth/decorators';
import { JwtGuard } from '../auth/guards';

import { ProfileView, UpdateProfileInboundDto, UpdateSettingsInboundDto, UserSettingsView } from './dto';
import { ProfileService } from './profile.service';

@ApiTags('profile')
@Controller('profile')
@UseGuards(JwtGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing, expired or revoked access token.' })
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    /**
     * The whole profile screen in one read. Settings are embedded rather than
     * fetched separately: the rows show their current value as a subtitle, and
     * a second round trip for six fields would be a worse trade than the
     * slightly larger payload.
     */
    @Get()
    @ApiOkResponse({ type: ProfileView })
    async get(@CurrentUser() user: UserEntity): Promise<ProfileView> {
        return ProfileView.from(user, await this.profileService.getScreen(user));
    }

    @Patch()
    @ApiOkResponse({ type: ProfileView })
    async update(@CurrentUser() user: UserEntity, @Body() body: UpdateProfileInboundDto): Promise<ProfileView> {
        const profile = await this.profileService.updateProfile(user, body);
        // Echo the row this request wrote, not a re-read that a concurrent
        // write could have moved on.
        return ProfileView.from(user, { ...(await this.profileService.getScreen(user)), profile });
    }

    @Patch('settings')
    @ApiOkResponse({ type: UserSettingsView })
    async updateSettings(
        @CurrentUser() user: UserEntity,
        @Body() body: UpdateSettingsInboundDto,
    ): Promise<UserSettingsView> {
        return UserSettingsView.from(await this.profileService.updateSettings(user, body));
    }
}
