import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { THROTTLER_IDENTITY_VERIFIER } from '@dns/api-common';
import {
    AccountDeletionRequestRepositoryModule,
    OAuthIdentityRepositoryModule,
    OtpCodeRepositoryModule,
    PasswordResetPermitRepositoryModule,
    RefreshTokenRepositoryModule,
    UserRepositoryModule,
} from '@dns/database';

import { AccessTokenIdentityVerifier } from './access-token-identity.verifier';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtGuard } from './guards';
import { OAuthSignInService } from './oauth.service';
import { OtpMailer } from './otp.mailer';
import { AuthOtpService } from './otp.service';
import { PasswordResetService } from './password-reset.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenService } from './token.service';

@Module({
    imports: [
        ConfigModule,
        PassportModule,
        // Secrets are passed per call in TokenService rather than registered
        // here: access and refresh are signed with different keys, and a
        // module-level default would make it easy to sign one with the other.
        JwtModule.register({}),
        UserRepositoryModule,
        RefreshTokenRepositoryModule,
        OtpCodeRepositoryModule,
        PasswordResetPermitRepositoryModule,
        OAuthIdentityRepositoryModule,
        AccountDeletionRequestRepositoryModule,
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        AuthOtpService,
        PasswordResetService,
        OAuthSignInService,
        OtpMailer,
        TokenService,
        JwtStrategy,
        JwtGuard,
        // Consumed by the global CustomThrottlerGuard in AppModule, which can
        // only see what this module exports.
        { provide: THROTTLER_IDENTITY_VERIFIER, useClass: AccessTokenIdentityVerifier },
    ],
    exports: [JwtGuard, TokenService, THROTTLER_IDENTITY_VERIFIER],
})
export class AuthModule {}
