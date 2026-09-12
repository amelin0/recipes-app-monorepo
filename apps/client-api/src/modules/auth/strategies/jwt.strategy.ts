import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserEntity, UserRepository } from '@dns/database';

import { AllConfig } from '../../../common/config';
import { AccessTokenPayload } from '../auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService<AllConfig>,
        private readonly userRepository: UserRepository,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow('auth.access.secret', { infer: true }),
        });
    }

    /**
     * Re-reads the account on every request rather than trusting the claims.
     * A token stays cryptographically valid for its full 15 minutes, so
     * without this an account that was just deleted — or whose email
     * verification was somehow revoked — would keep working until it expired.
     */
    async validate(payload: AccessTokenPayload): Promise<UserEntity> {
        // The type check comes first: a refresh token or a reset permit is
        // also a signed JWT with a `sub`, and without this any of them would
        // open a session.
        if (payload.type !== 'access') {
            throw new UnauthorizedException();
        }

        const user = await this.userRepository.findById(payload.sub);

        // Blocked accounts die here rather than when their token expires:
        // «block him now» has to mean now, not within fifteen minutes
        // (admin user-directory SC-002).
        if (!user || !user.isEmailVerified() || user.isBlocked()) {
            throw new UnauthorizedException();
        }

        // The same argument, for the revocations that used to stop at the
        // refresh chains. «Log out everywhere» and a completed password reset
        // delete those rows, but this token is stateless — there is nothing to
        // delete, and it kept working for the rest of its fifteen minutes,
        // writes included. The account records when its sessions were last
        // ended wholesale; a token stamped before that is no longer part of one
        // (session FR-007, password-reset FR-005).
        if (!user.acceptsTokenIssuedAt(payload.iat)) {
            throw new UnauthorizedException();
        }

        return user;
    }
}
