import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';

import { isUniqueViolation } from '@dns/api-common';
import { AUTH_POLICY } from '@dns/constants';
import { UserEntity, UserRepository } from '@dns/database';
import { AuthTokens, OtpPurpose } from '@dns/shared-types';
import { LoginInput, RegisterInput, ResendEmailCodeInput, VerifyEmailInput } from '@dns/validation';

import { newAccountInput } from './account.factory';
import { AuthErrorCode, invalidCodeException } from './auth.errors';
import { OtpMailer } from './otp.mailer';
import { AuthOtpService } from './otp.service';
import { TokenService } from './token.service';

/**
 * A real bcrypt digest (cost 10) of a passphrase nothing will ever submit.
 * Generated rather than invented: a malformed hash would be rejected before
 * bcrypt does any work, and the comparison it stands in for would stop
 * costing the same as a real one.
 */
const DUMMY_PASSWORD_HASH = '$2b$10$JRmUsqQaMrXeTxKP0af71.3sVyWt0wJkdwckjenvkXMzVjLCrMzWW';

@Injectable()
export class AuthService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly otpService: AuthOtpService,
        private readonly otpMailer: OtpMailer,
        private readonly tokenService: TokenService,
    ) {}

    /**
     * Creates the account (or finds the unconfirmed one) and sends a code. No
     * session is issued yet — sign-up FR-003 keeps the account unverified
     * until the code is confirmed.
     *
     * The password is NOT written to the account. It is bound to the code
     * this call sends and becomes the account's password only if that code is
     * the one verified. An unverified row means nobody has proved they own the
     * address, so anyone may register over it — which is also the only way out
     * for someone who mistyped their password — but a second registration can
     * no longer overwrite the password of one already in flight.
     */
    async register({ email, password }: RegisterInput): Promise<void> {
        const passwordHash = await hash(password, AUTH_POLICY.bcryptRounds);
        const user = await this.findOrCreateUnverifiedAccount(email);

        await this.sendEmailVerificationCode(user, passwordHash);
    }

    /**
     * Every failure answers identically (sign-in FR-002): an unknown address,
     * a wrong password and a provider-only account without one are one and the
     * same 401, so the response cannot be used to discover who has an account.
     */
    async login({ email, password }: LoginInput): Promise<AuthTokens> {
        const user = await this.userRepository.findByEmail(email);
        const passwordMatches = await this.verifyPassword(password, await this.passwordHashToCheck(user));

        if (!user || !passwordMatches) {
            throw new UnauthorizedException({
                message: 'Invalid email or password',
                code: AuthErrorCode.InvalidCredentials,
            });
        }

        // Only reachable once the password is already correct, so naming the
        // reason here reveals nothing to anyone who does not own the account.
        // FR-003: no session, and a fresh code so the app can go straight to
        // the confirmation screen. The code carries the pending password over.
        if (!user.isEmailVerified()) {
            await this.sendEmailVerificationCode(user);

            throw new ForbiddenException({
                message: 'Email is not verified',
                code: AuthErrorCode.EmailNotVerified,
            });
        }

        // The hash just compared travels with the grant: a password reset that
        // commits before the session is stored makes this sign-in fail
        // instead of opening a session with the old password.
        return this.tokenService.issuePair(user, { expectedPasswordHash: user.passwordHash });
    }

    /** Confirms the address and, per FR-007, signs the user in straight away. */
    async verifyEmail({ email, code }: VerifyEmailInput): Promise<AuthTokens> {
        const user = await this.userRepository.findByEmail(email);

        // The same error a wrong code raises — an address with no account must
        // not be distinguishable from a bad code.
        if (!user) throw invalidCodeException();

        const record = await this.otpService.check(user.id, OtpPurpose.EmailVerification, code);

        // Spends the code, confirms the address and activates the password
        // bound to this code, together. Null: a concurrent request spent the
        // code first, a resend replaced it, or the account got confirmed some
        // other way in the meantime.
        const verified = await this.userRepository.verifyEmailWithCode({ userId: user.id, codeId: record.id });
        if (!verified) throw invalidCodeException();

        return this.tokenService.issuePair(verified);
    }

    /**
     * Always answers the same way. An account that is missing or already
     * verified simply has no code to send, and saying so would turn this into
     * an address checker.
     */
    async resendEmailCode({ email }: ResendEmailCodeInput): Promise<void> {
        const user = await this.userRepository.findByEmail(email);

        if (!user || user.isEmailVerified()) return;

        await this.sendEmailVerificationCode(user);
    }

    /**
     * Sends a sign-up code. With `passwordHash` the code carries that
     * password; without it (a resend, a sign-in to an unconfirmed account)
     * it carries over the one the replaced code held.
     */
    async sendEmailVerificationCode(user: UserEntity, passwordHash?: string): Promise<void> {
        const code = await this.otpService.issue(user.id, OtpPurpose.EmailVerification, passwordHash);
        await this.otpMailer.sendEmailVerificationCode(user.email, code);
    }

    /**
     * FR-009 wants a registered address answered distinguishably, so a
     * confirmed one is a 409 `auth.email-taken`. Enumeration is accepted here
     * and refused on sign-in and password reset, where nothing is gained by
     * telling the caller the address is unknown.
     */
    private async findOrCreateUnverifiedAccount(email: string): Promise<UserEntity> {
        const existing = await this.userRepository.findByEmail(email);
        if (existing) return this.unverifiedOrConflict(existing);

        try {
            return await this.userRepository.createAccount(newAccountInput({ email }));
        } catch (error) {
            if (!isUniqueViolation(error)) throw error;

            // A double-tapped «Sign up»: the other request inserted the same
            // address first and `users_email_unique` turned this one away.
            // Carry on with the row it created, exactly as a later
            // registration over an unconfirmed address would — rather than
            // answering the second tap with a 500.
            const winner = await this.userRepository.findByEmail(email);
            if (!winner) throw error;

            return this.unverifiedOrConflict(winner);
        }
    }

    private unverifiedOrConflict(user: UserEntity): UserEntity {
        if (user.isEmailVerified()) {
            throw new ConflictException({
                message: 'An account with this email already exists',
                code: AuthErrorCode.EmailTaken,
            });
        }

        return user;
    }

    /**
     * What a sign-in password is compared with. A confirmed account has its
     * own; an unconfirmed one has none yet, so the check runs against the
     * password its pending sign-up code carries (falling back to the account's
     * for rows from before passwords moved onto codes, or one set by a reset).
     */
    private async passwordHashToCheck(user: UserEntity | null): Promise<string | null> {
        if (!user) return null;
        if (user.isEmailVerified()) return user.passwordHash;

        return (await this.otpService.pendingPasswordHash(user.id)) ?? user.passwordHash;
    }

    /**
     * Runs a compare even when there is no account, against a hash that
     * matches nothing. Without it a missing address answers noticeably faster
     * than a wrong password, and the timing difference is the enumeration
     * oracle FR-002 exists to close.
     */
    private verifyPassword(password: string, passwordHash: string | null): Promise<boolean> {
        return compare(password, passwordHash ?? DUMMY_PASSWORD_HASH);
    }
}
