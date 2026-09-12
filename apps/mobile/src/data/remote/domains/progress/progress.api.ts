import { HttpService } from '@/shared/services';

import type {
    MeasurableMetric,
    Measurement,
    MetricDetail,
    ProgressCard,
    ProgressMetric,
    RecordMeasurementPayload,
} from './progress.types';

const ENDPOINTS = {
    metrics: '/progress/metrics',
    metric: (metric: ProgressMetric) => `/progress/metrics/${metric}`,
    measurements: (metric: MeasurableMetric) => `/progress/metrics/${metric}/measurements`,
    measurement: (metric: MeasurableMetric, id: string) => `/progress/metrics/${metric}/measurements/${id}`,
} as const;

export const ProgressApi = {
    /** Every card at once — the overview draws all six from this one read. */
    getMetrics: (days?: number) =>
        HttpService.get<ProgressCard[]>(ENDPOINTS.metrics, days ? { params: { days } } : undefined),

    getMetric: (metric: ProgressMetric, days?: number) =>
        HttpService.get<MetricDetail>(ENDPOINTS.metric(metric), days ? { params: { days } } : undefined),

    /** Only weight, waist and height are measured by hand. */
    recordMeasurement: (metric: MeasurableMetric, payload: RecordMeasurementPayload) =>
        HttpService.post<Measurement>(ENDPOINTS.measurements(metric), payload),

    deleteMeasurement: (metric: MeasurableMetric, id: string) =>
        HttpService.delete<void>(ENDPOINTS.measurement(metric, id)),
};
