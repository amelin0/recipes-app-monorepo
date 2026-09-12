import { BadRequestException, UnauthorizedException } from '@nestjs/common';

import { AUTH_POLICY } from '@dns/constants';

import { AuthService } from '../src/modules/auth/auth.service';
import { PasswordResetService } from '../src/modules/auth/password-reset.service';

import { truncateAuthTables } from './support/db';
import { AuthTestContext, createAuthTestContext } from './support/testing-module';

const EMAIL = 'reset-races@example.com';
const PASSWORD = 'passw0rd';
// OTP_DEV_CODE in .env pins the generated code, so the test knows the answer.
const DEV_CODE = '000000';

/**
 * The reset flow under concurrent requests: one code buys one permit, one
 * permit changes the password once.
 */
describe('Password reset under concurrency', () => {
    let ctx: AuthTestContext;
    let authService: AuthService;
    let passwordReset: PasswordResetService;

    beforeAll(async () => {
        ctx = await createAuthTestContext();
        authService = ctx.moduleRef.get(AuthService);
        passwordReset = ctx.moduleRef.get(PasswordResetService);
    });

    afterAll(async () => {
        await ctx.close();
    });

    beforeEach(async () => {
        await truncateAuthTables(ctx.db);
        await authService.register({ email: EMAIL, password: PASSWORD });
        await authService.verifyEmail({ email: EMAIL, code: DEV_CODE });
    });

    const permit = async (): Promise<string> => {
        await passwordReset.request({ email: EMAIL });
        return passwordReset.verifyCode({ email: EMAIL, code: DEV_CODE });
    };

    const setPassword = (permitToken: string, password: string): Promise<void> =>
        passwordReset.setNewPassword({ permitToken, password, passwordConfirmation: password });

    it('one correct code submitted in parallel buys exactly one permit', async () => {
        await passwordReset.request({ email: EMAIL });

        const results = await Promise.allSettled(
            Array.from({ length: AUTH_POLICY.otp.maxAttempts }, () =>
                passwordReset.verifyCode({ email: EMAIL, code: DEV_CODE }),
            ),
        );

        expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
        expect(
            results.filter(result => result.status === 'rejected' && result.reason instanceof BadRequestException),
        ).toHaveLength(AUTH_POLICY.otp.maxAttempts - 1);

        expect(await ctx.db.query.passwordResetPermits.findMany()).toHaveLength(1);
    });

    it('one permit used in parallel changes the password exactly once', async () => {
        const permitToken = await permit();
        const passwords = ['first111', 'second22', 'third333', 'fourth44', 'fifth555'];

        const results = await Promise.allSettled(passwords.map(password => setPassword(permitToken, password)));

        const winners = passwords.filter((_, index) => results[index]?.status === 'fulfilled');
        expect(winners).toHaveLength(1);
        expect(
            results.filter(result => result.status === 'rejected' && result.reason instanceof UnauthorizedException),
        ).toHaveLength(passwords.length - 1);

        // The password that won is the one that works — nobody else's.
        await expect(authService.login({ email: EMAIL, password: winners[0]! })).resolves.toHaveProperty('accessToken');
    });

    it('two live permits of one account used at once: one wins, no deadlock', async () => {
        const first = await permit();
        const second = await permit();

        const results = await Promise.allSettled([setPassword(first, 'first111'), setPassword(second, 'second22')]);

        // The winner voids every permit (FR-005), so the other is refused as a
        // 401 — not a deadlock surfacing as a 500.
        expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
        expect(
            results.filter(result => result.status === 'rejected' && result.reason instanceof UnauthorizedException),
        ).toHaveLength(1);
        expect(await ctx.db.query.passwordResetPermits.findMany()).toHaveLength(0);
    });
});
