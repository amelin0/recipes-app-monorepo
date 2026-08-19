// Source of truth: RFDS Figma — Typography (node 54617:1678).
// The whole scale uses Inter. Fonts are loaded in src/app/_layout.tsx —
// the useFonts keys must match these family names.
export const fontFamily = {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
    blackItalic: 'Inter-BlackItalic',
} as const;

export const typography = {
    // display/ — Bold, LH 150% / 140%
    displayLarge: {
        fontFamily: fontFamily.bold,
        fontSize: 40,
        lineHeight: 60,
    },
    displayMedium: {
        fontFamily: fontFamily.bold,
        fontSize: 32,
        lineHeight: 44.8,
    },

    // title/ — Bold, LH 130%
    titleLarge: {
        fontFamily: fontFamily.bold,
        fontSize: 28,
        lineHeight: 36.4,
    },
    titleMedium: {
        fontFamily: fontFamily.bold,
        fontSize: 24,
        lineHeight: 31.2,
        letterSpacing: 0.48,
    },
    /**
     * The auth funnel draws its screen title with a different Figma Header
     * component (RF-mobile-app 90:12835) than the rest of the app (13:9627):
     * SemiBold with no tracking instead of Bold + 2%. Measured off the Figma
     * rasters — stem 3.12px / bearing 1.75px on «Вхід» and «Реєстрація» vs
     * 3.55px on «Як тебе звати?», against 3.13 (SemiBold) and 3.57 (Bold).
     * Two live variants, so two tokens; do not collapse them.
     */
    titleMediumTight: {
        fontFamily: fontFamily.semiBold,
        fontSize: 24,
        lineHeight: 31.2,
    },
    titleSmall: {
        fontFamily: fontFamily.bold,
        fontSize: 20,
        lineHeight: 26,
    },

    // body/ — Regular + SemiBold, LH 130%
    bodyLargeBold: {
        fontFamily: fontFamily.semiBold,
        fontSize: 16,
        lineHeight: 20.8,
    },
    bodyLargeReg: {
        fontFamily: fontFamily.regular,
        fontSize: 16,
        lineHeight: 20.8,
    },
    bodyMediumBold: {
        fontFamily: fontFamily.semiBold,
        fontSize: 14,
        lineHeight: 18.2,
    },
    bodyMediumReg: {
        fontFamily: fontFamily.regular,
        fontSize: 14,
        lineHeight: 18.2,
    },
    bodySmallBold: {
        fontFamily: fontFamily.semiBold,
        fontSize: 12,
        lineHeight: 15.6,
    },
    bodySmallReg: {
        fontFamily: fontFamily.regular,
        fontSize: 12,
        lineHeight: 15.6,
    },

    // supporting/ — LH 130%
    caption: {
        fontFamily: fontFamily.regular,
        fontSize: 12,
        lineHeight: 15.6,
    },
    overline: {
        fontFamily: fontFamily.medium,
        fontSize: 10,
        lineHeight: 13,
        textTransform: 'uppercase' as const,
    },

    // hero/ — onboarding slide titles (RF-mobile-app frames 66:2252…66:2316).
    // Not part of the RFDS scale: title/medium is Bold 24, these are Medium 24
    // uppercase with an italic Black run for the highlighted word.
    heroTitle: {
        fontFamily: fontFamily.medium,
        fontSize: 24,
        lineHeight: 31.2,
        letterSpacing: 0.48,
        textTransform: 'uppercase' as const,
    },
    heroTitleAccent: {
        fontFamily: fontFamily.blackItalic,
        fontSize: 24,
        lineHeight: 31.2,
        letterSpacing: 0.48,
        textTransform: 'uppercase' as const,
    },

    // brand/ — the "RationFit" lockup in the paywall header (911:52852).
    // The one token that opts out of the Inter-only rule: the design draws the
    // wordmark in the platform system font at Black weight (Figma reports
    // "SF Pro Black" 20/1.3 +0.4 tracking), whose advance for "RationFit" is
    // 99px against 89.9 for Inter Bold — swapping in Inter visibly shrinks the
    // lockup, so this leaves fontFamily unset and lets the platform resolve it.
    brandWordmark: {
        fontSize: 20,
        lineHeight: 26,
        letterSpacing: 0.4,
        fontWeight: '900' as const,
    },

    // button/ — SemiBold (link — Medium), LH 130%
    buttonLarge: {
        fontFamily: fontFamily.semiBold,
        fontSize: 16,
        lineHeight: 20.8,
    },
    buttonSmall: {
        fontFamily: fontFamily.semiBold,
        fontSize: 14,
        lineHeight: 18.2,
    },
    buttonLink: {
        fontFamily: fontFamily.medium,
        fontSize: 14,
        lineHeight: 18.2,
    },
    buttonTab: {
        fontFamily: fontFamily.semiBold,
        fontSize: 10,
        lineHeight: 13,
    },
} as const;

export type TypographyVariant = keyof typeof typography;
