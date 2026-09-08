import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { UserRepository, schema } from '@dns/database';

import { AuthService } from '../src/modules/auth/auth.service';
import { JwtStrategy } from '../src/modules/auth/strategies/jwt.strategy';
import { TokenService } from '../src/modules/auth/token.service';

import { truncateAuthTables } from './support/db';
import { AuthTestContext, createAuthTestContext } from './support/testing-module';

const EMAIL = 'blocked@example.com';
const PASSWORD = 'passw0rd';

/**
 * The client half of the admin user-directory slice: what «blocked» actually
 * does to an account. The panel sets the flag; everything that makes it mean
 * something lives here.
 */
describe('A blocked account', () => {
    let ctx: AuthTestContext;
    let authService: AuthService;
    let tokenService: TokenService;
    let jwtStrategy: JwtStrategy;
    let users: UserRepository;

    beforeAll(async () => {
        ctx = await createAuthTestContext();
        authService = ctx.moduleRef.get(AuthService);
        tokenService = ctx.moduleRef.get(TokenService);
        jwtStrategy = ctx.moduleRef.get(JwtStrategy);
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

    const block = async (): Promise<string> => {
        const user = await users.findByEmail(EMAIL);
        await ctx.db.update(schema.users).set({ blockedAt: new Date() }).where(eq(schema.users.id, user!.id));
        return user!.id;
    };

    const unblock = async (id: string): Promise<void> => {
        await ctx.db.update(schema.users).set({ blockedAt: null }).where(eq(schema.users.id, id));
    };

    it('cannot sign in, even with the right password', async () => {
        await block();

        await expect(authService.login({ email: EMAIL, password: PASSWORD })).rejects.toBeInstanceOf(
            ForbiddenException,
        );
    });

    /**
     * The reason is named rather than hidden behind «invalid credentials»:
     * this branch is reachable only once the password has already matched, and
     * an owner sent round the reset loop cannot fix a block with a new password.
     */
    it('is told why', async () => {
        await block();

        await expect(authService.login({ email: EMAIL, password: PASSWORD })).rejects.toMatchObject({
            response: { code: 'auth.account-blocked' },
        });
    });

    it('cannot refresh a session it already had', async () => {
        const session = await authService.login({ email: EMAIL, password: PASSWORD });
        await block();

        await expect(tokenService.rotate(session.refreshToken)).rejects.toBeInstanceOf(ForbiddenException);
    });

    /**
     * SC-002: the access token stays cryptographically valid for its full
     * fifteen minutes, so «block him now» has to be enforced on the request,
     * not on the token.
     */
    it('loses a live access token on the very next request', async () => {
        const user = await users.findByEmail(EMAIL);
        await expect(jwtStrategy.validate({ sub: user!.id, email: EMAIL, type: 'access' })).resolves.toBeDefined();

        await block();

        await expect(jwtStrategy.validate({ sub: user!.id, email: EMAIL, type: 'access' })).rejects.toBeInstanceOf(
            UnauthorizedException,
        );
    });

    it('can sign in again once the block is lifted', async () => {
        const id = await block();
        await unblock(id);

        await expect(authService.login({ email: EMAIL, password: PASSWORD })).resolves.toMatchObject({
            accessToken: expect.any(String),
        });
    });
});
