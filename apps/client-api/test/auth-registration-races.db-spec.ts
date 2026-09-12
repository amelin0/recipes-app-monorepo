import { ConflictException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { schema } from '@dns/database';
import { AuthTokens, OAuthProvider } from '@dns/shared-types';

import { AuthService } from '../src/modules/auth/auth.service';
import { OAuthSignInService } from '../src/modules/auth/oauth.service';

import { truncateAuthTables } from './support/db';
import { AuthTestContext, createAuthTestContext } from './support/testing-module';

const EMAIL = 'double-tap@example.com';
const PASSWORD = 'passw0rd';
// OTP_DEV_CODE in .env pins the generated code, so the test knows the answer.
const DEV_CODE = '000000';
const BURST = 5;

/**
 * A double-tapped «Sign up» or «Continue with Google»: every request of the
 * burst reads «nobody yet» and inserts. The unique indexes decide who wins;
 * these tests pin that the losers resolve to the winner's account instead of
 * surfacing the violation as a 500.
 */
describe('First sign-up under concurrency', () => {
    let ctx: AuthTestContext;
    let authService: AuthService;
    let oauthSignIn: OAuthSignInService;

    beforeAll(async () => {
        ctx = await createAuthTestContext();
        authService = ctx.moduleRef.get(AuthService);
        oauthSignIn = ctx.moduleRef.get(OAuthSignInService);
    });

    afterAll(async () => {
        await ctx.close();
    });

    beforeEach(async () => {
        await truncateAuthTables(ctx.db);
    });

    /**
     * Stages the provider's answer and starts the sign-in. `signIn` asks the
     * (fake) verifier before its first await, so each call captures the
     * payload staged just before it even when the calls then run in parallel.
     */
    const startOAuth = (provider: OAuthProvider, providerUserId: string): Promise<AuthTokens> => {
        ctx.oauth.willReturn(provider, providerUserId, EMAIL);
        return oauthSignIn.signIn({ provider, idToken: 'stub' });
    };

    it('parallel registrations of a new address all succeed onto one account', async () => {
        const results = await Promise.allSettled(
            Array.from({ length: BURST }, () => authService.register({ email: EMAIL, password: PASSWORD })),
        );

        expect(results.filter(result => result.status === 'rejected')).toEqual([]);
        expect(await ctx.db.query.users.findMany()).toHaveLength(1);

        // One live code, bound to one of the submitted passwords — they were
        // all the same here, so the account is usable once confirmed.
        await authService.verifyEmail({ email: EMAIL, code: DEV_CODE });
        await expect(authService.login({ email: EMAIL, password: PASSWORD })).resolves.toHaveProperty('accessToken');
    });

    it('parallel registrations of a confirmed address all answer 409 email-taken', async () => {
        await authService.register({ email: EMAIL, password: PASSWORD });
        await authService.verifyEmail({ email: EMAIL, code: DEV_CODE });

        const results = await Promise.allSettled(
            Array.from({ length: BURST }, () => authService.register({ email: EMAIL, password: PASSWORD })),
        );

        expect(
            results.filter(result => result.status === 'rejected' && result.reason instanceof ConflictException),
        ).toHaveLength(BURST);
    });

    it('parallel first provider sign-ins create one account with one identity', async () => {
        const results = await Promise.allSettled(
            Array.from({ length: BURST }, () => startOAuth(OAuthProvider.Google, 'google-user')),
        );

        expect(results.filter(result => result.status === 'rejected')).toEqual([]);
        expect(await ctx.db.query.users.findMany()).toHaveLength(1);
        expect(await ctx.db.query.oauthIdentities.findMany()).toHaveLength(1);
    });

    it('parallel provider sign-ins linking an existing account link it once', async () => {
        await authService.register({ email: EMAIL, password: PASSWORD });
        await authService.verifyEmail({ email: EMAIL, code: DEV_CODE });

        const results = await Promise.allSettled(
            Array.from({ length: BURST }, () => startOAuth(OAuthProvider.Google, 'google-user')),
        );

        expect(results.filter(result => result.status === 'rejected')).toEqual([]);
        expect(await ctx.db.query.users.findMany()).toHaveLength(1);
        expect(await ctx.db.query.oauthIdentities.findMany()).toHaveLength(1);
    });

    it('Apple and Google at once for one new address end up on one account', async () => {
        const results = await Promise.allSettled([
            startOAuth(OAuthProvider.Apple, 'apple-user'),
            startOAuth(OAuthProvider.Google, 'google-user'),
        ]);

        expect(results.filter(result => result.status === 'rejected')).toEqual([]);

        const users = await ctx.db.query.users.findMany();
        expect(users).toHaveLength(1);

        const identities = await ctx.db
            .select()
            .from(schema.oauthIdentities)
            .where(eq(schema.oauthIdentities.userId, users[0]!.id));
        expect(identities.map(identity => identity.provider).sort()).toEqual(
            [OAuthProvider.Apple, OAuthProvider.Google].sort(),
        );
    });
});
