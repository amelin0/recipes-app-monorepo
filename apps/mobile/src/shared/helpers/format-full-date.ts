/**
 * Format a date as `2 серпня 2026` — the subscription card's start/end dates
 * (911:52533). ICU renders uk-UA long dates with an era marker («2 серпня
 * 2026 р.») that the design does not show, so it is trimmed off the end.
 */
export function formatFullDate(date: Date, locale = 'uk-UA'): string {
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' })
        .format(date)
        .replace(/\s*р\.$/, '');
}
