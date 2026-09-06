import { ConflictException, Injectable } from '@nestjs/common';
import { hash } from 'bcryptjs';

import { AUTH_POLICY } from '@dns/constants';
import { UserEntity, UserRepository } from '@dns/database';
import { AuthTokens, OtpPurpose } from '@dns/shared-types';
import { RegisterInput, ResendEmailCodeInput, VerifyEmailInput } from '@dns/validation';

import { AuthErrorCode, invalidCodeException } from './auth.errors';
import { OtpMailer } from './otp.mailer';
import { AuthOtpService } from './otp.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly otpService: AuthOtpService,
        private readonly otpMailer: OtpMailer,
        private readonly tokenService: TokenService,
    ) {}

    /**
     * Creates the account and sends a code. No session is issued yet —
     * sign-up FR-003 keeps the account unverified until the code is confirmed.
     */
    async register({ email, password }: RegisterInput): Promise<void> {
        const existing = await this.userRepository.findByEmail(email);

        if (existing?.isEmailVerified()) {
            // Deliberately distinguishable from a validation error: FR-009
            // wants the user pointed at the sign-in screen, which a generic
            // "check your input" cannot do. Enumeration is accepted here and
            // refused on sign-in and password reset, where nothing is gained
            // by telling the caller the address is unknown.
            throw new ConflictException({
                message: 'An account with this email already exists',
                code: AuthErrorCode.EmailTaken,
            });
        }

        // An unverified row means nobody has proved they own the address, so
        // registering over it is safe — and it is the only way out for someone
        // who mistyped their password on the first attempt. The code still
        // goes to the mailbox, so this hands an attacker nothing.
        const user = existing
            ? await this.replaceUnverifiedRegistration(existing, password)
            : await this.userRepository.create({
                  email,
                  passwordHash: await hash(password, AUTH_POLICY.bcryptRounds),
              });

        await this.sendEmailVerificationCode(user);
    }

    /** Confirms the address and, per FR-007, signs the user in straight away. */
    async verifyEmail({ email, code }: VerifyEmailInput): Promise<AuthTokens> {
        const user = await this.userRepository.findByEmail(email);

        // The same error a wrong code raises — an address with no account must
        // not be distinguishable from a bad code.
        if (!user) throw invalidCodeException();

        await this.otpService.consume(user.id, OtpPurpose.EmailVerification, code);
        await this.userRepository.markEmailVerified(user.id);

        return this.tokenService.issuePair(user);
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

    async sendEmailVerificationCode(user: UserEntity): Promise<void> {
        const code = await this.otpService.issue(user.id, OtpPurpose.EmailVerification);
        await this.otpMailer.sendEmailVerificationCode(user.email, code);
    }

    private async replaceUnverifiedRegistration(user: UserEntity, password: string): Promise<UserEntity> {
        await this.userRepository.setPasswordHash(user.id, await hash(password, AUTH_POLICY.bcryptRounds));
        return user;
    }
}
