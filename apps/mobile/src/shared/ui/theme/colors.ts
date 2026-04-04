export const colors = {
  // Primary (Dark Teal)
  primary: {
    100: '#00343E',
    80: '#0A5F6D',
    60: '#0092A1',
    default: '#0092A1',
    onPrimary: '#FFFFFF',
  },

  // Secondary (Light Green)
  secondary: {
    default: '#EBF9B0',
    onSecondary: '#00343E',
  },

  // Gray
  gray: {
    100: '#101010',
    80: '#404040',
    60: '#707070',
    30: '#B8B8B8',
    20: '#CFCFCF',
    10: '#E8E8E8',
    0: '#FFFFFF',
  },

  // System
  error: {
    default: '#E32727',
    dark: '#8C0E0E',
    subtle: '#FDE8E8',
    onError: '#FFFFFF',
  },

  info: {
    default: '#2747E3',
    dark: '#0E3C8B',
    subtle: '#E8EEFE',
    onInfo: '#FFFFFF',
  },

  warning: {
    default: '#FFBC2C',
    dark: '#E5C600',
    subtle: '#FFF8E8',
    onWarning: '#101010',
  },

  success: {
    default: '#47C43B',
    dark: '#1D8B0E',
    subtle: '#E8F9E6',
    onSuccess: '#FFFFFF',
  },

  // Additional
  additional: {
    blue: '#B0D1F9',
    pink: '#F9B0E9',
    orange: '#F9CBB0',
    purple: '#CEB0F9',
  },

  // Text
  text: {
    primary: '#101010',
    secondary: '#404040',
    tertiary: '#707070',
    disabled: '#B8B8B8',
    inverse: '#FFFFFF',
    error: '#E32727',
    link: '#0092A1',
  },

  // Background
  bg: {
    canvas: '#FFFFFF',
    surface: '#FAFAFA',
    elevated: '#FFFFFF',
    overlay: 'rgba(16, 16, 16, 0.7)',
    inverse: '#101010',
    transparent: 'transparent',
  },

  // Border
  border: {
    default: '#E8E8E8',
    subtle: '#CFCFCF',
    strong: '#101010',
    focus: '#0092A1',
    error: '#E32727',
  },

  // Icon
  icon: {
    default: '#707070',
    inverse: '#FFFFFF',
  },

  // Disabled
  disabled: {
    background: '#E8E8E8',
    content: '#B8B8B8',
    border: '#CFCFCF',
  },
} as const;
