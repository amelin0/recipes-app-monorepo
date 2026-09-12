/**
 * How long the inbox remembers what it said — decided by the product owner on
 * 2026-09-11 (inbox spec, open questions).
 *
 * Product policy rather than env: «how long do we keep what we told somebody»
 * is a decision, and a number that differed between environments would make
 * none of them the product. The worker's nightly sweep reads it.
 *
 * Counted from when the notification was written. Whether it was ever opened
 * does not enter into it — an unread message three months old is not news the
 * account is still waiting for, and keeping it would let the one kind of row
 * nobody looks at grow the table forever.
 */
export const NOTIFICATION_RETENTION_DAYS = 90;
