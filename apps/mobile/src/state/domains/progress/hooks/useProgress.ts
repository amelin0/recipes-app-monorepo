import { useMutation, useQuery } from '@tanstack/react-query';

import { ProgressApi, type MeasurableMetric, type ProgressMetric, type RecordMeasurementPayload } from '@/data';
import { nutritionKeys, progressKeys, queryClient, Queries } from '@/shared/services';
import { useStore } from '@/state';

/** The window every chart on the overview covers. */
export const PROGRESS_DEFAULT_DAYS = 30;

/** Every card in one read — the overview draws all six from it. */
export const useGetProgressMetrics = (days = PROGRESS_DEFAULT_DAYS) => {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    return useQuery({
        queryKey: progressKeys.metrics(days),
        queryFn: () => ProgressApi.getMetrics(days),
        enabled: isAuthenticated,
        staleTime: 60_000,
    });
};

export const useGetProgressMetric = (metric: ProgressMetric, days = PROGRESS_DEFAULT_DAYS) => {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    return useQuery({
        queryKey: progressKeys.metric(metric, days),
        queryFn: () => ProgressApi.getMetric(metric, days),
        enabled: isAuthenticated,
        staleTime: 60_000,
    });
};

/**
 * A new reading changes every chart that shows it and the card that
 * summarises it, so both families are dropped rather than one key.
 */
const invalidateProgress = () => {
    queryClient.invalidateQueries({ queryKey: [Queries.ProgressMetrics] });
    queryClient.invalidateQueries({ queryKey: [Queries.ProgressMetric] });
};

interface RecordVariables extends RecordMeasurementPayload {
    metric: MeasurableMetric;
}

/** Weight, waist and height — the three the user measures by hand. */
export const useRecordMeasurement = () =>
    useMutation({
        mutationFn: ({ metric, ...payload }: RecordVariables) => ProgressApi.recordMeasurement(metric, payload),
        onSuccess: () => {
            invalidateProgress();
            // Вага — ще й ціль профілю: картка підписки на прогресі та поле
            // «цільова вага» в профілі читають одне й те саме.
            queryClient.invalidateQueries({ queryKey: nutritionKeys.goal() });
        },
    });

export const useDeleteMeasurement = () =>
    useMutation({
        mutationFn: ({ metric, id }: { metric: MeasurableMetric; id: string }) =>
            ProgressApi.deleteMeasurement(metric, id),
        onSuccess: invalidateProgress,
    });
