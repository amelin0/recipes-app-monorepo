import { randomUUID } from 'node:crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';

import { AUTH_POLICY } from '@dns/constants';
import { OtpCodeRepository, PasswordResetPermitRepository, UserRepository } from '@dns/database';
import { OtpPurpose } from '@dns/shared-types';
import { RequestPasswordResetInput, SetNewPasswordInput, VerifyPasswordResetCodeInput } from '@dns/validation';

import { AllConfig } from '../../common/config';

import { AuthErrorCode, invalidCodeException } from './auth.errors';
import { PasswordResetPermitPayload } from './auth.types';
import { OtpMailer } from './otp.mailer';
import { AuthOtpService } from './otp.service';
import { TokenService } from './token.service';

@Injectable()
export class PasswordResetService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly otpCodeRepository: OtpCodeRepository,
        private readonly permitRepository: PasswordResetPermitRepository,
        private readonly otpService: AuthOtpService,
        private readonly otpMailer: OtpMailer,
        private readonly tokenService: TokenService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService<AllConfig>,
    ) {}

    /**
     * Answers identically whether or not the address has an account
     * (FR-001) — the caller is not told, so this cannot be used to test
     * which addresses are registered.
     */
    async request({ email }: RequestPasswordResetInput): Promise<void> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) return;

        // Deliberately not gated on the account having a password: for one
        // created through Apple or Google this flow is how a password gets set
        // for the first time (sign-up FR-013).
        const code = await this.otpService.issue(user.id, OtpPurpose.PasswordReset);
        await this.otpMailer.sendPasswordResetCode(user.email, code);
    }

    /**
     * Trades a correct code for the one-shot right to change the password
     * (FR-003). Deliberately not a session: it authorises exactly one call.
     */
    async verifyCode({ email, code }: VerifyPasswordResetCodeInput): Promise<string> {
        const user = await this.userRepository.findByEmail(email);

        // The same error a wrong code raises: the request step refuses to
        // confirm whether an address is registered, and this step must not
        // undo that.
        if (!user) throw invalidCodeException();

        await this.otpService.consume(user.id, OtpPurpose.PasswordReset, code);

        const permitId = randomUUID();
        const expiresAt = new Date(Date.now() + AUTH_POLICY.passwordResetPermit.ttlMinutes * 60_000);

        await this.permitRepository.create({ id: permitId, userId: user.id, expiresAt });

        const payload: PasswordResetPermitPayload = { sub: user.id, jti: permitId, type: 'password-reset' };

        // Signed with the REFRESH secret, not the access one: a permit must
        // never verify as an access token. The `type` claim is the primary
        // guard; using a different key means a mistake in one check is not
        // enough on its own.
        return this.jwtService.signAsync(payload, {
            secret: this.configService.getOrThrow('auth.refresh.secret', { infer: true }),
            expiresIn: `${AUTH_POLICY.passwordResetPermit.ttlMinutes}m`,
        });
    }

    /**
     * Sets the new password and clears everything the old one could still
     * reach: all sessions, all permits, all outstanding codes (FR-005). No
     * session is issued — FR-009 sends the user back to the sign-in screen.
     */
    async setNewPassword({ permitToken, password }: SetNewPasswordInput): Promise<void> {
        const payload = await this.verifyPermitToken(permitToken);

        const permit = await this.permitRepository.findById(payload.jti);
        if (!permit || permit.isConsumed() || permit.isExpired()) throw this.invalidPermit();

        const user = await this.userRepository.findById(permit.userId);
        if (!user) throw this.invalidPermit();

        await this.permitRepository.markConsumed(permit.id);
        await this.userRepository.setPasswordHash(user.id, await hash(password, AUTH_POLICY.bcryptRounds));

        // Order matters: the password is already changed, so revoking now
        // cannot leave a window in which an old session outlives it.
        await this.tokenService.revokeAllForUser(user.id);
        await this.permitRepository.deleteAllForUser(user.id);
        await this.otpCodeRepository.deleteAllFor(user.id, OtpPurpose.PasswordReset);
    }

    private async verifyPermitToken(token: string): Promise<PasswordResetPermitPayload> {
        const payload = await this.jwtService
            .verifyAsync<PasswordResetPermitPayload>(token, {
                secret: this.configService.getOrThrow('auth.refresh.secret', { infer: true }),
            })
            .catch(() => {
                throw this.invalidPermit();
            });

        if (payload.type !== 'password-reset') throw this.invalidPermit();

        return payload;
    }

    private invalidPermit(): UnauthorizedException {
        return new UnauthorizedException({
            message: 'Invalid or expired permit',
            code: AuthErrorCode.InvalidPermit,
        });
    }
}
