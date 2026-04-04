export const fontFamily = {
  sans: 'Figtree',
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const typography = {
  // text/display
  displayLg: {
    fontFamily: fontFamily.sans,
    fontSize: 40,
    fontWeight: fontWeight.bold,
    lineHeight: 48,
    letterSpacing: -0.8,
  },
  displayMd: {
    fontFamily: fontFamily.sans,
    fontSize: 32,
    fontWeight: fontWeight.bold,
    lineHeight: 48,
    letterSpacing: -0.48,
  },

  // text/title
  titleLg: {
    fontFamily: fontFamily.sans,
    fontSize: 28,
    fontWeight: fontWeight.semibold,
    lineHeight: 36,
    letterSpacing: -0.28,
  },
  titleMd: {
    fontFamily: fontFamily.sans,
    fontSize: 24,
    fontWeight: fontWeight.semibold,
    lineHeight: 32,
    letterSpacing: -0.12,
  },
  titleSm: {
    fontFamily: fontFamily.sans,
    fontSize: 20,
    fontWeight: fontWeight.semibold,
    lineHeight: 28,
    letterSpacing: -0.05,
  },

  // text/body
  bodyLg: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    fontWeight: fontWeight.semibold,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyMd: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    fontWeight: fontWeight.semibold,
    lineHeight: 20,
    letterSpacing: 0,
  },
  bodySm: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    fontWeight: fontWeight.regular,
    lineHeight: 20,
    letterSpacing: 0,
  },

  // text/supporting
  caption: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: fontWeight.regular,
    lineHeight: 16,
    letterSpacing: 0.048,
  },
  overline: {
    fontFamily: fontFamily.sans,
    fontSize: 10,
    fontWeight: fontWeight.medium,
    lineHeight: 14,
    letterSpacing: 0.06,
    textTransform: 'uppercase' as const,
  },

  // text/button
  buttonLg: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    fontWeight: fontWeight.semibold,
    lineHeight: 20,
    letterSpacing: 0,
  },
  buttonSm: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: fontWeight.semibold,
    lineHeight: 16,
    letterSpacing: 0,
  },
  buttonLink: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    fontWeight: fontWeight.medium,
    lineHeight: 20,
    letterSpacing: 0,
  },
} as const;
