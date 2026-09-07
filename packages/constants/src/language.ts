import { Language } from '@dns/shared-types';

/**
 * Every translation locale, in the order the admin panel lists them.
 * Ordered by code so the translation editor never reshuffles between
 * releases and reviewers can diff two products side by side.
 */
export const SUPPORTED_LANGUAGES: readonly Language[] = Object.freeze([
    Language.Arabic,
    Language.German,
    Language.English,
    Language.Spanish,
    Language.French,
    Language.Hebrew,
    Language.Hindi,
    Language.Indonesian,
    Language.Italian,
    Language.Japanese,
    Language.Korean,
    Language.Dutch,
    Language.Polish,
    Language.PortugueseBrazil,
    Language.Russian,
    Language.Thai,
    Language.Turkish,
    Language.Ukrainian,
    Language.Vietnamese,
    Language.ChineseSimplified,
]);

/** Fallback when a request carries no locale and the user has no preference. */
export const DEFAULT_LANGUAGE = Language.Ukrainian;

export const isSupportedLanguage = (value: string): value is Language =>
    SUPPORTED_LANGUAGES.includes(value as Language);
