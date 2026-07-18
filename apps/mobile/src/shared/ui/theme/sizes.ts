export const spacing = {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
} as const;

export const radius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
} as const;

export const shadow = {
    sm: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 3,
        elevation: 1,
    },
    md: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius: 50,
        elevation: 6,
    },
    // RFDS shadow/block — cards on Home & co.
    block: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    // RFDS shadow/elements — floating liquid-glass elements (tab bar)
    elements: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 40,
        elevation: 8,
    },
    // RFDS shadow/sheet — upward shadow of bottom-sheet style screens
    sheet: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 8,
    },
} as const;

export const iconSize = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48,
} as const;
