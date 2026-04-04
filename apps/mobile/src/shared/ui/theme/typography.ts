export const fontFamily = {
  heading: 'Nunito',
  body: 'PTSans',
} as const;

export const fontWeight = {
  regular: '400',
  bold: '700',
  extraBold: '800',
  black: '900',
} as const;

export const typography = {
  // Headings — Nunito
  h1: {
    fontFamily: fontFamily.heading,
    fontSize: 32,
    fontWeight: fontWeight.black,
    lineHeight: 48,
    letterSpacing: 0,
  },
  h2: {
    fontFamily: fontFamily.heading,
    fontSize: 24,
    fontWeight: fontWeight.extraBold,
    lineHeight: 36,
    letterSpacing: 0,
  },
  h3: {
    fontFamily: fontFamily.heading,
    fontSize: 16,
    fontWeight: fontWeight.extraBold,
    lineHeight: 24,
    letterSpacing: 0,
  },

  // Body Regular — PT Sans
  bodyLg: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    fontWeight: fontWeight.regular,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyMd: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    fontWeight: fontWeight.regular,
    lineHeight: 20,
    letterSpacing: 0,
  },
  bodySm: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    fontWeight: fontWeight.regular,
    lineHeight: 18,
    letterSpacing: 0,
  },

  // Body Bold — PT Sans Bold
  bodyLgBold: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    fontWeight: fontWeight.bold,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyMdBold: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    fontWeight: fontWeight.bold,
    lineHeight: 20,
    letterSpacing: 0,
  },
  bodySmBold: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    fontWeight: fontWeight.bold,
    lineHeight: 18,
    letterSpacing: 0,
  },

  // Button
  buttonLg: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    fontWeight: fontWeight.bold,
    lineHeight: 24,
    letterSpacing: 0,
  },
  buttonSm: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    fontWeight: fontWeight.bold,
    lineHeight: 20,
    letterSpacing: 0,
  },
} as const;
