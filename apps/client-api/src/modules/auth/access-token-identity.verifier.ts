import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { ThrottlerIdentityVerifier } from '@dns/api-common';

import { AllConfig } from '../../common/config';

import { AccessTokenPayload } from './auth.types';

/**
 * Tells the throttler whose request this is — from a signature check, not a
 * decode. A token that does not verify as one of our access tokens identifies
 * nobody, and the request is throttled by address instead.
 *
 * Deliberately no database read: the throttler runs on every request, and a
 * blocked or deleted account holding a still-valid token simply gets its own
 * bucket for the few minutes the token lives — `JwtStrategy` turns the
 * request away right after.
 */
@Injectable()
export class AccessTokenIdentityVerifier implements ThrottlerIdentityVerifier {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService<AllConfig>,
    ) {}

    async verify(bearerToken: string): Promise<string | null> {
        try {
            const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(bearerToken, {
                secret: this.configService.getOrThrow('auth.access.secret', { infer: true }),
            });

            return payload.type === 'access' && typeof payload.sub === 'string' ? payload.sub : null;
        } catch {
            return null;
        }
    }
}
