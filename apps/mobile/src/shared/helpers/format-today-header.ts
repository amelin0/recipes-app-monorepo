/**
 * Format today as `EEEE, d MMMM` (e.g. "Saturday, 23 May") per the
 * Figma header copy. `Intl.DateTimeFormat('en-GB')` with the combined
 * options renders as "Saturday 23 May" (no comma) — we want a comma
 * after the weekday, so format the weekday and day-month parts
 * separately and join. `en-GB` keeps day-before-month ordering.
 */
export function formatTodayHeader(now: Date = new Date()): string {
    const weekday = new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
    }).format(now);
    const dayMonth = new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'long',
    }).format(now);
    return `${weekday}, ${dayMonth}`;
}
