const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/**
 * Format a date as `Понеділок, 11 Травня` (Figma Home header copy):
 * capitalized weekday + day + capitalized month. Day and month are formatted
 * together so the locale picks the correct grammatical case (uk: «11 травня»,
 * not «11 травень»).
 */
export function formatDayHeader(date: Date = new Date(), locale = 'uk-UA'): string {
    const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
    const dayMonth = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(date);
    const parts = dayMonth.split(' ');
    const withCapitalMonth = parts.map((part, i) => (i === parts.length - 1 ? capitalize(part) : part)).join(' ');
    return `${capitalize(weekday)}, ${withCapitalMonth}`;
}
