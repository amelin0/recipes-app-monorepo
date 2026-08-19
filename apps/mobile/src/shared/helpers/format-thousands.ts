/**
 * Groups thousands with a comma — the separator every goal screen in the design
 * uses («2,000 ккал», «15,000 кроків»).
 */
export function formatThousands(value: number): string {
    return Math.round(value)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
