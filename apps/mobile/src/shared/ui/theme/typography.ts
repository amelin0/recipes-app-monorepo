export const fontFamily = {
  heading: 'Manrope',
  body: 'Inter',
} as const

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 36,
  '4xl': 48,
} as const

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

export const lineHeight = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
} as const

export const typography = {
  h1: { fontFamily: fontFamily.heading, fontSize: fontSize['3xl'], fontWeight: fontWeight.bold },
  h2: { fontFamily: fontFamily.heading, fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  h3: { fontFamily: fontFamily.heading, fontSize: fontSize.xl, fontWeight: fontWeight.semibold },
  h4: { fontFamily: fontFamily.heading, fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
  h5: { fontFamily: fontFamily.heading, fontSize: fontSize.md, fontWeight: fontWeight.medium },

  bodyLg: { fontFamily: fontFamily.body, fontSize: fontSize.md, fontWeight: fontWeight.regular },
  body: { fontFamily: fontFamily.body, fontSize: fontSize.base, fontWeight: fontWeight.regular },
  bodySm: { fontFamily: fontFamily.body, fontSize: fontSize.sm, fontWeight: fontWeight.regular },
  bodyXs: { fontFamily: fontFamily.body, fontSize: fontSize.xs, fontWeight: fontWeight.regular },

  label: { fontFamily: fontFamily.body, fontSize: fontSize.base, fontWeight: fontWeight.medium },
  labelSm: { fontFamily: fontFamily.body, fontSize: fontSize.sm, fontWeight: fontWeight.medium },

  button: { fontFamily: fontFamily.body, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  buttonSm: { fontFamily: fontFamily.body, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },

  caption: { fontFamily: fontFamily.body, fontSize: fontSize.xs, fontWeight: fontWeight.regular },
} as const
