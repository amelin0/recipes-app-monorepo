/**
 * Stable machine-readable reasons for the progress domain.
 *
 * The range check is a code and not a bare 422 because the sheet's stepper is
 * built from the same limits: when the two drift, the client needs to be able
 * to tell «you typed something impossible» from «the request was malformed».
 */
export const ProgressErrorCode = {
    ValueOutOfRange: 'progress.value-out-of-range',
    MeasurementNotFound: 'progress.measurement-not-found',
    NotAMeasuredMetric: 'progress.not-a-measured-metric',
} as const;

export type ProgressErrorCode = (typeof ProgressErrorCode)[keyof typeof ProgressErrorCode];
