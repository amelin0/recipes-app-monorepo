import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { createLoggerConfig, CustomThrottlerGuard, GlobalExceptionFilter, ResponseInterceptor } from '@dns/api-common';
import { StorageModule } from '@dns/api-infrastructure/storage';
import { DatabaseConnectionModule } from '@dns/database';

import {
    AllConfig,
    appConfig,
    AppEnv,
    authConfig,
    databaseConfig,
    storageConfig,
    throttlerConfig,
} from './common/config';
import { AdminJwtGuard, AdminRolesGuard, AuthModule } from './modules/auth';
import { CatalogModule } from './modules/catalog';
import { HealthModule } from './modules/health';
import { ProductModule } from './modules/product';
import { RecipeModule } from './modules/recipe';
import { UploadModule } from './modules/upload';
import { UserModule } from './modules/user';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            // App-local .env first, then the monorepo root one that
            // docker-compose and the clients also read.
            envFilePath: ['.env', '../../.env'],
            load: [appConfig, authConfig, databaseConfig, storageConfig, throttlerConfig],
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
        StorageModule.forRootAsync({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService<AllConfig>) =>
                configService.getOrThrow('storage', { infer: true }),
        }),
        AuthModule,
        CatalogModule,
        ProductModule,
        RecipeModule,
        UserModule,
        UploadModule,
        HealthModule,
    ],
    providers: [
        { provide: APP_FILTER, useClass: GlobalExceptionFilter },
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
        { provide: APP_GUARD, useClass: CustomThrottlerGuard },
        // Deny-by-default (ADR-0003): every route needs a session unless it
        // carries `@Public()`. The client API guards per controller instead —
        // there a forgotten guard exposes one endpoint of one user's data;
        // here it would expose the catalogue and every user record.
        //
        // Order is load-bearing. Nest runs global guards in registration
        // order, and AdminRolesGuard reads the entity that AdminJwtGuard puts
        // on the request: swap these two and every @Roles route throws 403 for
        // everybody, including a SUPER_ADMIN.
        { provide: APP_GUARD, useClass: AdminJwtGuard },
        { provide: APP_GUARD, useClass: AdminRolesGuard },
    ],
})
export class AppModule {}
