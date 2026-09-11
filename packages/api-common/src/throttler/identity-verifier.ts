/**
 * Injection token for the app's `ThrottlerIdentityVerifier`. Optional: an app
 * that provides none is throttled by client address alone.
 */
export const THROTTLER_IDENTITY_VERIFIER = Symbol('THROTTLER_IDENTITY_VERIFIER');

/**
 * Turns a bearer token into the id of whoever it was issued to — or null.
 *
 * It MUST check the signature (and the token's `type`), not merely decode it.
 * The throttler keys a caller's bucket on what this returns, so a verifier that
 * trusted an unsigned `sub` would let every request name a fresh bucket and
 * the limit would stop limiting anything.
 *
 * Lives in each app rather than here because each signs with its own secret
 * (ADR-0002): the shared package has no business knowing either key.
 */
export interface ThrottlerIdentityVerifier {
    verify(bearerToken: string): Promise<string | null>;
}
