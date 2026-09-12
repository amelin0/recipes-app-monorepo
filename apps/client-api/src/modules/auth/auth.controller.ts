import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiNoContentResponse,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { SetThrottleKey } from '@dns/api-common';
import { AccountDeletionRequestRepository, UserEntity } from '@dns/database';

import { ThrottleKey } from '../../common/config';

import { AuthService } from './auth.service';
import { CurrentUser, Public } from './decorators';
import {
    AuthTokensView,
    CurrentUserView,
    LoginInboundDto,
    OAuthSignInInboundDto,
    PasswordResetPermitView,
    RefreshTokenInboundDto,
    RegisterInboundDto,
    RequestPasswordResetInboundDto,
    ResendEmailCodeInboundDto,
    SetNewPasswordInboundDto,
    VerifyEmailInboundDto,
    VerifyPasswordResetCodeInboundDto,
} from './dto';
import { JwtGuard } from './guards';
import { OAuthSignInService } from './oauth.service';
import { PasswordResetService } from './password-reset.service';
import { TokenService } from './token.service';

@ApiTags('auth')
@Controller('auth')
@UseGuards(JwtGuard)
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly tokenService: TokenService,
        private readonly passwordResetService: PasswordResetService,
        private readonly oauthSignInService: OAuthSignInService,
        private readonly deletionRequestRepository: AccountDeletionRequestRepository,
    ) {}

    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @SetThrottleKey(ThrottleKey.Register)
    @ApiCreatedResponse({ description: 'Account created; a verification code was emailed.' })
    @ApiConflictResponse({ description: 'A verified account already uses this email.' })
    async register(@Body() body: RegisterInboundDto): Promise<void> {
        await this.authService.register(body);
    }

    @Public()
    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    // Its own key, tighter than the endpoints a person clicks: the mobile
    // screen fires this automatically on the sixth digit (sign-up FR-014),
    // so a mistyped code costs a request without any button being pressed.
    @SetThrottleKey(ThrottleKey.VerifyOtp)
    @ApiOkResponse({ type: AuthTokensView })
    async verifyEmail(@Body() body: VerifyEmailInboundDto): Promise<AuthTokensView> {
        return AuthTokensView.from(await this.authService.verifyEmail(body));
    }

    @Public()
    @Post('resend-code')
    @HttpCode(HttpStatus.NO_CONTENT)
    @SetThrottleKey(ThrottleKey.SendOtp)
    @ApiNoContentResponse({ description: 'Always 204 — the response never reveals whether the account exists.' })
    async resendEmailCode(@Body() body: ResendEmailCodeInboundDto): Promise<void> {
        await this.authService.resendEmailCode(body);
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @SetThrottleKey(ThrottleKey.Login)
    @ApiOkResponse({ type: AuthTokensView })
    @ApiUnauthorizedResponse({ description: 'One answer for every failure — see sign-in FR-002.' })
    @ApiForbiddenResponse({ description: 'Email not verified; a fresh code was sent.' })
    async login(@Body() body: LoginInboundDto): Promise<AuthTokensView> {
        return AuthTokensView.from(await this.authService.login(body));
    }

    @Get('me')
    @ApiBearerAuth()
    @ApiOkResponse({ type: CurrentUserView })
    @ApiUnauthorizedResponse({ description: 'Missing, expired or revoked access token.' })
    async me(@CurrentUser() user: UserEntity): Promise<CurrentUserView> {
        // Read here rather than in the strategy: this is the one route that
        // has to report it, and every other authenticated request would pay
        // for a lookup it never uses.
        const pendingDeletion = await this.deletionRequestRepository.findActive(user.id);
        return CurrentUserView.from(user, pendingDeletion?.scheduledFor ?? null);
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @SetThrottleKey(ThrottleKey.RefreshToken)
    @ApiOkResponse({ type: AuthTokensView })
    @ApiUnauthorizedResponse({
        description:
            'Unknown, expired or already-spent token. A replay more than 10 seconds after the rotation revokes ' +
            'the chain; exactly one replay inside that window is answered with a sibling pair instead — see the ' +
            'session spec, Edge Cases.',
    })
    async refresh(@Body() body: RefreshTokenInboundDto): Promise<AuthTokensView> {
        return AuthTokensView.from(await this.tokenService.rotate(body.refreshToken));
    }

    @Public()
    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiNoContentResponse({ description: 'Ends this device session. Always 204, valid token or not.' })
    async logout(@Body() body: RefreshTokenInboundDto): Promise<void> {
        await this.tokenService.revokeChain(body.refreshToken);
    }

    @Post('logout-all')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth()
    @ApiNoContentResponse({ description: 'Ends every session of the account.' })
    async logoutAll(@CurrentUser() user: UserEntity): Promise<void> {
        await this.tokenService.revokeAllForUser(user.id);
    }

    @Public()
    @Post('password-reset/request')
    @HttpCode(HttpStatus.NO_CONTENT)
    @SetThrottleKey(ThrottleKey.PasswordReset)
    @ApiNoContentResponse({ description: 'Always 204 — the response never reveals whether the account exists.' })
    async requestPasswordReset(@Body() body: RequestPasswordResetInboundDto): Promise<void> {
        await this.passwordResetService.request(body);
    }

    @Public()
    @Post('password-reset/verify')
    @HttpCode(HttpStatus.OK)
    @SetThrottleKey(ThrottleKey.VerifyOtp)
    @ApiOkResponse({ type: PasswordResetPermitView })
    async verifyPasswordResetCode(@Body() body: VerifyPasswordResetCodeInboundDto): Promise<PasswordResetPermitView> {
        return PasswordResetPermitView.from(await this.passwordResetService.verifyCode(body));
    }

    @Public()
    @Post('password-reset/complete')
    @HttpCode(HttpStatus.NO_CONTENT)
    @SetThrottleKey(ThrottleKey.PasswordReset)
    @ApiNoContentResponse({
        description: 'Password changed. Every session is revoked and no new one is issued (FR-005, FR-009).',
    })
    @ApiUnauthorizedResponse({ description: 'Permit is unknown, expired or already spent.' })
    async setNewPassword(@Body() body: SetNewPasswordInboundDto): Promise<void> {
        await this.passwordResetService.setNewPassword(body);
    }

    @Public()
    @Post('oauth')
    @HttpCode(HttpStatus.OK)
    @SetThrottleKey(ThrottleKey.OauthGoogle)
    @ApiOkResponse({ type: AuthTokensView, description: 'Signs in, links, or creates — one endpoint for all three.' })
    @ApiUnauthorizedResponse({ description: 'The provider token did not verify.' })
    async oauthSignIn(@Body() body: OAuthSignInInboundDto): Promise<AuthTokensView> {
        return AuthTokensView.from(await this.oauthSignInService.signIn(body));
    }
}
