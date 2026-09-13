import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';

import { UserEntity, UserRepository, schema } from '@dns/database';

import { AllConfig } from '../src/common/config';
import { AuthService } from '../src/modules/auth/auth.service';
import { AccessTokenPayload } from '../src/modules/auth/auth.types';
import { PasswordResetService } from '../src/modules/auth/password-reset.service';
import { JwtStrategy } from '../src/modules/auth/strategies/jwt.strategy';
import { TokenService } from '../src/modules/auth/token.service';
import { ProfileService } from '../src/modules/user/profile.service';

import { truncateAuthTables } from './support/db';
import { AuthTestContext, createAuthTestContext } from './support/testing-module';

const EMAIL = 'revocation@example.com';
const PASSWORD = 'passw0rd';
const NEW_PASSWORD = 'newpassw0rd';

/**
 * What «all sessions end now» has to mean for the token nobody can delete.
 *
 * Revoking the refresh chains was never in doubt — the rows go and the tests in
 * `auth-tokens.db-spec.ts` prove it. What black-box QA found is the other half:
 * the access token already in the caller's hands stayed good for the rest of
 * its fifteen minutes, `PATCH /profile` included, after both `logout-all` and a
 * completed password reset (session FR-007, password-reset FR-005).
 *
 * These tests go through `JwtStrategy.validate` with a payload obtained by
 * really verifying a really issued token, which is exactly what the guard does
 * on every authenticated request — and then, where QA wrote, they write.
 */
