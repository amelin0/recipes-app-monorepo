import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { ThrottlerIdentityVerifier } from '@dns/api-common';

import { AllConfig } from '../../common/config';

import { AdminAccessTokenPayload } from './auth.types';

/**
 * Tells the throttler whose request this is — from a signature check against
 * the ADMIN access secret, not a decode. Anything that does not verify
 * identifies nobody, and the request is throttled by address instead.
 *
 * No database read: the throttler runs before `AdminJwtGuard`, on every
 * request, and a deactivated admin holding a still-valid token merely gets
 * its own bucket until the guard turns the request away.
 */
@Injectable()
export class AdminAccessTokenIdentityVerifier implements ThrottlerIdentityVerifier {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService<AllConfig>,
    ) {}

    async verify(bearerToken: string): Promise<string | null> {
        try {
            const payload = await this.jwtService.verifyAsync<AdminAccessTokenPayload>(bearerToken, {
                secret: this.configService.getOrThrow('auth.access.secret', { infer: true }),
            });

            return payload.type === 'access' && typeof payload.sub === 'string' ? payload.sub : null;
        } catch {
            return null;
        }
    }
}
