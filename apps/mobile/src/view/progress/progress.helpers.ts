import type { ProgressCard, ProgressPoint } from '@/data';
import { fromIsoDay } from '@/shared/helpers';

/** «12/7» — the compact day/month the charts label points with. */
export const pointLabel = (isoDate: string): string => {
    const at = fromIsoDay(isoDate);
    return `${at.getDate()}/${at.getMonth() + 1}`;
};

/**
 * How many points a line chart shows.
 *
 * The design draws a handful across the width; more than that and the labels
 * collide. The newest are kept — a weight chart is read from its right edge.
 */
const LINE_POINTS = 7;

export interface LinePoint {
    label: string;
    value: number;
}

/** Readings as the line chart takes them, oldest first, newest kept. */
export const toLinePoints = (points: ProgressPoint[]): LinePoint[] =>
    points.slice(-LINE_POINTS).map(point => ({ label: pointLabel(point.date), value: point.value }));

/**
 * Four descending axis ticks around the data.
 *
 * Built from the values rather than fixed: a 60–65 kg chart and a 150–180 cm
 * one cannot share a scale, and a fixed one would flatten both.
 */
export const buildAxis = (values: number[], extra: (number | null)[] = []): number[] => {
    const all = [...values, ...extra.filter((value): value is number => value !== null)];
    if (all.length === 0) return [4, 3, 2, 1];

    const min = Math.min(...all);
    const max = Math.max(...all);
    // Плаский ряд (одне значення або всі однакові) дав би нульовий діапазон і
    // чотири однакові підписи — розсуваємо його на 10%, щоб лінія лягла всередину.
    const pad = max === min ? Math.max(Math.abs(max) * 0.1, 1) : (max - min) * 0.15;

    let top = Math.ceil(max + pad);
    let bottom = Math.floor(Math.max(min - pad, 0));

    // Чотири підписи — цілі числа, тож діапазон має бути кратний трьом і не
    // вужчий за три: інакше підписи або повторюються (84,5 і 84,6 давали
    // «85 85 84 84»), або стоять нерівно («74 72 71 69»).
    const span = top - bottom;
    const widen = Math.max(3 - span, (3 - (span % 3)) % 3);
    if (widen > 0) {
        const below = Math.min(Math.floor(widen / 2), bottom);
        bottom -= below;
        top += widen - below;
    }

    const step = (top - bottom) / 3;

    return [0, 1, 2, 3].map(index => Math.round(top - step * index));
};

/** Same, but as the strings the bar charts print («2000», «1500», …). */
export const buildBarAxis = (max: number, format: (value: number) => string): string[] => [
    format(max),
    format(Math.round((max / 3) * 2)),
    format(Math.round(max / 3)),
    '0',
];

/**
 * The ceiling a bar chart scales to: the biggest of what happened and what
 * was aimed for, so a day that overshot still fits and the goal line stays
 * visible on a day nothing was logged.
 */
export const barChartMax = (values: number[], goal: number | null): number => {
    const peak = Math.max(...values, goal ?? 0, 1);
    return niceStep(peak / 3) * 3;
};

/**
 * Rounds a step up to 1, 2 or 5 times a power of ten.
 *
 * This is the rule the design's own axes follow — 3л/2л/1л/0 for water,
 * 15К/10К/5К/0 for steps: three equal steps of a round number, rather than
 * thirds of whatever the data happened to reach.
 */
function niceStep(rough: number): number {
    if (rough <= 0) return 1;
    const magnitude = 10 ** Math.floor(Math.log10(rough));
    const normalized = rough / magnitude;
    const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return nice * magnitude;
}

/** The last `days` points of a daily card, oldest first. */
export const recentPoints = (card: ProgressCard | undefined, days: number): ProgressPoint[] =>
    (card?.points ?? []).slice(-days);

/** Mean of the values, rounded; 0 when there is nothing to average. */
export const averageOf = (values: number[]): number =>
    values.length === 0 ? 0 : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
