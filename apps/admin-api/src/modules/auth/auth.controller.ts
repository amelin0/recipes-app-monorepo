import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiNoContentResponse,
    ApiOkResponse,
    ApiTags,
    ApiTooManyRequestsResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { SetThrottleKey } from '@dns/api-common';
import { AdminEntity } from '@dns/database';

import { ThrottleKey } from '../../common/config';

import { AdminAuthService } from './auth.service';
import { AttemptContext } from './auth.types';
import { CurrentAdmin, Public } from './decorators';
import { AdminLoginInboundDto, AdminProfileView, AdminRefreshTokenInboundDto, AdminSessionView } from './dto';
import { AdminTokenService } from './token.service';

@ApiTags('auth')
@Controller('auth')
export class AdminAuthController {
    constructor(
        private readonly authService: AdminAuthService,
        private readonly tokenService: AdminTokenService,
    ) {}

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @SetThrottleKey(ThrottleKey.Login)
    @ApiOkResponse({ type: AdminSessionView })
    @ApiUnauthorizedResponse({
        description:
            'One answer for every failure: unknown address, wrong password, deactivated account, or an app user rather than staff (sign-in FR-003, FR-004).',
    })
    @ApiTooManyRequestsResponse({ description: 'Rate limit for this address or source.' })
    async login(@Body() body: AdminLoginInboundDto, @Req() request: Request): Promise<AdminSessionView> {
        const result = await this.authService.login(body, attemptContext(request));
        return AdminSessionView.from(result, result.admin);
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @SetThrottleKey(ThrottleKey.RefreshToken)
    @ApiOkResponse({ type: AdminSessionView })
    @ApiUnauthorizedResponse({
        description: 'Unknown, expired or already-spent token. A replay past the grace window revokes the chain.',
    })
    async refresh(@Body() body: AdminRefreshTokenInboundDto): Promise<AdminSessionView> {
        const result = await this.tokenService.rotate(body.refreshToken);
        return AdminSessionView.from(result, result.admin);
    }

    @Public()
    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Ends this browser session. Always 204, valid token or not.' })
    async logout(@Body() body: AdminRefreshTokenInboundDto): Promise<void> {
        await this.tokenService.revokeChain(body.refreshToken);
    }

    @Post('logout-all')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth()
    @ApiNoContentResponse({ description: 'Ends every session of this account, on every machine.' })
    async logoutAll(@CurrentAdmin() admin: AdminEntity): Promise<void> {
        await this.tokenService.revokeAllForAdmin(admin.id);
    }

    @Get('me')
    @ApiBearerAuth()
    @ApiOkResponse({ type: AdminProfileView })
    @ApiUnauthorizedResponse({ description: 'Missing, expired or revoked token — or the account was deactivated.' })
    me(@CurrentAdmin() admin: AdminEntity): AdminProfileView {
        // The entity is read fresh by the strategy on every request, so this
        // route is also how the panel learns that an account was deactivated.
        return AdminProfileView.from(admin);
    }
}

/**
 * Client address and agent for the journal (sign-in FR-009).
 *
 * `X-Forwarded-For` is set by our own nginx and holds a list on the way
 * through; the first entry is the original client. It is still attacker-
 * controlled data — anything can be in there — which is why the column is
 * `text` and nothing parses it.
 */
function attemptContext(request: Request): AttemptContext {
    const forwarded = request.headers['x-forwarded-for'];
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];

    return {
        ip: first?.trim() || request.ip || null,
        userAgent: request.headers['user-agent']?.slice(0, 500) ?? null,
    };
}
