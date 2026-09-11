import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiParam,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UserEntity } from '@dns/database';

import { CurrentUser } from '../auth/decorators';
import { JwtGuard } from '../auth/guards';

import {
    PaywallView,
    RedeemReferralInboundDto,
    ReferralCodeParam,
    ReferralOfferView,
    SubmitReceiptInboundDto,
    SubscriptionStateView,
    SubscriptionView,
} from './dto';
import { SubscriptionService } from './subscription.service';

@ApiTags('subscription')
@Controller('subscription')
@UseGuards(JwtGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing, expired or revoked access token.' })
export class SubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    /**
     * Everything the paywall draws: the plans, their saving badges, and the
     * list of what a subscription unlocks. One request, because the screen
     * shows all of it at once.
     */
    @Get('plans')
    @ApiOkResponse({ type: PaywallView })
    async plans(@CurrentUser() user: UserEntity): Promise<PaywallView> {
        return PaywallView.from(await this.subscriptionService.paywall(user.id));
    }

    /**
     * Whether this account is subscribed, and whether the paywall still owes
     * it an appearance. State lives here rather than on the device so it
     * follows the account between them (FR-015).
     */
    @Get()
    @ApiOkResponse({ type: SubscriptionStateView })
    async state(@CurrentUser() user: UserEntity): Promise<SubscriptionStateView> {
        return SubscriptionStateView.from(await this.subscriptionService.state(user.id));
    }

    /**
     * “Пропустити”. A sub-resource rather than a flag in a body: it is a
     * one-way switch, and pressing it twice has to mean what it meant once.
     */
    @Put('paywall/seen')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'The paywall will not open by itself again.' })
    async dismissPaywall(@CurrentUser() user: UserEntity): Promise<void> {
        await this.subscriptionService.dismissPaywall(user.id);
    }

    /**
     * The receipt the store handed the app.
     *
     * The plan is looked up from the store's product id and never taken from
     * the body — otherwise a month could be paid for and a year asked for.
     * Answering with the finished subscription is what makes the confirmation
     * screen reachable only after payment (FR-012). A receipt on an account
     * that already has a subscription is recorded, not refused — the answer is
     * the subscription the account has once it is applied.
     */
    @Post('receipt')
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({
        type: SubscriptionView,
        description: 'The account’s subscription after the receipt: the one it opened, or the one that still stands.',
    })
    @ApiBadRequestResponse({ description: 'Receipt already used by another account, or unknown product.' })
    async submitReceipt(
        @CurrentUser() user: UserEntity,
        @Body() body: SubmitReceiptInboundDto,
    ): Promise<SubscriptionView> {
        return SubscriptionView.from(await this.subscriptionService.redeemReceipt(user.id, body));
    }

    /** What a code grants, without spending it — what the banner on the paywall prints (FR-008). */
    @Get('referral-codes/:code')
    @ApiParam({ name: 'code', example: 'K7XM2QAB' })
    @ApiOkResponse({ type: ReferralOfferView })
    @ApiNotFoundResponse({ description: 'No such code.' })
    @ApiBadRequestResponse({ description: 'Own code, or this account has already redeemed one.' })
    async describeCode(
        @CurrentUser() user: UserEntity,
        @Param() params: ReferralCodeParam,
    ): Promise<ReferralOfferView> {
        return ReferralOfferView.from(await this.subscriptionService.describeCode(user.id, params.code));
    }

    /**
     * Spending a code. No store is involved — the month is given, not sold —
     * so this is its own route rather than a field on the receipt.
     */
    @Post('redemptions')
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({ type: SubscriptionView })
    @ApiNotFoundResponse({ description: 'No such code.' })
    @ApiBadRequestResponse({ description: 'Own code, already redeemed, or already subscribed.' })
    async redeemCode(
        @CurrentUser() user: UserEntity,
        @Body() body: RedeemReferralInboundDto,
    ): Promise<SubscriptionView> {
        return SubscriptionView.from(await this.subscriptionService.redeemCode(user.id, body.code));
    }
}
