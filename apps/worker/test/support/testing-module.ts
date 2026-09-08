import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { NotificationsProducerModule } from '@dns/api-common';
import { DATABASE_CONNECTION, DatabaseConnectionModule, DrizzleDB } from '@dns/database';
import {
    NotificationRepositoryModule,
    OtpCodeRepositoryModule,
    PasswordResetPermitRepositoryModule,
    RefreshTokenRepositoryModule,
    SubscriptionRepositoryModule,
} from '@dns/database';

import { AllConfig, appConfig, databaseConfig, jobsConfig, redisConfig } from '../../src/common/config';
import { ExpiredRowsService } from '../../src/jobs/cleanup/expired-rows.service';
import { SubscriptionExpiryService } from '../../src/jobs/subscription/subscription-expiry.service';

export interface WorkerTestContext {
    moduleRef: TestingModule;
    db: DrizzleDB;
    close: () => Promise<void>;
}

/**
 * The jobs against a real database, and **no queue**.
 *
 * BullMQ is deliberately absent: what is worth testing is what a job does to
 * the data, and wiring in Redis would make every one of these tests depend on
 * a second service to prove something that has nothing to do with it. The
 * processor that maps a job name to one of these services is four lines and
 * is covered by the fact that the worker boots.
 */
export async function createWorkerTestContext(): Promise<WorkerTestContext> {
    const moduleRef = await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', '../../.env'],
                load: [appConfig, databaseConfig, redisConfig, jobsConfig],
            }),
            DatabaseConnectionModule.forRootAsync({
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService<AllConfig>) => ({
                    url: configService.getOrThrow('database.url', { infer: true }),
                }),
            }),
            RefreshTokenRepositoryModule,
            OtpCodeRepositoryModule,
            PasswordResetPermitRepositoryModule,
            SubscriptionRepositoryModule,
            NotificationRepositoryModule,
            NotificationsProducerModule,
        ],
        providers: [ExpiredRowsService, SubscriptionExpiryService],
    }).compile();

    await moduleRef.init();

    const db = moduleRef.get<DrizzleDB>(DATABASE_CONNECTION);

    return { moduleRef, db, close: () => moduleRef.close() };
}
