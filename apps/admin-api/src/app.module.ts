import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { createLoggerConfig, CustomThrottlerGuard, GlobalExceptionFilter, ResponseInterceptor } from '@dns/api-common';
import { DatabaseConnectionModule } from '@dns/database';

import { AllConfig, appConfig, AppEnv, authConfig, databaseConfig, throttlerConfig } from './common/config';
import { HealthModule } from './modules/health';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            // App-local .env first, then the monorepo root one that
            // docker-compose and the clients also read.
            envFilePath: ['.env', '../../.env'],
            load: [appConfig, authConfig, databaseConfig, throttlerConfig],
        }),
        LoggerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService<AllConfig>) =>
                createLoggerConfig({
                    serviceName: 'admin-api',
                    level: process.env.LOG_LEVEL,
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
        HealthModule,
    ],
    providers: [
        { provide: APP_FILTER, useClass: GlobalExceptionFilter },
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
        { provide: APP_GUARD, useClass: CustomThrottlerGuard },
    ],
})
export class AppModule {}
