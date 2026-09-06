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
import { UserEntity } from '@dns/database';

import { ThrottleKey } from '../../common/config';

import { AuthService } from './auth.service';
import { CurrentUser, Public } from './decorators';
import {
    AuthTokensView,
    CurrentUserView,
    LoginInboundDto,
    RegisterInboundDto,
    ResendEmailCodeInboundDto,
    VerifyEmailInboundDto,
} from './dto';
import { JwtGuard } from './guards';

@ApiTags('auth')
@Controller('auth')
@UseGuards(JwtGuard)
export class AuthController {
    constructor(private readonly authService: AuthService) {}

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
    me(@CurrentUser() user: UserEntity): CurrentUserView {
        return CurrentUserView.from(user);
    }
}
