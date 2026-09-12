import { useQuery } from '@tanstack/react-query';

import { FaqApi } from '@/data';
import { faqKeys } from '@/shared/services';
import { useStore } from '@/state';

/**
 * The whole topic tree in one read. Editorial content that changes rarely, so
 * it stays fresh for the session rather than refetching every time the screen
 * opens.
 */
export const useGetFaq = () => {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    return useQuery({
        queryKey: faqKeys.topics(),
        queryFn: () => FaqApi.getTopics(),
        enabled: isAuthenticated,
        staleTime: 30 * 60_000,
    });
};
