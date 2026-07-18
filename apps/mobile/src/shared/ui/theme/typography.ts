// Source of truth: RFDS Figma — Typography (node 54617:1678).
// The whole scale uses Inter. Fonts are loaded in src/app/_layout.tsx —
// the useFonts keys must match these family names.
export const fontFamily = {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
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
