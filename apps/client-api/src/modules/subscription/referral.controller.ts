import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { UserEntity } from '@dns/database';

import { CurrentUser } from '../auth/decorators';
import { JwtGuard } from '../auth/guards';

import { ReferralOverviewView } from './dto';
import { SubscriptionService } from './subscription.service';

@ApiTags('referral')
@Controller('profile/referral')
@UseGuards(JwtGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing, expired or revoked access token.' })
export class ReferralController {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    /**
     * The referral screen: this account's own code and how it has done
     * (referral FR-001, FR-004).
     *
     * Under `/profile` rather than `/subscription` because it is a property
     * of the person, not of anything they bought — the screen lives in the
     * profile, and somebody with no subscription still has a code to share.
     */
    @Get()
    @ApiOkResponse({ type: ReferralOverviewView })
    async referral(@CurrentUser() user: UserEntity): Promise<ReferralOverviewView> {
        return ReferralOverviewView.from(await this.subscriptionService.referral(user.id));
    }
}
