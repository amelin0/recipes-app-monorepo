import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { createLoggerConfig, CustomThrottlerGuard, GlobalExceptionFilter, ResponseInterceptor } from '@dns/api-common';
import { EmailModule } from '@dns/api-infrastructure/email';
import { OAuthModule } from '@dns/api-infrastructure/oauth';
import { OtpModule } from '@dns/api-infrastructure/otp';
import { StorageModule } from '@dns/api-infrastructure/storage';
import { DatabaseConnectionModule } from '@dns/database';

import {
    AllConfig,
    appConfig,
    AppEnv,
    authConfig,
    databaseConfig,
    emailConfig,
    oauthConfig,
    otpConfig,
    storageConfig,
    throttlerConfig,
} from './common/config';
import { AuthModule } from './modules/auth';
import { CatalogModule } from './modules/catalog';
import { HealthModule } from './modules/health';
import { MealPlanModule } from './modules/meal-plan';
import { NutritionModule } from './modules/nutrition';
import { ProgressModule } from './modules/progress';
import { UploadsModule } from './modules/uploads';
import { UserModule } from './modules/user';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            // App-local .env first, then the monorepo root one that
            // docker-compose and the clients also read.
            envFilePath: ['.env', '../../.env'],
            load: [
                appConfig,
                authConfig,
                databaseConfig,
                emailConfig,
                oauthConfig,
                otpConfig,
                storageConfig,
                throttlerConfig,
            ],
        }),
        LoggerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService<AllConfig>) =>
                createLoggerConfig({
                    serviceName: 'client-api',
                    level: process.env.LOG_LEVEL,
                    // JSON everywhere except a developer's terminal — a log
                    // collector parses the JSON, pino-pretty output is opaque to it.
                    pretty: configService.getOrThrow('app.env', { infer: true }) === AppEnv.Dev,
                }),
        }),
        ThrottlerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService<AllConfig>) => [
                {
                    ttl: configService.getOrThrow('throttler.global.ttl', { infer: true }),
                    limit: configService.getOrThrow('throttler.global.limit', { infer: true }),
                },
            ],
        }),
        DatabaseConnectionModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService<AllConfig>) => ({
                url: configService.getOrThrow('database.url', { infer: true }),
            }),
        }),
        EmailModule.forRootAsync({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService<AllConfig>) => configService.getOrThrow('email', { infer: true }),
        }),
        OAuthModule.forRootAsync({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService<AllConfig>) => configService.getOrThrow('oauth', { infer: true }),
        }),
        OtpModule.forRootAsync({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService<AllConfig>) => configService.getOrThrow('otp', { infer: true }),
        }),
        StorageModule.forRootAsync({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService<AllConfig>) =>
                configService.getOrThrow('storage', { infer: true }),
        }),
        AuthModule,
        HealthModule,
        UserModule,
        UploadsModule,
        NutritionModule,
        ProgressModule,
        CatalogModule,
        MealPlanModule,
    ],
    providers: [
        { provide: APP_FILTER, useClass: GlobalExceptionFilter },
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
        { provide: APP_GUARD, useClass: CustomThrottlerGuard },
    ],
})
export class AppModule {}
