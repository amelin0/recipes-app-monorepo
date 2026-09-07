import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { EmailModule } from '@dns/api-infrastructure/email';
import { OAuthModule, OAuthService, OAuthUserPayload } from '@dns/api-infrastructure/oauth';
import { OtpModule } from '@dns/api-infrastructure/otp';
import { StorageModule } from '@dns/api-infrastructure/storage';
import { DATABASE_CONNECTION, DatabaseConnectionModule, DrizzleDB } from '@dns/database';
import { OAuthProvider } from '@dns/shared-types';

import {
    AllConfig,
    appConfig,
    authConfig,
    databaseConfig,
    emailConfig,
    oauthConfig,
    otpConfig,
    storageConfig,
    throttlerConfig,
} from '../../src/common/config';
import { AuthModule } from '../../src/modules/auth';
import { CatalogModule } from '../../src/modules/catalog';
import { MealPlanModule } from '../../src/modules/meal-plan';
import { NutritionModule } from '../../src/modules/nutrition';
import { ProgressModule } from '../../src/modules/progress';
import { ShoppingListModule } from '../../src/modules/shopping-list';
import { UserModule } from '../../src/modules/user';

/**
 * Stands in for Apple and Google. Their tokens cannot be minted in a test, so
 * the verification step is replaced and everything after it — the create,
 * link and repeat-sign-in branches — runs for real.
 */
export class FakeOAuthVerifier {
    private next: OAuthUserPayload | null = null;

    willReturn(provider: OAuthProvider, providerUserId: string, email: string): void {
        this.next = { provider, providerUserId, email };
    }

    verifyIdToken(): Promise<OAuthUserPayload> {
        if (!this.next) throw new Error('FakeOAuthVerifier: no payload staged');
        return Promise.resolve(this.next);
    }
}

export interface AuthTestContext {
    moduleRef: TestingModule;
    db: DrizzleDB;
    oauth: FakeOAuthVerifier;
    close: () => Promise<void>;
}

export async function createAuthTestContext(): Promise<AuthTestContext> {
    const oauth = new FakeOAuthVerifier();

    const moduleRef = await Test.createTestingModule({
        imports: [
            ConfigModule.forRoot({
                isGlobal: true,
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
            DatabaseConnectionModule.forRootAsync({
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService<AllConfig>) => ({
                    url: configService.getOrThrow('database.url', { infer: true }),
                }),
            }),
            // No RESEND_API_KEY in the test env, so the stub client is wired
            // and codes are logged rather than sent.
            EmailModule.forRootAsync({
                isGlobal: true,
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService<AllConfig>) =>
                    configService.getOrThrow('email', { infer: true }),
            }),
            // Registered so `.overrideProvider(OAuthService)` below has
            // something to replace; the client ids are never read.
            OAuthModule.forRootAsync({
                isGlobal: true,
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService<AllConfig>) =>
                    configService.getOrThrow('oauth', { infer: true }),
            }),
            OtpModule.forRootAsync({
                isGlobal: true,
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService<AllConfig>) =>
                    configService.getOrThrow('otp', { infer: true }),
            }),
            // Registered here because AppModule registers it globally, and
            // ProfileService and FeedbackService both take StorageService.
            StorageModule.forRootAsync({
                isGlobal: true,
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService<AllConfig>) =>
                    configService.getOrThrow('storage', { infer: true }),
            }),
            AuthModule,
            UserModule,
            NutritionModule,
            ProgressModule,
            CatalogModule,
            MealPlanModule,
            ShoppingListModule,
        ],
    })
        .overrideProvider(OAuthService)
        .useValue(oauth)
        .compile();

    const db = moduleRef.get<DrizzleDB>(DATABASE_CONNECTION);

    return {
        moduleRef,
        db,
        oauth,
        close: () => moduleRef.close(),
    };
}
