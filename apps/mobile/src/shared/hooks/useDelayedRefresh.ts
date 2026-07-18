import { useCallback, useRef, useState } from 'react';

import { Haptics } from '@/shared/utils';

/** Minimum duration the spinner stays visible after the user pulls. */
const DEFAULT_MIN_DURATION_MS = 1200;

export interface UseDelayedRefreshOptions {
    /**
     * Floor on how long the spinner is visible (ms). Even when the
     * underlying refetch resolves earlier (cached data, fast network),
     * the indicator is held for at least this long so the user gets
     * unmistakable feedback for their pull. @default 1200
     */
    minDurationMs?: number;
    /** Fire light haptic on refresh trigger. @default true */
    haptics?: boolean;
}

/**
 * Pull-to-refresh state with a guaranteed-minimum spinner duration and
 * an optional light haptic on trigger.
 *
 * Wraps any async refetch (TanStack Query, fetch helper, etc.):
 *
 *   const { isRefreshing, onRefresh } = useDelayedRefresh(query.refetch);
 *
 *   <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
 *
 * The flag is **decoupled** from the underlying query's `isFetching` —
 * it's true only while a user-initiated refresh is in flight (plus the
 * floor delay), never during background refetches on mount or focus.
 */
export function useDelayedRefresh(refetch: () => Promise<unknown>, options: UseDelayedRefreshOptions = {}) {
    const { minDurationMs = DEFAULT_MIN_DURATION_MS, haptics = true } = options;

    const [isRefreshing, setIsRefreshing] = useState(false);
    const isMountedRef = useRef(true);

    const onRefresh = useCallback(async () => {
        if (haptics) {
            void Haptics.light();
        }
        setIsRefreshing(true);
        const startedAt = Date.now();

        try {
            await refetch();
        } finally {
            const elapsed = Date.now() - startedAt;
            const remaining = Math.max(0, minDurationMs - elapsed);
            if (remaining > 0) {
                await new Promise<void>(resolve => setTimeout(resolve, remaining));
            }
            if (isMountedRef.current) {
                setIsRefreshing(false);
            }
        }
    }, [refetch, minDurationMs, haptics]);

    return { isRefreshing, onRefresh };
}
