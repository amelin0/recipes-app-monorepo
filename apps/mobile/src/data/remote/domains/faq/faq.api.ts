import { HttpService } from '@/shared/services';

import type { FaqTopic } from './faq.types';

const ENDPOINTS = {
    topics: '/faq',
} as const;

export const FaqApi = {
    /** Whole tree in one read — the screen has no per-topic route to lazy-load from. */
    getTopics: () => HttpService.get<FaqTopic[]>(ENDPOINTS.topics),
};
