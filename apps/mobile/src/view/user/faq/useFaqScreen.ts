import { useCallback, useState } from 'react';

import { useGetFaq } from '@/state/domains/faq';

export const useFaqScreen = () => {
    const { data, isLoading, isError, refetch } = useGetFaq();

    // Sections open independently — the design shows several open at once.
    const [expanded, setExpanded] = useState<string[]>([]);

    const toggle = useCallback((key: string) => {
        setExpanded(prev => (prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key]));
    }, []);

    const isExpanded = useCallback((key: string) => expanded.includes(key), [expanded]);

    const topics = data ?? [];

    return {
        topics,
        isLoading,
        isError,
        isEmpty: !isLoading && !isError && topics.length === 0,
        handleRetry: refetch,
        isExpanded,
        toggle,
    };
};
