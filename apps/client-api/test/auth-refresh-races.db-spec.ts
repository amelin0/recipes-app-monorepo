import { UnauthorizedException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { RefreshTokenRepository, UserRepository, schema } from '@dns/database';
import { AuthTokens } from '@dns/shared-types';

import { AuthService } from '../src/modules/auth/auth.service';
import { PasswordResetService } from '../src/modules/auth/password-reset.service';
import { TokenService } from '../src/modules/auth/token.service';

import { truncateAuthTables } from './support/db';
import { AuthTestContext, createAuthTestContext } from './support/testing-module';

const EMAIL = 'refresh-races@example.com';
const PASSWORD = 'passw0rd';
// OTP_DEV_CODE in .env pins the generated code, so the test knows the answer.
const DEV_CODE = '000000';

/**
 * How many times each race is replayed. One run of `Promise.all` exercises one
 * interleaving; repeating it lets both orders (revocation first, refresh
 * first) actually occur. The invariant must hold in every one.
 */
const ROUNDS = 10;

/**
 * Refresh rotation under concurrent requests (session FR-006, FR-007):
 * a token rotates once, the capped grace hands out one sibling, and a
 * revocation always wins over a refresh in flight.
 */
describe('Refresh rotation under concurrency', () => {
    let ctx: AuthTestContext;
    let authService: AuthService;
    let tokenService: TokenService;
    let passwordReset: PasswordResetService;
    let refreshTokens: RefreshTokenRepository;
    let users: UserRepository;
    let userId: string;

    beforeAll(async () => {
        ctx = await createAuthTestContext();
        authService = ctx.moduleRef.get(AuthService);
        tokenService = ctx.moduleRef.get(TokenService);
        passwordReset = ctx.moduleRef.get(PasswordResetService);
        refreshTokens = ctx.moduleRef.get(RefreshTokenRepository);
        users = ctx.moduleRef.get(UserRepository);
    });

    afterAll(async () => {
        await ctx.close();
    });

    beforeEach(async () => {
        await truncateAuthTables(ctx.db);
        await authService.register({ email: EMAIL, password: PASSWORD });
        await authService.verifyEmail({ email: EMAIL, code: DEV_CODE });
        userId = (await users.findByEmail(EMAIL))!.id;
    });

    const signIn = (): Promise<AuthTokens> => authService.login({ email: EMAIL, password: PASSWORD });

    const tokensOfUser = async (): Promise<(typeof schema.refreshTokens.$inferSelect)[]> =>
        ctx.db.select().from(schema.refreshTokens).where(eq(schema.refreshTokens.userId, userId));

    const familyOf = async (refreshToken: string): Promise<string> => {
        const jti = JSON.parse(Buffer.from(refreshToken.split('.')[1]!, 'base64url').toString()).jti as string;
        return (await refreshTokens.findById(jti))!.familyId;
    };

    const rows = async (familyId: string): Promise<(typeof schema.refreshTokens.$inferSelect)[]> =>
        ctx.db.select().from(schema.refreshTokens).where(eq(schema.refreshTokens.familyId, familyId));

    describe('the grace window', () => {
        it('two refreshes of one token at once both succeed, on the same chain', async () => {
            const session = await signIn();
            const family = await familyOf(session.refreshToken);

            const [first, second] = await Promise.all([
                tokenService.rotate(session.refreshToken),
                tokenService.rotate(session.refreshToken),
            ]);

            expect(first.refreshToken).not.toBe(second.refreshToken);

            // Parent spent, grace used, and two live tokens on the one chain.
            const chain = await rows(family);
            expect(chain).toHaveLength(3);
            expect(chain.filter(row => row.rotatedAt !== null)).toHaveLength(1);
            expect(chain.filter(row => row.graceUsedAt !== null)).toHaveLength(1);

            // Both pairs are genuinely usable — the app keeps whichever it saw last.
            await expect(tokenService.rotate(first.refreshToken)).resolves.toHaveProperty('accessToken');
            await expect(tokenService.rotate(second.refreshToken)).resolves.toHaveProperty('accessToken');
        });

        it('a burst of refreshes of one token: one rotation, one sibling, the rest are replays', async () => {
            const session = await signIn();
            const otherDevice = await signIn();
            const family = await familyOf(session.refreshToken);

            const burst = 6;
            const results = await Promise.allSettled(
                Array.from({ length: burst }, () => tokenService.rotate(session.refreshToken)),
            );

            // Exactly the winner and the single grace sibling got pairs.
            expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(2);
            expect(
                results.filter(
                    result => result.status === 'rejected' && result.reason instanceof UnauthorizedException,
                ),
            ).toHaveLength(burst - 2);

            // A third presentation is a replay, and a replay revokes the chain —
            // including the two pairs handed out moments ago.
            expect(await rows(family)).toHaveLength(0);

            // Other devices are untouched (FR-006).
            await expect(tokenService.rotate(otherDevice.refreshToken)).resolves.toHaveProperty('accessToken');
        });

        it('the grace is single-use even when the requests come one after another', async () => {
            const session = await signIn();
            const family = await familyOf(session.refreshToken);

            await tokenService.rotate(session.refreshToken);
            await tokenService.rotate(session.refreshToken);

            await expect(tokenService.rotate(session.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
            expect(await rows(family)).toHaveLength(0);
        });
    });

    describe('revocation wins over a refresh in flight', () => {
        it('logout-everywhere racing a refresh leaves no token behind', async () => {
            for (let round = 0; round < ROUNDS; round++) {
                const session = await signIn();

                await Promise.allSettled([
                    tokenService.rotate(session.refreshToken),
                    tokenService.revokeAllForUser(userId),
                ]);

                // Whichever ran first, the child a refresh minted must not
                // outlive the revocation. Before the fix it did whenever the
                // DELETE ran between the refresh's read and its insert.
                expect(await tokensOfUser()).toHaveLength(0);
            }
        });

        it('signing out one device racing its own refresh leaves that chain empty', async () => {
            for (let round = 0; round < ROUNDS; round++) {
                const session = await signIn();
                const family = await familyOf(session.refreshToken);

                await Promise.allSettled([
                    tokenService.rotate(session.refreshToken),
                    tokenService.revokeChain(session.refreshToken),
                ]);

                expect(await rows(family)).toHaveLength(0);
            }
        });

        it('a block racing a refresh leaves no token behind', async () => {
            for (let round = 0; round < ROUNDS; round++) {
                await ctx.db.update(schema.users).set({ blockedAt: null }).where(eq(schema.users.id, userId));
                const session = await signIn();

                // What the admin panel does to block (AdminUserService.setBlocked).
                const block = async (): Promise<void> => {
                    await ctx.db.update(schema.users).set({ blockedAt: new Date() }).where(eq(schema.users.id, userId));
                    await refreshTokens.deleteAllForUser(userId);
                };

                await Promise.allSettled([tokenService.rotate(session.refreshToken), block()]);

                expect(await tokensOfUser()).toHaveLength(0);
            }
        });

        it('a password reset racing a refresh leaves no token behind', async () => {
            for (let round = 0; round < ROUNDS; round++) {
                const session = await signIn();
                await passwordReset.request({ email: EMAIL });
                const permitToken = await passwordReset.verifyCode({ email: EMAIL, code: DEV_CODE });

                await Promise.allSettled([
                    tokenService.rotate(session.refreshToken),
                    passwordReset.setNewPassword({ permitToken, password: PASSWORD, passwordConfirmation: PASSWORD }),
                ]);

                expect(await tokensOfUser()).toHaveLength(0);
            }
        });

        it('a password reset racing a sign-in with the old password leaves no session behind', async () => {
            let current = PASSWORD;

            for (let round = 0; round < ROUNDS; round++) {
                const next = `newpass${round}x`;
                await passwordReset.request({ email: EMAIL });
                const permitToken = await passwordReset.verifyCode({ email: EMAIL, code: DEV_CODE });

                await Promise.allSettled([
                    authService.login({ email: EMAIL, password: current }),
                    passwordReset.setNewPassword({ permitToken, password: next, passwordConfirmation: next }),
                ]);

                // The sign-in either lost outright — too late for the old
                // password, or refused because the hash it checked was replaced
                // before its session was stored — or its session was swept by
                // the reset. Never a session opened by the old password that
                // outlives the reset.
                expect(await tokensOfUser()).toHaveLength(0);
                current = next;
            }
        });
    });
});
