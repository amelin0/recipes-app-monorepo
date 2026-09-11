import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { DAILY_TARGET_TOLERANCE, MEASUREMENT_LIMITS, WAIST_RECOMMENDED_MAX_CM } from '@dns/constants';
import {
    BodyMeasurementEntity,
    BodyMeasurementRepository,
    NutritionRepository,
    ProfileEntity,
    ProfileRepository,
} from '@dns/database';
import { BodyMetric, DailyOutcome, Gender, MetricKind, ProgressMetric } from '@dns/shared-types';
import { RecordMeasurementInput } from '@dns/validation';

import { ProgressErrorCode } from './progress.errors';

const DAY_MS = 86_400_000;

/** One point on a line chart — a reading and the day it was taken. */
export interface MeasurementPoint {
    id: string;
    date: string;
    value: number;
}

/** One bar on a daily chart, with the target it is measured against. */
export interface DailyPoint {
    date: string;
    value: number;
    target: number | null;
    outcome: DailyOutcome | null;
}

export interface OneOffCard {
    metric: ProgressMetric;
    kind: MetricKind.OneOff;
    unit: string;
    current: number | null;
    initial: number | null;
    goal: number | null;
    /** Upper bound of the healthy range, when one is published for this metric. */
    recommendedMax: number | null;
    points: MeasurementPoint[];
}

export interface DailyCard {
    metric: ProgressMetric;
    kind: MetricKind.Daily;
    unit: string;
    current: number | null;
    goal: number | null;
    points: DailyPoint[];
}

export type ProgressCard = OneOffCard | DailyCard;

export interface OneOffSummary {
    min: number;
    avg: number;
    max: number;
}

/** For a daily metric the question is not min/avg/max but how the days landed (FR-004). */
export interface DailyDistribution {
    under: number;
    onTarget: number;
    over: number;
    lowerBound: number | null;
    upperBound: number | null;
}

export interface MetricDetail {
    card: ProgressCard;
    summary: OneOffSummary | DailyDistribution | null;
    /** Distance to the goal, when the metric has one (metric-detail FR-003). */
    difference: number | null;
}

const UNITS: Record<ProgressMetric, string> = {
    [ProgressMetric.Weight]: 'kg',
    [ProgressMetric.Waist]: 'cm',
    [ProgressMetric.Height]: 'cm',
    [ProgressMetric.Water]: 'ml',
    [ProgressMetric.Steps]: 'steps',
    [ProgressMetric.Calories]: 'kcal',
    [ProgressMetric.Protein]: 'g',
    [ProgressMetric.Fats]: 'g',
    [ProgressMetric.Carbs]: 'g',
};

const BODY_METRICS: Record<BodyMetric, ProgressMetric> = {
    [BodyMetric.Weight]: ProgressMetric.Weight,
    [BodyMetric.Waist]: ProgressMetric.Waist,
    [BodyMetric.Height]: ProgressMetric.Height,
};

@Injectable()
export class ProgressService {
    constructor(
        private readonly measurements: BodyMeasurementRepository,
        private readonly nutrition: NutritionRepository,
        private readonly profiles: ProfileRepository,
    ) {}

    /** The six cards of the progress screen, in the order the design lists them. */
    async overview(userId: string, days: number): Promise<ProgressCard[]> {
        const profile = await this.profileOf(userId);

        const [weight, waist, height, water, steps, calories] = await Promise.all([
            this.oneOffCard(profile, BodyMetric.Weight, days),
            this.oneOffCard(profile, BodyMetric.Waist, days),
            this.oneOffCard(profile, BodyMetric.Height, days),
            this.dailyCard(profile, ProgressMetric.Water, days),
            this.dailyCard(profile, ProgressMetric.Steps, days),
            this.dailyCard(profile, ProgressMetric.Calories, days),
        ]);

        return [weight, calories, water, steps, waist, height];
    }

