import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import appleSignin from 'apple-signin-auth';
import { OAuth2Client } from 'google-auth-library';

import { OAuthProvider } from '@dns/shared-types';

import { OAUTH_CONFIG } from './oauth.tokens';
import { OAuthConfig, OAuthUserPayload } from './oauth.types';

@Injectable()
export class OAuthService {
    private readonly googleClient: OAuth2Client;

    constructor(@Inject(OAUTH_CONFIG) private readonly cfg: OAuthConfig) {
        this.googleClient = new OAuth2Client(cfg.google.clientId);
    }

    verifyIdToken(provider: OAuthProvider, idToken: string): Promise<OAuthUserPayload> {
        return provider === OAuthProvider.Google ? this.verifyGoogle(idToken) : this.verifyApple(idToken);
    }

    private async verifyGoogle(idToken: string): Promise<OAuthUserPayload> {
        const ticket = await this.googleClient
            // `audience` is what makes this a verification rather than a
            // decode: without it a token minted for any other Google app
            // would be accepted here.
            .verifyIdToken({ idToken, audience: this.cfg.google.clientId })
            .catch(() => {
                throw new UnauthorizedException('Invalid Google token');
            });

        const payload = ticket.getPayload();
        if (!payload?.sub || !payload.email) {
            throw new UnauthorizedException('Invalid Google token payload');
        }

        return { provider: OAuthProvider.Google, providerUserId: payload.sub, email: payload.email };
    }

    private async verifyApple(idToken: string): Promise<OAuthUserPayload> {
        const payload = await appleSignin
            .verifyIdToken(idToken, { audience: this.cfg.apple.clientId, ignoreExpiration: false })
            .catch(() => {
                throw new UnauthorizedException('Invalid Apple token');
            });

        if (!payload.sub) {
            throw new UnauthorizedException('Invalid Apple token payload');
        }

        // Apple omits the email on every sign-in after the first. A synthetic
        // relay address keeps the NOT NULL column satisfiable; it is never the
        // thing the account is matched on.
        const email = payload.email ?? `${payload.sub}@privaterelay.appleid.com`;

        return { provider: OAuthProvider.Apple, providerUserId: payload.sub, email: email.toLowerCase() };
    }
}
