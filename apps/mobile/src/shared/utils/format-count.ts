/**
 * Format a count for compact display.
 *
 * - Below 1 000 → exact integer (`342`, `0`).
 * - 1 000 ≤ n < 1 000 000 → `Xk` with up to one decimal, no trailing zero (`1k`, `1.2k`, `2.2k`).
 * - 1 000 000 ≤ n → `Xm` with up to one decimal, no trailing zero (`1m`, `2.4m`).
 *
 * Negative values are formatted from their magnitude with a leading `-`.
 *
 * @example
 *   formatCount(342)       // "342"
 *   formatCount(999)       // "999"
 *   formatCount(1_000)     // "1k"
 *   formatCount(1_234)     // "1.2k"
 *   formatCount(2_235)     // "2.2k"
 *   formatCount(12_500)    // "12.5k"
 *   formatCount(1_000_000) // "1m"
 */
export function formatCount(n: number): string {
    if (!Number.isFinite(n)) return '0';
    if (n < 0) return `-${formatCount(-n)}`;

    if (n < 1_000) return Math.trunc(n).toString();

    const truncOneDecimal = (value: number): string => {
        const truncated = Math.trunc(value * 10) / 10;
        return Number.isInteger(truncated) ? String(truncated) : truncated.toFixed(1);
    };

    if (n < 1_000_000) return `${truncOneDecimal(n / 1_000)}k`;
    return `${truncOneDecimal(n / 1_000_000)}m`;
}
