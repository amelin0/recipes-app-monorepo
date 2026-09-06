import { Injectable } from '@nestjs/common';

import { OAuthService as OAuthVerifier } from '@dns/api-infrastructure/oauth';
import { OAuthIdentityRepository, UserEntity, UserRepository } from '@dns/database';
import { AuthTokens } from '@dns/shared-types';
import { OAuthSignInInput } from '@dns/validation';

import { TokenService } from './token.service';

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

        const user = await this.resolveAccount(profile.providerUserId, profile.email, provider);

        return this.tokenService.issuePair(user);
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
            await this.oauthIdentityRepository.create({ userId: existing.id, provider, providerUserId });

            // An unverified account becomes verified here: the provider has
            // just asserted ownership of the address, which is exactly what
            // the emailed code was asking the user to prove.
            if (!existing.isEmailVerified()) {
                await this.userRepository.markEmailVerified(existing.id);
                const refreshed = await this.userRepository.findById(existing.id);
                return refreshed ?? existing;
            }

            return existing;
        }

        // 3. Nobody yet. The account starts verified and without a password
        //    (sign-up FR-012); a password can be added later through the reset
        //    flow (FR-013).
        const created = await this.userRepository.create({
            email,
            passwordHash: null,
            emailVerifiedAt: new Date(),
        });

        await this.oauthIdentityRepository.create({ userId: created.id, provider, providerUserId });

        return created;
    }
}
