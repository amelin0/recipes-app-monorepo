/**
 * `$ 59,99` — the paywall's price format (911:52897): the currency sign, then
 * a decimal comma. Amounts arrive in minor units, because money in a float is
 * a rounding bug waiting for a decimal.
 */
const CURRENCY_SIGN: Record<string, string> = {
    USD: '$',
    EUR: '€',
    UAH: '₴',
};

export function formatPrice(cents: number, currency = 'USD'): string {
    const sign = CURRENCY_SIGN[currency] ?? currency;
    return `${sign} ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

/** Whole days between two dates — the subscription card's «Залишилось». */
export function daysBetween(from: Date, to: Date): number {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    return Math.max(0, Math.round((to.getTime() - from.getTime()) / MS_PER_DAY));
}
