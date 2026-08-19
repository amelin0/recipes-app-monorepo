// Source of truth: RFDS Figma — color/primitive, light theme (node 54617:1222).
// Group and token names mirror the Figma variable collections.
export const colors = {
    // Branding
    branding: {
        /** Main color */
        primary: '#1E2932',
        /** Solid buttons, decorations (bg) */
        accent: '#5EBA12',
        /** Light accent — OTP active cell border. App-file literal, not an RFDS variable. */
        secondary: '#B1F04E',
        /** Very light accent fill — tip/info boxes. App-file literal, not an RFDS variable. */
        accentSubtle: '#F7FFF0',
        /** RFDS `Branding/disabled` — inactive pagination dots, muted brand surfaces. */
        disabled: '#E0E2E4',
    },

    // Semantic
    semantic: {
        /** Solid elements */
        lightGrey: '#F9FAFB',
        /** Solid elements */
        darkGrey: '#8C8C8C',
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
        /** RFDS `Semantic/liquid` — white at 30% */
        white30: 'rgba(255, 255, 255, 0.3)',
        /** Liquid-glass bar fill — floating tab bar. App-file literal. */
        glassFill: 'rgba(233, 233, 233, 0.8)',
        /** Liquid-glass selection pill — floating tab bar. App-file literal. */
        glassSelection: 'rgba(255, 255, 255, 0.5)',
        /** For elements, bg */
        ocean: '#2B7FFF',
        /** Light elements */
        lightOcean: '#EBF1FF',
        /** Rating star fill. App-file literal (911:52879), not an RFDS variable. */
        gold: '#FFD700',
        /**
         * RFDS `shadow/positive` / `shadow/orange` — a 0-blur drop shadow with
         * an 8px spread, i.e. a flat halo around the selected plan card. RN has
         * no shadow spread, so these are painted as a concentric view behind it.
         */
        positiveRing: 'rgba(0, 171, 60, 0.12)',
        orangeRing: 'rgba(255, 140, 64, 0.12)',
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
        /** RF-mobile-app `Forms/border` — text-input outlines. */
        border: '#E6E6E6',
        /** Hairline separator (LabeledDivider). App-file literal, not an RFDS variable. */
        divider: '#F6F6F6',
        lightBorder: '#EFEFEF',
        darkBorder: '#1E2932',
        negativeBorder: '#FF0021',
        positiveBorder: '#00AB3C',
        orangeBorder: '#FF5200',
        /**
         * Warm outline of the subscription cards (911:52889, 911:52521).
         * App-file literal, not an RFDS variable.
         */
        softOrangeBorder: '#FFBEA0',
    },

    // Elements — text/icon colors (from RFDS Typography frame + RF-mobile-app screens).
    elements: {
        primary: '#1E2932',
        secondary: '#58616A',
        tertiary: '#687885',
        white: '#FFFFFF',
    },
} as const;