    async detail(userId: string, metric: ProgressMetric, days: number): Promise<MetricDetail> {
        const profile = await this.profileOf(userId);
        const bodyMetric = this.asBodyMetric(metric);

        const card = bodyMetric
            ? await this.oneOffCard(profile, bodyMetric, days)
            : await this.dailyCard(profile, metric, days);

        return {
            card,
            summary: card.kind === MetricKind.OneOff ? summarise(card.points) : distribution(card.points),
            difference: card.goal === null || card.current === null ? null : round(card.current - card.goal, 2),
        };
    }

    /**
     * Records a reading.
     *
     * A weight or height reading also moves the profile, because the calorie
     * recommendation is computed from it (metric-logging FR-006) — leaving the
     * two apart would mean the app offers a «new norm» derived from a weight
     * the user replaced weeks ago. The profile takes the **latest reading by
     * date**, not this one: a back-dated entry is history, not the current
     * weight. The repository does both writes in one transaction.
     */
    async record(userId: string, metric: BodyMetric, input: RecordMeasurementInput): Promise<BodyMeasurementEntity> {
        const limits = MEASUREMENT_LIMITS[metric];

        if (input.value < limits.min || input.value > limits.max) {
            throw new BadRequestException({
                message: `${metric} must be between ${limits.min} and ${limits.max}`,
                code: ProgressErrorCode.ValueOutOfRange,
            });
        }

        return this.measurements.record({
            userId,
            metric,
            value: input.value.toFixed(2),
            measuredOn: input.measuredOn ?? today(),
        });
    }

    async remove(userId: string, id: string): Promise<void> {
        const deleted = await this.measurements.delete(userId, id);

        if (!deleted) {
            throw new NotFoundException({
                message: 'No such measurement',
                code: ProgressErrorCode.MeasurementNotFound,
            });
        }
    }

    private async profileOf(userId: string): Promise<ProfileEntity> {
        const profile = await this.profiles.findByUserId(userId);
        if (!profile) throw new NotFoundException(`Profile not found for user ${userId}`);

        return profile;
    }

    private async oneOffCard(profile: ProfileEntity, metric: BodyMetric, days: number): Promise<OneOffCard> {
        const [records, latest, first] = await Promise.all([
            this.measurements.findSince(profile.userId, metric, since(days)),
            // Read outside the window too: a weight from two months ago is
            // still this person's weight, and the card must show a number.
            this.measurements.findLatest(profile.userId, metric),
            this.measurements.findFirst(profile.userId, metric),
        ]);

        return {
            metric: BODY_METRICS[metric],
            kind: MetricKind.OneOff,
            unit: UNITS[BODY_METRICS[metric]],
            current: latest?.value ?? null,
            initial: first?.value ?? null,
            goal: metric === BodyMetric.Weight ? profile.targetWeightKg : null,
            recommendedMax: metric === BodyMetric.Waist ? waistLimitFor(profile.gender) : null,
            points: records.map(record => ({ id: record.id, date: record.measuredOn, value: record.value })),
        };
    }

    private async dailyCard(profile: ProfileEntity, metric: ProgressMetric, days: number): Promise<DailyCard> {
        const goal = await this.nutrition.findGoal(profile.userId);
        const target = goal ? dailyTargetFor(metric, goal) : null;

        // One read per day rather than a single grouped one: the window is at
        // most a year, the index covers it, and the alternative is a hand-rolled
        // date series in SQL that has to reproduce the gap-filling this does for
        // free — a day with no entries must still render as a zero bar.
        const dates = lastDays(days);
        const values = await (metric === ProgressMetric.Steps
            ? this.stepsByDate(profile.userId, dates)
            : this.totalsByDate(profile.userId, dates, metric));

        const points: DailyPoint[] = dates.map((date, index) => {
            const value = values[index] ?? 0;
            return { date, value, target, outcome: outcomeFor(value, target) };
        });

        return {
            metric,
            kind: MetricKind.Daily,
            unit: UNITS[metric],
            current: points.at(-1)?.value ?? null,
            goal: target,
            points,
        };
    }

