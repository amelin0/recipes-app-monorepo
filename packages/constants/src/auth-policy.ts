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

    /** The one-shot right to change a password, issued after the reset code checks out. */
    passwordResetPermit: {
        ttlMinutes: 10,
    },
});
