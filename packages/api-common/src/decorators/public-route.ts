/**
 * Metadata key both APIs' `@Public()` decorators set. Defined once here
 * because the throttler reads it too: a public route is throttled by client
 * address, whatever token the request happens to carry.
 */
export const IS_PUBLIC = 'IS_PUBLIC';
