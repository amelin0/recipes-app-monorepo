/**
 * Measurements the user takes now and then, each a row in its own history
 * (progress metric-logging FR-001).
 */
export enum BodyMetric {
    Weight = 'weight',
    Waist = 'waist',
    Height = 'height',
}

/**
 * Everything the progress screen puts on a card. Three of them —
 * calories, water, steps — are not measured at all: they are what the
 * nutrition domain already adds up per day, read here rather than stored
 * again.
 */
export enum ProgressMetric {
    Weight = 'weight',
    Waist = 'waist',
    Height = 'height',
    Water = 'water',
    Steps = 'steps',
    Calories = 'calories',
    Protein = 'protein',
    Fats = 'fats',
    Carbs = 'carbs',
}

/**
 * How a metric behaves, which decides both the chart and where the numbers
 * come from.
 *
 * `one-off` — taken occasionally, drawn as a line, lives in `body_measurements`.
 * `daily` — accumulated every day, drawn as bars, summed from the nutrition logs.
 */
export enum MetricKind {
    OneOff = 'one-off',
    Daily = 'daily',
}

/** Where a day landed against its target — what colours the bar (overview FR-006). */
export enum DailyOutcome {
    Under = 'under',
    OnTarget = 'on-target',
    Over = 'over',
}
