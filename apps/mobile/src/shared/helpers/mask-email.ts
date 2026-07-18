/**
 * Mask an email for display: keep the first and last two characters of the
 * local part, replace the middle with bullets (Figma: `al•••••••••yi@gmail.com`).
 * Too-short or malformed addresses are returned untouched.
 */
export function maskEmail(email: string): string {
    const atIndex = email.indexOf('@');
    if (atIndex <= 4) return email;

    const local = email.slice(0, atIndex);
    const domain = email.slice(atIndex);
    return `${local.slice(0, 2)}${'•'.repeat(local.length - 4)}${local.slice(-2)}${domain}`;
}
