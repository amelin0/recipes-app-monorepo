import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AdminEntity, AdminRepository } from '@dns/database';

import { AllConfig } from '../../../common/config';
import { AdminAccessTokenPayload } from '../auth.types';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService<AllConfig>,
        private readonly adminRepository: AdminRepository,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            // ADMIN_JWT_SECRET, never the client's: a mobile user's token must
            // not verify here even though both are signed the same way.
            secretOrKey: configService.getOrThrow('auth.access.secret', { infer: true }),
        });
    }

    /**
     * Re-reads the account on every request instead of trusting the claims.
     *
     * This is what makes deactivation take effect now rather than in up to
     * fifteen minutes (sign-in FR-008), and what stops a role change from
     * lagging behind its token. It costs one indexed read per request, which
     * is the right trade on a surface with a handful of users and a lot of
     * authority.
     */
    async validate(payload: AdminAccessTokenPayload): Promise<AdminEntity> {
        // First, because a refresh token is also a signed JWT with a `sub`.
        // Without this check one would open a session at any guarded route.
        if (payload.type !== 'access') {
            throw new UnauthorizedException();
        }

        const admin = await this.adminRepository.findById(payload.sub);

        if (!admin || !admin.canSignIn()) {
            throw new UnauthorizedException();
        }

        return admin;
    }
}
