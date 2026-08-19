import { useCallback, useState } from 'react';

import { FAQ_CATEGORIES } from '../faq.constants';

export const useFaqScreen = () => {
    // Sections open independently — the design shows several open at once.
    const [expanded, setExpanded] = useState<string[]>([]);

    const toggle = useCallback((key: string) => {
        setExpanded(prev => (prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key]));
    }, []);

    const isExpanded = useCallback((key: string) => expanded.includes(key), [expanded]);

    return { categories: FAQ_CATEGORIES, isExpanded, toggle };
};
