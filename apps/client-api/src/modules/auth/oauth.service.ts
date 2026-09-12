import { Injectable } from '@nestjs/common';

import { isUniqueViolation } from '@dns/api-common';
import { OAuthService as OAuthVerifier } from '@dns/api-infrastructure/oauth';
import { OAuthIdentityRepository, UserEntity, UserRepository } from '@dns/database';
import { AuthTokens } from '@dns/shared-types';
import { OAuthSignInInput } from '@dns/validation';

import { newAccountInput } from './account.factory';
import { TokenService } from './token.service';

/**
 * How many times account resolution is run when a concurrent sign-in keeps
 * winning the insert. Each lost race means the other request committed, so
 * the next pass finds its rows; three covers «create account» then «link»
 * both being lost, and anything beyond that is not a double tap.
 */
const RESOLVE_ATTEMPTS = 3;

/**
 * Sign-in and sign-up through a provider are one mechanism, not two: the app
 * cannot know in advance whether the person already has an account, so both
 * buttons land here (sign-up FR-011, sign-in FR-004…FR-006).
 */
@Injectable()
export class OAuthSignInService {
    constructor(
        private readonly verifier: OAuthVerifier,
        private readonly oauthIdentityRepository: OAuthIdentityRepository,
        private readonly userRepository: UserRepository,
        private readonly tokenService: TokenService,
    ) {}

    async signIn({ provider, idToken }: OAuthSignInInput): Promise<AuthTokens> {
        const profile = await this.verifier.verifyIdToken(provider, idToken);

        const user = await this.resolveAccountRetrying(profile.providerUserId, profile.email, provider);

        return this.tokenService.issuePair(user);
    }

    /**
     * Resolution is read-then-write, and the writes are guarded by unique
     * indexes — `users_email_unique` and `oauth_identities_provider_user_unique`
     * — not by the reads. Two first sign-ins of one person (a double tap, or
     * the app retrying) both read «nobody yet» and both insert; the index
     * turns the loser away, and the loser simply resolves again and finds what
     * the winner committed. Before, that second request was a 500.
     */
    private async resolveAccountRetrying(
        providerUserId: string,
        email: string,
        provider: OAuthSignInInput['provider'],
    ): Promise<UserEntity> {
        for (let attempt = 1; ; attempt++) {
            try {
                return await this.resolveAccount(providerUserId, email, provider);
            } catch (error) {
                if (!isUniqueViolation(error) || attempt >= RESOLVE_ATTEMPTS) throw error;
            }
        }
    }

    private async resolveAccount(
        providerUserId: string,
        email: string,
        provider: OAuthSignInInput['provider'],
    ): Promise<UserEntity> {
        // 1. Known identity — the ordinary repeat sign-in.
        const linked = await this.oauthIdentityRepository.findByProviderUserId(provider, providerUserId);
        if (linked) return linked.user;

        // 2. The address already has an account. Link rather than duplicate
        //    (sign-in FR-006) — otherwise someone who registered with a
        //    password and later taps "Continue with Google" ends up with two
        //    accounts and loses their data.
        const existing = await this.userRepository.findByEmail(email);
        if (existing) {
            // An unverified account becomes verified here: the provider has
            // just asserted ownership of the address, which is exactly what
            // the emailed code was asking the user to prove. Its password, set
            // by whoever registered the address without proving it, is
            // dropped in the same transaction — see `linkOAuthIdentity`.
            const withLink = await this.userRepository.linkOAuthIdentity({
                userId: existing.id,
                provider,
                providerUserId,
            });

            return withLink ?? existing;
        }

        // 3. Nobody yet. The account starts verified and without a password
        //    (sign-up FR-012); a password can be added later through the reset
        //    flow (FR-013). The identity goes in with it, in one transaction.
        return this.userRepository.createAccount({
            ...newAccountInput({ email, emailVerified: true }),
            oauthIdentity: { provider, providerUserId },
        });
    }
}
