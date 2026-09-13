/**
 * The API speaks two date shapes: `YYYY-MM-DD` for a calendar day (the meal
 * plan, a nutrition day, a birth date) and a full ISO instant for timestamps
 * (`expiresAt`, `createdAt`). These helpers are the only place either is
 * parsed or produced, so a day never drifts by a timezone offset on the way
 * in or out.
 */

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * A `Date` → `YYYY-MM-DD` in the device's own timezone.
 *
 * Deliberately not `toISOString().slice(0, 10)`: that converts to UTC first,
 * so anywhere east of Greenwich late in the evening it reports tomorrow — and
 * the user would log dinner onto the wrong day.
 */
export function toIsoDay(date: Date = new Date()): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * `YYYY-MM-DD` → a local `Date` at midnight.
 *
 * `new Date('2026-04-30')` parses as UTC midnight, which is the previous day
 * west of Greenwich — hence the explicit component constructor.
 */
export function fromIsoDay(day: string): Date {
    const [year, month, date] = day.split('-').map(Number);
    return new Date(year ?? 1970, (month ?? 1) - 1, date ?? 1);
}

/** Shift an ISO day by whole days, staying in local time. */
export function shiftIsoDay(day: string, days: number): string {
    const date = fromIsoDay(day);
    date.setDate(date.getDate() + days);
    return toIsoDay(date);
}

/** Whole days from `from` to `to`, both ISO days. Negative when `to` is earlier. */
export function diffIsoDays(from: string, to: string): number {
    const ms = fromIsoDay(to).getTime() - fromIsoDay(from).getTime();
    return Math.round(ms / 86_400_000);
}

/** An ISO day or instant → `30.04.2026`, the numeric date the design prints. */
export function formatDayMonthYear(value: string): string {
    const date = value.length === 10 ? fromIsoDay(value) : new Date(value);
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}
