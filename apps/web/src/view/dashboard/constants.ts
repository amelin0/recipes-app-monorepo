export const LANGUAGE_LABELS: Record<string, string> = {
  uk: 'Ukrainian',
  en: 'English',
}

/** An account that never got settings — a normal state, shown rather than hidden. */
export const UNSET_LANGUAGE_LABEL = 'Not set'

export const languageLabel = (language: string | null): string =>
  language === null ? UNSET_LANGUAGE_LABEL : (LANGUAGE_LABELS[language] ?? language)
