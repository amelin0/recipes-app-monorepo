import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { DATABASE_CONNECTION, DatabaseConnectionModule, DrizzleDB } from '@dns/database';

import { AllConfig, appConfig, authConfig, databaseConfig, throttlerConfig } from '../../src/common/config';
import { AuthModule } from '../../src/modules/auth';

export interface AdminTestContext {
    moduleRef: TestingModule;
    db: DrizzleDB;
    close: () => Promise<void>;
}

/**
 * Boots the real auth module against the real database.
 *
 * Nothing is faked. Sign-in has no external dependency worth stubbing — no
 * email, no OAuth provider — so the only reason to mock anything would be
 * speed, and bcrypt at cost 12 is exactly the part whose real timing the
 * suite needs to observe.
 */
export async function createAdminTestContext(): Promise<AdminTestContext> {
    const moduleRef = await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', '../../.env'],
                load: [appConfig, authConfig, databaseConfig, throttlerConfig],
            }),
            DatabaseConnectionModule.forRootAsync({
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService<AllConfig>) => ({
                    url: configService.getOrThrow('database.url', { infer: true }),
                }),
            }),
            AuthModule,
        ],
    }).compile();

    // Without this, `AdminAuthService.onModuleInit` never runs and the dummy
    // hash stays empty — bcrypt then throws on the unknown-account path, which
    // presents as an unrelated 500 in the very test that checks it.
    await moduleRef.init();

    const db = moduleRef.get<DrizzleDB>(DATABASE_CONNECTION);

    return { moduleRef, db, close: () => moduleRef.close() };
}
