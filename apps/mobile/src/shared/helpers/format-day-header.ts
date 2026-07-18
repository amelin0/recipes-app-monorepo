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

/** Nominative → accusative weekday (uk): only feminine days change form. */
const UK_WEEKDAY_ACCUSATIVE: Record<string, string> = {
    середа: 'середу',
    "п'ятниця": "п'ятницю",
    субота: 'суботу',
    неділя: 'неділю',
};

// ICU повертає «пʼятниця» з U+02BC — зводимо всі варіанти апострофа до U+0027,
// інакше лукап у мапі промахується щоп'ятниці.
const normalizeApostrophes = (value: string) => value.replace(/[ʼ’]/g, "'");

/**
 * Same as {@link formatDayHeader}, but the weekday is in accusative case for
 * copy like «на Суботу, 18 Липня» (Figma «Додати продукт» subtitle).
 */
export function formatDayHeaderAccusative(date: Date = new Date(), locale = 'uk-UA'): string {
    const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date).toLowerCase();
    const accusative = UK_WEEKDAY_ACCUSATIVE[normalizeApostrophes(weekday)] ?? weekday;
    const dayMonth = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(date);
    const parts = dayMonth.split(' ');
    const withCapitalMonth = parts.map((part, i) => (i === parts.length - 1 ? capitalize(part) : part)).join(' ');
    return `${capitalize(accusative)}, ${withCapitalMonth}`;
}
