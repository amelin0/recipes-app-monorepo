import { OAuthProvider } from '@dns/shared-types';

export interface OAuthConfig {
    google: { clientId: string };
    apple: { clientId: string };
}

export interface OAuthUserPayload {
    provider: OAuthProvider;
    /**
     * The provider's stable id for this person. The account link hangs off
     * this and never off the email — Apple's private relay address can change,
     * and re-keying on it would cut the owner off from their own account.
     */
    providerUserId: string;
    email: string;
}
