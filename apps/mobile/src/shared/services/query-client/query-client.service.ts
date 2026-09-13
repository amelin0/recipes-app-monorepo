import { AppState, Platform } from 'react-native';

import { QueryClient } from '@tanstack/react-query';

import { Queries } from './queries';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error: unknown) => {
                // 4xx не повторюємо: логін throttled на 10 спроб / 15 хв, тож
                // один друкарський огріх коштував би трьох. Повторюємо лише
                // мережеві збої і 5xx.
                const status = (error as { statusCode?: number } | undefined)?.statusCode;
                if (typeof status === 'number' && status < 500) return false;
                return failureCount < 2;
            },
        },
    },
});

// Queries that should refetch when the app returns to the foreground.
// Populate as domain hooks are added (e.g. Queries.Me, Queries.Recipes).
const APP_FOCUS_QUERIES: Queries[] = [];

if (Platform.OS !== 'web') {
    let appState = AppState.currentState;

    AppState.addEventListener('change', nextState => {
        if (appState.match(/inactive|background/) && nextState === 'active') {
            APP_FOCUS_QUERIES.forEach(key => {
                queryClient.invalidateQueries({ queryKey: [key] });
            });
        }
        appState = nextState;
    });
}

const invalidateQueries = (...queryKeys: Queries[]) => {
    queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
    });
};

export { queryClient, invalidateQueries };
