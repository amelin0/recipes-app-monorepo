import { Injectable } from '@nestjs/common';

import { OtpService as OtpCodeGenerator } from '@dns/api-infrastructure/otp';
import { AUTH_POLICY } from '@dns/constants';
import { OtpCodeEntity, OtpCodeRepository } from '@dns/database';
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
        const code = this.generator.generateCode();

        await this.otpCodeRepository.issue({
            userId,
            purpose,
            codeHash: await this.generator.hashCode(code),
            expiresAt: new Date(Date.now() + AUTH_POLICY.otp.ttlMinutes * 60_000),
        });

        return code;
    }

    /**
     * Checks a code WITHOUT spending it, and returns the row it matched. The
     * caller spends it — by id, conditionally — in the same transaction as
     * whatever the code grants, so the grant exists only if this request, and
     * no concurrent one, consumed the code.
     *
     * Every failure raises the same error: an expired code, a wrong one, a
     * spent one and one out of attempts must be indistinguishable, or the
     * response becomes an oracle for whether a code was ever issued.
     */
    async check(userId: string, purpose: OtpPurpose, code: string): Promise<OtpCodeEntity> {
        // The attempt is taken before bcrypt runs, not after it fails. The
        // counter is the cap only if it is spent up front: incrementing after a
        // wrong guess lets every guess of a parallel burst see «0 used».
        const record = await this.otpCodeRepository.reserveAttempt(userId, purpose, AUTH_POLICY.otp.maxAttempts);

        if (!record || !(await this.generator.matches(code, record.codeHash))) {
            throw invalidCodeException();
        }

        return record;
    }

    /** Checks and spends a code, for a flow whose grant needs no transaction of its own. */
    async consume(userId: string, purpose: OtpPurpose, code: string): Promise<void> {
        const record = await this.check(userId, purpose, code);

        // Zero rows: a concurrent request with the same code spent it first,
        // or a resend replaced it while this one was comparing.
        if (!(await this.otpCodeRepository.consume(record.id))) throw invalidCodeException();
    }
}
