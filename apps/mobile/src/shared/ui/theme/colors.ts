// Source of truth: RFDS Figma — color/primitive, light theme (node 54617:1222).
// Group and token names mirror the Figma variable collections.
export const colors = {
    // Branding
    branding: {
        /** Main color */
        primary: '#1E2932',
        /** Solid buttons, decorations (bg) */
        accent: '#85E239',
        /** Light accent — OTP active cell border, highlights */
        secondary: '#B1F04E',
        /** Accent at 10% — tab bar selection pill */
        accentSoft: 'rgba(122, 211, 49, 0.1)',
    },

    // Semantic
    semantic: {
        /** Solid elements */
        lightGrey: '#F9FAFB',
        /** Solid elements */
        darkGrey: '#969696',
        /** White elements regardless of theme */
        white: '#FFFFFF',
        /** Approval, allowance, availability */
        positive: '#00AB3C',
        /** Light elements */
        lightPositive: '#EBFFEB',
        /** Warning */
        orange: '#FF5200',
        /** Light elements */
        lightOrange: '#FFF5EB',
        /** Error, rejection, unavailability */
        negative: '#FF0021',
        /** Light elements */
        lightNegative: '#FFEBEB',
        /** Disabled elements */
        disabled: '#BBBBBB',
        /** For liquid elements (white 30%) */
        white30: 'rgba(255, 255, 255, 0.3)',
        /** Liquid-glass fill (white 80%) — floating tab bar */
        white80: 'rgba(255, 255, 255, 0.8)',
        /** For elements, bg */
        ocean: '#2B7FFF',
        /** Light elements */
        lightOcean: '#EBF1FF',
    },

    // Background
    background: {
        /** Bg for screen */
        screen: '#FFFFFF',
        /** 40% opacity for overlays */
        overlay: 'rgba(0, 0, 0, 0.4)',
    },

    // Active (pressed states)
    active: {
        primary: '#4A8817',
        secondary: '#969696',
        tertiary: '#DEE3E7',
        /** Active for other elements (grey 30%) */
        grey30: 'rgba(154, 154, 154, 0.3)',
        orange: '#CC4200',
        negative: '#C92339',
        positive: '#00802D',
    },

    // Forms (outlines for elements)
    forms: {
        lightBorder: '#EFEFEF',
        darkBorder: '#1E2932',
        negativeBorder: '#FF0021',
        positiveBorder: '#00AB3C',
        orangeBorder: '#FF5200',
    },

    // Elements — text/icon colors (from RFDS Typography frame + RF-mobile-app screens).
    elements: {
        primary: '#1E2932',
        secondary: '#58616A',
        tertiary: '#687885',
        white: '#FFFFFF',
    },
} as const;
