/**
 * Mask an email for display (Figma: `al•••••••••yi@gmail.com`).
 *
 * - Local part ≥ 7 chars → keep first 2 + last 2, bullets in between.
 * - Shorter local part → keep only the first char, bullet the rest (the
 *   mask degrades, it never disappears).
 * - No `@` → returned untouched (nothing meaningful to mask).
 */
export function maskEmail(email: string): string {
    const atIndex = email.indexOf('@');
    if (atIndex <= 0) return email;

    const local = email.slice(0, atIndex);
    const domain = email.slice(atIndex);

    if (local.length < 7) {
        return `${local[0]}${'•'.repeat(Math.max(local.length - 1, 2))}${domain}`;
    }
    return `${local.slice(0, 2)}${'•'.repeat(local.length - 4)}${local.slice(-2)}${domain}`;
}
