/**
 * TODO: every series here comes from the measurements endpoint — the app only
 * decides how to draw them.
 */

export interface MockLinePoint {
    label: string;
    value: number;
}

export interface MockDayBar {
    label: string;
    /** What the plan called for that day. */
    planned: number;
    /** What was actually logged. */
    actual: number;
}

/** Weight readings, oldest first. */
export const MOCK_WEIGHT = {
    startKg: 64,
    currentKg: 64,
    goalKg: 72,
    axis: [65, 62, 59, 56],
    points: [
        { label: '12/6', value: 60 },
        { label: '12/7', value: 61.3 },
        { label: '24/7', value: 62.4 },
    ] satisfies MockLinePoint[],
};

export const MOCK_CALORIES = {
    averagePerDay: 1690,
    goalPerDay: 1800,
    axis: ['2000', '1500', '1000', '0'],
    max: 2000,
    days: [
        { label: '12/7', planned: 1600, actual: 1655 },
        { label: '13/7', planned: 1673, actual: 1727 },
        { label: '14/7', planned: 1691, actual: 1636 },
        { label: '15/7', planned: 1691, actual: 1418 },
        { label: '16/7', planned: 1691, actual: 1636 },
        { label: '17/7', planned: 1691, actual: 1618 },
        { label: '18/7', planned: 1691, actual: 1545 },
    ] satisfies MockDayBar[],
};

export const MOCK_WATER = {
    averageMl: 1405,
    goalMl: 2000,
    axis: ['3л', '2л', '1л', '0'],
    max: 3000,
    days: [
        { label: '12/7', value: 1773 },
        { label: '13/7', value: 1582 },
        { label: '14/7', value: 1991 },
        { label: '15/7', value: 1173 },
        { label: '16/7', value: 2318 },
        { label: '17/7', value: 1500 },
        { label: '18/7', value: 1691 },
    ],
};

export const MOCK_STEPS = {
    averagePerDay: 13405,
    goalPerDay: 15000,
    axis: ['15К', '10К', '5К', '0'],
    max: 15000,
    days: [
        { label: '12/7', value: 3273 },
        { label: '13/7', value: 273 },
        { label: '14/7', value: 15000 },
        { label: '15/7', value: 2864 },
        { label: '16/7', value: 13909 },
        { label: '17/7', value: 12000 },
        { label: '18/7', value: 12273 },
    ],
};

export const MOCK_WAIST = {
    startCm: 87,
    currentCm: 85,
    axis: [110, 100, 90, 80],
    points: [
        { label: '12/4', value: 88 },
        { label: '15/6', value: 87.7 },
        { label: '18/7', value: 87.7 },
    ] satisfies MockLinePoint[],
};

export const MOCK_HEIGHT = {
    startCm: 158,
    currentCm: 158,
    axis: [180, 170, 160, 150],
    points: [
        { label: '12/4', value: 158 },
        { label: '12/7', value: 158 },
    ] satisfies MockLinePoint[],
};
