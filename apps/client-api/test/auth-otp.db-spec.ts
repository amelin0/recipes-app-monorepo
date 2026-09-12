import { BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';

import { AUTH_POLICY } from '@dns/constants';
import { OtpCodeRepository, UserRepository } from '@dns/database';
import { OtpPurpose } from '@dns/shared-types';

import { AuthService } from '../src/modules/auth/auth.service';
import { PasswordResetService } from '../src/modules/auth/password-reset.service';
import { TokenService } from '../src/modules/auth/token.service';

import { truncateAuthTables } from './support/db';
import { AuthTestContext, createAuthTestContext } from './support/testing-module';

const EMAIL = 'codes@example.com';
const PASSWORD = 'passw0rd';
// OTP_DEV_CODE in .env pins the generated code, so the test knows the answer.
const DEV_CODE = '000000';
const WRONG_CODE = '111111';

describe('One-time codes', () => {
    let ctx: AuthTestContext;
    let authService: AuthService;
    let passwordReset: PasswordResetService;
    let tokenService: TokenService;
    let otpCodes: OtpCodeRepository;
    let users: UserRepository;

    beforeAll(async () => {
        ctx = await createAuthTestContext();
        authService = ctx.moduleRef.get(AuthService);
        passwordReset = ctx.moduleRef.get(PasswordResetService);
        tokenService = ctx.moduleRef.get(TokenService);
        otpCodes = ctx.moduleRef.get(OtpCodeRepository);
        users = ctx.moduleRef.get(UserRepository);
    });

    afterAll(async () => {
        await ctx.close();
    });

    beforeEach(async () => {
        await truncateAuthTables(ctx.db);
    });

    it('spends the code after the attempt cap, even when the right one follows', async () => {
        await authService.register({ email: EMAIL, password: PASSWORD });

        for (let attempt = 0; attempt < AUTH_POLICY.otp.maxAttempts; attempt++) {
            await expect(authService.verifyEmail({ email: EMAIL, code: WRONG_CODE })).rejects.toBeInstanceOf(
                BadRequestException,
            );
        }

        // The cap is the point: a correct guess afterwards is worth nothing.
        await expect(authService.verifyEmail({ email: EMAIL, code: DEV_CODE })).rejects.toBeInstanceOf(
            BadRequestException,
        );

        const user = await users.findByEmail(EMAIL);
        expect(user?.isEmailVerified()).toBe(false);
    });

    it('a resend invalidates the previous code (FR-006)', async () => {
        await authService.register({ email: EMAIL, password: PASSWORD });
        const first = await otpCodes.findActive((await users.findByEmail(EMAIL))!.id, OtpPurpose.EmailVerification);

        await authService.resendEmailCode({ email: EMAIL });

        const user = await users.findByEmail(EMAIL);
        const second = await otpCodes.findActive(user!.id, OtpPurpose.EmailVerification);

        expect(second).not.toBeNull();
        expect(second?.id).not.toBe(first?.id);
        // Exactly one code is live at a time.
        expect(await ctx.db.query.otpCodes.findMany()).toHaveLength(1);
    });

    it('the same code cannot be spent twice', async () => {
        await authService.register({ email: EMAIL, password: PASSWORD });
        await authService.verifyEmail({ email: EMAIL, code: DEV_CODE });

        await expect(authService.verifyEmail({ email: EMAIL, code: DEV_CODE })).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });

    it('registering over a verified account is refused, over an unverified one is not', async () => {
        await authService.register({ email: EMAIL, password: PASSWORD });

        // Unverified: a second attempt sends a new code bound to its password.
        await expect(authService.register({ email: EMAIL, password: 'other123' })).resolves.toBeUndefined();
        await authService.verifyEmail({ email: EMAIL, code: DEV_CODE });

        // The code verified is the LAST attempt's, so its password is the live one.
        await expect(authService.login({ email: EMAIL, password: 'other123' })).resolves.toHaveProperty('accessToken');

        // Verified: FR-009 wants a distinguishable answer.
        await expect(authService.register({ email: EMAIL, password: PASSWORD })).rejects.toBeInstanceOf(
            ConflictException,
        );
    });

    it('signing in before verification sends a fresh code instead of a session (FR-003)', async () => {
        await authService.register({ email: EMAIL, password: PASSWORD });

        await expect(authService.login({ email: EMAIL, password: PASSWORD })).rejects.toBeInstanceOf(
            ForbiddenException,
        );

        const user = await users.findByEmail(EMAIL);
        expect(await otpCodes.findActive(user!.id, OtpPurpose.EmailVerification)).not.toBeNull();
    });

    it('a completed password reset kills every session and both artefacts (FR-005)', async () => {
        await authService.register({ email: EMAIL, password: PASSWORD });
        await authService.verifyEmail({ email: EMAIL, code: DEV_CODE });
        const session = await authService.login({ email: EMAIL, password: PASSWORD });

        await passwordReset.request({ email: EMAIL });
        const permitToken = await passwordReset.verifyCode({ email: EMAIL, code: DEV_CODE });
        await passwordReset.setNewPassword({
            permitToken,
            password: 'brandnew1',
            passwordConfirmation: 'brandnew1',
        });

        await expect(tokenService.rotate(session.refreshToken)).rejects.toBeInstanceOf(UnauthorizedException);
        expect(await ctx.db.query.refreshTokens.findMany()).toHaveLength(0);
        expect(await ctx.db.query.passwordResetPermits.findMany()).toHaveLength(0);

        await expect(authService.login({ email: EMAIL, password: 'brandnew1' })).resolves.toHaveProperty('accessToken');
    });

    it('a reset request for an unknown address is silent and writes nothing', async () => {
        await expect(passwordReset.request({ email: 'ghost@example.com' })).resolves.toBeUndefined();

        expect(await ctx.db.query.otpCodes.findMany()).toHaveLength(0);
        expect(await ctx.db.query.users.findMany()).toHaveLength(0);
    });
});
