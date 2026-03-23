export const colors = {
  // Semantic / Primary (Brand — Olive Green)
  primary: {
    default: '#6B8F3C',
    active: '#567230',
    onPrimary: '#FFFFFF',
    subtle: '#E8F0D8',
    onSubtle: '#3D5221',
    link: '#6B8F3C',
  },

  // Semantic / Secondary (Neutral)
  secondary: {
    default: '#FFFFFF',
    active: '#F2F2F2',
    onSecondary: '#595959',
  },

  // Semantic / Accent (Peach/Warm)
  accent: {
    default: '#D4956A',
    active: '#B4754A',
    subtle: '#FFF5F0',
    onAccent: '#FFFFFF',
  },

  // Semantic / Error
  error: {
    default: '#D02512',
    active: '#A41D0E',
    subtle: '#F9BFB9',
    onError: '#FFFFFF',
  },

  // Semantic / Success
  success: {
    default: '#4CAF50',
    active: '#388E3C',
    subtle: '#E8F5E9',
    onSuccess: '#1A1A1A',
  },

  // Semantic / Warning
  warning: {
    default: '#D58000',
    active: '#B26B00',
    subtle: '#FFEBCC',
    onWarning: '#1A1A1A',
  },

  // Semantic / Info
  info: {
    default: '#EAECF5',
    subtle: '#FCFCFC',
    onInfo: '#1A1A1A',
  },

  // Text
  text: {
    primary: '#1A1A1A',
    secondary: '#595959',
    tertiary: '#8C8C8C',
    error: '#D02512',
    link: '#6B8F3C',
    inverse: '#FCFCFC',
  },

  // Background
  bg: {
    canvas: '#FFFFFF',
    surface: '#F8F9FC',
    elevated: '#FFFFFF',
    overlay: 'rgba(25, 25, 29, 0.7)',
    inverse: '#383838',
  },

  // Border
  border: {
    default: '#E6E6E6',
    subtle: '#F2F2F2',
    strong: '#1A1A1A',
    focus: '#6B8F3C',
    error: '#D02512',
  },

  // Icon
  icon: {
    default: '#595959',
    inverse: '#E6E6E6',
  },

  // Disabled
  disabled: {
    background: '#E6E6E6',
    content: '#8C8C8C',
    border: '#D9D9D9',
  },

  // Nutrition-specific
  macro: {
    protein: '#6B8F3C',
    carbs: '#D4956A',
    fats: '#5B9BD5',
    calories: '#8BA651',
  },
} as const
