import { BadRequestException } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';

import { AUTH_POLICY } from '@dns/constants';
import { UserRepository, schema } from '@dns/database';
import { OtpPurpose } from '@dns/shared-types';

import { AuthService } from '../src/modules/auth/auth.service';

import { truncateAuthTables } from './support/db';
import { AuthTestContext, createAuthTestContext } from './support/testing-module';

const EMAIL = 'otp-races@example.com';
const PASSWORD = 'passw0rd';
// OTP_DEV_CODE in .env pins the generated code, so the test knows the answer.
const DEV_CODE = '000000';
const WRONG_CODE = '111111';

/** How many requests each burst fires — comfortably above the attempt cap. */
const BURST = 4 * AUTH_POLICY.otp.maxAttempts;

/**
 * The invariants of one-time codes under concurrent requests. Every test
 * fires a burst with `Promise.all`, so the requests really do overlap in the
 * database, and asserts the invariant the sequential specs cannot reach.
 */
describe('One-time codes under concurrency', () => {
    let ctx: AuthTestContext;
    let authService: AuthService;
    let users: UserRepository;

    beforeAll(async () => {
        ctx = await createAuthTestContext();
        authService = ctx.moduleRef.get(AuthService);
        users = ctx.moduleRef.get(UserRepository);
    });

    afterAll(async () => {
        await ctx.close();
    });

    beforeEach(async () => {
        await truncateAuthTables(ctx.db);
        await authService.register({ email: EMAIL, password: PASSWORD });
    });

    const liveCodes = async (
        purpose: OtpPurpose = OtpPurpose.EmailVerification,
    ): Promise<(typeof schema.otpCodes.$inferSelect)[]> => {
        const user = await users.findByEmail(EMAIL);
        return ctx.db
            .select()
            .from(schema.otpCodes)
            .where(
                and(
                    eq(schema.otpCodes.userId, user!.id),
                    eq(schema.otpCodes.purpose, purpose),
                    isNull(schema.otpCodes.consumedAt),
                ),
            );
    };

    it('a parallel burst of guesses never checks more than the attempt cap', async () => {
        const results = await Promise.allSettled(
            Array.from({ length: BURST }, () => authService.verifyEmail({ email: EMAIL, code: WRONG_CODE })),
        );

        expect(results.every(result => result.status === 'rejected')).toBe(true);

        // The counter is the number of comparisons actually made. Before the
        // fix every request of the burst read «0 used» and was compared.
        const [code] = await liveCodes();
        expect(code?.attempts).toBe(AUTH_POLICY.otp.maxAttempts);

        // And the cap holds afterwards: the right code is worth nothing now.
        await expect(authService.verifyEmail({ email: EMAIL, code: DEV_CODE })).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });

    it('the right code submitted many times at once is spent exactly once', async () => {
        const results = await Promise.allSettled(
            Array.from({ length: AUTH_POLICY.otp.maxAttempts }, () =>
                authService.verifyEmail({ email: EMAIL, code: DEV_CODE }),
            ),
        );

        expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
        expect(
            results.filter(result => result.status === 'rejected' && result.reason instanceof BadRequestException),
        ).toHaveLength(AUTH_POLICY.otp.maxAttempts - 1);

        // One session, not one per request that matched the code.
        expect(await ctx.db.query.refreshTokens.findMany()).toHaveLength(1);
    });

    it('parallel resends leave exactly one live code', async () => {
        await Promise.all(Array.from({ length: 10 }, () => authService.resendEmailCode({ email: EMAIL })));

        expect(await liveCodes()).toHaveLength(1);
    });

    it('the code a resend replaced cannot be spent any more', async () => {
        const [before] = await liveCodes();
        await authService.resendEmailCode({ email: EMAIL });
        const [after] = await liveCodes();

        // Same plaintext (the dev code is pinned) but a new row: the old id is
        // gone, so a check that was in flight against it would consume nothing.
        expect(after?.id).not.toBe(before?.id);
        expect(after?.attempts).toBe(0);
    });
});
