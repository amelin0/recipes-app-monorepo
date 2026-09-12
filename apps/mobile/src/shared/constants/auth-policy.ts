/**
 * The password and code rules the API enforces, mirrored so the client can
 * reject a bad value before spending a request on it.
 *
 * Kept in step with `AUTH_POLICY` in `@dns/constants` by hand — the mobile app
 * has no dependency on the server workspaces. Diverging only costs a 422 the
 * user sees as a field error, never a silent acceptance.
 */
export const PASSWORD_MIN_LENGTH = 8;

/** bcrypt reads at most 72 bytes; the server rejects rather than truncates. */
export const PASSWORD_MAX_BYTES = 72;

/** At least one letter and one digit; no symbol requirement. */
export const PASSWORD_PATTERN = /^(?=.*\p{L})(?=.*\d).+$/u;

export const OTP_LENGTH = 6;

/** Client-side cooldown between resends; the server rate limit is the real guard. */
export const OTP_RESEND_COOLDOWN_SECONDS = 30;

const utf8Length = (value: string) =>
    typeof TextEncoder === 'undefined' ? value.length : new TextEncoder().encode(value).length;

/** `null` when the password passes; otherwise the key of the rule it broke. */
export const validatePassword = (password: string): 'too-short' | 'too-long' | 'weak' | null => {
    if (password.length < PASSWORD_MIN_LENGTH) return 'too-short';
    if (utf8Length(password) > PASSWORD_MAX_BYTES) return 'too-long';
    if (!PASSWORD_PATTERN.test(password)) return 'weak';
    return null;
};
