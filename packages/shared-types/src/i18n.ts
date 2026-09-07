/**
 * Translation locales carried by the content tables (`*_translations`).
 * Every global product and recipe is expected to exist in all of them — the
 * V1 seed shipped 272 USDA products × 20 locales.
 *
 * This is NOT the set of locales the mobile UI is translated into; that set
 * is smaller and lives in the app bundle.
 */
export enum Language {
    Arabic = 'ar',
    German = 'de',
    English = 'en',
    Spanish = 'es',
    French = 'fr',
    Hebrew = 'he',
    Hindi = 'hi',
    Indonesian = 'id',
    Italian = 'it',
    Japanese = 'ja',
    Korean = 'ko',
    Dutch = 'nl',
    Polish = 'pl',
    PortugueseBrazil = 'pt-BR',
    Russian = 'ru',
    Thai = 'th',
    Turkish = 'tr',
    Ukrainian = 'uk',
    Vietnamese = 'vi',
    ChineseSimplified = 'zh-Hans',
}
