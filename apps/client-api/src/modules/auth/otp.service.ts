import { Injectable } from '@nestjs/common';

import { OtpService as OtpCodeGenerator } from '@dns/api-infrastructure/otp';
import { AUTH_POLICY } from '@dns/constants';
import { OtpCodeRepository } from '@dns/database';
import { OtpPurpose } from '@dns/shared-types';

import { invalidCodeException } from './auth.errors';

/**
 * Issues and checks the 6-digit codes both auth flows rely on. Everything
 * about a code — expiry, single use, the attempt cap — lives here so sign-up
 * and password reset cannot drift apart in how strictly they treat one.
 */
@Injectable()
export class AuthOtpService {
    constructor(
        private readonly generator: OtpCodeGenerator,
        private readonly otpCodeRepository: OtpCodeRepository,
    ) {}

    /**
     * Issues a code, invalidating whatever came before for this flow
     * (sign-up FR-006, password-reset FR-006), and returns the plaintext for
     * the mailer — it is never stored and never leaves this process again.
     */
    async issue(userId: string, purpose: OtpPurpose): Promise<string> {
        await this.otpCodeRepository.deleteAllFor(userId, purpose);

        const code = this.generator.generateCode();

        await this.otpCodeRepository.create({
            userId,
            purpose,
            codeHash: await this.generator.hashCode(code),
            expiresAt: new Date(Date.now() + AUTH_POLICY.otp.ttlMinutes * 60_000),
        });

        return code;
    }

    /**
     * Consumes the code on success. Every failure raises the same error: an
     * expired code, a wrong one and a spent one must be indistinguishable, or
     * the response becomes an oracle for whether a code was ever issued.
     */
    async consume(userId: string, purpose: OtpPurpose, code: string): Promise<void> {
        const record = await this.otpCodeRepository.findActive(userId, purpose);

        if (!record || !record.isUsable(AUTH_POLICY.otp.maxAttempts)) {
            throw invalidCodeException();
        }

        if (!(await this.generator.matches(code, record.codeHash))) {
            // Counted before the throw: without this a code could be guessed
            // 10^6 times, and the attempt cap would be decorative.
            await this.otpCodeRepository.incrementAttempts(record.id);
            throw invalidCodeException();
        }

        await this.otpCodeRepository.markConsumed(record.id);
    }
}