    private async stepsByDate(userId: string, dates: string[]): Promise<number[]> {
        const rows = await Promise.all(dates.map(date => this.nutrition.findSteps(userId, date)));
        return rows.map(row => row?.steps ?? 0);
    }

    private async totalsByDate(userId: string, dates: string[], metric: ProgressMetric): Promise<number[]> {
        const totals = await Promise.all(dates.map(date => this.nutrition.findDailyTotals(userId, date)));
        return totals.map(day => valueFor(metric, day));
    }

    private asBodyMetric(metric: ProgressMetric): BodyMetric | null {
        const match = Object.entries(BODY_METRICS).find(([, progress]) => progress === metric);
        return match ? (match[0] as BodyMetric) : null;
    }
}

type Totals = Awaited<ReturnType<NutritionRepository['findDailyTotals']>>;

function valueFor(metric: ProgressMetric, totals: Totals): number {
    switch (metric) {
        case ProgressMetric.Water:
            return totals.waterMl;
        case ProgressMetric.Protein:
            return totals.proteinG;
        case ProgressMetric.Fats:
            return totals.fatsG;
        case ProgressMetric.Carbs:
            return totals.carbsG;
        default:
            return totals.calories;
    }
}

type Goal = NonNullable<Awaited<ReturnType<NutritionRepository['findGoal']>>>;

function dailyTargetFor(metric: ProgressMetric, goal: Goal): number | null {
    switch (metric) {
        case ProgressMetric.Water:
            return goal.dailyWaterMl;
        case ProgressMetric.Steps:
            return goal.dailyStepsTarget;
        case ProgressMetric.Protein:
            return goal.dailyProteinG;
        case ProgressMetric.Fats:
            return goal.dailyFatsG;
        case ProgressMetric.Carbs:
            return goal.dailyCarbsG;
        case ProgressMetric.Calories:
            return goal.dailyCalories;
        default:
            return null;
    }
}

/** Which of the three states a day landed in — what colours the bar. */
function outcomeFor(value: number, target: number | null): DailyOutcome | null {
    if (target === null) return null;

    const tolerance = target * DAILY_TARGET_TOLERANCE;
    if (value < target - tolerance) return DailyOutcome.Under;
    if (value > target + tolerance) return DailyOutcome.Over;

    return DailyOutcome.OnTarget;
}

function summarise(points: MeasurementPoint[]): OneOffSummary | null {
    if (points.length === 0) return null;

    const values = points.map(point => point.value);

    return {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: round(values.reduce((sum, value) => sum + value, 0) / values.length, 2),
    };
}

function distribution(points: DailyPoint[]): DailyDistribution | null {
    const target = points.find(point => point.target !== null)?.target ?? null;
    if (target === null) return null;

    const tolerance = target * DAILY_TARGET_TOLERANCE;

    return {
        under: points.filter(point => point.outcome === DailyOutcome.Under).length,
        onTarget: points.filter(point => point.outcome === DailyOutcome.OnTarget).length,
        over: points.filter(point => point.outcome === DailyOutcome.Over).length,
        lowerBound: round(target - tolerance, 0),
        upperBound: round(target + tolerance, 0),
    };
}

function waistLimitFor(gender: Gender | null): number | null {
    if (!gender) return null;
    return gender === Gender.Male ? WAIST_RECOMMENDED_MAX_CM.male : WAIST_RECOMMENDED_MAX_CM.female;
}

const round = (value: number, decimals: number): number => {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
};

const today = (): string => new Date().toISOString().slice(0, 10);

const since = (days: number): string => new Date(Date.now() - (days - 1) * DAY_MS).toISOString().slice(0, 10);

/** Oldest first, so a chart reads left to right. */
const lastDays = (days: number): string[] =>
    Array.from({ length: days }, (_, index) =>
        new Date(Date.now() - (days - 1 - index) * DAY_MS).toISOString().slice(0, 10),
    );
