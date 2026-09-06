import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { OtpCodeRepositoryModule, RefreshTokenRepositoryModule, UserRepositoryModule } from '@dns/database';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtGuard } from './guards';
import { OtpMailer } from './otp.mailer';
import { AuthOtpService } from './otp.service';
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
    ],
    controllers: [AuthController],
    providers: [AuthService, AuthOtpService, OtpMailer, TokenService, JwtStrategy, JwtGuard],
    exports: [JwtGuard, TokenService],
})
export class AuthModule {}
