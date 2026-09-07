import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import {
    AdminLoginAttemptRepositoryModule,
    AdminRefreshTokenRepositoryModule,
    AdminRepositoryModule,
} from '@dns/database';

import { AdminsController } from './admins.controller';
import { AdminAuthController } from './auth.controller';
import { AdminAuthService } from './auth.service';
import { AdminJwtStrategy } from './strategies/jwt.strategy';
import { AdminTokenService } from './token.service';

@Module({
    imports: [
        ConfigModule,
        PassportModule,
        // Secrets are passed per call in AdminTokenService, because access and
        // refresh are signed with different ones — registering a single global
        // secret here would quietly make them interchangeable.
        JwtModule.register({}),
        AdminRepositoryModule,
        AdminRefreshTokenRepositoryModule,
        AdminLoginAttemptRepositoryModule,
    ],
    controllers: [AdminAuthController, AdminsController],
    providers: [AdminAuthService, AdminTokenService, AdminJwtStrategy],
    exports: [AdminAuthService, AdminTokenService],
})
export class AuthModule {}
