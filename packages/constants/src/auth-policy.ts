/**
 * Authentication thresholds, settled in docs/adr/0003-*.md.
 *
 * These are product policy, not deployment config, so they live here rather
 * than in env: changing "how many guesses does a code allow" is a decision,
 * not a knob to turn per environment. Rate limits — how often an endpoint may
 * be called at all — are the opposite and do live in env.
 */
export const AUTH_POLICY = Object.freeze({
    /** bcrypt cost for password and code hashes. */
    bcryptRounds: 10,

    password: {
        minLength: 8,
        /**
         * bcrypt reads at most 72 bytes and ignores the rest silently, which
         * would make two different long passwords interchangeable. Validation
         * rejects anything longer instead of truncating, so the limit is
         * something the user is told about rather than something that quietly
         * weakens their password. Counted in BYTES: a Cyrillic character is
         * two, so a 40-character passphrase can already be over the line.
         */
        maxBytes: 72,
        /** At least one letter and one digit; no symbol requirement. */
        pattern: /^(?=.*\p{L})(?=.*\d).+$/u,
    },

    otp: {
        length: 6,
        ttlMinutes: 10,
        /** Failed guesses before the code is spent (sign-up FR-005). */
        maxAttempts: 5,
        /** Client-side cooldown between resends; the server rate limit is the real guard. */
        resendCooldownSeconds: 30,
    },

    /**
     * A just-rotated refresh token stays acceptable for this long — ONCE.
     *
     * The mobile app can fire two refreshes with the same token at the same
     * instant. Without a window the loser looks exactly like a thief and the
     * device's chain is revoked, signing the user out. Within it, the second
     * request gets a sibling pair on the same chain. Unlike the admin panel's
     * window this one is capped: one extra pair per rotated token, and a third
     * presentation is a replay however fast it arrives — so a stolen token
     * buys at most one pair, and only inside the window.
     */
    refreshRotationGraceSeconds: 10,

    /** The one-shot right to change a password, issued after the reset code checks out. */
    passwordResetPermit: {
        ttlMinutes: 10,
    },
});

/**
 * Staff-side deviations from `AUTH_POLICY`.
 *
 * Only what actually differs lives here — email normalisation, password
 * shape and bcrypt's 72-byte ceiling are the same rules, and duplicating
 * them would create two numbers that drift.
 */
export const ADMIN_AUTH_POLICY = Object.freeze({
    /**
     * Higher than the client's cost, and this is the deliberate part: an admin
     * credential opens every recipe and every user record, so a leaked hash is
     * worth far more offline work than a single app account's. The price is
     * paid on the login path only, by a handful of people, a few times a day.
     */
    bcryptRounds: 12,

    /** bcrypt reads at most 72 bytes and ignores the rest silently. */
    passwordMaxBytes: AUTH_POLICY.password.maxBytes,

    /** Failed sign-ins per address before the door closes (sign-in FR-006). */
    maxFailedAttempts: 5,

    /** How long the door stays closed, and the window failures are counted over. */
    lockoutWindowMinutes: 15,

    /**
     * A just-rotated refresh token stays acceptable for this long.
     *
     * Two browser tabs refreshing at the same instant both hold the same valid
     * token; without the window, the loser looks exactly like a thief and the
     * chain is revoked, signing the admin out mid-edit. Short enough that a
     * stolen token is not usefully replayable.
     */
    refreshRotationGraceSeconds: 10,

    /** How long the login journal is kept before pruning (sign-in FR-009). */
    loginAttemptRetentionDays: 90,
});