describe('Revoking every session of an account', () => {
    let ctx: AuthTestContext;
    let authService: AuthService;
    let tokenService: TokenService;
    let passwordResetService: PasswordResetService;
    let profileService: ProfileService;
    let jwtStrategy: JwtStrategy;
    let jwtService: JwtService;
    let users: UserRepository;
    let accessSecret: string;

    beforeAll(async () => {
        ctx = await createAuthTestContext();
        authService = ctx.moduleRef.get(AuthService);
        tokenService = ctx.moduleRef.get(TokenService);
        passwordResetService = ctx.moduleRef.get(PasswordResetService);
        profileService = ctx.moduleRef.get(ProfileService);
        jwtStrategy = ctx.moduleRef.get(JwtStrategy);
        jwtService = ctx.moduleRef.get(JwtService);
        users = ctx.moduleRef.get(UserRepository);
        accessSecret = ctx.moduleRef
            .get<ConfigService<AllConfig>>(ConfigService)
            .getOrThrow('auth.access.secret', { infer: true });
    });

    afterAll(async () => {
        await ctx.close();
    });

    beforeEach(async () => {
        await truncateAuthTables(ctx.db);
        await authService.register({ email: EMAIL, password: PASSWORD });
        await authService.verifyEmail({ email: EMAIL, code: '000000' });
    });

    /**
     * The guard's own path: verify the signature, hand the claims to the
     * strategy. Nothing here is simulated — `payload.iat` is the claim the
     * signer stamped on the real token.
     */
    const authenticate = async (accessToken: string): Promise<UserEntity> => {
        const payload = await jwtService.verifyAsync<AccessTokenPayload>(accessToken, { secret: accessSecret });
        return jwtStrategy.validate(payload);
    };

    /** Authenticate, then do what QA did with the token it should not have had. */
    const writeThrough = async (accessToken: string, name: string): Promise<void> => {
        const user = await authenticate(accessToken);
        await profileService.updateProfile(user, { name });
    };

    const userId = async (): Promise<string> => {
        const user = await users.findByEmail(EMAIL);
        expect(user).not.toBeNull();
        return (user as UserEntity).id;
    };

    /**
     * Puts the account's revocation marker `offsetMs` from now, as stamped by
     * the database clock.
     *
     * Signing in right after a real revocation lands in the same second only
     * most of the time — bcrypt can carry it over the boundary. Stamping the
     * marker ahead makes «issued in the revocation's second, after it» a
     * certainty instead of a race, and it is a real case of its own: the
     * marker comes from Postgres's clock, `iat` from this process's.
     */
    const stampMarkerAhead = async (offsetMs: number): Promise<void> => {
        await ctx.db
            .update(schema.users)
            .set({ sessionsValidFrom: new Date(Date.now() + offsetMs) })
            .where(eq(schema.users.id, await userId()));
    };

    const completePasswordReset = async (): Promise<void> => {
        await passwordResetService.request({ email: EMAIL });
        const permitToken = await passwordResetService.verifyCode({ email: EMAIL, code: '000000' });
        await passwordResetService.setNewPassword({
            permitToken,
            password: NEW_PASSWORD,
            passwordConfirmation: NEW_PASSWORD,
        });
    };

    describe('logout-all', () => {
        it('kills an access token taken before it — reads and writes alike', async () => {
            const session = await authService.login({ email: EMAIL, password: PASSWORD });

            // The token works before, so its refusal afterwards means something.
            await expect(authenticate(session.accessToken)).resolves.toBeDefined();

            await tokenService.revokeAllForUser(await userId());

            await expect(authenticate(session.accessToken)).rejects.toBeInstanceOf(UnauthorizedException);
            // The finding was not «a stale read» — QA changed the account's name
            // through a revoked session and got 200 back.
            await expect(writeThrough(session.accessToken, 'QA After Revoke')).rejects.toBeInstanceOf(
                UnauthorizedException,
            );
        });

        it('kills the other device too, not just the one that asked', async () => {
            const phone = await authService.login({ email: EMAIL, password: PASSWORD });
            const tablet = await authService.login({ email: EMAIL, password: PASSWORD });

            await tokenService.revokeAllForUser(await userId());

            await expect(authenticate(phone.accessToken)).rejects.toBeInstanceOf(UnauthorizedException);
            await expect(authenticate(tablet.accessToken)).rejects.toBeInstanceOf(UnauthorizedException);
        });

        /**
         * QA: `logout-all`, then an immediate `login`, answered 200 — and the
         * access token it handed out was 401 forever. `iat` counts whole
         * seconds, so a token minted in the revocation's own second looked
         * older than the revocation. No waiting here on purpose.
         */
        it('lets a session opened right afterwards work, in the same second', async () => {
            await authService.login({ email: EMAIL, password: PASSWORD });
            await tokenService.revokeAllForUser(await userId());

            const fresh = await authService.login({ email: EMAIL, password: PASSWORD });

            await expect(authenticate(fresh.accessToken)).resolves.toBeDefined();
            await expect(writeThrough(fresh.accessToken, 'Signed In Again')).resolves.toBeUndefined();
        });

        it('lets a new session work even when the marker is stamped just ahead of this clock', async () => {
            await stampMarkerAhead(1_500);

            const fresh = await authService.login({ email: EMAIL, password: PASSWORD });

            await expect(authenticate(fresh.accessToken)).resolves.toBeDefined();
        });

        it('does not stretch a token over a marker far ahead — it stays refused', async () => {
            // Clearing the marker moves `exp` with `iat`; chasing a clock that
            // is minutes off would hand out tokens that outlive their TTL.
            await stampMarkerAhead(5 * 60_000);

            const fresh = await authService.login({ email: EMAIL, password: PASSWORD });

            await expect(authenticate(fresh.accessToken)).rejects.toBeInstanceOf(UnauthorizedException);
        });

        it('lets a refreshed access token work in the revocation second too', async () => {
            // Every path that signs an access token goes through the same rule,
            // not only sign-in.
            // The chain is left in place — only the marker moves — so the
            // refresh itself is allowed and the question is purely its `iat`.
            const session = await authService.login({ email: EMAIL, password: PASSWORD });
            await stampMarkerAhead(1_500);

            const rotated = await tokenService.rotate(session.refreshToken);

            await expect(authenticate(rotated.accessToken)).resolves.toBeDefined();
        });
    });

    describe('a completed password reset', () => {
        it('kills an access token taken before it — reads and writes alike', async () => {
            const session = await authService.login({ email: EMAIL, password: PASSWORD });
            await expect(authenticate(session.accessToken)).resolves.toBeDefined();

            await completePasswordReset();

            await expect(authenticate(session.accessToken)).rejects.toBeInstanceOf(UnauthorizedException);
            await expect(writeThrough(session.accessToken, 'QA Stale Session')).rejects.toBeInstanceOf(
                UnauthorizedException,
            );
        });

        it('kills every device, and lets a sign-in with the new password through', async () => {
            const phone = await authService.login({ email: EMAIL, password: PASSWORD });
            const tablet = await authService.login({ email: EMAIL, password: PASSWORD });

            await completePasswordReset();

            await expect(authenticate(phone.accessToken)).rejects.toBeInstanceOf(UnauthorizedException);
            await expect(authenticate(tablet.accessToken)).rejects.toBeInstanceOf(UnauthorizedException);

            const fresh = await authService.login({ email: EMAIL, password: NEW_PASSWORD });
            await expect(authenticate(fresh.accessToken)).resolves.toBeDefined();
        });
    });

    describe('single-device logout', () => {
        /**
         * The line the account-wide marker must not cross. `logout` means one
         * device, and FR-006 makes that the whole point of per-device chains.
         */
        it('leaves the other device signed in, access token included', async () => {
            const phone = await authService.login({ email: EMAIL, password: PASSWORD });
            const tablet = await authService.login({ email: EMAIL, password: PASSWORD });

            await tokenService.revokeChain(phone.refreshToken);

            await expect(authenticate(tablet.accessToken)).resolves.toBeDefined();
            await expect(writeThrough(tablet.accessToken, 'Still Here')).resolves.toBeUndefined();
        });

        /**
         * The documented bound, pinned so it stays a decision rather than a
         * surprise: the leaving device's own access token lives out its TTL. An
         * account-wide marker cannot say «this one device», and a per-session
         * claim is a larger change (see session/plan.md). The chain is gone, so
         * the session cannot be extended past those minutes.
         */
        it('cannot take back the access token of the device that left', async () => {
            const phone = await authService.login({ email: EMAIL, password: PASSWORD });

            await tokenService.revokeChain(phone.refreshToken);

            await expect(authenticate(phone.accessToken)).resolves.toBeDefined();
            await expect(tokenService.rotate(phone.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
        });
    });

    describe('blocking', () => {
        /**
         * Already worked before the marker existed, and must keep working: it
         * is enforced from `blocked_at` on the row the strategy re-reads, not
         * from the marker. Here to catch a refactor that routes one through the
         * other and quietly loses this.
         */
        it('still takes effect on the very next request', async () => {
            const session = await authService.login({ email: EMAIL, password: PASSWORD });
            await expect(authenticate(session.accessToken)).resolves.toBeDefined();

            await ctx.db
                .update(schema.users)
                .set({ blockedAt: new Date() })
                .where(eq(schema.users.id, await userId()));

            await expect(authenticate(session.accessToken)).rejects.toBeInstanceOf(UnauthorizedException);
        });

        /**
         * Unblocking restores the ability to sign in, not the sessions the
         * block took away — and that has to hold for the access tokens too,
         * which is only true because blocking revokes through the same path
         * that stamps the marker.
         */
        it('does not hand the old access token back when the block is lifted', async () => {
            const session = await authService.login({ email: EMAIL, password: PASSWORD });
            const id = await userId();

            // The admin panel's two steps, in its order: raise the flag, then
            // revoke (see `AdminUserService.setBlocked`).
            await ctx.db.update(schema.users).set({ blockedAt: new Date() }).where(eq(schema.users.id, id));
            await tokenService.revokeAllForUser(id);
            await ctx.db.update(schema.users).set({ blockedAt: null }).where(eq(schema.users.id, id));

            await expect(authenticate(session.accessToken)).rejects.toBeInstanceOf(UnauthorizedException);
        });
    });
});
