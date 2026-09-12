import { useQuery } from '@tanstack/react-query';

import { UserApi } from '@/data';
import { userKeys } from '@/shared/services';
import { useStore } from '@/state';

/** The five reminder rows — four meals plus the weigh-in cadence. */
export const useGetReminders = () => {
    const isAuthenticated = useStore(state => state.isAuthenticated);

    return useQuery({
        queryKey: userKeys.reminders(),
        queryFn: () => UserApi.getReminders(),
        enabled: isAuthenticated,
        staleTime: 60_000,
    });
};
