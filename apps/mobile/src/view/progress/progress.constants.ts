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

export type MetricKey = 'weight' | 'calories' | 'water' | 'steps';

export interface MockMetricRecord {
    id: string;
    /** «12 липня 2026» for weight, «СР, 31 вересня» for the daily metrics. */
    title: string;
    /** Reading for weight; consumed amount for the daily metrics. */
    value: number;
    /** Change against the previous reading — weight only. */
    delta?: number;
}

/** TODO: GET /metrics/:key — readings, stats and the goal all come from there. */
export const MOCK_WEIGHT_DETAIL = {
    currentKg: 76.1,
    goalKg: 80,
    minKg: 73,
    averageKg: 75.4,
    maxKg: 76.1,
    axis: [80, 75, 70, 65],
    points: [
        { label: '12/4', value: 75 },
        { label: '1/5', value: 75 },
        { label: '12/5', value: 72 },
        { label: '12/7', value: 76.1 },
    ],
    records: [
        { id: 'w-4', title: '12 липня 2026', value: 76, delta: 4.4 },
        { id: 'w-3', title: '12 травня 2026', value: 71.6, delta: -3.4 },
        { id: 'w-2', title: '1 травня 2026', value: 75, delta: 0 },
        { id: 'w-1', title: '12 квітня 2026', value: 75 },
    ] as MockMetricRecord[],
};

export const MOCK_CALORIES_DETAIL = {
    todayKcal: 1900,
    goalKcal: 2000,
    minNormKcal: 1850,
    maxNormKcal: 2050,
    daysUnder: 4,
    daysWithin: 16,
    daysOver: 8,
    daysTotal: 28,
    records: [
        { id: 'c-1', title: 'СР, 31 вересня', value: 1426 },
        { id: 'c-2', title: 'ВТ, 30 вересня', value: 1732 },
        { id: 'c-3', title: 'ПН, 29 вересня', value: 1744 },
        { id: 'c-4', title: 'НД, 28 вересня', value: 2323 },
        { id: 'c-5', title: 'СБ, 27 вересня', value: 1820 },
        { id: 'c-6', title: 'ПТ, 26 вересня', value: 1655 },
        { id: 'c-7', title: 'ЧТ, 25 вересня', value: 1780 },
        { id: 'c-8', title: 'СР, 24 вересня', value: 1890 },
    ] as MockMetricRecord[],
};

export const MOCK_WATER_DETAIL = {
    todayMl: 2300,
    goalMl: 2000,
    minMl: 1400,
    averageMl: 1892,
    maxMl: 2800,
    records: [
        { id: 'wa-1', title: 'СР, 31 вересня', value: 1932 },
        { id: 'wa-2', title: 'ВТ, 30 вересня', value: 1823 },
        { id: 'wa-3', title: 'ПН, 29 вересня', value: 823 },
        { id: 'wa-4', title: 'НД, 28 вересня', value: 1560 },
        { id: 'wa-5', title: 'СБ, 27 вересня', value: 1970 },
        { id: 'wa-6', title: 'ПТ, 26 вересня', value: 1450 },
    ] as MockMetricRecord[],
};

export const MOCK_STEPS_DETAIL = {
    todaySteps: 11641,
    goalSteps: 15000,
    minSteps: 88,
    averageSteps: 2293,
    maxSteps: 18232,
    records: [
        { id: 's-1', title: 'СР, 31 вересня', value: 14232 },
        { id: 's-2', title: 'ВТ, 30 вересня', value: 14000 },
        { id: 's-3', title: 'ПН, 29 вересня', value: 5000 },
        { id: 's-4', title: 'НД, 28 вересня', value: 12450 },
        { id: 's-5', title: 'СБ, 27 вересня', value: 15300 },
        { id: 's-6', title: 'ПТ, 26 вересня', value: 10800 },
        { id: 's-7', title: 'ЧТ, 25 вересня', value: 7900 },
        { id: 's-8', title: 'СР, 24 вересня', value: 15000 },
    ] as MockMetricRecord[],
};
