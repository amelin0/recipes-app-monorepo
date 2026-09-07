import { randomInt } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';

import { OTP_CONFIG } from './otp.tokens';
import { OtpConfig } from './otp.types';

/** Six digits, per the sign-up and password-reset specs. */
const OTP_MIN = 100_000;
const OTP_MAX = 999_999;

/**
 * bcrypt rather than a fast digest: the search space of a 6-digit code is
 * only 10^6, so a leaked table of SHA-256 codes would be reversed instantly.
 */
const OTP_HASH_ROUNDS = 10;

/**
 * Generates and checks one-time codes. Storage — the row, its expiry and the
 * attempt counter — belongs to the auth domain (`otp_codes`), not here:
 * this service holds no state, so both APIs can use it freely.
 */
@Injectable()
export class OtpService {
    constructor(@Inject(OTP_CONFIG) private readonly cfg: OtpConfig) {}

    generateCode(): string {
        if (this.cfg.devCode) {
            return this.cfg.devCode;
        }

        // randomInt is the CSPRNG variant; Math.random would make codes
        // predictable from a handful of observed values.
        return randomInt(OTP_MIN, OTP_MAX + 1).toString();
    }

    hashCode(code: string): Promise<string> {
        return hash(code, OTP_HASH_ROUNDS);
    }

    matches(code: string, codeHash: string): Promise<boolean> {
        return compare(code, codeHash);
    }
}
