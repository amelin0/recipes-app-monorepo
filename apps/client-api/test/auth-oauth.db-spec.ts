import { UserRepository } from '@dns/database';
import { AuthTokens, OAuthProvider } from '@dns/shared-types';

import { AuthService } from '../src/modules/auth/auth.service';
import { OAuthSignInService } from '../src/modules/auth/oauth.service';

import { truncateAuthTables } from './support/db';
import { AuthTestContext, createAuthTestContext } from './support/testing-module';

describe('OAuth sign-in', () => {
    let ctx: AuthTestContext;
    let oauthSignIn: OAuthSignInService;
    let authService: AuthService;
    let users: UserRepository;

    beforeAll(async () => {
        ctx = await createAuthTestContext();
        oauthSignIn = ctx.moduleRef.get(OAuthSignInService);
        authService = ctx.moduleRef.get(AuthService);
        users = ctx.moduleRef.get(UserRepository);
    });

    afterAll(async () => {
        await ctx.close();
    });

    beforeEach(async () => {
        await truncateAuthTables(ctx.db);
    });

    const signIn = (
        email: string,
        providerUserId = 'provider-user-1',
        provider = OAuthProvider.Google,
    ): Promise<AuthTokens> => {
        ctx.oauth.willReturn(provider, providerUserId, email);
        return oauthSignIn.signIn({ provider, idToken: 'stub' });
    };

    it('creates a verified, passwordless account when nobody matches', async () => {
        const tokens = await signIn('fresh@example.com');
        expect(tokens.accessToken).toBeTruthy();

        const user = await users.findByEmail('fresh@example.com');
        expect(user).not.toBeNull();
        // sign-up FR-012: the provider already proved the address.
        expect(user?.isEmailVerified()).toBe(true);
        // FR-013: no password yet — the reset flow is how one gets set.
        expect(user?.hasPassword()).toBe(false);
    });

    it('returns the same account on a repeat sign-in instead of a second one', async () => {
        const first = await signIn('repeat@example.com');
        const second = await signIn('repeat@example.com');

        expect(first.accessToken).toBeTruthy();
        expect(second.accessToken).toBeTruthy();

        const rows = await ctx.db.query.users.findMany();
        expect(rows).toHaveLength(1);
    });

    it('links to an existing password account rather than duplicating it (FR-006)', async () => {
        await authService.register({ email: 'both@example.com', password: 'passw0rd' });
        await authService.verifyEmail({ email: 'both@example.com', code: '000000' });

        const before = await users.findByEmail('both@example.com');

        await signIn('both@example.com', 'provider-user-2');

        const rows = await ctx.db.query.users.findMany();
        expect(rows).toHaveLength(1);

        const after = await users.findByEmail('both@example.com');
        expect(after?.id).toBe(before?.id);
        // The password survives the link — the account keeps both ways in.
        expect(after?.hasPassword()).toBe(true);
    });

    it('verifies an account that was still waiting on its email code', async () => {
        await authService.register({ email: 'pending@example.com', password: 'passw0rd' });

        const before = await users.findByEmail('pending@example.com');
        expect(before?.isEmailVerified()).toBe(false);

        await signIn('pending@example.com', 'provider-user-3');

        const after = await users.findByEmail('pending@example.com');
        expect(after?.isEmailVerified()).toBe(true);
        expect(after?.id).toBe(before?.id);
    });

    it('keeps the link when the provider reports a different email later', async () => {
        await signIn('relay-first@example.com', 'stable-id');
        await signIn('relay-changed@example.com', 'stable-id');

        // Matching on providerUserId, not email — Apple's relay address can
        // change, and a second account here would strand the first.
        const rows = await ctx.db.query.users.findMany();
        expect(rows).toHaveLength(1);
        expect(rows[0]?.email).toBe('relay-first@example.com');
    });
});
