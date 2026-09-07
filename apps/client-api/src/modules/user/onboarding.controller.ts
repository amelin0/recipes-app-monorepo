import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { UserEntity } from '@dns/database';

import { CurrentUser } from '../auth/decorators';
import { JwtGuard } from '../auth/guards';

import {
    CompleteOnboardingInboundDto,
    OnboardingStateView,
    RecommendationsView,
    SaveOnboardingStepInboundDto,
} from './dto';
import { OnboardingService } from './onboarding.service';
import { ProfileService } from './profile.service';

@ApiTags('profile')
@Controller('profile')
@UseGuards(JwtGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing, expired or revoked access token.' })
export class OnboardingController {
    constructor(
        private readonly onboardingService: OnboardingService,
        private readonly profileService: ProfileService,
    ) {}

    /**
     * Where the questionnaire stands. Read on launch: the state lives on the
     * account, not the device, so a new phone resumes rather than restarts
     * (FR-001).
     */
    @Get('onboarding')
    @ApiOkResponse({ type: OnboardingStateView })
    async get(@CurrentUser() user: UserEntity): Promise<OnboardingStateView> {
        const { profile } = await this.profileService.getAggregate(user);
        return OnboardingStateView.from(profile);
    }

    /** Saves one step's answer. `PUT` because each call replaces what that answer was. */
    @Put('onboarding')
    @ApiOkResponse({ type: OnboardingStateView })
    async save(
        @CurrentUser() user: UserEntity,
        @Body() body: SaveOnboardingStepInboundDto,
    ): Promise<OnboardingStateView> {
        const { profile } = await this.profileService.getAggregate(user);
        return OnboardingStateView.from(await this.onboardingService.saveStep(profile, body));
    }

    /**
     * Ends the questionnaire and turns its answers into the daily goal.
     *
     * A verb sub-resource (ADR-0004, rule 7): completion is not the creation
     * of a thing, and `PUT /profile/onboarding` already means «save an
     * answer» — overloading it with «and also finish» would hide the
     * side effect that writes a goal.
     */
    @Post('onboarding/complete')
    @ApiOkResponse({ type: OnboardingStateView })
    @ApiBadRequestResponse({ description: 'Some questions are still unanswered.' })
    async complete(
        @CurrentUser() user: UserEntity,
        @Body() body: CompleteOnboardingInboundDto,
    ): Promise<OnboardingStateView> {
        const { profile } = await this.profileService.getAggregate(user);
        return OnboardingStateView.from(await this.onboardingService.complete(profile, body));
    }

    /**
     * What the server suggests for this person, recomputed from the profile as
     * it stands. Null while the questionnaire has not collected enough.
     */
    @Get('recommendations')
    @ApiOkResponse({ type: RecommendationsView, description: 'Null until the questionnaire has enough answers.' })
    async recommendations(@CurrentUser() user: UserEntity): Promise<RecommendationsView | null> {
        const { profile } = await this.profileService.getAggregate(user);
        const recommendations = this.onboardingService.recommendations(profile);

        return recommendations ? RecommendationsView.from(recommendations) : null;
    }
}
