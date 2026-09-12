/** Everything the progress tab can chart. */
export type ProgressMetric =
    | 'weight'
    | 'waist'
    | 'height'
    | 'water'
    | 'steps'
    | 'calories'
    | 'protein'
    | 'fats'
    | 'carbs';

/** The three the user measures by hand; the rest are derived from the day. */
export type MeasurableMetric = 'weight' | 'waist' | 'height';

/**
 * `one-off` metrics are readings taken now and then (weight, waist, height);
 * `daily` ones are what a day added up to. It decides both the chart shape
 * and which point fields are filled.
 */
export type MetricKind = 'one-off' | 'daily';

export type MetricOutcome = 'under' | 'on-target' | 'over';

export interface ProgressPoint {
    /** Present only on a measured point — what a delete targets. */
    id: string | null;
    /** `YYYY-MM-DD`. */
    date: string;
    value: number;
    /** The daily goal in force; null on a metric with no target. */
    target: number | null;
    outcome: MetricOutcome | null;
}

export interface ProgressCard {
    metric: ProgressMetric;
    kind: MetricKind;
    /** «kg», «cm», «ml», «kcal», «g», «steps». */
    unit: string;
    /** The latest reading, however old — null when there has never been one. */
    current: number | null;
    /** The first reading ever taken; null on a daily metric. */
    initial: number | null;
    /** Target weight, or the daily goal for a daily metric. */
    goal: number | null;
    /** Where a health guideline puts a ceiling — waist only, by sex. */
    recommendedMax: number | null;
    points: ProgressPoint[];
}

export interface ProgressSummary {
    min: number | null;
    avg: number | null;
    max: number | null;
    /** Days below the target band. */
    daysUnder: number | null;
    daysOnTarget: number | null;
    daysOver: number | null;
    /** Edges of the band that counts as on target. */
    lowerBound: number | null;
    upperBound: number | null;
}

export interface MetricDetail {
    card: ProgressCard;
    /** Null while the period holds nothing to summarise. */
    summary: ProgressSummary | null;
    /** Current minus goal — negative means still to go on a metric being reduced. */
    difference: number | null;
}

export interface Measurement {
    id: string;
    metric: ProgressMetric;
    value: number;
    /** `YYYY-MM-DD`. */
    measuredOn: string;
}

export interface RecordMeasurementPayload {
    value: number;
    /** Defaults to today server-side when omitted. */
    measuredOn?: string;
}
