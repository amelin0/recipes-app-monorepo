import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';

import { GlobalExceptionFilter, createLoggerConfig } from '@dns/api-common';
import { DatabaseConnectionModule } from '@dns/database';

import { AllConfig, appConfig, databaseConfig, jobsConfig, redisConfig } from './common/config';
import { HealthController } from './health/health.controller';
import { JOBS_QUEUE } from './jobs/jobs.constants';
import { JobsModule } from './jobs/jobs.module';

/**
 * The background worker (ADR-0008).
 *
 * Deliberately not a module inside the API: the jobs here are the ones that
 * happen because time passed rather than because somebody asked, and running
 * them inside a process that scales horizontally would mean running them N
 * times at once.
 *
 * It shares the image with the APIs and differs only in what it starts, so
 * there is one build, one dependency set and one place where a repository
 * lives.
 */
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env', '../../.env'],
            load: [appConfig, databaseConfig, redisConfig, jobsConfig],
        }),
        LoggerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService<AllConfig>) =>
                createLoggerConfig({
                    serviceName: 'worker',
                    level: process.env.LOG_LEVEL,
                    pretty: configService.getOrThrow('app.env', { infer: true }) === 'development',
                }),
        }),
        DatabaseConnectionModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService<AllConfig>) => ({
                url: configService.getOrThrow('database.url', { infer: true }),
            }),
        }),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService<AllConfig>) => ({
                connection: { url: configService.getOrThrow('redis.url', { infer: true }) },
            }),
        }),
        // Registered here as well so the health route can read the queue
        // without importing the jobs module's providers.
        BullModule.registerQueue({ name: JOBS_QUEUE }),
        JobsModule,
    ],
    controllers: [HealthController],
    providers: [{ provide: APP_FILTER, useClass: GlobalExceptionFilter }],
})
export class AppModule {}
