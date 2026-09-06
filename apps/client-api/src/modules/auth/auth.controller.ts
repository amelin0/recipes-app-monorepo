import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiConflictResponse, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { SetThrottleKey } from '@dns/api-common';

import { ThrottleKey } from '../../common/config';

import { AuthService } from './auth.service';
import { Public } from './decorators';
import { AuthTokensView, RegisterInboundDto, ResendEmailCodeInboundDto, VerifyEmailInboundDto } from './dto';
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
}
