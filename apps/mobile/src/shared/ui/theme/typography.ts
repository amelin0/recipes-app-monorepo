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
    // Exception in the scale: the RFDS library frame still lists title/medium as
    // Bold + 2% tracking, but every RF-mobile-app screen binds it to Inter
    // SemiBold 24 with no tracking (verified against the Figma raster of
    // 66:2516 «Вхід» and 66:2570 «Реєстрація» — stem 3.12px and left bearing
    // 1.75px both match SemiBold, Bold would be 3.57px / 1.58px).
    titleMedium: {
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
