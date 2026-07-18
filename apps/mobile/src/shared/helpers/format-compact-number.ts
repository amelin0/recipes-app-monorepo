/**
 * Render a count in the compact social-feed style:
 *   382          → "382"
 *   1_234        → "1.2k"
 *   12_345       → "12.3k"
 *   293_456      → "293k"
 *   1_800_000    → "1.8m"
 *
 * One decimal is kept under 10k / 10m so cards don't lose
 * resolution between 1.2k vs 1.7k; rounded down (`Math.floor`)
 * so we never inflate a 1.19k display into 1.2k.
 */
export function formatCompactNumber(count: number): string {
    if (!Number.isFinite(count) || count < 0) return '0';
    if (count < 1_000) return String(Math.floor(count));
    if (count < 10_000) return `${(Math.floor(count / 100) / 10).toFixed(1)}k`;
    if (count < 1_000_000) return `${Math.floor(count / 1_000)}k`;
    if (count < 10_000_000) {
        return `${(Math.floor(count / 100_000) / 10).toFixed(1)}m`;
    }
    return `${Math.floor(count / 1_000_000)}m`;
}
