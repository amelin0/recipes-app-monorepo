import { UnauthorizedException } from '@nestjs/common';
import { isNotNull } from 'drizzle-orm';

import { RefreshTokenRepository, UserRepository, schema } from '@dns/database';

import { AuthService } from '../src/modules/auth/auth.service';
import { TokenService } from '../src/modules/auth/token.service';

import { truncateAuthTables } from './support/db';
import { AuthTestContext, createAuthTestContext } from './support/testing-module';

const EMAIL = 'rotation@example.com';
const PASSWORD = 'passw0rd';

describe('Refresh token chains', () => {
    let ctx: AuthTestContext;
    let authService: AuthService;
    let tokenService: TokenService;
    let refreshTokens: RefreshTokenRepository;
    let users: UserRepository;

    beforeAll(async () => {
        ctx = await createAuthTestContext();
        authService = ctx.moduleRef.get(AuthService);
        tokenService = ctx.moduleRef.get(TokenService);
        refreshTokens = ctx.moduleRef.get(RefreshTokenRepository);
        users = ctx.moduleRef.get(UserRepository);
    });

    afterAll(async () => {
        await ctx.close();
    });

    beforeEach(async () => {
        await truncateAuthTables(ctx.db);
        await authService.register({ email: EMAIL, password: PASSWORD });
        await authService.verifyEmail({ email: EMAIL, code: '000000' });
    });

    const familyIds = async (): Promise<Set<string>> => {
        const rows = await ctx.db.query.refreshTokens.findMany();
        return new Set(rows.map(row => row.familyId));
    };

    it('rotation keeps one chain and marks the spent token', async () => {
        // Confirming the email already opened a session (sign-up FR-007), so
        // the chain under test is the one this login starts.
        const familiesBefore = await familyIds();

        const first = await authService.login({ email: EMAIL, password: PASSWORD });
        const second = await tokenService.rotate(first.refreshToken);

        expect(second.refreshToken).not.toBe(first.refreshToken);

        const rows = await ctx.db.query.refreshTokens.findMany();
        const loginFamily = [...new Set(rows.map(row => row.familyId))].find(id => !familiesBefore.has(id));
        expect(loginFamily).toBeDefined();

        const chain = rows.filter(row => row.familyId === loginFamily);
        // Two rows, one chain: refreshing continued the session rather than
        // starting a second one.
        expect(chain).toHaveLength(2);
        expect(chain.filter(row => row.rotatedAt !== null)).toHaveLength(1);
    });

    it('one device rotating leaves the other signed in (session FR-006)', async () => {
        const deviceA = await authService.login({ email: EMAIL, password: PASSWORD });
        const deviceB = await authService.login({ email: EMAIL, password: PASSWORD });

        await tokenService.rotate(deviceA.refreshToken);

        await expect(tokenService.rotate(deviceB.refreshToken)).resolves.toHaveProperty('accessToken');
    });

    it('replaying a spent token revokes that chain and only that chain', async () => {
        const deviceA = await authService.login({ email: EMAIL, password: PASSWORD });
        const deviceB = await authService.login({ email: EMAIL, password: PASSWORD });

        const rotated = await tokenService.rotate(deviceA.refreshToken);

        // Past the grace window, the spent token turning up again is the theft
        // signal. (Inside it, one repeat is the app's own double refresh — see
        // auth-refresh-races.db-spec.ts.)
        await ctx.db
            .update(schema.refreshTokens)
            .set({ rotatedAt: new Date(Date.now() - 60_000) })
            .where(isNotNull(schema.refreshTokens.rotatedAt));

        await expect(tokenService.rotate(deviceA.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);

        // The chain is gone — including the token that was legitimately issued
        // moments ago, because we cannot tell which side of the pair is the thief.
        await expect(tokenService.rotate(rotated.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);

        // The other device is untouched.
        await expect(tokenService.rotate(deviceB.refreshToken)).resolves.toHaveProperty('accessToken');
    });

    it('a token whose body does not match the stored digest is refused without revoking anything', async () => {
        const device = await authService.login({ email: EMAIL, password: PASSWORD });

        const [row] = await ctx.db.query.refreshTokens.findMany();
        expect(row).toBeDefined();

        // Stand in for a token minted by someone holding the refresh secret:
        // the jti is real, the body is not ours.
        const forged = `${device.refreshToken}tampered`;
        await expect(tokenService.rotate(forged)).rejects.toBeInstanceOf(UnauthorizedException);

        // Crucially the real chain survives — otherwise anyone able to forge a
        // token could sign a victim out at will.
        await expect(tokenService.rotate(device.refreshToken)).resolves.toHaveProperty('accessToken');
    });

    it('logout-everywhere clears every chain of the account', async () => {
        await authService.login({ email: EMAIL, password: PASSWORD });
        await authService.login({ email: EMAIL, password: PASSWORD });

        const user = await users.findByEmail(EMAIL);
        expect(user).not.toBeNull();

        await tokenService.revokeAllForUser(user!.id);

        expect(await ctx.db.query.refreshTokens.findMany()).toHaveLength(0);
        expect(await refreshTokens.findById(user!.id)).toBeNull();
    });
});
