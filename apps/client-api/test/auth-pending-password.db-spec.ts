import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';

import { AUTH_POLICY } from '@dns/constants';
import { OtpCodeRepository, UserRepository, schema } from '@dns/database';
import { OAuthProvider, OtpPurpose } from '@dns/shared-types';

import { AuthService } from '../src/modules/auth/auth.service';
import { OAuthSignInService } from '../src/modules/auth/oauth.service';
import { PasswordResetService } from '../src/modules/auth/password-reset.service';

import { truncateAuthTables } from './support/db';
import { AuthTestContext, createAuthTestContext } from './support/testing-module';

const EMAIL = 'pending@example.com';
const OWNER_PASSWORD = 'owner1234';
const STRANGER_PASSWORD = 'stranger1';
// OTP_DEV_CODE in .env pins the generated code, so the test knows the answer.
const DEV_CODE = '000000';

/**
 * A registration's password waits on its confirmation code and reaches the
 * account only when that code is verified. These are the ways a stranger who
 * knows nothing but the owner's address used to end up with the password of
 * the owner's confirmed account.
 */
describe('A pending sign-up password', () => {
    let ctx: AuthTestContext;
    let authService: AuthService;
    let oauthSignIn: OAuthSignInService;
    let passwordReset: PasswordResetService;
    let otpCodes: OtpCodeRepository;
    let users: UserRepository;

    beforeAll(async () => {
        ctx = await createAuthTestContext();
        authService = ctx.moduleRef.get(AuthService);
        oauthSignIn = ctx.moduleRef.get(OAuthSignInService);
        passwordReset = ctx.moduleRef.get(PasswordResetService);
        otpCodes = ctx.moduleRef.get(OtpCodeRepository);
        users = ctx.moduleRef.get(UserRepository);
    });

    afterAll(async () => {
        await ctx.close();
    });

    beforeEach(async () => {
        await truncateAuthTables(ctx.db);
    });

    const signsIn = async (password: string): Promise<boolean> =>
        authService.login({ email: EMAIL, password }).then(
            () => true,
            () => false,
        );

    it('is not written to the account — a second registration cannot overwrite the first', async () => {
        await authService.register({ email: EMAIL, password: OWNER_PASSWORD });
        await authService.register({ email: EMAIL, password: STRANGER_PASSWORD });

        const user = await users.findByEmail(EMAIL);
        // Before the fix this held the stranger's hash from the moment of the
        // second registration, whichever code was verified afterwards.
        expect(user?.passwordHash).toBeNull();
    });

    /**
     * The interleaving the old code lost: a registration reads «unconfirmed»,
     * the owner confirms, and the registration's write lands on a confirmed
     * account. Replayed here step by step — the late registration's write is
     * issuing a code bound to its password.
     */
    it('a registration that lands after confirmation changes nothing', async () => {
        await authService.register({ email: EMAIL, password: OWNER_PASSWORD });
        const user = await users.findByEmail(EMAIL);

        await authService.verifyEmail({ email: EMAIL, code: DEV_CODE });

        // The stranger's request read the account before the confirmation.
        await otpCodes.issue({
            userId: user!.id,
            purpose: OtpPurpose.EmailVerification,
            codeHash: await hash(DEV_CODE, AUTH_POLICY.bcryptRounds),
            expiresAt: new Date(Date.now() + 60_000),
            passwordHash: await hash(STRANGER_PASSWORD, AUTH_POLICY.bcryptRounds),
        });

        // Even the code that registration sent confirms nothing now.
        await expect(authService.verifyEmail({ email: EMAIL, code: DEV_CODE })).rejects.toBeInstanceOf(
            BadRequestException,
        );

        expect(await signsIn(OWNER_PASSWORD)).toBe(true);
        expect(await signsIn(STRANGER_PASSWORD)).toBe(false);
    });

    it('confirmation racing a registration never leaves both passwords working', async () => {
        await authService.register({ email: EMAIL, password: OWNER_PASSWORD });

        await Promise.allSettled([
            authService.verifyEmail({ email: EMAIL, code: DEV_CODE }),
            authService.register({ email: EMAIL, password: STRANGER_PASSWORD }),
        ]);

        const user = await users.findByEmail(EMAIL);
        if (user?.isEmailVerified()) {
            // Whichever code got verified, exactly its password is live.
            const owner = await signsIn(OWNER_PASSWORD);
            const stranger = await signsIn(STRANGER_PASSWORD);
            expect(owner !== stranger).toBe(true);
        } else {
            expect(user?.passwordHash).toBeNull();
        }
    });

    /**
     * Pre-account hijacking: the stranger registers the owner's address first,
     * the owner never sees that code and signs in with Google instead. Before
     * the fix the account came out confirmed with the stranger's password.
     */
    it('does not survive a confirmation through Apple or Google', async () => {
        await authService.register({ email: EMAIL, password: STRANGER_PASSWORD });

        ctx.oauth.willReturn(OAuthProvider.Google, 'owner-google-id', EMAIL);
        await oauthSignIn.signIn({ provider: OAuthProvider.Google, idToken: 'stub' });

        const user = await users.findByEmail(EMAIL);
        expect(user?.isEmailVerified()).toBe(true);
        expect(user?.hasPassword()).toBe(false);
        expect(await otpCodes.findActive(user!.id, OtpPurpose.EmailVerification)).toBeNull();

        await expect(authService.login({ email: EMAIL, password: STRANGER_PASSWORD })).rejects.toBeInstanceOf(
            UnauthorizedException,
        );
    });

    it('still lets the registrant sign in to an unconfirmed account and get a fresh code (sign-in FR-003)', async () => {
        await authService.register({ email: EMAIL, password: OWNER_PASSWORD });

        await expect(authService.login({ email: EMAIL, password: OWNER_PASSWORD })).rejects.toBeInstanceOf(
            ForbiddenException,
        );
        await expect(authService.login({ email: EMAIL, password: 'wrong1234' })).rejects.toBeInstanceOf(
            UnauthorizedException,
        );

        // The re-issued code carried the password over.
        await authService.verifyEmail({ email: EMAIL, code: DEV_CODE });
        expect(await signsIn(OWNER_PASSWORD)).toBe(true);
    });

    it('outlives its expired code: the sweep keeps it, and sign-in still says «confirm your email»', async () => {
        await authService.register({ email: EMAIL, password: OWNER_PASSWORD });
        const user = await users.findByEmail(EMAIL);

        await ctx.db
            .update(schema.otpCodes)
            .set({ expiresAt: new Date(Date.now() - 86_400_000) })
            .where(eq(schema.otpCodes.userId, user!.id));

        await otpCodes.deleteExpired(new Date());

        await expect(authService.login({ email: EMAIL, password: OWNER_PASSWORD })).rejects.toBeInstanceOf(
            ForbiddenException,
        );
    });

    it('a resend carries the password over to the new code', async () => {
        await authService.register({ email: EMAIL, password: OWNER_PASSWORD });
        await authService.resendEmailCode({ email: EMAIL });

        await authService.verifyEmail({ email: EMAIL, code: DEV_CODE });

        expect(await signsIn(OWNER_PASSWORD)).toBe(true);
    });

    it('a reset on an unconfirmed account supersedes the pending password', async () => {
        await authService.register({ email: EMAIL, password: STRANGER_PASSWORD });

        // The owner never got the sign-up code into the app, but reset the
        // password through the mailbox — which proves ownership.
        await passwordReset.request({ email: EMAIL });
        const permitToken = await passwordReset.verifyCode({ email: EMAIL, code: DEV_CODE });
        await passwordReset.setNewPassword({
            permitToken,
            password: OWNER_PASSWORD,
            passwordConfirmation: OWNER_PASSWORD,
        });

        // Still unconfirmed, so a sign-in answers 403 and re-sends — against
        // the reset password, not the registration's.
        await expect(authService.login({ email: EMAIL, password: OWNER_PASSWORD })).rejects.toBeInstanceOf(
            ForbiddenException,
        );
        await authService.verifyEmail({ email: EMAIL, code: DEV_CODE });

        expect(await signsIn(OWNER_PASSWORD)).toBe(true);
        expect(await signsIn(STRANGER_PASSWORD)).toBe(false);
    });
});
